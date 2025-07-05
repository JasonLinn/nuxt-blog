-- 為 homestays 表添加 images 欄位
-- 此腳本為民宿多圖片功能的資料庫遷移

DO $$ 
BEGIN
    -- 添加 images 欄位（如果不存在）
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='homestays' AND column_name='images') THEN
        ALTER TABLE homestays ADD COLUMN images TEXT[];
        
        -- 更新已存在的記錄，將 image_url 轉換為 images 陣列
        UPDATE homestays 
        SET images = ARRAY[image_url] 
        WHERE image_url IS NOT NULL AND image_url != '';
        
        -- 為空的 image_url 設為空陣列
        UPDATE homestays 
        SET images = ARRAY[]::TEXT[] 
        WHERE image_url IS NULL OR image_url = '';
        
        -- 添加註釋
        COMMENT ON COLUMN homestays.images IS '民宿圖片URL陣列，支援多張圖片';
        
        RAISE NOTICE '成功添加 images 欄位到 homestays 表';
    ELSE
        RAISE NOTICE 'images 欄位已存在，跳過添加';
    END IF;
    
    -- 添加 updated_at 欄位（如果不存在）
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='homestays' AND column_name='updated_at') THEN
        ALTER TABLE homestays ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
        
        -- 初始化現有記錄的 updated_at
        UPDATE homestays SET updated_at = created_at WHERE updated_at IS NULL;
        
        RAISE NOTICE '成功添加 updated_at 欄位到 homestays 表';
    ELSE
        RAISE NOTICE 'updated_at 欄位已存在，跳過添加';
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
        
        RAISE NOTICE '成功創建 homestays_updated_at_trigger 觸發器';
    ELSE
        RAISE NOTICE 'homestays_updated_at_trigger 觸發器已存在，跳過創建';
    END IF;
END $$;

COMMIT; 