"""Moscow measurements retain trial context without becoming recommendation rules."""

from __future__ import annotations

import contextlib
import io
import json
import sys
import tempfile
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
import catalog  # noqa: E402


RASPBERRY_SOURCE = "mgau-volokolamsk-raspberry-comparison-2023-2024"
FERTIGATION_SOURCE = "kubansad-moscow-strawberry-fertigation-2010-2012"
KLERI_SOURCE = "kgau-kleri-kolomna-fruit-quality-2022-2023"
OLDER_SOURCE = "vniispk-strawberry-moscow-comparison-2006-2007"
SOURCES = (RASPBERRY_SOURCE, FERTIGATION_SOURCE, KLERI_SOURCE)


class MoscowTrialObservations0055Tests(unittest.TestCase):
    def setUp(self) -> None:
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.connection = catalog.connect(Path(self.temp.name) / "catalog.sqlite3", create=True)
        self.addCleanup(self.connection.close)
        with contextlib.redirect_stdout(io.StringIO()):
            catalog.migrate(self.connection)
        self.cultivars = {
            row["slug"]: row for row in catalog.public_snapshot(self.connection)["cultivars"]
        }

    def find_observation(self, slug: str, source_key: str, trait: str) -> dict:
        matches = [
            row for row in self.cultivars[slug]["observations"]
            if row["source_key"] == source_key and row["trait_code"] == trait
        ]
        self.assertEqual(len(matches), 1, (slug, source_key, trait))
        return matches[0]

    def test_raspberry_yield_and_berry_weight_remain_separate_measurements(self) -> None:
        expected = {"yield": (10.5, "т/га"), "berry_weight_g": (3.7, "г")}
        for trait, (value, unit) in expected.items():
            with self.subTest(trait=trait):
                row = self.find_observation("zolotye-kupola", RASPBERRY_SOURCE, trait)
                self.assertEqual((row["value_number"], row["value_max"], row["unit"]), (value, None, unit))
                self.assertEqual(row["region_code"], "moscow-oblast")
                evidence = row["evidence"]
                self.assertEqual((evidence["period_from"], evidence["period_to"]), ("2023", "2024"))
                self.assertIn("Волоколамск", evidence["place_text"])
                self.assertEqual(json.loads(evidence["conditions_json"])["comparison_control"], "Бабье лето")
                if trait == "berry_weight_g":
                    self.assertEqual(json.loads(evidence["conditions_json"])["values_by_year_g"],
                                     {"2023": 3.8, "2024": 3.6})

    def test_kleri_berry_weight_preserves_kolomna_period_and_crop(self) -> None:
        row = self.find_observation("kleri", KLERI_SOURCE, "berry_weight_g")
        self.assertEqual(self.cultivars["kleri"]["crop_slug"], "strawberry")
        self.assertEqual((row["value_number"], row["value_max"], row["unit"]), (18.0, None, "г"))
        self.assertEqual(row["region_code"], "moscow-oblast")
        evidence = row["evidence"]
        self.assertEqual((evidence["period_from"], evidence["period_to"]), ("2022", "2023"))
        self.assertIn("Колом", evidence["place_text"])
        conditions = json.loads(evidence["conditions_json"])
        self.assertEqual(conditions["planting_year"], 2022)
        self.assertEqual(conditions["spacing_m"], [2.0, 0.3])
        self.assertEqual(conditions["mulch_density_g_m2"], 120)
        self.assertTrue(conditions["soil"])
        self.assertEqual(evidence["sample_size"], 30)
        self.assertIn("±3,3", evidence["uncertainty_text"])

    def test_strawberry_yield_ranges_and_older_comparison_keep_distinct_contexts(self) -> None:
        expected = [
            ("honey", FERTIGATION_SOURCE, 85.0, 162.2, "2010", "2012"),
            ("rusich", FERTIGATION_SOURCE, 55.6, 100.3, "2010", "2012"),
            ("rusich", OLDER_SOURCE, 148.3, None, "2006", "2007"),
            ("zenga-zengana", OLDER_SOURCE, 127.5, None, "2006", "2007"),
        ]
        for slug, source, low, high, period_from, period_to in expected:
            with self.subTest(cultivar=slug, source=source):
                row = self.find_observation(slug, source, "yield")
                self.assertEqual(self.cultivars[slug]["crop_slug"], "strawberry")
                self.assertEqual((row["value_number"], row["value_max"], row["unit"]), (low, high, "ц/га"))
                self.assertEqual(row["region_code"], "moscow-oblast")
                evidence = row["evidence"]
                self.assertEqual((evidence["period_from"], evidence["period_to"]), (period_from, period_to))
                self.assertIn("Московск", evidence["place_text"])
                conditions = json.loads(evidence["conditions_json"])
                if source == FERTIGATION_SOURCE:
                    self.assertEqual(conditions["planting_year"], 2009)
                    self.assertEqual(conditions["plant_density_per_ha"], 80000)
                    self.assertEqual(conditions["rows_per_bed"], 4)
                    self.assertEqual(conditions["treatment_count"], 6)
                    self.assertTrue(conditions["soil"])
                    self.assertIn("трёх годовых значений", evidence["method_text"])
                    self.assertIn("усреднены по шести вариантам", row["context_text"])
                else:
                    self.assertEqual(conditions["planting_year"], 2004)

    def test_reviewed_passports_include_conditions_and_do_not_create_regional_rules(self) -> None:
        observations = [
            row for cultivar in self.cultivars.values() for row in cultivar["observations"]
            if row["source_key"] in SOURCES
        ]
        self.assertEqual(len(observations), 5)
        for row in observations:
            with self.subTest(source=row["source_key"], trait=row["trait_code"]):
                self.assertEqual(row["region_code"], "moscow-oblast")
                self.assertTrue(row["source_url"].startswith("https://"))
                self.assertTrue(row["source_title"])
                evidence = row["evidence"]
                self.assertEqual(evidence["evidence_kind"], "published_study")
                self.assertEqual((evidence["period_from"] is not None, evidence["period_to"] is not None), (True, True))
                for field in ("setting_text", "place_text", "method_text", "source_locator",
                              "uncertainty_text", "applicability_note", "limitations_note", "reviewed_at"):
                    self.assertTrue(evidence[field] and evidence[field].strip(), field)
                self.assertIsInstance(json.loads(evidence["conditions_json"]), dict)
        for source in SOURCES:
            with self.subTest(source=source):
                self.assertEqual(self.connection.execute(
                    "SELECT count(*) FROM recommendation_rules WHERE source_id="
                    "(SELECT id FROM sources WHERE source_key=?)", (source,)
                ).fetchone()[0], 0)

    def test_unpublished_source_disappears_from_public_export_without_losing_other_trials(self) -> None:
        for source in SOURCES:
            with self.subTest(source=source):
                self.connection.execute("SAVEPOINT unreviewed_source")
                self.connection.execute(
                    "UPDATE sources SET review_status='draft' WHERE source_key=?", (source,)
                )
                observations = [
                    row for cultivar in catalog.public_snapshot(self.connection)["cultivars"]
                    for row in cultivar["observations"]
                ]
                self.assertFalse(any(row["source_key"] == source for row in observations))
                for remaining in SOURCES:
                    if remaining != source:
                        self.assertTrue(any(row["source_key"] == remaining for row in observations))
                self.assertGreater(self.connection.execute(
                    "SELECT count(*) FROM trait_observations WHERE source_id="
                    "(SELECT id FROM sources WHERE source_key=?)", (source,)
                ).fetchone()[0], 0)
                self.connection.execute("ROLLBACK TO unreviewed_source")
                self.connection.execute("RELEASE unreviewed_source")


if __name__ == "__main__":
    unittest.main()
