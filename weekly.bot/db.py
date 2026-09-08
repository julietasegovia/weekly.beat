import sqlite3
from contextlib import contextmanager
from datetime import datetime, timezone

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
    UNIQUE(source, guid)
    );

CREATE TABLE IF NOT EXISTS feed_state (
    source TEXT PRIMARY KEY,
    etag TEXT,
    last_modified TEXT,
    last_run_at TEXT
);
"""

@contextmanager
def get_conn():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    try:
        yield conn
        conn.commit()
    finally:
        conn.close()


def init_db():
    with get_conn() as conn:
        conn.executescript(SCHEMA)


def insert_candidate(conn, source, guid, link, raw_title, artist_guess, track_guess, published):
    """Insert a candidate; silently skip if (source, guid) already exists.
    Returns True if a new row was inserted, False if it was a duplicate."""
    try:
        conn.execute(
            """
            INSERT INTO candidates
                (source, guid, link, raw_title, artist_guess, track_guess, published, scraped_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
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
            ),
        )
        return True
    except sqlite3.IntegrityError:
        return False  # already have this one


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
