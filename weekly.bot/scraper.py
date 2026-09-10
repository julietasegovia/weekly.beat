import time

import feedparser

from config import MAX_ENTRIES_PER_FEED, REQUEST_DELAY_SECONDS
from db import get_conn, get_feed_state, insert_candidate, set_feed_state
from extract import guess_artist_track
from robots_check import is_allowed, polite_get


class ScrapeResult:
    def __init__(self, source):
        self.source = source
        self.fetched = False
        self.skipped_robots = False
        self.entries_seen = 0
        self.new_candidates = 0
        self.error = None


def scrape_source(source_cfg: dict) -> ScrapeResult:
    name = source_cfg["name"]
    feed_url = source_cfg["feed_url"]
    result = ScrapeResult(name)

    if not is_allowed(feed_url):
        result.skipped_robots = True
        return result

    with get_conn() as conn:
        state = get_feed_state(conn, name)
        headers = {}
        if state.get("etag"):
            headers["If-None-Match"] = state["etag"]
        if state.get("last_modified"):
            headers["If-Modified-Since"] = state["last_modified"]

        try:
            resp = polite_get(feed_url, headers=headers)
        except Exception as e:  # network errors, timeouts, etc.
            result.error = str(e)
            return result

        if resp.status_code == 304:
            # Nothing new since last run.
            result.fetched = True
            return result

        if resp.status_code != 200:
            result.error = f"HTTP {resp.status_code}"
            return result

        result.fetched = True
        parsed = feedparser.parse(resp.content)

        for entry in parsed.entries[:MAX_ENTRIES_PER_FEED]:
            result.entries_seen += 1
            raw_title = getattr(entry, "title", "").strip()
            guid = getattr(entry, "id", None) or getattr(entry, "link", None) or raw_title
            link = getattr(entry, "link", None)
            published = getattr(entry, "published", None)

            artist_guess, track_guess = guess_artist_track(raw_title)

            inserted = insert_candidate(
                conn,
                source=name,
                guid=guid,
                link=link,
                raw_title=raw_title,
                artist_guess=artist_guess,
                track_guess=track_guess,
                published=published,
            )
            if inserted:
                result.new_candidates += 1

        set_feed_state(
            conn,
            name,
            etag=resp.headers.get("ETag"),
            last_modified=resp.headers.get("Last-Modified"),
        )

    return result


def scrape_all(sources: list) -> list:
    results = []
    for i, source_cfg in enumerate(sources):
        results.append(scrape_source(source_cfg))
        if i < len(sources) - 1:
            time.sleep(REQUEST_DELAY_SECONDS)
    return results
