-- Eight high-demand cultivars with primary-source-backed identity and traits.
-- The observed trial values are preserved with their site, period and locator.
INSERT INTO sources
    (source_key, kind, title, author_or_org, url, accessed_on, rights_note,
     review_status, reviewed_by, reviewed_at)
VALUES
    ('spbgau-remontant-leningrad-2022', 'document',
     'Подбор сортов ремонтантной малины для Ленинградской области',
     'Санкт-Петербургский государственный аграрный университет',
     'https://spbgau.ru/upload/iblock/adf/worxb9mmx2b0mkfa8t4nq9g31fjfr95i.pdf',
     '2026-09-27', 'Использованы краткие фактические пересказы и библиографическая ссылка; текст и изображения не копировались.',
     'verified', 'codex-source-review', '2026-09-27 12:00:00'),
    ('samara-raspberry-collection-2026', 'document',
     'Коллекция сортов малины обыкновенной в ГБУ СО НИИ «Жигулёвские сады»',
     'Самарский государственный аграрный университет',
     'https://ssaa.ru/structur/riz/sbornik_selek_i_sort_2026.pdf',
     '2026-09-27', 'Использованы краткие фактические пересказы и библиографическая ссылка; текст и изображения не копировались.',
     'verified', 'codex-source-review', '2026-09-27 12:00:00'),
    ('vstisp-strawberry-kokino-2018', 'document',
     'Оценка сортов земляники по устойчивости к неблагоприятным абиотическим факторам в условиях юго-западной части Нечерноземья России',
     'ВСТИСП; Н. В. Андронова',
     'https://vstisp.org/vstisp/images/stories/horticulture/S-and-V-2018-4/32-37-4-2018.pdf',
     '2026-09-27', 'Использованы краткие фактические пересказы и библиографическая ссылка; текст и изображения не копировались.',
     'verified', 'codex-source-review', '2026-09-27 12:00:00');

CREATE TEMP TABLE catalog_candidates (
    slug TEXT PRIMARY KEY,
    crop_slug TEXT NOT NULL,
    canonical_name TEXT NOT NULL,
    scientific_name TEXT NOT NULL,
    source_key TEXT NOT NULL
) STRICT;

INSERT INTO catalog_candidates VALUES
    ('pshehiba', 'raspberry', 'Пшехиба', 'Rubus idaeus', 'samara-raspberry-collection-2026'),
    ('karamelka', 'raspberry', 'Карамелька', 'Rubus idaeus', 'spbgau-remontant-leningrad-2022'),
    ('samohval', 'raspberry', 'Самохвал', 'Rubus idaeus', 'spbgau-remontant-leningrad-2022'),
    ('patritsiya', 'raspberry', 'Патриция', 'Rubus idaeus', 'samara-raspberry-collection-2026'),
    ('malvina', 'strawberry', 'Мальвина', 'Fragaria × ananassa', 'vstisp-strawberry-kokino-2018'),
    ('albion', 'strawberry', 'Альбион', 'Fragaria × ananassa', 'vstisp-strawberry-kokino-2018'),
    ('honey', 'strawberry', 'Хоней', 'Fragaria × ananassa', 'vstisp-strawberry-kokino-2018'),
    ('kimberli', 'strawberry', 'Кимберли', 'Fragaria × ananassa', 'vstisp-strawberry-kokino-2018');

INSERT INTO cultivars
    (crop_id, slug, canonical_name, scientific_name, identity_source_id,
     editorial_status, reviewed_by, reviewed_at, published_at)
SELECT cr.id, d.slug, d.canonical_name, d.scientific_name, s.id,
       'published', 'codex-source-review', '2026-09-27 12:00:00', '2026-09-27 12:00:00'
FROM catalog_candidates d
JOIN crops cr ON cr.slug = d.crop_slug
JOIN sources s ON s.source_key = d.source_key;

INSERT INTO cultivar_aliases
    (cultivar_id, alias, normalized_alias, source_id, review_status, reviewed_by, reviewed_at)
SELECT c.id, 'Вима Кимберли', 'вима кимберли', s.id, 'verified',
       'codex-source-review', '2026-09-27 12:00:00'
FROM cultivars c
JOIN sources s ON s.source_key = 'vstisp-strawberry-kokino-2018'
WHERE c.slug = 'kimberli';

CREATE TEMP TABLE catalog_observations (
    slug TEXT NOT NULL,
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
    place_text TEXT NOT NULL,
    period_from TEXT,
    period_to TEXT,
    method_text TEXT NOT NULL,
    source_locator TEXT NOT NULL,
    applicability_note TEXT NOT NULL,
    limitations_note TEXT NOT NULL
) STRICT;

INSERT INTO catalog_observations VALUES
    ('pshehiba', 'berry_weight_g', NULL, 3.99, 5.6, 'г',
     'В коллекции «Жигулёвских садов» в 2025 году средняя масса ягоды составила 3,99 г, максимальная — 5,6 г.',
     'samara-raspberry-collection-2026', 'published_study', 'Масса ягод сорта Пшехиба в коллекции малины',
     'Коллекционные посадки', 'ГБУ СО НИИ «Жигулёвские сады», Самарская область', '2025', '2025',
     'В таблице приведены средняя и максимальная масса ягод.',
     'Таблица 3 «Масса ягод малины, данные 2025 года», строка «Пшехиба»',
     'Значения относятся к коллекционным посадкам 2025 года в Самарской области.',
     'Источник не устанавливает массу ягод для иных условий выращивания.'),
    ('patritsiya', 'berry_weight_g', NULL, 2.93, 3.9, 'г',
     'В коллекции «Жигулёвских садов» в 2025 году средняя масса ягоды составила 2,93 г, максимальная — 3,9 г.',
     'samara-raspberry-collection-2026', 'published_study', 'Масса ягод сорта Патриция в коллекции малины',
     'Коллекционные посадки', 'ГБУ СО НИИ «Жигулёвские сады», Самарская область', '2025', '2025',
     'В таблице приведены средняя и максимальная масса ягод.',
     'Таблица 3 «Масса ягод малины, данные 2025 года», строка «Патриция»',
     'Значения относятся к коллекционным посадкам 2025 года в Самарской области.',
     'Источник не устанавливает массу ягод для иных условий выращивания.'),
    ('karamelka', 'fruiting_cycle', 'Ремонтантная', NULL, NULL, NULL,
     'Сорт отнесён к ремонтантной малине.', 'spbgau-remontant-leningrad-2022', 'published_study',
     'Тип плодоношения сорта Карамелька', 'Сортоизучение ремонтантной малины', 'Ленинградская область', NULL, NULL,
     'В статье приведены сортовые характеристики ремонтантных сортов.',
     'Печатная с. 95, абзац описания сорта «Карамелька»',
     'Характеристика приведена в статье о подборе сортов для Ленинградской области.',
     'Это описание сорта в рамках указанной публикации.'),
    ('karamelka', 'maturity_period', 'Среднеранний', NULL, NULL, NULL,
     'Среднеранний срок созревания указан в описании сорта.', 'spbgau-remontant-leningrad-2022', 'published_study',
     'Срок созревания сорта Карамелька', 'Сортоизучение ремонтантной малины', 'Ленинградская область', NULL, NULL,
     'В статье приведены сортовые характеристики ремонтантных сортов.',
     'Печатная с. 95, абзац описания сорта «Карамелька»',
     'Срок указан в исследовательской публикации о Ленинградской области.',
     'Источник не задаёт календарные даты сбора для других мест.'),
    ('karamelka', 'berry_weight_g', NULL, 3.8, 8.0, 'г',
     'Средняя масса ягоды — 3,8 г, максимальная — 8,0 г.', 'spbgau-remontant-leningrad-2022', 'published_study',
     'Масса ягод сорта Карамелька', 'Сортоизучение ремонтантной малины', 'Ленинградская область', NULL, NULL,
     'В статье раздельно приведены средняя и максимальная масса ягод.',
     'Печатная с. 95, абзац описания сорта «Карамелька»',
     'Значения приведены в исследовательской публикации о Ленинградской области.',
     'Источник не устанавливает массу ягод для иных условий выращивания.'),
    ('samohval', 'fruiting_cycle', 'Ремонтантная', NULL, NULL, NULL,
     'Сорт отнесён к ремонтантной малине.', 'spbgau-remontant-leningrad-2022', 'published_study',
     'Тип плодоношения сорта Самохвал', 'Сортоизучение ремонтантной малины', 'Ленинградская область', NULL, NULL,
     'В статье приведены сортовые характеристики ремонтантных сортов.',
     'Печатная с. 95, абзац описания сорта «Самохвал»',
     'Характеристика приведена в статье о подборе сортов для Ленинградской области.',
     'Это описание сорта в рамках указанной публикации.'),
    ('samohval', 'maturity_period', 'Поздний', NULL, NULL, NULL,
     'Поздний срок созревания указан в описании сорта.', 'spbgau-remontant-leningrad-2022', 'published_study',
     'Срок созревания сорта Самохвал', 'Сортоизучение ремонтантной малины', 'Ленинградская область', NULL, NULL,
     'В статье приведены сортовые характеристики ремонтантных сортов.',
     'Печатная с. 95, абзац описания сорта «Самохвал»',
     'Срок указан в исследовательской публикации о Ленинградской области.',
     'Источник не задаёт календарные даты сбора для других мест.'),
    ('samohval', 'berry_weight_g', NULL, 5.9, 9.1, 'г',
     'Средняя масса ягоды — 5,9 г, максимальная — 9,1 г.', 'spbgau-remontant-leningrad-2022', 'published_study',
     'Масса ягод сорта Самохвал', 'Сортоизучение ремонтантной малины', 'Ленинградская область', NULL, NULL,
     'В статье раздельно приведены средняя и максимальная масса ягод.',
     'Печатная с. 95, абзац описания сорта «Самохвал»',
     'Значения приведены в исследовательской публикации о Ленинградской области.',
     'Источник не устанавливает массу ягод для иных условий выращивания.'),
    ('malvina', 'winter_hardiness', '3,0–4,0 балла', NULL, NULL, 'балла',
     'В испытании максимальная степень подмерзания растений составила 3,0–4,0 балла.',
     'vstisp-strawberry-kokino-2018', 'published_study', 'Степень подмерзания сорта Мальвина',
     'Полевое сортоиспытание', 'Кокино, Брянская область', '2013', '2017',
     'Оценка максимальной степени подмерзания растений по балльной шкале.',
     'Таблица 2, печатная с. 35, группа 3,0–4,0 балла «малозимостойкие»',
     'Балльная оценка приводится для испытания в Кокино в 2013–2017 годах.',
     'Оценка описывает подмерзание в условиях данного испытания.'),
    ('albion', 'winter_hardiness', '4,5–5,0 балла', NULL, NULL, 'балла',
     'В испытании сорт отнесён к группе с максимальной степенью подмерзания 4,5–5,0 балла.',
     'vstisp-strawberry-kokino-2018', 'published_study', 'Степень подмерзания сорта Альбион',
     'Полевое сортоиспытание', 'Кокино, Брянская область', '2013', '2017',
     'Оценка максимальной степени подмерзания растений по балльной шкале.',
     'Таблица 2, печатная с. 35, группа 4,5–5,0 балла «незимостойкие»',
     'Балльная оценка приводится для испытания в Кокино в 2013–2017 годах.',
     'Оценка описывает подмерзание в условиях данного испытания.'),
    ('honey', 'winter_hardiness', '3,0–4,0 балла', NULL, NULL, 'балла',
     'В испытании максимальная степень подмерзания растений составила 3,0–4,0 балла.',
     'vstisp-strawberry-kokino-2018', 'published_study', 'Степень подмерзания сорта Хоней',
     'Полевое сортоиспытание', 'Кокино, Брянская область', '2013', '2017',
     'Оценка максимальной степени подмерзания растений по балльной шкале.',
     'Таблица 2, печатная с. 35, группа 3,0–4,0 балла «малозимостойкие»',
     'Балльная оценка приводится для испытания в Кокино в 2013–2017 годах.',
     'Оценка описывает подмерзание в условиях данного испытания.'),
    ('kimberli', 'winter_hardiness', '3,0–4,0 балла', NULL, NULL, 'балла',
     'В испытании максимальная степень подмерзания растений составила 3,0–4,0 балла.',
     'vstisp-strawberry-kokino-2018', 'published_study', 'Степень подмерзания сорта Вима Кимберли',
     'Полевое сортоиспытание', 'Кокино, Брянская область', '2013', '2017',
     'Оценка максимальной степени подмерзания растений по балльной шкале.',
     'Таблица 2, печатная с. 35, группа 3,0–4,0 балла «малозимостойкие»',
     'Балльная оценка приводится для испытания в Кокино в 2013–2017 годах.',
     'Оценка описывает подмерзание в условиях данного испытания.');

INSERT INTO trait_observations
    (cultivar_id, trait_code, value_text, value_number, value_max, unit,
     context_text, source_id, review_status, reviewed_by, reviewed_at)
SELECT c.id, d.trait_code, d.value_text, d.value_number, d.value_max, d.unit,
       d.context_text, s.id, 'verified', 'codex-source-review', '2026-09-27 12:00:00'
FROM catalog_observations d
JOIN cultivars c ON c.slug = d.slug
JOIN sources s ON s.source_key = d.source_key;

INSERT INTO evidence_passports
    (observation_id, evidence_kind, subject_description, setting_text, place_text,
     period_from, period_to, conditions_json, method_text, source_locator,
     applicability_note, limitations_note, review_status, reviewed_by, reviewed_at)
SELECT o.id, d.evidence_kind, d.subject_description, d.setting_text, d.place_text,
       d.period_from, d.period_to, '{}', d.method_text, d.source_locator,
       d.applicability_note, d.limitations_note, 'verified',
       'codex-source-review', '2026-09-27 12:00:00'
FROM catalog_observations d
JOIN cultivars c ON c.slug = d.slug
JOIN trait_observations o ON o.cultivar_id = c.id AND o.trait_code = d.trait_code
JOIN sources s ON s.id = o.source_id AND s.source_key = d.source_key;

DROP TABLE catalog_observations;
DROP TABLE catalog_candidates;
