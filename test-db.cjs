const { databaseUrl } = require('./utils/database-config.cjs');
const { Client } = require('pg');

async function testDb() {
const connectionString = databaseUrl('homestay');

const client = new Client({
  connectionString: connectionString
});

  try {
    await client.connect();
    console.log('🔧 新增缺少的 organizer_contact 欄位...');
    
    await client.query(`
      ALTER TABLE yilan_activities 
      ADD COLUMN IF NOT EXISTS organizer_contact text
    `);
    
    console.log('✅ organizer_contact 欄位已新增');
    
    // 檢查一筆記錄的詳細資訊
    const result = await client.query('SELECT * FROM yilan_activities WHERE id = 1');
    if (result.rows.length > 0) {
      console.log('📋 記錄 ID 1 的數據:');
      console.log('  - ID:', result.rows[0].id);
      console.log('  - 標題:', result.rows[0].title);
      console.log('  - 描述:', result.rows[0].description);
      console.log('  - 狀態:', result.rows[0].status);
      console.log('  - 主辦人:', result.rows[0].organizer_name);
      console.log('  - 信箱:', result.rows[0].organizer_email);
      console.log('  - 圖片:', result.rows[0].images);
    }
    
  } catch (error) {
    console.error('❌ 錯誤:', error.message);
  } finally {
    await client.end();
  }
}

testDb();
