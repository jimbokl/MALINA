-- D-04: local strawberry field evidence east of Orenburg. The same primary
-- study supplied cultivar observations in 0039; here its documented trial
-- location supports one narrowly scoped regional selection rule.

INSERT INTO recommendation_rules
    (cultivar_id, region_id, conditions_json, rationale, limitations, source_id,
     review_status, reviewed_by, reviewed_at)
SELECT c.id, r.id, '{}',
       'На опытном участке возле Оренбурга у «Деснянки Кокинской» средняя степень подмерзания за 2020–2021 годы составила 1,3 балла, урожайность — 9,4 т/га. Местные результаты дают основание рассмотреть сорт для выращивания в Оренбургской области.',
       'Опыт проведён на одном участке в течение двух сезонов; результаты на других почвах и при другой агротехнике отдельно не проверены.',
       s.id, 'verified', 'codex-source-review', '2026-09-27 10:00:00'
FROM cultivars c
JOIN regions r ON r.code = 'orenburg-oblast'
JOIN sources s ON s.source_key = 'strawberry-orenburg-trial-2020-2021'
WHERE c.slug = 'desnyanka-kokinskaya' AND c.editorial_status = 'published'
  AND s.review_status = 'verified';

INSERT INTO regional_evidence
    (recommendation_id, region_id, source_id, basis_kind, source_locator,
     place_text, conditions_text, limitations_text, review_status, reviewed_by, reviewed_at)
SELECT rr.id, rr.region_id, rr.source_id, 'regional_trial',
       'PDF с. 4, «Материалы и методика исследования»; с. 5, таблица 1; с. 9, таблица 5 и вывод',
       'Опытный участок Оренбургского филиала ФНЦ Садоводства, в 4 км восточнее окраины Оренбурга, Оренбургская область',
       'Полевое изучение 15 сортов в 2020–2021 годах; участок на второй надпойменной террасе Урала, в 6 км от реки; маломощный смытый легкосуглинистый южный чернозём. Зимой 2020/21 отмечались морозы до −20,2 °C при отсутствии снега; вегетационный период 2021 года был засушливым.',
       rr.limitations, 'verified', 'codex-source-review', '2026-09-27 10:00:00'
FROM recommendation_rules rr
JOIN cultivars c ON c.id = rr.cultivar_id AND c.slug = 'desnyanka-kokinskaya'
JOIN regions r ON r.id = rr.region_id AND r.code = 'orenburg-oblast'
JOIN sources s ON s.id = rr.source_id
    AND s.source_key = 'strawberry-orenburg-trial-2020-2021';

INSERT INTO evidence_passports
    (recommendation_id, evidence_kind, subject_description, material_type,
     setting_text, place_text, period_from, period_to, conditions_json,
     method_text, uncertainty_text, source_locator, applicability_note,
     limitations_note, review_status, reviewed_by, reviewed_at)
SELECT rr.id, 'published_study',
       'Клубника «Деснянка Кокинская»: подмерзание и урожайность в Оренбургском полевом опыте',
       'Живые растения', 'Коллекционное полевое сравнение 15 сортов',
       'В 4 км восточнее окраины Оренбурга, Оренбургская область',
       '2020', '2021', '{}',
       'Оценка степени подмерзания в начале вегетации и учёт урожайности по двум годам. У «Деснянки Кокинской» подмерзание 1,0 и 1,5 балла, урожайность 10,8 и 8,0 т/га соответственно; средние 1,3 балла и 9,4 т/га.',
       'Два года и одна площадка; сорт изучался также как материал для селекции, а не в промышленном производственном испытании.',
       'PDF с. 4, описание места и методики; с. 5, таблица 1; с. 9, таблица 5 и вывод',
       'Локальное основание рассмотреть сорт в Оренбургской области при сопоставимых условиях выращивания.',
       rr.limitations, 'verified', 'codex-source-review', '2026-09-27 10:00:00'
FROM recommendation_rules rr
JOIN cultivars c ON c.id = rr.cultivar_id AND c.slug = 'desnyanka-kokinskaya'
JOIN regions r ON r.id = rr.region_id AND r.code = 'orenburg-oblast'
JOIN sources s ON s.id = rr.source_id
    AND s.source_key = 'strawberry-orenburg-trial-2020-2021';
