-- D-03/D-06: two yields from the same published strawberry trial table.
-- The paper names Moscow Oblast but does not locate the experimental plot;
-- these are cultivar observations, not regional recommendations.
INSERT INTO sources
    (source_key, kind, title, author_or_org, url, reference, accessed_on,
     rights_note, review_status, reviewed_by, reviewed_at)
VALUES
    ('vniispk-strawberry-moscow-comparison-2006-2007', 'document',
     'Хозяйственно-биологическая оценка интродуцированных сортов земляники в Московской области',
     'В. Г. Толстогузова · Всероссийский селекционно-технологический институт садоводства и питомниководства',
     'https://vniispk.ru/pages/activities/science-activities/conference-2008/publ-2008-25',
     '2008; таблица «Урожайность и качество ягод сортов земляники (посадки 2004 г.)», строки «Русич» и «Зенга Зенгана (к)»',
     '2026-09-27',
     'Использованы отдельные фактические значения и прямая ссылка; текст и таблица публикации не воспроизводятся.',
     'verified', 'codex-source-review', '2026-09-27 09:06:00');

INSERT INTO trait_observations
    (cultivar_id, trait_code, value_number, unit, context_text, region_id,
     source_id, observed_on, review_status, reviewed_by, reviewed_at)
SELECT c.id, 'yield', d.mean_yield, 'ц/га', d.context_text, NULL,
       s.id, '2006–2007', 'verified', 'codex-source-review', '2026-09-27 09:06:00'
FROM (
    SELECT 'rusich' AS cultivar_slug, 148.3 AS mean_yield,
           'В опыте с посадкой 2004 года урожайность «Русича» составила 116,7 ц/га в 2006 году и 180,0 ц/га в 2007 году; средняя за два года — 148,3 ц/га.' AS context_text
    UNION ALL
    SELECT 'zenga-zengana', 127.5,
           'В том же опыте контрольная «Зенга Зенгана» дала 118,5 ц/га в 2006 году и 136,5 ц/га в 2007 году; средняя за два года — 127,5 ц/га.'
) AS d
JOIN cultivars c ON c.slug = d.cultivar_slug AND c.editorial_status = 'published'
JOIN sources s ON s.source_key = 'vniispk-strawberry-moscow-comparison-2006-2007'
              AND s.review_status = 'verified';

INSERT INTO evidence_passports
    (observation_id, evidence_kind, subject_description, material_type,
     setting_text, place_text, period_from, period_to, conditions_json,
     method_text, uncertainty_text, source_locator, applicability_note,
     limitations_note, review_status, reviewed_by, reviewed_at)
SELECT o.id, 'published_study',
       'Фактическая урожайность клубники «' || c.canonical_name || '» в опубликованном сравнении',
       'Живые растения',
       'Сортоизучение; таблица растений посадки 2004 года; традиционная технология выращивания',
       'Московская область указана в заголовке публикации; точный участок не назван',
       '2006', '2007', '{"planting_year":2004}',
       'Взята опубликованная средняя урожайность за два года; годовые значения приведены в контексте наблюдения.',
       'Точный адрес участка, число повторностей и статистическая значимость различия сортов не приведены.',
       'Таблица «Урожайность и качество ягод сортов земляники (посадки 2004 г.)», строка «' ||
           CASE c.slug WHEN 'rusich' THEN 'Русич' ELSE 'Зенга Зенгана (к)' END || '»; вводный раздел о методике',
       'Значения двух сортов сопоставимы внутри одной таблицы и двух сезонов этого опыта.',
       'В 2006 году «Русич» дал меньше контрольной «Зенги Зенганы», в 2007 году — больше. Средняя за два года не доказывает превосходство на другом участке и не задаёт правило для Москвы или Подмосковья.',
       'verified', 'codex-source-review', '2026-09-27 09:06:00'
FROM trait_observations o
JOIN cultivars c ON c.id = o.cultivar_id AND c.slug IN ('rusich', 'zenga-zengana')
JOIN sources s ON s.id = o.source_id
              AND s.source_key = 'vniispk-strawberry-moscow-comparison-2006-2007'
WHERE o.trait_code = 'yield' AND o.observed_on = '2006–2007';
