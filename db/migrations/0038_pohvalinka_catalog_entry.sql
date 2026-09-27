-- Source-backed raspberry entry for Pohvalinka, with official admissions
-- recorded separately from plot-level recommendations.
INSERT INTO sources
    (source_key, kind, title, author_or_org, url, reference, accessed_on,
     rights_note, review_status, reviewed_by, reviewed_at)
VALUES
    ('pohvalinka-gossort-description', 'website', 'Похвалинка · описание сорта',
     'Госсорткомиссия',
     'https://gossortrf.ru/registry/gosudarstvennyy-reestr-selektsionnykh-dostizheniy-dopushchennykh-k-ispolzovaniyu-tom-1-sorta-rasteni/pokhvalinka-malina-8456207/',
     'Код сорта 8456207; описание, характеристики и регионы допуска', '2026-09-27',
     'Использованы краткие фактические пересказы; текст и изображения страницы не копировались.',
     'verified', 'codex-source-review', '2026-09-27 13:00:00'),
    ('ai-illustration-pohvalinka-20260927', 'other', 'Иллюстрация малины к карточке Похвалинки',
     'OpenAI image generation', NULL,
     'research/media/raspberry-pohvalinka-ai-study-2026-09-26.png', '2026-09-27',
     'Создано для проекта; иллюстрация красной малины, не фотография и не подтверждение внешнего вида сорта.',
     'verified', 'codex-source-review', '2026-09-27 13:00:00');

INSERT INTO cultivars
    (crop_id, slug, canonical_name, scientific_name, identity_source_id,
     editorial_status, reviewed_by, reviewed_at, published_at)
SELECT cr.id, 'pohvalinka', 'Похвалинка', 'Rubus idaeus L.', s.id,
       'published', 'codex-source-review', '2026-09-27 13:00:00', '2026-09-27 13:00:00'
FROM crops cr
JOIN sources s ON s.source_key = 'pohvalinka-gossort-description'
WHERE cr.slug = 'raspberry';

INSERT INTO media_assets
    (cultivar_id, asset_path, alt_text, source_id, rights_basis, rights_note,
     review_status, reviewed_by, reviewed_at)
SELECT c.id, '/assets/variety-pohvalinka.webp', 'Иллюстрация красной малины к карточке Похвалинки',
       s.id, 'owned',
       'Общая иллюстрация красной малины, не фотография сорта и не источник сортовых признаков.',
       'verified', 'codex-source-review', '2026-09-27 13:00:00'
FROM cultivars c
JOIN sources s ON s.source_key = 'ai-illustration-pohvalinka-20260927'
WHERE c.slug = 'pohvalinka';

CREATE TEMP TABLE pohvalinka_observations (
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

INSERT INTO pohvalinka_observations VALUES
    ('fruit_color', 'Красная', NULL, NULL, NULL,
     'В описании Госреестра ягоды названы красными.',
     'Окраска ягод сорта Похвалинка', 'Общая информация, описание ягод',
     'Передаёт окраску, указанную в официальной сортовой записи.',
     'Страница описывает сорт, но не содержит фотопротокола сортовой идентификации.'),
    ('fruiting_cycle', 'Ремонтантная', NULL, NULL, NULL,
     'Госреестр указывает для Похвалинки ремонтантное плодоношение.',
     'Тип плодоношения сорта Похвалинка', 'Общая информация; характеристики',
     'Передаёт тип плодоношения, указанный в официальной сортовой записи.',
     'Календарные сроки для отдельных городов в записи не приводятся.'),
    ('maturity_period', 'Среднего срока', NULL, NULL, NULL,
     'В описании Госреестра сорт отнесён к среднему сроку созревания.',
     'Срок созревания сорта Похвалинка', 'Общая информация, описание сорта',
     'Передаёт категорию срока созревания из официальной сортовой записи.',
     'Категория не задаёт календарную дату сбора для отдельного участка.'),
    ('berry_weight_g', 'Средняя — 6,4 г; максимальная — до 10,5 г', 6.4, 10.5, 'г',
     'Госреестр приводит среднюю массу ягоды 6,4 г и максимальную — до 10,5 г.',
     'Масса ягод сорта Похвалинка', 'Общая информация, абзац о ягодах',
     'Передаёт среднее и максимальное значения, указанные в официальной сортовой записи.',
     'В записи не приведены условия и протокол взвешивания.'),
    ('flavor', 'Кисло-сладкий, с ароматом; свежая ягода — 4,2 балла', NULL, NULL, NULL,
     'Госреестр описывает мякоть как кисло-сладкую с ароматом; дегустационная оценка свежей ягоды — 4,2 балла.',
     'Вкус ягод сорта Похвалинка', 'Общая информация, абзац о ягодах',
     'Передаёт формулировку и оценку из официальной сортовой записи.',
     'В записи не приведены состав дегустационной комиссии и протокол оценки.'),
    ('yield', '194 ц/га по данным заявителя', 194, NULL, 'ц/га',
     'Средняя урожайность в Госреестре указана как 194 ц/га по данным заявителя.',
     'Средняя урожайность сорта Похвалинка', 'Общая информация, описание урожайности',
     'Величина опубликована в реестре с прямым указанием «по данным заявителя».',
     'В реестровой записи не приведены протокол и условия измерения; источник относит величину к данным заявителя.');

INSERT INTO trait_observations
    (cultivar_id, trait_code, value_text, value_number, value_max, unit,
     context_text, source_id, review_status, reviewed_by, reviewed_at)
SELECT c.id, d.trait_code, d.value_text, d.value_number, d.value_max, d.unit,
       d.context_text, s.id, 'verified', 'codex-source-review', '2026-09-27 13:00:00'
FROM pohvalinka_observations d
JOIN cultivars c ON c.slug = 'pohvalinka'
JOIN sources s ON s.source_key = 'pohvalinka-gossort-description';

INSERT INTO evidence_passports
    (observation_id, evidence_kind, subject_description, setting_text,
     conditions_json, method_text, source_locator, applicability_note,
     limitations_note, review_status, reviewed_by, reviewed_at)
SELECT o.id, 'reference_document', d.subject_description, 'Сортовое описание Госреестра', '{}',
       'Фактический пересказ соответствующего раздела официальной записи сорта.',
       d.source_locator, d.applicability_note, d.limitations_note,
       'verified', 'codex-source-review', '2026-09-27 13:00:00'
FROM pohvalinka_observations d
JOIN cultivars c ON c.slug = 'pohvalinka'
JOIN trait_observations o ON o.cultivar_id = c.id AND o.trait_code = d.trait_code
JOIN sources s ON s.id = o.source_id AND s.source_key = 'pohvalinka-gossort-description';
DROP TABLE pohvalinka_observations;

WITH admission(region_number) AS (
    VALUES (1), (2), (3), (4), (5), (6), (7), (8), (9), (10), (11), (12)
)
INSERT INTO official_admissions
    (cultivar_id, admission_region_number, registry_entry_code, admitted_year,
     edition_as_of, source_locator, source_id, review_status, reviewed_by,
     reviewed_at, source_pdf_page)
SELECT c.id, admission.region_number, '8456207', 2019, '2024-05-31',
       'Малина (Rubus idaeus L.), печатная с. 419, PDF с. 418, строка 8456207 ПОХВАЛИНКА',
       s.id, 'verified', 'codex-source-review', '2026-09-27 13:00:00', 418
FROM cultivars c
JOIN sources s ON s.source_key = 'gsk-register-2024'
CROSS JOIN admission
WHERE c.slug = 'pohvalinka';
