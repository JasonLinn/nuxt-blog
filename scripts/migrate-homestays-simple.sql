-- 簡化版本的 homestays 表遷移腳本
-- 為現有的 homestays 表添加缺少的欄位

-- 添加 email 欄位
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='homestays' AND column_name='email') THEN
        ALTER TABLE homestays ADD COLUMN email VARCHAR(255);
        UPDATE homestays SET email = 'homestay' || id || '@example.com' WHERE email IS NULL;
        ALTER TABLE homestays ALTER COLUMN email SET NOT NULL;
        ALTER TABLE homestays ADD CONSTRAINT homestays_email_unique UNIQUE (email);
    END IF;
END $$;

-- 添加 password_hash 欄位
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='homestays' AND column_name='password_hash') THEN
        ALTER TABLE homestays ADD COLUMN password_hash VARCHAR(255);
        UPDATE homestays SET password_hash = '$2b$12$placeholder.hash.for.password.B' || id WHERE password_hash IS NULL;
        ALTER TABLE homestays ALTER COLUMN password_hash SET NOT NULL;
    END IF;
END $$;

-- 添加 status 欄位
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='homestays' AND column_name='status') THEN
        ALTER TABLE homestays ADD COLUMN status VARCHAR(20) DEFAULT 'approved';
        UPDATE homestays SET status = 'approved' WHERE status IS NULL;
    END IF;
END $$;

-- 添加其他欄位
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='homestays' AND column_name='phone') THEN
        ALTER TABLE homestays ADD COLUMN phone VARCHAR(50);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='homestays' AND column_name='website') THEN
        ALTER TABLE homestays ADD COLUMN website VARCHAR(500);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='homestays' AND column_name='capacity_description') THEN
        ALTER TABLE homestays ADD COLUMN capacity_description TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='homestays' AND column_name='min_price') THEN
        ALTER TABLE homestays ADD COLUMN min_price DECIMAL(10,2);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='homestays' AND column_name='max_price') THEN
        ALTER TABLE homestays ADD COLUMN max_price DECIMAL(10,2);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='homestays' AND column_name='approved_at') THEN
        ALTER TABLE homestays ADD COLUMN approved_at TIMESTAMP;
        UPDATE homestays SET approved_at = created_at WHERE approved_at IS NULL;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='homestays' AND column_name='approved_by') THEN
        ALTER TABLE homestays ADD COLUMN approved_by VARCHAR(100);
        UPDATE homestays SET approved_by = 'system' WHERE approved_by IS NULL;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='homestays' AND column_name='rejection_reason') THEN
        ALTER TABLE homestays ADD COLUMN rejection_reason TEXT;
    END IF;
END $$;

-- 創建索引
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='homestays' AND column_name='status') THEN
        CREATE INDEX IF NOT EXISTS idx_homestays_status ON homestays(status);
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_homestays_location ON homestays(location);
CREATE INDEX IF NOT EXISTS idx_homestays_city ON homestays(city);
CREATE INDEX IF NOT EXISTS idx_homestays_created_at ON homestays(created_at);

-- 更新現有資料的範例值
UPDATE homestays SET 
    min_price = 2000,
    max_price = 5000,
    capacity_description = '舒適的住宿環境，適合家庭或朋友出遊'
WHERE min_price IS NULL; 