-- Small source-backed reference set for the first public catalog.
-- RHS phenology describes UK conditions; these rows do not imply suitability
-- for Kaliningrad or any other Russian region.
INSERT INTO sources
    (source_key, kind, title, author_or_org, url, accessed_on, rights_note,
     review_status, reviewed_by, reviewed_at)
VALUES
    ('rhs-polka', 'website', 'Rubus idaeus Polka (F)', 'Royal Horticultural Society',
     'https://www.rhs.org.uk/plants/226503/rubus-idaeus-polka-f/details', '2026-09-24',
     'Only brief paraphrased facts and a link are used.', 'verified', 'codex-source-review', '2026-09-24 21:40:08'),
    ('rhs-joan-j', 'website', 'Rubus idaeus Joan J (F)', 'Royal Horticultural Society',
     'https://www.rhs.org.uk/plants/195937/rubus-idaeus-joan-j-f/details', '2026-09-24',
     'Only brief paraphrased facts and a link are used.', 'verified', 'codex-source-review', '2026-09-24 21:40:08'),
    ('rhs-cambridge-favourite', 'website', 'Fragaria × ananassa Cambridge Favourite (F)', 'Royal Horticultural Society',
     'https://www.rhs.org.uk/plants/69875/fragaria-%C3%97-ananassa-cambridge-favourite-f/details', '2026-09-24',
     'Only brief paraphrased facts and a link are used.', 'verified', 'codex-source-review', '2026-09-24 21:40:08'),
    ('rhs-elan', 'website', 'Fragaria × ananassa Elan (F)', 'Royal Horticultural Society',
     'https://www.rhs.org.uk/plants/191614/fragaria-%C3%97-ananassa-elan-f/details', '2026-09-24',
     'Only brief paraphrased facts and a link are used.', 'verified', 'codex-source-review', '2026-09-24 21:40:08');

INSERT INTO cultivars
    (crop_id, slug, canonical_name, scientific_name, identity_source_id,
     editorial_status, reviewed_by, reviewed_at, published_at)
VALUES
    ((SELECT id FROM crops WHERE slug='raspberry'), 'polka', 'Polka', 'Rubus idaeus Polka',
     (SELECT id FROM sources WHERE source_key='rhs-polka'), 'published', 'codex-source-review', '2026-09-24 21:40:08', '2026-09-24 21:40:08'),
    ((SELECT id FROM crops WHERE slug='raspberry'), 'joan-j', 'Joan J', 'Rubus idaeus Joan J',
     (SELECT id FROM sources WHERE source_key='rhs-joan-j'), 'published', 'codex-source-review', '2026-09-24 21:40:08', '2026-09-24 21:40:08'),
    ((SELECT id FROM crops WHERE slug='strawberry'), 'cambridge-favourite', 'Cambridge Favourite', 'Fragaria × ananassa Cambridge Favourite',
     (SELECT id FROM sources WHERE source_key='rhs-cambridge-favourite'), 'published', 'codex-source-review', '2026-09-24 21:40:08', '2026-09-24 21:40:08'),
    ((SELECT id FROM crops WHERE slug='strawberry'), 'elan', 'Elan', 'Fragaria × ananassa Elan',
     (SELECT id FROM sources WHERE source_key='rhs-elan'), 'published', 'codex-source-review', '2026-09-24 21:40:08', '2026-09-24 21:40:08');

INSERT INTO trait_observations
    (cultivar_id, trait_code, value_text, context_text, source_id,
     review_status, reviewed_by, reviewed_at)
VALUES
    ((SELECT id FROM cultivars WHERE slug='polka'), 'fruiting_cycle', 'Плодоношение на побегах текущего года',
     'Описание RHS; не региональное испытание.', (SELECT id FROM sources WHERE source_key='rhs-polka'),
     'verified', 'codex-source-review', '2026-09-24 21:40:08'),
    ((SELECT id FROM cultivars WHERE slug='joan-j'), 'fruiting_cycle', 'Осеннее плодоношение на побегах текущего года',
     'Описание RHS; не региональное испытание.', (SELECT id FROM sources WHERE source_key='rhs-joan-j'),
     'verified', 'codex-source-review', '2026-09-24 21:40:08'),
    ((SELECT id FROM cultivars WHERE slug='cambridge-favourite'), 'maturity_period', 'Средний летний срок',
     'Данные RHS для британских условий; сроки в России могут отличаться.',
     (SELECT id FROM sources WHERE source_key='rhs-cambridge-favourite'), 'verified', 'codex-source-review', '2026-09-24 21:40:08'),
    ((SELECT id FROM cultivars WHERE slug='elan'), 'fruiting_cycle', 'Повторное плодоношение',
     'Описание RHS; не региональное испытание.', (SELECT id FROM sources WHERE source_key='rhs-elan'),
     'verified', 'codex-source-review', '2026-09-24 21:40:08'),
    ((SELECT id FROM cultivars WHERE slug='elan'), 'cultivation_setting', 'Подходит для контейнера',
     'Рекомендация RHS для контейнеров и подвесных корзин.', (SELECT id FROM sources WHERE source_key='rhs-elan'),
     'verified', 'codex-source-review', '2026-09-24 21:40:08');
