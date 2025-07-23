-- 為 homestays 表添加民宿註冊所需的缺少欄位
-- 這些欄位是支援民宿登入和註冊功能所必需的

DO $$ 
BEGIN
    -- 添加 min_guests 欄位
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='homestays' AND column_name='min_guests') THEN
        ALTER TABLE homestays ADD COLUMN min_guests INTEGER;
        RAISE NOTICE '✅ 已添加 min_guests 欄位';
    ELSE
        RAISE NOTICE '⚠️ min_guests 欄位已存在';
    END IF;
    
    -- 添加 max_guests 欄位
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='homestays' AND column_name='max_guests') THEN
        ALTER TABLE homestays ADD COLUMN max_guests INTEGER;
        RAISE NOTICE '✅ 已添加 max_guests 欄位';
    ELSE
        RAISE NOTICE '⚠️ max_guests 欄位已存在';
    END IF;
    
    -- 添加 email 欄位
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='homestays' AND column_name='email') THEN
        ALTER TABLE homestays ADD COLUMN email VARCHAR(255);
        
        -- 為現有記錄設置預設 email（基於 id）
        UPDATE homestays SET email = 'homestay' || id || '@example.com' WHERE email IS NULL;
        
        -- 設置為 NOT NULL 並添加唯一約束
        ALTER TABLE homestays ALTER COLUMN email SET NOT NULL;
        ALTER TABLE homestays ADD CONSTRAINT homestays_email_unique UNIQUE (email);
        
        RAISE NOTICE '✅ 已添加 email 欄位';
    ELSE
        RAISE NOTICE '⚠️ email 欄位已存在';
    END IF;
    
    -- 添加 password_hash 欄位
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='homestays' AND column_name='password_hash') THEN
        ALTER TABLE homestays ADD COLUMN password_hash VARCHAR(255);
        
        -- 為現有記錄設置預設密碼 hash（B + id）
        UPDATE homestays SET password_hash = '$2b$12$placeholder.hash.for.password.B' || id WHERE password_hash IS NULL;
        
        ALTER TABLE homestays ALTER COLUMN password_hash SET NOT NULL;
        
        RAISE NOTICE '✅ 已添加 password_hash 欄位';
    ELSE
        RAISE NOTICE '⚠️ password_hash 欄位已存在';
    END IF;
    
    -- 添加 updated_at 欄位
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='homestays' AND column_name='updated_at') THEN
        ALTER TABLE homestays ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
        
        -- 初始化現有記錄的 updated_at
        UPDATE homestays SET updated_at = created_at WHERE updated_at IS NULL;
        
        RAISE NOTICE '✅ 已添加 updated_at 欄位';
    ELSE
        RAISE NOTICE '⚠️ updated_at 欄位已存在';
    END IF;
END $$;

-- 創建一個函數來自動更新 updated_at 欄位
CREATE OR REPLACE FUNCTION update_homestays_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 創建觸發器（如果不存在）
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'homestays_updated_at_trigger') THEN
        CREATE TRIGGER homestays_updated_at_trigger
            BEFORE UPDATE ON homestays
            FOR EACH ROW
            EXECUTE FUNCTION update_homestays_updated_at();
        
        RAISE NOTICE '✅ 成功創建 homestays_updated_at_trigger 觸發器';
    ELSE
        RAISE NOTICE '⚠️ homestays_updated_at_trigger 觸發器已存在，跳過創建';
    END IF;
END $$;

-- 為 email 欄位創建索引
CREATE INDEX IF NOT EXISTS idx_homestays_email ON homestays(email);

COMMIT; 