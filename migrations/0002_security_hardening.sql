-- Migration 0002: Security hardening & spam protection fields
ALTER TABLE leads ADD COLUMN client_ip TEXT DEFAULT '';
ALTER TABLE leads ADD COLUMN spam_score INTEGER DEFAULT 0;
ALTER TABLE leads ADD COLUMN spam_reasons TEXT DEFAULT '';
ALTER TABLE leads ADD COLUMN payload_hash TEXT DEFAULT '';

CREATE INDEX IF NOT EXISTS idx_leads_payload_hash_created ON leads (payload_hash, created_at);
CREATE INDEX IF NOT EXISTS idx_leads_email_created ON leads (email, created_at);
CREATE INDEX IF NOT EXISTS idx_leads_phone_created ON leads (phone, created_at);
