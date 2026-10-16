-- Image attribution is independent of the activity text's source.
ALTER TABLE yilan_activities ADD COLUMN IF NOT EXISTS image_source_name text;
ALTER TABLE yilan_activities ADD COLUMN IF NOT EXISTS image_source_url text;
