"""A Moscow Oblast titled study does not locate Borovitskaya's trial plot."""

from __future__ import annotations

import contextlib
import io
import sys
import tempfile
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
import catalog  # noqa: E402


SOURCE_KEY = "vniispk-strawberry-moscow-comparison-2006-2007"


class BorovitskayaMoscowStudy0047Tests(unittest.TestCase):
    def setUp(self) -> None:
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.connection = catalog.connect(Path(self.temp.name) / "catalog.sqlite3", create=True)
        self.addCleanup(self.connection.close)
        with contextlib.redirect_stdout(io.StringIO()):
            catalog.migrate(self.connection)

    def test_result_is_published_with_uncertainty_but_no_region_or_rule(self) -> None:
        cultivars = {
            row["slug"]: row for row in catalog.public_snapshot(self.connection)["cultivars"]
        }
        observations = [
            row for row in cultivars["borovitskaya"]["observations"]
            if row["trait_code"] == "yield" and row["source_key"] == SOURCE_KEY
        ]
        self.assertEqual(len(observations), 1)
        result = observations[0]
        self.assertEqual((result["value_number"], result["unit"]), (140.0, "ц/га"))
        self.assertIsNone(result["region_code"])
        self.assertIsNone(result["observed_on"])
        self.assertIn("два года", result["context_text"])

        evidence = result["evidence"]
        self.assertEqual(evidence["evidence_kind"], "published_study")
        self.assertIsNone(evidence["period_from"])
        self.assertIsNone(evidence["period_to"])
        self.assertIn("точный участок не назван", evidence["place_text"])
        self.assertIn("точные годы", evidence["uncertainty_text"])
        self.assertIn("непосредственно перед таблицей", evidence["source_locator"])
        self.assertIn("не обосновывает правило", evidence["limitations_note"])

        self.assertEqual(
            self.connection.execute(
                "SELECT count(*) FROM recommendation_rules WHERE source_id="
                "(SELECT id FROM sources WHERE source_key=?)", (SOURCE_KEY,)
            ).fetchone()[0],
            0,
        )

    def test_source_review_controls_publication(self) -> None:
        self.connection.execute("UPDATE sources SET review_status='draft' WHERE source_key=?", (SOURCE_KEY,))
        self.assertEqual(
            self.connection.execute(
                "SELECT count(*) FROM public_observations o "
                "JOIN cultivars c ON c.id=o.cultivar_id "
                "WHERE c.slug='borovitskaya' AND o.source_key=?", (SOURCE_KEY,)
            ).fetchone()[0],
            0,
        )


if __name__ == "__main__":
    unittest.main()
