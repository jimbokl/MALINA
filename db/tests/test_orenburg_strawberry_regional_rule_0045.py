"""The Orenburg strawberry trial supports one place-bound selection rule."""

from __future__ import annotations

import contextlib
import io
import sys
import tempfile
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
import catalog  # noqa: E402


class OrenburgStrawberryRegionalRuleTests(unittest.TestCase):
    def setUp(self) -> None:
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.connection = catalog.connect(Path(self.temp.name) / "catalog.sqlite3", create=True)
        self.addCleanup(self.connection.close)
        with contextlib.redirect_stdout(io.StringIO()):
            catalog.migrate(self.connection)

    def test_rule_matches_only_desnyanka_in_orenburg(self) -> None:
        snapshot = catalog.public_snapshot(self.connection)
        cultivars = {row["slug"]: row for row in snapshot["cultivars"]}
        rules = cultivars["desnyanka-kokinskaya"]["recommendations"]
        self.assertEqual(len(rules), 1)
        rule = rules[0]
        self.assertEqual(rule["region_code"], "orenburg-oblast")
        self.assertEqual(rule["basis_kind"], "regional_trial")
        self.assertEqual(rule["source_key"], "strawberry-orenburg-trial-2020-2021")
        self.assertEqual(rule["basis_source_key"], rule["source_key"])
        self.assertIn("4 км восточнее", rule["basis_place"])
        self.assertIn("южный чернозём", rule["basis_conditions"])
        self.assertIn("таблица 1", rule["basis_source_locator"])
        self.assertIn("таблица 5", rule["basis_source_locator"])
        self.assertEqual(rule["evidence"]["evidence_kind"], "published_study")
        self.assertEqual(
            (rule["evidence"]["period_from"], rule["evidence"]["period_to"]),
            ("2020", "2021"),
        )

        # Existing measurements for another cultivar do not silently become a
        # recommendation, and this locality must not match another region.
        self.assertEqual(cultivars["darenka"]["recommendations"], [])
        self.assertEqual(
            self.connection.execute(
                "SELECT count(*) FROM public_recommendations r "
                "JOIN cultivars c ON c.id=r.cultivar_id "
                "WHERE c.slug='desnyanka-kokinskaya' "
                "AND r.region_code != 'orenburg-oblast'"
            ).fetchone()[0],
            0,
        )

    def test_unverified_trial_or_register_basis_cannot_publish_rule(self) -> None:
        for mutation in (
            "UPDATE sources SET review_status='draft' "
            "WHERE source_key='strawberry-orenburg-trial-2020-2021'",
            "UPDATE regional_evidence SET review_status='draft' "
            "WHERE source_id=(SELECT id FROM sources "
            "WHERE source_key='strawberry-orenburg-trial-2020-2021')",
            "UPDATE regional_evidence SET basis_kind='state_register_admission' "
            "WHERE source_id=(SELECT id FROM sources "
            "WHERE source_key='strawberry-orenburg-trial-2020-2021')",
        ):
            with self.subTest(mutation=mutation):
                self.connection.execute("SAVEPOINT evidence_gate")
                self.connection.execute(mutation)
                self.assertEqual(
                    self.connection.execute(
                        "SELECT count(*) FROM public_recommendations r "
                        "JOIN cultivars c ON c.id=r.cultivar_id "
                        "WHERE c.slug='desnyanka-kokinskaya' "
                        "AND r.region_code='orenburg-oblast'"
                    ).fetchone()[0],
                    0,
                )
                self.connection.execute("ROLLBACK TO evidence_gate")
                self.connection.execute("RELEASE evidence_gate")


if __name__ == "__main__":
    unittest.main()
