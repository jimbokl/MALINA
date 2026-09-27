"""A live reviews/votes database can be backed up and restored without overwrites."""

from __future__ import annotations

import sqlite3
import sys
import tempfile
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
import catalog  # noqa: E402


class DatabaseSnapshotTests(unittest.TestCase):
    def setUp(self) -> None:
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name)
        self.live_path = self.root / "live.sqlite3"
        with catalog.connect(self.live_path, create=True) as connection:
            catalog.migrate(connection)
        self.live = catalog.connect(self.live_path)
        self.addCleanup(self.live.close)
        self.live.execute("PRAGMA journal_mode = WAL")
        self.live.execute(
            "INSERT INTO reviews (display_name, region, cultivar_name, body, "
            "consent_processing, processing_consented_at, status) "
            "VALUES ('Анна', 'Брянская область', 'Салют', "
            "'На моём участке сорт дал урожай в августе.', "
            "1, '2026-09-27 12:00:00', 'pending_human_review')"
        )
        cultivar_id = self.live.execute(
            "SELECT id FROM cultivars WHERE slug = 'salyut'"
        ).fetchone()[0]
        self.live.execute(
            "INSERT INTO cultivar_votes (cultivar_id, voter_hash) VALUES (?, ?)",
            (cultivar_id, "a" * 64),
        )
        self.live.commit()

    def test_live_wal_backup_and_restore_preserve_private_records(self) -> None:
        backup = self.root / "private" / "snapshot.sqlite3"
        result = catalog.copy_database_snapshot(self.live_path, backup)
        self.assertEqual(result["integrity"], "ok")
        self.assertEqual(result["foreign_key_errors"], 0)
        self.assertGreater(result["migrations"], 0)

        self.live.execute("DELETE FROM cultivar_votes")
        self.live.commit()
        restored = self.root / "restored.sqlite3"
        catalog.copy_database_snapshot(backup, restored)
        with catalog.connect(restored) as connection:
            self.assertEqual(connection.execute("SELECT COUNT(*) FROM reviews").fetchone()[0], 1)
            self.assertEqual(connection.execute("SELECT COUNT(*) FROM cultivar_votes").fetchone()[0], 1)
            self.assertEqual(catalog.check(connection)["integrity"], "ok")

    def test_existing_destination_is_not_overwritten(self) -> None:
        destination = self.root / "saved.sqlite3"
        destination.write_bytes(b"keep this file")
        with self.assertRaisesRegex(ValueError, "already exists"):
            catalog.copy_database_snapshot(self.live_path, destination)
        self.assertEqual(destination.read_bytes(), b"keep this file")

    def test_invalid_source_does_not_leave_restored_database(self) -> None:
        unrelated = self.root / "unrelated.sqlite3"
        with sqlite3.connect(unrelated) as connection:
            connection.execute("CREATE TABLE arbitrary (id INTEGER)")
        restored = self.root / "not-restored.sqlite3"
        with self.assertRaisesRegex(ValueError, "no MALINA migrations"):
            catalog.copy_database_snapshot(unrelated, restored)
        self.assertFalse(restored.exists())
        self.assertEqual(list(self.root.glob(".malina-snapshot-*")), [])


if __name__ == "__main__":
    unittest.main()
