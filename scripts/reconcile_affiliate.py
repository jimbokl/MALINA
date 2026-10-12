#!/usr/bin/env python3
"""Join private Metrika Logs and complete Admitad actions; emit aggregates only."""
import argparse
import csv
import json
import re
from collections import defaultdict
from decimal import Decimal
from pathlib import Path
from urllib.parse import urlsplit

SELLERS = {19919: 'agrosemfond', 21527: 'garshinka', 26467: 'onlinesemena'}
CLICK = re.compile(r'c1_[a-f0-9]{32}\Z')
PLACEMENT = re.compile(r'p1_[a-f0-9]{32}\Z')
GOAL_ID = 664725910


def load(path):
    return json.loads(Path(path).read_text(encoding='utf-8-sig'), parse_float=Decimal)


def path_only(value):
    url = urlsplit(value or '')
    if url.hostname and url.hostname not in {'malinaklubnika.ru', 'www.malinaklubnika.ru'}:
        return 'unknown'
    return url.path if re.fullmatch(r'/(?:[a-z0-9-]+/)*', url.path) else 'unknown'


def tsv(path):
    with Path(path).open(encoding='utf-8-sig', newline='') as stream:
        return list(csv.DictReader(stream, delimiter='\t'))


def event_objects(value):
    if isinstance(value, dict):
        if CLICK.fullmatch(str(value.get('affiliate_click_id', ''))):
            yield value
        for child in value.values():
            yield from event_objects(child)
    elif isinstance(value, list):
        for child in value:
            yield from event_objects(child)


def metrika_clicks(hits_path, visits_path):
    """Only affiliate goal hits; visit IDs stay in memory, never in output."""
    if not hits_path and not visits_path:
        return None
    if not hits_path or not visits_path:
        raise ValueError('Both hits and visits exports are required')
    visits = {}
    for row in tsv(visits_path):
        key = row['ym:s:visitID']
        projection = (path_only(row['ym:s:startURL']), row['ym:s:lastTrafficSource'],
                      row['ym:s:lastSearchEngineRoot'])
        if key in visits and visits[key] != projection:
            raise ValueError('Conflicting duplicate visit')
        visits[key] = projection
    result = {}
    for row in tsv(hits_path):
        goals = json.loads(row['ym:pv:goalsID'])
        if GOAL_ID not in [int(x) for x in goals]:
            continue
        for event in event_objects(json.loads(row['ym:pv:params'] or '{}')):
            click_id = event['affiliate_click_id']
            attribution = event.get('attribution_id', '')
            if not PLACEMENT.fullmatch(attribution):
                raise ValueError('Click has invalid placement ID')
            source = visits.get(row['ym:pv:visitID'], ('unknown', 'unknown', 'unknown'))
            projection = {'attribution_id': attribution, 'landing_path': source[0],
                          'traffic_source': source[1], 'search_engine': source[2]}
            if click_id in result and result[click_id] != projection:
                raise ValueError('Ambiguous duplicate click ID')
            result[click_id] = projection
    return result


def reconcile(actions, manifest, clicks=None):
    if str(actions.get('website_id')) != '3005376' or actions.get('complete') is not True:
        raise ValueError('Need complete MALINA actions export with website_id=3005376')
    rows = actions['results']
    if int(actions.get('_meta', {}).get('count', len(rows))) != len(rows):
        raise ValueError('Incomplete pagination')
    placements = {}
    for entry in manifest:
        key = entry['attribution_id']
        if not PLACEMENT.fullmatch(key) or entry['seller_id'] not in SELLERS.values():
            raise ValueError('Invalid manifest')
        if key in placements and placements[key] != entry:
            raise ValueError('Conflicting placement')
        placements[key] = entry
    groups = {}
    seen = {}
    total_orders = set()
    total_actions = 0
    currencies = defaultdict(lambda: {x: Decimal(0) for x in ['pending', 'approved', 'declined', 'credited', 'paid']})
    unknown_paid = unknown_processed = 0

    def group(entry=None, click=None, match='unattributed', seller='unknown'):
        dims = {'seller_id': seller, 'match': match, 'page_path': (entry or {}).get('page_path', 'unknown'),
                'product_id': (entry or {}).get('product_id', 'unknown'),
                'offer_id': (entry or {}).get('offer_id', 'unknown'),
                'cta_placement': (entry or {}).get('cta_placement', 'unknown'),
                'landing_path': (click or {}).get('landing_path', 'unknown'),
                'traffic_source': (click or {}).get('traffic_source', 'unknown'),
                'search_engine': (click or {}).get('search_engine', 'unknown')}
        key = tuple(dims.values())
        if key not in groups:
            groups[key] = {**dims, 'metrika_clicks': 0 if clicks is not None else None,
                           'actions': 0, '_orders': set(), '_status_orders': defaultdict(set),
                           '_money': defaultdict(lambda: defaultdict(Decimal)),
                           'unknown_paid_actions': 0, 'unknown_processed_actions': 0}
        return groups[key]

    for click in (clicks or {}).values():
        entry = placements.get(click['attribution_id'])
        if entry:
            group(entry, click, 'exact_click', entry['seller_id'])['metrika_clicks'] += 1
        else:
            group(click=click, match='unmapped_metrika_click')['metrika_clicks'] += 1
    for row in rows:
        action_id = str(row['action_id'])
        if action_id in seen:
            if seen[action_id] != row:
                raise ValueError('Conflicting duplicate action; use one current snapshot')
            continue
        seen[action_id] = row
        if 'website_id' in row and str(row['website_id']) != '3005376':
            raise ValueError('Foreign website in MALINA export')
        seller = SELLERS.get(int(row['advcampaign_id']))
        if not seller:
            raise ValueError('Unknown affiliate program')
        status, currency = row['status'], row['currency']
        if status not in {'pending', 'approved', 'declined'} or not re.fullmatch('[A-Z]{3}', currency):
            raise ValueError('Unknown status/currency')
        payment = Decimal(str(row['payment']))
        if not payment.is_finite():
            raise ValueError('Non-finite commission')
        subid = row.get('subid') or ''
        click = (clicks or {}).get(subid) if CLICK.fullmatch(subid) else None
        entry = placements.get(click['attribution_id']) if click else placements.get(subid)
        match = 'exact_click' if click and entry else 'placement_only' if entry else 'unattributed'
        if not entry:
            click = None
        if entry and entry['seller_id'] != seller:
            raise ValueError('Seller mismatch in attribution')
        bucket = group(entry, click, match, seller)
        bucket['actions'] += 1
        total_actions += 1
        if row['action_type'] == 'sale':
            if not row.get('order_id'):
                raise ValueError('Sale without order_id')
            order = (seller, str(row['order_id']))
            total_orders.add(order)
            bucket['_orders'].add(order)
            bucket['_status_orders'][status].add(order)
        for target in [currencies[currency], bucket['_money'][currency]]:
            target[status] += payment
            if status == 'approved' and row.get('processed') in [True, 1, '1']:
                target['credited'] += payment
            if status == 'approved' and row.get('paid') in [True, 1, '1']:
                target['paid'] += payment
        if status == 'approved' and row.get('paid') not in [True, False, 0, 1, '0', '1']:
            bucket['unknown_paid_actions'] += 1
            unknown_paid += 1
        if status == 'approved' and row.get('processed') not in [True, False, 0, 1, '0', '1']:
            bucket['unknown_processed_actions'] += 1
            unknown_processed += 1
    output = []
    for bucket in groups.values():
        bucket['registered_orders'] = len(bucket.pop('_orders'))
        bucket['orders_by_status'] = {s: len(v) for s, v in bucket.pop('_status_orders').items()}
        bucket['commission'] = {c: {s: str(v) for s, v in values.items()} for c, values in bucket.pop('_money').items()}
        output.append(bucket)
    return {'schema_version': 1, 'period': actions.get('period'), 'website_id': 3005376,
            'metrika_status': 'export_loaded' if clicks is not None else 'unavailable',
            'metrika_clicks': len(clicks) if clicks is not None else None,
            'registered_orders': len(total_orders), 'actions': total_actions,
            'commission': {c: {s: str(v) for s, v in values.items()} for c, values in currencies.items()},
            'unknown_paid_actions': unknown_paid, 'unknown_processed_actions': unknown_processed,
            'groups': sorted(output, key=lambda x: tuple(str(x[k]) for k in ['seller_id', 'match', 'page_path', 'offer_id', 'traffic_source', 'landing_path'])),
            'notes': ['Orders are distinct seller/order_id; status/group counts may overlap for split orders.',
                      'Commission uses action.payment once; positions are not added again.',
                      'placement_only identifies CTA cohort, never organic source.',
                      'paid/credited sums cover explicit flags only; check unknown_* counts.',
                      'No conversion rate: clicks and actions may use different cohorts.',
                      'Matched offer is clicked offer, not necessarily the purchased basket item.']}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--actions', required=True)
    parser.add_argument('--manifest', required=True)
    parser.add_argument('--hits')
    parser.add_argument('--visits')
    parser.add_argument('--out', required=True)
    args = parser.parse_args()
    result = reconcile(load(args.actions), load(args.manifest), metrika_clicks(args.hits, args.visits))
    Path(args.out).write_text(json.dumps(result, ensure_ascii=False, indent=2) + '\n')


if __name__ == '__main__':
    main()
