-- 添加社群媒體欄位到 homestays 資料表
-- 新增 LINE、Instagram、Facebook 連結欄位

-- 檢查資料表是否存在
DO $$
BEGIN
    -- 檢查資料表是否存在
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'homestays') THEN
        -- 檢查 social_line 欄位是否已存在
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'homestays' AND column_name = 'social_line') THEN
            ALTER TABLE homestays ADD COLUMN social_line VARCHAR(500);
        END IF;
        
        -- 檢查 social_instagram 欄位是否已存在
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'homestays' AND column_name = 'social_instagram') THEN
            ALTER TABLE homestays ADD COLUMN social_instagram VARCHAR(500);
        END IF;
        
        -- 檢查 social_facebook 欄位是否已存在
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'homestays' AND column_name = 'social_facebook') THEN
            ALTER TABLE homestays ADD COLUMN social_facebook VARCHAR(500);
        END IF;
        
        RAISE NOTICE '社群媒體欄位已成功添加到 homestays 資料表';
    ELSE
        RAISE NOTICE 'homestays 資料表不存在';
    END IF;
END
$$; 