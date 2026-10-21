-- Migration 0005: GO4AI | Founding Talent Survey responses
-- Purpose: store the 7-question aspiration / environment survey (no scoring, no ranking).
-- submission_id is the stable unique record ID and the duplicate-submit guard.

CREATE TABLE IF NOT EXISTS founding_talent_surveys (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  submission_id TEXT NOT NULL UNIQUE,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,

  q1_answer TEXT NOT NULL,
  q1_other TEXT,

  q2_text TEXT NOT NULL,

  q3_answers_json TEXT,
  q3_other TEXT,

  q4_answers_json TEXT,

  q5_answer TEXT NOT NULL,
  q5_other TEXT,

  q6_answers_json TEXT,
  q6_other TEXT,

  q7_text TEXT NOT NULL,

  source TEXT NOT NULL DEFAULT 'foundingtalent-survey',
  page_path TEXT,
  utm_source TEXT,
  utm_campaign TEXT,
  referrer TEXT
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_fts_submission_id ON founding_talent_surveys (submission_id);
CREATE INDEX IF NOT EXISTS idx_fts_created_at ON founding_talent_surveys (created_at);
CREATE INDEX IF NOT EXISTS idx_fts_q1 ON founding_talent_surveys (q1_answer);
CREATE INDEX IF NOT EXISTS idx_fts_q5 ON founding_talent_surveys (q5_answer);
