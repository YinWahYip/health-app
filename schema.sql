-- Run this once to set up the database
-- psql -U postgres -d healthapp -f schema.sql

CREATE TABLE IF NOT EXISTS daily_logs (
  id          SERIAL PRIMARY KEY,
  log_date    DATE        NOT NULL UNIQUE,
  weight      NUMERIC(5,1),          -- lbs or kg, your choice
  sleep_hours NUMERIC(4,1),          -- e.g. 7.5
  mood        SMALLINT CHECK (mood BETWEEN 1 AND 5),
  water_cups  SMALLINT,
  worked_out  BOOLEAN     DEFAULT FALSE,
  steps       INTEGER,
  notes       TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Auto-update updated_at on row change
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER daily_logs_updated_at
  BEFORE UPDATE ON daily_logs
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Columns added after the original CREATE TABLE. These run safely on both a fresh
-- database and an existing one, so a clean `psql -f schema.sql` produces a schema
-- that matches what server/routes/logs.js actually inserts.
ALTER TABLE daily_logs ADD COLUMN IF NOT EXISTS screen_time    NUMERIC(4,1);
ALTER TABLE daily_logs ADD COLUMN IF NOT EXISTS minutes_walked INTEGER;

-- NOTE ON `mood`: still created above and still written by the API, but it was
-- removed from the log form on 2026-08-04 and no longer appears in the UI. It is
-- retained so existing rows keep their history. Do not describe it as a tracked
-- metric -- nothing collects it any more.
