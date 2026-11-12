-- Public source profiles are separate from login accounts and booking data.
CREATE TABLE IF NOT EXISTS association_public_listings (
  source_id text NOT NULL CHECK (source_id = 'ythma'),
  external_id text NOT NULL,
  name text NOT NULL, area text NOT NULL, website text NOT NULL,
  phone text NOT NULL DEFAULT '', line_url text NOT NULL DEFAULT '',
  photos jsonb NOT NULL DEFAULT '[]' CHECK (jsonb_typeof(photos) = 'array'),
  source_updated_at timestamptz NOT NULL,
  content_hash text NOT NULL,
  state text NOT NULL DEFAULT 'active' CHECK (state IN ('active','quarantined')),
  hidden boolean NOT NULL DEFAULT false,
  imported_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (source_id, external_id),
  FOREIGN KEY (source_id, external_id) REFERENCES association_member_reviews(source_id, external_id)
);
CREATE TABLE IF NOT EXISTS association_import_runs (
  id bigserial PRIMARY KEY, actor text NOT NULL,
  source_generated_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  summary jsonb NOT NULL
);

-- Every public surface uses the same deduplicated view. No private columns.
CREATE OR REPLACE VIEW public_homestays AS
WITH active_source AS (
  SELECT a.*, l.homestay_id,
    ARRAY(SELECT photo->>'url' FROM jsonb_array_elements(a.photos) photo) AS image_urls
  FROM association_public_listings a
  LEFT JOIN association_member_links l USING(source_id,external_id)
  WHERE a.state = 'active' AND NOT a.hidden
)
SELECT h.id::text AS id, COALESCE(a.name,h.name) AS name,
  COALESCE(a.area,h.location) AS location, h.city,
  COALESCE(a.image_urls[1],h.image_url) AS image_url,
  CASE WHEN cardinality(a.image_urls)>0 THEN a.image_urls ELSE h.images END AS images,
  COALESCE(a.website,h.website) AS website,
  COALESCE(NULLIF(a.phone,''),h.phone) AS phone,
  COALESCE(NULLIF(a.line_url,''),h.social_line) AS social_line,
  h.social_instagram,h.social_facebook,h.capacity_description,h.min_guests,h.max_guests,
  h.theme_features,h.service_amenities,h.min_price,h.max_price,h.average_price,
  h.rating,h.total_reviews,h.featured,h.view_count,h.latitude,h.longitude,
  h.status,h.available,h.created_at,
  GREATEST(h.updated_at,a.source_updated_at) AS updated_at,
  (a.external_id IS NOT NULL) AS association_managed
FROM homestays h
LEFT JOIN active_source a ON a.homestay_id=h.id
WHERE h.status='approved' AND h.available
UNION ALL
SELECT 'ythma_' || a.external_id, a.name,a.area,NULL::text,
  a.image_urls[1],a.image_urls,a.website,NULLIF(a.phone,''),NULLIF(a.line_url,''),
  NULL::text,NULL::text,NULL::text,NULL::integer,NULL::integer,
  '[]'::jsonb,'[]'::jsonb,NULL::numeric,NULL::numeric,NULL::numeric,
  NULL::numeric,0,false,0,NULL::numeric,NULL::numeric,
  'approved',true,a.imported_at,a.source_updated_at,true
FROM active_source a WHERE a.homestay_id IS NULL;
