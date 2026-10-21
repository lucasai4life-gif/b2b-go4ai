-- Migration 0004: Table for /baogiaxnk survey auto-saves
CREATE TABLE IF NOT EXISTS baogiaxnk_surveys (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  submission_id TEXT NOT NULL UNIQUE,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  revision INTEGER NOT NULL DEFAULT 1,
  source TEXT NOT NULL DEFAULT 'baogiaxnk',
  event_id TEXT NOT NULL DEFAULT 'coffee-for-business-2026-10-22',
  sector TEXT,
  sector_name TEXT,
  answers_json TEXT NOT NULL,
  score_p INTEGER NOT NULL DEFAULT 0,
  score_f INTEGER NOT NULL DEFAULT 0,
  score_n INTEGER NOT NULL DEFAULT 0,
  route TEXT NOT NULL,
  caveat TEXT,
  result_title TEXT,
  result_subtitle TEXT,
  first_action TEXT,
  stages_json TEXT,
  seven_days_json TEXT,
  utm_source TEXT,
  utm_campaign TEXT,
  qr_variant TEXT,
  current_page_path TEXT,
  client_ip TEXT,
  user_agent TEXT,
  lead_id INTEGER
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_baogiaxnk_surveys_submission_id ON baogiaxnk_surveys (submission_id);
CREATE INDEX IF NOT EXISTS idx_baogiaxnk_surveys_created_at ON baogiaxnk_surveys (created_at);
CREATE INDEX IF NOT EXISTS idx_baogiaxnk_surveys_route ON baogiaxnk_surveys (route);
CREATE INDEX IF NOT EXISTS idx_baogiaxnk_surveys_lead_id ON baogiaxnk_surveys (lead_id);
