import re

_PREFIXES = re.compile(
    r"^(premiere|video premiere|track premiere|listen|watch|new music|"
    r"song of the day|track of the day)\s*[:\-]\s*",
    re.IGNORECASE,
)

_PATTERNS = [
    re.compile(r"^(?P<artist>[^-–—:]+?)\s*[-–—]\s*(?P<track>.+)$"),
    re.compile(r"^(?P<artist>[^:]+?):\s*(?P<track>.+)$"),
    re.compile(r"""^(?P<artist>[^,]+?),\s*["'“](?P<track>.+?)["'”]$"""),
    re.compile(r"""^["'“]?(?P<track>.+?)["'”]?\s+by\s+(?P<artist>.+)$""", re.IGNORECASE),
]


def guess_artist_track(raw_title: str):
    if not raw_title:
        return None, None

    title = _PREFIXES.sub("", raw_title.strip())

    for pattern in _PATTERNS:
        m = pattern.match(title)
        if m:
            artist = m.group("artist").strip(" \"'“”")
            track = m.group("track").strip(" \"'“”")
            if artist and track:
                return artist, track

    return None, None
