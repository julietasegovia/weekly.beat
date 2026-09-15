import time

from config import (
    DISCOVER_URL,
    REQUEST_DELAY_SECONDS,
    RESULTS_PER_TAG,
    SLICE,
    TAGS,
)
from db import get_conn, insert_candidate, set_feed_state
from extract import from_discover_result
from robots_check import is_allowed, polite_post


class ScrapeResult:
    def __init__(self, source: str):
        self.source = source
        self.fetched = False
        self.skipped_robots = False
        self.entries_seen = 0
        self.new_candidates = 0
        self.error = None


def _discover_payload(tag: str | None, size: int) -> dict:
    tags = [tag] if tag else []
    return {
        "category_id": 0,
        "cursor": "*",
        "geoname_id": 0,
        "include_result_types": ["a", "s"],
        "size": size,
        "slice": SLICE,
        "tag_norm_names": tags,
        "time_facet_id": None,
    }


def scrape_tag(tag: str | None = None, size: int | None = None) -> ScrapeResult:
    """Fetch one Discover page for a tag (or the unfiltered feed if tag is None)."""
    source = f"bandcamp:{tag}" if tag else "bandcamp"
    result = ScrapeResult(source)
    size = size if size is not None else RESULTS_PER_TAG

    if not is_allowed(DISCOVER_URL):
        result.skipped_robots = True
        return result

    try:
        resp = polite_post(DISCOVER_URL, json=_discover_payload(tag, size))
    except Exception as e:
        result.error = str(e)
        return result

    if resp.status_code != 200:
        result.error = f"HTTP {resp.status_code}"
        return result

    result.fetched = True
    try:
        data = resp.json()
    except ValueError as e:
        result.error = f"invalid JSON: {e}"
        return result

    items = data.get("results") or []

    with get_conn() as conn:
        for item in items:
            result.entries_seen += 1
            guid, link, raw_title, artist, track, published = from_discover_result(item)
            if not guid:
                continue

            inserted = insert_candidate(
                conn,
                source=source,
                guid=str(guid),
                link=link,
                raw_title=raw_title,
                artist_guess=artist,
                track_guess=track,
                published=published,
            )
            if inserted:
                result.new_candidates += 1

        set_feed_state(conn, source, etag=None, last_modified=None)

    return result


def scrape_all(tags: list | None = None) -> list:
    tags = TAGS if tags is None else tags
    to_scrape = tags if tags else [None]

    results = []
    for i, tag in enumerate(to_scrape):
        results.append(scrape_tag(tag))
        if i < len(to_scrape) - 1:
            time.sleep(REQUEST_DELAY_SECONDS)
    return results
