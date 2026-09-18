import json
import os
import re
import time
from urllib.parse import urlparse

import requests

from config import (
    FETCH_RELEASE_TAGS,
    MAX_CLASSIFY_ATTEMPTS,
    MUSICBRAINZ_DELAY_SECONDS,
    MUSICBRAINZ_URL,
    REQUEST_TIMEOUT_SECONDS,
    TAG_FETCH_DELAY_SECONDS,
    USE_ARTIST_FALLBACK,
    USE_MUSICBRAINZ,
    USER_AGENT,
)
from db import (
    bump_attempts,
    get_conn,
    known_tags_by_host,
    rows_to_classify,
    save_genre,
    save_tags,
)
from robots_check import is_allowed, polite_get
from taxonomy import best_genre

_page_tag_cache: dict[str, list[str]] = {}
_host_tag_cache: dict[str, list[str]] = {}
_mb_cache: dict[str, list[str]] = {}

_LD_KEYWORDS = re.compile(r'"keywords"\s*:\s*\[(.*?)\]', re.S)
_TAG_ANCHOR = re.compile(r'<a[^>]+class="[^"]*\btag\b[^"]*"[^>]*>(.*?)</a>', re.S | re.I)
_HTML_TAG = re.compile(r"<[^>]+>")

class ClassifyStats:
    def __init__(self):
        self.seen = 0
        self.from_tags = 0
        self.from_artist = 0
        self.from_musicbrainz = 0
        self.unresolved = 0
        self.pages_fetched = 0
        self.errors: list[str] = []

    def __str__(self):
        parts = [
            f"{self.seen} candidates",
            f"{self.from_tags} from release tags",
            f"{self.from_artist} from other releases by the same artist",
        ]
        if self.from_musicbrainz:
            parts.append(f"{self.from_musicbrainz} from MusicBrainz")
        parts.append(f"{self.unresolved} still unclassified")
        return " | ".join(parts) + f" | {self.pages_fetched} pages fetched"

def _clean_tags(tags) -> list[str]:
    seen, out = set(), []
    for tag in tags or []:
        t = " ".join(str(tag).split()).strip().lower()
        if t and t not in seen and len(t) < 48:
            seen.add(t)
            out.append(t)
    return out

def _host(url: str | None) -> str | None:
    if not url:
        return None
    netloc = urlparse(url).netloc.lower()
    return netloc or None

def fetch_release_tags(url: str | None) -> list[str]:
    if not url:
        return []
    if url in _page_tag_cache:
        return _page_tag_cache[url]
    if not is_allowed(url):
        _page_tag_cache[url] = []
        return []

    try:
        resp = polite_get(url, headers={"accept": "text/html"})
        html = resp.text if resp.status_code == 200 else ""
    except Exception:
        html = ""

    tags: list[str] = []
    match = _LD_KEYWORDS.search(html)
    if match:
        try:
            tags = [t for t in json.loads("[" + match.group(1) + "]") if isinstance(t, str)]
        except ValueError:
            tags = []
    if not tags:
        tags = [_HTML_TAG.sub("", m) for m in _TAG_ANCHOR.findall(html)]

    tags = _clean_tags(tags)
    _page_tag_cache[url] = tags
    return tags


def musicbrainz_tags(artist: str | None) -> list[str]:
    """Genre/tag names MusicBrainz has for an artist. Empty on any doubt."""
    if not artist:
        return []
    key = artist.strip().lower()
    if key in _mb_cache:
        return _mb_cache[key]

    tags: list[str] = []
    try:
        time.sleep(MUSICBRAINZ_DELAY_SECONDS)
        resp = requests.get(
            MUSICBRAINZ_URL,
            params={"query": f'artist:"{artist}"', "fmt": "json", "limit": 1},
            headers={"User-Agent": USER_AGENT, "Accept": "application/json"},
            timeout=REQUEST_TIMEOUT_SECONDS,
        )
        if resp.status_code == 200:
            hits = resp.json().get("artists") or []
            if hits:
                hit = hits[0]
                # Only trust a confident, exact-ish name match.
                if hit.get("score", 0) >= 90 and (
                    hit.get("name", "").strip().lower() == key
                ):
                    tags = [
                        t.get("name")
                        for t in (hit.get("tags") or [])
                        if t.get("name") and t.get("count", 0) >= 1
                    ]
    except Exception:
        tags = []

    tags = _clean_tags(tags)
    _mb_cache[key] = tags
    return tags


def classify(
    limit=None,
    reclassify=False,
    fetch_tags=None,
    artist_fallback=None,
    musicbrainz=None,
    verbose=True,
):
    fetch_tags = FETCH_RELEASE_TAGS if fetch_tags is None else fetch_tags
    artist_fallback = USE_ARTIST_FALLBACK if artist_fallback is None else artist_fallback
    musicbrainz = USE_MUSICBRAINZ if musicbrainz is None else musicbrainz
    stats = ClassifyStats()

    with get_conn() as conn:
        rows = rows_to_classify(
            conn,
            limit=limit,
            reclassify=reclassify,
            max_attempts=MAX_CLASSIFY_ATTEMPTS,
        )
        stats.seen = len(rows)
        _host_tag_cache.update(known_tags_by_host(conn))

        for row in rows:
            tags = json.loads(row["tags"]) if row["tags"] else []
            host = _host(row["link"])

            genre, confidence = best_genre(tags)
            if not genre and fetch_tags and row["link"]:
                if stats.pages_fetched:
                    time.sleep(TAG_FETCH_DELAY_SECONDS)
                fetched = fetch_release_tags(row["link"])
                stats.pages_fetched += 1
                if fetched:
                    tags = fetched
                    save_tags(conn, row["id"], tags)
                    if host:
                        _host_tag_cache.setdefault(host, []).extend(tags)
                genre, confidence = best_genre(tags)

            if genre:
                save_genre(conn, row["id"], genre, "bandcamp-tag", confidence)
                stats.from_tags += 1
                if verbose:
                    print(f"  [tag] {row['raw_title'][:58]} -> {genre} ({confidence})")
                continue

            if artist_fallback and host and _host_tag_cache.get(host):
                sibling, sibling_conf = best_genre(_host_tag_cache[host])
                if sibling:
                    confidence = round(sibling_conf * 0.75, 2)
                    save_genre(conn, row["id"], sibling, "artist-tag", confidence)
                    stats.from_artist += 1
                    if verbose:
                        print(f"  [artist] {row['raw_title'][:56]} -> {sibling} ({confidence})")
                    continue

            if musicbrainz:
                mb = musicbrainz_tags(row["artist_guess"])
                genre, mb_conf = best_genre(mb)
                if genre:
                    confidence = round(mb_conf * 0.8, 2)
                    save_genre(conn, row["id"], genre, "musicbrainz", confidence)
                    stats.from_musicbrainz += 1
                    if verbose:
                        print(f"  [mb] {row['raw_title'][:60]} -> {genre} ({confidence})")
                    continue

            bump_attempts(conn, row["id"])
            stats.unresolved += 1

    return stats
