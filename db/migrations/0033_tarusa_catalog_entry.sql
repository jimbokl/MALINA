-- Source-backed catalog entry for the high-demand summer raspberry Tarusa.
-- Nursery descriptions and the VNIISPK winter study remain separate records.
INSERT INTO sources
    (source_key, kind, title, author_or_org, url, accessed_on, rights_note,
     review_status, reviewed_by, reviewed_at)
VALUES
    ('tarusa-nursery-description', 'document', 'Малина: найдётся всё! Новые сорта малины',
     'Опытно-селекционный питомник', 'https://www.opitomnik.ru/files/novie-sorta-malini.pdf',
     '2026-09-27', 'Использованы краткие фактические пересказы и библиографическая ссылка; текст и изображения не копировались.',
     'verified', 'codex-source-review', '2026-09-27 18:00:00'),
    ('tarusa-vniispk-winter-2007', 'document',
     'Изучение компонентов зимостойкости крупноплодных сортов малины красной',
     'Е. И. Шарафутдинова; ВНИИСПК',
     'https://vniispk.ru/pages/activities/science-activities/conference-2007/publ-2007-56',
     '2026-09-27', 'Использованы краткие фактические пересказы и библиографическая ссылка; текст и изображения не копировались.',
     'verified', 'codex-source-review', '2026-09-27 18:00:00'),
    ('tarusa-vniispk-identity-2019', 'document',
     'Актуальные направления селекции малины, российские и мировые достижения',
     'М. В. Лупин; Н. И. Богомолова; ВНИИСПК',
     'https://old.journal-vniispk.ru/pdf/2019/4/46.pdf',
     '2026-09-27', 'Использованы краткие фактические пересказы и библиографическая ссылка; текст и изображения не копировались.',
     'verified', 'codex-source-review', '2026-09-27 18:00:00');

INSERT INTO cultivars
    (crop_id, slug, canonical_name, scientific_name, identity_source_id,
     editorial_status, reviewed_by, reviewed_at, published_at)
SELECT cr.id, 'tarusa', 'Таруса', 'Rubus idaeus L.', s.id,
       'published', 'codex-source-review', '2026-09-27 18:00:00', '2026-09-27 18:00:00'
FROM crops cr
JOIN sources s ON s.source_key = 'tarusa-vniispk-identity-2019'
WHERE cr.slug = 'raspberry';

CREATE TEMP TABLE tarusa_observations (
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

INSERT INTO tarusa_observations VALUES
    ('fruit_color', 'Красная', NULL, NULL, NULL,
     'В описании питомника ягоды Тарусы названы ярко-красными.',
     'tarusa-nursery-description', 'reference_document', 'Окраска ягод сорта Таруса',
     'Сортовое описание питомника', NULL, NULL, NULL,
     'Фактический пересказ опубликованного описания сорта.',
     'PDF, печатная с. 5, раздел «ТАРУСА»',
     'Подтверждает окраску ягод в описании питомника.',
     'Не является фотографической проверкой отдельного растения.'),
    ('fruiting_cycle', 'Летняя', NULL, NULL, NULL,
     'Питомник относит Тарусу к летним сортам малины.',
     'tarusa-nursery-description', 'reference_document', 'Тип плодоношения сорта Таруса',
     'Сортовое описание питомника', NULL, NULL, NULL,
     'Фактический пересказ опубликованного описания сорта.',
     'PDF, печатная с. 5, раздел «ТАРУСА»',
     'Передаёт группировку сорта в указанном описании.',
     'Календарные даты сбора зависят от места и условий выращивания.'),
    ('maturity_period', 'Среднепоздний', NULL, NULL, NULL,
     'Среднепоздний срок созревания указан в описании питомника.',
     'tarusa-nursery-description', 'reference_document', 'Срок созревания сорта Таруса',
     'Сортовое описание питомника', NULL, NULL, NULL,
     'Фактический пересказ опубликованного описания сорта.',
     'PDF, печатная с. 5, раздел «ТАРУСА»',
     'Характеризует срок созревания в формулировке источника.',
     'Не задаёт календарные даты созревания для российских городов.'),
    ('berry_weight_g', NULL, 4, 12, 'г',
     'В описании питомника приведена масса ягод 4–12 г.',
     'tarusa-nursery-description', 'reference_document', 'Масса ягод сорта Таруса',
     'Сортовое описание питомника', NULL, NULL, NULL,
     'Фактический пересказ диапазона, приведённого в описании.',
     'PDF, печатная с. 5, раздел «ТАРУСА»',
     'Диапазон передаёт значение из опубликованного описания сорта.',
     'Источник не описывает метод измерения и условия получения крайних значений.'),
    ('yield', NULL, 3, 4, 'кг/куст',
     'Урожайность 3–4 кг с куста приведена в описании питомника.',
     'tarusa-nursery-description', 'reference_document', 'Урожайность сорта Таруса по описанию питомника',
     'Сортовое описание питомника', NULL, NULL, NULL,
     'Фактический пересказ указанного диапазона.',
     'PDF, печатная с. 5, раздел «ТАРУСА», абзац об урожайности',
     'Подтверждает диапазон, который приводит питомник.',
     'В источнике не указаны место, годы, метод и число растений для этого диапазона.'),
    ('winter_hardiness', 'Достаточная морозоустойчивость по изученным компонентам', NULL, NULL, NULL,
     'Авторы исследования отнесли Тарусу к достаточно морозоустойчивым по всем изученным компонентам.',
     'tarusa-vniispk-winter-2007', 'published_study', 'Зимостойкость однолетних побегов сорта Таруса',
     'Искусственное промораживание вызревших однолетних побегов', 'Подмосковье, Центральный регион',
     '2005', '2006',
     'Четыре режима искусственного промораживания; повреждения почек, коры и древесины оценивали по пятибалльной шкале.',
     'Таблица 1, строка «Таруса»; раздел «Выводы»',
     'Результат относится к материалу и режимам исследования 2005–2006 годов в Подмосковье.',
     'Лабораторный опыт на отобранных вызревших неповреждённых побегах не является прогнозом зимовки куста на отдельном участке.');

INSERT INTO trait_observations
    (cultivar_id, trait_code, value_text, value_number, value_max, unit,
     context_text, source_id, review_status, reviewed_by, reviewed_at)
SELECT c.id, d.trait_code, d.value_text, d.value_number, d.value_max, d.unit,
       d.context_text, s.id, 'verified', 'codex-source-review', '2026-09-27 18:00:00'
FROM tarusa_observations d
JOIN cultivars c ON c.slug = 'tarusa'
JOIN sources s ON s.source_key = d.source_key;

INSERT INTO evidence_passports
    (observation_id, evidence_kind, subject_description, setting_text, place_text,
     period_from, period_to, conditions_json, method_text, source_locator,
     applicability_note, limitations_note, review_status, reviewed_by, reviewed_at)
SELECT o.id, d.evidence_kind, d.subject_description, d.setting_text, d.place_text,
       d.period_from, d.period_to, '{}', d.method_text, d.source_locator,
       d.applicability_note, d.limitations_note, 'verified',
       'codex-source-review', '2026-09-27 18:00:00'
FROM tarusa_observations d
JOIN cultivars c ON c.slug = 'tarusa'
JOIN trait_observations o ON o.cultivar_id = c.id AND o.trait_code = d.trait_code
JOIN sources s ON s.id = o.source_id AND s.source_key = d.source_key;
