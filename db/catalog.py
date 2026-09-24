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
    for cultivar in cultivars:
        cultivar.update(aliases=[], observations=[], media=[], recommendations=[], offers=[])
    for view, key in (
        ("public_aliases", "aliases"),
        ("public_observations", "observations"),
        ("public_media", "media"),
        ("public_recommendations", "recommendations"),
        ("public_offers", "offers"),
    ):
        for row in connection.execute(f"SELECT * FROM {view} ORDER BY id"):
            item = dict(row)
            cultivar_id = item.pop("cultivar_id")
            if cultivar_id in by_id:
                by_id[cultivar_id][key].append(item)
    return {
        "schema_version": 1,
        "generated_at_utc": datetime.now(timezone.utc).isoformat(timespec="seconds"),
        "crops": [dict(row) for row in connection.execute(
            "SELECT slug, name_ru FROM crops ORDER BY id"
        )],
        "regions": [dict(row) for row in connection.execute(
            "SELECT code, name_ru FROM regions ORDER BY id"
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
    parser.add_argument("command", choices=("init", "check", "import-drafts", "export-public", "export-reviews"))
    parser.add_argument("--db", type=Path, default=DEFAULT_DB)
    parser.add_argument("--sources", type=Path)
    parser.add_argument("--cultivars", type=Path)
    parser.add_argument("--observations", type=Path)
    parser.add_argument("--out", default="-")
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
            else:
                write_output(json.dumps(
                    public_reviews_snapshot(connection), ensure_ascii=False, indent=2
                ), args.out)
        return 0
    except (ValueError, OSError, sqlite3.Error) as error:
        print(f"catalog: {error}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
