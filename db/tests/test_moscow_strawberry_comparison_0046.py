"""The VNIISPK comparison remains a measured, place-unassigned trial result."""

from __future__ import annotations

import contextlib
import io
import sys
import tempfile
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
import catalog  # noqa: E402


SOURCE_KEY = "vniispk-strawberry-moscow-comparison-2006-2007"
SOURCE_URL = "https://vniispk.ru/pages/activities/science-activities/conference-2008/publ-2008-25"


class MoscowStrawberryComparison0046Tests(unittest.TestCase):
    def setUp(self) -> None:
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.connection = catalog.connect(Path(self.temp.name) / "catalog.sqlite3", create=True)
        self.addCleanup(self.connection.close)
        with contextlib.redirect_stdout(io.StringIO()):
            catalog.migrate(self.connection)

    def test_export_keeps_both_yields_in_the_same_trial_context(self) -> None:
        cultivars = {
            row["slug"]: row for row in catalog.public_snapshot(self.connection)["cultivars"]
        }
        expected = {"rusich": 148.3, "zenga-zengana": 127.5}
        for slug, value in expected.items():
            with self.subTest(cultivar=slug):
                matches = [
                    row for row in cultivars[slug]["observations"]
                    if row["trait_code"] == "yield" and row["source_key"] == SOURCE_KEY
                ]
                self.assertEqual(len(matches), 1)
                observation = matches[0]
                self.assertEqual((observation["value_number"], observation["unit"]), (value, "ц/га"))
                self.assertIsNone(observation["region_code"])
                self.assertEqual(observation["source_url"], SOURCE_URL)
                evidence = observation["evidence"]
                self.assertEqual(evidence["evidence_kind"], "published_study")
                self.assertEqual((evidence["period_from"], evidence["period_to"]), ("2006", "2007"))
                self.assertIn("посадки 2004 года", evidence["setting_text"])
                self.assertIn("точный участок не назван", evidence["place_text"])
                self.assertIn("Таблица", evidence["source_locator"])
                self.assertIn("число повторностей", evidence["uncertainty_text"])
                self.assertIn("не задаёт правило", evidence["limitations_note"])

        self.assertIn("116,7 ц/га", next(row for row in cultivars["rusich"]["observations"]
                                             if row["source_key"] == SOURCE_KEY)["context_text"])
        self.assertIn("136,5 ц/га", next(row for row in cultivars["zenga-zengana"]["observations"]
                                             if row["source_key"] == SOURCE_KEY)["context_text"])

    def test_no_regional_rule_and_source_review_controls_publication(self) -> None:
        self.assertEqual(
            self.connection.execute(
                "SELECT count(*) FROM recommendation_rules WHERE source_id="
                "(SELECT id FROM sources WHERE source_key=?)", (SOURCE_KEY,)
            ).fetchone()[0],
            0,
        )
        self.assertEqual(
            self.connection.execute(
                "SELECT count(*) FROM regional_evidence WHERE source_id="
                "(SELECT id FROM sources WHERE source_key=?)", (SOURCE_KEY,)
            ).fetchone()[0],
            0,
        )
        self.connection.execute("SAVEPOINT unreviewed_trial")
        self.connection.execute(
            "UPDATE sources SET review_status='draft' WHERE source_key=?", (SOURCE_KEY,)
        )
        self.assertEqual(
            self.connection.execute(
                "SELECT count(*) FROM public_observations WHERE source_key=?", (SOURCE_KEY,)
            ).fetchone()[0],
            0,
        )
        self.connection.execute("ROLLBACK TO unreviewed_trial")
        self.connection.execute("RELEASE unreviewed_trial")


if __name__ == "__main__":
    unittest.main()
