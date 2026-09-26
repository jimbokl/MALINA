-- D-06: structured context for an individual observation or recommendation.
-- Existing published facts remain visible while their passports are reviewed.
-- An internal sample/lot reference is deliberately excluded from the public view.
CREATE TABLE evidence_passports (
    id INTEGER PRIMARY KEY,
    observation_id INTEGER UNIQUE REFERENCES trait_observations(id) ON DELETE RESTRICT,
    recommendation_id INTEGER UNIQUE REFERENCES recommendation_rules(id) ON DELETE RESTRICT,
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
    CHECK ((observation_id IS NOT NULL) != (recommendation_id IS NOT NULL)),
    CHECK (period_from IS NULL OR period_to IS NULL OR period_to >= period_from),
    CHECK (review_status != 'verified' OR
        (source_locator IS NOT NULL AND length(trim(source_locator)) > 0 AND
         length(trim(applicability_note)) > 0 AND
         length(trim(limitations_note)) > 0 AND
         reviewed_by IS NOT NULL AND reviewed_at IS NOT NULL))
) STRICT;

CREATE VIEW public_evidence_passports AS
SELECT e.id, e.observation_id, e.recommendation_id, e.evidence_kind,
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
      ))
  );

CREATE INDEX idx_evidence_passports_status ON evidence_passports(review_status);
