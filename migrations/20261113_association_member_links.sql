-- Additive metadata only: no existing homestay row is inserted, updated or deleted.
CREATE TABLE IF NOT EXISTS association_member_reviews (
  source_id text NOT NULL CHECK (source_id = 'ythma'),
  external_id text NOT NULL CHECK (external_id ~ '^[A-Za-z0-9_-]{1,128}$'),
  category text NOT NULL CHECK (category IN ('new','match','review','blocked','invalid','linked')),
  preview_item jsonb NOT NULL CHECK (jsonb_typeof(preview_item) = 'object'),
  content_hash text NOT NULL,
  revision integer NOT NULL DEFAULT 1 CHECK (revision > 0),
  present_in_source boolean NOT NULL DEFAULT true,
  source_updated_at timestamptz,
  source_generated_at timestamptz NOT NULL,
  first_seen_at timestamptz NOT NULL DEFAULT now(),
  last_seen_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (source_id, external_id)
);

CREATE TABLE IF NOT EXISTS association_member_links (
  source_id text NOT NULL CHECK (source_id = 'ythma'),
  external_id text NOT NULL,
  homestay_id varchar(10) NOT NULL REFERENCES homestays(id) ON DELETE RESTRICT,
  confirmed_by text NOT NULL,
  confirmed_at timestamptz NOT NULL DEFAULT now(),
  confirmation_note text NOT NULL DEFAULT '' CHECK (length(confirmation_note) <= 500),
  PRIMARY KEY (source_id, external_id),
  UNIQUE (source_id, homestay_id),
  FOREIGN KEY (source_id, external_id)
    REFERENCES association_member_reviews(source_id, external_id) ON DELETE RESTRICT
);

CREATE TABLE IF NOT EXISTS association_member_link_events (
  id bigserial PRIMARY KEY,
  source_id text NOT NULL,
  external_id text NOT NULL,
  homestay_id varchar(10) NOT NULL,
  action text NOT NULL CHECK (action = 'confirmed'),
  actor text NOT NULL,
  review_revision integer NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  FOREIGN KEY (source_id, external_id)
    REFERENCES association_member_links(source_id, external_id) ON DELETE RESTRICT
);

CREATE TABLE IF NOT EXISTS association_member_sync_state (
  source_id text PRIMARY KEY CHECK (source_id = 'ythma'),
  generated_at timestamptz NOT NULL,
  reviewed_at timestamptz NOT NULL DEFAULT now(),
  source_count integer NOT NULL CHECK (source_count >= 0)
);

CREATE INDEX IF NOT EXISTS association_member_review_category
  ON association_member_reviews (category, present_in_source);
