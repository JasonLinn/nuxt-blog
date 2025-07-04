-- 為現有的 homestays 表添加缺少的欄位
-- 注意：現有的 id 是 VARCHAR 類型，我們保持不變以兼容現有資料

-- 添加 email 欄位（必須唯一）
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='homestays' AND column_name='email') THEN
        ALTER TABLE homestays ADD COLUMN email VARCHAR(255);
        
        -- 為現有資料設置預設 email（基於 id）
        UPDATE homestays SET email = 'homestay' || id || '@example.com' WHERE email IS NULL;
        
        -- 設置為 NOT NULL 並添加唯一約束
        ALTER TABLE homestays ALTER COLUMN email SET NOT NULL;
        ALTER TABLE homestays ADD CONSTRAINT homestays_email_unique UNIQUE (email);
        
        -- ✅ 已添加 email 欄位
    ELSE
        -- ⚠️ email 欄位已存在
    END IF;
END $$;

-- 添加 password_hash 欄位
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='homestays' AND column_name='password_hash') THEN
        ALTER TABLE homestays ADD COLUMN password_hash VARCHAR(255);
        
        -- 為現有資料設置預設密碼 hash（B + id）
        -- 這裡使用簡單的字串，實際環境中應該是加密的 hash
        UPDATE homestays SET password_hash = '$2b$12$placeholder.hash.for.password.B' || id WHERE password_hash IS NULL;
        
        ALTER TABLE homestays ALTER COLUMN password_hash SET NOT NULL;
        
        RAISE NOTICE '✅ 已添加 password_hash 欄位';
    ELSE
        RAISE NOTICE '⚠️ password_hash 欄位已存在';
    END IF;
END $$;

-- 添加 status 欄位
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='homestays' AND column_name='status') THEN
        ALTER TABLE homestays ADD COLUMN status VARCHAR(20) DEFAULT 'approved' CHECK (status IN ('pending', 'approved', 'rejected'));
        
        -- 現有的民宿都設為已批准狀態
        UPDATE homestays SET status = 'approved' WHERE status IS NULL;
        
        RAISE NOTICE '✅ 已添加 status 欄位';
    ELSE
        RAISE NOTICE '⚠️ status 欄位已存在';
    END IF;
END $$;

-- 添加電話欄位
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='homestays' AND column_name='phone') THEN
        ALTER TABLE homestays ADD COLUMN phone VARCHAR(50);
        RAISE NOTICE '✅ 已添加 phone 欄位';
    ELSE
        RAISE NOTICE '⚠️ phone 欄位已存在';
    END IF;
END $$;

-- 添加網站欄位
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='homestays' AND column_name='website') THEN
        ALTER TABLE homestays ADD COLUMN website VARCHAR(500);
        RAISE NOTICE '✅ 已添加 website 欄位';
    ELSE
        RAISE NOTICE '⚠️ website 欄位已存在';
    END IF;
END $$;

-- 添加容量描述欄位
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='homestays' AND column_name='capacity_description') THEN
        ALTER TABLE homestays ADD COLUMN capacity_description TEXT;
        RAISE NOTICE '✅ 已添加 capacity_description 欄位';
    ELSE
        RAISE NOTICE '⚠️ capacity_description 欄位已存在';
    END IF;
END $$;

-- 添加價格欄位
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='homestays' AND column_name='min_price') THEN
        ALTER TABLE homestays ADD COLUMN min_price DECIMAL(10,2);
        RAISE NOTICE '✅ 已添加 min_price 欄位';
    ELSE
        RAISE NOTICE '⚠️ min_price 欄位已存在';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='homestays' AND column_name='max_price') THEN
        ALTER TABLE homestays ADD COLUMN max_price DECIMAL(10,2);
        RAISE NOTICE '✅ 已添加 max_price 欄位';
    ELSE
        RAISE NOTICE '⚠️ max_price 欄位已存在';
    END IF;
END $$;

-- 添加審核相關欄位
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='homestays' AND column_name='approved_at') THEN
        ALTER TABLE homestays ADD COLUMN approved_at TIMESTAMP;
        
        -- 現有的民宿設為已在創建時間批准
        UPDATE homestays SET approved_at = created_at WHERE approved_at IS NULL;
        
        RAISE NOTICE '✅ 已添加 approved_at 欄位';
    ELSE
        RAISE NOTICE '⚠️ approved_at 欄位已存在';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='homestays' AND column_name='approved_by') THEN
        ALTER TABLE homestays ADD COLUMN approved_by VARCHAR(100);
        
        -- 現有的民宿設為系統批准
        UPDATE homestays SET approved_by = 'system' WHERE approved_by IS NULL;
        
        RAISE NOTICE '✅ 已添加 approved_by 欄位';
    ELSE
        RAISE NOTICE '⚠️ approved_by 欄位已存在';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='homestays' AND column_name='rejection_reason') THEN
        ALTER TABLE homestays ADD COLUMN rejection_reason TEXT;
        RAISE NOTICE '✅ 已添加 rejection_reason 欄位';
    ELSE
        RAISE NOTICE '⚠️ rejection_reason 欄位已存在';
    END IF;
END $$;

-- 創建索引以提高查詢效能
DO $$
BEGIN
    -- 檢查 status 欄位存在才創建索引
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='homestays' AND column_name='status') THEN
        CREATE INDEX IF NOT EXISTS idx_homestays_status ON homestays(status);
        RAISE NOTICE '✅ 已創建 status 索引';
    END IF;
    
    CREATE INDEX IF NOT EXISTS idx_homestays_location ON homestays(location);
    CREATE INDEX IF NOT EXISTS idx_homestays_city ON homestays(city);
    CREATE INDEX IF NOT EXISTS idx_homestays_created_at ON homestays(created_at);
    CREATE INDEX IF NOT EXISTS idx_homestay_types_homestay_id ON homestay_types(homestay_id);
    
    RAISE NOTICE '✅ 已創建基本索引';
END $$;

-- 更新現有資料的範例值
UPDATE homestays SET 
    min_price = 2000,
    max_price = 5000,
    capacity_description = '舒適的住宿環境，適合家庭或朋友出遊'
WHERE min_price IS NULL;

RAISE NOTICE '🎉 homestays 表遷移完成！';

COMMIT; 