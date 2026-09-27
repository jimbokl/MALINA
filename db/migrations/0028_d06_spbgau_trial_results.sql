-- Separate cultivar-description values (printed p. 95) from the article's
-- own trial result (printed p. 98) for Karamelka and Samohval.
UPDATE evidence_passports
SET evidence_kind = 'reference_document',
    setting_text = 'Сортовое описание в исследовательской публикации',
    place_text = NULL,
    period_from = NULL,
    period_to = NULL,
    applicability_note = 'Значения относятся к сортовому описанию на печатной странице 95, а не к результату опыта этой статьи.',
    limitations_note = 'В абзаце сортового описания не указаны место и условия, при которых получены значения.'
WHERE observation_id IN (
    SELECT o.id
    FROM trait_observations o
    JOIN cultivars c ON c.id = o.cultivar_id
    JOIN sources s ON s.id = o.source_id
    WHERE c.slug IN ('karamelka', 'samohval')
      AND o.trait_code = 'berry_weight_g'
      AND s.source_key = 'spbgau-remontant-leningrad-2022'
      AND o.context_text LIKE 'Средняя масса ягоды%'
);

-- The results section on printed p. 98 reports measured study means separately.
WITH facts(slug, value_number, context_text) AS (VALUES
    ('karamelka', 4.0, 'В результатах исследования средняя масса ягоды сорта Карамелька составила 4,0 г.'),
    ('samohval', 3.9, 'В результатах исследования средняя масса ягоды сорта Самохвал составила 3,9 г.')
)
INSERT INTO trait_observations
    (cultivar_id, trait_code, value_text, value_number, value_max, unit,
     context_text, region_id, source_id, observed_on, review_status, reviewed_by, reviewed_at)
SELECT c.id, 'berry_weight_g', NULL, facts.value_number, NULL, 'г', facts.context_text,
       NULL, s.id, NULL, 'verified', 'codex-source-review', '2026-09-27 12:00:00'
FROM facts
JOIN cultivars c ON c.slug = facts.slug
JOIN sources s ON s.source_key = 'spbgau-remontant-leningrad-2022';

INSERT INTO evidence_passports
    (observation_id, evidence_kind, subject_description, material_type, material_stage,
     setting_text, place_text, period_from, period_to, conditions_json, method_text,
     sample_size, uncertainty_text, source_locator, applicability_note, limitations_note,
     review_status, reviewed_by, reviewed_at)
SELECT o.id, 'published_study',
       'Средняя масса ягод сорта ' || c.canonical_name,
       'ягоды малины', NULL,
       'Коллекционные посадки, описанные в статье', 'Ленинградская область', NULL, NULL, '{}',
       'В статье приведено среднее значение; способ измерения и число учтённых ягод рядом с результатом не указаны.',
       NULL, NULL,
       'Печатная с. 98, абзац о средней массе ягод сортов «Самохвал» и «Карамелька»',
       'Среднее значение приведено в результатах исследования ремонтантной малины в Ленинградской области.',
       'Результат относится к описанным в статье коллекционным посадкам. На странице 95 отдельно приведены сортовые описания с другими значениями.',
       'verified', 'codex-source-review', '2026-09-27 12:00:00'
FROM trait_observations o
JOIN cultivars c ON c.id = o.cultivar_id
JOIN sources s ON s.id = o.source_id
WHERE c.slug IN ('karamelka', 'samohval')
  AND o.trait_code = 'berry_weight_g'
  AND s.source_key = 'spbgau-remontant-leningrad-2022'
  AND o.context_text LIKE 'В результатах исследования средняя масса ягоды%';
