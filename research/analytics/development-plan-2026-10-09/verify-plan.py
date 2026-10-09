from pathlib import Path
from urllib.parse import urlparse, unquote
from collections import Counter, defaultdict
import csv, hashlib, json, re

ROOT = Path(__file__).resolve().parents[3]
OUT = Path(__file__).resolve().parent
files = ['BACKLOG.md', 'PRD.md', 'docs/STRATEGY.md', 'docs/ROADMAP_2026_2027.md', 'docs/MONETIZATION_PLAN.md', 'docs/MEASUREMENT.md', 'handoff.md']
failures = []
checks = []

def check(name, condition, detail=None):
    checks.append({'check': name, 'passed': bool(condition), 'detail': detail})
    if not condition:
        failures.append(name)

def read_csv(path):
    with path.open(encoding='utf-8-sig', newline='') as f:
        return list(csv.DictReader(f))

source = ROOT/'research/wordstat/wordcraft-2026-10-08/covered-queries-low-moderate.csv'
queries = read_csv(source)
pages = read_csv(OUT/'page-priorities.csv')
groups = defaultdict(list)
for q in queries:
    groups[urlparse(q['canonical_url']).path].append(q)
check('Full coverage: 3844 queries / 431 canonical pages', len(queries)==3844 and len(groups)==431)
check('Competition: 643 LOW / 3201 AVERAGE', Counter(q['competition'] for q in queries)=={'Низкая':643, 'Умеренная':3201})
check('Resource gaps: 340 forms', sum(bool(q['missing_resources']) for q in queries)==340)
coverage = json.loads((source.parent/'coverage-summary.json').read_text())
check('Resource detail: 221 photos / 287 reviews; unfinished', coverage['missingResourceCounts']=={'photo':221, 'gardener_reviews':287} and not coverage['resourceComplete'])
tibetan = [q for q in queries if 'тибет' in q['query'].lower()]
check('All 115 Tibetan query forms retain the published guide', len(tibetan)==115 and all(urlparse(q['canonical_url']).path=='/zhurnal/tibetskaya-malina-kakoe-rastenie/' for q in tibetan))
check('Page table retains every canonical path exactly once', len(pages)==431 and len({p['path'] for p in pages})==431 and {p['path'] for p in pages}==set(groups))
check('Page table retains every query/resource count', sum(int(p['query_forms']) for p in pages)==3844 and sum(int(p['forms_missing_resources']) for p in pages)==340)
check('Demand is maximum of an exact form, never summed', all(int(p['max_monthly_users_exact_form'])==max(int(q['monthly_users_exact_form']) for q in groups[p['path']]) for p in pages))
gsc = {r['path']:r for r in read_csv(ROOT/'research/analytics/search-intents-2026-10-08/page-performance.csv')}
check('GSC page metrics preserved; absent rows remain blank', all((p['gsc_impressions_2026_09_27_to_10_06'],p['gsc_clicks_2026_09_27_to_10_06'],p['gsc_weighted_position'])==((gsc[p['path']]['impressions'],gsc[p['path']]['clicks'],gsc[p['path']]['weighted_position']) if p['path'] in gsc else ('','','')) for p in pages))
analysis = json.loads((ROOT/'research/analytics/search-intents-2026-10-08/summary.json').read_text())
check('Baseline 380 impressions / 6 clicks; selection 180/205', analysis['site']['impressions']==380 and analysis['site']['clicks']==6 and analysis['selection_related']['impressions']==180 and round(180/205*100,1)==87.8)
check('Two affiliate goal visits are internal', analysis['metrika_aligned']['affiliate_visits']==2 and analysis['metrika_affiliate_sources']['source_internal_target_visits']==2)
exact = {q['query']:q for q in queries}
expected = {'тибетская малина':6022,'тибетская малина фото':1458,'клубника азия описание сорта':2241,'азия клубника описание':718,'малина таруса описание сорта фото отзывы садоводов':236,'болезни клубники':1026,'как вырастить клубнику из семян':741,'дидимелла на малине как бороться':277,'как сажать клубнику':2050,'рассада клубники купить':330,'купить саженцы клубники в москве':309,'малина маравилла купить саженцы с доставкой':257}
check('All highlighted exact-form demand values match source', all(q in exact and int(exact[q]['monthly_users_exact_form'])==n for q,n in expected.items()))
check('Revenue illustration is arithmetic, not observed result', 10000*.10*.03*200==6000)

docs = {f:(ROOT/f).read_text() for f in files}
backlog = docs['BACKLOG.md']
defined = set(re.findall(r'^\| ((?:D2C|[A-Z]+)-\d+) \|',backlog,re.M)) | set(re.findall(r'^(SEO-\d+) ·',backlog,re.M))
prefixes = {'SEO','W','D','F','C','G','R','M','KNOW','TRUST','FARM','MARKET','D2C'}
unknown = []
for name,s in docs.items():
    if name=='handoff.md':
        continue  # Historical entries are not the task registry.
    for task in re.findall(r'\b(?:D2C|[A-Z]+)-\d+\b',s):
        if task.rsplit('-',1)[0] in prefixes and task not in defined:
            unknown.append((name,task))
check('Referenced current task IDs exist in canonical backlog', not unknown, sorted(set(unknown)))
check('Ongoing tasks are not falsely closed', 'SEO-08 · P0 · in_progress' in backlog and all(re.search(r'^\| '+task+r' \| P0 · in_progress \|',backlog,re.M) for task in ['F-06','W-05','W-16','C-02']))
check('SEO-10 retains its active task and acceptance criteria', bool(re.search(r'^\| SEO-10 \| P0 · (ready|in_progress|verified) \|', backlog, re.M)))
check('All current plan documents retain full coverage and Tibetan focus', all('3 844' in docs[name] and 'тибет' in docs[name].lower() for name in ['BACKLOG.md','PRD.md','docs/STRATEGY.md','docs/ROADMAP_2026_2027.md','docs/MEASUREMENT.md']) and '115' in docs['docs/MONETIZATION_PLAN.md'])
check('Obsolete browser restriction removed from current queue', 'сейчас Яндекс и внешний Chrome не используются' not in backlog)
missing = []
for name in files+['research/analytics/development-plan-2026-10-09/README.md']:
    text=(ROOT/name).read_text()
    # Check only the current handoff entry, not old historical references.
    if name=='handoff.md':
        text=text.split('## Текущая передача',1)[1].split('\n### ',2)[1] if 'SEO-09' in text.split('## Текущая передача',1)[1].split('\n### ',2)[1] else ''
    for target in re.findall(r'\[[^\]]*\]\(([^\s)]+)(?:\s+[^)]*)?\)',text):
        if re.match(r'^[a-zA-Z][a-zA-Z0-9+.-]*:',target) or target.startswith('#'):
            continue
        file=unquote(target.split('#',1)[0].strip('<>'))
        if file and not ((ROOT/name).parent/file).exists():
            missing.append((name,target))
check('Local Markdown links resolve', not missing, missing)
trailing = [(name,i) for name,s in docs.items() if name!='handoff.md' for i,line in enumerate(s.splitlines(),1) if line.rstrip()!=line]
check('No new document trailing whitespace', not trailing, trailing)
hashes={f:hashlib.sha256((ROOT/f).read_bytes()).hexdigest() for f in files+['research/analytics/development-plan-2026-10-09/page-priorities.csv']}
result={'checked_at_local_date':'2026-10-09','source_collection_date':'2026-10-08','status':'passed' if not failures else 'failed','checks':checks,'source_sha256':hashlib.sha256(source.read_bytes()).hexdigest(),'file_sha256':hashes,'failures':failures}
(OUT/'validation.json').write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n')
print(json.dumps({'status':result['status'],'checks':len(checks),'failures':failures},ensure_ascii=False))
for c in checks:
    if not c['passed']:
        print(c)
raise SystemExit(bool(failures))
