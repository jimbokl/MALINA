-- 2024 State Register, raspberry section, printed pp. 418–419.
-- The asterisk in the register means admission in every cultivation region.
-- These are official admissions, not plot-level recommendations.
CREATE TEMP TABLE raspberry_admission_seed (
    slug TEXT PRIMARY KEY,
    registry_entry_code TEXT NOT NULL,
    admitted_year INTEGER NOT NULL,
    admission_regions TEXT NOT NULL,
    source_pdf_page INTEGER NOT NULL,
    printed_page INTEGER NOT NULL
) STRICT;

INSERT INTO raspberry_admission_seed VALUES
    ('atlant', '8953095', 2015, '*', 418, 418),
    ('gerakl', '9908143', 2004, '3', 418, 418),
    ('beglyanka', '9811541', 2009, '3', 418, 418),
    ('zheltyy-gigant', '9811279', 2008, '2', 418, 418),
    ('zolotaya-osen', '9553579', 2008, '*', 418, 418),
    ('zolotye-kupola', '9705625', 2005, '3', 418, 418),
    ('meteor', '7905084', 1993, '1,2,3,4,5,7', 419, 419),
    ('peresvet', '9800409', 2000, '3,4', 419, 419),
    ('oranzhevoe-chudo', '9154807', 2009, '*', 419, 419),
    ('pingvin', '9253046', 2009, '*', 419, 419);

WITH zones(n) AS (VALUES (1), (2), (3), (4), (5), (6), (7), (8), (9), (10), (11), (12))
INSERT INTO official_admissions
    (cultivar_id, admission_region_number, registry_entry_code, admitted_year,
     edition_as_of, source_locator, source_id, review_status, reviewed_by,
     reviewed_at, source_pdf_page)
SELECT c.id, zones.n, seed.registry_entry_code, seed.admitted_year,
       '2024-05-31',
       'Малина (Rubus idaeus L.), печатная с. ' || seed.printed_page ||
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

-- Appendix 4, printed p. 604: the source uses the earlier short subject names.
-- The region names here match the current city directory labels.
INSERT INTO regions(code, name_ru) VALUES
    ('kemerovo-oblast', 'Кемеровская область — Кузбасс'),
    ('khanty-mansi-ao', 'Ханты-Мансийский автономный округ — Югра')
ON CONFLICT(code) DO NOTHING;

WITH mapped(code) AS (VALUES ('kemerovo-oblast'), ('khanty-mansi-ao'))
INSERT INTO admission_region_map
    (region_id, admission_region_number, admission_region_name, source_id,
     reviewed_by, reviewed_at)
SELECT r.id, 10, 'Западно-Сибирский', s.id,
       'codex-source-review', '2026-09-26 20:00:00'
FROM mapped
JOIN regions r ON r.code = mapped.code
JOIN sources s ON s.source_key = 'gsk-register-2024-region-map';
