"""Gossort-backed catalog facts and admissions for Pohvalinka."""

from __future__ import annotations

import sys
import tempfile
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
import catalog  # noqa: E402


class PohvalinkaCatalogTests(unittest.TestCase):
    def setUp(self) -> None:
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.connection = catalog.connect(Path(self.temp.name) / "catalog.sqlite3", create=True)
        self.addCleanup(self.connection.close)
        catalog.migrate(self.connection)

    def test_official_facts_keep_source_and_context(self) -> None:
        snapshot = catalog.public_snapshot(self.connection)
        cultivar = next(row for row in snapshot["cultivars"] if row["slug"] == "pohvalinka")
        self.assertEqual(cultivar["crop_slug"], "raspberry")
        self.assertEqual(cultivar["canonical_name"], "Похвалинка")

        facts = {row["trait_code"]: row for row in cultivar["observations"]}
        self.assertEqual(set(facts), {
            "fruit_color", "fruiting_cycle", "maturity_period", "berry_weight_g", "flavor", "yield"
        })
        self.assertEqual(facts["fruit_color"]["value_text"], "Красная")
        self.assertEqual(facts["fruiting_cycle"]["value_text"], "Ремонтантная")
        self.assertEqual(facts["maturity_period"]["value_text"], "Среднего срока")
        self.assertEqual(facts["berry_weight_g"]["value_number"], 6.4)
        self.assertEqual(facts["berry_weight_g"]["value_max"], 10.5)
        self.assertEqual(facts["yield"]["value_text"], "194 ц/га по данным заявителя")
        self.assertEqual(facts["yield"]["value_number"], 194)
        self.assertIsNone(facts["yield"]["value_max"])
        for fact in facts.values():
            self.assertEqual(fact["source_key"], "pohvalinka-gossort-description")
            self.assertTrue(fact["evidence"])

    def test_register_admission_is_all_twelve_regions_not_local_recommendation(self) -> None:
        cultivar = next(
            row for row in catalog.public_snapshot(self.connection)["cultivars"]
            if row["slug"] == "pohvalinka"
        )
        self.assertEqual(
            [row["admission_region_number"] for row in cultivar["admissions"]],
            list(range(1, 13)),
        )
        self.assertTrue(all(row["registry_entry_code"] == "8456207" for row in cultivar["admissions"]))
        self.assertTrue(all(row["admitted_year"] == 2019 for row in cultivar["admissions"]))
        self.assertTrue(all(row["source_pdf_page"] == 418 for row in cultivar["admissions"]))
        self.assertEqual(cultivar["recommendations"], [])

    def test_illustration_matches_red_raspberry_and_is_rights_tracked(self) -> None:
        row = self.connection.execute(
            "SELECT m.asset_path, m.alt_text, m.rights_basis, m.rights_note "
            "FROM public_media m JOIN public_cultivars c ON c.id=m.cultivar_id "
            "WHERE c.slug='pohvalinka'"
        ).fetchone()
        self.assertEqual(row["asset_path"], "/assets/variety-pohvalinka.webp")
        self.assertIn("красной малины", row["alt_text"])
        self.assertEqual(row["rights_basis"], "owned")
        self.assertIn("не фотография сорта", row["rights_note"])


if __name__ == "__main__":
    unittest.main()
