ALTER TABLE upload_failures
  ADD COLUMN IF NOT EXISTS outcome text NOT NULL DEFAULT 'failure' CHECK (outcome IN ('failure', 'success')),
  ADD COLUMN IF NOT EXISTS submission_id bigint,
  ALTER COLUMN reason DROP NOT NULL;

CREATE INDEX IF NOT EXISTS upload_failures_outcome_time_idx ON upload_failures (outcome, occurred_at DESC);
