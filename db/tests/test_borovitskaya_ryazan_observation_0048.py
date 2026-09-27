"""The Ryazan control yield is local evidence, not a selection rule."""

from __future__ import annotations

import contextlib
import io
import sys
import tempfile
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
import catalog  # noqa: E402


SOURCE_KEY = "ryazan-borovitskaya-energy-m-trial-2013-2016"


class BorovitskayaRyazanObservation0048Tests(unittest.TestCase):
    def setUp(self) -> None:
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.connection = catalog.connect(Path(self.temp.name) / "catalog.sqlite3", create=True)
        self.addCleanup(self.connection.close)
        with contextlib.redirect_stdout(io.StringIO()):
            catalog.migrate(self.connection)

    def test_control_yield_has_local_passport_but_no_rule(self) -> None:
        cultivars = {
            row["slug"]: row for row in catalog.public_snapshot(self.connection)["cultivars"]
        }
        observations = [
            row for row in cultivars["borovitskaya"]["observations"]
            if row["source_key"] == SOURCE_KEY
        ]
        self.assertEqual(len(observations), 2)
        result = next(row for row in observations if row["value_number"] == 1.2)
        self.assertEqual((result["trait_code"], result["value_number"], result["unit"]),
                         ("yield", 1.2, "кг/м²"))
        self.assertEqual(result["region_code"], "ryazan-oblast")
        self.assertIsNone(result["observed_on"])
        self.assertIn("без обработки", result["context_text"])

        evidence = result["evidence"]
        self.assertEqual(evidence["evidence_kind"], "published_study")
        self.assertEqual(evidence["place_text"],
                         "ОПХ «Полково», Рязанский район, Рязанская область")
        self.assertEqual((evidence["period_from"], evidence["period_to"]),
                         ("2013", "2016"))
        self.assertEqual(evidence["sample_size"], 20)
        self.assertIn("таблица 1", evidence["source_locator"])
        self.assertIn("не связывает", evidence["uncertainty_text"])
        self.assertIn("не обосновывает региональное правило", evidence["limitations_note"])
        self.assertEqual(
            self.connection.execute(
                "SELECT count(*) FROM recommendation_rules WHERE source_id="
                "(SELECT id FROM sources WHERE source_key=?)", (SOURCE_KEY,)
            ).fetchone()[0],
            0,
        )

    def test_second_year_control_yield_0050_keeps_its_own_scope(self) -> None:
        cultivars = {
            row["slug"]: row for row in catalog.public_snapshot(self.connection)["cultivars"]
        }
        observations = [
            row for row in cultivars["borovitskaya"]["observations"]
            if row["source_key"] == SOURCE_KEY and row["value_number"] == 1.0
        ]
        self.assertEqual(len(observations), 1)
        result = observations[0]
        self.assertEqual((result["trait_code"], result["unit"], result["region_code"]),
                         ("yield", "кг/м²", "ryazan-oblast"))
        self.assertIsNone(result["observed_on"])
        self.assertIn("1,0 ± 0,01 кг/м²", result["context_text"])
        self.assertIn("во второй год вегетации", result["context_text"])

        evidence = result["evidence"]
        self.assertEqual(evidence["place_text"],
                         "ОПХ «Полково», Рязанский район, Рязанская область")
        self.assertEqual((evidence["period_from"], evidence["period_to"]),
                         ("2013", "2016"))
        self.assertEqual(evidence["sample_size"], 20)
        self.assertIn('"vegetation_year":2', evidence["conditions_json"])
        self.assertIn("четырёхкратной повторностью", evidence["method_text"])
        self.assertIn("второй год вегетации", evidence["source_locator"])
        self.assertIn("не связывает", evidence["uncertainty_text"])
        source_reference = self.connection.execute(
            "SELECT reference FROM sources WHERE source_key=?", (SOURCE_KEY,)
        ).fetchone()[0]
        self.assertIn("первый и второй годы вегетации", source_reference)
        self.assertEqual(
            self.connection.execute(
                "SELECT count(*) FROM public_recommendations r "
                "JOIN cultivars c ON c.id=r.cultivar_id "
                "WHERE c.slug='borovitskaya' AND r.region_code='ryazan-oblast'"
            ).fetchone()[0],
            0,
        )

    def test_source_review_controls_publication(self) -> None:
        self.connection.execute(
            "UPDATE sources SET review_status='draft' WHERE source_key=?", (SOURCE_KEY,)
        )
        self.assertEqual(
            self.connection.execute(
                "SELECT count(*) FROM public_observations WHERE source_key=?", (SOURCE_KEY,)
            ).fetchone()[0],
            0,
        )


if __name__ == "__main__":
    unittest.main()
