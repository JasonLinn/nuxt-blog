import { pool } from './server/utils/db.js';

async function createTables() {
  const client = await pool.connect();
  
  try {
    console.log('🔍 檢查現有表格...');
    
    // 檢查現有表格
    const existingTables = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('places', 'place_categories', 'place_images', 'itineraries', 'itinerary_items')
    `);
    
    console.log('📋 現有表格:', existingTables.rows.map(r => r.table_name));
    
    // 建立地點分類表
    console.log('📝 建立 place_categories 表...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS place_categories (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        icon VARCHAR(50),
        color VARCHAR(20),
        description TEXT,
        sort_order INTEGER DEFAULT 0,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // 建立地點表
    console.log('📝 建立 places 表...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS places (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        category_id INTEGER REFERENCES place_categories(id),
        description TEXT,
        formatted_address TEXT,
        latitude DECIMAL(10, 8),
        longitude DECIMAL(11, 8),
        place_id VARCHAR(255) UNIQUE,
        phone_number VARCHAR(50),
        website VARCHAR(500),
        business_status VARCHAR(50),
        rating DECIMAL(3, 2),
        user_ratings_total INTEGER,
        price_level INTEGER,
        opening_hours JSONB,
        photos JSONB,
        place_types JSONB,
        tips TEXT,
        recommended_duration INTEGER DEFAULT 60,
        best_visit_time VARCHAR(100),
        tags JSONB,
        features JSONB,
        is_featured BOOLEAN DEFAULT false,
        is_private BOOLEAN DEFAULT false,
        view_count INTEGER DEFAULT 0,
        status VARCHAR(20) DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        approved_at TIMESTAMP,
        approved_by VARCHAR(100)
      )
    `);
    
    // 建立地點圖片表
    console.log('📝 建立 place_images 表...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS place_images (
        id SERIAL PRIMARY KEY,
        place_id INTEGER REFERENCES places(id) ON DELETE CASCADE,
        image_url VARCHAR(500) NOT NULL,
        caption TEXT,
        is_primary BOOLEAN DEFAULT false,
        sort_order INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // 建立行程表
    console.log('📝 建立 itineraries 表...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS itineraries (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        start_date DATE NOT NULL,
        end_date DATE NOT NULL,
        is_public BOOLEAN DEFAULT false,
        created_by VARCHAR(100),
        total_duration INTEGER,
        estimated_budget DECIMAL(10, 2),
        transportation_type VARCHAR(50),
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // 建立行程項目表
    console.log('📝 建立 itinerary_items 表...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS itinerary_items (
        id SERIAL PRIMARY KEY,
        itinerary_id INTEGER REFERENCES itineraries(id) ON DELETE CASCADE,
        place_id INTEGER REFERENCES places(id),
        day_number INTEGER NOT NULL,
        start_time TIME,
        end_time TIME,
        duration INTEGER,
        notes TEXT,
        sort_order INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // 插入預設分類
    console.log('📝 插入預設分類資料...');
    await client.query(`
      INSERT INTO place_categories (name, icon, color, sort_order) VALUES
      ('景點', 'mdi:camera', '#e74c3c', 1),
      ('美食', 'mdi:food', '#f39c12', 2),
      ('購物', 'mdi:shopping', '#9b59b6', 3),
      ('住宿', 'mdi:bed', '#3498db', 4),
      ('交通', 'mdi:car', '#2ecc71', 5),
      ('娛樂', 'mdi:gamepad-variant', '#e67e22', 6)
      ON CONFLICT DO NOTHING
    `);
    
    // 建立索引
    console.log('📝 建立索引...');
    await client.query('CREATE INDEX IF NOT EXISTS idx_places_category ON places(category_id)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_places_status ON places(status)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_places_location ON places(latitude, longitude)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_itinerary_items_itinerary ON itinerary_items(itinerary_id)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_itinerary_items_day ON itinerary_items(day_number)');
    
    console.log('✅ 資料庫表格建立完成！');
    
    // 顯示最終狀態
    const finalTables = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('places', 'place_categories', 'place_images', 'itineraries', 'itinerary_items')
    `);
    
    console.log('🎉 行程規劃資料庫已準備完成！');
    console.log('📋 建立的表格:', finalTables.rows.map(r => r.table_name));
    
  } catch (error) {
    console.error('❌ 建立表格失敗:', error);
  } finally {
    client.release();
  }
}

createTables().catch(console.error);
