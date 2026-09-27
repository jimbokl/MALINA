"""Source and evidence assertions for the 27 September cultivar batch."""

from __future__ import annotations

import sys
import tempfile
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
import catalog  # noqa: E402


class CatalogExpansionTests(unittest.TestCase):
    def setUp(self) -> None:
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.connection = catalog.connect(Path(self.temp.name) / "catalog.sqlite3", create=True)
        self.addCleanup(self.connection.close)
        catalog.migrate(self.connection)

    def test_eight_public_cultivars_have_primary_source_records(self) -> None:
        rows = self.connection.execute(
            "SELECT c.slug, cr.slug AS crop, c.canonical_name, s.url "
            "FROM public_cultivars c JOIN crops cr ON cr.id=(SELECT crop_id FROM cultivars WHERE id=c.id) "
            "JOIN sources s ON s.source_key=c.identity_source_key "
            "WHERE c.slug IN ('pshehiba','karamelka','samohval','patritsiya',"
            "'malvina','albion','honey','kimberli') ORDER BY c.slug"
        ).fetchall()
        self.assertEqual(len(rows), 8)
        self.assertEqual(sum(row[1] == "raspberry" for row in rows), 4)
        self.assertEqual(sum(row[1] == "strawberry" for row in rows), 4)
        self.assertTrue(all(row[3].startswith("https://") for row in rows))

    def test_raspberry_mass_and_ripening_observations_keep_source_values(self) -> None:
        expected = {
            ("pshehiba", "berry_weight_g"): (3.99, 5.6, "Таблица 3"),
            ("patritsiya", "berry_weight_g"): (2.93, 3.9, "Таблица 3"),
        }
        for (slug, trait), (mean, maximum, locator) in expected.items():
            row = self.connection.execute(
                "SELECT o.value_number, o.value_max, o.source_key, e.source_locator "
                "FROM public_observations o JOIN public_cultivars c ON c.id=o.cultivar_id "
                "JOIN public_evidence_passports e ON e.observation_id=o.id "
                "WHERE c.slug=? AND o.trait_code=?",
                (slug, trait),
            ).fetchone()
            self.assertIsNotNone(row, (slug, trait))
            self.assertEqual(tuple(row[:2]), (mean, maximum))
            self.assertIn(locator, row[3])

        descriptions = self.connection.execute(
            "SELECT c.slug, o.value_number, o.value_max, e.evidence_kind, e.place_text, e.source_locator "
            "FROM public_observations o JOIN public_cultivars c ON c.id=o.cultivar_id "
            "JOIN public_evidence_passports e ON e.observation_id=o.id "
            "WHERE c.slug IN ('karamelka','samohval') AND o.trait_code='berry_weight_g' "
            "AND e.source_locator LIKE '%Печатная с. 95%'"
        ).fetchall()
        self.assertEqual(
            {(r[0], r[1], r[2], r[3], r[4]) for r in descriptions},
            {
                ("karamelka", 3.8, 8.0, "reference_document", None),
                ("samohval", 5.9, 9.1, "reference_document", None),
            },
        )

        trial_results = self.connection.execute(
            "SELECT c.slug, o.value_number, o.value_max, e.evidence_kind, e.place_text, "
            "e.period_from, e.period_to, e.source_locator "
            "FROM public_observations o JOIN public_cultivars c ON c.id=o.cultivar_id "
            "JOIN public_evidence_passports e ON e.observation_id=o.id "
            "WHERE c.slug IN ('karamelka','samohval') AND o.trait_code='berry_weight_g' "
            "AND e.source_locator LIKE '%Печатная с. 98%'"
        ).fetchall()
        self.assertEqual(
            {(r[0], r[1], r[2], r[3], r[4], r[5], r[6]) for r in trial_results},
            {
                ("karamelka", 4.0, None, "published_study", "Ленинградская область", None, None),
                ("samohval", 3.9, None, "published_study", "Ленинградская область", None, None),
            },
        )
        self.assertTrue(all("с. 98" in row[7] for row in trial_results))

        seasons = self.connection.execute(
            "SELECT c.slug, o.trait_code, o.value_text "
            "FROM public_observations o JOIN public_cultivars c ON c.id=o.cultivar_id "
            "WHERE c.slug IN ('karamelka','samohval') AND o.trait_code IN ('fruiting_cycle','maturity_period')"
        ).fetchall()
        values = {(row[0], row[1]): row[2] for row in seasons}
        self.assertEqual(values[("karamelka", "fruiting_cycle")], "Ремонтантная")
        self.assertEqual(values[("karamelka", "maturity_period")], "Среднеранний")
        self.assertEqual(values[("samohval", "fruiting_cycle")], "Ремонтантная")
        self.assertEqual(values[("samohval", "maturity_period")], "Поздний")

    def test_strawberry_trial_scores_and_scope_are_preserved(self) -> None:
        expected = {
            "malvina": "3,0–4,0 балла",
            "honey": "3,0–4,0 балла",
            "kimberli": "3,0–4,0 балла",
            "albion": "4,5–5,0 балла",
        }
        for slug, value in expected.items():
            row = self.connection.execute(
                "SELECT o.value_text, e.place_text, e.period_from, e.period_to, e.source_locator "
                "FROM public_observations o JOIN public_cultivars c ON c.id=o.cultivar_id "
                "JOIN public_evidence_passports e ON e.observation_id=o.id "
                "WHERE c.slug=? AND o.trait_code='winter_hardiness'",
                (slug,),
            ).fetchone()
            self.assertIsNotNone(row, slug)
            self.assertEqual(row[0], value)
            self.assertIn("Кокино", row[1])
            self.assertEqual((row[2], row[3]), ("2013", "2017"))
            self.assertIn("Таблица 2", row[4])

    def test_kimberly_alias_is_source_backed(self) -> None:
        alias = self.connection.execute(
            "SELECT a.alias, a.normalized_alias, s.url FROM public_aliases a "
            "JOIN public_cultivars c ON c.id=a.cultivar_id "
            "JOIN sources s ON s.source_key=c.identity_source_key WHERE c.slug='kimberli'"
        ).fetchone()
        self.assertEqual(alias[0], "Вима Кимберли")
        self.assertEqual(alias[1], "вима кимберли")
        self.assertTrue(alias[2].startswith("https://vstisp.org/"))


if __name__ == "__main__":
    unittest.main()
