import argparse
import sys

from config import TAGS
from db import get_conn, count_new, init_db
from scraper import scrape_all, scrape_tag


def print_result(result):
    if result.skipped_robots:
        print(f"[{result.source}] SKIPPED - disallowed by robots.txt")
    elif result.error:
        print(f"[{result.source}] ERROR - {result.error}")
    else:
        print(
            f"[{result.source}] ok - saw {result.entries_seen} releases, "
            f"{result.new_candidates} new candidates"
        )


def main():
    parser = argparse.ArgumentParser(
        description="Scrape Bandcamp Discover for niche track candidates."
    )
    parser.add_argument(
        "--tag",
        metavar="TAG",
        help="scrape only this Bandcamp tag (e.g. electronic, ambient)",
    )
    parser.add_argument(
        "--summary",
        action="store_true",
        help="print DB summary and exit",
    )
    args = parser.parse_args()

    init_db()

    if args.summary:
        with get_conn() as conn:
            print(f"New (unmatched) candidates in DB: {count_new(conn)}")
        return

    if args.tag:
        if TAGS and args.tag not in TAGS:
            print(
                f"Note: '{args.tag}' is not in config.TAGS; scraping anyway.",
                file=sys.stderr,
            )
        print_result(scrape_tag(args.tag))
    else:
        for result in scrape_all():
            print_result(result)

    with get_conn() as conn:
        print(f"\nTotal new (unmatched) candidates in DB: {count_new(conn)}")


if __name__ == "__main__":
    main()
