-- The official 2024 register lists Vima Kimberli (Вима Кимберли), an
-- already verified alias of the cultivar card Кимберли, in admission zones
-- 3 and 5. This remains an official admission record, not a plot-level
-- recommendation.
WITH zones(admission_region_number) AS (VALUES (3), (5))
INSERT INTO official_admissions
    (cultivar_id, admission_region_number, registry_entry_code, admitted_year,
     edition_as_of, source_locator, source_id, review_status, reviewed_by,
     reviewed_at, source_pdf_page)
SELECT c.id, zones.admission_region_number, '9154051', 2013,
       '2024-05-31',
       'Земляника (Fragaria L.), PDF с. 414, строка 9154051 ВИМА КИМБЕРЛИ',
       s.id, 'verified', 'codex-source-review', '2026-09-27 16:00:00', 414
FROM cultivars c
JOIN sources s ON s.source_key = 'gsk-register-2024'
CROSS JOIN zones
WHERE c.slug = 'kimberli';
