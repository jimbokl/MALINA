"""Synthetic cases only; none of these fixture sales are project revenue."""
import importlib.util
import json
import csv
import tempfile
import unittest
from pathlib import Path

spec = importlib.util.spec_from_file_location('reconcile', Path(__file__).parents[2] / 'scripts/reconcile_affiliate.py')
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)
P = 'p1_' + 'a' * 32
C = 'c1_' + 'b' * 32
MANIFEST = [{'attribution_id': P, 'seller_id': 'garshinka', 'page_path': '/magazin/malina-gusar/',
             'offer_id': 'g-1', 'product_id': 'malina-gusar', 'cta_placement': 'shop_offer'}]


def action(**changes):
    return dict(action_id=1, advcampaign_id=21527, action_type='sale', order_id='PRIVATE_ORDER',
                status='approved', currency='RUB', payment='10.10', subid=C, paid=0, processed=1, **changes)


def envelope(rows):
    return {'website_id': 3005376, 'complete': True, 'results': rows}


class ReconciliationTests(unittest.TestCase):
    def test_exact_click_source_and_private_fields(self):
        clicks = {C: {'attribution_id': P, 'landing_path': '/sorta/gusar/',
                      'traffic_source': 'organic', 'search_engine': 'yandex'}}
        report = module.reconcile(envelope([action()]), MANIFEST, clicks)
        self.assertEqual(report['groups'][0]['traffic_source'], 'organic')
        self.assertEqual(report['commission']['RUB']['approved'], '10.10')
        self.assertEqual(report['commission']['RUB']['credited'], '10.10')
        self.assertEqual(report['commission']['RUB']['paid'], '0')
        self.assertNotIn('PRIVATE_ORDER', json.dumps(report))
        self.assertNotIn(C, json.dumps(report))

    def test_placement_has_no_organic_claim_and_no_export_is_unknown(self):
        row = action(); row['subid'] = P
        report = module.reconcile(envelope([row]), MANIFEST)
        group = report['groups'][0]
        self.assertEqual(group['match'], 'placement_only')
        self.assertEqual(group['traffic_source'], 'unknown')
        self.assertIsNone(report['metrika_clicks'])
        self.assertIsNone(group['metrika_clicks'])

    def test_duplicate_actions_positions_and_split_orders(self):
        one = action(); one['positions'] = [{'payment': '999'}]
        two = {**one, 'action_id': 2, 'payment': '2.20'}
        report = module.reconcile(envelope([one, one, two]), MANIFEST)
        self.assertEqual(report['registered_orders'], 1)
        self.assertEqual(report['actions'], 2)
        self.assertEqual(report['commission']['RUB']['approved'], '12.30')

    def test_currency_and_status_separation_missing_paid_not_zero(self):
        one = action(); one.pop('paid'); one.pop('processed')
        two = {**action(), 'action_id': 2, 'currency': 'USD', 'payment': '2', 'status': 'declined'}
        report = module.reconcile(envelope([one, two]), MANIFEST)
        self.assertEqual(report['unknown_paid_actions'], 1)
        self.assertEqual(report['unknown_processed_actions'], 1)
        self.assertEqual(report['commission']['USD']['approved'], '0')
        self.assertEqual(report['commission']['USD']['declined'], '2')

    def test_incomplete_foreign_and_conflicting_exports_fail(self):
        with self.assertRaises(ValueError):
            module.reconcile({**envelope([]), 'complete': False}, MANIFEST)
        with self.assertRaises(ValueError):
            module.reconcile({**envelope([]), '_meta': {'count': 1}}, MANIFEST)
        with self.assertRaises(ValueError):
            module.reconcile(envelope([action(), {**action(), 'payment': '99'}]), MANIFEST)
        with self.assertRaises(ValueError):
            module.reconcile({**envelope([]), 'website_id': 123}, MANIFEST)

    def test_empty_real_report_has_no_synthetic_winners(self):
        report = module.reconcile(envelope([]), MANIFEST)
        self.assertEqual(report['registered_orders'], 0)
        self.assertEqual(report['groups'], [])
        self.assertIsNone(report['metrika_clicks'])

    def test_logs_goal_visit_join_and_query_removal(self):
        with tempfile.TemporaryDirectory() as directory:
            hits = Path(directory) / 'hits.tsv'
            visits = Path(directory) / 'visits.tsv'
            with visits.open('w', newline='') as stream:
                writer = csv.writer(stream, delimiter='\t')
                writer.writerow(['ym:s:visitID', 'ym:s:startURL', 'ym:s:lastTrafficSource', 'ym:s:lastSearchEngineRoot'])
                writer.writerow(['PRIVATE_VISIT', 'https://malinaklubnika.ru/sorta/gusar/?secret=private#x', 'organic', 'yandex'])
            with hits.open('w', newline='') as stream:
                writer = csv.writer(stream, delimiter='\t')
                writer.writerow(['ym:pv:visitID', 'ym:pv:goalsID', 'ym:pv:params'])
                writer.writerow(['PRIVATE_VISIT', '[664725910]', json.dumps({'affiliate_click_id': C, 'attribution_id': P})])
                writer.writerow(['PRIVATE_VISIT', '[]', json.dumps({'affiliate_click_id': 'c1_' + 'c'*32, 'attribution_id': P})])
            clicks = module.metrika_clicks(hits, visits)
            report = module.reconcile(envelope([action()]), MANIFEST, clicks)
            self.assertEqual(report['metrika_clicks'], 1)
            self.assertEqual(report['groups'][0]['landing_path'], '/sorta/gusar/')
            self.assertNotIn('PRIVATE_VISIT', json.dumps(report))
            self.assertNotIn('secret', json.dumps(report))

    def test_unknown_manifest_never_creates_organic_order(self):
        clicks = {C: {'attribution_id': P, 'landing_path': '/sorta/gusar/',
                      'traffic_source': 'organic', 'search_engine': 'yandex'}}
        report = module.reconcile(envelope([action()]), [], clicks)
        order_group = next(x for x in report['groups'] if x['actions'])
        self.assertEqual(order_group['traffic_source'], 'unknown')


if __name__ == '__main__':
    unittest.main()
