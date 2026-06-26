ALTER TABLE "article"
ADD COLUMN IF NOT EXISTS "archived_at" TIMESTAMPTZ NULL;

CREATE INDEX IF NOT EXISTS idx_article_archived_at ON "article" ("archived_at");

COMMENT ON COLUMN "article"."archived_at" IS '優惠券封存時間；NULL 表示上架中';
