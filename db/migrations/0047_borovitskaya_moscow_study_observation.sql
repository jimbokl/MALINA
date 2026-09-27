-- D-03/D-04/D-06: a third cultivar result from the VNIISPK strawberry study.
-- The source names Moscow Oblast in its title, but gives no plot address or
-- cultivar-specific harvest years for this value. Keep it as an unlocated
-- observation; do not infer a regional selection rule or admission.
INSERT INTO trait_observations
    (cultivar_id, trait_code, value_number, unit, context_text, region_id,
     source_id, observed_on, review_status, reviewed_by, reviewed_at)
SELECT c.id, 'yield', 140.0, 'ц/га',
       'В исследовании 60 сортов ВНИИСПК «Боровицкая» названа среди десяти сортов с наибольшей фактической урожайностью: 140 ц/га в среднем за два года плодоношения. В статье не приведены отдельные годовые значения для этого сорта.',
       NULL, s.id, NULL, 'verified', 'codex-source-review', '2026-09-27 11:30:00'
FROM cultivars c
JOIN sources s ON s.source_key = 'vniispk-strawberry-moscow-comparison-2006-2007'
              AND s.review_status = 'verified'
WHERE c.slug = 'borovitskaya' AND c.editorial_status = 'published';

INSERT INTO evidence_passports
    (observation_id, evidence_kind, subject_description, material_type,
     setting_text, place_text, period_from, period_to, conditions_json,
     method_text, uncertainty_text, source_locator, applicability_note,
     limitations_note, review_status, reviewed_by, reviewed_at)
SELECT o.id, 'published_study',
       'Фактическая урожайность клубники «Боровицкая» в двухлетнем среднем ВНИИСПК',
       'Живые растения',
       'Сортоизучение 60 сортов в 2004–2007 годах; традиционная технология выращивания',
       'Московская область указана в заголовке публикации; точный участок не назван',
       NULL, NULL, '{}',
       'Взята опубликованная фактическая урожайность, усреднённая автором за два года плодоношения; исследование проводилось по названным в статье программам сортоизучения.',
       'Для «Боровицкой» не приведены отдельные годовые значения и точные годы двухлетнего среднего, число повторностей и адрес участка.',
       'Абзац «Фактическая урожайность лучших сортов...» непосредственно перед таблицей «Урожайность и качество ягод сортов земляники (посадки 2004 г.)»',
       'Число описывает результат «Боровицкой» в опубликованном опыте; его можно читать рядом с другими измерениями этой публикации, не приравнивая условия разных садов.',
       'Среднее значение не задаёт ожидаемую урожайность для конкретного сада и не обосновывает правило подбора для Московской области или Москвы.',
       'verified', 'codex-source-review', '2026-09-27 11:30:00'
FROM trait_observations o
JOIN cultivars c ON c.id = o.cultivar_id AND c.slug = 'borovitskaya'
JOIN sources s ON s.id = o.source_id
              AND s.source_key = 'vniispk-strawberry-moscow-comparison-2006-2007'
WHERE o.trait_code = 'yield' AND o.value_number = 140.0 AND o.unit = 'ц/га'
  AND o.observed_on IS NULL;
