-- Source-backed additions: two strawberry cultivars described by FNC Horticulture.
-- The generic generated illustrations are recorded as illustrations, not cultivar photographs.
INSERT INTO sources
    (source_key, kind, title, author_or_org, url, reference, accessed_on, rights_note,
     review_status, reviewed_by, reviewed_at)
VALUES
    ('borovitskaya-fncsad', 'website', 'Боровицкая · сортовое описание',
     'ФГБНУ ФНЦ Садоводства',
     'https://vstisp.org/vstisp/index.php/11-icetheme/sample-news/1447-borovitskaya', NULL,
     '2026-09-27', 'Использованы краткие пересказы сведений страницы. Текст и фотографии источника не копировались.',
     'verified', 'codex-source-review', '2026-09-27 15:00:00'),
    ('nashe-podmoskove-fncsad', 'website', 'Наше Подмосковье · сортовое описание',
     'ФГБНУ ФНЦ Садоводства',
     'https://vstisp.org/vstisp/index.php/component/content/article/11-icetheme/sample-news/1441-nashe-podmoskove', NULL,
     '2026-09-27', 'Использованы краткие пересказы сведений страницы. Текст и фотографии источника не копировались.',
     'verified', 'codex-source-review', '2026-09-27 15:00:00'),
    ('ai-illustration-borovitskaya-20260927', 'other', 'Иллюстрация клубники к карточке Боровицкой',
     'OpenAI image generation', NULL, 'research/media/strawberry-borovitskaya-ai-study-2026-09-27.png',
     '2026-09-27', 'Создано для проекта; общая иллюстрация клубники, не фотография и не подтверждение внешнего вида сорта.',
     'verified', 'codex-source-review', '2026-09-27 15:00:00'),
    ('ai-illustration-nashe-podmoskove-20260927', 'other', 'Иллюстрация клубники к карточке Нашего Подмосковья',
     'OpenAI image generation', NULL, 'research/media/strawberry-nashe-podmoskovye-ai-study-2026-09-27.png',
     '2026-09-27', 'Создано для проекта; общая иллюстрация клубники, не фотография и не подтверждение внешнего вида сорта.',
     'verified', 'codex-source-review', '2026-09-27 15:00:00');

INSERT INTO trait_definitions (code, label_ru, value_kind)
VALUES ('fruit_shape', 'Форма ягоды', 'text'),
       ('drought_hardiness', 'Засухоустойчивость', 'text')
ON CONFLICT(code) DO NOTHING;

INSERT INTO cultivars
    (crop_id, slug, canonical_name, scientific_name, identity_source_id,
     editorial_status, reviewed_by, reviewed_at, published_at)
VALUES
    ((SELECT id FROM crops WHERE slug='strawberry'), 'borovitskaya', 'Боровицкая', 'Fragaria × ananassa',
     (SELECT id FROM sources WHERE source_key='borovitskaya-fncsad'),
     'published', 'codex-source-review', '2026-09-27 15:00:00', '2026-09-27 15:00:00'),
    ((SELECT id FROM crops WHERE slug='strawberry'), 'nashe-podmoskove', 'Наше Подмосковье', 'Fragaria × ananassa',
     (SELECT id FROM sources WHERE source_key='nashe-podmoskove-fncsad'),
     'published', 'codex-source-review', '2026-09-27 15:00:00', '2026-09-27 15:00:00');

INSERT INTO media_assets
    (cultivar_id, asset_path, alt_text, source_id, rights_basis, rights_note,
     review_status, reviewed_by, reviewed_at)
VALUES
    ((SELECT id FROM cultivars WHERE slug='borovitskaya'), '/assets/variety-borovitskaya.webp',
     'Иллюстрация клубники к карточке Боровицкой',
     (SELECT id FROM sources WHERE source_key='ai-illustration-borovitskaya-20260927'), 'owned',
     'Общая иллюстрация культуры, не фотография сорта и не источник сортовых признаков.',
     'verified', 'codex-source-review', '2026-09-27 15:00:00'),
    ((SELECT id FROM cultivars WHERE slug='nashe-podmoskove'), '/assets/variety-nashe-podmoskovye.webp',
     'Иллюстрация клубники к карточке Нашего Подмосковья',
     (SELECT id FROM sources WHERE source_key='ai-illustration-nashe-podmoskove-20260927'), 'owned',
     'Общая иллюстрация культуры, не фотография сорта и не источник сортовых признаков.',
     'verified', 'codex-source-review', '2026-09-27 15:00:00');

CREATE TEMP TABLE strawberry_2026_09_27_observations (
    cultivar_slug TEXT NOT NULL,
    trait_code TEXT NOT NULL,
    value_text TEXT,
    value_number REAL,
    value_max REAL,
    unit TEXT,
    context_text TEXT NOT NULL,
    source_key TEXT NOT NULL,
    subject_description TEXT NOT NULL,
    source_locator TEXT NOT NULL,
    applicability_note TEXT NOT NULL,
    limitations_note TEXT NOT NULL
) STRICT;

INSERT INTO strawberry_2026_09_27_observations VALUES
    ('borovitskaya', 'maturity_period', 'Среднепоздний', NULL, NULL, NULL,
     'ФНЦ Садоводства относит сорт Боровицкая к среднепоздним.',
     'borovitskaya-fncsad', 'Срок созревания клубники Боровицкая', 'Первое предложение сортового описания',
     'Категория передана по описанию ФНЦ Садоводства.', 'Страница не указывает календарные сроки для отдельных регионов.'),
    ('borovitskaya', 'fruit_color', 'Оранжево-красная', NULL, NULL, NULL,
     'Ягоды описаны как оранжево-красные, с блеском.',
     'borovitskaya-fncsad', 'Окраска ягод сорта Боровицкая', 'Предложение о форме и окраске ягод',
     'Цвет передан по описанию ФНЦ Садоводства.', 'Источник не указывает отдельный протокол измерения окраски.'),
    ('borovitskaya', 'fruit_shape', 'Ширококоническая, без шейки', NULL, NULL, NULL,
     'Форма ягод указана как ширококоническая, без шейки.',
     'borovitskaya-fncsad', 'Форма ягод сорта Боровицкая', 'Предложение о форме и окраске ягод',
     'Форма передана по описанию ФНЦ Садоводства.', 'Описание не задаёт диапазон изменчивости формы между сборами.'),
    ('borovitskaya', 'berry_weight_g', NULL, 15, 16, 'г',
     'Средняя масса ягод указана в диапазоне 15–16 г.',
     'borovitskaya-fncsad', 'Средняя масса ягод Боровицкой', 'Предложение о массе ягод',
     'Диапазон передан по описанию ФНЦ Садоводства.', 'Страница не раскрывает метод измерения и размер выборки.'),
    ('borovitskaya', 'berry_weight_g', 'Первые ягоды — 20 г', 20, NULL, 'г',
     'Для первых ягод указана масса 20 г.',
     'borovitskaya-fncsad', 'Масса первых ягод Боровицкой', 'Предложение о массе ягод',
     'Значение относится к первым ягодам по формулировке источника.', 'Страница не раскрывает метод измерения и размер выборки.'),
    ('borovitskaya', 'flavor', 'Кисло-сладкий, 3,8–4,0 балла; освежающий, со слабым ароматом', NULL, NULL, NULL,
     'Вкус описан как кисло-сладкий, освежающий, со слабым ароматом; оценка 3,8–4,0 балла.',
     'borovitskaya-fncsad', 'Вкус ягод сорта Боровицкая', 'Предложение о вкусе ягод',
     'Оценка и описание переданы по странице ФНЦ Садоводства.', 'Методика и состав экспертной комиссии на странице не указаны.'),
    ('borovitskaya', 'winter_hardiness', 'Средняя', NULL, NULL, NULL,
     'Зимостойкость обозначена как средняя.',
     'borovitskaya-fncsad', 'Зимостойкость Боровицкой', 'Предложения о зимостойкости и засухоустойчивости',
     'Категория передана по описанию ФНЦ Садоводства.', 'Числовая шкала, годы и условия оценки на странице не указаны.'),
    ('borovitskaya', 'drought_hardiness', 'Средняя', NULL, NULL, NULL,
     'Устойчивость к засухе обозначена как средняя.',
     'borovitskaya-fncsad', 'Засухоустойчивость Боровицкой', 'Предложения о зимостойкости и засухоустойчивости',
     'Категория передана по описанию ФНЦ Садоводства.', 'Числовая шкала, годы и условия оценки на странице не указаны.'),
    ('borovitskaya', 'yield', NULL, 11.7, NULL, 'т/га',
     'Средняя урожайность в описании указана как 11,7 т/га.',
     'borovitskaya-fncsad', 'Средняя урожайность Боровицкой', 'Предложение об урожайности',
     'Показатель и формулировка «средняя» переданы по странице ФНЦ Садоводства.', 'На странице не раскрыты годы испытания и схема посадки.'),
    ('nashe-podmoskove', 'maturity_period', 'Средний', NULL, NULL, NULL,
     'Сорт Наше Подмосковье описан как сорт среднего срока созревания.',
     'nashe-podmoskove-fncsad', 'Срок созревания клубники Наше Подмосковье', 'Первое предложение сортового описания',
     'Категория передана по описанию ФНЦ Садоводства.', 'Страница не указывает календарные сроки для отдельных регионов.'),
    ('nashe-podmoskove', 'fruit_shape', 'Округло-коническая', NULL, NULL, NULL,
     'Форма ягод описана как правильная округло-коническая.',
     'nashe-podmoskove-fncsad', 'Форма ягод Нашего Подмосковья', 'Предложение о форме и свойствах ягод',
     'Форма передана по описанию ФНЦ Садоводства.', 'Описание не задаёт диапазон изменчивости формы между сборами.'),
    ('nashe-podmoskove', 'berry_weight_g', NULL, 7, 8, 'г',
     'Средняя масса ягоды указана как 7–8 г.',
     'nashe-podmoskove-fncsad', 'Средняя масса ягод Нашего Подмосковья', 'Предложение о массе ягод',
     'Диапазон передан по описанию ФНЦ Садоводства.', 'Страница не раскрывает метод измерения и размер выборки.'),
    ('nashe-podmoskove', 'berry_weight_g', 'Максимальная — до 30 г', 30, NULL, 'г',
     'Максимальная масса ягоды указана до 30 г.',
     'nashe-podmoskove-fncsad', 'Максимальная масса ягод Нашего Подмосковья', 'Предложение о массе ягод',
     'Величина относится к максимальной массе по формулировке источника.', 'Страница не раскрывает метод измерения и размер выборки.'),
    ('nashe-podmoskove', 'flavor', 'Кисло-сладкий', NULL, NULL, NULL,
     'Вкус ягод указан как кисло-сладкий.',
     'nashe-podmoskove-fncsad', 'Вкус ягод Нашего Подмосковья', 'Предложение о вкусе и мякоти',
     'Описание передано по странице ФНЦ Садоводства.', 'Методика оценки вкуса на странице не указана.'),
    ('nashe-podmoskove', 'yield', NULL, 700, 800, 'г/куст',
     'Продуктивность указана как 700–800 г ягод с куста.',
     'nashe-podmoskove-fncsad', 'Продуктивность куста Нашего Подмосковья', 'Предложение о продуктивности и урожайности',
     'Диапазон передан по описанию ФНЦ Садоводства.', 'На странице не раскрыты годы испытания, схема посадки и метод расчёта.'),
    ('nashe-podmoskove', 'yield', NULL, 15, 20, 'т/га',
     'Урожайность указана в диапазоне 15–20 т/га.',
     'nashe-podmoskove-fncsad', 'Урожайность Нашего Подмосковья', 'Предложение о продуктивности и урожайности',
     'Диапазон передан по описанию ФНЦ Садоводства.', 'На странице не раскрыты годы испытания, схема посадки и метод расчёта.'),
    ('nashe-podmoskove', 'winter_hardiness', 'Высокая', NULL, NULL, NULL,
     'Зимостойкость указана как высокая.',
     'nashe-podmoskove-fncsad', 'Зимостойкость Нашего Подмосковья', 'Предложение о зимостойкости и засухоустойчивости',
     'Категория передана по описанию ФНЦ Садоводства.', 'Числовая шкала, годы и условия оценки на странице не указаны.'),
    ('nashe-podmoskove', 'drought_hardiness', 'Высокая', NULL, NULL, NULL,
     'Засухоустойчивость указана как высокая.',
     'nashe-podmoskove-fncsad', 'Засухоустойчивость Нашего Подмосковья', 'Предложение о зимостойкости и засухоустойчивости',
     'Категория передана по описанию ФНЦ Садоводства.', 'Числовая шкала, годы и условия оценки на странице не указаны.'),
    ('nashe-podmoskove', 'disease_resistance', 'Устойчив к грибным заболеваниям листьев и земляничному клещу', NULL, NULL, NULL,
     'Источник описывает устойчивость к грибным заболеваниям листьев и земляничному клещу.',
     'nashe-podmoskove-fncsad', 'Устойчивость Нашего Подмосковья к заболеваниям и вредителю', 'Последнее предложение сортового описания',
     'Сохранен перечень факторов из описания ФНЦ Садоводства.', 'На странице не указаны методика, годы и степень устойчивости.');

INSERT INTO trait_observations
    (cultivar_id, trait_code, value_text, value_number, value_max, unit,
     context_text, source_id, review_status, reviewed_by, reviewed_at)
SELECT c.id, d.trait_code, d.value_text, d.value_number, d.value_max, d.unit,
       d.context_text, s.id, 'verified', 'codex-source-review', '2026-09-27 15:00:00'
FROM strawberry_2026_09_27_observations d
JOIN cultivars c ON c.slug=d.cultivar_slug
JOIN sources s ON s.source_key=d.source_key;

INSERT INTO evidence_passports
    (observation_id, evidence_kind, subject_description, setting_text, conditions_json,
     method_text, source_locator, applicability_note, limitations_note,
     review_status, reviewed_by, reviewed_at)
SELECT o.id, 'reference_document', d.subject_description,
       'Опубликованное сортовое описание ФНЦ Садоводства', '{}',
       'Фактический пересказ опубликованного сортового описания.', d.source_locator,
       d.applicability_note, d.limitations_note, 'verified', 'codex-source-review', '2026-09-27 15:00:00'
FROM strawberry_2026_09_27_observations d
JOIN cultivars c ON c.slug=d.cultivar_slug
JOIN trait_observations o ON o.cultivar_id=c.id AND o.trait_code=d.trait_code
                         AND o.context_text=d.context_text
JOIN sources s ON s.id=o.source_id AND s.source_key=d.source_key;

DROP TABLE strawberry_2026_09_27_observations;
