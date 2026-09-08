from urllib.parse import urlparse
from urllib.robotparser import RobotFileParser

import requests

from config import USER_AGENT, REQUEST_TIMEOUT_SECONDS

_robots_cache = {}

def get_robot_parser(url: str) -> RobotFileParser:
    parsed = urlparse(url)
    host = f"{parsed.scheme}://{parsed.netloc}"
    if host in _robots_cache:
        return _robots_cache[host]

    rp = RobotFileParser()
    robots_url = f"{host}/robots.txt"
    try:
        resp = requests.get(
            robots_url,
            headers={"User-Agent": USER_AGENT},
            timeout=REQUEST_TIMEOUT_SECONDS,
        )
        if resp.status_code == 200:
            rp.parse(resp.text.splitlines())
        else:
            rp.parse([])
    except requests.RequestException:
        rp.parse([])

    _robots_cache[host] = rp
    return rp

def is_allowed(url: str) -> bool:
    rp = get_robot_parser(url)
    return rp.can_fetch(USER_AGENT, url)

def polite_get(url: str, **kwargs) -> requests.Response:
    headers = kwargs.pop("headers", {})
    headers.setdefault("User-Agent", USER_AGENT)
    return requests.get(url, headers=headers, timeout=REQUEST_TIMEOUT_SECONDS, **kwargs)