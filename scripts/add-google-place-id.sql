-- 添加 google_place_id 欄位到 places 表
ALTER TABLE places ADD COLUMN IF NOT EXISTS google_place_id VARCHAR(255);

-- 添加索引以提高查詢效能
CREATE INDEX IF NOT EXISTS idx_places_google_place_id ON places(google_place_id);

-- 更新現有資料，將 place_id 複製到 google_place_id（如果需要）
UPDATE places SET google_place_id = place_id WHERE google_place_id IS NULL AND place_id IS NOT NULL;
