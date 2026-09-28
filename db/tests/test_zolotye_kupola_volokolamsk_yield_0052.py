"""The Volokolamsk yield is a published local observation, not a regional rule."""

from __future__ import annotations

import contextlib
import io
import json
import sys
import tempfile
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
import catalog  # noqa: E402


SOURCE_KEY = "mgau-volokolamsk-raspberry-comparison-2023-2024"


class ZolotyeKupolaVolokolamskYield0052Tests(unittest.TestCase):
    def setUp(self) -> None:
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.connection = catalog.connect(Path(self.temp.name) / "catalog.sqlite3", create=True)
        self.addCleanup(self.connection.close)
        with contextlib.redirect_stdout(io.StringIO()):
            catalog.migrate(self.connection)

    def test_two_year_yield_has_local_passport_and_no_recommendation(self) -> None:
        cultivars = {
            row["slug"]: row for row in catalog.public_snapshot(self.connection)["cultivars"]
        }
        observations = [
            row for row in cultivars["zolotye-kupola"]["observations"]
            if row["source_key"] == SOURCE_KEY
        ]
        self.assertEqual(len(observations), 1)
        observation = observations[0]
        self.assertEqual(
            (observation["trait_code"], observation["value_number"], observation["unit"]),
            ("yield", 10.5, "т/га"),
        )
        self.assertEqual(observation["region_code"], "moscow-oblast")
        self.assertEqual(observation["observed_on"], "2023–2024")
        self.assertIn("10,8 т/га в 2023 году", observation["context_text"])
        self.assertIn("10,2 т/га в 2024 году", observation["context_text"])

        evidence = observation["evidence"]
        self.assertEqual(evidence["evidence_kind"], "published_study")
        self.assertEqual(
            evidence["place_text"],
            "КФХ «АгроЭкоИнвест», Волоколамский район, Московская область",
        )
        self.assertEqual((evidence["period_from"], evidence["period_to"]),
                         ("2023", "2024"))
        self.assertEqual(
            json.loads(evidence["conditions_json"])["comparison_control"], "Бабье лето"
        )
        self.assertIn("НСР05", evidence["method_text"])
        self.assertIn("таблица 1", evidence["source_locator"])
        self.assertIn("число повторностей", evidence["uncertainty_text"])
        self.assertEqual(
            self.connection.execute(
                "SELECT count(*) FROM recommendation_rules WHERE source_id="
                "(SELECT id FROM sources WHERE source_key=?)", (SOURCE_KEY,)
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
