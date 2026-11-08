-- Migration: 0008_create_foundation_leads.sql
-- Purpose: Create dedicated `foundation_leads` table for AI Foundation (/ai-foundation)
-- Completely isolated from Cafe Talk (`leads` table). Additive migration only.

CREATE TABLE IF NOT EXISTS foundation_leads (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT '',
  full_name TEXT NOT NULL DEFAULT '',
  phone TEXT NOT NULL DEFAULT '',
  email TEXT DEFAULT '',
  job_title TEXT DEFAULT '',
  company TEXT DEFAULT '',
  ai_goal TEXT DEFAULT '',
  ai_experience TEXT DEFAULT '',
  source TEXT DEFAULT '',
  other_source TEXT DEFAULT '',
  privacy_consent INTEGER NOT NULL DEFAULT 0,
  privacy_consent_at TEXT DEFAULT '',
  privacy_policy_version TEXT DEFAULT '',
  marketing_consent INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'NEW',
  notes TEXT DEFAULT '',
  utm_source TEXT DEFAULT '',
  utm_medium TEXT DEFAULT '',
  utm_campaign TEXT DEFAULT '',
  utm_content TEXT DEFAULT '',
  utm_term TEXT DEFAULT '',
  referrer TEXT DEFAULT '',
  landing_path TEXT DEFAULT '',
  payload_json TEXT DEFAULT '',
  payload_hash TEXT DEFAULT '',
  client_ip TEXT DEFAULT '',
  spam_score INTEGER DEFAULT 0,
  spam_reasons TEXT DEFAULT '',
  telegram_status TEXT DEFAULT 'pending'
);

CREATE INDEX IF NOT EXISTS idx_foundation_leads_created ON foundation_leads(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_foundation_leads_status_created ON foundation_leads(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_foundation_leads_source_created ON foundation_leads(source, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_foundation_leads_phone_created ON foundation_leads(phone, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_foundation_leads_email_created ON foundation_leads(email, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_foundation_leads_payload_hash_created ON foundation_leads(payload_hash, created_at DESC);
