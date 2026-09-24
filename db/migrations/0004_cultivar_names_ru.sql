-- Public Russian names; keep scientific_name and source records as supplied by RHS.
-- A new migration preserves checksums for databases that already applied 0002.
UPDATE cultivars SET canonical_name = 'Полька' WHERE slug = 'polka';
UPDATE cultivars SET canonical_name = 'Джоан Джей' WHERE slug = 'joan-j';
UPDATE cultivars SET canonical_name = 'Кембридж Фаворит' WHERE slug = 'cambridge-favourite';
UPDATE cultivars SET canonical_name = 'Элан' WHERE slug = 'elan';
