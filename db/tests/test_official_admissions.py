"""Official State Register admissions are traceable and remain distinct from recommendations."""

from __future__ import annotations

import sys
import tempfile
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
import catalog  # noqa: E402


class OfficialAdmissionTests(unittest.TestCase):
    def setUp(self) -> None:
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.connection = catalog.connect(Path(self.temp.name) / "catalog.sqlite3", create=True)
        self.addCleanup(self.connection.close)
        catalog.migrate(self.connection)

    def test_new_admissions_match_register_codes_zones_and_pdf_pages(self) -> None:
        expected = {
            "bereginya": ("9253565", 2012, {3}, 414),
            "kleri": ("9463230", 2022, {6}, 414),
            "honey": ("9359371", 2013, {2, 3, 5, 6}, 415),
            "tsaritsa": ("9705623", 2009, {3}, 415),
            "karamelka": ("8757408", 2016, set(range(1, 13)), 418),
            "kimberli": ("9154051", 2013, {3, 5}, 414),
            "samohval": ("8456205", 2019, set(range(1, 13)), 419),
        }
        snapshot = catalog.public_snapshot(self.connection)
        by_slug = {row["slug"]: row for row in snapshot["cultivars"]}

        for slug, (entry_code, admitted_year, zones, pdf_page) in expected.items():
            with self.subTest(slug=slug):
                cultivar = by_slug[slug]
                admissions = cultivar["admissions"]
                self.assertEqual(
                    {row["admission_region_number"] for row in admissions}, zones
                )
                self.assertTrue(admissions)
                self.assertEqual({row["registry_entry_code"] for row in admissions}, {entry_code})
                self.assertEqual({row["admitted_year"] for row in admissions}, {admitted_year})
                self.assertEqual({row["edition_as_of"] for row in admissions}, {"2024-05-31"})
                self.assertEqual({row["source_pdf_page"] for row in admissions}, {pdf_page})
                self.assertTrue(all("gossortrf.ru/upload/" in row["source_url"] for row in admissions))
                self.assertTrue(all(entry_code in row["source_locator"] for row in admissions))
                if slug == "samohval":
                    self.assertEqual(
                        [rule["region_code"] for rule in cultivar["recommendations"]],
                        ["leningrad-oblast"],
                    )
                else:
                    self.assertEqual(cultivar["recommendations"], [])


if __name__ == "__main__":
    unittest.main()
