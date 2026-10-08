#!/usr/bin/env python3
"""Validate the saved research and the three built metadata changes."""
import csv
import hashlib
import html
import json
import re
import subprocess
from pathlib import Path
from urllib.parse import parse_qs, urlparse

ROOT = Path(__file__).resolve().parent
PROJECT = ROOT.parents[2]


def read_csv(name):
    return list(csv.DictReader((ROOT / name).open(encoding='utf-8-sig')))


summary = json.loads((ROOT / 'summary.json').read_text())
crosscheck = json.loads((ROOT / 'ui-export-crosscheck.json').read_text())
low = read_csv('shortlist-low.csv')
additional = read_csv('shortlist-additional-low.csv')
priority = read_csv('priority-queries.csv')
assert len(low) == summary['low_garden_queries'] == 597
assert len(additional) == summary['low_garden_additional_queries'] == 113
assert len(priority) == 58 and len({r['query'] for r in priority}) == 58
assert summary['unique_queries'] == 7761 and summary['query_observations'] == 8084
assert crosscheck['comparisons'] == 1782 and not crosscheck['mismatches']
assert summary['metric_conflicts'] == 0
for rows in [low, additional, priority]:
    assert all(r['competition_code'] == 'LOW' and r['scope'] == 'garden' for r in rows)
    assert [int(r['demand']) for r in rows] == sorted([int(r['demand']) for r in rows], reverse=True)
    for row in rows:
        if row['target_path']:
            assert (PROJECT / 'dist' / row['target_path'].strip('/') / 'index.html').exists(), row['target_path']
assert {r['query'] for r in priority} <= {r['query'] for r in low}
assert all('AdditionalQueries' in r['table_sources'] for r in additional)

exports = []
for path in sorted((ROOT / 'exports').glob('*.xlsx')):
    metadata = json.loads(path.with_suffix('.metadata.json').read_text())
    params = parse_qs(urlparse(metadata['ui_url']).query)
    assert params['query'] == [metadata['query']]
    assert params['regions'] == ['225'] and params['device'] == ['ALL_DEVICES']
    assert not params.get('excludedWords')
    exports.append({'file': path.name, 'seed': metadata['query'],
                    'sha256': hashlib.sha256(path.read_bytes()).hexdigest()})
assert len(exports) == 7
maps = [json.loads(p.read_text()) for p in sorted((ROOT / 'competitor-maps').glob('*.json'))]
assert sorted(len(m['queries']) for m in maps) == [11, 13, 26, 40]
assert all(len(m['queries']) == m['expected_ui_queries'] for m in maps)
reads = [json.loads(p.read_text()) for p in sorted((ROOT / 'competitor-page-reads').glob('*.json'))]
assert sum(bool(r['verified_url']) for r in reads) == 3

source_path = 'site/editorial-2026-09-26.mjs'
source = (PROJECT / source_path).read_text()
base_source = subprocess.check_output(['git', 'show', 'HEAD:' + source_path], cwd=PROJECT, text=True)
reverted = source
metadata_checks = []
for slug in ['sorta-maliny-dlya-podmoskovya-kak-vybrat',
             'zhelteyut-listya-maliny-chto-proverit', 'tlya-na-maline-chto-delat']:
    pattern = r"slug: '" + re.escape(slug) + r"'[\s\S]*?title: '([^']+)',\s*description: '([^']+)'"
    old_title, old_description = re.search(pattern, base_source).groups()
    title, description = re.search(pattern, source).groups()
    page = PROJECT / 'dist' / 'zhurnal' / slug / 'index.html'
    built = page.read_text()
    assert title in html.unescape(re.search(r'<title>(.*?)</title>', built).group(1))
    heading = re.search(r'<h1[^>]*>([\s\S]*?)</h1>', built).group(1)
    assert title == html.unescape(re.sub(r'<[^>]*>', '', heading)).strip()
    assert html.escape(description, quote=True) in built
    assert f'https://malinaklubnika.ru/zhurnal/{slug}/' in built
    reverted = reverted.replace(title, old_title).replace(description, old_description)
    metadata_checks.append({'slug': slug, 'title_h1_description_canonical': 'passed'})
assert reverted == base_source, 'Changes beyond the intended six metadata strings'

validation = {'status': 'passed', 'capture_date': '2026-10-08',
              'head': subprocess.check_output(['git', 'rev-parse', 'HEAD'], cwd=PROJECT, text=True).strip(),
              'query_observations': 8084, 'unique_queries': 7761, 'low_candidates': 597,
              'additional_low_candidates': 113, 'manually_reviewed_intents': 58,
              'ui_xls_comparisons': 1782, 'metric_conflicts': 0,
              'export_checksums': exports, 'competitor_query_maps': 4,
              'public_competitor_heading_reads': 3,
              'mail_article_read': 'ERR_CONNECTION_CLOSED; query map preserved',
              'metadata_checks': metadata_checks,
              'body_sources_review_dates_preserved': True,
              'build': {'command': 'SITE_URL=https://malinaklubnika.ru SITE_BASE=/ npm run build', 'exit': 0,
                        'html': 721, 'log': '/tmp/malina-seo01-production-build.log'},
              'tests': {'command': 'npm test', 'exit': 0, 'total': 311, 'passed': 310, 'skipped': 1, 'failed': 0,
                        'log': '/tmp/malina-seo01-test.log'},
              'public_check': {'command': 'npm run check:public', 'exit': 0, 'html': 470,
                               'scope': 'existing public release; local metadata changes unpublished',
                               'log': '/tmp/malina-seo01-public.log'},
              'publication': 'not performed'}
(ROOT / 'validation.json').write_text(json.dumps(validation, ensure_ascii=False, indent=2) + '\n')
for doc in [ROOT / 'README.md', PROJECT / 'docs/SEO_WORDCRAFT_2026-10-08.md']:
    for link in re.findall(r'\]\(([^)]+)\)', doc.read_text()):
        if '://' not in link and not link.startswith('#'):
            assert (doc.parent / link).exists(), (doc, link)
print('Research, target paths, source metadata, report links and built article metadata verified.')
