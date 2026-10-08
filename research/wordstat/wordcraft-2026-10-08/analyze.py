#!/usr/bin/env python3
"""Normalize saved Wordcraft XLS exports; never replay authenticated endpoints.

Run with the bundled Python containing openpyxl. Query demand is not summed.
The query text and source worksheet are preserved in observations.csv.
"""
import collections
import csv
import json
import re
import warnings
from pathlib import Path

import openpyxl

warnings.filterwarnings('ignore', message='Workbook contains no default style')
ROOT = Path(__file__).resolve().parent
PROJECT = ROOT.parents[2]
CATALOG = json.loads((PROJECT / 'dist/data/catalog.json').read_text())['cultivars']
COMPETITION = {'LOW': 'Низкая', 'AVERAGE': 'Умеренная', 'HIGH': 'Высокая'}


def write_csv(name, rows, fields):
    with (ROOT / name).open('w', encoding='utf-8-sig', newline='') as f:
        writer = csv.DictWriter(f, fields, lineterminator="\n")
        writer.writeheader()
        writer.writerows(rows)


def scope(query, cluster):
    text = (query + ' ' + cluster).lower().replace('ё', 'е')
    if re.search(r'казино|casino|игров\w* (?:автомат|клуб)|бездепозит|промокод|\bvip\b|\bclubnika\b|\bklubnika\b', text):
        return 'off_topic_gambling'
    if re.search(r'порно|голая|asmr|асмр|слив|песн|скачать|текст|хабиб|акерман|эдуард|ромашина|к чему снится|схем[ау] к слову|ваня собрал|из 21 кг|одежд|кабаре|танец|кабаков|малин медиа|львів|клаб вк|кроссворд|сканворд|\d+\s*букв', text):
        return 'off_topic_or_malformed'
    if re.search(r'польз[ауы]|полезн|для организма|для здоров|давлен|беремен|роды|температуре|кому нельзя|болезн[ьях].*печени|показания|противопоказания|калори|диабет|витамин', text):
        return 'adjacent_health'
    if re.search(r'настойк|самогон|водк|желе|варень|рецепт|компот|фермент|пирог|торт|смузи|морожен|десерт|заварива|сироп', text):
        return 'adjacent_food'
    if re.search(r'официальный сайт|\bонлайн\b|\bзеркало\b|\bвход\b|регистрац|личный кабинет', text):
        return 'ambiguous_brand'
    if re.search(r'сорт|садовод|посад|сажен|рассад|выращ|подкорм|полив|обрез|болезн|вредител|дидим|хлороз|тля|желте|пятн|корн|увяд|шпалер|размнож|почв|мульч|ремонтант|зим|урож|черен|плодоно|уход|червив|гнил|ведьмина|тибетск|малиновое дерево', text):
        return 'garden'
    for cultivar in CATALOG:
        if re.search(r'(?<!\w)' + re.escape(cultivar['canonical_name'].lower().replace('ё', 'е')) + r'(?!\w)', text):
            return 'garden'
    if query in ['малина', 'клубника', 'черная малина', 'чёрная малина', 'белая клубника', 'желтая малина']:
        return 'garden'
    return 'review_needed'


def target(query):
    q = query.lower().replace('ё', 'е')
    strawberry = 'клубник' in q or 'землян' in q or ('виктор' in q and 'малин' not in q)
    if 'дидим' in q or 'пурпурная пятнистость' in q:
        return '', 'new_article', 'Дидимелла: проверить диагностику по первоисточникам, затем подготовить материал; схемы препаратов требуют актуальной проверки.'
    if 'тибетск' in q:
        return '', 'new_botanical_article', 'Сначала установить вид и источники; объяснить отличие от обычной малины, добавить проверяемые фото.'
    if 'малиновое дерево' in q:
        return '/zhurnal/malinovoe-derevo-tarusa/', 'improve_existing', 'Проверить ответ о штамбовой форме и уходе; не превращать торговое название в ботанический вид.'
    if strawberry and ('ксд' in q or 'нсд' in q):
        return '/zhurnal/remontantnaya-klubnika/', 'improve_existing', 'Проверить, есть ли понятное объяснение терминов и повторного плодоношения.'
    if 'монилиоз' in q:
        return '', 'verify_intent', 'Проверить корректность названия болезни и диагностику; текст запроса не подтверждает заболевание.'
    if strawberry and ('желте' in q or 'хлороз' in q):
        return '/instrumenty/proverka-rasteniya/', 'new_diagnostic_article', 'Проверить причины пожелтения клубники; материал о малине не отвечает этому запросу.'
    if 'желте' in q or 'хлороз' in q:
        return '/zhurnal/zhelteyut-listya-maliny-chto-proverit/', 'improve_existing', 'Уточнить ответы по рисунку симптомов, воде и анализу; хлороз не превращать в диагноз по фото.'
    if 'тля' in q and not strawberry:
        return '/zhurnal/tlya-na-maline-chto-delat/', 'improve_existing', 'Сохранить последовательность осмотра, механических действий и проверки выбранного средства.'
    if 'подмосков' in q and 'малин' in q:
        return '/zhurnal/sorta-maliny-dlya-podmoskovya-kak-vybrat/', 'improve_existing', 'Связать выбор со сравнением сортов и условиями участка; отзывы и урожайность показывать только с реальными данными.'
    if 'подкорм' in q and 'малин' in q:
        return '', 'new_article', 'Подготовить единый материал о питании малины по фазе и анализу почвы; месяцы учесть внутри него.'
    if ('корней' in q or 'располза' in q) and not strawberry:
        return '/zhurnal/malina-raspolzaetsya-po-uchastku/', 'improve_existing', 'Проверить, ясно ли объяснены границы ряда и действия с порослью.'
    if 'червив' in q:
        return '', 'new_diagnostic_article', 'Установить вредителя и признаки; не обещать универсальную обработку.'
    if 'обрез' in q and not strawberry:
        return '/instrumenty/obrezka-maliny/', 'improve_existing', 'Вести к инструменту выбора схемы и руководству по типу плодоношения.'
    if ('почв' in q and not strawberry) or (('посад' in q or 'сажать' in q) and 'малин' in q):
        return '/zhurnal/posadka-maliny/', 'improve_existing', 'Обновить ответы внутри существующего материала и связать с расчётом посадки.'
    if strawberry and ('подкорм' in q or 'удобр' in q):
        return '/zhurnal/chem-podkormit-klubniku-po-analizu-pochvy/', 'improve_existing', 'Проверить ответ для указанной фазы роста; сохранять выбор питания по данным анализа.'
    if strawberry and ('посад' in q or 'сажать' in q):
        return '/zhurnal/posadka-klubniki/', 'improve_existing', 'Дополнить существующий материал ответами по срокам и условиям, связать с инструментом срока посадки.'
    if strawberry and 'ремонтант' in q and 'сорт' not in q:
        return '/zhurnal/remontantnaya-klubnika/', 'improve_existing', 'Проверить, ясно ли объяснено повторное плодоношение и условия ухода.'
    crop = 'strawberry' if strawberry else 'raspberry'
    for c in sorted(CATALOG, key=lambda v: -len(v['canonical_name'])):
        if c['crop_slug'] != crop:
            continue
        names = [c['canonical_name']] + [a['alias'] for a in c['aliases']]
        if any(re.search(r'(?<!\w)' + re.escape(n.lower().replace('ё', 'е')) + r'(?!\w)', q) for n in names):
            return f"/sorta/{c['slug']}/", 'improve_cultivar', 'Проверить полноту описания, фото и сравнения; отзывы и урожайность добавлять только по фактическим источникам.'
    if 'описание сорта' in q or 'описание сорта' in query:
        return '', 'verify_cultivar', 'Сорта ещё нет в каталоге: сначала установить идентичность и собрать первоисточники; не создавать карточку из поисковой фразы.'
    if 'клубник' in q and ('сибир' in q or 'урал' in q or 'края' in q or 'северо' in q):
        return '/podbor/', 'improve_selector', 'Использовать место и подтверждённый допуск; местную урожайность не выводить из допуска.'
    if 'клубник' in q and ('сорта' in q or 'сорт ' in q):
        return '/sorta/', 'improve_catalog', 'Уточнить путь к каталогу клубники, фильтрам и сравнению.'
    if strawberry and ('болезн' in q or 'пятн' in q):
        return '/instrumenty/proverka-rasteniya/', 'new_diagnostic_hub', 'Подготовить руководство по болезням клубники с проверяемыми фото и различиями симптомов; связать с материалом о серой гнили.'
    if 'болезн' in q or 'пятн' in q or 'метла' in q:
        return '/instrumenty/proverka-rasteniya/', 'diagnostic_backlog', 'Связать симптомы с проверкой растения; отдельный материал только после проверки источников.'
    return '', 'manual_mapping', 'Нужна редакционная проверка намерения.'


observations, urls, hosts, exports = [], [], [], []
for path in sorted((ROOT / 'exports').glob('*.xlsx')):
    meta = json.loads(path.with_suffix('.metadata.json').read_text())
    counts = {}
    workbook = openpyxl.load_workbook(path, read_only=True, data_only=True)
    for worksheet in workbook:
        # Yandex exports contain stale dimension=A1:A1; trust the actual rows.
        worksheet.reset_dimensions()
        values = list(worksheet.values)
        headers = values.pop(0)
        counts[worksheet.title] = len(values)
        for values_row in values:
            row = dict(zip(headers, values_row))
            base = {'seed': meta['query'], 'export': path.name, 'sheet': worksheet.title,
                    'captured_utc': meta['captured_utc']}
            if worksheet.title in ['Queries', 'AdditionalQueries']:
                observations.append({**base, **row, 'clicks': int(row['clicks']), 'demand': int(row['demand'])})
            elif worksheet.title == 'UrlsTable':
                urls.append({**base, **row, 'queries': int(row['queries'])})
            elif worksheet.title == 'HostsTable':
                hosts.append({**base, **row})
    workbook.close()
    exports.append({'file': path.name, 'seed': meta['query'], 'ui_url': meta['ui_url'], 'counts': counts})

grouped = collections.defaultdict(list)
for row in observations:
    grouped[row['query']].append(row)

queries, conflicts = [], []
for query, rows in grouped.items():
    values = {(r['demand'], r['clicks'], r['competitiveness']) for r in rows}
    if len(values) != 1:
        conflicts.append({'query': query, 'observations': rows})
    # Choose the latest observation; never add repeated demand across seeds.
    row = max(rows, key=lambda r: r['captured_utc'])
    category = scope(query, row['cluster'])
    page, action, note = target(query) if category == 'garden' else ('', 'outside_garden_priority', category)
    queries.append({'query': query, 'cluster': row['cluster'], 'demand': row['demand'], 'clicks': row['clicks'],
                    'competition_code': row['competitiveness'], 'competition': COMPETITION.get(row['competitiveness'], 'Нет данных'),
                    'scope': category, 'target_path': page, 'action': action, 'editorial_note': note,
                    'seed_sources': ' | '.join(sorted({r['seed'] for r in rows})),
                    'table_sources': ' | '.join(sorted({r['export'] + ':' + r['sheet'] for r in rows})),
                    'observations': len(rows), 'metric_conflict': len(values) != 1})
queries.sort(key=lambda r: (-r['demand'], r['query']))
low = [r for r in queries if r['scope'] == 'garden' and r['competition_code'] == 'LOW' and not r['metric_conflict']]
moderate = [r for r in queries if r['scope'] == 'garden' and r['competition_code'] == 'AVERAGE' and not r['metric_conflict']]
adjacent = [r for r in queries if r['scope'].startswith('adjacent') and r['competition_code'] == 'LOW']
write_csv('observations.csv', observations, list(observations[0]))
write_csv('queries-all.csv', queries, list(queries[0]))
write_csv('shortlist-low.csv', low, list(queries[0]))
write_csv('shortlist-additional-low.csv', [r for r in low if 'AdditionalQueries' in r['table_sources']], list(queries[0]))
write_csv('reserve-moderate.csv', moderate, list(queries[0]))
write_csv('adjacent-low.csv', adjacent, list(queries[0]))
write_csv('competitor-pages.csv', urls, list(urls[0]))
write_csv('competitor-hosts.csv', hosts, list(hosts[0]))
(ROOT / 'metric-conflicts.json').write_text(json.dumps(conflicts, ensure_ascii=False, indent=2) + '\n')
summary = {'region': 'Россия (225)', 'devices': 'ALL_DEVICES', 'capture_date': '2026-10-08',
           'metric': 'Среднемесячное число пользователей точной формы запроса за прошедший год',
           'exports': exports, 'query_observations': len(observations), 'unique_queries': len(queries),
           'scope_counts': dict(collections.Counter(r['scope'] for r in queries)),
           'low_garden_queries': len(low), 'moderate_garden_queries': len(moderate),
           'low_garden_additional_queries': sum('AdditionalQueries' in r['table_sources'] for r in low),
           'metric_conflicts': len(conflicts), 'competitor_page_observations': len(urls),
           'unique_competitor_pages': len({r['url'] for r in urls}),
           'unique_competitor_hosts': len({r['host'] for r in hosts})}
(ROOT / 'summary.json').write_text(json.dumps(summary, ensure_ascii=False, indent=2) + '\n')
query_index = {r['query']: r for r in queries}
checks = []
for path in (ROOT / 'raw').glob('*.json'):
    snapshot = json.loads(path.read_text())
    if not snapshot.get('tables'):
        continue
    for row in snapshot['tables'][0]['rows'][1:]:
        cells = row['cells']
        if len(cells) != 5 or cells[0].strip() not in query_index:
            continue
        query = cells[0].strip()
        try:
            ui_demand = int(re.sub(r'\D', '', cells[3]))
            ui_clicks = int(re.sub(r'\D', '', cells[4]))
        except ValueError:
            continue
        export_row = query_index[query]
        checks.append({'snapshot': path.name, 'query': query,
                       'ui_demand': ui_demand, 'ui_clicks': ui_clicks,
                       'ui_competition': cells[2], 'xlsx_demand': export_row['demand'],
                       'xlsx_clicks': export_row['clicks'], 'xlsx_competition': export_row['competition'],
                       'match': ui_demand == export_row['demand'] and ui_clicks == export_row['clicks']
                       and cells[2].casefold() == export_row['competition'].casefold()})
crosscheck = {'comparisons': len(checks), 'mismatches': [r for r in checks if not r['match']], 'checks': checks}
(ROOT / 'ui-export-crosscheck.json').write_text(json.dumps(crosscheck, ensure_ascii=False, indent=2) + '\n')
assert not crosscheck['mismatches'], 'Visible UI and XLS metrics disagree; inspect ui-export-crosscheck.json'
assert all((PROJECT / 'dist' / r['target_path'].strip('/') / 'index.html').exists()
           for r in low if r['target_path']), 'A mapped target page is missing'
print('UI/XLS matching comparisons:', len(checks))
print(json.dumps({k: v for k, v in summary.items() if k != 'exports'}, ensure_ascii=False, indent=2))
for label, rows in [('LOW garden', low), ('AVERAGE garden', moderate)]:
    print(label)
    for row in rows[:30]:
        print(f"{row['demand']}\t{row['clicks']}\t{row['query']}\t{row['target_path'] or row['action']}")
