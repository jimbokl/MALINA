"""Official admissions and Orenburg field observations for three cultivars."""

from __future__ import annotations

import sys
import tempfile
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
import catalog  # noqa: E402


class OrenburgStrawberryTrialTests(unittest.TestCase):
    def setUp(self) -> None:
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.connection = catalog.connect(Path(self.temp.name) / "catalog.sqlite3", create=True)
        self.addCleanup(self.connection.close)
        catalog.migrate(self.connection)

    def test_study_observations_keep_place_period_units_and_source_locators(self) -> None:
        rows = self.connection.execute(
            "SELECT c.slug, o.trait_code, o.value_text, o.value_number, o.unit, "
            "o.source_key, e.place_text, e.period_from, e.period_to, e.source_locator "
            "FROM public_observations o "
            "JOIN public_cultivars c ON c.id=o.cultivar_id "
            "JOIN public_evidence_passports e ON e.observation_id=o.id "
            "WHERE c.slug IN ('darenka','zenga-zengana','desnyanka-kokinskaya') "
            "AND o.source_key='strawberry-orenburg-trial-2020-2021'"
        ).fetchall()
        facts = {(row[0], row[1], row[9]): tuple(row[2:9]) for row in rows}

        self.assertEqual(facts[("darenka", "yield", "Реферат и таблица 5")][:4],
                         (None, 10.3, "т/га", "strawberry-orenburg-trial-2020-2021"))
        self.assertEqual(facts[("zenga-zengana", "berries_per_plant", "Таблица 3, среднее за 2020–2021 гг.")][:4],
                         (None, 25.8, "шт./куст", "strawberry-orenburg-trial-2020-2021"))
        self.assertEqual(facts[("desnyanka-kokinskaya", "winter_hardiness", "Таблица 1, среднее за 2020–2021 гг.")][:4],
                         ("Степень подмерзания — 1,3 балла", None, None, "strawberry-orenburg-trial-2020-2021"))
        self.assertTrue(all(row[4:7] == ("Оренбургская область", "2020", "2021") for row in facts.values()))

    def test_official_admissions_keep_registry_ids_separate_from_local_trial_rules(self) -> None:
        expected = {
            "darenka": ("9705077", 2004, {3, 4, 10, 11}),
            "zenga-zengana": ("6950361", 1972, {2, 3, 4, 5, 6, 7, 8, 9}),
            "desnyanka-kokinskaya": ("7404999", 1985, {4, 10}),
        }
        for slug, (entry_code, admitted_year, regions) in expected.items():
            rows = self.connection.execute(
                "SELECT admission_region_number, registry_entry_code, admitted_year, "
                "edition_as_of, source_pdf_page, source_url "
                "FROM public_official_admissions a JOIN public_cultivars c ON c.id=a.cultivar_id "
                "WHERE c.slug=? ORDER BY admission_region_number", (slug,)
            ).fetchall()
            self.assertEqual({row[0] for row in rows}, regions)
            self.assertTrue(all(row[1:5] == (entry_code, admitted_year, "2024-05-31", 414) for row in rows))
            self.assertTrue(all("gossortrf.ru" in row[5] for row in rows))
            recommendations = self.connection.execute(
                "SELECT r.region_code, r.basis_kind, r.basis_source_key "
                "FROM public_recommendations r "
                "JOIN public_cultivars c ON c.id=r.cultivar_id WHERE c.slug=?", (slug,)
            ).fetchall()
            if slug == "desnyanka-kokinskaya":
                self.assertEqual([tuple(row) for row in recommendations], [(
                    "orenburg-oblast", "regional_trial", "strawberry-orenburg-trial-2020-2021"
                )])
            else:
                self.assertEqual(recommendations, [])

    def test_illustrations_are_strawberry_assets_with_provenance(self) -> None:
        rows = self.connection.execute(
            "SELECT c.slug, m.asset_path, m.alt_text, m.rights_basis "
            "FROM public_media m JOIN public_cultivars c ON c.id=m.cultivar_id "
            "WHERE c.slug IN ('darenka','zenga-zengana','desnyanka-kokinskaya')"
        ).fetchall()
        self.assertEqual({row[0] for row in rows}, {"darenka", "zenga-zengana", "desnyanka-kokinskaya"})
        for slug, path, alt_text, rights_basis in rows:
            self.assertEqual(path, f"/assets/variety-{slug}.webp")
            self.assertIn("Иллюстрация клубники", alt_text)
            self.assertEqual(rights_basis, "owned")

        result = catalog.check(self.connection)
        self.assertEqual(result["integrity"], "ok")
        self.assertEqual(result["foreign_key_errors"], 0)


if __name__ == "__main__":
    unittest.main()
