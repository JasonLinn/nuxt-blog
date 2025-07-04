-- 為 article 表添加 view_count 欄位
ALTER TABLE "article" 
ADD COLUMN IF NOT EXISTS view_count INTEGER DEFAULT 0;

-- 為現有文章設置初始瀏覽量為 0
UPDATE "article" 
SET view_count = 0 
WHERE view_count IS NULL;

-- 創建索引以提升查詢效能
CREATE INDEX IF NOT EXISTS idx_article_view_count ON "article" (view_count);

-- 創建複合索引，用於熱門標籤查詢
CREATE INDEX IF NOT EXISTS idx_article_title_content_view_count 
ON "article" (view_count DESC, title, content);

COMMENT ON COLUMN "article".view_count IS '文章瀏覽次數'; 