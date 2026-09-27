-- Source-backed record for the high-demand summer raspberry Lyachka.
-- Variety description facts and institutional identity evidence stay separate.
INSERT INTO sources
    (source_key, kind, title, author_or_org, url, accessed_on, rights_note,
     review_status, reviewed_by, reviewed_at)
VALUES
    ('lyachka-vhoz-description', 'website', 'Малина Лячка: описание сорта, выращивание и уход',
     'Ольга Александрова; портал «Ваше хозяйство»',
     'https://www.vhoz.ru/articles/sad/malina-lyachka-opisanie-sorta-vyrashchivanie-i-ukhod/',
     '2026-09-27', 'Использованы краткие фактические пересказы и библиографическая ссылка; текст и изображения не копировались.',
     'verified', 'codex-source-review', '2026-09-27 19:00:00'),
    ('lyachka-vniispk-identity', 'document', 'Каталог образцов малины',
     'ВНИИСПК', 'https://vniispk.ru/docs/unu/12_raspberry.pdf',
     '2026-09-27', 'Использована запись каталога для подтверждения названия, видовой принадлежности и происхождения образца.',
     'verified', 'codex-source-review', '2026-09-27 19:00:00');

INSERT INTO cultivars
    (crop_id, slug, canonical_name, scientific_name, identity_source_id,
     editorial_status, reviewed_by, reviewed_at, published_at)
SELECT cr.id, 'lyachka', 'Лячка', 'Rubus idaeus L.', s.id,
       'published', 'codex-source-review', '2026-09-27 19:00:00', '2026-09-27 19:00:00'
FROM crops cr
JOIN sources s ON s.source_key = 'lyachka-vniispk-identity'
WHERE cr.slug = 'raspberry';

CREATE TEMP TABLE lyachka_aliases (
    alias TEXT NOT NULL,
    normalized_alias TEXT NOT NULL
) STRICT;

INSERT INTO lyachka_aliases VALUES
    ('Laszka', 'laszka'),
    ('Ляшка', 'ляшка'),
    ('Лашка', 'лашка'),
    ('Лачка', 'лачка');

INSERT INTO cultivar_aliases
    (cultivar_id, alias, normalized_alias, source_id, review_status, reviewed_by, reviewed_at)
SELECT c.id, a.alias, a.normalized_alias, s.id, 'verified',
       'codex-source-review', '2026-09-27 19:00:00'
FROM cultivars c
JOIN sources s ON s.source_key = 'lyachka-vhoz-description'
CROSS JOIN lyachka_aliases a
WHERE c.slug = 'lyachka';
DROP TABLE lyachka_aliases;

CREATE TEMP TABLE lyachka_observations (
    trait_code TEXT NOT NULL,
    value_text TEXT,
    value_number REAL,
    value_max REAL,
    unit TEXT,
    context_text TEXT NOT NULL,
    evidence_kind TEXT NOT NULL,
    subject_description TEXT NOT NULL,
    source_locator TEXT NOT NULL,
    method_text TEXT NOT NULL,
    applicability_note TEXT NOT NULL,
    limitations_note TEXT NOT NULL
) STRICT;

INSERT INTO lyachka_observations VALUES
    ('fruit_color', 'Ярко-красная', NULL, NULL, NULL,
     'В сортовом описании ягоды Лячки названы ярко-красными.',
     'reference_document', 'Окраска ягод сорта Лячка',
     'Раздел «Урожайность и плодоношение», абзац о ягодах',
     'Фактический пересказ сортового описания.',
     'Подтверждает формулировку источника об окраске ягод.',
     'В источнике нет отдельного фотопротокола сортовой идентификации.'),
    ('fruiting_cycle', 'Летняя', NULL, NULL, NULL,
     'В статье Лячка отнесена к летним сортам малины.',
     'reference_document', 'Тип плодоношения сорта Лячка',
     'Вводный абзац; раздел «Урожайность и плодоношение»',
     'Фактический пересказ сортового описания.',
     'Передаёт группу плодоношения, указанную в описании.',
     'Календарные даты созревания в источнике относятся к описанным там регионам.'),
    ('maturity_period', 'Ранний', NULL, NULL, NULL,
     'Источник описывает Лячку как один из ранних сортов летней малины.',
     'reference_document', 'Срок созревания сорта Лячка',
     'Раздел «Урожайность и плодоношение», абзац о сроках сбора',
     'Фактический пересказ сортового описания.',
     'Отражает категорию срока созревания в источнике.',
     'Не задаёт календарные даты созревания для российских городов.'),
    ('berry_weight_g', NULL, 6, 8, 'г',
     'В статье средняя масса ягод приведена в диапазоне 6–8 г.',
     'reference_document', 'Масса ягод сорта Лячка',
     'Раздел «Урожайность и плодоношение», абзац о ягодах',
     'Фактический пересказ диапазона из сортового описания.',
     'Передаёт диапазон массы, приведённый источником.',
     'Источник не приводит протокол взвешивания или условия получения диапазона.'),
    ('yield', NULL, 3, 6, 'кг/куст',
     'В статье урожайность Лячки указана как 3–6 кг ягод с куста за сезон.',
     'reference_document', 'Урожайность сорта Лячка по сортовому описанию',
     'Раздел «Урожайность и плодоношение», абзац о сборе с куста',
     'Фактический пересказ указанного в статье диапазона.',
     'Передаёт урожайность, приведённую в источнике.',
     'Величина зависит от возраста растения и условий выращивания; источник не описывает методику измерения.');

INSERT INTO trait_observations
    (cultivar_id, trait_code, value_text, value_number, value_max, unit,
     context_text, source_id, review_status, reviewed_by, reviewed_at)
SELECT c.id, d.trait_code, d.value_text, d.value_number, d.value_max, d.unit,
       d.context_text, s.id, 'verified', 'codex-source-review', '2026-09-27 19:00:00'
FROM lyachka_observations d
JOIN cultivars c ON c.slug = 'lyachka'
JOIN sources s ON s.source_key = 'lyachka-vhoz-description';

INSERT INTO evidence_passports
    (observation_id, evidence_kind, subject_description, setting_text,
     conditions_json, method_text, source_locator, applicability_note,
     limitations_note, review_status, reviewed_by, reviewed_at)
SELECT o.id, d.evidence_kind, d.subject_description, 'Сортовое описание', '{}',
       d.method_text, d.source_locator, d.applicability_note, d.limitations_note,
       'verified', 'codex-source-review', '2026-09-27 19:00:00'
FROM lyachka_observations d
JOIN cultivars c ON c.slug = 'lyachka'
JOIN trait_observations o ON o.cultivar_id = c.id AND o.trait_code = d.trait_code
JOIN sources s ON s.id = o.source_id AND s.source_key = 'lyachka-vhoz-description';
DROP TABLE lyachka_observations;
