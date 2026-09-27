"""Source and evidence checks for the Tarusa catalog record."""

from __future__ import annotations

import sys
import tempfile
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
import catalog  # noqa: E402


class TarusaCatalogTests(unittest.TestCase):
    def setUp(self) -> None:
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.connection = catalog.connect(Path(self.temp.name) / "catalog.sqlite3", create=True)
        self.addCleanup(self.connection.close)
        catalog.migrate(self.connection)

    def test_tarusa_is_published_as_a_red_summer_raspberry(self) -> None:
        cultivar = self.connection.execute(
            "SELECT crop_slug, canonical_name, identity_source_url FROM public_cultivars "
            "WHERE slug='tarusa'"
        ).fetchone()
        self.assertIsNotNone(cultivar)
        self.assertEqual(tuple(cultivar[:2]), ("raspberry", "Таруса"))
        self.assertEqual(cultivar[2], "https://old.journal-vniispk.ru/pdf/2019/4/46.pdf")

        facts = self.connection.execute(
            "SELECT o.trait_code, o.value_text, o.value_number, o.value_max, o.unit, "
            "o.source_key, e.evidence_kind, e.source_locator "
            "FROM public_observations o JOIN public_cultivars c ON c.id=o.cultivar_id "
            "JOIN public_evidence_passports e ON e.observation_id=o.id WHERE c.slug='tarusa'"
        ).fetchall()
        by_trait = {row[0]: row[1:] for row in facts}
        self.assertEqual(len(by_trait), 6)
        self.assertEqual(by_trait["fruit_color"][:2], ("Красная", None))
        self.assertEqual(by_trait["fruiting_cycle"][:2], ("Летняя", None))
        self.assertEqual(by_trait["maturity_period"][:2], ("Среднепоздний", None))
        self.assertEqual(by_trait["berry_weight_g"][1:5], (4.0, 12.0, "г", "tarusa-nursery-description"))
        self.assertEqual(by_trait["yield"][1:5], (3.0, 4.0, "кг/куст", "tarusa-nursery-description"))
        self.assertEqual(by_trait["winter_hardiness"][0], "Достаточная морозоустойчивость по изученным компонентам")
        self.assertEqual(by_trait["winter_hardiness"][4], "tarusa-vniispk-winter-2007")
        self.assertTrue(all(row[5] == "reference_document" for trait, row in by_trait.items() if trait != "winter_hardiness"))
        self.assertTrue(all(row[6].startswith("PDF, печатная с. 5") for trait, row in by_trait.items() if trait != "winter_hardiness"))

    def test_winter_hardiness_keeps_the_trial_scope(self) -> None:
        row = self.connection.execute(
            "SELECT o.value_text, s.url, e.evidence_kind, e.place_text, e.period_from, e.period_to, "
            "e.setting_text, e.method_text, e.source_locator, e.applicability_note, e.limitations_note "
            "FROM public_observations o JOIN public_cultivars c ON c.id=o.cultivar_id "
            "JOIN sources s ON s.source_key=o.source_key "
            "JOIN public_evidence_passports e ON e.observation_id=o.id "
            "WHERE c.slug='tarusa' AND o.trait_code='winter_hardiness'"
        ).fetchone()
        self.assertIsNotNone(row)
        self.assertEqual(row[1], "https://vniispk.ru/pages/activities/science-activities/conference-2007/publ-2007-56")
        self.assertEqual((row[2], row[3], row[4], row[5]),
                         ("published_study", "Подмосковье, Центральный регион", "2005", "2006"))
        self.assertIn("искусственное промораживание", row[6].lower())
        self.assertIn("пятибалльной шкале", row[7])
        self.assertIn("строка «Таруса»", row[8])
        self.assertIn("2005–2006", row[9])
        self.assertIn("отдельном участке", row[10])

    def test_yield_source_is_the_nursery_description(self) -> None:
        row = self.connection.execute(
            "SELECT o.value_number, o.value_max, o.unit, s.title, s.url, e.source_locator "
            "FROM public_observations o JOIN public_cultivars c ON c.id=o.cultivar_id "
            "JOIN sources s ON s.source_key=o.source_key "
            "JOIN public_evidence_passports e ON e.observation_id=o.id "
            "WHERE c.slug='tarusa' AND o.trait_code='yield'"
        ).fetchone()
        self.assertEqual(tuple(row[:3]), (3.0, 4.0, "кг/куст"))
        self.assertIn("Малина: найдётся всё", row[3])
        self.assertEqual(row[4], "https://www.opitomnik.ru/files/novie-sorta-malini.pdf")
        self.assertIn("абзац об урожайности", row[5])


if __name__ == "__main__":
    unittest.main()
