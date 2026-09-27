-- D-04: two narrow Bryansk selection rules grounded in trials at Kokino.
-- Admission to the Central register region is not used as the regional basis.
CREATE TEMP TABLE bryansk_trial_rule_seed (
    cultivar_slug TEXT PRIMARY KEY,
    source_key TEXT NOT NULL,
    rationale TEXT NOT NULL,
    limitations TEXT NOT NULL,
    source_locator TEXT NOT NULL,
    conditions_text TEXT NOT NULL,
    subject_description TEXT NOT NULL,
    period_from TEXT NOT NULL,
    period_to TEXT NOT NULL,
    method_text TEXT NOT NULL,
    applicability_note TEXT NOT NULL
) STRICT;

INSERT INTO bryansk_trial_rule_seed VALUES
    ('salyut', 'raspberry-kokino-trial-2020-2023',
     'В Кокино «Салют» плодоносил в 2020–2023 годах, полностью реализуя потенциал продуктивности даже в неблагоприятные сезоны; авторы считают сорт пригодным для промышленного производства.',
     'Основание — один коллекционный участок Брянской области при описанной агротехнике; результат не задаёт урожайность или сроки созревания для другого сада.',
     'Аннотация; «Материалы и методы»; «Результаты», абзацы после таблицы 3; «Выводы»',
     'Коллекционный участок Кокинского опорного пункта; серые лесные среднесуглинистые почвы; посадка 2019 года 3,0 × 0,5 м, ежегодное скашивание побегов после плодоношения, весенняя азотная подкормка и обработки междурядий.',
     'Ремонтантная малина «Салют» в сравнительном сортоизучении Кокинского опорного пункта',
     '2020', '2023',
     'Сортоизучение на одновозрастных растениях; сравнение с сортом «Пингвин»; оценка урожайности и доли созревших ягод в разные сезоны.',
     'Локальное основание рассмотреть «Салют» для подбора в Брянской области при сопоставимых условиях участка и ухода.'),
    ('solovushka', 'strawberry-kokino-trial-2006-2007',
     'В первичном сортоизучении в Кокино «Соловушка» была среди наиболее урожайных сортов среднего срока созревания в 2006–2007 годах; подмерзание в зимах 2005/06–2007/08 оставалось не выше 1 балла.',
     'Основание — один опытный участок и годы 2006–2008; статья оценивает сорт также как селекционный материал. Данные не гарантируют такую же урожайность или зимовку в другом саду.',
     'Описание участка и зим; таблица 1, строка «Соловушка»; таблица 2, строка «Соловушка»; абзац после таблицы 2',
     'Участок первичного сортоизучения Кокинского опорного пункта, 25 км к югу от Брянска; серые лесные суглинистые почвы, pH 6,1; в зимы 2005/06 и 2007/08 мороз −17 °C при малом снеге или без него.',
     'Клубника «Соловушка» в первичном сортоизучении и наблюдении зимнего повреждения в Кокино',
     '2006', '2008',
     'Сортоизучение по методикам 1995/1999 годов; урожайность измерена в 2006–2007 годах, подмерзание оценено в 2006–2008 годах.',
     'Локальное основание рассмотреть «Соловушку» для подбора в Брянской области по урожайности и зимнему повреждению в испытанных условиях.');

INSERT INTO recommendation_rules
    (cultivar_id, region_id, conditions_json, rationale, limitations, source_id,
     review_status, reviewed_by, reviewed_at)
SELECT c.id, r.id, '{}', seed.rationale, seed.limitations, s.id,
       'verified', 'codex-source-review', '2026-09-27 23:30:00'
FROM bryansk_trial_rule_seed seed
JOIN cultivars c ON c.slug = seed.cultivar_slug AND c.editorial_status = 'published'
JOIN regions r ON r.code = 'bryansk-oblast'
JOIN sources s ON s.source_key = seed.source_key AND s.review_status = 'verified';

INSERT INTO regional_evidence
    (recommendation_id, region_id, source_id, basis_kind, source_locator,
     place_text, conditions_text, limitations_text, review_status, reviewed_by, reviewed_at)
SELECT rr.id, rr.region_id, rr.source_id, 'regional_trial', seed.source_locator,
       'Кокино, Брянская область', seed.conditions_text, seed.limitations,
       'verified', 'codex-source-review', '2026-09-27 23:30:00'
FROM bryansk_trial_rule_seed seed
JOIN cultivars c ON c.slug = seed.cultivar_slug
JOIN recommendation_rules rr ON rr.cultivar_id = c.id AND rr.rationale = seed.rationale
JOIN regions r ON r.id = rr.region_id AND r.code = 'bryansk-oblast'
JOIN sources s ON s.id = rr.source_id AND s.source_key = seed.source_key;

INSERT INTO evidence_passports
    (recommendation_id, evidence_kind, subject_description, material_type,
     setting_text, place_text, period_from, period_to, conditions_json,
     method_text, uncertainty_text, source_locator, applicability_note,
     limitations_note, review_status, reviewed_by, reviewed_at)
SELECT rr.id, 'published_study', seed.subject_description, 'Живые растения',
       'Полевое сортоизучение', 'Кокино, Брянская область',
       seed.period_from, seed.period_to, '{}', seed.method_text,
       'Перенос результата на другие участки и годы не проверен.',
       seed.source_locator, seed.applicability_note, seed.limitations,
       'verified', 'codex-source-review', '2026-09-27 23:30:00'
FROM bryansk_trial_rule_seed seed
JOIN cultivars c ON c.slug = seed.cultivar_slug
JOIN recommendation_rules rr ON rr.cultivar_id = c.id AND rr.rationale = seed.rationale
JOIN regions r ON r.id = rr.region_id AND r.code = 'bryansk-oblast'
JOIN sources s ON s.id = rr.source_id AND s.source_key = seed.source_key;

DROP TABLE bryansk_trial_rule_seed;
