-- Three strawberry cultivars with official identity/admission and Orenburg
-- field-trial observations. The trial metrics remain tied to 2020–2021.
INSERT INTO sources
    (source_key, kind, title, author_or_org, url, reference, accessed_on,
     rights_note, review_status, reviewed_by, reviewed_at)
VALUES
    ('strawberry-orenburg-trial-2020-2021', 'document',
     'Оценка сортов Fragaria × ananassa Duch. в условиях Оренбургской области',
     'Р. Р. Салимова · Оренбургский филиал ФГБНУ ФНЦ Садоводства',
     'https://vstisp.org/vstisp/images/Salimova.pdf',
     'Исследование проведено в 2020–2021 годах; полевые таблицы 1–5', '2026-09-27',
     'Внесены краткие пересказы результатов и библиографическая ссылка; текст и таблицы публикации не копировались.',
     'verified', 'codex-source-review', '2026-09-27 18:00:00'),
    ('ai-illustration-darenka-20260927', 'other', 'Иллюстрация клубники к карточке Дарёнки',
     'OpenAI image generation', NULL, 'research/media/strawberry-darenka-ai-study-2026-09-27.png',
     '2026-09-27', 'Создано для проекта; иллюстрация клубники, не фотография сорта и не источник сортовых признаков.',
     'verified', 'codex-source-review', '2026-09-27 18:00:00'),
    ('ai-illustration-zenga-zengana-20260927', 'other', 'Иллюстрация клубники к карточке Зенги Зенганы',
     'OpenAI image generation', NULL, 'research/media/strawberry-zenga-zengana-ai-study-2026-09-27.png',
     '2026-09-27', 'Создано для проекта; иллюстрация клубники, не фотография сорта и не источник сортовых признаков.',
     'verified', 'codex-source-review', '2026-09-27 18:00:00'),
    ('ai-illustration-desnyanka-kokinskaya-20260927', 'other', 'Иллюстрация клубники к карточке Деснянки Кокинской',
     'OpenAI image generation', NULL, 'research/media/strawberry-desnyanka-kokinskaya-ai-study-2026-09-27.png',
     '2026-09-27', 'Создано для проекта; иллюстрация клубники, не фотография сорта и не источник сортовых признаков.',
     'verified', 'codex-source-review', '2026-09-27 18:00:00');

INSERT INTO trait_definitions (code, label_ru, value_kind)
VALUES ('flower_stalks_per_plant', 'Цветоносов на куст', 'number'),
       ('berries_per_plant', 'Плодов на куст', 'number')
ON CONFLICT(code) DO NOTHING;

INSERT INTO cultivars
    (crop_id, slug, canonical_name, scientific_name, identity_source_id,
     editorial_status, reviewed_by, reviewed_at, published_at)
VALUES
    ((SELECT id FROM crops WHERE slug='strawberry'), 'darenka', 'Дарёнка', 'Fragaria × ananassa',
     (SELECT id FROM sources WHERE source_key='gsk-register-2024'),
     'published', 'codex-source-review', '2026-09-27 18:00:00', '2026-09-27 18:00:00'),
    ((SELECT id FROM crops WHERE slug='strawberry'), 'zenga-zengana', 'Зенга Зенгана', 'Fragaria × ananassa',
     (SELECT id FROM sources WHERE source_key='gsk-register-2024'),
     'published', 'codex-source-review', '2026-09-27 18:00:00', '2026-09-27 18:00:00'),
    ((SELECT id FROM crops WHERE slug='strawberry'), 'desnyanka-kokinskaya', 'Деснянка Кокинская', 'Fragaria × ananassa',
     (SELECT id FROM sources WHERE source_key='gsk-register-2024'),
     'published', 'codex-source-review', '2026-09-27 18:00:00', '2026-09-27 18:00:00');

WITH media_seed(slug, asset_path, alt_text, source_key) AS (VALUES
    ('darenka', '/assets/variety-darenka.webp', 'Иллюстрация клубники к карточке Дарёнки', 'ai-illustration-darenka-20260927'),
    ('zenga-zengana', '/assets/variety-zenga-zengana.webp', 'Иллюстрация клубники к карточке Зенги Зенганы', 'ai-illustration-zenga-zengana-20260927'),
    ('desnyanka-kokinskaya', '/assets/variety-desnyanka-kokinskaya.webp', 'Иллюстрация клубники к карточке Деснянки Кокинской', 'ai-illustration-desnyanka-kokinskaya-20260927')
)
INSERT INTO media_assets
    (cultivar_id, asset_path, alt_text, source_id, rights_basis, rights_note,
     review_status, reviewed_by, reviewed_at)
SELECT c.id, m.asset_path, m.alt_text, s.id, 'owned',
       'Иллюстрация культуры; не фотография сорта и не источник сортовых признаков.',
       'verified', 'codex-source-review', '2026-09-27 18:00:00'
FROM media_seed m
JOIN cultivars c ON c.slug=m.slug
JOIN sources s ON s.source_key=m.source_key;

CREATE TEMP TABLE orenburg_strawberry_observations (
    cultivar_slug TEXT NOT NULL,
    trait_code TEXT NOT NULL,
    value_text TEXT,
    value_number REAL,
    value_max REAL,
    unit TEXT,
    context_text TEXT NOT NULL,
    subject_description TEXT NOT NULL,
    source_locator TEXT NOT NULL,
    applicability_note TEXT NOT NULL,
    limitations_note TEXT NOT NULL
) STRICT;

INSERT INTO orenburg_strawberry_observations VALUES
    ('darenka', 'maturity_period', 'Ранний', NULL, NULL, NULL,
     'Дарёнка включена в группу раннего срока созревания в исследовании.',
     'Срок созревания сорта Дарёнка', 'Разделение сортов перед таблицей 1; таблицы 3–5',
     'Группа срока созревания из полевого исследования Оренбургского филиала.',
     'Не содержит календарных дат для других регионов.'),
    ('darenka', 'berry_weight_g', NULL, 12.0, NULL, 'г',
     'Средняя масса ягод за два года опыта.', 'Средняя масса ягод Дарёнки', 'Таблица 4, среднее за 2020–2021 гг.',
     'Среднее значение относится к опыту Оренбургского филиала.', 'Условия и место опыта не переносятся на другие участки.'),
    ('darenka', 'berry_weight_g', 'Первые ягоды — 19,4 г', 19.4, NULL, 'г',
     'В таблице отдельно указана масса первых ягод.', 'Масса первых ягод Дарёнки', 'Таблица 4',
     'Показатель первых ягод приведён отдельно от средней массы.', 'Не характеризует среднюю массу всего урожая.'),
    ('darenka', 'yield', NULL, 10.3, NULL, 'т/га',
     'Урожайность в опыте указана как средняя за период исследования.', 'Урожайность Дарёнки', 'Реферат и таблица 5',
     'Показатель относится к опытным условиям Оренбургского филиала.', 'Не является прогнозом урожая для отдельного хозяйства.'),
    ('darenka', 'flower_stalks_per_plant', NULL, 5.7, NULL, 'шт./куст',
     'Среднее число цветоносов за два года.', 'Число цветоносов Дарёнки', 'Таблица 3, среднее за 2020–2021 гг.',
     'Среднее значение в полевом опыте.', 'Не задаёт количество цветоносов на другом участке.'),
    ('darenka', 'berries_per_plant', NULL, 23.8, NULL, 'шт./куст',
     'Среднее число плодов за два года.', 'Число плодов Дарёнки', 'Таблица 3, среднее за 2020–2021 гг.',
     'Среднее значение в полевом опыте.', 'Не задаёт количество плодов на другом участке.'),
    ('darenka', 'disease_resistance', 'Белая пятнистость — 0 баллов; бурая пятнистость — 0,5 балла', NULL, NULL, NULL,
     'В таблице дана средняя степень поражения за два года.', 'Поражение Дарёнки пятнистостями', 'Таблица 2, среднее за 2020–2021 гг.',
     'Переданы оценки поражения из конкретного исследования.', 'Исследователь отмечает слабое развитие болезней в засушливые годы опыта.'),
    ('darenka', 'winter_hardiness', 'Степень подмерзания — 1,8 балла', NULL, NULL, NULL,
     'Средняя оценка за две зимы опыта.', 'Подмерзание Дарёнки', 'Таблица 1, среднее за 2020–2021 гг.',
     'Передана оценка по шкале исследования.', 'Значение относится к зимам в Оренбургской области в 2020–2021 годах.'),
    ('zenga-zengana', 'berry_weight_g', NULL, 8.2, NULL, 'г',
     'Средняя масса ягод за два года опыта.', 'Средняя масса ягод Зенги Зенганы', 'Таблица 4, среднее за 2020–2021 гг.',
     'Среднее значение относится к опыту Оренбургского филиала.', 'Условия и место опыта не переносятся на другие участки.'),
    ('zenga-zengana', 'berry_weight_g', 'Первые ягоды — 16,7 г', 16.7, NULL, 'г',
     'В таблице отдельно указана масса первых ягод.', 'Масса первых ягод Зенги Зенганы', 'Таблица 4',
     'Показатель первых ягод приведён отдельно от средней массы.', 'Не характеризует среднюю массу всего урожая.'),
    ('zenga-zengana', 'yield', NULL, 7.7, NULL, 'т/га',
     'Средняя урожайность за период исследования.', 'Урожайность Зенги Зенганы', 'Таблица 5',
     'Показатель относится к опытным условиям Оренбургского филиала.', 'Не является прогнозом урожая для отдельного хозяйства.'),
    ('zenga-zengana', 'flower_stalks_per_plant', NULL, 6.5, NULL, 'шт./куст',
     'Среднее число цветоносов за два года.', 'Число цветоносов Зенги Зенганы', 'Таблица 3, среднее за 2020–2021 гг.',
     'Среднее значение в полевом опыте.', 'Не задаёт количество цветоносов на другом участке.'),
    ('zenga-zengana', 'berries_per_plant', NULL, 25.8, NULL, 'шт./куст',
     'Среднее число плодов за два года.', 'Число плодов Зенги Зенганы', 'Таблица 3, среднее за 2020–2021 гг.',
     'Среднее значение в полевом опыте.', 'Не задаёт количество плодов на другом участке.'),
    ('zenga-zengana', 'disease_resistance', 'Белая пятнистость — 0,3 балла; бурая пятнистость — 1,0 балл; земляничный клещ — 1,0 балл', NULL, NULL, NULL,
     'В таблицах указана средняя степень поражения и повреждения за два года.', 'Поражение Зенги Зенганы пятнистостями и клещом', 'Таблица 2 и раздел о земляничном клеще',
     'Переданы оценки поражения и повреждения из конкретного исследования.', 'Исследователь отмечает слабое развитие болезней в засушливые годы опыта.'),
    ('zenga-zengana', 'winter_hardiness', 'Степень подмерзания — 1,8 балла', NULL, NULL, NULL,
     'Средняя оценка за две зимы опыта.', 'Подмерзание Зенги Зенганы', 'Таблица 1, среднее за 2020–2021 гг.',
     'Передана оценка по шкале исследования.', 'Значение относится к зимам в Оренбургской области в 2020–2021 годах.'),
    ('desnyanka-kokinskaya', 'berry_weight_g', NULL, 10.3, NULL, 'г',
     'Средняя масса ягод за два года опыта.', 'Средняя масса ягод Деснянки Кокинской', 'Таблица 4, среднее за 2020–2021 гг.',
     'Среднее значение относится к опыту Оренбургского филиала.', 'Условия и место опыта не переносятся на другие участки.'),
    ('desnyanka-kokinskaya', 'berry_weight_g', 'Первые ягоды — 12,8 г', 12.8, NULL, 'г',
     'В таблице отдельно указана масса первых ягод.', 'Масса первых ягод Деснянки Кокинской', 'Таблица 4',
     'Показатель первых ягод приведён отдельно от средней массы.', 'Не характеризует среднюю массу всего урожая.'),
    ('desnyanka-kokinskaya', 'yield', NULL, 9.4, NULL, 'т/га',
     'Средняя урожайность за период исследования.', 'Урожайность Деснянки Кокинской', 'Реферат и таблица 5',
     'Показатель относится к опытным условиям Оренбургского филиала.', 'Не является прогнозом урожая для отдельного хозяйства.'),
    ('desnyanka-kokinskaya', 'flower_stalks_per_plant', NULL, 4.3, NULL, 'шт./куст',
     'Среднее число цветоносов за два года.', 'Число цветоносов Деснянки Кокинской', 'Таблица 3, среднее за 2020–2021 гг.',
     'Среднее значение в полевом опыте.', 'Не задаёт количество цветоносов на другом участке.'),
    ('desnyanka-kokinskaya', 'berries_per_plant', NULL, 22.0, NULL, 'шт./куст',
     'Среднее число плодов за два года.', 'Число плодов Деснянки Кокинской', 'Таблица 3, среднее за 2020–2021 гг.',
     'Среднее значение в полевом опыте.', 'Не задаёт количество плодов на другом участке.'),
    ('desnyanka-kokinskaya', 'disease_resistance', 'Белая пятнистость — 0 баллов; бурая пятнистость — 0,3 балла', NULL, NULL, NULL,
     'В таблице дана средняя степень поражения за два года.', 'Поражение Деснянки Кокинской пятнистостями', 'Таблица 2, среднее за 2020–2021 гг.',
     'Переданы оценки поражения из конкретного исследования.', 'Исследователь отмечает слабое развитие болезней в засушливые годы опыта.'),
    ('desnyanka-kokinskaya', 'winter_hardiness', 'Степень подмерзания — 1,3 балла', NULL, NULL, NULL,
     'Средняя оценка за две зимы опыта.', 'Подмерзание Деснянки Кокинской', 'Таблица 1, среднее за 2020–2021 гг.',
     'Передана оценка по шкале исследования.', 'Значение относится к зимам в Оренбургской области в 2020–2021 годах.');

INSERT INTO trait_observations
    (cultivar_id, trait_code, value_text, value_number, value_max, unit,
     context_text, source_id, review_status, reviewed_by, reviewed_at)
SELECT c.id, d.trait_code, d.value_text, d.value_number, d.value_max, d.unit,
       d.context_text, s.id, 'verified', 'codex-source-review', '2026-09-27 18:00:00'
FROM orenburg_strawberry_observations d
JOIN cultivars c ON c.slug=d.cultivar_slug
JOIN sources s ON s.source_key='strawberry-orenburg-trial-2020-2021';

INSERT INTO evidence_passports
    (observation_id, evidence_kind, subject_description, setting_text, place_text,
     period_from, period_to, conditions_json, method_text, source_locator,
     applicability_note, limitations_note, review_status, reviewed_by, reviewed_at)
SELECT o.id, 'published_study', d.subject_description, 'Полевое сортоизучение',
       'Оренбургская область', '2020', '2021',
       '{"weather":"засушливые и жаркие сезоны исследования","summary":"среднее за два года, если указано в таблице"}',
       'Пересказ показателя и единиц измерения из опубликованного полевого исследования.',
       d.source_locator, d.applicability_note, d.limitations_note,
       'verified', 'codex-source-review', '2026-09-27 18:00:00'
FROM orenburg_strawberry_observations d
JOIN cultivars c ON c.slug=d.cultivar_slug
JOIN trait_observations o ON o.cultivar_id=c.id AND o.trait_code=d.trait_code
                         AND o.context_text=d.context_text
JOIN sources s ON s.id=o.source_id AND s.source_key='strawberry-orenburg-trial-2020-2021';

DROP TABLE orenburg_strawberry_observations;

WITH verified_admission_seed(cultivar_slug, registry_entry_code, admitted_year, admission_regions, crop_label, scientific_name) AS (
    VALUES
        ('darenka', '9705077', 2004, '3,4,10,11', 'Земляника', 'Fragaria L.'),
        ('zenga-zengana', '6950361', 1972, '2,3,4,5,6,7,8,9', 'Земляника', 'Fragaria L.'),
        ('desnyanka-kokinskaya', '7404999', 1985, '4,10', 'Земляника', 'Fragaria L.')
), zones(n) AS (VALUES (1),(2),(3),(4),(5),(6),(7),(8),(9),(10),(11),(12))
INSERT INTO official_admissions
    (cultivar_id, admission_region_number, registry_entry_code, admitted_year,
     edition_as_of, source_locator, source_id, review_status, reviewed_by,
     reviewed_at, source_pdf_page)
SELECT c.id, zones.n, seed.registry_entry_code, seed.admitted_year, '2024-05-31',
       'Земляника (' || seed.scientific_name || '), PDF с. 414, строка ' ||
       seed.registry_entry_code || ' ' || c.canonical_name,
       s.id, 'verified', 'codex-source-review', '2026-09-27 18:00:00', 414
FROM verified_admission_seed seed
JOIN cultivars c ON c.slug=seed.cultivar_slug
JOIN sources s ON s.source_key='gsk-register-2024'
CROSS JOIN zones
WHERE instr(',' || seed.admission_regions || ',', ',' || zones.n || ',') > 0;
