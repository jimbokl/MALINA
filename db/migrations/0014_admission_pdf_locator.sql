-- The printed register page and one-based PDF page are different.
ALTER TABLE official_admissions
ADD COLUMN source_pdf_page INTEGER CHECK (source_pdf_page IS NULL OR source_pdf_page > 0);

UPDATE sources
SET reference = 'По состоянию на 31.05.2024; Малина, печатная с. 419, PDF с. 418, код 9902171'
WHERE source_key = 'gsk-register-2024';

UPDATE official_admissions
SET source_locator = 'Малина (Rubus idaeus L.), печатная с. 419, строка 9902171 ГУСАР',
    source_pdf_page = 418
WHERE registry_entry_code = '9902171' AND edition_as_of = '2024-05-31';

DROP VIEW public_official_admissions;
CREATE VIEW public_official_admissions AS
SELECT a.id, a.cultivar_id, a.admission_region_number,
       a.registry_entry_code, a.admitted_year, a.edition_as_of,
       a.source_locator, a.source_pdf_page,
       s.title AS source_title, s.url AS source_url
FROM official_admissions a
JOIN public_cultivars c ON c.id = a.cultivar_id
JOIN sources s ON s.id = a.source_id AND s.review_status = 'verified'
WHERE a.review_status = 'verified';
