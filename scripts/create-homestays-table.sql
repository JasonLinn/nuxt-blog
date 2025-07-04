-- 創建民宿表
CREATE TABLE IF NOT EXISTS homestays (
    id INTEGER PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    location VARCHAR(255) NOT NULL,
    city VARCHAR(100),
    image_url TEXT,
    website VARCHAR(500),
    phone VARCHAR(50),
    capacity_description TEXT,
    min_guests INTEGER,
    max_guests INTEGER,
    min_price DECIMAL(10,2),
    max_price DECIMAL(10,2),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    available BOOLEAN DEFAULT false,
    featured BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    approved_at TIMESTAMP,
    approved_by VARCHAR(100),
    rejection_reason TEXT
);

-- 如果表已存在但缺少欄位，則添加缺少的欄位
DO $$ 
BEGIN
    -- 添加 status 欄位（如果不存在）
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='homestays' AND column_name='status') THEN
        ALTER TABLE homestays ADD COLUMN status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected'));
    END IF;
    
    -- 添加 available 欄位（如果不存在）
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='homestays' AND column_name='available') THEN
        ALTER TABLE homestays ADD COLUMN available BOOLEAN DEFAULT false;
    END IF;
    
    -- 添加 featured 欄位（如果不存在）
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='homestays' AND column_name='featured') THEN
        ALTER TABLE homestays ADD COLUMN featured BOOLEAN DEFAULT false;
    END IF;
    
    -- 添加 approved_at 欄位（如果不存在）
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='homestays' AND column_name='approved_at') THEN
        ALTER TABLE homestays ADD COLUMN approved_at TIMESTAMP;
    END IF;
    
    -- 添加 approved_by 欄位（如果不存在）
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='homestays' AND column_name='approved_by') THEN
        ALTER TABLE homestays ADD COLUMN approved_by VARCHAR(100);
    END IF;
    
    -- 添加 rejection_reason 欄位（如果不存在）
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='homestays' AND column_name='rejection_reason') THEN
        ALTER TABLE homestays ADD COLUMN rejection_reason TEXT;
    END IF;
    
    -- 添加 min_price 欄位（如果不存在）
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='homestays' AND column_name='min_price') THEN
        ALTER TABLE homestays ADD COLUMN min_price DECIMAL(10,2);
    END IF;
    
    -- 添加 max_price 欄位（如果不存在）
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='homestays' AND column_name='max_price') THEN
        ALTER TABLE homestays ADD COLUMN max_price DECIMAL(10,2);
    END IF;
END $$;

-- 創建民宿類型表
CREATE TABLE IF NOT EXISTS homestay_types (
    id SERIAL PRIMARY KEY,
    homestay_id INTEGER REFERENCES homestays(id) ON DELETE CASCADE,
    type_name VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(homestay_id, type_name)
);

-- 創建索引以提高查詢效能（只在欄位存在時創建）
DO $$
BEGIN
    -- 檢查 status 欄位存在才創建索引
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='homestays' AND column_name='status') THEN
        CREATE INDEX IF NOT EXISTS idx_homestays_status ON homestays(status);
    END IF;
    
    CREATE INDEX IF NOT EXISTS idx_homestays_location ON homestays(location);
    CREATE INDEX IF NOT EXISTS idx_homestays_city ON homestays(city);
    CREATE INDEX IF NOT EXISTS idx_homestays_created_at ON homestays(created_at);
    CREATE INDEX IF NOT EXISTS idx_homestay_types_homestay_id ON homestay_types(homestay_id);
END $$;

-- 插入範例資料（如果表為空的話）
INSERT INTO homestays (id, name, location, city, email, password_hash, status, available, featured, min_guests, max_guests, min_price, max_price, capacity_description, phone, website, image_url)
SELECT * FROM (VALUES 
    (2591, '根本家民宿', '宜蘭市', '宜蘭縣', 'example2591@email.com', '$2b$12$placeholder.hash.for.password.B2591', 'approved', true, false, 2, 8, 2500, 5000, '溫馨家庭式民宿，提供舒適住宿環境', '03-1234567', 'https://example.com', 'https://example.com/image.jpg'),
    (2732, '甘瓜別墅', '礁溪鄉', '宜蘭縣', 'example2732@email.com', '$2b$12$placeholder.hash.for.password.B2732', 'approved', true, true, 4, 12, 3000, 8000, '豪華別墅式民宿，擁有私人溫泉', '03-2345678', 'https://example2.com', 'https://example.com/image2.jpg'),
    (1612, '蘆藈別墅', '羅東鎮', '宜蘭縣', 'example1612@email.com', '$2b$12$placeholder.hash.for.password.B1612', 'pending', false, false, 2, 6, 2000, 4000, '靠近羅東夜市的便利住宿', '03-3456789', null, null)
) AS v(id, name, location, city, email, password_hash, status, available, featured, min_guests, max_guests, min_price, max_price, capacity_description, phone, website, image_url)
WHERE NOT EXISTS (SELECT 1 FROM homestays LIMIT 1);

-- 插入民宿類型範例資料
INSERT INTO homestay_types (homestay_id, type_name)
SELECT * FROM (VALUES 
    (2591, '家庭式'),
    (2591, '溫泉'),
    (2732, '別墅'),
    (2732, '溫泉'),
    (2732, '豪華'),
    (1612, '經濟型'),
    (1612, '市區')
) AS v(homestay_id, type_name)
WHERE NOT EXISTS (SELECT 1 FROM homestay_types WHERE homestay_id = v.homestay_id AND type_name = v.type_name);

COMMIT; 