-- D-03/D-06: a place-bound, two-season raspberry yield observation.
-- A single farm comparison does not establish a Moscow Oblast selection rule.
INSERT INTO regions (code, name_ru)
VALUES ('moscow-oblast', 'Московская область')
ON CONFLICT(code) DO NOTHING;

INSERT INTO sources
    (source_key, kind, title, author_or_org, url, reference, accessed_on,
     rights_note, review_status, reviewed_by, reviewed_at)
VALUES
    ('mgau-volokolamsk-raspberry-comparison-2023-2024', 'document',
     'Сравнительная оценка сортов малины по урожайности ягод и экономической эффективности',
     'О. А. Лунёва, А. Ю. Меделяева, С. А. Брюхина, Ю. В. Трунов · Мичуринский ГАУ',
     'https://opusmgau.ru/index.php/see/article/download/7576/7664/',
     'Наука и Образование. 2025. Т. 8, № 2; раздел об условиях опыта, таблица 1 «Урожайность малины», строка «Золотые купола»',
     '2026-09-28',
     'Использованы отдельные численные значения и краткий пересказ методики с прямой ссылкой; текст и таблица публикации не воспроизводятся.',
     'verified', 'codex-source-review', '2026-09-28 10:00:00');

INSERT INTO trait_observations
    (cultivar_id, trait_code, value_number, unit, context_text, region_id,
     source_id, observed_on, review_status, reviewed_by, reviewed_at)
SELECT c.id, 'yield', 10.5, 'т/га',
       'КФХ «АгроЭкоИнвест», Волоколамский район: «Золотые купола» дали 10,8 т/га в 2023 году и 10,2 т/га в 2024 году; средняя за два года — 10,5 т/га.',
       r.id, s.id, '2023–2024', 'verified', 'codex-source-review', '2026-09-28 10:00:00'
FROM cultivars c
JOIN regions r ON r.code = 'moscow-oblast'
JOIN sources s ON s.source_key = 'mgau-volokolamsk-raspberry-comparison-2023-2024'
              AND s.review_status = 'verified'
WHERE c.slug = 'zolotye-kupola' AND c.editorial_status = 'published';

INSERT INTO evidence_passports
    (observation_id, evidence_kind, subject_description, material_type,
     setting_text, place_text, period_from, period_to, conditions_json,
     method_text, uncertainty_text, source_locator, applicability_note,
     limitations_note, review_status, reviewed_by, reviewed_at)
SELECT o.id, 'published_study',
       'Фактическая урожайность ремонтантной малины «Золотые купола» в сравнении трёх сортов',
       'Живые растения',
       'КФХ; сравнительное исследование ремонтантных сортов',
       'КФХ «АгроЭкоИнвест», Волоколамский район, Московская область',
       '2023', '2024', '{"comparison_control":"Бабье лето"}',
       'Авторы сравнили сорта «Августина», «Бабье лето» (контроль) и «Золотые купола» по урожайности в 2023 и 2024 годах и привели среднюю за два года; НСР05 для урожайности — 1,2 т/га в каждом году.',
       'В публикации не указаны размер делянок, число повторностей и агротехника. Хозяйство названо, но точные координаты участка не приведены.',
       'PDF, раздел «Цель исследований» и таблица 1 «Урожайность малины», строка «Золотые купола», столбцы 2023 г., 2024 г., «Среднее»',
       'Измерение относится к сравнению ремонтантных сортов в названном хозяйстве в 2023–2024 годах.',
       'Один опыт не позволяет прогнозировать урожайность на другом участке или выводить правило подбора для всей Московской области.',
       'verified', 'codex-source-review', '2026-09-28 10:00:00'
FROM trait_observations o
JOIN cultivars c ON c.id = o.cultivar_id AND c.slug = 'zolotye-kupola'
JOIN sources s ON s.id = o.source_id
              AND s.source_key = 'mgau-volokolamsk-raspberry-comparison-2023-2024'
WHERE o.trait_code = 'yield' AND o.value_number = 10.5
  AND o.unit = 'т/га' AND o.region_id = (SELECT id FROM regions WHERE code = 'moscow-oblast');
