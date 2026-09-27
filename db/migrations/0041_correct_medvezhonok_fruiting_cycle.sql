-- Keep the nursery grouping for audit, but publish the directly verified trial classification.
UPDATE trait_observations
SET review_status='rejected', reviewed_by='codex-source-review',
    reviewed_at='2026-09-27 22:00:00'
WHERE cultivar_id=(SELECT id FROM cultivars WHERE slug='medvezhonok')
  AND trait_code='fruiting_cycle' AND value_text='Летняя'
  AND source_id=(SELECT id FROM sources WHERE source_key='fnc-raspberry-nursery-2026');

INSERT INTO trait_observations
    (cultivar_id, trait_code, value_text, context_text, source_id,
     review_status, reviewed_by, reviewed_at)
SELECT c.id, 'fruiting_cycle', 'Ремонтантная',
       'Сорт Медвежонок описан в сортоиспытании как ремонтантный.', s.id,
       'verified', 'codex-source-review', '2026-09-27 22:00:00'
FROM cultivars c JOIN sources s ON s.source_key='raspberry-kokino-trial-2020-2023'
WHERE c.slug='medvezhonok';

INSERT INTO evidence_passports
    (observation_id, evidence_kind, subject_description, setting_text, place_text,
     period_from, period_to, conditions_json, method_text, source_locator,
     applicability_note, limitations_note, review_status, reviewed_by, reviewed_at)
SELECT o.id, 'published_study', 'Тип плодоношения сорта Медвежонок',
       'Сравнительное сортоизучение новых ремонтантных сортов малины',
       'Кокино, Брянская область', '2020', '2023', '{}',
       'Классификация сорта в исследовании и Государственном реестре.',
       'Аннотация; таблица 1; описание сорта Медвежонок',
       'Классификация относится к сорту в указанном исследовании.',
       'Условия опыта не задают сроки плодоношения для других регионов.',
       'verified', 'codex-source-review', '2026-09-27 22:00:00'
FROM trait_observations o
JOIN cultivars c ON c.id=o.cultivar_id
JOIN sources s ON s.id=o.source_id
WHERE c.slug='medvezhonok' AND o.trait_code='fruiting_cycle'
  AND o.value_text='Ремонтантная'
  AND o.context_text='Сорт Медвежонок описан в сортоиспытании как ремонтантный.'
  AND s.source_key='raspberry-kokino-trial-2020-2023';
