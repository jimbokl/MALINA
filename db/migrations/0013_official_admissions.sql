-- A register admission is official context, not a plot-level recommendation.
-- Keep it separate from recommendation_rules and regional_evidence.
CREATE TABLE admission_region_map (
    region_id INTEGER PRIMARY KEY REFERENCES regions(id) ON DELETE RESTRICT,
    admission_region_number INTEGER NOT NULL CHECK (admission_region_number BETWEEN 1 AND 12),
    admission_region_name TEXT NOT NULL,
    source_id INTEGER NOT NULL REFERENCES sources(id) ON DELETE RESTRICT,
    reviewed_by TEXT NOT NULL,
    reviewed_at TEXT NOT NULL
) STRICT;

CREATE TABLE official_admissions (
    id INTEGER PRIMARY KEY,
    cultivar_id INTEGER NOT NULL REFERENCES cultivars(id) ON DELETE RESTRICT,
    admission_region_number INTEGER NOT NULL CHECK (admission_region_number BETWEEN 1 AND 12),
    registry_entry_code TEXT NOT NULL,
    admitted_year INTEGER NOT NULL,
    edition_as_of TEXT NOT NULL,
    source_locator TEXT NOT NULL,
    source_id INTEGER NOT NULL REFERENCES sources(id) ON DELETE RESTRICT,
    review_status TEXT NOT NULL DEFAULT 'draft'
        CHECK (review_status IN ('draft', 'verified', 'rejected')),
    reviewed_by TEXT,
    reviewed_at TEXT,
    UNIQUE (cultivar_id, admission_region_number, edition_as_of),
    CHECK (review_status != 'verified' OR
           (reviewed_by IS NOT NULL AND reviewed_at IS NOT NULL))
) STRICT;

CREATE VIEW public_admission_regions AS
SELECT r.code, r.name_ru, m.admission_region_number,
       m.admission_region_name, s.url AS map_source_url
FROM admission_region_map m
JOIN regions r ON r.id = m.region_id
JOIN sources s ON s.id = m.source_id AND s.review_status = 'verified';

CREATE VIEW public_official_admissions AS
SELECT a.id, a.cultivar_id, a.admission_region_number,
       a.registry_entry_code, a.admitted_year, a.edition_as_of,
       a.source_locator, s.title AS source_title, s.url AS source_url
FROM official_admissions a
JOIN public_cultivars c ON c.id = a.cultivar_id
JOIN sources s ON s.id = a.source_id AND s.review_status = 'verified'
WHERE a.review_status = 'verified';

INSERT INTO regions(code, name_ru) VALUES ('tula-oblast', 'Тульская область');

INSERT INTO sources
    (source_key, kind, title, author_or_org, url, reference, accessed_on,
     rights_note, review_status, reviewed_by, reviewed_at)
VALUES
    ('gsk-central-region', 'website', 'Центральный регион допуска', 'Госсорткомиссия',
     'https://gossortrf.ru/region/tsentralnyy-region-dopuska/',
     'Филиал по Калужской и Тульской областям', '2026-09-26',
     'Использованы только факт принадлежности региона и ссылка.',
     'verified', 'codex-source-review', '2026-09-26 12:00:00'),
    ('gsk-register-2024', 'document', 'Государственный реестр селекционных достижений, допущенных к использованию, 2024',
     'Госсорткомиссия',
     'https://gossortrf.ru/upload/iblock/00a/clri6obhudueqx6t1f6awcrsp6vm6psk.pdf',
     'По состоянию на 31.05.2024; Малина, печатная с. 418, код 9902171',
     '2026-09-26', 'Использованы только библиографическая ссылка и одна запись.',
     'verified', 'codex-source-review', '2026-09-26 12:00:00'),
    ('fnc-gusar', 'website', 'Гусар', 'ФНЦ Садоводства',
     'https://vstisp.org/vstisp/index.php/11-icetheme/sample-news/1448-gusar',
     'Описание сорта', '2026-09-26',
     'Использованы краткие пересказанные факты и ссылка; фотография не копируется.',
     'verified', 'codex-source-review', '2026-09-26 12:00:00');

INSERT INTO admission_region_map
    (region_id, admission_region_number, admission_region_name, source_id, reviewed_by, reviewed_at)
VALUES
    ((SELECT id FROM regions WHERE code='tula-oblast'), 3, 'Центральный',
     (SELECT id FROM sources WHERE source_key='gsk-central-region'),
     'codex-source-review', '2026-09-26 12:00:00');

INSERT INTO cultivars
    (crop_id, slug, canonical_name, scientific_name, identity_source_id,
     editorial_status, reviewed_by, reviewed_at, published_at)
VALUES
    ((SELECT id FROM crops WHERE slug='raspberry'), 'gusar', 'Гусар', 'Rubus idaeus L.',
     (SELECT id FROM sources WHERE source_key='gsk-register-2024'),
     'published', 'codex-source-review', '2026-09-26 12:00:00', '2026-09-26 12:00:00');

INSERT INTO trait_observations
    (cultivar_id, trait_code, value_text, context_text, source_id,
     review_status, reviewed_by, reviewed_at)
VALUES
    ((SELECT id FROM cultivars WHERE slug='gusar'), 'fruiting_cycle', 'Летний сорт',
     'Описание ФНЦ Садоводства; срок и результат на конкретном участке не установлены.',
     (SELECT id FROM sources WHERE source_key='fnc-gusar'),
     'verified', 'codex-source-review', '2026-09-26 12:00:00');

INSERT INTO official_admissions
    (cultivar_id, admission_region_number, registry_entry_code, admitted_year,
    edition_as_of, source_locator, source_id, review_status, reviewed_by, reviewed_at)
VALUES
    ((SELECT id FROM cultivars WHERE slug='gusar'), 3, '9902171', 1999,
     '2024-05-31', 'Малина (Rubus idaeus L.), печатная с. 418, строка 9902171 ГУСАР',
     (SELECT id FROM sources WHERE source_key='gsk-register-2024'),
     'verified', 'codex-source-review', '2026-09-26 12:00:00');
