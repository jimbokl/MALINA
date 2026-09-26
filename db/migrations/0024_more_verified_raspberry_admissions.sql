-- Additional Rubus idaeus entries in the official 2024 State Register,
-- printed pp. 418–419. Admission is distinct from a plot recommendation.
CREATE TEMP TABLE raspberry_admission_seed (
    slug TEXT PRIMARY KEY,
    registry_entry_code TEXT NOT NULL,
    admitted_year INTEGER NOT NULL,
    admission_regions TEXT NOT NULL,
    source_pdf_page INTEGER NOT NULL
) STRICT;

INSERT INTO raspberry_admission_seed VALUES
    ('abrikosovaya', '9908145', 2004, '3', 418),
    ('balzam', '8204616', 1993, '2,3,4,5,6,7,10,11', 418),
    ('bryanskoe-divo', '9252133', 2008, '*', 418),
    ('evraziya', '9464191', 2008, '*', 418),
    ('zhar-ptitsa', '9252128', 2008, '*', 418),
    ('zhuravlik', '8903751', 2001, '4,6,7', 418),
    ('medvezhonok', '8262601', 2023, '3', 419),
    ('podarok-kashinu', '8653725', 2017, '*', 419),
    ('poklon-kazakovu', '8757396', 2017, '*', 419),
    ('rubinovoe-ozherele', '9464193', 2008, '*', 419),
    ('skromnitsa', '8204594', 1992, '2,3,4,5,6,7,10', 419),
    ('solnyshko', '7906838', 1992, '3,4,6', 419);

WITH zones(n) AS (VALUES (1), (2), (3), (4), (5), (6), (7), (8), (9), (10), (11), (12))
INSERT INTO official_admissions
    (cultivar_id, admission_region_number, registry_entry_code, admitted_year,
     edition_as_of, source_locator, source_id, review_status, reviewed_by,
     reviewed_at, source_pdf_page)
SELECT c.id, zones.n, seed.registry_entry_code, seed.admitted_year,
       '2024-05-31',
       'Малина (Rubus idaeus L.), печатная с. ' || seed.source_pdf_page ||
       ', строка ' || seed.registry_entry_code || ' ' || c.canonical_name,
       s.id, 'verified', 'codex-source-review', '2026-09-26 20:00:00',
       seed.source_pdf_page
FROM raspberry_admission_seed seed
JOIN cultivars c ON c.slug = seed.slug
JOIN sources s ON s.source_key = 'gsk-register-2024'
CROSS JOIN zones
WHERE seed.admission_regions = '*'
   OR instr(',' || seed.admission_regions || ',', ',' || zones.n || ',') > 0;

DROP TABLE raspberry_admission_seed;
