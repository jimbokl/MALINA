-- Keep uncertain submissions in a private, explicit human-review queue.
-- A human approval is recorded separately from a JEV verdict.
DROP VIEW public_reviews;
DROP TRIGGER reviews_reply_insert;
DROP TRIGGER reviews_parent_immutable;
DROP INDEX idx_reviews_status_created;
DROP INDEX idx_reviews_parent_created;

ALTER TABLE reviews RENAME TO reviews_old;

CREATE TABLE reviews (
    id INTEGER PRIMARY KEY,
    display_name TEXT NOT NULL CHECK (length(trim(display_name)) BETWEEN 1 AND 80),
    region TEXT NOT NULL CHECK (length(trim(region)) BETWEEN 1 AND 120),
    cultivar_name TEXT NOT NULL CHECK (length(trim(cultivar_name)) BETWEEN 1 AND 120),
    body TEXT NOT NULL CHECK (length(trim(body)) BETWEEN 1 AND 3000),
    consent_processing INTEGER NOT NULL CHECK (consent_processing IN (0, 1)),
    processing_consented_at TEXT,
    consent_publication INTEGER NOT NULL DEFAULT 0 CHECK (consent_publication IN (0, 1)),
    publication_consented_at TEXT,
    status TEXT NOT NULL DEFAULT 'pending_human_review'
        CHECK (status IN ('pending_human_review', 'approved', 'rejected')),
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
    parent_id INTEGER REFERENCES reviews(id) ON DELETE CASCADE,
    CHECK ((consent_processing = 0 AND processing_consented_at IS NULL) OR
           (consent_processing = 1 AND processing_consented_at IS NOT NULL AND
            length(trim(processing_consented_at)) > 0)),
    CHECK ((consent_publication = 0 AND publication_consented_at IS NULL) OR
           (consent_publication = 1 AND publication_consented_at IS NOT NULL)),
    CHECK (status != 'approved' OR
           (consent_processing = 1 AND consent_publication = 1 AND
            published_at IS NOT NULL AND length(trim(published_at)) > 0 AND
            ((moderation_verdict = 'not_spam' AND moderation_model IS NOT NULL AND
              length(trim(moderation_model)) > 0 AND moderation_reason IS NOT NULL AND
              length(trim(moderation_reason)) > 0 AND moderation_version IS NOT NULL AND
              length(trim(moderation_version)) > 0 AND moderated_at IS NOT NULL AND
              length(trim(moderated_at)) > 0) OR
             (reviewed_by LIKE 'human:%' AND reviewed_at IS NOT NULL AND
              length(trim(reviewed_at)) > 0))))
) STRICT;

INSERT INTO reviews (
    id, display_name, region, cultivar_name, body, consent_processing,
    processing_consented_at, consent_publication, publication_consented_at,
    status, created_at, published_at, moderation_model, moderation_verdict,
    moderation_reason, moderation_version, moderated_at, reviewed_by,
    reviewed_at, parent_id
)
SELECT id, display_name, region, cultivar_name, body, consent_processing,
       processing_consented_at, consent_publication, publication_consented_at,
       CASE WHEN status = 'pending' THEN 'pending_human_review' ELSE status END,
       created_at, published_at, moderation_model, moderation_verdict,
       moderation_reason, moderation_version, moderated_at, reviewed_by,
       reviewed_at, parent_id
FROM reviews_old ORDER BY id;

DROP TABLE reviews_old;
CREATE INDEX idx_reviews_status_created ON reviews(status, created_at, id);
CREATE INDEX idx_reviews_parent_created ON reviews(parent_id, created_at, id);

CREATE TRIGGER reviews_reply_insert
BEFORE INSERT ON reviews
WHEN NEW.parent_id IS NOT NULL
BEGIN
    SELECT CASE WHEN NEW.parent_id = NEW.id OR
        COALESCE((SELECT status FROM reviews WHERE id = NEW.parent_id), '') != 'approved'
        THEN RAISE(ABORT, 'reply parent must be approved') END;
    SELECT CASE WHEN NEW.cultivar_name !=
        (SELECT cultivar_name FROM reviews WHERE id = NEW.parent_id)
        THEN RAISE(ABORT, 'reply cultivar must match parent') END;
    SELECT CASE WHEN (
        WITH RECURSIVE ancestors(id, parent_id, depth) AS (
            SELECT id, parent_id, 1 FROM reviews WHERE id = NEW.parent_id
            UNION ALL
            SELECT r.id, r.parent_id, a.depth + 1
            FROM reviews r JOIN ancestors a ON r.id = a.parent_id
        )
        SELECT MAX(depth) FROM ancestors
    ) >= 8 THEN RAISE(ABORT, 'review thread too deep') END;
END;

CREATE TRIGGER reviews_parent_immutable
BEFORE UPDATE OF parent_id ON reviews
WHEN NEW.parent_id IS NOT OLD.parent_id
BEGIN
    SELECT RAISE(ABORT, 'review parent cannot change');
END;

CREATE VIEW public_reviews AS
WITH RECURSIVE visible (
    id, parent_id, display_name, region, cultivar_name, body, created_at, published_at
) AS (
    SELECT id, parent_id, display_name, region, cultivar_name, body, created_at, published_at
    FROM reviews
    WHERE parent_id IS NULL AND status = 'approved'
      AND consent_processing = 1 AND consent_publication = 1
    UNION ALL
    SELECT r.id, r.parent_id, r.display_name, r.region, r.cultivar_name,
           r.body, r.created_at, r.published_at
    FROM reviews r JOIN visible p ON r.parent_id = p.id
    WHERE r.status = 'approved'
      AND r.consent_processing = 1 AND r.consent_publication = 1
)
SELECT id, parent_id, display_name, region, cultivar_name, body, created_at, published_at
FROM visible;
