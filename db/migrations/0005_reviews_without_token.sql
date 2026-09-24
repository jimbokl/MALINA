-- Move the original review table to the JEV-moderated schema without changing 0003.
-- Legacy approval has no JEV decision: retain the review as pending, not public.
-- Legacy withdrawn reviews are intentionally omitted.
DROP VIEW public_reviews;

CREATE TABLE reviews_next (
    id INTEGER PRIMARY KEY,
    display_name TEXT NOT NULL CHECK (length(trim(display_name)) BETWEEN 1 AND 80),
    region TEXT NOT NULL CHECK (length(trim(region)) BETWEEN 1 AND 120),
    cultivar_name TEXT NOT NULL CHECK (length(trim(cultivar_name)) BETWEEN 1 AND 120),
    body TEXT NOT NULL CHECK (length(trim(body)) BETWEEN 1 AND 3000),
    consent_processing INTEGER NOT NULL CHECK (consent_processing IN (0, 1)),
    processing_consented_at TEXT,
    consent_publication INTEGER NOT NULL DEFAULT 0
        CHECK (consent_publication IN (0, 1)),
    publication_consented_at TEXT,
    status TEXT NOT NULL DEFAULT 'pending'
        CHECK (status IN ('pending', 'approved', 'rejected')),
    created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%d %H:%M:%S', 'now')),
    published_at TEXT,
    moderation_model TEXT,
    moderation_verdict TEXT
        CHECK (moderation_verdict IN ('spam', 'not_spam', 'low_value', 'needs_review')),
    moderation_reason TEXT,
    moderation_version TEXT,
    moderated_at TEXT,
    reviewed_by TEXT,
    reviewed_at TEXT,
    CHECK ((consent_processing = 0 AND processing_consented_at IS NULL) OR
           (consent_processing = 1 AND processing_consented_at IS NOT NULL AND
            length(trim(processing_consented_at)) > 0)),
    CHECK ((consent_publication = 0 AND publication_consented_at IS NULL) OR
           (consent_publication = 1 AND publication_consented_at IS NOT NULL)),
    CHECK (status != 'approved' OR
           (consent_processing = 1 AND consent_publication = 1 AND
            moderation_verdict = 'not_spam' AND
            moderation_model IS NOT NULL AND length(trim(moderation_model)) > 0 AND
            moderation_reason IS NOT NULL AND length(trim(moderation_reason)) > 0 AND
            moderation_version IS NOT NULL AND length(trim(moderation_version)) > 0 AND
            moderated_at IS NOT NULL AND length(trim(moderated_at)) > 0 AND
            published_at IS NOT NULL AND length(trim(published_at)) > 0))
) STRICT;

INSERT INTO reviews_next (
    id, display_name, region, cultivar_name, body,
    consent_processing, processing_consented_at, consent_publication,
    publication_consented_at, status, created_at, published_at,
    moderation_model, moderation_verdict, moderation_reason, moderation_version,
    moderated_at, reviewed_by, reviewed_at
)
SELECT
    id, display_name, region, cultivar_name, body,
    0, NULL, consent_to_publication,
    consented_at,
    CASE WHEN status = 'approved' THEN 'pending' ELSE status END,
    submitted_at, NULL,
    NULL, NULL, NULL, NULL,
    NULL, reviewed_by, reviewed_at
FROM reviews
WHERE status != 'withdrawn';

DROP TABLE reviews;
ALTER TABLE reviews_next RENAME TO reviews;
CREATE INDEX idx_reviews_status_created ON reviews(status, created_at, id);

CREATE VIEW public_reviews AS
SELECT id, display_name, region, cultivar_name, body, created_at, published_at
FROM reviews
WHERE status = 'approved' AND consent_processing = 1 AND consent_publication = 1;
