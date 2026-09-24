-- Replies live in the same table and inherit the parent's cultivar.
-- Parent links are immutable, so cycles cannot be introduced after insertion.
ALTER TABLE reviews ADD COLUMN parent_id INTEGER REFERENCES reviews(id) ON DELETE CASCADE;
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

DROP VIEW public_reviews;
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
