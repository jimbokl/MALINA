"""Identity and source passports for the 2026-09-27 cultivar additions."""

from __future__ import annotations

import sys
import tempfile
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
import catalog  # noqa: E402


class CatalogEntries20260927Tests(unittest.TestCase):
    def setUp(self) -> None:
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.connection = catalog.connect(Path(self.temp.name) / "catalog.sqlite3", create=True)
        self.addCleanup(self.connection.close)
        catalog.migrate(self.connection)

    def test_five_cultivars_are_published_with_separate_identity_sources(self) -> None:
        rows = self.connection.execute(
            "SELECT crop_slug, slug, canonical_name, identity_source_url "
            "FROM public_cultivars WHERE slug IN ('maroseyka','cabrillo','brilla','magnus','rumba')"
        ).fetchall()
        self.assertEqual({tuple(row) for row in rows}, {
            ("raspberry", "maroseyka", "Маросейка", "https://vniispk.ru/docs/unu/12_raspberry.pdf"),
            ("strawberry", "cabrillo", "Кабрилло", "https://research.ucdavis.edu/industry-support/plant-variety-licensing-program/strawberry-licensing-program/"),
            ("strawberry", "brilla", "Брилла", "https://www.coviro.it/brilla/"),
            ("strawberry", "magnus", "Магнус", "https://flevoberry.nl/variety/magnus/"),
            ("strawberry", "rumba", "Румба", "https://www.fresh-forward.nl/en/breed/rumba"),
        })

    def test_only_source_backed_facts_are_public_and_keep_their_passports(self) -> None:
        rows = self.connection.execute(
            "SELECT c.slug, o.trait_code, o.value_text, o.value_number, o.value_max, o.unit, "
            "o.source_key, e.evidence_kind, e.place_text, e.period_from, e.period_to, "
            "e.source_locator, e.method_text "
            "FROM public_observations o JOIN public_cultivars c ON c.id=o.cultivar_id "
            "JOIN public_evidence_passports e ON e.observation_id=o.id "
            "WHERE c.slug IN ('maroseyka','cabrillo','brilla','magnus','rumba')"
        ).fetchall()
        facts = {(row[0], row[1]): tuple(row[2:]) for row in rows}

        self.assertEqual(facts[("maroseyka", "fruit_color")][:2], ("Светло-красная", None))
        self.assertEqual(facts[("maroseyka", "fruiting_cycle")][:2], ("Летняя", None))
        self.assertEqual(facts[("maroseyka", "maturity_period")][:2], ("Среднеранний", None))
        self.assertEqual(facts[("maroseyka", "berry_weight_g")][:4], (None, 4.0, 12.0, "г"))
        self.assertEqual(facts[("maroseyka", "yield")][:4], (None, 4.0, 5.0, "кг/куст"))
        self.assertEqual(facts[("cabrillo", "photoperiod_response")][:2], ("Нейтрального светового дня", None))
        self.assertEqual(facts[("cabrillo", "berry_weight_g")][:4], (None, 32.0, None, "г/ягоду"))
        self.assertEqual(facts[("cabrillo", "berry_weight_g")][5:9],
                         ("published_study", "Уотсонвилл, Калифорния", "2012", "2013"))
        self.assertEqual(facts[("brilla", "fruit_color")][0], "Красно-оранжевая")
        self.assertEqual(facts[("brilla", "fruiting_cycle")][0], "Однократное плодоношение")
        self.assertEqual(facts[("brilla", "maturity_period")][0], "Ранний")
        self.assertEqual(facts[("magnus", "fruit_color")][0], "Ярко-красная")
        self.assertEqual(facts[("magnus", "maturity_period")][0], "Поздний")
        self.assertEqual(facts[("rumba", "fruit_color")][0], "Ярко-красная")
        self.assertEqual(facts[("rumba", "maturity_period")][0], "Ранний")

        expected_sources = {
            "maroseyka": "maroseyka-opitomnik-description",
            "cabrillo": "cabrillo-ucdavis",
            "brilla": "brilla-coviro",
            "magnus": "magnus-flevo-berry",
            "rumba": "rumba-fresh-forward",
        }
        for (slug, _trait), fact in facts.items():
            self.assertEqual(fact[4], expected_sources[slug])
            self.assertTrue(fact[9], f"{slug} has a source locator")
            self.assertTrue(fact[10], f"{slug} has a method/context")

    def test_cabrillo_day_neutrality_is_not_mapped_to_a_fruiting_group(self) -> None:
        count = self.connection.execute(
            "SELECT count(*) FROM public_observations o "
            "JOIN public_cultivars c ON c.id=o.cultivar_id "
            "WHERE c.slug='cabrillo' AND o.trait_code='fruiting_cycle'"
        ).fetchone()[0]
        self.assertEqual(count, 0)
        aliases = self.connection.execute(
            "SELECT alias FROM public_aliases a JOIN public_cultivars c ON c.id=a.cultivar_id "
            "WHERE c.slug='cabrillo'"
        ).fetchall()
        self.assertEqual(aliases, [])

        result = catalog.check(self.connection)
        self.assertEqual(result["integrity"], "ok")
        self.assertEqual(result["foreign_key_errors"], 0)


if __name__ == "__main__":
    unittest.main()
