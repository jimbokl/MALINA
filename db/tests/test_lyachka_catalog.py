"""Source and evidence checks for the Lyachka catalog record."""

from __future__ import annotations

import sys
import tempfile
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
import catalog  # noqa: E402


class LyachkaCatalogTests(unittest.TestCase):
    def setUp(self) -> None:
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.connection = catalog.connect(Path(self.temp.name) / "catalog.sqlite3", create=True)
        self.addCleanup(self.connection.close)
        catalog.migrate(self.connection)

    def test_lyachka_identity_is_tied_to_the_vniispk_collection_record(self) -> None:
        row = self.connection.execute(
            "SELECT crop_slug, canonical_name, identity_source_url "
            "FROM public_cultivars WHERE slug='lyachka'"
        ).fetchone()
        self.assertIsNotNone(row)
        self.assertEqual(tuple(row), (
            "raspberry", "Лячка", "https://vniispk.ru/docs/unu/12_raspberry.pdf"
        ))

        aliases = self.connection.execute(
            "SELECT alias, normalized_alias FROM public_aliases a "
            "JOIN public_cultivars c ON c.id=a.cultivar_id WHERE c.slug='lyachka'"
        ).fetchall()
        self.assertEqual({tuple(row) for row in aliases}, {
            ("Laszka", "laszka"), ("Ляшка", "ляшка"), ("Лашка", "лашка"), ("Лачка", "лачка")
        })

    def test_public_facts_keep_their_source_and_scope(self) -> None:
        rows = self.connection.execute(
            "SELECT o.trait_code, o.value_text, o.value_number, o.value_max, o.unit, "
            "s.url, e.source_locator, e.applicability_note, e.limitations_note "
            "FROM public_observations o JOIN public_cultivars c ON c.id=o.cultivar_id "
            "JOIN sources s ON s.source_key=o.source_key "
            "JOIN public_evidence_passports e ON e.observation_id=o.id "
            "WHERE c.slug='lyachka'"
        ).fetchall()
        facts = {row[0]: row[1:] for row in rows}
        self.assertEqual(set(facts), {
            "fruit_color", "fruiting_cycle", "maturity_period", "berry_weight_g", "yield"
        })
        self.assertEqual(facts["fruit_color"][:2], ("Ярко-красная", None))
        self.assertEqual(facts["fruiting_cycle"][:2], ("Летняя", None))
        self.assertEqual(facts["maturity_period"][:2], ("Ранний", None))
        self.assertEqual(facts["berry_weight_g"][:4], (None, 6.0, 8.0, "г"))
        self.assertEqual(facts["yield"][:4], (None, 3.0, 6.0, "кг/куст"))
        for fact in facts.values():
            self.assertEqual(fact[4], "https://www.vhoz.ru/articles/sad/malina-lyachka-opisanie-sorta-vyrashchivanie-i-ukhod/")
            self.assertIn("раздел", fact[5].lower())
            self.assertTrue(fact[6])
            self.assertTrue(fact[7])


if __name__ == "__main__":
    unittest.main()
