-- Extend the raspberry atlas from FNC's 2026 nursery list and seminar notes.
-- The nursery price list is used only as evidence of names and fruiting group.
INSERT INTO sources
    (source_key, kind, title, author_or_org, url, accessed_on, rights_note,
     review_status, reviewed_by, reviewed_at)
VALUES
    ('fnc-raspberry-nursery-2026', 'document', 'Цены на посадочный материал ягодных культур, весна 2026', 'ФНЦ Садоводства',
     'https://vstisp.org/vstisp/images/malina_2026.pdf', '2026-09-26',
     'Использованы только названия и разделение обычной и ремонтантной малины; цены не перенесены.', 'verified', 'codex-source-review', '2026-09-26 19:00:00'),
    ('fnc-raspberry-seminar', 'website', 'Семинар-лекторий по малине', 'ФНЦ Садоводства',
     'https://vstisp.org/vstisp/index.php/2-uncategorized/492-seminar-lektorij-po-maline', '2026-09-26',
     'Использованы названия сортов и прямое указание окраски Жёлтого гиганта.', 'verified', 'codex-source-review', '2026-09-26 19:00:00');

CREATE TEMP TABLE raspberry_nursery_seed (
    slug TEXT PRIMARY KEY, name_ru TEXT NOT NULL, source_key TEXT NOT NULL,
    fruit_color TEXT NOT NULL, fruiting TEXT NOT NULL
) STRICT;

INSERT INTO raspberry_nursery_seed VALUES
    ('poklon-kazakovu', 'Поклон Казакову', 'fnc-raspberry-nursery-2026', '', 'Ремонтантная'),
    ('podarok-kashinu', 'Подарок Кашину', 'fnc-raspberry-nursery-2026', '', 'Ремонтантная'),
    ('medvezhonok', 'Медвежонок', 'fnc-raspberry-nursery-2026', '', 'Летняя'),
    ('skromnitsa', 'Скромница', 'fnc-raspberry-nursery-2026', '', 'Летняя'),
    ('krasa-rossii', 'Краса России', 'fnc-raspberry-nursery-2026', '', 'Летняя'),
    ('balzam', 'Бальзам', 'fnc-raspberry-seminar', '', ''),
    ('zheltyy-gigant', 'Жёлтый гигант', 'fnc-raspberry-seminar', 'Жёлтая', '');

INSERT INTO cultivars
    (crop_id, slug, canonical_name, scientific_name, identity_source_id,
     editorial_status, reviewed_by, reviewed_at, published_at)
SELECT (SELECT id FROM crops WHERE slug='raspberry'), d.slug, d.name_ru, 'Rubus idaeus L.',
       s.id, 'published', 'codex-source-review', '2026-09-26 19:00:00', '2026-09-26 19:00:00'
FROM raspberry_nursery_seed d JOIN sources s ON s.source_key=d.source_key;

INSERT INTO trait_observations
    (cultivar_id, trait_code, value_text, context_text, source_id,
     review_status, reviewed_by, reviewed_at)
SELECT c.id, 'fruit_color', d.fruit_color,
       'Окраска прямо указана в источнике; региональная пригодность не установлена.',
       s.id, 'verified', 'codex-source-review', '2026-09-26 19:00:00'
FROM raspberry_nursery_seed d
JOIN cultivars c ON c.slug=d.slug
JOIN sources s ON s.source_key=d.source_key
WHERE d.fruit_color!='';

INSERT INTO trait_observations
    (cultivar_id, trait_code, value_text, context_text, source_id,
     review_status, reviewed_by, reviewed_at)
SELECT c.id, 'fruiting_cycle', d.fruiting,
       'В каталоге питомника сорт находится в разделе обычной либо ремонтантной малины; сроки по регионам не установлены.',
       s.id, 'verified', 'codex-source-review', '2026-09-26 19:00:00'
FROM raspberry_nursery_seed d
JOIN cultivars c ON c.slug=d.slug
JOIN sources s ON s.source_key=d.source_key
WHERE d.fruiting!='';

INSERT INTO trait_observations
    (cultivar_id, trait_code, value_text, context_text, source_id,
     review_status, reviewed_by, reviewed_at)
SELECT c.id, 'fruiting_cycle', 'Летняя',
       'В каталоге питомника сорт находится в разделе обычной малины; сроки по регионам не установлены.',
       s.id, 'verified', 'codex-source-review', '2026-09-26 19:00:00'
FROM cultivars c JOIN sources s ON s.source_key='fnc-raspberry-nursery-2026'
WHERE c.slug IN ('meteor', 'solnyshko', 'peresvet');

DROP TABLE raspberry_nursery_seed;
