CREATE TABLE IF NOT EXISTS upload_failures (
  id uuid PRIMARY KEY,
  occurred_at timestamptz NOT NULL,
  received_at timestamptz NOT NULL DEFAULT now(),
  source text NOT NULL,
  stage text NOT NULL,
  reason text NOT NULL,
  http_status smallint,
  file_type text,
  file_bytes bigint,
  reporter text NOT NULL
);
CREATE INDEX IF NOT EXISTS upload_failures_occurred_at_idx ON upload_failures (occurred_at DESC);
ALTER TABLE upload_failures ADD COLUMN IF NOT EXISTS detail text;
