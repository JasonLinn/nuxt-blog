-- 建立待審核優惠券表
CREATE TABLE IF NOT EXISTS pending_coupons (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    discount_type VARCHAR(20) DEFAULT 'percentage' CHECK (discount_type IN ('percentage', 'fixed')),
    discount_value DECIMAL(10,2),
    business_name VARCHAR(255) NOT NULL,
    category VARCHAR(100),
    township VARCHAR(100),
    address TEXT,
    phone VARCHAR(20),
    website TEXT,
    cover_image TEXT,
    valid_from DATE,
    valid_until DATE,
    min_purchase DECIMAL(10,2) DEFAULT 0,
    max_usage INTEGER,
    usage_notes TEXT,
    submitter_name VARCHAR(255) NOT NULL,
    submitter_phone VARCHAR(20) NOT NULL,
    submitter_email VARCHAR(255),
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 建立正式優惠券表（如果不存在）
CREATE TABLE IF NOT EXISTS coupons (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    discount_type VARCHAR(20) DEFAULT 'percentage' CHECK (discount_type IN ('percentage', 'fixed')),
    discount_value DECIMAL(10,2),
    business_name VARCHAR(255) NOT NULL,
    category VARCHAR(100),
    township VARCHAR(100),
    address TEXT,
    phone VARCHAR(20),
    website TEXT,
    cover_image TEXT,
    valid_from DATE,
    valid_until DATE,
    min_purchase DECIMAL(10,2) DEFAULT 0,
    max_usage INTEGER,
    usage_count INTEGER DEFAULT 0,
    usage_notes TEXT,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'expired')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 建立索引以提升查詢效能
CREATE INDEX IF NOT EXISTS idx_pending_coupons_status ON pending_coupons(status);
CREATE INDEX IF NOT EXISTS idx_pending_coupons_created_at ON pending_coupons(created_at);
CREATE INDEX IF NOT EXISTS idx_coupons_status ON coupons(status);
CREATE INDEX IF NOT EXISTS idx_coupons_category ON coupons(category);
CREATE INDEX IF NOT EXISTS idx_coupons_township ON coupons(township);
CREATE INDEX IF NOT EXISTS idx_coupons_valid_until ON coupons(valid_until);

-- 建立觸發器自動更新 updated_at 欄位
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 為兩個表建立觸發器
DROP TRIGGER IF EXISTS update_pending_coupons_updated_at ON pending_coupons;
CREATE TRIGGER update_pending_coupons_updated_at
    BEFORE UPDATE ON pending_coupons
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_coupons_updated_at ON coupons;
CREATE TRIGGER update_coupons_updated_at
    BEFORE UPDATE ON coupons
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 為上傳目錄設定註解
COMMENT ON TABLE pending_coupons IS '待審核優惠券表，存放使用者提交的優惠券申請';
COMMENT ON TABLE coupons IS '正式優惠券表，存放已核准的優惠券';
COMMENT ON COLUMN pending_coupons.cover_image IS '封面圖片路徑，存放在 /uploads/coupons/ 目錄下';
COMMENT ON COLUMN coupons.cover_image IS '封面圖片路徑，存放在 /uploads/coupons/ 目錄下';