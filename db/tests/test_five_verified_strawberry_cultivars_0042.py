"""Russian-register and field-trial records for five strawberry cultivars."""

from __future__ import annotations

import sys
import tempfile
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
import catalog  # noqa: E402


class FiveVerifiedStrawberryCultivarsTests(unittest.TestCase):
    def setUp(self) -> None:
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.connection = catalog.connect(Path(self.temp.name) / "catalog.sqlite3", create=True)
        self.addCleanup(self.connection.close)
        catalog.migrate(self.connection)

    def test_exact_register_records_and_admission_regions(self) -> None:
        expected = {
            "divnaya": ("9204342", 2004, {2}, 414),
            "tsarskoselskaya": ("9204369", 2002, {3}, 415),
            "sudarushka": ("9204350", 2000, {2, 3, 4, 7}, 415),
            "zenit": ("7905050", 1987, {3, 4, 7}, 414),
            "kokinskaya-rannyaya": ("7405006", 1985, {2, 3}, 414),
        }
        names = {row[0] for row in self.connection.execute(
            "SELECT slug FROM public_cultivars WHERE crop_slug='strawberry' "
            "AND slug IN ('divnaya','tsarskoselskaya','sudarushka','zenit','kokinskaya-rannyaya')"
        )}
        self.assertEqual(names, set(expected))

        for slug, (entry_code, year, regions, page) in expected.items():
            rows = self.connection.execute(
                "SELECT admission_region_number, registry_entry_code, admitted_year, "
                "edition_as_of, source_pdf_page, source_url, source_locator "
                "FROM public_official_admissions a JOIN public_cultivars c ON c.id=a.cultivar_id "
                "WHERE c.slug=? ORDER BY admission_region_number", (slug,)
            ).fetchall()
            self.assertEqual({row[0] for row in rows}, regions)
            self.assertTrue(all(row[1:5] == (entry_code, year, "2024-05-31", page) for row in rows))
            self.assertTrue(all("gossortrf.ru" in row[5] and entry_code in row[6] for row in rows))
            recommendations = self.connection.execute(
                "SELECT count(*) FROM public_recommendations r "
                "JOIN public_cultivars c ON c.id=r.cultivar_id WHERE c.slug=?", (slug,)
            ).fetchone()[0]
            self.assertEqual(recommendations, 0)

    def test_field_observations_keep_values_places_years_and_locators(self) -> None:
        rows = self.connection.execute(
            "SELECT c.slug, o.trait_code, o.value_text, o.value_number, o.unit, o.source_key, "
            "e.place_text, e.period_from, e.period_to, e.source_locator "
            "FROM public_observations o JOIN public_cultivars c ON c.id=o.cultivar_id "
            "JOIN public_evidence_passports e ON e.observation_id=o.id "
            "WHERE c.slug IN ('divnaya','tsarskoselskaya','sudarushka','zenit','kokinskaya-rannyaya')"
        ).fetchall()
        facts = {(row[0], row[1], row[9]): tuple(row[2:9]) for row in rows}

        self.assertEqual(facts[("divnaya", "yield", "С. 93, раздел «Урожайность»")][:4],
                         (None, 13.0, "т/га", "strawberry-vir-northwest-trial-2010-2015"))
        self.assertEqual(facts[("divnaya", "taste_rating", "С. 94, раздел «Вкусовые качества плодов»")][0],
                         "4,6 балла")
        self.assertEqual(facts[("tsarskoselskaya", "berry_weight_g", "С. 93, раздел «Масса ягоды»")][:4],
                         (None, 11.0, "г", "strawberry-vir-northwest-trial-2010-2015"))
        self.assertEqual(facts[("sudarushka", "yield", "С. 93, раздел «Урожайность»")][:4],
                         (None, 9.0, "т/га", "strawberry-vir-northwest-trial-2010-2015"))
        self.assertEqual(facts[("zenit", "berry_size_class", "С. 93, раздел «Масса ягоды»")][0],
                         "Крупноплодный: средняя масса ягоды более 12 г")
        self.assertEqual(facts[("kokinskaya-rannyaya", "yield", "Таблица 2, строка «Кокинская ранняя», столбец «средняя»")][:4],
                         (None, 10.2, "т/га", "strawberry-kokino-trial-2006-2007"))

        vir_facts = [fact for fact in facts.values() if fact[3] == "strawberry-vir-northwest-trial-2010-2015"]
        self.assertTrue(vir_facts)
        self.assertTrue(all(fact[4] == "Павловская опытная станция ВИР; учебно-опытный сад СПбГАУ; питомник «Тайцы», Ленинградская область"
                            and fact[5:7] == ("2010", "2015") for fact in vir_facts))
        kokino_facts = [fact for fact in facts.values() if fact[3] == "strawberry-kokino-trial-2006-2007"]
        self.assertTrue(kokino_facts)
        self.assertTrue(all(fact[4:6] == ("Кокино, Брянская область", "2006") for fact in kokino_facts))
        self.assertEqual(catalog.check(self.connection)["integrity"], "ok")


if __name__ == "__main__":
    unittest.main()
