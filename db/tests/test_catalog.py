"""Publication boundaries for the SQLite catalog."""

from __future__ import annotations

import csv
import json
import sqlite3
import sys
import tempfile
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
import catalog  # noqa: E402


class CatalogTests(unittest.TestCase):
    def setUp(self) -> None:
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name)
        self.connection = catalog.connect(self.root / "catalog.sqlite3", create=True)
        self.addCleanup(self.connection.close)
        catalog.migrate(self.connection)
        # Migration 0002 seeds the public reference catalog. These tests need
        # an empty fixture so they can exercise publication and rollback gates.
        for table in ("evidence_passports", "trait_observations", "cultivars", "sources"):
            self.connection.execute(f"DELETE FROM {table}")
        self.connection.commit()

    def add_source_and_cultivar(self) -> None:
        self.connection.execute(
            "INSERT INTO sources(source_key, kind, title, url, accessed_on, rights_note) "
            "VALUES ('reference-a', 'website', 'Reference A', 'https://example.org/a', "
            "'2026-09-24', 'Facts only; no images')"
        )
        self.connection.execute(
            "INSERT INTO cultivars(crop_id, slug, canonical_name, identity_source_id) "
            "VALUES (1, 'test-cultivar', 'Test Cultivar', 1)"
        )
        self.connection.commit()

    def publish_identity(self) -> None:
        self.connection.execute(
            "UPDATE sources SET review_status='verified', reviewed_by='editor', "
            "reviewed_at='2026-09-24 12:00:00' WHERE id=1"
        )
        self.connection.execute(
            "UPDATE cultivars SET editorial_status='published', reviewed_by='editor', "
            "reviewed_at='2026-09-24 12:00:00', "
            "published_at='2026-09-24 12:00:00' WHERE id=1"
        )
        self.connection.commit()

    def test_publication_requires_verified_identity_and_source(self) -> None:
        self.add_source_and_cultivar()
        self.assertEqual(catalog.public_snapshot(self.connection)["cultivars"], [])
        self.publish_identity()
        self.assertEqual(len(catalog.public_snapshot(self.connection)["cultivars"]), 1)
        self.connection.execute("UPDATE sources SET review_status='rejected' WHERE id=1")
        self.assertEqual(catalog.public_snapshot(self.connection)["cultivars"], [])

    def test_conflicting_observations_are_kept_with_context(self) -> None:
        self.add_source_and_cultivar()
        self.publish_identity()
        for value, context in (("early", "trial A"), ("late", "trial B")):
            self.connection.execute(
                "INSERT INTO trait_observations(cultivar_id, trait_code, value_text, "
                "context_text, source_id, review_status, reviewed_by, reviewed_at) "
                "VALUES (1, 'maturity_period', ?, ?, 1, 'verified', 'editor', "
                "'2026-09-24 12:00:00')",
                (value, context),
            )
        records = catalog.public_snapshot(self.connection)["cultivars"][0]["observations"]
        self.assertEqual({item["value_text"] for item in records}, {"early", "late"})
        self.assertEqual({item["context_text"] for item in records}, {"trial A", "trial B"})

    def test_evidence_passport_requires_review_and_hides_internal_sample(self) -> None:
        self.add_source_and_cultivar()
        self.publish_identity()
        cursor = self.connection.execute(
            "INSERT INTO trait_observations(cultivar_id, trait_code, value_text, "
            "context_text, source_id, review_status, reviewed_by, reviewed_at) "
            "VALUES (1, 'flavor', 'sweet', 'source description', 1, 'verified', "
            "'editor', '2026-09-24 12:00:00')"
        )
        observation_id = cursor.lastrowid
        self.connection.execute(
            "INSERT INTO evidence_passports(observation_id, evidence_kind, subject_description, "
            "internal_sample_ref, conditions_json, method_text, sample_size, source_locator, "
            "applicability_note, limitations_note) VALUES (?, 'published_study', ?, ?, ?, ?, ?, ?, ?, ?)",
            (observation_id, "One tested cultivar", "private/lot-1", '{"setting":"field"}',
             "Tasting panel", 12, "p. 14", "Only the tested conditions", "No regional trial"),
        )
        record = catalog.public_snapshot(self.connection)["cultivars"][0]["observations"][0]
        self.assertIsNone(record["evidence"])
        with self.assertRaises(sqlite3.IntegrityError):
            self.connection.execute(
                "UPDATE evidence_passports SET review_status='verified' WHERE observation_id=?",
                (observation_id,),
            )
        self.connection.execute(
            "UPDATE evidence_passports SET review_status='verified', reviewed_by='editor', "
            "reviewed_at='2026-09-26 12:00:00' WHERE observation_id=?",
            (observation_id,),
        )
        evidence = catalog.public_snapshot(self.connection)["cultivars"][0]["observations"][0]["evidence"]
        self.assertEqual(evidence["sample_size"], 12)
        self.assertEqual(evidence["source_locator"], "p. 14")
        self.assertNotIn("internal_sample_ref", evidence)
        self.connection.execute("UPDATE evidence_passports SET review_status='rejected' WHERE observation_id=?", (observation_id,))
        self.assertIsNone(catalog.public_snapshot(self.connection)["cultivars"][0]["observations"][0]["evidence"])

    def test_evidence_passport_links_exactly_one_target_and_recommendation(self) -> None:
        self.add_source_and_cultivar()
        self.publish_identity()
        cursor = self.connection.execute(
            "INSERT INTO recommendation_rules(cultivar_id, conditions_json, rationale, limitations, "
            "source_id, review_status, reviewed_by, reviewed_at) "
            "VALUES (1, '{}', 'test rationale', 'test limitation', 1, 'verified', 'editor', "
            "'2026-09-24 12:00:00')"
        )
        recommendation_id = cursor.lastrowid
        with self.assertRaises(sqlite3.IntegrityError):
            self.connection.execute(
                "INSERT INTO evidence_passports(evidence_kind, subject_description) "
                "VALUES ('expert_assessment', 'No target')"
            )
        with self.assertRaises(sqlite3.IntegrityError):
            self.connection.execute(
                "INSERT INTO evidence_passports(recommendation_id, evidence_kind, subject_description, conditions_json) "
                "VALUES (?, 'expert_assessment', 'Bad JSON', '[]')",
                (recommendation_id,),
            )
        self.connection.execute(
            "INSERT INTO evidence_passports(recommendation_id, evidence_kind, subject_description, "
            "source_locator, applicability_note, limitations_note, review_status, reviewed_by, reviewed_at) "
            "VALUES (?, 'expert_assessment', 'Test material', 'section 2', 'Test only', "
            "'No field validation', 'verified', 'editor', '2026-09-26 12:00:00')",
            (recommendation_id,),
        )
        evidence = catalog.public_snapshot(self.connection)["cultivars"][0]["recommendations"][0]["evidence"]
        self.assertEqual(evidence["source_locator"], "section 2")
        self.assertIsNone(evidence["sample_size"])
        self.connection.execute("UPDATE sources SET review_status='rejected' WHERE id=1")
        self.assertEqual(catalog.public_snapshot(self.connection)["cultivars"], [])

    def test_regional_rule_needs_independent_local_evidence(self) -> None:
        self.add_source_and_cultivar()
        self.publish_identity()
        rule_id = self.connection.execute(
            "INSERT INTO recommendation_rules(cultivar_id, region_id, conditions_json, rationale, "
            "limitations, source_id, review_status, reviewed_by, reviewed_at) "
            "VALUES (1, 1, '{}', 'Reference description', 'Local results unknown', 1, "
            "'verified', 'editor', '2026-09-24 12:00:00')"
        ).lastrowid
        self.assertEqual(catalog.public_snapshot(self.connection)["cultivars"][0]["recommendations"], [])
        self.connection.execute(
            "INSERT INTO sources(source_key, kind, title, url, accessed_on, rights_note, "
            "review_status, reviewed_by, reviewed_at) VALUES "
            "('local-trial', 'document', 'Local trial', 'https://example.org/local', "
            "'2026-09-26', 'Facts only', 'verified', 'editor', '2026-09-26 12:00:00')"
        )
        basis_id = self.connection.execute(
            "INSERT INTO regional_evidence(recommendation_id, region_id, source_id, basis_kind, "
            "source_locator, place_text, conditions_text, limitations_text, review_status, "
            "reviewed_by, reviewed_at) VALUES (?, 1, 2, 'state_register_admission', 'entry 1', "
            "'Kaliningrad Oblast', 'Admission only', 'No yield data', 'verified', 'editor', "
            "'2026-09-26 12:00:00')", (rule_id,)
        ).lastrowid
        self.assertEqual(catalog.public_snapshot(self.connection)["cultivars"][0]["recommendations"], [])
        self.connection.execute(
            "UPDATE regional_evidence SET basis_kind='regional_trial', review_status='draft' WHERE id=?",
            (basis_id,),
        )
        self.assertEqual(catalog.public_snapshot(self.connection)["cultivars"][0]["recommendations"], [])
        self.connection.execute(
            "UPDATE regional_evidence SET review_status='verified' WHERE id=?", (basis_id,)
        )
        rec = catalog.public_snapshot(self.connection)["cultivars"][0]["recommendations"][0]
        self.assertEqual(rec["basis_source_title"], "Local trial")
        self.assertEqual(rec["basis_kind"], "regional_trial")
        self.connection.execute("UPDATE sources SET review_status='rejected' WHERE id=2")
        self.assertEqual(catalog.public_snapshot(self.connection)["cultivars"][0]["recommendations"], [])

    def test_offer_expires_and_requires_published_cultivar(self) -> None:
        self.add_source_and_cultivar()
        self.publish_identity()
        self.connection.execute(
            "INSERT INTO sellers(display_name, website_url, review_status, reviewed_by, reviewed_at) "
            "VALUES ('Test Seller', 'https://seller.example', 'verified', 'editor', '2026-09-24 12:00:00')"
        )
        for expiry, url in (
            ("2000-01-01 00:00:00", "https://seller.example/plants/polka"),
            ("2999-01-01 00:00:00", "https://seller.example/plants/polka"),
            ("2999-01-01 00:00:00", "https://seller.example.evil.test/plants/polka"),
            ("2999-01-01 00:00:00", "http://seller.example/plants/polka"),
            ("2999-01-01 00:00:00", None),
        ):
            self.connection.execute(
                "INSERT INTO offers(seller_id, cultivar_id, product_name, kind, "
                "destination_url, checked_at, expires_at, editorial_status, reviewed_by, reviewed_at) "
                "VALUES (1, 1, 'Test offer', 'affiliate', ?, '2026-09-24 12:00:00', ?, "
                "'published', 'editor', '2026-09-24 12:00:00')",
                (url, expiry),
            )
        self.connection.execute(
            "INSERT INTO offers(seller_id, product_name, kind, destination_url, checked_at, expires_at, "
            "editorial_status, reviewed_by, reviewed_at) "
            "VALUES (1, 'Unlinked offer', 'affiliate', 'https://seller.example/plants/unknown', '2026-09-24 12:00:00', "
            "'2999-01-01 00:00:00', 'published', 'editor', '2026-09-24 12:00:00')"
        )
        offers = catalog.public_snapshot(self.connection)["cultivars"][0]["offers"]
        self.assertEqual(len(offers), 1)
        self.assertEqual(offers[0]["destination_url"], "https://seller.example/plants/polka")
        self.assertIn("Партнёрская ссылка", offers[0]["disclosure"])
        self.assertIsNone(offers[0]["price_minor"])
        self.connection.execute("UPDATE sellers SET review_status='suspended' WHERE id=1")
        self.assertEqual(catalog.public_snapshot(self.connection)["cultivars"][0]["offers"], [])
        self.connection.execute("UPDATE sellers SET review_status='verified' WHERE id=1")
        self.connection.execute("UPDATE cultivars SET editorial_status='withdrawn' WHERE id=1")
        self.assertEqual(catalog.public_snapshot(self.connection)["cultivars"], [])

    def test_own_batch_requires_real_ready_stock_and_hides_internal_document(self) -> None:
        self.add_source_and_cultivar()
        self.publish_identity()
        self.connection.execute(
            "INSERT INTO own_batches(cultivar_id, batch_code, origin_method, origin_document_ref, "
            "provenance_summary, received_on, plant_stage, pickup_region_id, pickup_locality, pickup_terms) "
            "VALUES (1, 'B-001', 'in_vitro', 'private/invoice-001', "
            "'Посадочный материал из учтённой партии', '2026-03-01', 'growing', 1, "
            "'Калининград', 'Самовывоз по согласованию')"
        )
        self.assertEqual(catalog.public_snapshot(self.connection)["cultivars"][0]["own_batches"], [])
        with self.assertRaises(sqlite3.IntegrityError):
            self.connection.execute(
                "UPDATE own_batches SET editorial_status='published', reviewed_by='editor', "
                "reviewed_at='2026-09-24 12:00:00', checked_at='2026-09-24 12:00:00', "
                "expires_at='2999-01-01 00:00:00' WHERE batch_code='B-001'"
            )
        self.connection.execute(
            "UPDATE own_batches SET plant_stage='sale_ready', quantity_available=12, "
            "editorial_status='published', reviewed_by='editor', reviewed_at='2026-09-24 12:00:00', "
            "checked_at='2026-09-24 12:00:00', expires_at='2999-01-01 00:00:00' "
            "WHERE batch_code='B-001'"
        )
        batches = catalog.public_snapshot(self.connection)["cultivars"][0]["own_batches"]
        self.assertEqual(len(batches), 1)
        self.assertEqual(batches[0]["pickup_region_code"], "kaliningrad-oblast")
        self.assertEqual(batches[0]["quantity_available"], 12)
        self.assertNotIn("origin_document_ref", batches[0])
        with self.assertRaises(sqlite3.IntegrityError):
            self.connection.execute(
                "UPDATE own_batches SET quantity_available=0 WHERE batch_code='B-001'"
            )
        self.connection.execute(
            "UPDATE own_batches SET editorial_status='withdrawn', quantity_available=0 "
            "WHERE batch_code='B-001'"
        )
        self.assertEqual(catalog.public_snapshot(self.connection)["cultivars"][0]["own_batches"], [])

    def test_import_rolls_back_all_rows_after_invalid_reference(self) -> None:
        source_path = self.root / "sources.csv"
        with source_path.open("w", encoding="utf-8", newline="") as file:
            writer = csv.DictWriter(
                file,
                fieldnames=["source_key", "kind", "title", "url", "reference", "accessed_on", "rights_note"],
            )
            writer.writeheader()
            writer.writerow({"source_key": "test", "kind": "website", "title": "Test", "url": "https://example.org", "accessed_on": "2026-09-24", "rights_note": "Facts only"})
        cultivar_path = self.root / "cultivars.csv"
        with cultivar_path.open("w", encoding="utf-8", newline="") as file:
            writer = csv.DictWriter(file, fieldnames=["crop_slug", "slug", "canonical_name", "identity_source_key"])
            writer.writeheader()
            writer.writerow({"crop_slug": "unknown", "slug": "invalid", "canonical_name": "Invalid", "identity_source_key": "test"})
        with self.assertRaisesRegex(ValueError, "Unknown crops.slug"):
            catalog.import_drafts(self.connection, source_path, cultivar_path, None)
        self.assertEqual(self.connection.execute("SELECT count(*) FROM sources").fetchone()[0], 0)

    def test_check_detects_foreign_key_damage(self) -> None:
        self.add_source_and_cultivar()
        self.connection.execute("PRAGMA foreign_keys=OFF")
        self.connection.execute("UPDATE cultivars SET crop_id=999 WHERE id=1")
        self.connection.commit()
        with self.assertRaisesRegex(ValueError, "foreign_keys"):
            catalog.check(self.connection)

    def test_review_requires_consent_and_approval_before_export(self) -> None:
        body = 'Ягоды "вкусные" \\ тест\n</script><script>alert(1)</script>'
        self.connection.execute(
            "INSERT INTO reviews(display_name, region, cultivar_name, body, "
            "consent_processing, processing_consented_at) "
            "VALUES (?, ?, ?, ?, 1, '2026-09-24 12:00:00')",
            ("Посетитель", "Калининградская область", "Мой сорт", body),
        )
        review_id = self.connection.execute("SELECT id FROM reviews").fetchone()[0]
        self.assertEqual(self.connection.execute("SELECT * FROM public_reviews").fetchall(), [])
        self.assertEqual(catalog.public_reviews_snapshot(self.connection)["reviews"], [])
        with self.assertRaises(sqlite3.IntegrityError):
            self.connection.execute(
                "UPDATE reviews SET status='approved', "
                "moderation_model='test-model', moderation_verdict='not_spam', "
                "moderation_reason='No spam signals', moderation_version='v1', "
                "moderated_at='2026-09-24 12:01:00', "
                "published_at='2026-09-24 12:01:00' WHERE id=?", (review_id,)
            )
        self.connection.execute(
            "UPDATE reviews SET consent_publication=1, "
            "publication_consented_at='2026-09-24 12:00:00' WHERE id=?",
            (review_id,),
        )
        self.connection.execute(
            "UPDATE reviews SET status='approved', "
            "moderation_model='test-model', moderation_verdict='not_spam', "
            "moderation_reason='No spam signals', moderation_version='v1', "
            "moderated_at='2026-09-24 12:01:00', "
            "published_at='2026-09-24 12:01:00' WHERE id=?",
            (review_id,),
        )
        rows = [dict(row) for row in self.connection.execute("SELECT * FROM public_reviews")]
        self.assertEqual(len(rows), 1)
        encoded = json.dumps(rows, ensure_ascii=False)
        decoded = json.loads(encoded)
        self.assertEqual(decoded[0]["body"], body)
        self.assertNotIn("processing_consented_at", decoded[0])
        self.assertNotIn("moderation_reason", decoded[0])
        public_review = catalog.public_reviews_snapshot(self.connection)["reviews"][0]
        self.assertEqual(public_review["body"], body)
        self.assertNotIn("moderation_reason", public_review)
        catalog_json = json.dumps(catalog.public_snapshot(self.connection), ensure_ascii=False)
        self.assertNotIn("reviews", json.loads(catalog_json))
        self.assertNotIn("Посетитель", catalog_json)
        self.assertNotIn("Ягоды", catalog_json)
        self.connection.execute(
            "DELETE FROM reviews WHERE id=?", (review_id,)
        )
        self.assertEqual(self.connection.execute("SELECT * FROM public_reviews").fetchall(), [])
        self.assertEqual(catalog.public_reviews_snapshot(self.connection)["reviews"], [])

    def test_review_rejects_blank_fields(self) -> None:
        with self.assertRaises(sqlite3.IntegrityError):
            self.connection.execute(
                "INSERT INTO reviews(display_name, region, cultivar_name, body, "
                "consent_processing, processing_consented_at) "
                "VALUES (' ', 'Калининградская область', 'Сорт', 'Текст', 1, '2026-09-24 12:00:00')",
            )
        with self.assertRaises(sqlite3.IntegrityError):
            self.connection.execute(
                "INSERT INTO reviews(display_name, region, cultivar_name, body, "
                "consent_processing, processing_consented_at) "
                "VALUES ('Автор', 'Калининградская область', 'Сорт', 'Текст', 0, '2026-09-24 12:00:00')",
            )

    def test_low_value_review_cannot_be_approved(self) -> None:
        self.connection.execute(
            "INSERT INTO reviews(display_name, region, cultivar_name, body, "
            "consent_processing, processing_consented_at, consent_publication, publication_consented_at, "
            "moderation_model, moderation_verdict, moderation_reason, moderation_version, moderated_at) "
            "VALUES ('Автор', 'Область', 'Сорт', 'Бред, всё это полный бред', "
            "1, '2026-09-24 12:00:00', 1, '2026-09-24 12:00:00', "
            "'jev', 'low_value', 'Нет наблюдения', 'v2', '2026-09-24 12:01:00')"
        )
        self.assertEqual(catalog.public_reviews_snapshot(self.connection)["reviews"], [])
        with self.assertRaises(sqlite3.IntegrityError):
            self.connection.execute(
                "UPDATE reviews SET status='approved', published_at='2026-09-24 12:02:00' WHERE id=1"
            )

    def test_reply_publication_snapshot_and_parent_visibility(self) -> None:
        def insert_approved(parent_id: int | None, name: str, body: str) -> int:
            cursor = self.connection.execute(
                "INSERT INTO reviews(parent_id, display_name, region, cultivar_name, body, "
                "consent_processing, processing_consented_at, consent_publication, "
                "publication_consented_at, status, moderation_model, moderation_verdict, "
                "moderation_reason, moderation_version, moderated_at, published_at) "
                "VALUES (?, ?, 'Калининградская область', 'Полка', ?, "
                "1, '2026-09-25 12:00:00', 1, '2026-09-25 12:00:00', 'approved', "
                "'jev', 'not_spam', 'classified_useful', 'v3', "
                "'2026-09-25 12:01:00', '2026-09-25 12:01:00')",
                (parent_id, name, body),
            )
            return cursor.lastrowid

        root_id = insert_approved(None, "Автор", "Полка дала ягоды в августе.")
        child_id = insert_approved(root_id, "Сосед", "В каком месяце началось цветение?")
        grandchild_id = insert_approved(child_id, "Автор 2", "У меня цветение началось в июне.")
        snapshot = catalog.public_reviews_snapshot(self.connection)["reviews"]
        self.assertEqual({row["id"] for row in snapshot}, {root_id, child_id, grandchild_id})
        self.assertEqual({row["parent_id"] for row in snapshot}, {None, root_id, child_id})
        self.assertEqual(set(snapshot[0]), {
            "id", "parent_id", "display_name", "region", "cultivar_name",
            "body", "created_at", "published_at",
        })

        with self.assertRaises(sqlite3.IntegrityError):
            insert_approved(9999, "Чужой", "Ответ без родителя")
        with self.assertRaises(sqlite3.IntegrityError):
            self.connection.execute(
                "UPDATE reviews SET parent_id=? WHERE id=?", (child_id, root_id)
            )
        self.connection.execute(
            "UPDATE reviews SET status='rejected' WHERE id=?", (root_id,)
        )
        self.assertEqual(catalog.public_reviews_snapshot(self.connection)["reviews"], [])


if __name__ == "__main__":
    unittest.main()
