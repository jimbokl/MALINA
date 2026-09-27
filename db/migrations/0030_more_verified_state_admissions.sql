-- Additional cultivar admissions verified against the official 2024 State
-- Register PDF. These records describe register admission, not site suitability.
UPDATE sources
SET reference = 'По состоянию на 31.05.2024; Земляника, PDF с. 414–415; Малина, PDF с. 418–419',
    rights_note = 'Использованы библиографическая ссылка и краткие сведения из записей Госреестра; текст и изображения не копировались.'
WHERE source_key = 'gsk-register-2024';

CREATE TEMP TABLE verified_admission_seed (
    cultivar_slug TEXT PRIMARY KEY,
    registry_entry_code TEXT NOT NULL,
    admitted_year INTEGER NOT NULL,
    admission_regions TEXT NOT NULL,
    source_pdf_page INTEGER NOT NULL,
    crop_label TEXT NOT NULL,
    scientific_name TEXT NOT NULL
) STRICT;

INSERT INTO verified_admission_seed VALUES
    ('bereginya', '9253565', 2012, '3', 414, 'Земляника', 'Fragaria L.'),
    ('kleri', '9463230', 2022, '6', 414, 'Земляника', 'Fragaria L.'),
    ('honey', '9359371', 2013, '2,3,5,6', 415, 'Земляника', 'Fragaria L.'),
    ('tsaritsa', '9705623', 2009, '3', 415, 'Земляника', 'Fragaria L.'),
    ('karamelka', '8757408', 2016, '*', 418, 'Малина', 'Rubus idaeus L.');

WITH zones(n) AS (VALUES (1), (2), (3), (4), (5), (6), (7), (8), (9), (10), (11), (12))
INSERT INTO official_admissions
    (cultivar_id, admission_region_number, registry_entry_code, admitted_year,
     edition_as_of, source_locator, source_id, review_status, reviewed_by,
     reviewed_at, source_pdf_page)
SELECT c.id, zones.n, seed.registry_entry_code, seed.admitted_year,
       '2024-05-31',
       seed.crop_label || ' (' || seed.scientific_name || '), PDF с. ' ||
       seed.source_pdf_page || ', строка ' || seed.registry_entry_code || ' ' ||
       c.canonical_name,
       s.id, 'verified', 'codex-source-review', '2026-09-27 15:00:00',
       seed.source_pdf_page
FROM verified_admission_seed seed
JOIN cultivars c ON c.slug = seed.cultivar_slug
JOIN sources s ON s.source_key = 'gsk-register-2024'
CROSS JOIN zones
WHERE seed.admission_regions = '*'
   OR instr(',' || seed.admission_regions || ',', ',' || zones.n || ',') > 0;

DROP TABLE verified_admission_seed;
