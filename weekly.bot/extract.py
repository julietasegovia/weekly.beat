
from urllib.parse import urlparse, urlunparse


def _clean_url(url: str | None) -> str | None:
    if not url:
        return None
    parsed = urlparse(url)
    return urlunparse((parsed.scheme, parsed.netloc, parsed.path, "", "", ""))


def _item_tags(item: dict) -> list[str]:
    tags: list[str] = []
    for key in ("tags", "item_tags", "tag_names", "tag_norm_names", "genre_text", "genre"):
        value = item.get(key)
        if not value:
            continue
        if isinstance(value, str):
            tags.append(value)
        elif isinstance(value, list):
            for entry in value:
                if isinstance(entry, str):
                    tags.append(entry)
                elif isinstance(entry, dict):
                    name = entry.get("name") or entry.get("norm_name")
                    if name:
                        tags.append(name)

    seen, out = set(), []
    for tag in tags:
        t = tag.strip().lower()
        if t and t not in seen:
            seen.add(t)
            out.append(t)
    return out


def from_discover_result(item: dict) -> dict:
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

    return {
        "guid": guid,
        "link": _clean_url(item.get("item_url")),
        "raw_title": raw_title,
        "artist": artist or None,
        "track": track or None,
        "album": album_title or None,
        "published": item.get("release_date"),
        "tags": _item_tags(item),
    }
