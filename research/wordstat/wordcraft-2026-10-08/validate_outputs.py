#!/usr/bin/env python3
"""Check ranked query exports against exact original metrics and coverage JSON."""
import csv
import hashlib
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent
def rows(name):
    with (ROOT / name).open(encoding='utf-8-sig', newline='') as stream:
        return list(csv.DictReader(stream))

original = {row['query']: row for row in rows('queries-all.csv')}
coverage = json.loads((ROOT / 'query-coverage.json').read_text())['records']
expected = {row['query']: row for row in coverage if row['disposition'] == 'covered'}
export = rows('covered-queries-low-moderate.csv')
assert len(export) == len(expected)
assert len({row['query'] for row in export}) == len(export)
assert {row['query'] for row in export} == set(expected)
assert (ROOT / 'covered-queries-low-moderate.csv').read_bytes().startswith(b'\xef\xbb\xbf')
rank = lambda row: (0 if row['competition'] == 'Низкая' else 1, -int(row['monthly_users_exact_form']))
assert [rank(row) for row in export] == sorted(rank(row) for row in export)
for row in export:
    source, target = original[row['query']], expected[row['query']]
    assert int(row['monthly_users_exact_form']) == int(source['demand']) == target['demand']
    assert int(row['monthly_search_clicks']) == int(source['clicks']) == target['clicks']
    assert row['competition'] == ('Низкая' if source['competition_code'] == 'LOW' else 'Умеренная')
    assert row['canonical_url'] == target['canonicalUrl']
    assert row['answer_anchor'] == target['answerAnchor']
    assert row['missing_resources'] == '; '.join(target.get('missingResources', []))
    assert row['photo_source_url'] == target.get('photoSourceUrl', '')
    assert row['review_source_urls'] == '; '.join(target.get('reviewSourceUrls', []))
    assert row['review_resource_kinds'] == '; '.join(target.get('reviewResourceKinds', []))
missing = rows('queries-missing-resources.csv')
assert {row['query'] for row in missing} == {row['query'] for row in coverage if row.get('missingResources')}
excluded = rows('queries-out-of-scope.csv')
assert {row['query'] for row in excluded} == {row['query'] for row in coverage if row['disposition'] == 'out_of_scope'}
assert all(row['reason'] for row in excluded)
report = {
    'status': 'passed', 'utf8Bom': True, 'coveredRows': len(export),
    'exactFormsAndMetricsPreserved': True, 'uniqueQueries': True,
    'rankedLowThenModerateDescendingDemand': True, 'resourceRows': len(missing),
    'outOfScopeRows': len(excluded), 'resourceUrlsMatchVerifiedMapping': True,
    'csvSha256': hashlib.sha256((ROOT / 'covered-queries-low-moderate.csv').read_bytes()).hexdigest()
}
(ROOT / 'csv-source-validation.json').write_text(json.dumps(report, ensure_ascii=False, indent=2) + '\n')
print(json.dumps(report, ensure_ascii=False))
