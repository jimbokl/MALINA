-- UTC timestamps use YYYY-MM-DD HH:MM:SS. This migration contains no real cultivar facts.
CREATE TABLE crops (
    id INTEGER PRIMARY KEY,
    slug TEXT NOT NULL UNIQUE,
    name_ru TEXT NOT NULL
) STRICT;

CREATE TABLE regions (
    id INTEGER PRIMARY KEY,
    code TEXT NOT NULL UNIQUE,
    name_ru TEXT NOT NULL,
    parent_id INTEGER REFERENCES regions(id) ON DELETE RESTRICT
) STRICT;

CREATE TABLE sources (
    id INTEGER PRIMARY KEY,
    source_key TEXT NOT NULL UNIQUE,
    kind TEXT NOT NULL CHECK (kind IN ('website', 'book', 'document', 'expert', 'other')),
    title TEXT NOT NULL,
    author_or_org TEXT,
    url TEXT,
    reference TEXT,
    accessed_on TEXT NOT NULL,
    rights_note TEXT NOT NULL,
    review_status TEXT NOT NULL DEFAULT 'draft'
        CHECK (review_status IN ('draft', 'verified', 'rejected')),
    reviewed_by TEXT,
    reviewed_at TEXT,
    CHECK (url IS NOT NULL OR reference IS NOT NULL),
    CHECK (review_status != 'verified' OR (reviewed_by IS NOT NULL AND reviewed_at IS NOT NULL))
) STRICT;

CREATE TABLE cultivars (
    id INTEGER PRIMARY KEY,
    crop_id INTEGER NOT NULL REFERENCES crops(id) ON DELETE RESTRICT,
    slug TEXT NOT NULL UNIQUE,
    canonical_name TEXT NOT NULL,
    scientific_name TEXT,
    identity_source_id INTEGER REFERENCES sources(id) ON DELETE RESTRICT,
    editorial_status TEXT NOT NULL DEFAULT 'draft'
        CHECK (editorial_status IN ('draft', 'published', 'withdrawn')),
    reviewed_by TEXT,
    reviewed_at TEXT,
    published_at TEXT,
    CHECK (editorial_status != 'published' OR
           (identity_source_id IS NOT NULL AND reviewed_by IS NOT NULL AND
            reviewed_at IS NOT NULL AND published_at IS NOT NULL))
) STRICT;

CREATE TABLE cultivar_aliases (
    id INTEGER PRIMARY KEY,
    cultivar_id INTEGER NOT NULL REFERENCES cultivars(id) ON DELETE RESTRICT,
    alias TEXT NOT NULL,
    normalized_alias TEXT NOT NULL,
    source_id INTEGER NOT NULL REFERENCES sources(id) ON DELETE RESTRICT,
    review_status TEXT NOT NULL DEFAULT 'draft'
        CHECK (review_status IN ('draft', 'verified', 'rejected')),
    reviewed_by TEXT,
    reviewed_at TEXT,
    UNIQUE (cultivar_id, normalized_alias),
    CHECK (review_status != 'verified' OR (reviewed_by IS NOT NULL AND reviewed_at IS NOT NULL))
) STRICT;

CREATE TABLE trait_definitions (
    code TEXT PRIMARY KEY,
    label_ru TEXT NOT NULL,
    value_kind TEXT NOT NULL CHECK (value_kind IN ('text', 'number', 'range'))
) STRICT;

CREATE TABLE trait_observations (
    id INTEGER PRIMARY KEY,
    cultivar_id INTEGER NOT NULL REFERENCES cultivars(id) ON DELETE RESTRICT,
    trait_code TEXT NOT NULL REFERENCES trait_definitions(code) ON DELETE RESTRICT,
    value_text TEXT,
    value_number REAL,
    value_max REAL,
    unit TEXT,
    context_text TEXT NOT NULL,
    region_id INTEGER REFERENCES regions(id) ON DELETE RESTRICT,
    source_id INTEGER NOT NULL REFERENCES sources(id) ON DELETE RESTRICT,
    observed_on TEXT,
    review_status TEXT NOT NULL DEFAULT 'draft'
        CHECK (review_status IN ('draft', 'verified', 'rejected')),
    reviewed_by TEXT,
    reviewed_at TEXT,
    CHECK (value_text IS NOT NULL OR value_number IS NOT NULL),
    CHECK (value_max IS NULL OR (value_number IS NOT NULL AND value_max >= value_number)),
    CHECK (review_status != 'verified' OR (reviewed_by IS NOT NULL AND reviewed_at IS NOT NULL))
) STRICT;

CREATE TABLE media_assets (
    id INTEGER PRIMARY KEY,
    cultivar_id INTEGER NOT NULL REFERENCES cultivars(id) ON DELETE RESTRICT,
    asset_path TEXT NOT NULL,
    alt_text TEXT NOT NULL,
    source_id INTEGER NOT NULL REFERENCES sources(id) ON DELETE RESTRICT,
    rights_basis TEXT NOT NULL DEFAULT 'unknown'
        CHECK (rights_basis IN ('unknown', 'owned', 'permission', 'open_license')),
    rights_note TEXT NOT NULL,
    review_status TEXT NOT NULL DEFAULT 'draft'
        CHECK (review_status IN ('draft', 'verified', 'rejected')),
    reviewed_by TEXT,
    reviewed_at TEXT,
    CHECK (review_status != 'verified' OR
           (rights_basis != 'unknown' AND reviewed_by IS NOT NULL AND reviewed_at IS NOT NULL))
) STRICT;

CREATE TABLE recommendation_rules (
    id INTEGER PRIMARY KEY,
    cultivar_id INTEGER NOT NULL REFERENCES cultivars(id) ON DELETE RESTRICT,
    region_id INTEGER REFERENCES regions(id) ON DELETE RESTRICT,
    conditions_json TEXT NOT NULL CHECK (json_valid(conditions_json)),
    rationale TEXT NOT NULL,
    limitations TEXT NOT NULL,
    source_id INTEGER NOT NULL REFERENCES sources(id) ON DELETE RESTRICT,
    review_status TEXT NOT NULL DEFAULT 'draft'
        CHECK (review_status IN ('draft', 'verified', 'rejected')),
    reviewed_by TEXT,
    reviewed_at TEXT,
    CHECK (review_status != 'verified' OR (reviewed_by IS NOT NULL AND reviewed_at IS NOT NULL))
) STRICT;

CREATE TABLE sellers (
    id INTEGER PRIMARY KEY,
    display_name TEXT NOT NULL,
    website_url TEXT,
    review_status TEXT NOT NULL DEFAULT 'draft'
        CHECK (review_status IN ('draft', 'verified', 'suspended')),
    reviewed_by TEXT,
    reviewed_at TEXT,
    CHECK (review_status != 'verified' OR (reviewed_by IS NOT NULL AND reviewed_at IS NOT NULL))
) STRICT;

CREATE TABLE offers (
    id INTEGER PRIMARY KEY,
    seller_id INTEGER NOT NULL REFERENCES sellers(id) ON DELETE RESTRICT,
    cultivar_id INTEGER REFERENCES cultivars(id) ON DELETE RESTRICT,
    product_name TEXT NOT NULL,
    kind TEXT NOT NULL CHECK (kind IN ('own', 'affiliate')),
    price_minor INTEGER CHECK (price_minor IS NULL OR price_minor >= 0),
    currency TEXT,
    availability TEXT NOT NULL DEFAULT 'unknown'
        CHECK (availability IN ('unknown', 'in_stock', 'out_of_stock')),
    destination_url TEXT,
    checked_at TEXT,
    expires_at TEXT,
    editorial_status TEXT NOT NULL DEFAULT 'draft'
        CHECK (editorial_status IN ('draft', 'published', 'withdrawn')),
    reviewed_by TEXT,
    reviewed_at TEXT,
    CHECK ((price_minor IS NULL AND currency IS NULL) OR
           (price_minor IS NOT NULL AND currency IS NOT NULL AND length(currency) = 3)),
    CHECK (editorial_status != 'published' OR
           (checked_at IS NOT NULL AND expires_at IS NOT NULL AND
            reviewed_by IS NOT NULL AND reviewed_at IS NOT NULL))
) STRICT;

CREATE INDEX idx_cultivars_crop_status ON cultivars(crop_id, editorial_status);
CREATE INDEX idx_alias_normalized ON cultivar_aliases(normalized_alias);
CREATE INDEX idx_observations_cultivar_trait ON trait_observations(cultivar_id, trait_code, review_status);
CREATE INDEX idx_rules_region_status ON recommendation_rules(region_id, review_status);
CREATE INDEX idx_offers_cultivar_status ON offers(cultivar_id, editorial_status, expires_at);

INSERT INTO crops(slug, name_ru) VALUES
    ('raspberry', 'Малина'),
    ('strawberry', 'Земляника садовая');

INSERT INTO regions(code, name_ru) VALUES
    ('kaliningrad-oblast', 'Калининградская область');

INSERT INTO trait_definitions(code, label_ru, value_kind) VALUES
    ('fruiting_cycle', 'Тип плодоношения', 'text'),
    ('maturity_period', 'Срок созревания', 'text'),
    ('berry_weight_g', 'Масса ягоды', 'range'),
    ('flavor', 'Вкус', 'text'),
    ('yield', 'Урожайность', 'range'),
    ('winter_hardiness', 'Зимостойкость', 'text'),
    ('disease_resistance', 'Устойчивость к заболеваниям', 'text'),
    ('cultivation_setting', 'Условия выращивания', 'text');

CREATE VIEW public_cultivars AS
SELECT c.id, c.slug, c.canonical_name, c.scientific_name,
       cr.slug AS crop_slug, cr.name_ru AS crop_name,
       s.source_key AS identity_source_key, s.title AS identity_source_title,
       s.url AS identity_source_url, c.reviewed_at, c.published_at
FROM cultivars c
JOIN crops cr ON cr.id = c.crop_id
JOIN sources s ON s.id = c.identity_source_id AND s.review_status = 'verified'
WHERE c.editorial_status = 'published';

CREATE VIEW public_aliases AS
SELECT a.id, a.cultivar_id, a.alias, a.normalized_alias
FROM cultivar_aliases a
JOIN public_cultivars c ON c.id = a.cultivar_id
JOIN sources s ON s.id = a.source_id AND s.review_status = 'verified'
WHERE a.review_status = 'verified';

CREATE VIEW public_observations AS
SELECT o.id, o.cultivar_id, o.trait_code, o.value_text, o.value_number,
       o.value_max, o.unit, o.context_text, r.code AS region_code,
       o.observed_on, s.source_key, s.title AS source_title, s.url AS source_url,
       o.reviewed_at
FROM trait_observations o
JOIN public_cultivars c ON c.id = o.cultivar_id
JOIN sources s ON s.id = o.source_id AND s.review_status = 'verified'
LEFT JOIN regions r ON r.id = o.region_id
WHERE o.review_status = 'verified';

CREATE VIEW public_media AS
SELECT m.id, m.cultivar_id, m.asset_path, m.alt_text,
       m.rights_basis, m.rights_note, s.source_key
FROM media_assets m
JOIN public_cultivars c ON c.id = m.cultivar_id
JOIN sources s ON s.id = m.source_id AND s.review_status = 'verified'
WHERE m.review_status = 'verified' AND m.rights_basis != 'unknown';

CREATE VIEW public_recommendations AS
SELECT rr.id, rr.cultivar_id, r.code AS region_code, rr.conditions_json,
       rr.rationale, rr.limitations, s.source_key, rr.reviewed_at
FROM recommendation_rules rr
JOIN public_cultivars c ON c.id = rr.cultivar_id
JOIN sources s ON s.id = rr.source_id AND s.review_status = 'verified'
LEFT JOIN regions r ON r.id = rr.region_id
WHERE rr.review_status = 'verified';

CREATE VIEW public_offers AS
SELECT o.id, o.cultivar_id, o.product_name, o.kind, o.price_minor,
       o.currency, o.availability, o.destination_url, o.checked_at,
       o.expires_at, s.display_name AS seller_name, s.website_url AS seller_url
FROM offers o
JOIN sellers s ON s.id = o.seller_id AND s.review_status = 'verified'
JOIN public_cultivars c ON c.id = o.cultivar_id
WHERE o.editorial_status = 'published'
  AND o.expires_at > strftime('%Y-%m-%d %H:%M:%S', 'now');
