-- A commercial record is never a cultivar fact. These views expose only
-- reviewed, current records and never expose internal provenance documents.
DROP VIEW public_offers;

CREATE VIEW public_offers AS
SELECT o.id, o.cultivar_id, o.product_name, o.kind, o.price_minor,
       o.currency, o.availability, o.destination_url, o.checked_at,
       o.expires_at, s.display_name AS seller_name,
       s.website_url AS seller_url,
       'Партнёрская ссылка: при переходе к продавцу сайт может получить вознаграждение.'
           AS disclosure
FROM offers o
JOIN sellers s ON s.id = o.seller_id AND s.review_status = 'verified'
JOIN public_cultivars c ON c.id = o.cultivar_id
WHERE o.kind = 'affiliate'
  AND o.editorial_status = 'published'
  AND o.checked_at IS NOT NULL
  AND o.checked_at <= strftime('%Y-%m-%d %H:%M:%S', 'now')
  AND o.expires_at > o.checked_at
  AND o.expires_at > strftime('%Y-%m-%d %H:%M:%S', 'now')
  AND s.website_url LIKE 'https://%'
  AND length(rtrim(s.website_url, '/')) > length('https://')
  AND instr(s.website_url, '?') = 0
  AND instr(s.website_url, '#') = 0
  AND instr(s.website_url, '@') = 0
  AND instr(s.website_url, ' ') = 0
  AND o.destination_url IS NOT NULL
  AND (o.destination_url = rtrim(s.website_url, '/') OR
       substr(o.destination_url, 1, length(rtrim(s.website_url, '/')) + 1) =
           rtrim(s.website_url, '/') || '/')
  AND instr(o.destination_url, ' ') = 0
  AND instr(o.destination_url, char(10)) = 0
  AND instr(o.destination_url, char(13)) = 0;

-- Origin records and stock are local operational data. Only a ready,
-- reviewed batch with a current count is suitable for a public own-stock page.
CREATE TABLE own_batches (
    id INTEGER PRIMARY KEY,
    cultivar_id INTEGER NOT NULL REFERENCES cultivars(id) ON DELETE RESTRICT,
    batch_code TEXT NOT NULL UNIQUE CHECK (length(trim(batch_code)) > 0),
    origin_method TEXT NOT NULL CHECK (origin_method IN ('in_vitro', 'runner', 'other')),
    origin_document_ref TEXT NOT NULL CHECK (length(trim(origin_document_ref)) > 0),
    provenance_summary TEXT NOT NULL CHECK (length(trim(provenance_summary)) > 0),
    received_on TEXT NOT NULL CHECK (date(received_on) IS NOT NULL),
    plant_stage TEXT NOT NULL CHECK (plant_stage IN ('acclimatizing', 'growing', 'sale_ready')),
    quantity_available INTEGER NOT NULL DEFAULT 0 CHECK (quantity_available >= 0),
    pickup_region_id INTEGER NOT NULL REFERENCES regions(id) ON DELETE RESTRICT,
    pickup_locality TEXT NOT NULL CHECK (length(trim(pickup_locality)) > 0),
    pickup_terms TEXT NOT NULL CHECK (length(trim(pickup_terms)) > 0),
    checked_at TEXT,
    expires_at TEXT,
    editorial_status TEXT NOT NULL DEFAULT 'draft'
        CHECK (editorial_status IN ('draft', 'published', 'withdrawn')),
    reviewed_by TEXT,
    reviewed_at TEXT,
    CHECK (editorial_status != 'published' OR
           (plant_stage = 'sale_ready' AND quantity_available > 0 AND
            checked_at IS NOT NULL AND expires_at IS NOT NULL AND
            expires_at > checked_at AND reviewed_by IS NOT NULL AND
            reviewed_at IS NOT NULL))
) STRICT;

CREATE INDEX idx_own_batches_cultivar_status
    ON own_batches(cultivar_id, editorial_status, expires_at);

CREATE VIEW public_own_batches AS
SELECT b.id, b.cultivar_id, b.batch_code, b.origin_method,
       b.provenance_summary, b.received_on, b.plant_stage,
       b.quantity_available, r.code AS pickup_region_code,
       r.name_ru AS pickup_region_name, b.pickup_locality,
       b.pickup_terms, b.checked_at, b.expires_at
FROM own_batches b
JOIN public_cultivars c ON c.id = b.cultivar_id
JOIN regions r ON r.id = b.pickup_region_id
WHERE b.editorial_status = 'published'
  AND b.plant_stage = 'sale_ready'
  AND b.quantity_available > 0
  AND b.checked_at <= strftime('%Y-%m-%d %H:%M:%S', 'now')
  AND b.expires_at > strftime('%Y-%m-%d %H:%M:%S', 'now');
