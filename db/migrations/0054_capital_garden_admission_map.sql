-- D-04/W-03: complete the two missing oblast mappings. Verified against
-- the 2024 State Register, Appendix 4, printed p. 604 (PDF index 603).
-- Federal-city garden searches use these neighboring oblasts explicitly;
-- this mapping is an official admission context, not a local trial.
WITH mapped(code, admission_region_number, admission_region_name) AS (VALUES
    ('moscow-oblast', 3, 'Центральный'),
    ('leningrad-oblast', 2, 'Северо-Западный')
)
INSERT INTO admission_region_map
    (region_id, admission_region_number, admission_region_name, source_id,
     reviewed_by, reviewed_at)
SELECT r.id, mapped.admission_region_number, mapped.admission_region_name,
       s.id, 'codex-source-review', '2026-10-01 12:00:00'
FROM mapped
JOIN regions r ON r.code = mapped.code
JOIN sources s ON s.source_key = 'gsk-register-2024-region-map'
              AND s.review_status = 'verified';
