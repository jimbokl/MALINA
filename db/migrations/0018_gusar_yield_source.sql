-- The originator's cultivar description reports a yield range but does not
-- specify the trial site, years, sample size, or method. It is not a city rule.
INSERT INTO trait_observations
    (cultivar_id, trait_code, value_number, value_max, unit, context_text,
     source_id, review_status, reviewed_by, reviewed_at)
VALUES
    ((SELECT id FROM cultivars WHERE slug = 'gusar'), 'yield', 7, 9, 'т/га',
     'Диапазон из описания ФНЦ Садоводства; место, годы и метод измерения не указаны. Это не прогноз урожая на конкретном участке.',
     (SELECT id FROM sources WHERE source_key = 'fnc-gusar'),
     'verified', 'codex-source-review', '2026-09-26 12:00:00');

INSERT INTO evidence_passports
    (observation_id, evidence_kind, subject_description, setting_text,
     conditions_json, method_text, uncertainty_text, source_locator,
     applicability_note, limitations_note, review_status, reviewed_by, reviewed_at)
VALUES
    ((SELECT o.id FROM trait_observations o
      JOIN cultivars c ON c.id = o.cultivar_id
      WHERE c.slug = 'gusar' AND o.trait_code = 'yield'),
     'reference_document', 'Сорт Гусар в описании ФНЦ Садоводства',
     'Условия выращивания и измерения в карточке не описаны', '{}',
     'Не указан в карточке сорта',
     'Не указаны годы, место, число растений и разброс результатов',
     'Абзац описания сорта «Гусар», предложение об урожайности',
     'Подтверждает, какой диапазон урожайности приводит ФНЦ Садоводства',
     'Не доказывает урожайность в конкретном регионе России или на отдельном участке',
     'verified', 'codex-source-review', '2026-09-26 12:00:00');
