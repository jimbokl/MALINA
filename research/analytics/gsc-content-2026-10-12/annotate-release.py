#!/usr/bin/env python3
"""Annotate existing canonical answers; preserve measured counts and coverage limits."""
import csv
from pathlib import Path

folder = Path(__file__).resolve().parent
file = folder / 'queries.csv'
with file.open(newline='') as handle:
    reader = csv.DictReader(handle)
    columns = list(reader.fieldnames)
    rows = list(reader)
slugs = {'krasa-rossii', 'atlant', 'albion', 'rumba', 'magnus', 'poklon-kazakovu', 'pohvalinka', 'lyachka'}
for column in ['edited_section_anchor', 'content_update']:
    if column not in columns:
        columns.append(column)
updated = []
for row in rows:
    slug = row['canonical_url'].rstrip('/').split('/')[-1]
    row['edited_section_anchor'] = ''
    row['content_update'] = ''
    if slug not in slugs:
        continue
    query = row['normalized_query']
    anchor = f'description-{slug}'
    if 'фото' in query:
        anchor = 'seo-photo'
    elif 'отзыв' in query:
        anchor = 'otzyvy'
    elif 'ремонтант' in query:
        anchor = f'answer-{slug}-1'
    row['edited_section_anchor'] = '#' + anchor
    row['content_update'] = 'SEO-11: revised description, metadata, sourced answers and next-step links; photo/review gaps remain separately tracked'
    updated.append(row)
assert len(rows) == 123
assert sum(int(r['impressions']) for r in rows) == 369
assert sum(int(r['clicks']) for r in rows) == 4
assert len(updated) == 45
with file.open('w', newline='') as handle:
    writer = csv.DictWriter(handle, fieldnames=columns, lineterminator='\n')
    writer.writeheader()
    writer.writerows(rows)
print({'edited_card_query_forms': len(updated), 'impressions': sum(int(r['impressions']) for r in updated), 'clicks': sum(int(r['clicks']) for r in updated)})
