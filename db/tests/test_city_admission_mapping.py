"""City subjects resolve only through the 2024 Register's Appendix 4 map."""

from __future__ import annotations

import re
import sys
import tempfile
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / "db"))
import catalog  # noqa: E402


# Transcribed from the 2024 State Register, Appendix 4, printed p. 604.
# The values are cultivar-admission regions, not climate zones.
CITY_ZONE_BY_SLUG = {
    "arkhangelsk": 1,
    "murmansk": 1,
    "petrozavodsk": 1,
    "kaliningrad": 2,
    "veliky-novgorod": 2,
    "kostroma": 2,
    "pskov": 2,
    "tver": 2,
    "yaroslavl": 2,
    "bryansk": 3,
    "vladimir": 3,
    "ivanovo": 3,
    "kaluga": 3,
    "ryazan": 3,
    "smolensk": 3,
    "tula": 3,
    "yekaterinburg": 4,
    "izhevsk": 4,
    "kirov": 4,
    "nizhny-novgorod": 4,
    "perm": 4,
    "cheboksary": 4,
    "belgorod": 5,
    "voronezh": 5,
    "lipetsk": 5,
    "oryol": 5,
    "krasnodar": 6,
    "rostov-on-don": 6,
    "stavropol": 6,
    "penza": 7,
    "kazan": 7,
    "samara": 7,
    "astraxan": 8,
    "volgograd": 8,
    "saratov": 8,
    "orenburg": 9,
    "ufa": 9,
    "chelyabinsk": 9,
    "barnaul": 10,
    "kemerovo": 10,
    "novosibirsk": 10,
    "omsk": 10,
    "tomsk": 10,
    "tyumen": 10,
    "surgut": 10,
    "chita": 11,
    "irkutsk": 11,
    "krasnoyarsk": 11,
    "ulan-ude": 11,
    "yakutsk": 11,
    "blagoveshchensk": 12,
    "vladivostok": 12,
    "khabarovsk": 12,
}

UNMAPPED_FEDERAL_CITIES = {"moscow", "saint-petersburg"}


def read_cities() -> list[dict[str, str]]:
    source = (ROOT / "site" / "cities.mjs").read_text(encoding="utf-8")
    entries = re.findall(
        r"\{ slug: '([^']+)', name: '([^']+)', region: '([^']+)' \}", source
    )
    return [dict(zip(("slug", "name", "region"), entry, strict=True)) for entry in entries]


class CityAdmissionMappingTests(unittest.TestCase):
    def setUp(self) -> None:
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.connection = catalog.connect(Path(self.temp.name) / "catalog.sqlite3", create=True)
        self.addCleanup(self.connection.close)
        catalog.migrate(self.connection)

    def test_all_catalog_cities_match_2024_appendix_4_subject_regions(self) -> None:
        cities = read_cities()
        self.assertEqual(len(cities), 55)
        self.assertEqual(
            {city["slug"] for city in cities},
            set(CITY_ZONE_BY_SLUG) | UNMAPPED_FEDERAL_CITIES,
        )

        rows = {
            row["name_ru"]: row
            for row in self.connection.execute(
                "SELECT r.name_ru, m.admission_region_number, s.source_key "
                "FROM regions r "
                "LEFT JOIN admission_region_map m ON m.region_id = r.id "
                "LEFT JOIN sources s ON s.id = m.source_id"
            )
        }
        mapped_count = 0
        for city in cities:
            row = rows.get(city["region"])
            if city["slug"] in UNMAPPED_FEDERAL_CITIES:
                self.assertTrue(
                    row is None or row["admission_region_number"] is None,
                    f"{city['name']} must remain unmapped in the 2024 Register scheme",
                )
                continue

            self.assertIsNotNone(row, f"Missing subject record for {city['region']}")
            self.assertEqual(
                row["admission_region_number"], CITY_ZONE_BY_SLUG[city["slug"]],
                f"Wrong 2024 admission region for {city['name']} ({city['region']})",
            )
            # Tula's existing database row cites the official GSK Central
            # Region page; the other city-subject rows cite Appendix 4 itself.
            expected_source = (
                "gsk-central-region"
                if city["slug"] == "tula"
                else "gsk-register-2024-region-map"
            )
            self.assertEqual(row["source_key"], expected_source)
            mapped_count += 1

        self.assertEqual(mapped_count, 53)


if __name__ == "__main__":
    unittest.main()
