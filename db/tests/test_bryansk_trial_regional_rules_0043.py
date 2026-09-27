"""Bryansk selection rules require reviewed local trials, not register admission."""

from __future__ import annotations

import sys
import tempfile
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
import catalog  # noqa: E402


class BryanskTrialRegionalRulesTests(unittest.TestCase):
    def setUp(self) -> None:
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.connection = catalog.connect(Path(self.temp.name) / "catalog.sqlite3", create=True)
        self.addCleanup(self.connection.close)
        catalog.migrate(self.connection)

    def test_both_crops_have_bryansk_trial_rules_with_passports(self) -> None:
        snapshot = catalog.public_snapshot(self.connection)
        cultivars = {row["slug"]: row for row in snapshot["cultivars"]}
        expected = {
            "salyut": ("raspberry-kokino-trial-2020-2023", "2020", "2023"),
            "solovushka": ("strawberry-kokino-trial-2006-2007", "2006", "2008"),
        }
        for slug, (source_key, period_from, period_to) in expected.items():
            with self.subTest(slug=slug):
                recommendations = cultivars[slug]["recommendations"]
                self.assertEqual(len(recommendations), 1)
                rule = recommendations[0]
                self.assertEqual(rule["region_code"], "bryansk-oblast")
                self.assertEqual(rule["conditions_json"], "{}")
                self.assertEqual(rule["source_key"], source_key)
                self.assertEqual(rule["basis_source_key"], source_key)
                self.assertEqual(rule["basis_kind"], "regional_trial")
                self.assertEqual(rule["basis_place"], "Кокино, Брянская область")
                self.assertTrue(rule["basis_source_locator"])
                self.assertTrue(rule["basis_conditions"])
                self.assertTrue(rule["basis_limitations"])
                self.assertEqual(rule["evidence"]["evidence_kind"], "published_study")
                self.assertEqual(rule["evidence"]["place_text"], "Кокино, Брянская область")
                self.assertEqual(
                    (rule["evidence"]["period_from"], rule["evidence"]["period_to"]),
                    (period_from, period_to),
                )
                self.assertTrue(rule["evidence"]["source_locator"])
                self.assertTrue(rule["evidence"]["limitations_note"])

        # Solovushka has trial evidence without a recorded register admission.
        self.assertEqual(cultivars["solovushka"]["admissions"], [])
        self.assertEqual(
            self.connection.execute(
                "SELECT count(*) FROM public_recommendations "
                "WHERE basis_source_key IN "
                "('raspberry-kokino-trial-2020-2023', "
                "'strawberry-kokino-trial-2006-2007') "
                "AND region_code != 'bryansk-oblast'"
            ).fetchone()[0],
            0,
        )

    def test_unverified_trial_basis_hides_rule_even_with_verified_recommendation(self) -> None:
        for source_key in (
            "raspberry-kokino-trial-2020-2023",
            "strawberry-kokino-trial-2006-2007",
        ):
            with self.subTest(source_key=source_key):
                self.connection.execute("SAVEPOINT trial_basis")
                self.connection.execute(
                    "UPDATE regional_evidence SET review_status='draft' "
                    "WHERE source_id=(SELECT id FROM sources WHERE source_key=?)",
                    (source_key,),
                )
                count = self.connection.execute(
                    "SELECT count(*) FROM public_recommendations "
                    "WHERE basis_source_key=?", (source_key,)
                ).fetchone()[0]
                self.assertEqual(count, 0)
                self.connection.execute("ROLLBACK TO trial_basis")
                self.connection.execute("RELEASE trial_basis")

                self.connection.execute("SAVEPOINT trial_source")
                self.connection.execute(
                    "UPDATE sources SET review_status='rejected' WHERE source_key=?",
                    (source_key,),
                )
                count = self.connection.execute(
                    "SELECT count(*) FROM public_recommendations "
                    "WHERE basis_source_key=?", (source_key,)
                ).fetchone()[0]
                self.assertEqual(count, 0)
                self.connection.execute("ROLLBACK TO trial_source")
                self.connection.execute("RELEASE trial_source")


if __name__ == "__main__":
    unittest.main()
