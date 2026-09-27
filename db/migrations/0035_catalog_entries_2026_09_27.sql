-- Source-backed entries for Maroseyka raspberry and four strawberry cultivars.
-- Each observation stays attached to the original description or trial context.
INSERT INTO sources
    (source_key, kind, title, author_or_org, url, accessed_on, rights_note,
     review_status, reviewed_by, reviewed_at)
VALUES
    ('maroseyka-opitomnik-description', 'document', 'Малина: найдётся всё! Новые сорта малины',
     'Опытно-селекционный питомник', 'https://www.opitomnik.ru/files/novie-sorta-malini.pdf',
     '2026-09-27', 'Использованы краткие фактические пересказы и библиографическая ссылка; текст и изображения не копировались.',
     'verified', 'codex-source-review', '2026-09-27 21:00:00'),
    ('maroseyka-vniispk-identity', 'document', 'Каталог образцов малины',
     'ВНИИСПК', 'https://vniispk.ru/docs/unu/12_raspberry.pdf',
     '2026-09-27', 'Использована запись каталога для подтверждения названия и происхождения образца.',
     'verified', 'codex-source-review', '2026-09-27 21:00:00'),
    ('cabrillo-ucdavis', 'website', 'The Cabrillo Cultivar',
     'University of California, Davis',
     'https://research.ucdavis.edu/industry-support/plant-variety-licensing-program/strawberry-licensing-program/',
     '2026-09-27', 'Использованы краткие фактические пересказы и библиографическая ссылка; текст и изображения не копировались.',
     'verified', 'codex-source-review', '2026-09-27 21:00:00'),
    ('brilla-coviro', 'website', 'Brilla', 'COVIRO', 'https://www.coviro.it/brilla/',
     '2026-09-27', 'Использованы краткие фактические пересказы и библиографическая ссылка; текст и изображения не копировались.',
     'verified', 'codex-source-review', '2026-09-27 21:00:00'),
    ('magnus-flevo-berry', 'website', 'Magnus', 'Flevo Berry',
     'https://flevoberry.nl/variety/magnus/', '2026-09-27',
     'Использованы краткие фактические пересказы и библиографическая ссылка; текст и изображения не копировались.',
     'verified', 'codex-source-review', '2026-09-27 21:00:00'),
    ('rumba-fresh-forward', 'website', 'Rumba', 'Fresh Forward',
     'https://www.fresh-forward.nl/en/breed/rumba', '2026-09-27',
     'Использованы краткие фактические пересказы и библиографическая ссылка; текст и изображения не копировались.',
     'verified', 'codex-source-review', '2026-09-27 21:00:00');

INSERT INTO trait_definitions (code, label_ru, value_kind)
VALUES ('photoperiod_response', 'Реакция на длину светового дня', 'text')
ON CONFLICT(code) DO NOTHING;

CREATE TEMP TABLE catalog_2026_09_27_cultivars (
    crop_slug TEXT NOT NULL,
    slug TEXT NOT NULL,
    canonical_name TEXT NOT NULL,
    scientific_name TEXT NOT NULL,
    identity_source_key TEXT NOT NULL
) STRICT;

INSERT INTO catalog_2026_09_27_cultivars VALUES
    ('raspberry', 'maroseyka', 'Маросейка', 'Rubus idaeus L.', 'maroseyka-vniispk-identity'),
    ('strawberry', 'cabrillo', 'Кабрилло', 'Fragaria × ananassa', 'cabrillo-ucdavis'),
    ('strawberry', 'brilla', 'Брилла', 'Fragaria × ananassa', 'brilla-coviro'),
    ('strawberry', 'magnus', 'Магнус', 'Fragaria × ananassa', 'magnus-flevo-berry'),
    ('strawberry', 'rumba', 'Румба', 'Fragaria × ananassa', 'rumba-fresh-forward');

INSERT INTO cultivars
    (crop_id, slug, canonical_name, scientific_name, identity_source_id,
     editorial_status, reviewed_by, reviewed_at, published_at)
SELECT cr.id, d.slug, d.canonical_name, d.scientific_name, s.id,
       'published', 'codex-source-review', '2026-09-27 21:00:00', '2026-09-27 21:00:00'
FROM catalog_2026_09_27_cultivars d
JOIN crops cr ON cr.slug = d.crop_slug
JOIN sources s ON s.source_key = d.identity_source_key;
DROP TABLE catalog_2026_09_27_cultivars;

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
    ('maroseyka', 'fruit_color', 'Светло-красная', NULL, NULL, NULL,
     'Сортовое описание называет ягоды Маросейки светло-красными.',
     'maroseyka-opitomnik-description', 'reference_document', 'Окраска ягод сорта Маросейка',
     'Сортовое описание питомника', NULL, NULL, NULL,
     'Фактический пересказ сортового описания.',
     'PDF, печатная с. 7, раздел «МАРОСЕЙКА»',
     'Характеристика из опубликованного описания сорта.',
     'В источнике не приведён отдельный протокол проверки окраски.'),
    ('maroseyka', 'fruiting_cycle', 'Летняя', NULL, NULL, NULL,
     'Питомник относит Маросейку к летним сортам малины.',
     'maroseyka-opitomnik-description', 'reference_document', 'Тип плодоношения сорта Маросейка',
     'Сортовое описание питомника', NULL, NULL, NULL,
     'Фактический пересказ классификации в описании сорта.',
     'PDF, печатная с. 7, раздел «МАРОСЕЙКА»',
     'Передаёт группу сорта по классификации источника.',
     'Источник не приводит календарные даты сбора.'),
    ('maroseyka', 'maturity_period', 'Среднеранний', NULL, NULL, NULL,
     'В сортовом описании срок созревания указан как среднеранний.',
     'maroseyka-opitomnik-description', 'reference_document', 'Срок созревания сорта Маросейка',
     'Сортовое описание питомника', NULL, NULL, NULL,
     'Фактический пересказ формулировки источника.',
     'PDF, печатная с. 7, раздел «МАРОСЕЙКА»',
     'Категория срока созревания приведена в терминологии источника.',
     'Источник не задаёт календарные даты для российских городов.'),
    ('maroseyka', 'berry_weight_g', NULL, 4, 12, 'г',
     'В сортовом описании масса ягод приведена в диапазоне 4–12 г.',
     'maroseyka-opitomnik-description', 'reference_document', 'Масса ягод сорта Маросейка',
     'Сортовое описание питомника', NULL, NULL, NULL,
     'Фактический пересказ числового диапазона в источнике.',
     'PDF, печатная с. 7, раздел «МАРОСЕЙКА»',
     'Диапазон передаёт значение из описания сорта.',
     'Источник не приводит методику взвешивания и условия получения границ диапазона.'),
    ('maroseyka', 'yield', NULL, 4, 5, 'кг/куст',
     'В сортовом описании урожайность указана как 4–5 кг с куста.',
     'maroseyka-opitomnik-description', 'reference_document', 'Урожайность сорта Маросейка по описанию питомника',
     'Сортовое описание питомника', NULL, NULL, NULL,
     'Фактический пересказ значения из сортового описания.',
     'PDF, печатная с. 7, раздел «МАРОСЕЙКА»',
     'Диапазон относится к формулировке исходного описания.',
     'В источнике не приведены место, годы, методика и число растений.'),
    ('cabrillo', 'photoperiod_response', 'Нейтрального светового дня', NULL, NULL, NULL,
     'Селекционная программа UC Davis относит Кабрилло к сортам нейтрального светового дня.',
     'cabrillo-ucdavis', 'reference_document', 'Реакция сорта Кабрилло на длину светового дня',
     'Описание сорта UC Davis', NULL, NULL, NULL,
     'Фактический пересказ описания селекционной программы.',
     'Раздел «The Cabrillo Cultivar»',
     'Термин передан в формулировке UC Davis.',
     'Описание не является испытанием в российских условиях.'),
    ('cabrillo', 'berry_weight_g', NULL, 32, NULL, 'г/ягоду',
     'В сравнительной таблице показатель Fruit Size для Кабрилло указан как 32 г на ягоду.',
     'cabrillo-ucdavis', 'published_study', 'Размер ягоды сорта Кабрилло в сравнительном испытании',
     'Сравнительное испытание сорта', 'Уотсонвилл, Калифорния', '2012', '2013',
     'Значение перенесено из сравнительной таблицы испытаний UC Davis.',
     'Таблица испытаний Watsonville 2012–2013, строка Cabrillo, столбец Fruit Size',
     'Показатель относится к указанным площадке и годам испытания.',
     'Табличный результат описывает условия испытания в Калифорнии.'),
    ('brilla', 'fruit_color', 'Красно-оранжевая', NULL, NULL, NULL,
     'Оригинатор описывает ягоды Бриллы как красно-оранжевые.',
     'brilla-coviro', 'reference_document', 'Окраска ягод сорта Брилла',
     'Сортовое описание оригинатора', NULL, NULL, NULL,
     'Фактический пересказ сортового описания.',
     'Страница сорта Brilla, описание плодов',
     'Окраска передана по описанию оригинатора.',
     'Описание не сопровождается протоколом визуальной сортовой идентификации.'),
    ('brilla', 'fruiting_cycle', 'Однократное плодоношение', NULL, NULL, NULL,
     'Оригинатор указывает однократное плодоношение Бриллы.',
     'brilla-coviro', 'reference_document', 'Тип плодоношения сорта Брилла',
     'Сортовое описание оригинатора', NULL, NULL, NULL,
     'Фактический пересказ классификации сорта оригинатором.',
     'Страница сорта Brilla, блок характеристик',
     'Передаёт классификацию в описании оригинатора.',
     'Календарные сроки не переносились из исходного региона.'),
    ('brilla', 'maturity_period', 'Ранний', NULL, NULL, NULL,
     'Оригинатор относит Бриллу к ранним сортам.',
     'brilla-coviro', 'reference_document', 'Срок созревания сорта Брилла',
     'Сортовое описание оригинатора', NULL, NULL, NULL,
     'Фактический пересказ категории срока в описании.',
     'Страница сорта Brilla, блок характеристик',
     'Передаёт категорию срока в формулировке оригинатора.',
     'Категория не задаёт даты сбора в России.'),
    ('magnus', 'fruit_color', 'Ярко-красная', NULL, NULL, NULL,
     'Оригинатор описывает ягоды Магнуса как ярко-красные.',
     'magnus-flevo-berry', 'reference_document', 'Окраска ягод сорта Магнус',
     'Сортовое описание оригинатора', NULL, NULL, NULL,
     'Фактический пересказ описания ягод.',
     'Страница сорта Magnus, описание плодов',
     'Окраска передана по описанию оригинатора.',
     'Отдельный протокол визуальной сортовой идентификации не указан.'),
    ('magnus', 'fruiting_cycle', 'Однократное плодоношение', NULL, NULL, NULL,
     'Оригинатор относит Магнус к сортам июньского плодоношения.',
     'magnus-flevo-berry', 'reference_document', 'Тип плодоношения сорта Магнус',
     'Сортовое описание оригинатора', NULL, NULL, NULL,
     'Фактический пересказ категории June-bearing.',
     'Страница сорта Magnus, блок характеристик',
     'Описание использует категорию сезонного плодоношения оригинатора.',
     'Срок июньского сбора относится к системе классификации оригинатора.'),
    ('magnus', 'maturity_period', 'Поздний', NULL, NULL, NULL,
     'Оригинатор относит Магнус к поздним сортам июньского плодоношения.',
     'magnus-flevo-berry', 'reference_document', 'Срок созревания сорта Магнус',
     'Сортовое описание оригинатора', NULL, NULL, NULL,
     'Фактический пересказ категории срока в описании.',
     'Страница сорта Magnus, блок характеристик',
     'Передаёт относительную категорию из описания оригинатора.',
     'Сравнительное отличие от сорта Faith не задаёт календарные даты для России.'),
    ('rumba', 'fruit_color', 'Ярко-красная', NULL, NULL, NULL,
     'Оригинатор описывает ягоды Румбы как ярко-красные.',
     'rumba-fresh-forward', 'reference_document', 'Окраска ягод сорта Румба',
     'Сортовое описание оригинатора', NULL, NULL, NULL,
     'Фактический пересказ описания ягод.',
     'Страница сорта Rumba, описание плодов',
     'Окраска передана по описанию оригинатора.',
     'Отдельный протокол визуальной сортовой идентификации не указан.'),
    ('rumba', 'fruiting_cycle', 'Однократное плодоношение', NULL, NULL, NULL,
     'Оригинатор относит Румбу к сортам с однократным плодоношением.',
     'rumba-fresh-forward', 'reference_document', 'Тип плодоношения сорта Румба',
     'Сортовое описание оригинатора', NULL, NULL, NULL,
     'Фактический пересказ классификации сорта.',
     'Страница сорта Rumba, описание сорта',
     'Передаёт категорию оригинатора.',
     'Календарные сроки не переносились из исходного региона.'),
    ('rumba', 'maturity_period', 'Ранний', NULL, NULL, NULL,
     'Оригинатор относит Румбу к ранним сортам.',
     'rumba-fresh-forward', 'reference_document', 'Срок созревания сорта Румба',
     'Сортовое описание оригинатора', NULL, NULL, NULL,
     'Фактический пересказ категории срока в описании.',
     'Страница сорта Rumba, блок характеристик',
     'Категория срока дана в описании оригинатора.',
     'Сравнение с Sonata не задаёт календарные даты для России.');

INSERT INTO trait_observations
    (cultivar_id, trait_code, value_text, value_number, value_max, unit,
     context_text, source_id, review_status, reviewed_by, reviewed_at)
SELECT c.id, d.trait_code, d.value_text, d.value_number, d.value_max, d.unit,
       d.context_text, s.id, 'verified', 'codex-source-review', '2026-09-27 21:00:00'
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
       'codex-source-review', '2026-09-27 21:00:00'
FROM catalog_2026_09_27_observations d
JOIN cultivars c ON c.slug = d.cultivar_slug
JOIN trait_observations o ON o.cultivar_id = c.id AND o.trait_code = d.trait_code
JOIN sources s ON s.id = o.source_id AND s.source_key = d.source_key;

DROP TABLE catalog_2026_09_27_observations;
