-- D-06: first reviewed passports for two existing RHS descriptions.
-- RHS is a horticultural reference, not a local trial or measured sample.
INSERT INTO evidence_passports
    (observation_id, evidence_kind, subject_description, setting_text,
     conditions_json, uncertainty_text, source_locator, applicability_note,
     limitations_note, review_status, reviewed_by, reviewed_at)
VALUES
    ((SELECT o.id FROM trait_observations o
      JOIN cultivars c ON c.id = o.cultivar_id
      WHERE c.slug = 'polka' AND o.trait_code = 'fruiting_cycle'),
     'reference_document', 'Сорт Polka в справочной карточке RHS',
     'Описание RHS; метод и условия измерения не приведены', '{}',
     'Число растений и разброс результата в карточке не указаны',
     'RHS Plant Profile / introductory description',
     'Подтверждает описание типа плодоношения у RHS',
     'Не подтверждает сроки, урожайность и пригодность для регионов России',
     'verified', 'codex-source-review', '2026-09-26 12:00:00'),
    ((SELECT o.id FROM trait_observations o
      JOIN cultivars c ON c.id = o.cultivar_id
      WHERE c.slug = 'elan' AND o.trait_code = 'cultivation_setting'),
     'reference_document', 'Сорт Elan в справочной карточке RHS',
     'Описание RHS; метод и условия измерения не приведены', '{}',
     'Число растений и разброс результата в карточке не указаны',
     'RHS Plant Profile / introductory description',
     'Подтверждает упоминание контейнеров и подвесных корзин у RHS',
     'Не подтверждает результат выращивания в конкретном климате России',
     'verified', 'codex-source-review', '2026-09-26 12:00:00');
