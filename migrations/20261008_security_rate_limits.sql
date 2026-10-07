-- Apply to HOMESTAY_DATABASE_URL before deploying the security patch.
CREATE TABLE IF NOT EXISTS security_rate_limits (
  bucket text PRIMARY KEY,
  window_start timestamptz NOT NULL,
  hits integer NOT NULL CHECK (hits > 0)
);
CREATE INDEX IF NOT EXISTS security_rate_limits_window_idx ON security_rate_limits(window_start);
-- Periodic cleanup can safely remove buckets older than two days.
