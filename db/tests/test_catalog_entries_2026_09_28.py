"""Evidence and admission records for two new catalogue cultivars."""

from __future__ import annotations

import sys
import tempfile
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
import catalog  # noqa: E402


class CatalogEntries20260928Tests(unittest.TestCase):
    def setUp(self) -> None:
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.connection = catalog.connect(Path(self.temp.name) / "catalog.sqlite3", create=True)
        self.addCleanup(self.connection.close)
        catalog.migrate(self.connection)

    def test_cultivars_link_to_primary_sources_and_publish_only_verified_records(self) -> None:
        rows = self.connection.execute(
            "SELECT crop_slug, slug, canonical_name, identity_source_url "
            "FROM public_cultivars WHERE slug IN ('brilliantovaya','elsanta')"
        ).fetchall()
        self.assertEqual({tuple(row) for row in rows}, {
            ("raspberry", "brilliantovaya", "Бриллиантовая",
             "https://vniispk.ru/pages/activities/science-activities/conference-2008/publ-2008-13"),
            ("strawberry", "elsanta", "Эльсанта",
             "https://gossortrf.ru/registry/gosudarstvennyy-reestr-selektsionnykh-dostizheniy-dopushchennykh-k-ispolzovaniyu-tom-1-sorta-rasteni/elsanta-zemlyanika-9610367/"),
        })

    def test_observations_keep_context_sources_and_evidence_passports(self) -> None:
        rows = self.connection.execute(
            "SELECT c.slug, o.trait_code, o.value_text, o.value_number, o.value_max, o.unit, "
            "o.source_key, e.evidence_kind, e.place_text, e.source_locator, "
            "e.applicability_note, e.limitations_note "
            "FROM public_observations o JOIN public_cultivars c ON c.id=o.cultivar_id "
            "JOIN public_evidence_passports e ON e.observation_id=o.id "
            "WHERE c.slug IN ('brilliantovaya','elsanta')"
        ).fetchall()
        facts = {(row[0], row[1]): tuple(row[2:]) for row in rows}

        self.assertEqual(facts[("brilliantovaya", "fruit_color")][0], "Рубиновая")
        self.assertEqual(facts[("brilliantovaya", "fruiting_cycle")][0], "Ремонтантная")
        self.assertEqual(facts[("brilliantovaya", "berry_weight_g")][:4], (None, 4.0, 4.5, "г"))
        self.assertEqual(facts[("brilliantovaya", "yield")][:4],
                         ("До 2,5–3,0 кг с куста; до 16 т/га", None, None, "кг/куст; т/га"))
        self.assertEqual(facts[("elsanta", "maturity_period")][0], "Среднеранний")
        self.assertEqual(facts[("elsanta", "berry_weight_g")][:4], (None, 13.1, None, "г"))
        self.assertEqual(facts[("elsanta", "yield")][:4], (None, 54.7, 73.4, "ц/га"))

        self.assertEqual(len(facts), 10)
        for (slug, _trait), fact in facts.items():
            expected_source = "brilliantovaya-vniispk" if slug == "brilliantovaya" else "elsanta-gossort-record"
            self.assertEqual(fact[4], expected_source)
            self.assertTrue(fact[7], f"{slug} source locator")
            self.assertTrue(fact[8], f"{slug} applicability")
            self.assertTrue(fact[9], f"{slug} limitations")

    def test_elsanta_official_admission_is_separate_from_local_recommendations(self) -> None:
        admissions = self.connection.execute(
            "SELECT admission_region_number, registry_entry_code, admitted_year, edition_as_of, source_url "
            "FROM public_official_admissions a JOIN public_cultivars c ON c.id=a.cultivar_id "
            "WHERE c.slug='elsanta' ORDER BY admission_region_number"
        ).fetchall()
        self.assertEqual({row[0] for row in admissions}, {4, 6, 10})
        self.assertTrue(all(row[1:4] == ("9610367", 2007, "2026-09-27") for row in admissions))
        self.assertTrue(all(row[4].endswith("/elsanta-zemlyanika-9610367/") for row in admissions))
        recommendations = self.connection.execute(
            "SELECT count(*) FROM public_recommendations r "
            "JOIN public_cultivars c ON c.id=r.cultivar_id WHERE c.slug='elsanta'"
        ).fetchone()[0]
        self.assertEqual(recommendations, 0)

        result = catalog.check(self.connection)
        self.assertEqual(result["integrity"], "ok")
        self.assertEqual(result["foreign_key_errors"], 0)

    def test_new_strawberries_link_to_fncsad_source_without_inferred_admissions(self) -> None:
        rows = self.connection.execute(
            "SELECT crop_slug, slug, canonical_name, identity_source_url "
            "FROM public_cultivars WHERE slug IN ('borovitskaya','nashe-podmoskove')"
        ).fetchall()
        self.assertEqual({tuple(row) for row in rows}, {
            ("strawberry", "borovitskaya", "Боровицкая",
             "https://vstisp.org/vstisp/index.php/11-icetheme/sample-news/1447-borovitskaya"),
            ("strawberry", "nashe-podmoskove", "Наше Подмосковье",
             "https://vstisp.org/vstisp/index.php/component/content/article/11-icetheme/sample-news/1441-nashe-podmoskove"),
        })
        for slug in ("borovitskaya", "nashe-podmoskove"):
            admissions = self.connection.execute(
                "SELECT count(*) FROM public_official_admissions a "
                "JOIN public_cultivars c ON c.id=a.cultivar_id WHERE c.slug=?", (slug,)
            ).fetchone()[0]
            recommendations = self.connection.execute(
                "SELECT count(*) FROM public_recommendations r "
                "JOIN public_cultivars c ON c.id=r.cultivar_id WHERE c.slug=?", (slug,)
            ).fetchone()[0]
            self.assertEqual(admissions, 0)
            self.assertEqual(recommendations, 0)

    def test_new_strawberry_observations_have_source_passports_and_preserve_context(self) -> None:
        rows = self.connection.execute(
            "SELECT c.slug, o.trait_code, o.context_text, o.value_text, o.value_number, "
            "o.value_max, o.unit, s.source_key, e.evidence_kind, e.source_locator, "
            "e.applicability_note, e.limitations_note "
            "FROM public_observations o JOIN public_cultivars c ON c.id=o.cultivar_id "
            "JOIN sources s ON s.id=(SELECT source_id FROM trait_observations WHERE id=o.id) "
            "JOIN public_evidence_passports e ON e.observation_id=o.id "
            "WHERE c.slug IN ('borovitskaya','nashe-podmoskove') "
            "AND s.source_key IN ('borovitskaya-fncsad','nashe-podmoskove-fncsad')"
        ).fetchall()
        facts = {(row[0], row[1], row[2]): tuple(row[3:]) for row in rows}
        self.assertEqual(len(facts), 19)
        self.assertIn(("borovitskaya", "maturity_period", "ФНЦ Садоводства относит сорт Боровицкая к среднепоздним."), facts)
        self.assertIn(("borovitskaya", "berry_weight_g", "Средняя масса ягод указана в диапазоне 15–16 г."), facts)
        self.assertIn(("nashe-podmoskove", "yield", "Урожайность указана в диапазоне 15–20 т/га."), facts)
        self.assertIn(("nashe-podmoskove", "disease_resistance", "Источник описывает устойчивость к грибным заболеваниям листьев и земляничному клещу."), facts)
        for fact in facts.values():
            source_key, evidence_kind, locator, applicability, limitations = fact[4:]
            self.assertIn(source_key, {"borovitskaya-fncsad", "nashe-podmoskove-fncsad"})
            self.assertEqual(evidence_kind, "reference_document")
            self.assertTrue(locator)
            self.assertTrue(applicability)
            self.assertTrue(limitations)

    def test_new_illustrations_are_rights_tracked_and_identified_as_generic(self) -> None:
        rows = self.connection.execute(
            "SELECT c.slug, m.asset_path, m.alt_text, m.rights_basis, m.rights_note, m.source_key "
            "FROM public_media m JOIN public_cultivars c ON c.id=m.cultivar_id "
            "WHERE c.slug IN ('borovitskaya','nashe-podmoskove')"
        ).fetchall()
        self.assertEqual(len(rows), 2)
        for slug, asset_path, alt, rights_basis, rights_note, source_key in rows:
            self.assertEqual(rights_basis, "owned")
            self.assertIn("Иллюстрация клубники", alt)
            self.assertIn("не фотография сорта", rights_note)
            self.assertTrue(source_key.startswith("ai-illustration-"))
            self.assertIn(slug, {"borovitskaya", "nashe-podmoskove"})
            self.assertTrue(asset_path.startswith("/assets/variety-"))
        result = catalog.check(self.connection)
        self.assertEqual(result["integrity"], "ok")
        self.assertEqual(result["foreign_key_errors"], 0)


if __name__ == "__main__":
    unittest.main()
