ALTER TABLE yilan_activities
  ADD COLUMN IF NOT EXISTS price integer CHECK (price >= 0),
  ADD COLUMN IF NOT EXISTS capacity integer CHECK (capacity > 0),
  ADD COLUMN IF NOT EXISTS website text;

CREATE TABLE IF NOT EXISTS activity_submission_images (
  id uuid PRIMARY KEY,
  activity_id integer NOT NULL REFERENCES yilan_activities(id) ON DELETE CASCADE,
  image_data bytea NOT NULL CHECK (octet_length(image_data) BETWEEN 1 AND 4194304)
);
CREATE INDEX IF NOT EXISTS activity_submission_images_activity_id_idx
  ON activity_submission_images(activity_id);
