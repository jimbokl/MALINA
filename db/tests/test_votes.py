"""Private recommendation storage and the public aggregate export contract."""
import contextlib
import hashlib
import io
import json
import sqlite3
import sys
import tempfile
import unittest
from datetime import datetime, timezone
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
import catalog


class VoteTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.path = Path(self.temp.name) / "catalog.sqlite3"
        self.connection = catalog.connect(self.path, create=True)
        self.addCleanup(self.connection.close)
        catalog.migrate(self.connection)
        self.cultivar_id = self.connection.execute(
            "SELECT id FROM public_cultivars WHERE slug = 'polka'"
        ).fetchone()["id"]

    def test_zero_baseline_and_export_cli_do_not_invent_votes(self):
        destination = Path(self.temp.name) / "votes.json"
        self.assertEqual(catalog.main([
            "export-votes", "--db", str(self.path), "--out", str(destination)
        ]), 0)
        result = json.loads(destination.read_text())
        self.assertEqual(set(result), {"votes", "as_of"})
        self.assertEqual([v["cultivar_slug"] for v in result["votes"]], [
            "cambridge-favourite", "elan", "gusar", "joan-j", "polka"
        ])
        self.assertTrue(all(v["count"] == 0 for v in result["votes"]))
        as_of = datetime.fromisoformat(result["as_of"].replace("Z", "+00:00"))
        self.assertLess(abs((datetime.now(timezone.utc) - as_of).total_seconds()), 10)

    def test_export_contains_counts_only_and_respects_publication(self):
        token = "a" * 64
        hashed = hashlib.sha256(token.encode()).hexdigest()
        self.connection.execute(
            "INSERT INTO cultivar_votes(cultivar_id, voter_hash) VALUES (?, ?)",
            (self.cultivar_id, hashed),
        )
        self.connection.commit()
        result = catalog.public_votes_snapshot(self.connection)
        self.assertEqual(result["votes"][-1], {"cultivar_slug": "polka", "count": 1})
        encoded = json.dumps(result)
        self.assertNotIn(token, encoded)
        self.assertNotIn(hashed, encoded)
        self.assertNotIn("voter", encoded)
        self.connection.execute("UPDATE cultivars SET editorial_status='withdrawn' WHERE slug='polka'")
        self.assertNotIn("polka", json.dumps(catalog.public_votes_snapshot(self.connection)))
        self.connection.execute("UPDATE sources SET review_status='rejected'")
        self.assertEqual(catalog.public_votes_snapshot(self.connection)["votes"], [])

    def test_storage_enforces_uniqueness_foreign_key_and_hash_shape(self):
        parameters = (self.cultivar_id, "f" * 64)
        self.connection.execute("INSERT INTO cultivar_votes(cultivar_id, voter_hash) VALUES (?, ?)", parameters)
        for parameters in [parameters, (9999, "a" * 64), (self.cultivar_id, "bad")]:
            with self.assertRaises(sqlite3.IntegrityError):
                self.connection.execute("INSERT INTO cultivar_votes(cultivar_id, voter_hash) VALUES (?, ?)", parameters)

    def test_missing_database_does_not_produce_a_successful_export(self):
        output = Path(self.temp.name) / "missing.json"
        with contextlib.redirect_stderr(io.StringIO()):
            status = catalog.main(["export-votes", "--db", str(self.path.with_suffix(".missing")), "--out", str(output)])
        self.assertEqual(status, 1)
        self.assertFalse(output.exists())


if __name__ == "__main__":
    unittest.main()
