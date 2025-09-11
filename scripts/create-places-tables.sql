-- 建立地點分類表
CREATE TABLE IF NOT EXISTS place_categories (
  id SERIAL PRIMARY KEY,
  name VARCHAR(50) NOT NULL UNIQUE,
  icon VARCHAR(100),
  color VARCHAR(7) DEFAULT '#007bff',
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 建立地點資料表 (符合 Google Maps 格式)
CREATE TABLE IF NOT EXISTS places (
  id SERIAL PRIMARY KEY,
  google_place_id VARCHAR(255) UNIQUE, -- Google Places API 的 place_id
  name VARCHAR(255) NOT NULL,
  category_id INTEGER REFERENCES place_categories(id),
  description TEXT,
  
  -- Google Maps 地址資訊
  formatted_address TEXT,
  street_number VARCHAR(50),
  route VARCHAR(255),
  locality VARCHAR(100), -- 城市
  administrative_area_level_1 VARCHAR(100), -- 縣市
  administrative_area_level_2 VARCHAR(100), -- 區域
  country VARCHAR(100),
  postal_code VARCHAR(20),
  
  -- 座標資訊
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  
  -- Google Maps 詳細資訊
  phone_number VARCHAR(50),
  website VARCHAR(500),
  opening_hours JSONB, -- 營業時間
  price_level INTEGER, -- 價格等級 (0-4)
  rating DECIMAL(2, 1), -- 評分 (0.0-5.0)
  user_ratings_total INTEGER, -- 評論數量
  
  -- 圖片資訊
  photos JSONB, -- Google Places 照片參考
  images JSONB, -- 自訂上傳的圖片
  
  -- 額外資訊
  tags JSONB, -- 標籤陣列
  features JSONB, -- 特色功能
  tips TEXT, -- 遊玩小貼士
  recommended_duration INTEGER, -- 建議停留時間(分鐘)
  best_visit_time VARCHAR(100), -- 最佳造訪時間
  
  -- 狀態管理
  status VARCHAR(20) DEFAULT 'pending', -- pending, approved, rejected
  is_featured BOOLEAN DEFAULT false, -- 是否為精選景點
  is_private BOOLEAN DEFAULT false, -- 是否為私房景點
  view_count INTEGER DEFAULT 0,
  
  -- 提交者資訊
  submitted_by VARCHAR(100), -- 提交者 (admin 或 user email)
  admin_notes TEXT, -- 管理員備註
  
  -- 時間戳記
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  approved_at TIMESTAMP WITH TIME ZONE
);

-- 建立行程表
CREATE TABLE IF NOT EXISTS itineraries (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  days INTEGER NOT NULL DEFAULT 1,
  total_places INTEGER DEFAULT 0,
  
  -- 行程資訊
  start_date DATE,
  end_date DATE,
  budget_min INTEGER,
  budget_max INTEGER,
  
  -- 目標族群
  target_audience JSONB, -- ["family", "couple", "solo", "group"]
  difficulty_level VARCHAR(20) DEFAULT 'easy', -- easy, medium, hard
  
  -- 狀態
  is_public BOOLEAN DEFAULT true,
  is_featured BOOLEAN DEFAULT false,
  view_count INTEGER DEFAULT 0,
  like_count INTEGER DEFAULT 0,
  
  -- 建立者
  created_by VARCHAR(100) DEFAULT 'admin',
  
  -- 時間戳記
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 建立行程地點關聯表
CREATE TABLE IF NOT EXISTS itinerary_places (
  id SERIAL PRIMARY KEY,
  itinerary_id INTEGER REFERENCES itineraries(id) ON DELETE CASCADE,
  place_id INTEGER REFERENCES places(id) ON DELETE CASCADE,
  day_number INTEGER NOT NULL,
  order_in_day INTEGER NOT NULL,
  
  -- 行程安排細節
  arrival_time TIME,
  departure_time TIME,
  duration_minutes INTEGER,
  notes TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  
  UNIQUE(itinerary_id, place_id),
  UNIQUE(itinerary_id, day_number, order_in_day)
);

-- 建立使用者收藏表
CREATE TABLE IF NOT EXISTS user_favorites (
  id SERIAL PRIMARY KEY,
  user_email VARCHAR(255),
  place_id INTEGER REFERENCES places(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  
  UNIQUE(user_email, place_id)
);

-- 插入預設分類
INSERT INTO place_categories (name, icon, color, description) VALUES 
('景點', 'mdi:map-marker', '#e74c3c', '觀光景點、名勝古蹟'),
('美食', 'mdi:food', '#f39c12', '餐廳、小吃、特色美食'),
('購物', 'mdi:shopping', '#9b59b6', '商場、市集、特色商店'),
('住宿', 'mdi:bed', '#3498db', '飯店、民宿、青年旅館'),
('交通', 'mdi:train', '#2ecc71', '車站、機場、交通樞紐'),
('娛樂', 'mdi:gamepad-variant', '#e67e22', '遊樂園、KTV、休閒娛樂'),
('自然', 'mdi:nature', '#27ae60', '公園、步道、自然景觀'),
('文化', 'mdi:library', '#8e44ad', '博物館、藝廊、文化場所')
ON CONFLICT (name) DO NOTHING;

-- 建立索引
CREATE INDEX IF NOT EXISTS idx_places_category ON places(category_id);
CREATE INDEX IF NOT EXISTS idx_places_location ON places(latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_places_status ON places(status);
CREATE INDEX IF NOT EXISTS idx_places_google_id ON places(google_place_id);
CREATE INDEX IF NOT EXISTS idx_itinerary_places_itinerary ON itinerary_places(itinerary_id);
CREATE INDEX IF NOT EXISTS idx_itinerary_places_day ON itinerary_places(day_number);
CREATE INDEX IF NOT EXISTS idx_user_favorites_user ON user_favorites(user_email);

-- 建立更新時間觸發器
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 為相關表格建立觸發器
DROP TRIGGER IF EXISTS update_places_updated_at ON places;
CREATE TRIGGER update_places_updated_at 
    BEFORE UPDATE ON places 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_place_categories_updated_at ON place_categories;
CREATE TRIGGER update_place_categories_updated_at 
    BEFORE UPDATE ON place_categories 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_itineraries_updated_at ON itineraries;
CREATE TRIGGER update_itineraries_updated_at 
    BEFORE UPDATE ON itineraries 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
