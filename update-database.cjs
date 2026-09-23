const { databaseUrl } = require('./utils/database-config.cjs');
require('dotenv').config();
const { Pool } = require('pg');

// 使用與 server/utils/db.js 相同的連線設定
const pool = new Pool({
  connectionString: databaseUrl('homestay'),
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function updateDatabase() {
  const client = await pool.connect();
  
  try {
    console.log('開始更新資料庫...');
    
    // 添加 google_place_id 欄位
    await client.query('ALTER TABLE places ADD COLUMN IF NOT EXISTS google_place_id VARCHAR(255)');
    console.log('✅ 添加 google_place_id 欄位');
    
    // 添加索引
    await client.query('CREATE INDEX IF NOT EXISTS idx_places_google_place_id ON places(google_place_id)');
    console.log('✅ 添加索引');
    
    // 更新現有資料
    const result = await client.query('UPDATE places SET google_place_id = place_id WHERE google_place_id IS NULL AND place_id IS NOT NULL');
    console.log(`✅ 更新現有資料 (${result.rowCount} 筆)`);
    
    console.log('🎉 資料庫更新完成');
  } catch (error) {
    console.error('❌ 更新失敗:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

updateDatabase();
