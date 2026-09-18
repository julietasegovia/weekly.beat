"""Polite HTTP helpers + robots.txt check with longest-match Allow/Disallow."""

from urllib.parse import urlparse

import requests

from config import USER_AGENT, REQUEST_TIMEOUT_SECONDS

_robots_cache: dict[str, list[tuple[str, bool]]] = {}


def _parse_rules_for_ua(robots_text: str, user_agent: str) -> list[tuple[str, bool]]:
    """
    Parse robots.txt into (path, allowed) rules for the best-matching UA group.

    Blank lines do not end a group (matches how Bandcamp intends its Allow
    exceptions under User-agent: *). Longest matching path wins at check time.
    """
    ua_token = user_agent.split("/")[0].strip().lower()
    groups: list[tuple[list[str], list[tuple[str, bool]]]] = []
    current_agents: list[str] = []
    current_rules: list[tuple[str, bool]] = []
    saw_agents = False

    def flush():
        nonlocal current_agents, current_rules, saw_agents
        if current_agents:
            groups.append((current_agents, current_rules))
        current_agents, current_rules, saw_agents = [], [], False

    for raw in robots_text.splitlines():
        line = raw.split("#", 1)[0].strip()
        if not line:
            continue
        lower = line.lower()
        if lower.startswith("user-agent:"):
            agent = line.split(":", 1)[1].strip().lower()
            if saw_agents and current_rules:
                flush()
            elif not saw_agents and current_agents and not current_rules:
                pass
            elif saw_agents and not current_rules:
                flush()
            current_agents.append(agent)
            saw_agents = True
            continue
        if lower.startswith("disallow:"):
            path = line.split(":", 1)[1].strip()
            current_rules.append((path, False))
            continue
        if lower.startswith("allow:"):
            path = line.split(":", 1)[1].strip()
            current_rules.append((path, True))
            continue

    flush()

    starred = []
    named = []
    for agents, rules in groups:
        if ua_token in agents:
            named = rules
            break
        if "*" in agents and not starred:
            starred = rules
    return named if named else starred


def _path_matches(rule_path: str, url_path: str) -> bool:
    if rule_path == "":
        return False
    if rule_path.endswith("$"):
        return url_path == rule_path[:-1]
    if "*" in rule_path:
        prefix = rule_path.split("*", 1)[0]
        return url_path.startswith(prefix)
    return url_path.startswith(rule_path)


def get_rules(url: str) -> list[tuple[str, bool]]:
    parsed = urlparse(url)
    host = f"{parsed.scheme}://{parsed.netloc}"
    if host in _robots_cache:
        return _robots_cache[host]

    robots_url = f"{host}/robots.txt"
    try:
        resp = requests.get(
            robots_url,
            headers={"User-Agent": USER_AGENT},
            timeout=REQUEST_TIMEOUT_SECONDS,
        )
        text = resp.text if resp.status_code == 200 else ""
    except requests.RequestException:
        text = ""

    rules = _parse_rules_for_ua(text, USER_AGENT) if text else []
    _robots_cache[host] = rules
    return rules


def is_allowed(url: str) -> bool:
    path = urlparse(url).path or "/"
    rules = get_rules(url)
    if not rules:
        return True

    best_len = -1
    allowed = True
    for rule_path, rule_allowed in rules:
        if not _path_matches(rule_path, path):
            continue
        if len(rule_path) > best_len:
            best_len = len(rule_path)
            allowed = rule_allowed
    return allowed


def _default_headers(extra: dict | None = None) -> dict:
    headers = {
        "User-Agent": USER_AGENT,
        "Accept": "application/json",
    }
    if extra:
        headers.update(extra)
    return headers


def polite_get(url: str, **kwargs) -> requests.Response:
    headers = _default_headers(kwargs.pop("headers", None))
    return requests.get(url, headers=headers, timeout=REQUEST_TIMEOUT_SECONDS, **kwargs)


def polite_post(url: str, json: dict | None = None, **kwargs) -> requests.Response:
    headers = _default_headers(kwargs.pop("headers", None))
    headers.setdefault("Content-Type", "application/json")
    return requests.post(
        url,
        headers=headers,
        json=json,
        timeout=REQUEST_TIMEOUT_SECONDS,
        **kwargs,
    )
