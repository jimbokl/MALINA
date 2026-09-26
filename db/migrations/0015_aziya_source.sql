-- Geoplant Vivai describes Asia NF421 in its Italian production context.
-- These observations do not establish performance or suitability in Russia.
INSERT INTO sources
    (source_key, kind, title, author_or_org, url, accessed_on, rights_note,
     review_status, reviewed_by, reviewed_at)
VALUES
    ('geoplant-asia-nf421', 'website', 'Asia NF421', 'Geoplant Vivai',
     'https://geoplantvivai.com/fragola-asia-nf421/', '2026-09-26',
     'Brief paraphrased facts and a link only; source photographs are not reused.',
     'verified', 'codex-source-review', '2026-09-26 00:00:00');

INSERT INTO cultivars
    (crop_id, slug, canonical_name, scientific_name, identity_source_id,
     editorial_status, reviewed_by, reviewed_at, published_at)
VALUES
    ((SELECT id FROM crops WHERE slug='strawberry'), 'aziya', 'Азия',
     'Fragaria × ananassa Asia NF421',
     (SELECT id FROM sources WHERE source_key='geoplant-asia-nf421'),
     'published', 'codex-source-review', '2026-09-26 00:00:00', '2026-09-26 00:00:00');

INSERT INTO trait_observations
    (cultivar_id, trait_code, value_text, context_text, source_id,
     review_status, reviewed_by, reviewed_at)
VALUES
    ((SELECT id FROM cultivars WHERE slug='aziya'), 'maturity_period', 'Среднеранний срок',
     'Описание питомника Geoplant Vivai для своих условий; сроки по регионам России не установлены.',
     (SELECT id FROM sources WHERE source_key='geoplant-asia-nf421'),
     'verified', 'codex-source-review', '2026-09-26 00:00:00'),
    ((SELECT id FROM cultivars WHERE slug='aziya'), 'disease_resistance', 'Чувствителен к мучнистой росе',
     'Указано питомником; это не результат испытаний в регионах России.',
     (SELECT id FROM sources WHERE source_key='geoplant-asia-nf421'),
     'verified', 'codex-source-review', '2026-09-26 00:00:00');
