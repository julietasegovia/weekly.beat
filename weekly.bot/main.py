import argparse
import sys

from classify import classify
from config import TAGS
from db import get_conn, count_new, count_unclassified, genre_breakdown, init_db
from scraper import scrape_all, scrape_tag
from week import ensure_current_week


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

def print_genres(conn, min_count=1):
    rows = genre_breakdown(conn, min_count=min_count)
    if not rows:
        print("No candidates yet.")
        return
    width = max(len(row["genre"]) for row in rows)
    for row in rows:
        conf = f" avg confidence {row['avg_conf']}" if row["avg_conf"] is not None else ""
        print(f" {row['genre']:<{width}} {row['n']:>4}{conf}")

def main():
    parser = argparse.ArgumentParser(
        description="Scrape Bandcamp Discover for niche track candidates."
    )
    parser.add_argument(
        "--tag",
        metavar="TAG",
        help="scrape only this Bandcamp tag (e.g. electronic, ambient)",
    )
    parser.add_argument("--summary", action="store_true", help="print DB summary and exit")
    parser.add_argument(
        "--genres", action="store_true", help="print the genre breakdown and exit"
    )
    parser.add_argument(
        "--classify",
        action="store_true",
        help="assign a specific genre to candidates that do not have one yet",
    )
    parser.add_argument("--limit", type=int, help="max candidates to classify this run")
    parser.add_argument(
        "--reclassify",
        action="store_true",
        help="re-run classification over candidates that already have a genre",
    )
    parser.add_argument(
        "--no-fetch-tags",
        action="store_true",
        help="do not fetch release pages for the artist's own tags",
    )
    parser.add_argument(
        "--no-artist-fallback",
        action="store_true",
        help="do not borrow tags from other releases by the same artist",
    )
    parser.add_argument(
        "--musicbrainz",
        action="store_true",
        help="also try MusicBrainz for artists with no usable Bandcamp tags (slow)",
    )
    args = parser.parse_args()

    added = init_db()
    if added:
        print(f"Migrated DB: added column(s) {', '.join(added)}")

    with get_conn() as conn:
        wid, rotated = ensure_current_week(conn)
        if rotated:
            print(f"Week changed to {wid}; prior tracks soft-reset (archived)")

    if args.summary:
        with get_conn() as conn:
            print(f"New (unmatched) candidates in DB: {count_new(conn)}")
            print(f"Without a genre: {count_unclassified(conn)}")
        return

    if args.genres:
        with get_conn() as conn:
            print_genres(conn)
        return

    if args.classify:
        stats = classify(
            limit=args.limit,
            reclassify=args.reclassify,
            fetch_tags=not args.no_fetch_tags,
            artist_fallback=not args.no_artist_fallback,
            musicbrainz=args.musicbrainz,
        )
        print(f"\n{stats}")
        for err in stats.errors:
            print(f"warning: {err}", file=sys.stderr)
        with get_conn() as conn:
            print("\nGenred now in DB:")
            print_genres(conn)
        return

    print(f"Current week: {wid}")

    if args.tag:
        if TAGS and args.tag not in TAGS:
            print(
                f"Note: '{args.tag}' is not in config.TAGS; scraping anyway",
                file=sys.stderr,
            )
        print_result(scrape_tag(args.tag, week=wid))
    else:
        for result in scrape_all(week=wid):
            print_result(result)

    with get_conn() as conn:
        print(f"\nTotal new (unmatched) in DB: {count_new(conn)}")
        print(f"Without a genre: {count_unclassified(conn)} (run: python main.py --classify)")

if __name__ == "__main__":
    main()
