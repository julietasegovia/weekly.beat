"""Parse Bandcamp Discover API results into artist / track candidates."""

from urllib.parse import urlparse, urlunparse


def _clean_url(url: str | None) -> str | None:
    if not url:
        return None
    parsed = urlparse(url)
    return urlunparse((parsed.scheme, parsed.netloc, parsed.path, "", "", ""))


def from_discover_result(item: dict):
    """
    Return (guid, link, raw_title, artist, track, published) for a Discover hit.

    Prefer the featured track (what Discover highlights) so candidates are
    track-level, which matches better against Spotify listening history.
    """
    item_type = item.get("item_type") or item.get("result_type") or "a"
    item_id = item.get("item_id")
    featured = item.get("featured_track") or {}

    artist = (
        featured.get("band_name")
        or item.get("album_artist")
        or item.get("band_name")
        or ""
    ).strip()

    if featured.get("title"):
        track = featured["title"].strip()
        guid = f"t:{featured.get('id') or item_id}"
    else:
        track = (item.get("title") or "").strip()
        guid = f"{item_type}:{item_id}"

    album_title = (item.get("title") or "").strip()
    if album_title and track and album_title != track:
        raw_title = f"{artist} - {track} ({album_title})"
    elif artist and track:
        raw_title = f"{artist} - {track}"
    else:
        raw_title = album_title or track or artist or guid

    link = _clean_url(item.get("item_url"))
    published = item.get("release_date")

    return guid, link, raw_title, artist or None, track or None, published
