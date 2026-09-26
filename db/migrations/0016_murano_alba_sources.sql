-- Breeder/nursery descriptions are scoped to their original growing conditions.
-- No Russian regional recommendation or numeric yield is inferred here.
INSERT INTO sources
    (source_key, kind, title, author_or_org, url, accessed_on, rights_note,
     review_status, reviewed_by, reviewed_at)
VALUES
    ('civ-murano-technical', 'document', 'Murano technical sheet', 'CIV',
     'https://civ.it/wp-content/uploads/2025/01/Murano_EN.pdf', '2026-09-26',
     'Brief paraphrased facts and a link only; source photographs are not reused.',
     'verified', 'codex-source-review', '2026-09-26 00:00:00'),
    ('geoplant-alba-nf311', 'website', 'Alba NF311', 'Geoplant Vivai',
     'https://geoplantvivai.com/en/alba-strawberry-plants/', '2026-09-26',
     'Brief paraphrased facts and a link only; source photographs are not reused.',
     'verified', 'codex-source-review', '2026-09-26 00:00:00');

INSERT INTO cultivars
    (crop_id, slug, canonical_name, scientific_name, identity_source_id,
     editorial_status, reviewed_by, reviewed_at, published_at)
VALUES
    ((SELECT id FROM crops WHERE slug='strawberry'), 'murano', 'Мурано',
     'Fragaria × ananassa Murano',
     (SELECT id FROM sources WHERE source_key='civ-murano-technical'),
     'published', 'codex-source-review', '2026-09-26 00:00:00', '2026-09-26 00:00:00'),
    ((SELECT id FROM crops WHERE slug='strawberry'), 'alba', 'Альба',
     'Fragaria × ananassa Alba NF311',
     (SELECT id FROM sources WHERE source_key='geoplant-alba-nf311'),
     'published', 'codex-source-review', '2026-09-26 00:00:00', '2026-09-26 00:00:00');

INSERT INTO trait_observations
    (cultivar_id, trait_code, value_text, context_text, source_id,
     review_status, reviewed_by, reviewed_at)
VALUES
    ((SELECT id FROM cultivars WHERE slug='murano'), 'fruiting_cycle', 'Повторное плодоношение',
     'Техническое описание CIV для исходных условий; продолжительность сбора в России не установлена.',
     (SELECT id FROM sources WHERE source_key='civ-murano-technical'),
     'verified', 'codex-source-review', '2026-09-26 00:00:00'),
    ((SELECT id FROM cultivars WHERE slug='murano'), 'cultivation_setting', 'Высокая потребность в холодном периоде',
     'Формулировка технического описания CIV; применимость к регионам России не оценена.',
     (SELECT id FROM sources WHERE source_key='civ-murano-technical'),
     'verified', 'codex-source-review', '2026-09-26 00:00:00'),
    ((SELECT id FROM cultivars WHERE slug='alba'), 'maturity_period', 'Ранний сбор',
     'Наблюдение итальянского питомника Geoplant Vivai; календарные сроки для России не установлены.',
     (SELECT id FROM sources WHERE source_key='geoplant-alba-nf311'),
     'verified', 'codex-source-review', '2026-09-26 00:00:00'),
    ((SELECT id FROM cultivars WHERE slug='alba'), 'cultivation_setting', 'Хорошо дренированная почва',
     'Рекомендация питомника Geoplant Vivai; пригодность для регионов России не подтверждена.',
     (SELECT id FROM sources WHERE source_key='geoplant-alba-nf311'),
     'verified', 'codex-source-review', '2026-09-26 00:00:00');
