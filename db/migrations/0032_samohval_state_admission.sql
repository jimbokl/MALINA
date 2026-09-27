-- The official 2024 State Register lists Samohval as admitted in all regions.
-- The asterisk is represented as explicit region rows; this is not a
-- plot-level recommendation.
WITH zones(admission_region_number) AS (
    VALUES (1), (2), (3), (4), (5), (6), (7), (8), (9), (10), (11), (12)
)
INSERT INTO official_admissions
    (cultivar_id, admission_region_number, registry_entry_code, admitted_year,
     edition_as_of, source_locator, source_id, review_status, reviewed_by,
     reviewed_at, source_pdf_page)
SELECT c.id, zones.admission_region_number, '8456205', 2019,
       '2024-05-31',
       'Малина (Rubus idaeus L.), PDF с. 419, строка 8456205 САМОХВАЛ',
       s.id, 'verified', 'codex-source-review', '2026-09-27 17:00:00', 419
FROM cultivars c
JOIN sources s ON s.source_key = 'gsk-register-2024'
CROSS JOIN zones
WHERE c.slug = 'samohval';
