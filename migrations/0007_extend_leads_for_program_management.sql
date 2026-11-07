-- Migration: 0007_extend_leads_for_program_management.sql
-- Purpose: Additively extend the existing `leads` table to support program-based
-- Lead Management Dashboard (/cafe-talk, /ai-foundation, /ai-builder) without
-- altering or dropping any existing data.

ALTER TABLE leads ADD COLUMN program TEXT DEFAULT '';
ALTER TABLE leads ADD COLUMN full_name TEXT DEFAULT '';
ALTER TABLE leads ADD COLUMN job_title TEXT DEFAULT '';
ALTER TABLE leads ADD COLUMN interest TEXT DEFAULT '';
ALTER TABLE leads ADD COLUMN other_source TEXT DEFAULT '';
ALTER TABLE leads ADD COLUMN privacy_consent INTEGER DEFAULT 0;
ALTER TABLE leads ADD COLUMN privacy_consent_at TEXT DEFAULT '';
ALTER TABLE leads ADD COLUMN privacy_policy_version TEXT DEFAULT '';
ALTER TABLE leads ADD COLUMN marketing_consent INTEGER DEFAULT 0;
ALTER TABLE leads ADD COLUMN status TEXT NOT NULL DEFAULT 'NEW';
ALTER TABLE leads ADD COLUMN notes TEXT DEFAULT '';
ALTER TABLE leads ADD COLUMN utm_term TEXT DEFAULT '';
ALTER TABLE leads ADD COLUMN landing_path TEXT DEFAULT '';
ALTER TABLE leads ADD COLUMN updated_at TEXT DEFAULT '';

-- Backfill existing records so historical leads also have consistent fields
UPDATE leads
SET
  full_name = COALESCE(NULLIF(full_name, ''), name, ''),
  job_title = COALESCE(NULLIF(job_title, ''), role, ''),
  landing_path = COALESCE(NULLIF(landing_path, ''), source_page, ''),
  updated_at = COALESCE(NULLIF(updated_at, ''), created_at, '');

CREATE INDEX IF NOT EXISTS idx_leads_program_created ON leads(program, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_leads_status_created ON leads(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_leads_source_created ON leads(source, created_at DESC);
