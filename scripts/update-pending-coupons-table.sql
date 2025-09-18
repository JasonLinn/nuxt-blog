-- 更新 pending_coupons 表格，添加 articles 相關欄位
ALTER TABLE pending_coupons 
ADD COLUMN IF NOT EXISTS amount INTEGER DEFAULT 1000,
ADD COLUMN IF NOT EXISTS category_id INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS isonce BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS isReferral BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS tags TEXT,
ADD COLUMN IF NOT EXISTS position TEXT;

-- 添加註解
COMMENT ON COLUMN pending_coupons.amount IS '發放數量';
COMMENT ON COLUMN pending_coupons.category_id IS '優惠券分類ID，對應articles表格的category欄位';
COMMENT ON COLUMN pending_coupons.isonce IS '是否限制每個帳號只能領取一次';
COMMENT ON COLUMN pending_coupons.isReferral IS '是否顯示為推薦商家';
COMMENT ON COLUMN pending_coupons.tags IS '標籤，用於分類和搜尋';
COMMENT ON COLUMN pending_coupons.position IS '商家位置經緯度，格式：lat, lng';