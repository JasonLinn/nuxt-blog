-- 站點瀏覽次數計數表（單列設計）
-- 建在 nuxt-marketing (coupon) DB 上
CREATE TABLE IF NOT EXISTS site_pageview (
  id INTEGER PRIMARY KEY DEFAULT 1,
  count BIGINT NOT NULL DEFAULT 0,
  updated_at TIMESTAMP DEFAULT NOW(),
  CONSTRAINT site_pageview_single_row CHECK (id = 1)
);

-- 初始化基礎值 21,388（不存在才插入；存在則保留現有值）
INSERT INTO site_pageview (id, count) VALUES (1, 21388)
ON CONFLICT (id) DO NOTHING;
