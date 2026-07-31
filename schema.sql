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
