-- D-06: allow source-backed crop-level knowledge without inventing a cultivar link.
-- Claims stay private until both the editorial record and its evidence passport
-- have been reviewed; the source itself must also be verified for export.
CREATE TABLE agronomic_claims (
    id INTEGER PRIMARY KEY,
    crop_id INTEGER REFERENCES crops(id) ON DELETE RESTRICT,
    topic_code TEXT NOT NULL CHECK (length(trim(topic_code)) > 0),
    statement TEXT NOT NULL CHECK (length(trim(statement)) > 0),
    source_id INTEGER NOT NULL REFERENCES sources(id) ON DELETE RESTRICT,
    editorial_status TEXT NOT NULL DEFAULT 'draft'
        CHECK (editorial_status IN ('draft', 'published', 'withdrawn')),
    reviewed_by TEXT,
    reviewed_at TEXT,
    published_at TEXT,
    CHECK (editorial_status != 'published' OR
        (reviewed_by IS NOT NULL AND reviewed_at IS NOT NULL AND published_at IS NOT NULL))
) STRICT;

CREATE INDEX idx_agronomic_claims_status ON agronomic_claims(editorial_status, crop_id, topic_code);

-- Rebuild the passport table to add a third, mutually exclusive target.
-- Existing observation and recommendation passports are copied without edits.
DROP VIEW public_evidence_passports;
CREATE TABLE evidence_passports_new (
    id INTEGER PRIMARY KEY,
    observation_id INTEGER UNIQUE REFERENCES trait_observations(id) ON DELETE RESTRICT,
    recommendation_id INTEGER UNIQUE REFERENCES recommendation_rules(id) ON DELETE RESTRICT,
    claim_id INTEGER UNIQUE REFERENCES agronomic_claims(id) ON DELETE RESTRICT,
    evidence_kind TEXT NOT NULL CHECK (evidence_kind IN
        ('published_study', 'farm_observation', 'reference_document', 'expert_assessment')),
    subject_description TEXT NOT NULL CHECK (length(trim(subject_description)) > 0),
    internal_sample_ref TEXT,
    material_type TEXT,
    material_stage TEXT,
    setting_text TEXT,
    place_text TEXT,
    period_from TEXT,
    period_to TEXT,
    conditions_json TEXT NOT NULL DEFAULT '{}'
        CHECK (json_valid(conditions_json) AND json_type(conditions_json) = 'object'),
    method_text TEXT,
    sample_size INTEGER CHECK (sample_size IS NULL OR sample_size > 0),
    uncertainty_text TEXT,
    source_locator TEXT,
    applicability_note TEXT NOT NULL DEFAULT '',
    limitations_note TEXT NOT NULL DEFAULT '',
    review_status TEXT NOT NULL DEFAULT 'draft'
        CHECK (review_status IN ('draft', 'verified', 'rejected')),
    reviewed_by TEXT,
    reviewed_at TEXT,
    CHECK ((observation_id IS NOT NULL) + (recommendation_id IS NOT NULL) + (claim_id IS NOT NULL) = 1),
    CHECK (period_from IS NULL OR period_to IS NULL OR period_to >= period_from),
    CHECK (review_status != 'verified' OR
        (source_locator IS NOT NULL AND length(trim(source_locator)) > 0 AND
         length(trim(applicability_note)) > 0 AND
         length(trim(limitations_note)) > 0 AND
         reviewed_by IS NOT NULL AND reviewed_at IS NOT NULL))
) STRICT;

INSERT INTO evidence_passports_new (
    id, observation_id, recommendation_id, evidence_kind, subject_description,
    internal_sample_ref, material_type, material_stage, setting_text, place_text,
    period_from, period_to, conditions_json, method_text, sample_size,
    uncertainty_text, source_locator, applicability_note, limitations_note,
    review_status, reviewed_by, reviewed_at
)
SELECT id, observation_id, recommendation_id, evidence_kind, subject_description,
       internal_sample_ref, material_type, material_stage, setting_text, place_text,
       period_from, period_to, conditions_json, method_text, sample_size,
       uncertainty_text, source_locator, applicability_note, limitations_note,
       review_status, reviewed_by, reviewed_at
FROM evidence_passports;

DROP TABLE evidence_passports;
ALTER TABLE evidence_passports_new RENAME TO evidence_passports;

CREATE VIEW public_agronomic_claims AS
SELECT c.id, crop.slug AS crop_slug, crop.name_ru AS crop_name_ru,
       c.topic_code, c.statement, s.source_key, s.title AS source_title,
       s.author_or_org AS source_author_or_org, s.url AS source_url,
       s.reference AS source_reference, s.rights_note AS source_rights_note,
       c.reviewed_at, c.published_at
FROM agronomic_claims c
LEFT JOIN crops crop ON crop.id = c.crop_id
JOIN sources s ON s.id = c.source_id
WHERE c.editorial_status = 'published'
  AND s.review_status = 'verified'
  AND EXISTS (
      SELECT 1 FROM evidence_passports e
      WHERE e.claim_id = c.id AND e.review_status = 'verified'
  );

CREATE VIEW public_evidence_passports AS
SELECT e.id, e.observation_id, e.recommendation_id, e.claim_id, e.evidence_kind,
       e.subject_description, e.material_type, e.material_stage,
       e.setting_text, e.place_text, e.period_from, e.period_to,
       e.conditions_json, e.method_text, e.sample_size, e.uncertainty_text,
       e.source_locator, e.applicability_note, e.limitations_note, e.reviewed_at
FROM evidence_passports e
WHERE e.review_status = 'verified'
  AND (
      (e.observation_id IS NOT NULL AND EXISTS (
          SELECT 1 FROM public_observations o WHERE o.id = e.observation_id
      )) OR
      (e.recommendation_id IS NOT NULL AND EXISTS (
          SELECT 1 FROM public_recommendations r WHERE r.id = e.recommendation_id
      )) OR
      (e.claim_id IS NOT NULL AND EXISTS (
          SELECT 1 FROM public_agronomic_claims c WHERE c.id = e.claim_id
      ))
  );

CREATE INDEX idx_evidence_passports_status ON evidence_passports(review_status);
