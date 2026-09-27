-- D-03/D-04: a narrowly scoped Leningrad Oblast rule from a Gatchina field
-- trial, plus a strawberry field result whose exact administrative location
-- is not specified in the primary paper. The latter is not a regional rule.

INSERT INTO regions (code, name_ru)
VALUES ('leningrad-oblast', 'Ленинградская область')
ON CONFLICT(code) DO NOTHING;

INSERT INTO sources
    (source_key, kind, title, author_or_org, url, reference, accessed_on,
     rights_note, review_status, reviewed_by, reviewed_at)
VALUES
    ('spbgau-strawberry-comparison-2014', 'document',
     'Сравнительная оценка сортов земляники садовой в условиях Ленинградской области',
     'Н. А. Савенок · Санкт-Петербургский государственный аграрный университет',
     'https://spbgau.ru/upload/iblock/bd6/em35bb3yd3bo1v6yzmsm3k0qotvtfew0.pdf',
     'Известия СПбГАУ, 2016, № 45, с. 30–35; опыт 2014 года, учебно-опытный сад СПбГАУ',
     '2026-09-27',
     'Использованы пересказ измеренного результата и библиографическая ссылка; текст и изображения не воспроизводятся.',
     'verified', 'codex-source-review', '2026-09-27 08:35:00');

-- The authors report 90% ripe berries and 5.2 t/ha actual yield for
-- Samohval in 2021 (printed p. 97, table 4; p. 98, discussion). This supports
-- consideration of the cultivar near the trial, not a yield forecast.
INSERT INTO recommendation_rules
    (cultivar_id, region_id, conditions_json, rationale, limitations, source_id,
     review_status, reviewed_by, reviewed_at)
SELECT c.id, r.id, '{}',
       'В опыте Гатчинского района у «Самохвала» в 2021 году вызрело 90% ягод; фактическая урожайность составила 5,2 т/га. Это местное основание рассмотреть сорт для выращивания в Ленинградской области.',
       'Измерения получены в одном хозяйстве и одном сезоне на побегах текущего года. Условия и погода другого участка могут изменить долю вызревших ягод и урожайность.',
       s.id, 'verified', 'codex-source-review', '2026-09-27 08:35:00'
FROM cultivars c
JOIN regions r ON r.code = 'leningrad-oblast'
JOIN sources s ON s.source_key = 'spbgau-remontant-leningrad-2022'
WHERE c.slug = 'samohval' AND c.editorial_status = 'published'
  AND s.review_status = 'verified';

INSERT INTO regional_evidence
    (recommendation_id, region_id, source_id, basis_kind, source_locator,
     place_text, conditions_text, limitations_text, review_status, reviewed_by, reviewed_at)
SELECT rr.id, rr.region_id, rr.source_id, 'regional_trial',
       'Печатная с. 95, «Материалы и методы»; с. 97, таблица 4, строка «Самохвал», 2021 г.; с. 98, обсуждение результатов',
       'Хозяйство в Гатчинском районе Ленинградской области',
       'Посадки весны 2019 года на дерново-подзолистой супесчаной/суглинистой почве; ровный участок; схема 1,5 × 0,7 м; отдельные кусты, корневые отпрыски удаляли; учёт плодоношения на однолетних побегах.',
       rr.limitations, 'verified', 'codex-source-review', '2026-09-27 08:35:00'
FROM recommendation_rules rr
JOIN cultivars c ON c.id = rr.cultivar_id AND c.slug = 'samohval'
JOIN regions r ON r.id = rr.region_id AND r.code = 'leningrad-oblast'
JOIN sources s ON s.id = rr.source_id AND s.source_key = 'spbgau-remontant-leningrad-2022';

INSERT INTO evidence_passports
    (recommendation_id, evidence_kind, subject_description, material_type,
     setting_text, place_text, period_from, period_to, conditions_json,
     method_text, uncertainty_text, source_locator, applicability_note,
     limitations_note, review_status, reviewed_by, reviewed_at)
SELECT rr.id, 'published_study',
       'Ремонтантная малина «Самохвал» в сравнительном полевом опыте',
       'Живые растения', 'Полевое сортоизучение в хозяйстве',
       'Гатчинский район, Ленинградская область', '2019', '2021', '{}',
       'Сравнение «Самохвала», «Карамельки» и «Малиновой гряды»; по урожаю и доле вызревших ягод использован результат сезона 2021 года.',
       'Для выбранного результата опубликован один сезон 2021 года; перенос на другие хозяйства отдельно не проверен.',
       'Печатная с. 95, «Материалы и методы»; с. 97, таблица 4; с. 98, обсуждение',
       'Локальное основание рассмотреть «Самохвал» в Ленинградской области при сопоставимых условиях выращивания.',
       rr.limitations, 'verified', 'codex-source-review', '2026-09-27 08:35:00'
FROM recommendation_rules rr
JOIN cultivars c ON c.id = rr.cultivar_id AND c.slug = 'samohval'
JOIN regions r ON r.id = rr.region_id AND r.code = 'leningrad-oblast'
JOIN sources s ON s.id = rr.source_id AND s.source_key = 'spbgau-remontant-leningrad-2022';

-- One-year measured yield in the named SPbGAU teaching orchard. The article
-- calls the setting "conditions of Leningrad Oblast" but does not give an
-- administrative address for the orchard, so region_id remains NULL.
INSERT INTO trait_observations
    (cultivar_id, trait_code, value_number, unit, context_text, region_id,
     source_id, observed_on, review_status, reviewed_by, reviewed_at)
SELECT c.id, 'yield', 18.0, 'т/га',
       'Фактическая урожайность «Берегини» в учебно-опытном саду СПбГАУ в 2014 году составила 18,0 т/га против 8,5 т/га у контрольной «Сударушки».',
       NULL, s.id, '2014', 'verified', 'codex-source-review', '2026-09-27 08:35:00'
FROM cultivars c
JOIN sources s ON s.source_key = 'spbgau-strawberry-comparison-2014'
WHERE c.slug = 'bereginya' AND c.editorial_status = 'published';

INSERT INTO evidence_passports
    (observation_id, evidence_kind, subject_description, material_type,
     setting_text, place_text, period_from, period_to, conditions_json,
     method_text, uncertainty_text, source_locator, applicability_note,
     limitations_note, review_status, reviewed_by, reviewed_at)
SELECT o.id, 'published_study',
       'Фактическая урожайность клубники «Берегиня» в опыте 2014 года',
       'Живые растения', 'Полевое сравнение семи сортов в трёх повторностях',
       'Учебно-опытный сад СПбГАУ; административный адрес участка не указан',
       '2014', '2014', '{}',
       'Дерново-подзолистая почва без орошения; рандомизированное размещение; 70 см между рядами и 30 см между растениями; контроль — «Сударушка».',
       'Публикация описывает один сезон; точный административный адрес сада не приведён.',
       'Печатные с. 30–31, методика; с. 33, таблица 1; с. 34, таблица 2, строка «Берегиня»',
       'Показатель относится к месту и агротехнике опыта 2014 года.',
       'Не является прогнозом урожайности для Ленинградской области или любого другого региона; региональное правило из этой записи не создаётся.',
       'verified', 'codex-source-review', '2026-09-27 08:35:00'
FROM trait_observations o
JOIN cultivars c ON c.id = o.cultivar_id AND c.slug = 'bereginya'
JOIN sources s ON s.id = o.source_id AND s.source_key = 'spbgau-strawberry-comparison-2014'
WHERE o.trait_code = 'yield' AND o.observed_on = '2014';
