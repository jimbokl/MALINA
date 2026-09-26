#!/usr/bin/env python3
"""Dependency-free SQLite migrations, draft import, and public catalog export."""

from __future__ import annotations

import argparse
import csv
import hashlib
import json
import os
import sqlite3
import sys
import tempfile
from datetime import datetime, timezone
from pathlib import Path


ROOT = Path(__file__).resolve().parent
MIGRATIONS = ROOT / "migrations"
DEFAULT_DB = ROOT / "local" / "catalog.sqlite3"


def migration_files() -> list[Path]:
    return sorted(MIGRATIONS.glob("[0-9][0-9][0-9][0-9]_*.sql"))


def connect(path: Path, *, create: bool = False) -> sqlite3.Connection:
    if not create and not path.is_file():
        raise ValueError(f"Database does not exist: {path}")
    if create:
        path.parent.mkdir(parents=True, exist_ok=True)
    connection = sqlite3.connect(path)
    connection.row_factory = sqlite3.Row
    connection.execute("PRAGMA foreign_keys = ON")
    return connection


def applied_migrations(connection: sqlite3.Connection) -> dict[str, str]:
    exists = connection.execute(
        "SELECT 1 FROM sqlite_master WHERE type = 'table' AND name = 'schema_migrations'"
    ).fetchone()
    if not exists:
        return {}
    return {
        row["version"]: row["checksum"]
        for row in connection.execute("SELECT version, checksum FROM schema_migrations")
    }


def migrate(connection: sqlite3.Connection) -> None:
    connection.execute(
        "CREATE TABLE IF NOT EXISTS schema_migrations ("
        "version TEXT PRIMARY KEY, checksum TEXT NOT NULL, applied_at TEXT NOT NULL) STRICT"
    )
    applied = applied_migrations(connection)
    files = migration_files()
    if not files:
        raise ValueError("No migration files found")
    for path in files:
        version = path.stem
        sql = path.read_text(encoding="utf-8")
        checksum = hashlib.sha256(sql.encode("utf-8")).hexdigest()
        if version in applied:
            if applied[version] != checksum:
                raise ValueError(f"Applied migration changed: {version}")
            continue
        try:
            connection.executescript(
                "BEGIN IMMEDIATE;\n"
                + sql
                + "\nINSERT INTO schema_migrations(version, checksum, applied_at) VALUES ("
                + f"'{version}', '{checksum}', strftime('%Y-%m-%d %H:%M:%S', 'now'));\n"
                + "COMMIT;"
            )
        except Exception:
            connection.rollback()
            raise
        print(f"applied {version}")


def check(connection: sqlite3.Connection) -> dict[str, object]:
    applied = applied_migrations(connection)
    expected = {
        path.stem: hashlib.sha256(path.read_bytes()).hexdigest()
        for path in migration_files()
    }
    if applied != expected:
        raise ValueError(f"Migration mismatch: installed={applied}, expected={expected}")
    integrity = connection.execute("PRAGMA integrity_check").fetchone()[0]
    foreign_keys = connection.execute("PRAGMA foreign_key_check").fetchall()
    if integrity != "ok" or foreign_keys:
        raise ValueError(f"Database check failed: integrity={integrity}, foreign_keys={foreign_keys}")
    return {"migrations": sorted(applied), "integrity": integrity, "foreign_key_errors": 0}


def rows_from_csv(path: Path | None, required: set[str]) -> list[dict[str, str]]:
    if path is None:
        return []
    with path.open(encoding="utf-8-sig", newline="") as handle:
        reader = csv.DictReader(handle)
        headers = set(reader.fieldnames or [])
        missing = required - headers
        if missing:
            raise ValueError(f"{path}: missing columns: {', '.join(sorted(missing))}")
        rows = []
        for line, row in enumerate(reader, 2):
            if None in row:
                raise ValueError(f"{path}:{line}: too many columns")
            normalized = {key: (value or "").strip() for key, value in row.items()}
            if any(normalized.values()):
                rows.append(normalized)
        return rows


def required(row: dict[str, str], field: str, section: str) -> str:
    value = row.get(field, "")
    if not value:
        raise ValueError(f"{section}: {field} is required")
    return value


def optional(row: dict[str, str], field: str) -> str | None:
    return row.get(field) or None


def get_id(connection: sqlite3.Connection, table: str, column: str, value: str) -> int:
    # Call sites use only fixed table and column names, never CSV-provided identifiers.
    result = connection.execute(
        f"SELECT id FROM {table} WHERE {column} = ?", (value,)
    ).fetchone()
    if result is None:
        raise ValueError(f"Unknown {table}.{column}: {value}")
    return result["id"]


def number(row: dict[str, str], field: str) -> float | None:
    value = optional(row, field)
    if value is None:
        return None
    result = float(value)
    if not (-1e100 < result < 1e100):
        raise ValueError(f"Invalid numeric value for {field}: {value}")
    return result


def import_drafts(
    connection: sqlite3.Connection,
    sources_path: Path | None,
    cultivars_path: Path | None,
    observations_path: Path | None,
) -> dict[str, int]:
    sources = rows_from_csv(
        sources_path,
        {"source_key", "kind", "title", "url", "reference", "accessed_on", "rights_note"},
    )
    cultivars = rows_from_csv(
        cultivars_path,
        {"crop_slug", "slug", "canonical_name", "identity_source_key"},
    )
    observations = rows_from_csv(
        observations_path,
        {"cultivar_slug", "trait_code", "value_text", "value_number", "value_max",
         "unit", "context_text", "region_code", "source_key"},
    )
    if not (sources or cultivars or observations):
        raise ValueError("Provide at least one non-empty CSV")
    with connection:
        for row in sources:
            if not (optional(row, "url") or optional(row, "reference")):
                raise ValueError("source: url or reference is required")
            connection.execute(
                "INSERT INTO sources(source_key, kind, title, author_or_org, url, reference, "
                "accessed_on, rights_note) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
                (required(row, "source_key", "source"), required(row, "kind", "source"),
                 required(row, "title", "source"), optional(row, "author_or_org"),
                 optional(row, "url"), optional(row, "reference"),
                 required(row, "accessed_on", "source"), required(row, "rights_note", "source")),
            )
        for row in cultivars:
            connection.execute(
                "INSERT INTO cultivars(crop_id, slug, canonical_name, scientific_name, "
                "identity_source_id) VALUES (?, ?, ?, ?, ?)",
                (get_id(connection, "crops", "slug", required(row, "crop_slug", "cultivar")),
                 required(row, "slug", "cultivar"),
                 required(row, "canonical_name", "cultivar"),
                 optional(row, "scientific_name"),
                 get_id(connection, "sources", "source_key",
                        required(row, "identity_source_key", "cultivar"))),
            )
        for row in observations:
            region = optional(row, "region_code")
            connection.execute(
                "INSERT INTO trait_observations(cultivar_id, trait_code, value_text, "
                "value_number, value_max, unit, context_text, region_id, source_id, observed_on) "
                "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
                (get_id(connection, "cultivars", "slug",
                        required(row, "cultivar_slug", "observation")),
                 required(row, "trait_code", "observation"),
                 optional(row, "value_text"), number(row, "value_number"),
                 number(row, "value_max"), optional(row, "unit"),
                 required(row, "context_text", "observation"),
                 get_id(connection, "regions", "code", region) if region else None,
                 get_id(connection, "sources", "source_key",
                        required(row, "source_key", "observation")),
                 optional(row, "observed_on")),
            )
    return {"sources": len(sources), "cultivars": len(cultivars), "observations": len(observations)}


def public_snapshot(connection: sqlite3.Connection) -> dict[str, object]:
    check(connection)
    cultivars = [dict(row) for row in connection.execute(
        "SELECT * FROM public_cultivars ORDER BY crop_slug, canonical_name, id"
    )]
    by_id = {row["id"]: row for row in cultivars}
    evidence_targets: dict[tuple[str, int], dict[str, object]] = {}
    for cultivar in cultivars:
        cultivar.update(aliases=[], observations=[], media=[], recommendations=[], admissions=[], offers=[], own_batches=[])
    for view, key in (
        ("public_aliases", "aliases"),
        ("public_observations", "observations"),
        ("public_media", "media"),
        ("public_recommendations", "recommendations"),
        ("public_official_admissions", "admissions"),
        ("public_offers", "offers"),
        ("public_own_batches", "own_batches"),
    ):
        for row in connection.execute(f"SELECT * FROM {view} ORDER BY id"):
            item = dict(row)
            cultivar_id = item.pop("cultivar_id")
            if cultivar_id in by_id:
                if key in ("observations", "recommendations"):
                    item["evidence"] = None
                    evidence_targets[(key, item["id"])] = item
                by_id[cultivar_id][key].append(item)
    for row in connection.execute("SELECT * FROM public_evidence_passports ORDER BY id"):
        item = dict(row)
        observation_id = item.pop("observation_id")
        recommendation_id = item.pop("recommendation_id")
        key = ("observations", observation_id) if observation_id is not None else ("recommendations", recommendation_id)
        target = evidence_targets.get(key)
        if target is not None:
            target["evidence"] = item
    return {
        "schema_version": 1,
        "generated_at_utc": datetime.now(timezone.utc).isoformat(timespec="seconds"),
        "crops": [dict(row) for row in connection.execute(
            "SELECT slug, name_ru FROM crops ORDER BY id"
        )],
        "regions": [dict(row) for row in connection.execute(
            "SELECT r.code, r.name_ru, m.admission_region_number, m.admission_region_name, "
            "m.map_source_url FROM regions r LEFT JOIN public_admission_regions m "
            "ON m.code = r.code ORDER BY r.id"
        )],
        "cultivars": cultivars,
    }


def public_reviews_snapshot(connection: sqlite3.Connection) -> dict[str, object]:
    """Only published review fields may leave the shared SQLite database."""
    check(connection)
    return {
        "schema_version": 1,
        "reviews": [dict(row) for row in connection.execute(
            "SELECT id, parent_id, display_name, region, cultivar_name, body, "
            "created_at, published_at FROM public_reviews "
            "ORDER BY published_at DESC, id DESC"
        )],
    }


def public_votes_snapshot(connection: sqlite3.Connection) -> dict[str, object]:
    """Export only published cultivar totals; anonymous voter hashes stay private."""
    check(connection)
    return {
        "votes": [dict(row) for row in connection.execute(
            "SELECT cultivar_slug, count FROM public_cultivar_votes ORDER BY cultivar_slug"
        )],
        "as_of": datetime.now(timezone.utc).isoformat(timespec="seconds").replace("+00:00", "Z"),
    }


def review_queue(connection: sqlite3.Connection) -> dict[str, object]:
    """Local-only moderation queue; never included in public exports."""
    check(connection)
    rows = [dict(row) for row in connection.execute(
        "SELECT id, parent_id, display_name, region, cultivar_name, body, "
        "created_at, moderation_verdict, moderation_reason "
        "FROM reviews WHERE status = 'pending_human_review' "
        "ORDER BY created_at, id"
    )]
    return {"status": "pending_human_review", "count": len(rows), "reviews": rows}


def decide_review(
    connection: sqlite3.Connection, review_id: int, decision: str, reviewer: str
) -> dict[str, object]:
    """Record a human decision without pretending it came from JEV."""
    check(connection)
    reviewer = reviewer.strip()
    if not 1 <= len(reviewer) <= 60 or any(ch.isspace() or ord(ch) < 32 for ch in reviewer):
        raise ValueError("--reviewer must be a short identifier without spaces")
    if review_id < 1 or decision not in ("approved", "rejected"):
        raise ValueError("Provide a valid --id and --decision")
    with connection:
        row = connection.execute(
            "SELECT parent_id FROM reviews WHERE id = ? AND status = 'pending_human_review'",
            (review_id,),
        ).fetchone()
        if row is None:
            raise ValueError("Review is absent or no longer pending human review")
        if decision == "approved" and row["parent_id"] is not None:
            parent = connection.execute(
                "SELECT 1 FROM public_reviews WHERE id = ?", (row["parent_id"],)
            ).fetchone()
            if parent is None:
                raise ValueError("Approve the parent discussion first")
        connection.execute(
            "UPDATE reviews SET status = ?, reviewed_by = ?, "
            "reviewed_at = strftime('%Y-%m-%d %H:%M:%S', 'now'), "
            "published_at = CASE WHEN ? = 'approved' "
            "THEN strftime('%Y-%m-%d %H:%M:%S', 'now') ELSE NULL END "
            "WHERE id = ? AND status = 'pending_human_review'",
            (decision, f"human:{reviewer}", decision, review_id),
        )
    return {"id": review_id, "status": decision}


def write_output(text: str, output: str) -> None:
    if output == "-":
        print(text)
        return
    target = Path(output)
    target.parent.mkdir(parents=True, exist_ok=True)
    with tempfile.NamedTemporaryFile(
        mode="w", encoding="utf-8", dir=target.parent, delete=False
    ) as handle:
        handle.write(text + "\n")
        temporary = Path(handle.name)
    os.replace(temporary, target)


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("command", choices=(
        "init", "check", "import-drafts", "export-public", "export-reviews", "export-votes",
        "review-queue", "review-decide",
    ))
    parser.add_argument("--db", type=Path, default=DEFAULT_DB)
    parser.add_argument("--sources", type=Path)
    parser.add_argument("--cultivars", type=Path)
    parser.add_argument("--observations", type=Path)
    parser.add_argument("--out", default="-")
    parser.add_argument("--id", type=int)
    parser.add_argument("--decision", choices=("approved", "rejected"))
    parser.add_argument("--reviewer")
    args = parser.parse_args(argv)
    try:
        with connect(args.db, create=args.command == "init") as connection:
            if args.command == "init":
                migrate(connection)
                print(json.dumps(check(connection), ensure_ascii=False))
            elif args.command == "check":
                print(json.dumps(check(connection), ensure_ascii=False))
            elif args.command == "import-drafts":
                check(connection)
                print(json.dumps(import_drafts(
                    connection, args.sources, args.cultivars, args.observations
                ), ensure_ascii=False))
            elif args.command == "export-public":
                write_output(json.dumps(
                    public_snapshot(connection), ensure_ascii=False, indent=2
                ), args.out)
            elif args.command == "export-reviews":
                write_output(json.dumps(
                    public_reviews_snapshot(connection), ensure_ascii=False, indent=2
                ), args.out)
            elif args.command == "review-queue":
                print(json.dumps(review_queue(connection), ensure_ascii=False, indent=2))
            elif args.command == "export-votes":
                write_output(json.dumps(
                    public_votes_snapshot(connection), ensure_ascii=False, indent=2
                ), args.out)
            else:
                if args.id is None or args.decision is None or args.reviewer is None:
                    raise ValueError("review-decide requires --id, --decision and --reviewer")
                print(json.dumps(decide_review(
                    connection, args.id, args.decision, args.reviewer
                ), ensure_ascii=False))
        return 0
    except (ValueError, OSError, sqlite3.Error) as error:
        print(f"catalog: {error}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
