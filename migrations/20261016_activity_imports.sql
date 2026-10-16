-- Additive migration. Existing submissions and published activities are preserved.
ALTER TABLE yilan_activities ADD COLUMN IF NOT EXISTS source_name text;
ALTER TABLE yilan_activities ADD COLUMN IF NOT EXISTS source_url text;
ALTER TABLE yilan_activities ADD COLUMN IF NOT EXISTS last_synced_at timestamptz;
ALTER TABLE yilan_activities ADD COLUMN IF NOT EXISTS import_managed boolean NOT NULL DEFAULT false;

CREATE TABLE IF NOT EXISTS activity_import_items (
  source_id text NOT NULL,
  external_id text NOT NULL,
  source_name text NOT NULL,
  candidate jsonb NOT NULL,
  content_hash text NOT NULL,
  reasons jsonb NOT NULL DEFAULT '[]',
  state text NOT NULL DEFAULT 'pending' CHECK (state IN ('pending','published','dismissed','duplicate','deleted')),
  activity_id integer REFERENCES yilan_activities(id) ON DELETE SET NULL,
  last_seen_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (source_id, external_id)
);
CREATE INDEX IF NOT EXISTS activity_import_pending ON activity_import_items (state, updated_at DESC);
CREATE TABLE IF NOT EXISTS activity_import_runs (
  id bigserial PRIMARY KEY,
  started_at timestamptz NOT NULL DEFAULT now(),
  finished_at timestamptz,
  status text NOT NULL,
  summary jsonb NOT NULL DEFAULT '[]'
);
