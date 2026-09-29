#!/usr/bin/env python3
"""Import dated raspberry seedling listing observations and count city × cultivar mentions.

This tool accepts an already obtained CSV. It does not fetch listing pages.
"""

from __future__ import annotations

import argparse
import csv
import hmac
import hashlib
import json
import os
import re
import sqlite3
import sys
import unicodedata
from datetime import date
from pathlib import Path
from urllib.parse import urlparse

import catalog


REQUIRED_COLUMNS = {"listing_id", "listing_url", "city", "title"}
IGNORED_COLUMNS = {"seller_name", "phone", "email", "contact", "address"}


def normalize(value: str) -> str:
    value = unicodedata.normalize("NFKC", value).casefold().replace("ё", "е")
    return re.sub(r"\s+", " ", value).strip()


def mention_pattern(name: str) -> re.Pattern[str]:
    words = [re.escape(word) for word in normalize(name).split()]
    return re.compile(r"(?<!\w)" + r"[\s\-]+".join(words) + r"(?!\w)", re.UNICODE)


def raspberry_names(connection: sqlite3.Connection) -> list[tuple[int, str, re.Pattern[str]]]:
    rows = connection.execute(
        "SELECT c.id, c.canonical_name AS name FROM cultivars c "
        "JOIN crops p ON p.id = c.crop_id WHERE p.slug = 'raspberry' "
        "UNION ALL "
        "SELECT c.id, a.alias AS name FROM cultivar_aliases a "
        "JOIN cultivars c ON c.id = a.cultivar_id "
        "JOIN crops p ON p.id = c.crop_id "
        "WHERE p.slug = 'raspberry' AND a.review_status = 'verified'"
    ).fetchall()
    names = [(row["id"], row["name"], mention_pattern(row["name"])) for row in rows]
    # Longer names first, so the retained alias is the most specific one.
    return sorted(names, key=lambda item: len(item[1]), reverse=True)


def matches(title: str, description: str, names: list[tuple[int, str, re.Pattern[str]]]) -> dict[int, tuple[str, str]]:
    found: dict[int, tuple[str, str]] = {}
    normalized_title, normalized_body = normalize(title), normalize(description)
    for cultivar_id, name, pattern in names:
        if cultivar_id in found:
            continue
        if pattern.search(normalized_title):
            found[cultivar_id] = ("title", name)
        elif pattern.search(normalized_body):
            found[cultivar_id] = ("description", name)
    return found


def read_listing_rows(path: Path) -> list[dict[str, str]]:
    with path.open(encoding="utf-8-sig", newline="") as handle:
        reader = csv.DictReader(handle)
        columns = set(reader.fieldnames or [])
        missing = REQUIRED_COLUMNS - columns
        if missing:
            raise ValueError(f"CSV lacks columns: {', '.join(sorted(missing))}")
        if columns & IGNORED_COLUMNS:
            raise ValueError("Remove personal contact columns before importing")
        result = []
        for line_number, row in enumerate(reader, 2):
            if None in row:
                raise ValueError(f"CSV line {line_number} has extra columns")
            cleaned = {key: (value or "").strip() for key, value in row.items()}
            for key in REQUIRED_COLUMNS:
                if not cleaned[key]:
                    raise ValueError(f"CSV line {line_number}: {key} is empty")
            if not cleaned["listing_id"].isdigit():
                raise ValueError(f"CSV line {line_number}: listing_id must be numeric")
            host = (urlparse(cleaned["listing_url"]).hostname or "").lower()
            if host not in {"avito.ru", "www.avito.ru", "m.avito.ru"}:
                raise ValueError(f"CSV line {line_number}: expected an Avito listing URL")
            result.append(cleaned)
        return result


def import_snapshot(connection: sqlite3.Connection, *, batch_id: str, observed_on: str,
                    scope_text: str, csv_path: Path, seller_key: str = "") -> dict[str, int]:
    date.fromisoformat(observed_on)
    if not batch_id.strip() or not scope_text.strip():
        raise ValueError("batch_id and scope_text are required")
    rows = read_listing_rows(csv_path)
    if not rows:
        raise ValueError("CSV contains no listings")
    if any(row.get("seller_id") for row in rows) and not seller_key:
        raise ValueError("Set MARKET_SELLER_HASH_KEY to deduplicate sellers without storing IDs")
    names = raspberry_names(connection)
    if not names:
        raise ValueError("Raspberry cultivar catalog is empty")

    # The same listing can appear in several city searches. Its own city is the
    # grouping key; a conflicting city in one snapshot needs editorial review.
    unique: dict[str, dict[str, str]] = {}
    for row in rows:
        listing_id = row["listing_id"]
        previous = unique.get(listing_id)
        if previous:
            if normalize(previous["city"]) != normalize(row["city"]) or previous["listing_url"] != row["listing_url"]:
                raise ValueError(f"Listing {listing_id} has conflicting city or URL")
            if len(row["title"] + row.get("description", "")) > len(previous["title"] + previous.get("description", "")):
                unique[listing_id] = row
        else:
            unique[listing_id] = row

    matched = 0
    with connection:
        connection.execute(
            "INSERT INTO market_presence_batches(batch_id, source, observed_on, scope_text, listing_count, matched_listing_count) "
            "VALUES (?, 'avito', ?, ?, ?, 0)",
            (batch_id, observed_on, scope_text, len(unique)),
        )
        for row in unique.values():
            seller_id = row.get("seller_id", "")
            digest = hmac.new(seller_key.encode(), seller_id.encode(), hashlib.sha256).hexdigest() if seller_id else None
            connection.execute(
                "INSERT INTO market_presence_listings(batch_id, listing_id, listing_url, city_name, city_key, seller_digest) "
                "VALUES (?, ?, ?, ?, ?, ?)",
                (batch_id, row["listing_id"], row["listing_url"], row["city"], normalize(row["city"]), digest),
            )
            found = matches(row["title"], row.get("description", ""), names)
            if found:
                matched += 1
            for cultivar_id, (location, matched_name) in found.items():
                connection.execute(
                    "INSERT INTO market_presence_mentions(batch_id, listing_id, cultivar_id, mention_location, matched_name) "
                    "VALUES (?, ?, ?, ?, ?)",
                    (batch_id, row["listing_id"], cultivar_id, location, matched_name),
                )
        connection.execute(
            "UPDATE market_presence_batches SET matched_listing_count = ? WHERE batch_id = ?",
            (matched, batch_id),
        )
    return {"input_rows": len(rows), "unique_listings": len(unique), "matched_listings": matched}


def report(connection: sqlite3.Connection, batch_id: str) -> dict[str, object]:
    batch = connection.execute(
        "SELECT batch_id, source, observed_on, scope_text, listing_count, matched_listing_count "
        "FROM market_presence_batches WHERE batch_id = ?", (batch_id,)
    ).fetchone()
    if batch is None:
        raise ValueError(f"Unknown batch: {batch_id}")
    city_totals = {
        row["city_key"]: row["total"]
        for row in connection.execute(
            "SELECT city_key, COUNT(*) AS total FROM market_presence_listings "
            "WHERE batch_id = ? GROUP BY city_key", (batch_id,)
        )
    }
    rows = connection.execute(
        "SELECT l.city_name, l.city_key, c.slug AS cultivar_slug, c.canonical_name, "
        "COUNT(*) AS listing_count, "
        "SUM(CASE WHEN m.mention_location = 'title' THEN 1 ELSE 0 END) AS title_count, "
        "SUM(CASE WHEN m.mention_location = 'description' THEN 1 ELSE 0 END) AS description_count, "
        "COUNT(DISTINCT l.seller_digest) AS known_seller_count, "
        "SUM(CASE WHEN l.seller_digest IS NULL THEN 1 ELSE 0 END) AS unknown_seller_listings "
        "FROM market_presence_mentions m "
        "JOIN market_presence_listings l ON l.batch_id = m.batch_id AND l.listing_id = m.listing_id "
        "JOIN cultivars c ON c.id = m.cultivar_id "
        "WHERE m.batch_id = ? "
        "GROUP BY l.city_key, c.id ORDER BY l.city_key, listing_count DESC, c.canonical_name",
        (batch_id,),
    ).fetchall()
    counts = []
    for row in rows:
        item = dict(row)
        item["city_total_listings"] = city_totals[item["city_key"]]
        item["city_listing_share"] = round(item["listing_count"] / item["city_total_listings"], 4)
        counts.append(item)
    return {"batch": dict(batch), "counts": counts}


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--db", type=Path, default=catalog.DEFAULT_DB)
    sub = parser.add_subparsers(dest="command", required=True)
    importer = sub.add_parser("import")
    importer.add_argument("--csv", type=Path, required=True)
    importer.add_argument("--batch-id", required=True)
    importer.add_argument("--observed-on", required=True)
    importer.add_argument("--scope", required=True, help="Queries, cities and pages covered by this snapshot")
    reporter = sub.add_parser("report")
    reporter.add_argument("--batch-id", required=True)
    reporter.add_argument("--out", type=Path)
    args = parser.parse_args()
    try:
        connection = catalog.connect(args.db, create=args.command == "import")
        with connection:
            catalog.migrate(connection)
        if args.command == "import":
            result = import_snapshot(connection, batch_id=args.batch_id, observed_on=args.observed_on,
                                     scope_text=args.scope, csv_path=args.csv,
                                     seller_key=os.environ.get("MARKET_SELLER_HASH_KEY", ""))
        else:
            result = report(connection, args.batch_id)
            if args.out:
                args.out.parent.mkdir(parents=True, exist_ok=True)
                args.out.write_text(json.dumps(result, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
                result = {"written": str(args.out), "rows": len(result["counts"])}
        print(json.dumps(result, ensure_ascii=False))
        return 0
    except (ValueError, sqlite3.Error, OSError) as exc:
        print(str(exc), file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
