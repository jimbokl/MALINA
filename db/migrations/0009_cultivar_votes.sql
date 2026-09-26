-- Anonymous recommendations are separate from reviews and agronomic evidence.
CREATE TABLE cultivar_votes (
    cultivar_id INTEGER NOT NULL REFERENCES cultivars(id) ON DELETE CASCADE,
    voter_hash TEXT NOT NULL CHECK (
        length(voter_hash) = 64 AND voter_hash NOT GLOB '*[^0-9a-f]*'
    ),
    created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
    PRIMARY KEY (cultivar_id, voter_hash)
) STRICT, WITHOUT ROWID;

CREATE INDEX cultivar_votes_by_voter ON cultivar_votes(voter_hash, cultivar_id);

-- Zero counts are intentional. Withdrawing a cultivar or its identity source
-- removes its aggregates from the public view without destroying private data.
CREATE VIEW public_cultivar_votes AS
SELECT c.slug AS cultivar_slug, COUNT(v.cultivar_id) AS count
FROM public_cultivars c
LEFT JOIN cultivar_votes v ON v.cultivar_id = c.id
GROUP BY c.id, c.slug;
