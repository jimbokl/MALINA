"""City × raspberry variety counts from dated listing exports."""

from __future__ import annotations

import csv
import sys
import tempfile
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
import catalog  # noqa: E402
import market_presence  # noqa: E402


class MarketPresenceTests(unittest.TestCase):
    def setUp(self) -> None:
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name)
        self.connection = catalog.connect(self.root / "catalog.sqlite3", create=True)
        self.addCleanup(self.connection.close)
        catalog.migrate(self.connection)

    def csv(self, rows: list[dict[str, str]], *, extra_column: str = "") -> Path:
        path = self.root / "listings.csv"
        columns = ["listing_id", "listing_url", "city", "title", "description", "seller_id"]
        if extra_column:
            columns.append(extra_column)
        with path.open("w", encoding="utf-8", newline="") as handle:
            writer = csv.DictWriter(handle, fieldnames=columns)
            writer.writeheader()
            writer.writerows(rows)
        return path

    def row(self, listing_id: str, city: str, title: str, description: str = "",
            seller_id: str = "") -> dict[str, str]:
        return {
            "listing_id": listing_id,
            "listing_url": f"https://www.avito.ru/{market_presence.normalize(city)}/rastenia_{listing_id}",
            "city": city,
            "title": title,
            "description": description,
            "seller_id": seller_id,
        }

    def test_counts_unique_listings_and_sellers_by_actual_city(self) -> None:
        one = self.row("100", "Калининград", "Саженцы малины Атлант", seller_id="seller-a")
        path = self.csv([
            one,
            one,  # The same ad was found on two search pages.
            self.row("101", "Калининград", "Малина ремонтантная", "Есть Атлант и Геракл", "seller-a"),
            self.row("102", "Москва", "Саженцы малины Атлант", seller_id="seller-b"),
            self.row("103", "Калининград", "Малина без названия", seller_id="seller-c"),
        ])
        result = market_presence.import_snapshot(
            self.connection, batch_id="2026-09-29-sample", observed_on="2026-09-29",
            scope_text="Тестовая выгрузка двух городов", csv_path=path, seller_key="test-secret",
        )
        self.assertEqual(result, {"input_rows": 5, "unique_listings": 4, "matched_listings": 3})
        counts = market_presence.report(self.connection, "2026-09-29-sample")["counts"]
        atlant = [r for r in counts if r["cultivar_slug"] == "atlant"]
        self.assertEqual({r["city_name"]: r["listing_count"] for r in atlant},
                         {"Калининград": 2, "Москва": 1})
        kaliningrad = next(r for r in atlant if r["city_name"] == "Калининград")
        self.assertEqual((kaliningrad["title_count"], kaliningrad["description_count"]), (1, 1))
        self.assertEqual(kaliningrad["known_seller_count"], 1)
        self.assertEqual(kaliningrad["unknown_seller_listings"], 0)
        self.assertEqual(kaliningrad["city_total_listings"], 3)
        self.assertEqual(kaliningrad["city_listing_share"], 0.6667)
        self.assertEqual(self.connection.execute("SELECT count(*) FROM market_presence_mentions WHERE matched_name = 'Геракл'").fetchone()[0], 1)

    def test_no_seller_identifiers_or_contacts_are_persisted(self) -> None:
        path = self.csv([self.row("100", "Калининград", "Малина Атлант", seller_id="secret-seller")])
        with self.assertRaisesRegex(ValueError, "MARKET_SELLER_HASH_KEY"):
            market_presence.import_snapshot(self.connection, batch_id="x", observed_on="2026-09-29",
                                            scope_text="test", csv_path=path)
        self.assertEqual(self.connection.execute("SELECT count(*) FROM market_presence_batches").fetchone()[0], 0)
        market_presence.import_snapshot(self.connection, batch_id="x", observed_on="2026-09-29",
                                        scope_text="test", csv_path=path, seller_key="pepper")
        stored = self.connection.execute("SELECT seller_digest FROM market_presence_listings").fetchone()[0]
        self.assertNotIn("secret-seller", stored)
        path = self.csv([dict(self.row("101", "Москва", "Малина Атлант"), phone="123")], extra_column="phone")
        with self.assertRaisesRegex(ValueError, "personal contact columns"):
            market_presence.read_listing_rows(path)

    def test_conflicting_city_for_one_listing_is_rejected(self) -> None:
        path = self.csv([
            self.row("100", "Калининград", "Малина Атлант"),
            self.row("100", "Москва", "Малина Атлант"),
        ])
        with self.assertRaisesRegex(ValueError, "conflicting city"):
            market_presence.import_snapshot(self.connection, batch_id="x", observed_on="2026-09-29",
                                            scope_text="test", csv_path=path)
        self.assertEqual(self.connection.execute("SELECT count(*) FROM market_presence_batches").fetchone()[0], 0)


if __name__ == "__main__":
    unittest.main()
