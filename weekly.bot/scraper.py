import time

import feedparser

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
        heders = {}
        if state.get("etag"):
            heders["If-None-Match"] = state["etag"]
        if state.get("last_modified"):
            heders["If-Modified-Since"] = state["last_modified"]

        try:
            resp = polite_get(feed_url, headers=heders)
        except Exception as e:
            result.error = str(e)
            return result

        if resp.status_code == 304:
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
            link = getattr(entry, "published", None)
            published = getattr(entry, "published", None)

            artist_guess, track_guess = guess_artist_and_track(raw_title)

            inserted = insert_candidate(
                conn,
                source = name,
                guid = guid,
                link = link,
                raw_tittle = raw_title,
                artist_guess = artist_guess,
                track_guess = track_guess,
                published = published,
            )

            if inserted:
                result.new_candidates += 1