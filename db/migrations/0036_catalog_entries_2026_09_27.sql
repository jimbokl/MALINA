-- Source-backed additions: raspberry Brilliantovaya and strawberry Elsanta.
-- Official admission regions for Elsanta remain separate from local growing advice.
INSERT INTO sources
    (source_key, kind, title, author_or_org, url, accessed_on, rights_note,
     review_status, reviewed_by, reviewed_at)
VALUES
    ('brilliantovaya-vniispk', 'website', 'Ремонтантная малина в России',
     'И. В. Казаков, С. Н. Евдокименко · ВНИИСПК',
     'https://vniispk.ru/pages/activities/science-activities/conference-2008/publ-2008-13',
     '2026-09-27', 'Использованы краткие пересказы сортовых результатов и ссылка на публикацию; текст и изображения не копировались.',
     'verified', 'codex-source-review', '2026-09-27 12:00:00'),
    ('elsanta-gossort-record', 'website', 'Эльсанта · запись Государственного реестра 9610367',
     'Госсорткомиссия',
     'https://gossortrf.ru/registry/gosudarstvennyy-reestr-selektsionnykh-dostizheniy-dopushchennykh-k-ispolzovaniyu-tom-1-sorta-rasteni/elsanta-zemlyanika-9610367/',
     '2026-09-27', 'Использованы краткие фактические сведения реестровой записи и прямая ссылка.',
     'verified', 'codex-source-review', '2026-09-27 12:00:00');

INSERT INTO cultivars
    (crop_id, slug, canonical_name, scientific_name, identity_source_id,
     editorial_status, reviewed_by, reviewed_at, published_at)
VALUES
    ((SELECT id FROM crops WHERE slug='raspberry'), 'brilliantovaya', 'Бриллиантовая', 'Rubus idaeus L.',
     (SELECT id FROM sources WHERE source_key='brilliantovaya-vniispk'),
     'published', 'codex-source-review', '2026-09-27 12:00:00', '2026-09-27 12:00:00'),
    ((SELECT id FROM crops WHERE slug='strawberry'), 'elsanta', 'Эльсанта', 'Fragaria × ananassa',
     (SELECT id FROM sources WHERE source_key='elsanta-gossort-record'),
     'published', 'codex-source-review', '2026-09-27 12:00:00', '2026-09-27 12:00:00');

CREATE TEMP TABLE catalog_2026_09_27_observations (
    cultivar_slug TEXT NOT NULL,
    trait_code TEXT NOT NULL,
    value_text TEXT,
    value_number REAL,
    value_max REAL,
    unit TEXT,
    context_text TEXT NOT NULL,
    source_key TEXT NOT NULL,
    evidence_kind TEXT NOT NULL,
    subject_description TEXT NOT NULL,
    setting_text TEXT NOT NULL,
    place_text TEXT,
    period_from TEXT,
    period_to TEXT,
    method_text TEXT NOT NULL,
    source_locator TEXT NOT NULL,
    applicability_note TEXT NOT NULL,
    limitations_note TEXT NOT NULL
) STRICT;

INSERT INTO catalog_2026_09_27_observations VALUES
    ('brilliantovaya', 'fruit_color', 'Рубиновая', NULL, NULL, NULL,
     'В публикации ягоды сорта Бриллиантовая описаны как рубиновые.',
     'brilliantovaya-vniispk', 'published_study', 'Окраска ягод сорта Бриллиантовая',
     'Сортоиспытание, описанное во ВНИИСПК', 'Брянская область', NULL, NULL,
     'Фактический пересказ сортового описания в публикации.',
     'Раздел «Бриллиантовая»', 'Окраска передана по описанию авторов исследования.',
     'Публикация не приводит отдельный протокол визуальной идентификации окраски.'),
    ('brilliantovaya', 'fruiting_cycle', 'Ремонтантная', NULL, NULL, NULL,
     'Авторы относят Бриллиантовую к ремонтантным сортам малины.',
     'brilliantovaya-vniispk', 'published_study', 'Тип плодоношения сорта Бриллиантовая',
     'Сортоиспытание, описанное во ВНИИСПК', 'Брянская область', NULL, NULL,
     'Фактический пересказ классификации в публикации.',
     'Раздел «Бриллиантовая»', 'Классификация соответствует формулировке авторов.',
     'Источник не задаёт календарные сроки плодоношения для других регионов.'),
    ('brilliantovaya', 'maturity_period', 'Первая декада августа', NULL, NULL, NULL,
     'В публикации начало созревания сорта указано в первой декаде августа.',
     'brilliantovaya-vniispk', 'published_study', 'Начало созревания сорта Бриллиантовая',
     'Сортоиспытание, описанное во ВНИИСПК', 'Брянская область', NULL, NULL,
     'Фактический пересказ срока начала созревания в публикации.',
     'Раздел «Бриллиантовая», описание срока созревания',
     'Срок относится к испытанию в указанной области.',
     'Публикация не приводит календарные даты по другим регионам России.'),
    ('brilliantovaya', 'berry_weight_g', NULL, 4.0, 4.5, 'г',
     'Средняя масса ягоды приведена в диапазоне 4,0–4,5 г.',
     'brilliantovaya-vniispk', 'published_study', 'Средняя масса ягод сорта Бриллиантовая',
     'Сортоиспытание, описанное во ВНИИСПК', 'Брянская область', NULL, NULL,
     'Значение перенесено из сортового описания публикации.',
     'Раздел «Бриллиантовая», показатели массы ягод',
     'Диапазон относится к приведённым авторами данным.',
     'В этом фрагменте публикации не указаны метод взвешивания и число ягод.'),
    ('brilliantovaya', 'yield', 'До 2,5–3,0 кг с куста; до 16 т/га', NULL, NULL, 'кг/куст; т/га',
     'В публикации урожайность сформулирована как до 2,5–3,0 кг с куста или до 16 т/га.',
     'brilliantovaya-vniispk', 'published_study', 'Урожайность сорта Бриллиантовая по публикации ВНИИСПК',
     'Сортоиспытание, описанное во ВНИИСПК', 'Брянская область', NULL, NULL,
     'Текстовое значение сохраняет верхнюю границу и обе единицы исходной формулировки.',
     'Раздел «Бриллиантовая», показатели урожайности',
     'Это значение опубликовано для описанного сортоиспытания.',
     'Источник в этой записи не указывает годы, схему посадки и метод расчёта урожайности.'),
    ('elsanta', 'fruit_color', 'Красная', NULL, NULL, NULL,
     'В записи Госреестра ягоды сорта Эльсанта описаны как красные.',
     'elsanta-gossort-record', 'reference_document', 'Окраска ягод сорта Эльсанта',
     'Запись Государственного реестра', NULL, NULL, NULL,
     'Фактический пересказ реестровой записи.',
     'Запись 9610367, описание ягод', 'Формулировка передана по Госреестру.',
     'Источник не описывает отдельный протокол визуальной идентификации окраски.'),
    ('elsanta', 'fruiting_cycle', 'Однократное плодоношение', NULL, NULL, NULL,
     'Госреестр относит Эльсанту к неремонтантным сортам.',
     'elsanta-gossort-record', 'reference_document', 'Тип плодоношения сорта Эльсанта',
     'Запись Государственного реестра', NULL, NULL, NULL,
     'Фактический пересказ классификации реестра.',
     'Запись 9610367, графа «Ремонтантность»', 'Классификация передана по реестровой записи.',
     'Источник не указывает даты сбора для конкретных мест выращивания.'),
    ('elsanta', 'maturity_period', 'Среднеранний', NULL, NULL, NULL,
     'В Госреестре срок созревания Эльсанты указан как среднеранний.',
     'elsanta-gossort-record', 'reference_document', 'Срок созревания сорта Эльсанта',
     'Запись Государственного реестра', NULL, NULL, NULL,
     'Фактический пересказ категории срока в реестре.',
     'Запись 9610367, графа «Срок созревания»', 'Категория дана в терминологии Госреестра.',
     'Категория не задаёт календарные даты для отдельных городов.'),
    ('elsanta', 'berry_weight_g', NULL, 13.1, NULL, 'г',
     'В реестровой записи средняя масса ягоды указана как 13,1 г.',
     'elsanta-gossort-record', 'reference_document', 'Средняя масса ягод сорта Эльсанта',
     'Запись Государственного реестра', NULL, NULL, NULL,
     'Число перенесено из реестровой записи.',
     'Запись 9610367, графа «Средняя масса ягоды»', 'Показатель передан в единицах Госреестра.',
     'В записи не раскрыты метод взвешивания и число измеренных ягод.'),
    ('elsanta', 'yield', NULL, 54.7, 73.4, 'ц/га',
     'В записи Госреестра урожайность приведена в диапазоне 54,7–73,4 ц/га.',
     'elsanta-gossort-record', 'reference_document', 'Урожайность сорта Эльсанта по Госреестру',
     'Запись Государственного реестра', NULL, NULL, NULL,
     'Диапазон перенесён из реестровой записи.',
     'Запись 9610367, графа «Урожайность»', 'Диапазон соответствует значению Госреестра.',
     'Реестровая запись не раскрывает здесь условия получения границ диапазона.');

INSERT INTO trait_observations
    (cultivar_id, trait_code, value_text, value_number, value_max, unit,
     context_text, source_id, review_status, reviewed_by, reviewed_at)
SELECT c.id, d.trait_code, d.value_text, d.value_number, d.value_max, d.unit,
       d.context_text, s.id, 'verified', 'codex-source-review', '2026-09-27 12:00:00'
FROM catalog_2026_09_27_observations d
JOIN cultivars c ON c.slug = d.cultivar_slug
JOIN sources s ON s.source_key = d.source_key;

INSERT INTO evidence_passports
    (observation_id, evidence_kind, subject_description, setting_text, place_text,
     period_from, period_to, conditions_json, method_text, source_locator,
     applicability_note, limitations_note, review_status, reviewed_by, reviewed_at)
SELECT o.id, d.evidence_kind, d.subject_description, d.setting_text, d.place_text,
       d.period_from, d.period_to, '{}', d.method_text, d.source_locator,
       d.applicability_note, d.limitations_note, 'verified',
       'codex-source-review', '2026-09-27 12:00:00'
FROM catalog_2026_09_27_observations d
JOIN cultivars c ON c.slug = d.cultivar_slug
JOIN trait_observations o ON o.cultivar_id = c.id AND o.trait_code = d.trait_code
JOIN sources s ON s.id = o.source_id AND s.source_key = d.source_key;

WITH admissions(region_number) AS (VALUES (4), (6), (10))
INSERT INTO official_admissions
    (cultivar_id, admission_region_number, registry_entry_code, admitted_year,
     edition_as_of, source_locator, source_id, review_status, reviewed_by, reviewed_at)
SELECT c.id, admissions.region_number, '9610367', 2007, '2026-09-27',
       'Запись 9610367 «Эльсанта», блок «Регионы допуска»', s.id,
       'verified', 'codex-source-review', '2026-09-27 12:00:00'
FROM admissions
JOIN cultivars c ON c.slug = 'elsanta'
JOIN sources s ON s.source_key = 'elsanta-gossort-record';

DROP TABLE catalog_2026_09_27_observations;
