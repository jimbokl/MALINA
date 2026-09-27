"""Trial results and admissions for eight raspberry and strawberry cultivars."""

from __future__ import annotations

import sys
import tempfile
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
import catalog  # noqa: E402


class VerifiedVarietyTrialsTests(unittest.TestCase):
    def setUp(self) -> None:
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.connection = catalog.connect(Path(self.temp.name) / "catalog.sqlite3", create=True)
        self.addCleanup(self.connection.close)
        catalog.migrate(self.connection)
        self.snapshot = catalog.public_snapshot(self.connection)
        self.cultivars = {row["slug"]: row for row in self.snapshot["cultivars"]}

    def test_yubileinaya_keeps_plot_yield_separate_from_bush_productivity(self) -> None:
        facts = {row["trait_code"]: row for row in self.cultivars["yubileinaya-kulikova"]["observations"]}
        self.assertEqual(facts["yield"]["value_number"], 16.2)
        self.assertEqual(facts["yield"]["unit"], "т/га")
        self.assertEqual(facts["plant_productivity_g"]["value_number"], 2750.2)
        self.assertEqual(facts["plant_productivity_g"]["unit"], "г/куст")
        self.assertEqual((facts["berry_weight_g"]["value_number"], facts["berry_weight_g"]["value_max"]), (4.7, 7.7))
        for fact in facts.values():
            self.assertEqual(fact["source_key"], "raspberry-kokino-trial-2020-2023")
            self.assertTrue(fact["evidence"]["source_locator"])
            self.assertEqual(fact["evidence"]["place_text"], "Кокино, Брянская область")

    def test_strawberry_trial_values_and_rusich_table_average_are_preserved(self) -> None:
        expected = {
            "vityaz": (22.5, 380.5), "slavutich": (15.7, 310.3),
            "rusich": (21.6, 349.5), "alfa": (21.1, 612.7),
            "solovushka": (29.7, 579.3),
        }
        for slug, (yield_t_ha, productivity_g) in expected.items():
            facts = {row["trait_code"]: row for row in self.cultivars[slug]["observations"]
                     if row["source_key"] == "strawberry-kokino-trial-2006-2007"}
            self.assertEqual(facts["yield"]["value_number"], yield_t_ha)
            self.assertEqual(facts["plant_productivity_g"]["value_number"], productivity_g)
            self.assertTrue(all(row["evidence"]["source_locator"] for row in facts.values()))
        rusich = {row["trait_code"]: row for row in self.cultivars["rusich"]["observations"]
                  if row["source_key"] == "strawberry-kokino-trial-2006-2007"}
        self.assertIn("21,1", rusich["yield"]["evidence"]["limitations_note"])

    def test_admissions_are_separate_and_no_region_is_invented_for_solovushka(self) -> None:
        expected_regions = {
            "salyut": {3}, "yubileinaya-kulikova": {3}, "vityaz": {2, 3, 4, 7},
            "slavutich": {3, 7}, "rusich": {3, 7}, "alfa": {3}, "arisha": {9},
        }
        for slug, regions in expected_regions.items():
            cultivar = self.cultivars[slug]
            self.assertEqual({row["admission_region_number"] for row in cultivar["admissions"]}, regions)
            if slug == "salyut":
                self.assertEqual(
                    {row["region_code"] for row in cultivar["recommendations"]},
                    {"bryansk-oblast"},
                )
            else:
                self.assertEqual(cultivar["recommendations"], [])
        self.assertEqual(self.cultivars["solovushka"]["admissions"], [])
        self.assertEqual(
            {row["region_code"] for row in self.cultivars["solovushka"]["recommendations"]},
            {"bryansk-oblast"},
        )

    def test_medvezhonok_cycle_uses_trial_and_keeps_old_nursery_claim_out_of_public_data(self) -> None:
        facts = [row for row in self.cultivars["medvezhonok"]["observations"]
                 if row["trait_code"] == "fruiting_cycle"]
        self.assertEqual(len(facts), 1)
        self.assertEqual(facts[0]["value_text"], "Ремонтантная")
        self.assertEqual(facts[0]["source_key"], "raspberry-kokino-trial-2020-2023")
        self.assertTrue(facts[0]["evidence"]["source_locator"])
        rejected = self.connection.execute(
            "SELECT count(*) FROM trait_observations o "
            "JOIN cultivars c ON c.id=o.cultivar_id "
            "JOIN sources s ON s.id=o.source_id "
            "WHERE c.slug='medvezhonok' AND o.trait_code='fruiting_cycle' "
            "AND o.value_text='Летняя' AND o.review_status='rejected' "
            "AND s.source_key='fnc-raspberry-nursery-2026'"
        ).fetchone()[0]
        self.assertEqual(rejected, 1)


if __name__ == "__main__":
    unittest.main()
