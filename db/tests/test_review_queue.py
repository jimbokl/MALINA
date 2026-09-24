"""Review migration and the private editorial queue."""

from __future__ import annotations

import sqlite3
import sys
import tempfile
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
import catalog  # noqa: E402


def insert_review(connection: sqlite3.Connection, *, name: str, status: str,
                  parent_id: int | None = None, verdict: str | None = None) -> int:
    published = status == "approved"
    cursor = connection.execute(
        "INSERT INTO reviews (parent_id, display_name, region, cultivar_name, body, "
        "consent_processing, processing_consented_at, consent_publication, "
        "publication_consented_at, status, moderation_model, moderation_verdict, "
        "moderation_reason, moderation_version, moderated_at, published_at) "
        "VALUES (?, ?, 'Калининградская область', 'Полка', "
        "'На моём участке Полка плодоносила в августе, но ягоды были кислые.', "
        "1, '2026-09-24 12:00:00', 1, '2026-09-24 12:00:00', "
        "?, ?, ?, ?, ?, ?, ?)",
        (parent_id, name, status, "jev-test" if verdict else None, verdict,
         "classified_useful" if verdict else None,
         "review-publication-v3" if verdict else None,
         "2026-09-24 12:00:00" if verdict else None,
         "2026-09-24 12:00:00" if published else None),
    )
    return cursor.lastrowid


class ReviewQueueTests(unittest.TestCase):
    def setUp(self) -> None:
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.connection = catalog.connect(Path(self.temp.name) / "catalog.sqlite3", create=True)
        self.addCleanup(self.connection.close)
        catalog.migrate(self.connection)

    def test_pending_is_private_and_human_approval_preserves_jev_evidence(self) -> None:
        root_id = insert_review(self.connection, name="Анна", status="approved",
                                verdict="not_spam")
        pending_id = insert_review(self.connection, name="Елена", status="pending_human_review",
                                   parent_id=root_id, verdict="needs_review")
        self.connection.commit()
        queue = catalog.review_queue(self.connection)
        self.assertEqual(queue["count"], 1)
        self.assertEqual(queue["reviews"][0]["id"], pending_id)
        self.assertEqual(queue["reviews"][0]["moderation_verdict"], "needs_review")
        self.assertEqual(len(catalog.public_reviews_snapshot(self.connection)["reviews"]), 1)

        self.assertEqual(catalog.decide_review(self.connection, pending_id, "approved", "editor"),
                         {"id": pending_id, "status": "approved"})
        self.assertEqual(catalog.review_queue(self.connection)["count"], 0)
        public = catalog.public_reviews_snapshot(self.connection)["reviews"]
        self.assertEqual(len(public), 2)
        self.assertEqual(next(row for row in public if row["id"] == pending_id)["parent_id"], root_id)
        row = self.connection.execute(
            "SELECT moderation_verdict, reviewed_by, reviewed_at FROM reviews WHERE id=?",
            (pending_id,),
        ).fetchone()
        self.assertEqual(row["moderation_verdict"], "needs_review")
        self.assertEqual(row["reviewed_by"], "human:editor")
        self.assertIsNotNone(row["reviewed_at"])

    def test_rejection_keeps_record_out_of_public_export(self) -> None:
        pending_id = insert_review(self.connection, name="Школьник", status="pending_human_review")
        self.connection.commit()
        catalog.decide_review(self.connection, pending_id, "rejected", "editor")
        self.assertEqual(catalog.review_queue(self.connection)["count"], 0)
        self.assertEqual(catalog.public_reviews_snapshot(self.connection)["reviews"], [])
        self.assertEqual(self.connection.execute(
            "SELECT status FROM reviews WHERE id=?", (pending_id,)
        ).fetchone()[0], "rejected")

    def test_reply_requires_public_parent_at_manual_approval(self) -> None:
        root_id = insert_review(self.connection, name="Анна", status="approved",
                                verdict="not_spam")
        child_id = insert_review(self.connection, name="Елена", status="pending_human_review",
                                 parent_id=root_id)
        self.connection.execute("UPDATE reviews SET status='rejected' WHERE id=?", (root_id,))
        self.connection.commit()
        with self.assertRaisesRegex(ValueError, "parent"):
            catalog.decide_review(self.connection, child_id, "approved", "editor")
        self.assertEqual(catalog.review_queue(self.connection)["count"], 1)


class ReviewMigrationTests(unittest.TestCase):
    def test_pending_and_existing_discussion_survive_table_rebuild(self) -> None:
        connection = sqlite3.connect(":memory:")
        self.addCleanup(connection.close)
        connection.row_factory = sqlite3.Row
        connection.execute("PRAGMA foreign_keys=ON")
        for version in ("0003_reviews", "0005_reviews_without_token", "0006_review_replies"):
            connection.executescript((catalog.MIGRATIONS / f"{version}.sql").read_text())
        root_id = insert_review(connection, name="Анна", status="approved", verdict="not_spam")
        child_id = insert_review(connection, name="Елена", status="approved",
                                 parent_id=root_id, verdict="not_spam")
        pending_id = insert_review(connection, name="Мария", status="pending", parent_id=child_id)
        connection.executescript(
            (catalog.MIGRATIONS / "0007_review_human_queue.sql").read_text()
        )
        self.assertEqual(connection.execute(
            "SELECT id, parent_id, status FROM reviews ORDER BY id"
        ).fetchall()[2][:], (pending_id, child_id, "pending_human_review"))
        self.assertEqual(connection.execute("PRAGMA foreign_key_check").fetchall(), [])
        self.assertEqual([row[0] for row in connection.execute(
            "SELECT id FROM public_reviews ORDER BY id"
        )], [root_id, child_id])


if __name__ == "__main__":
    unittest.main()
