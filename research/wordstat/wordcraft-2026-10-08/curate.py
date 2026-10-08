#!/usr/bin/env python3
"""Save the manually reviewed editorial selection from preserved query metrics."""
import csv
import json
from pathlib import Path
from urllib.parse import urlencode

ROOT = Path(__file__).resolve().parent
selected = '''болезни клубники
болезни клубники описание с фотографиями
азия клубника описание
болезни клубники описание с фотографиями и способы лечения летом
болезни клубники фото и описание чем лечить
болезни клубники описание с фотографиями и способы лечения
дидимелла на малине как бороться
малина таруса описание сорта фото отзывы садоводов
чем подкормить малину в июле
лучшие сорта малины для подмосковья
тибетская малина отзывы
клубника чамора туруси описание сорта фото отзывы садоводов урожайность
тля на малине чем обработать
болезни клубники фото
клубника ания описание сорта
малина гордость россии описание сорта фото отзывы
гигантелла клубника описание сорта фото отзывы садоводов
чамора туруси клубника описание сорта фото отзывы садоводов урожайность
малина маравила описание сорта фото отзывы садоводов урожайность
клубника прими описание сорта
дидимелла на малине фото
априка клубника описание сорта фото отзывы садоводов
малина сказка описание сорта фото отзывы особенности выращивания
желтеют листья клубники
малина гордость россии описание сорта фото отзывы садоводов
клубника сенсация описание сорта фото отзывы садоводов урожайность
хлороз малины
клубника априка описание сорта фото отзывы садоводов урожайность
чамора туруси клубника описание сорта фото отзывы
болезни клубники фото и описание
почему желтеют листья у малины
клубника клери описание сорта фото отзывы садоводов форум садоводов
желтеют листья у малины как бороться
лучшие сорта малины для подмосковья для открытого грунта
болезни клубники по листьям описание с фотографиями и способы лечения
лучшие сорта клубники для сибири
клубника кабрилло описание сорта фото отзывы садоводов урожайность
сорт азия клубника описание
как избавиться от корней малины
маравилла малина описание сорта фото отзывы
у малины желтеют листья что делать
клубника априка описание сорта фото отзывы
малина бальзам описание сорта
хлороз малины лечение
почему малина червивая что надо делать
сорта малины для подмосковья
малина патриция описание сорта фото отзывы
малина глен ампл описание сорта фото отзывы
клубника болезни и лечение с фото
сорта клубники для урала
лучшие сорта клубники для урала
болезни виктории описание с фотографиями и способы лечения
лучшая малина для подмосковья
пурпурная пятнистость малины фото и их лечение
пурпурная пятнистость малины чем лечить
малиновое дерево уход и выращивание и обрезка весной
что такое ксд и нсд клубники
земляника даренка описание'''.splitlines()

all_rows = list(csv.DictReader((ROOT / 'queries-all.csv').open(encoding='utf-8-sig')))
index = {r['query']: r for r in all_rows}
maps = [json.loads(p.read_text()) for p in (ROOT / 'competitor-maps').glob('*.json')]
rows = []
for query in selected:
    row = dict(index[query])
    assert row['competition_code'] == 'LOW' and row['scope'] == 'garden'
    action = row['action']
    task, priority, status = 'W-16', 'P1', 'planned'
    if action == 'new_diagnostic_hub':
        task, priority, status = 'SEO-02', 'P0', 'ready'
    elif action == 'improve_cultivar':
        task, priority, status = 'SEO-03', 'P0', 'ready'
    elif 'дидим' in query or 'пурпурная пятнистость' in query:
        task, priority, status = 'SEO-04', 'P1', 'ready'
    elif 'подкорм' in query:
        task, priority, status = 'SEO-05', 'P1', 'ready'
    elif action == 'new_botanical_article':
        task, priority, status = 'SEO-06', 'P2', 'candidate'
    elif action == 'verify_cultivar':
        task, priority, status = 'SEO-07', 'P2', 'candidate'
    elif action in ('new_diagnostic_article', 'manual_mapping', 'verify_intent'):
        task, priority, status = 'W-16', 'P2', 'candidate'
    elif action == 'improve_selector':
        task, priority, status = 'W-14', 'P2', 'planned'
    if row['target_path'] in [
        '/zhurnal/sorta-maliny-dlya-podmoskovya-kak-vybrat/',
        '/zhurnal/zhelteyut-listya-maliny-chto-proverit/',
        '/zhurnal/tlya-na-maline-chto-delat/']:
        status = 'title_meta_updated_locally; body_followup_planned'
    seed = row['seed_sources'].split(' | ')[0]
    table = row['table_sources'].split(' | ')[0].split(':')[1]
    tab = 'ADDITIONAL' if table == 'AdditionalQueries' else 'GENERAL'
    source_url = 'https://webmaster.yandex.ru/site/efficiency/wordcraft/?' + urlencode({
        'device': 'ALL_DEVICES', 'tab': tab, 'query': seed, 'mode': 'QUERY',
        'userQueries': 'PAGES', 'rivals': tab, 'regions': '225'})
    row.update(editorial_priority=priority, task_id=task, work_status=status,
               reviewed_intent='garden; checked manually 2026-10-08', source_url=source_url,
               matched_competitor_pages=' | '.join(sorted(m['competitor_url'] for m in maps if query in m['queries'])))
    rows.append(row)
rows.sort(key=lambda r: (-int(r['demand']), r['query']))
with (ROOT / 'priority-queries.csv').open('w', encoding='utf-8-sig', newline='') as file:
    writer = csv.DictWriter(file, list(rows[0]), lineterminator="\n")
    writer.writeheader()
    writer.writerows(rows)
print('Manually reviewed queries:', len(rows))
