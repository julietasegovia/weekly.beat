import json
import sqlite3
from contextlib import contextmanager
from datetime import datetime, timezone
from urllib.parse import urlparse

from config import DB_PATH

SCHEMA = """
CREATE TABLE IF NOT EXISTS candidates (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    source TEXT NOT NULL,
    guid TEXT NOT NULL,
    link TEXT,
    raw_title TEXT NOT NULL,
    artist_guess TEXT,
    track_guess TEXT,
    published TEXT,
    status TEXT NOT NULL DEFAULT 'new', -- new | matched | rejected
    scraped_at TEXT NOT NULL,
    genre TEXT,                         -- specific genre, e.g. 'dungeon synth'
    genre_source TEXT,                  -- bandcamp-tag | artist-tag | musicbrainz | discover-tag
    genre_confidence REAL,              -- 0.0 - 1.0
    tags TEXT,                          -- JSON array of raw Bandcamp tags
    classified_at TEXT,
    classify_attempts INTEGER NOT NULL DEFAULT 0,
    UNIQUE(source, guid)
);

CREATE TABLE IF NOT EXISTS feed_state (
    source TEXT PRIMARY KEY,
    etag TEXT,
    last_modified TEXT,
    last_run_at TEXT
);
"""
_MIGRATIONS = [
    ("genre", "ALTER TABLE candidates ADD COLUMN genre TEXT"),
    ("genre_source", "ALTER TABLE candidates ADD COLUMN genre_source TEXT"),
    ("genre_confidence", "ALTER TABLE candidates ADD COLUMN genre_confidence REAL"),
    ("tags", "ALTER TABLE candidates ADD COLUMN tags TEXT"),
    ("classified_at", "ALTER TABLE candidates ADD COLUMN classified_at TEXT"),
    ("classify_attempts",
     "ALTER TABLE candidates ADD COLUMN classify_attempts INTEGER NOT NULL DEFAULT 0"),
]


@contextmanager
def get_conn():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    try:
        yield conn
        conn.commit()
    finally:
        conn.close()


def migrate(conn):
    """Add any missing columns to an existing candidates table. Idempotent."""
    existing = {row["name"] for row in conn.execute("PRAGMA table_info(candidates)")}
    added = []
    for column, ddl in _MIGRATIONS:
        if column not in existing:
            conn.execute(ddl)
            added.append(column)
    conn.execute("CREATE INDEX IF NOT EXISTS idx_candidates_genre ON candidates(genre)")
    conn.execute("CREATE INDEX IF NOT EXISTS idx_candidates_status ON candidates(status)")
    return added


def init_db():
    with get_conn() as conn:
        conn.executescript(SCHEMA)
        return migrate(conn)


def insert_candidate(
    conn,
    source,
    guid,
    link,
    raw_title,
    artist_guess,
    track_guess,
    published,
    tags=None,
    genre=None,
    genre_source=None,
    genre_confidence=None,
):
    """Insert a candidate; silently skip if (source, guid) already exists.
    Returns True if a new row was inserted, False if it was a duplicate."""
    try:
        conn.execute(
            """
            INSERT INTO candidates
                (source, guid, link, raw_title, artist_guess, track_guess, published,
                 scraped_at, tags, genre, genre_source, genre_confidence, classified_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                source,
                guid,
                link,
                raw_title,
                artist_guess,
                track_guess,
                published,
                datetime.now(timezone.utc).isoformat(),
                json.dumps(tags) if tags else None,
                genre,
                genre_source,
                genre_confidence,
                datetime.now(timezone.utc).isoformat() if genre else None,
            ),
        )
        return True
    except sqlite3.IntegrityError:
        return False


def get_feed_state(conn, source):
    row = conn.execute(
        "SELECT etag, last_modified FROM feed_state WHERE source = ?", (source,)
    ).fetchone()
    if row:
        return dict(row)
    return {"etag": None, "last_modified": None}


def set_feed_state(conn, source, etag, last_modified):
    conn.execute(
        """
        INSERT INTO feed_state (source, etag, last_modified, last_run_at)
        VALUES (?, ?, ?, ?)
        ON CONFLICT(source) DO UPDATE SET
            etag = excluded.etag,
            last_modified = excluded.last_modified,
            last_run_at = excluded.last_run_at
        """,
        (source, etag, last_modified, datetime.now(timezone.utc).isoformat()),
    )


def count_new(conn):
    return conn.execute("SELECT COUNT(*) FROM candidates WHERE status = 'new'").fetchone()[0]

def rows_to_classify(conn, limit=None, reclassify=False, max_attempts=2):
    sql = "SELECT * FROM candidates"
    params = []
    if not reclassify:
        sql += " WHERE genre IS NULL AND classify_attempts < ?"
        params.append(max_attempts)
    sql += " ORDER BY id"
    if limit:
        sql += " LIMIT ?"
        params.append(int(limit))
    return conn.execute(sql, params).fetchall()


def save_tags(conn, row_id, tags):
    conn.execute(
        "UPDATE candidates SET tags = ? WHERE id = ?",
        (json.dumps(tags) if tags else None, row_id),
    )


def bump_attempts(conn, row_id):
    conn.execute(
        "UPDATE candidates SET classify_attempts = classify_attempts + 1 WHERE id = ?",
        (row_id,),
    )


def known_tags_by_host(conn):
    """Tags already scraped, grouped by Bandcamp subdomain (i.e. by artist).

    Lets a release with no tags of its own borrow from the artist's other
    releases instead of being left blank.
    """
    out = {}
    rows = conn.execute(
        "SELECT link, tags FROM candidates WHERE tags IS NOT NULL AND link IS NOT NULL"
    ).fetchall()
    for row in rows:
        host = urlparse(row["link"]).netloc.lower()
        if not host:
            continue
        try:
            tags = json.loads(row["tags"])
        except (TypeError, ValueError):
            continue
        out.setdefault(host, []).extend(t for t in tags if isinstance(t, str))
    return out


def save_genre(conn, row_id, genre, genre_source, confidence):
    conn.execute(
        """UPDATE candidates
           SET genre = ?, genre_source = ?, genre_confidence = ?, classified_at = ?
           WHERE id = ?""",
        (genre, genre_source, confidence, datetime.now(timezone.utc).isoformat(), row_id),
    )


def count_unclassified(conn):
    return conn.execute("SELECT COUNT(*) FROM candidates WHERE genre IS NULL").fetchone()[0]


def genre_breakdown(conn, min_count=1):
    return conn.execute(
        """SELECT COALESCE(genre, '(unclassified)') AS genre,
                  COUNT(*) AS n,
                  ROUND(AVG(genre_confidence), 2) AS avg_conf
           FROM candidates
           GROUP BY 1
           HAVING n >= ?
           ORDER BY n DESC, genre""",
        (min_count,),
    ).fetchall()
