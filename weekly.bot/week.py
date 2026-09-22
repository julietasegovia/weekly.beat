from datetime import datetime, timedelta, timezone
from zoneinfo import ZoneInfo

from config import TIMEZONE, WEEKLY_RESET_HOUR, WEEKLY_RESET_MINUTE, WEEKLY_RESET_WEEKDAY


def _tz():
    return ZoneInfo(TIMEZONE)


def current_week_id(now=None) -> int:
    """Week id as YYYYWW, keyed off the configured weekly reset boundary."""
    now = (now or datetime.now(_tz())).astimezone(_tz())
    days_back = (now.weekday() - WEEKLY_RESET_WEEKDAY) % 7
    reset = (now - timedelta(days=days_back)).replace(
        hour=WEEKLY_RESET_HOUR,
        minute=WEEKLY_RESET_MINUTE,
        second=0,
        microsecond=0,
    )
    if reset > now:
        reset -= timedelta(days=7)
    iso = reset.isocalendar()
    return iso.year * 100 + iso.week


def ensure_current_week(conn) -> tuple[int, bool]:
    """Soft-reset when the week rolls: archive prior candidates, open a new run.

    Returns (week_id, rotated).
    """
    wid = current_week_id()
    row = conn.execute("SELECT week FROM runs ORDER BY week DESC LIMIT 1").fetchone()
    if row and row["week"] == wid:
        return wid, False

    conn.execute(
        "UPDATE candidates SET status='archived' WHERE week IS NULL OR week != ?",
        (wid,),
    )
    if row:
        conn.execute(
            "UPDATE runs SET reset_at = ? WHERE week = ?",
            (datetime.now(timezone.utc).isoformat(), row["week"]),
        )
    conn.execute(
        "INSERT OR REPLACE INTO runs (week, started_at) VALUES (?, ?)",
        (wid, datetime.now(timezone.utc).isoformat()),
    )
    return wid, True
