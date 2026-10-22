-- Migration 0006: Add candidate identification fields to founding_talent_surveys
-- Stores candidate identity directly on the same submission record.

ALTER TABLE founding_talent_surveys ADD COLUMN candidate_name TEXT;
ALTER TABLE founding_talent_surveys ADD COLUMN candidate_email TEXT;
ALTER TABLE founding_talent_surveys ADD COLUMN candidate_phone TEXT;
ALTER TABLE founding_talent_surveys ADD COLUMN candidate_group TEXT;
ALTER TABLE founding_talent_surveys ADD COLUMN candidate_group_other TEXT;
ALTER TABLE founding_talent_surveys ADD COLUMN candidate_organization TEXT;

CREATE INDEX IF NOT EXISTS idx_fts_candidate_email ON founding_talent_surveys (candidate_email);
CREATE INDEX IF NOT EXISTS idx_fts_candidate_group ON founding_talent_surveys (candidate_group);
