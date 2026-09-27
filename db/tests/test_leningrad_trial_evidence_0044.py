"""Field observations must remain narrower than a regional promise."""

from __future__ import annotations

import sys
import tempfile
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
import catalog  # noqa: E402


class LeningradTrialEvidenceTests(unittest.TestCase):
    def setUp(self) -> None:
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.connection = catalog.connect(Path(self.temp.name) / "catalog.sqlite3", create=True)
        self.addCleanup(self.connection.close)
        catalog.migrate(self.connection)

    def test_samohval_rule_has_local_basis_and_passport(self) -> None:
        row = self.connection.execute(
            "SELECT r.region_code, r.basis_kind, r.basis_place, "
            "r.basis_source_locator, r.basis_conditions, r.basis_limitations, "
            "r.source_key, r.basis_source_key, e.evidence_kind, "
            "e.period_from, e.period_to, e.place_text "
            "FROM public_recommendations r "
            "JOIN cultivars c ON c.id=r.cultivar_id "
            "JOIN public_evidence_passports e ON e.recommendation_id=r.id "
            "WHERE c.slug='samohval' AND r.region_code='leningrad-oblast'"
        ).fetchone()
        self.assertIsNotNone(row)
        self.assertEqual(row["basis_kind"], "regional_trial")
        self.assertIn("Гатчинском районе", row["basis_place"])
        self.assertEqual(row["source_key"], "spbgau-remontant-leningrad-2022")
        self.assertEqual(row["basis_source_key"], row["source_key"])
        self.assertIn("таблица 4", row["basis_source_locator"])
        self.assertIn("1,5 × 0,7", row["basis_conditions"])
        self.assertIn("одном", row["basis_limitations"])
        self.assertEqual(row["evidence_kind"], "published_study")
        self.assertEqual((row["period_from"], row["period_to"]), ("2019", "2021"))
        self.assertIn("Гатчинский район", row["place_text"])

    def test_strawberry_measured_result_is_not_a_regional_rule(self) -> None:
        row = self.connection.execute(
            "SELECT o.value_number, o.unit, o.region_code, o.source_key, "
            "e.place_text, e.period_from, e.period_to, e.source_locator "
            "FROM public_observations o "
            "JOIN cultivars c ON c.id=o.cultivar_id "
            "JOIN public_evidence_passports e ON e.observation_id=o.id "
            "WHERE c.slug='bereginya' AND o.trait_code='yield' "
            "AND o.source_key='spbgau-strawberry-comparison-2014'"
        ).fetchone()
        self.assertIsNotNone(row)
        self.assertEqual((row["value_number"], row["unit"]), (18.0, "т/га"))
        self.assertIsNone(row["region_code"])
        self.assertIn("учебно-опытный сад", row["place_text"].lower())
        self.assertEqual((row["period_from"], row["period_to"]), ("2014", "2014"))
        self.assertIn("таблица 2", row["source_locator"])
        self.assertEqual(
            self.connection.execute(
                "SELECT count(*) FROM public_recommendations r "
                "JOIN cultivars c ON c.id=r.cultivar_id "
                "WHERE c.slug='bereginya' AND r.region_code='leningrad-oblast'"
            ).fetchone()[0],
            0,
        )

    def test_unverified_basis_or_passport_is_hidden(self) -> None:
        self.connection.execute("SAVEPOINT uncertain_basis")
        self.connection.execute(
            "UPDATE regional_evidence SET review_status='draft' "
            "WHERE source_id=(SELECT id FROM sources "
            "WHERE source_key='spbgau-remontant-leningrad-2022')"
        )
        self.assertEqual(
            self.connection.execute(
                "SELECT count(*) FROM public_recommendations r "
                "JOIN cultivars c ON c.id=r.cultivar_id "
                "WHERE c.slug='samohval' AND r.region_code='leningrad-oblast'"
            ).fetchone()[0],
            0,
        )
        self.connection.execute("ROLLBACK TO uncertain_basis")
        self.connection.execute("RELEASE uncertain_basis")

        self.connection.execute("SAVEPOINT uncertain_strawberry")
        self.connection.execute(
            "UPDATE sources SET review_status='draft' "
            "WHERE source_key='spbgau-strawberry-comparison-2014'"
        )
        self.assertEqual(
            self.connection.execute(
                "SELECT count(*) FROM public_observations "
                "WHERE source_key='spbgau-strawberry-comparison-2014'"
            ).fetchone()[0],
            0,
        )
        self.connection.execute("ROLLBACK TO uncertain_strawberry")
        self.connection.execute("RELEASE uncertain_strawberry")


if __name__ == "__main__":
    unittest.main()
