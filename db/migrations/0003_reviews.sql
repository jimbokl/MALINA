-- Visitor reviews are moderated independently of the cultivar reference catalog.
-- Keep the region coarse (for example, an oblast); do not store contact details.
CREATE TABLE reviews (
    id INTEGER PRIMARY KEY,
    display_name TEXT NOT NULL CHECK (length(trim(display_name)) BETWEEN 1 AND 80),
    region TEXT NOT NULL CHECK (length(trim(region)) BETWEEN 1 AND 120),
    cultivar_name TEXT NOT NULL CHECK (length(trim(cultivar_name)) BETWEEN 1 AND 120),
    body TEXT NOT NULL CHECK (length(trim(body)) BETWEEN 1 AND 3000),
    consent_to_publication INTEGER NOT NULL DEFAULT 0
        CHECK (consent_to_publication IN (0, 1)),
    consented_at TEXT,
    status TEXT NOT NULL DEFAULT 'pending'
        CHECK (status IN ('pending', 'approved', 'rejected', 'withdrawn')),
    submitted_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%d %H:%M:%S', 'now')),
    reviewed_by TEXT,
    reviewed_at TEXT,
    CHECK (consent_to_publication = 0 OR consented_at IS NOT NULL),
    CHECK (status != 'approved' OR
           (consent_to_publication = 1 AND consented_at IS NOT NULL AND
            reviewed_by IS NOT NULL AND reviewed_at IS NOT NULL))
) STRICT;

CREATE INDEX idx_reviews_status_submitted ON reviews(status, submitted_at, id);

CREATE VIEW public_reviews AS
SELECT id, display_name, region, cultivar_name, body, submitted_at
FROM reviews
WHERE status = 'approved' AND consent_to_publication = 1;
