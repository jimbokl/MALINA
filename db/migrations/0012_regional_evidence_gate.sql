-- A foreign cultivar description or hardiness rating cannot by itself support
-- a recommendation for a Russian region. Formal admission is useful context,
-- but a positive selector result also needs reviewed local trial/field evidence.
CREATE TABLE regional_evidence (
    id INTEGER PRIMARY KEY,
    recommendation_id INTEGER NOT NULL REFERENCES recommendation_rules(id) ON DELETE RESTRICT,
    region_id INTEGER NOT NULL REFERENCES regions(id) ON DELETE RESTRICT,
    source_id INTEGER NOT NULL REFERENCES sources(id) ON DELETE RESTRICT,
    basis_kind TEXT NOT NULL CHECK (basis_kind IN
        ('regional_trial', 'local_field_observation', 'state_register_admission')),
    source_locator TEXT NOT NULL CHECK (length(trim(source_locator)) > 0),
    place_text TEXT NOT NULL CHECK (length(trim(place_text)) > 0),
    conditions_text TEXT NOT NULL CHECK (length(trim(conditions_text)) > 0),
    limitations_text TEXT NOT NULL CHECK (length(trim(limitations_text)) > 0),
    review_status TEXT NOT NULL DEFAULT 'draft'
        CHECK (review_status IN ('draft', 'verified', 'rejected')),
    reviewed_by TEXT,
    reviewed_at TEXT,
    CHECK (review_status != 'verified' OR
           (reviewed_by IS NOT NULL AND reviewed_at IS NOT NULL))
) STRICT;

CREATE INDEX idx_regional_evidence_rule ON regional_evidence
    (recommendation_id, region_id, review_status, basis_kind);

DROP VIEW public_recommendations;
CREATE VIEW public_recommendations AS
SELECT rr.id, rr.cultivar_id, r.code AS region_code, rr.conditions_json,
       rr.rationale, rr.limitations, s.source_key, rr.reviewed_at,
       rb.basis_kind, rs.source_key AS basis_source_key,
       rs.title AS basis_source_title, rs.url AS basis_source_url,
       rb.source_locator AS basis_source_locator,
       rb.place_text AS basis_place,
       rb.conditions_text AS basis_conditions,
       rb.limitations_text AS basis_limitations
FROM recommendation_rules rr
JOIN public_cultivars c ON c.id = rr.cultivar_id
JOIN sources s ON s.id = rr.source_id AND s.review_status = 'verified'
LEFT JOIN regions r ON r.id = rr.region_id
LEFT JOIN regional_evidence rb ON rb.id = (
    SELECT MIN(candidate.id)
    FROM regional_evidence candidate
    JOIN sources regional_source ON regional_source.id = candidate.source_id
        AND regional_source.review_status = 'verified'
    WHERE candidate.recommendation_id = rr.id
      AND candidate.region_id = rr.region_id
      AND candidate.review_status = 'verified'
      AND candidate.basis_kind IN ('regional_trial', 'local_field_observation')
)
LEFT JOIN sources rs ON rs.id = rb.source_id
WHERE rr.review_status = 'verified'
  AND (rr.region_id IS NULL OR rb.id IS NOT NULL);
