-- Migration 0003: Dedicated table for Founding Talent Challenge leads
CREATE TABLE IF NOT EXISTS founding_talent_leads (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  code TEXT NOT NULL UNIQUE,
  season_id TEXT NOT NULL,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  segment TEXT NOT NULL,
  segment_other TEXT,
  organization TEXT NOT NULL,
  strength TEXT NOT NULL,
  project TEXT,
  motivation TEXT NOT NULL,
  mode TEXT NOT NULL,
  hours_per_week INTEGER NOT NULL,
  terms_version TEXT NOT NULL,
  privacy_version TEXT NOT NULL,
  consented_at TEXT NOT NULL,
  source TEXT,
  ip_hash TEXT,
  user_agent TEXT,
  telegram_status TEXT NOT NULL DEFAULT 'pending',
  telegram_error TEXT,
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_ft_leads_email ON founding_talent_leads (email);
CREATE INDEX IF NOT EXISTS idx_ft_leads_code ON founding_talent_leads (code);
