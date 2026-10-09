from pathlib import Path
import csv
from collections import Counter, defaultdict
from urllib.parse import urlparse
ROOT = Path(__file__).resolve().parents[3]
OUT = Path(__file__).resolve().parent

with (ROOT/'research/wordstat/wordcraft-2026-10-08/covered-queries-low-moderate.csv').open(encoding='utf-8-sig', newline='') as f:
    queries = list(csv.DictReader(f))
with (ROOT/'research/analytics/search-intents-2026-10-08/page-performance.csv').open(encoding='utf-8-sig', newline='') as f:
    gsc = {r['path']: r for r in csv.DictReader(f)}
groups = defaultdict(list)
for q in queries:
    groups[urlparse(q['canonical_url']).path].append(q)
assert len(queries) == 3844 and len(groups) == 431
assert Counter(q['competition'] for q in queries) == {'Низкая': 643, 'Умеренная': 3201}
assert sum(bool(q['missing_resources']) for q in queries) == 340
tibetan_queries = [q for q in queries if 'тибет' in q['query'].lower()]
assert len(tibetan_queries) == 115
assert all(urlparse(q['canonical_url']).path == '/zhurnal/tibetskaya-malina-kakoe-rastenie/' for q in tibetan_queries)
fields = ['path','workstream','query_forms','low_forms','moderate_forms','max_monthly_users_exact_form','highest_demand_query','forms_missing_resources','gsc_impressions_2026_09_27_to_10_06','gsc_clicks_2026_09_27_to_10_06','gsc_weighted_position','evidence_basis']
records = []
for path, rows in groups.items():
    top = max(rows, key=lambda r: int(r['monthly_users_exact_form']))
    perf = gsc.get(path)
    records.append(dict(path=path, workstream='Сорт и выбор' if path.startswith('/sorta/') else 'Руководства и каталоги', query_forms=len(rows), low_forms=sum(r['competition']=='Низкая' for r in rows), moderate_forms=sum(r['competition']=='Умеренная' for r in rows), max_monthly_users_exact_form=top['monthly_users_exact_form'], highest_demand_query=top['query'], forms_missing_resources=sum(bool(r['missing_resources']) for r in rows), gsc_impressions_2026_09_27_to_10_06=perf['impressions'] if perf else '', gsc_clicks_2026_09_27_to_10_06=perf['clicks'] if perf else '', gsc_weighted_position=perf['weighted_position'] if perf else '', evidence_basis='GSC до SEO-выпуска + Wordcraft' if perf else 'Wordcraft; страница не выделена в сохранённой таблице GSC'))
records.sort(key=lambda r: (-int(r['gsc_impressions_2026_09_27_to_10_06'] or 0), -int(r['max_monthly_users_exact_form']), r['path']))
with (OUT/'page-priorities.csv').open('w',encoding='utf-8-sig',newline='') as f:
    writer=csv.DictWriter(f,fieldnames=fields,lineterminator="\n");writer.writeheader();writer.writerows(records)

print(f"{len(queries)} queries; {len(records)} pages; all included")
