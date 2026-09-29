-- A dated observation of public sale listings, separate from regional trials.
-- Seller identifiers are never stored: only a keyed digest used for deduplication.
CREATE TABLE market_presence_batches (
    batch_id TEXT PRIMARY KEY,
    source TEXT NOT NULL CHECK (source = 'avito'),
    observed_on TEXT NOT NULL,
    scope_text TEXT NOT NULL,
    imported_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%d %H:%M:%S', 'now')),
    listing_count INTEGER NOT NULL CHECK (listing_count >= 0),
    matched_listing_count INTEGER NOT NULL CHECK (matched_listing_count >= 0)
) STRICT;

CREATE TABLE market_presence_listings (
    batch_id TEXT NOT NULL REFERENCES market_presence_batches(batch_id) ON DELETE CASCADE,
    listing_id TEXT NOT NULL,
    listing_url TEXT NOT NULL,
    city_name TEXT NOT NULL,
    city_key TEXT NOT NULL,
    seller_digest TEXT,
    PRIMARY KEY (batch_id, listing_id)
) STRICT;

CREATE TABLE market_presence_mentions (
    batch_id TEXT NOT NULL,
    listing_id TEXT NOT NULL,
    cultivar_id INTEGER NOT NULL REFERENCES cultivars(id) ON DELETE RESTRICT,
    mention_location TEXT NOT NULL CHECK (mention_location IN ('title', 'description')),
    matched_name TEXT NOT NULL,
    PRIMARY KEY (batch_id, listing_id, cultivar_id),
    FOREIGN KEY (batch_id, listing_id)
        REFERENCES market_presence_listings(batch_id, listing_id) ON DELETE CASCADE
) STRICT;

CREATE INDEX idx_market_mentions_cultivar ON market_presence_mentions(cultivar_id, batch_id);
CREATE INDEX idx_market_listings_city ON market_presence_listings(city_key, batch_id);
