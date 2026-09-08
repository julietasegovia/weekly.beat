import argparse
import sys

from config import SOURCES
from db import get_conn, count_new, init_db
from scraper import scrape_all, scrape_source


def print_result(result):
    if result.skipped_robots:
        print(f"[{result.source}] SKIPPED - disallowed by robots.txt")
    elif result.error:
        print(f"[{result.source}] ERROR - {result.error}")
    else:
        print(
            f"[{result.source}] ok - saw {result.entries_seen} entries, "
            f"{result.new_candidates} new candidates"
        )


def main():
    parser = argparse.ArgumentParser(description="Scrape music blog RSS feeds for niche tracks.")
    parser.add_argument("--once", metavar="SOURCE_NAME", help="scrape only this source")
    parser.add_argument("--summary", action="store_true", help="print DB summary and exit")
    args = parser.parse_args()

    init_db()

    if args.summary:
        with get_conn() as conn:
            print(f"New (unmatched) candidates in DB: {count_new(conn)}")
        return

    if args.once:
        matches = [s for s in SOURCES if s["name"] == args.once]
        if not matches:
            print(f"No source named '{args.once}' in config.py", file=sys.stderr)
            sys.exit(1)
        print_result(scrape_source(matches[0]))
    else:
        for result in scrape_all(SOURCES):
            print_result(result)

    with get_conn() as conn:
        print(f"\nTotal new (unmatched) candidates in DB: {count_new(conn)}")


if __name__ == "__main__":
    main()
