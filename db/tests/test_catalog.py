"""Publication boundaries for the SQLite catalog."""

from __future__ import annotations

import csv
import sqlite3
import sys
import tempfile
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
import catalog  # noqa: E402


class CatalogTests(unittest.TestCase):
    def setUp(self) -> None:
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name)
        self.connection = catalog.connect(self.root / "catalog.sqlite3", create=True)
        self.addCleanup(self.connection.close)
        catalog.migrate(self.connection)
        # Migration 0002 seeds the public reference catalog. These tests need
        # an empty fixture so they can exercise publication and rollback gates.
        for table in ("trait_observations", "cultivars", "sources"):
            self.connection.execute(f"DELETE FROM {table}")
        self.connection.commit()

    def add_source_and_cultivar(self) -> None:
        self.connection.execute(
            "INSERT INTO sources(source_key, kind, title, url, accessed_on, rights_note) "
            "VALUES ('reference-a', 'website', 'Reference A', 'https://example.org/a', "
            "'2026-09-24', 'Facts only; no images')"
        )
        self.connection.execute(
            "INSERT INTO cultivars(crop_id, slug, canonical_name, identity_source_id) "
            "VALUES (1, 'test-cultivar', 'Test Cultivar', 1)"
        )
        self.connection.commit()

    def publish_identity(self) -> None:
        self.connection.execute(
            "UPDATE sources SET review_status='verified', reviewed_by='editor', "
            "reviewed_at='2026-09-24 12:00:00' WHERE id=1"
        )
        self.connection.execute(
            "UPDATE cultivars SET editorial_status='published', reviewed_by='editor', "
            "reviewed_at='2026-09-24 12:00:00', "
            "published_at='2026-09-24 12:00:00' WHERE id=1"
        )
        self.connection.commit()

    def test_publication_requires_verified_identity_and_source(self) -> None:
        self.add_source_and_cultivar()
        self.assertEqual(catalog.public_snapshot(self.connection)["cultivars"], [])
        self.publish_identity()
        self.assertEqual(len(catalog.public_snapshot(self.connection)["cultivars"]), 1)
        self.connection.execute("UPDATE sources SET review_status='rejected' WHERE id=1")
        self.assertEqual(catalog.public_snapshot(self.connection)["cultivars"], [])

    def test_conflicting_observations_are_kept_with_context(self) -> None:
        self.add_source_and_cultivar()
        self.publish_identity()
        for value, context in (("early", "trial A"), ("late", "trial B")):
            self.connection.execute(
                "INSERT INTO trait_observations(cultivar_id, trait_code, value_text, "
                "context_text, source_id, review_status, reviewed_by, reviewed_at) "
                "VALUES (1, 'maturity_period', ?, ?, 1, 'verified', 'editor', "
                "'2026-09-24 12:00:00')",
                (value, context),
            )
        records = catalog.public_snapshot(self.connection)["cultivars"][0]["observations"]
        self.assertEqual({item["value_text"] for item in records}, {"early", "late"})
        self.assertEqual({item["context_text"] for item in records}, {"trial A", "trial B"})

    def test_offer_expires_and_requires_published_cultivar(self) -> None:
        self.add_source_and_cultivar()
        self.publish_identity()
        self.connection.execute(
            "INSERT INTO sellers(display_name, review_status, reviewed_by, reviewed_at) "
            "VALUES ('Test Seller', 'verified', 'editor', '2026-09-24 12:00:00')"
        )
        for expiry in ("2000-01-01 00:00:00", "2999-01-01 00:00:00"):
            self.connection.execute(
                "INSERT INTO offers(seller_id, cultivar_id, product_name, kind, "
                "checked_at, expires_at, editorial_status, reviewed_by, reviewed_at) "
                "VALUES (1, 1, 'Test offer', 'affiliate', '2026-09-24 12:00:00', ?, "
                "'published', 'editor', '2026-09-24 12:00:00')",
                (expiry,),
            )
        self.connection.execute(
            "INSERT INTO offers(seller_id, product_name, kind, checked_at, expires_at, "
            "editorial_status, reviewed_by, reviewed_at) "
            "VALUES (1, 'Unlinked offer', 'affiliate', '2026-09-24 12:00:00', "
            "'2999-01-01 00:00:00', 'published', 'editor', '2026-09-24 12:00:00')"
        )
        self.assertEqual(len(catalog.public_snapshot(self.connection)["cultivars"][0]["offers"]), 1)

    def test_import_rolls_back_all_rows_after_invalid_reference(self) -> None:
        source_path = self.root / "sources.csv"
        with source_path.open("w", encoding="utf-8", newline="") as file:
            writer = csv.DictWriter(
                file,
                fieldnames=["source_key", "kind", "title", "url", "reference", "accessed_on", "rights_note"],
            )
            writer.writeheader()
            writer.writerow({"source_key": "test", "kind": "website", "title": "Test", "url": "https://example.org", "accessed_on": "2026-09-24", "rights_note": "Facts only"})
        cultivar_path = self.root / "cultivars.csv"
        with cultivar_path.open("w", encoding="utf-8", newline="") as file:
            writer = csv.DictWriter(file, fieldnames=["crop_slug", "slug", "canonical_name", "identity_source_key"])
            writer.writeheader()
            writer.writerow({"crop_slug": "unknown", "slug": "invalid", "canonical_name": "Invalid", "identity_source_key": "test"})
        with self.assertRaisesRegex(ValueError, "Unknown crops.slug"):
            catalog.import_drafts(self.connection, source_path, cultivar_path, None)
        self.assertEqual(self.connection.execute("SELECT count(*) FROM sources").fetchone()[0], 0)

    def test_check_detects_foreign_key_damage(self) -> None:
        self.add_source_and_cultivar()
        self.connection.execute("PRAGMA foreign_keys=OFF")
        self.connection.execute("UPDATE cultivars SET crop_id=999 WHERE id=1")
        self.connection.commit()
        with self.assertRaisesRegex(ValueError, "foreign_keys"):
            catalog.check(self.connection)


if __name__ == "__main__":
    unittest.main()
