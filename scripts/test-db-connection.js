import { pool } from '../server/utils/db.js';

async function testDatabaseConnection() {
  console.log('🔍 測試資料庫連線...');
  
  try {
    const client = await pool.connect();
    console.log('✅ 資料庫連線成功');
    
    // 測試基本查詢
    const result = await client.query('SELECT NOW() as current_time');
    console.log('✅ 基本查詢測試成功:', result.rows[0].current_time);
    
    // 檢查 homestays 資料表是否存在
    const tableCheck = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_name = 'homestays'
    `);
    
    if (tableCheck.rows.length > 0) {
      console.log('✅ homestays 資料表存在');
      
      // 檢查資料表結構
      const columnCheck = await client.query(`
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns 
        WHERE table_name = 'homestays' 
        ORDER BY ordinal_position
      `);
      
      console.log('📋 homestays 資料表結構:');
      columnCheck.rows.forEach(col => {
        console.log(`  - ${col.column_name}: ${col.data_type} (${col.is_nullable === 'YES' ? 'nullable' : 'not null'})`);
      });
      
      // 檢查是否有任何現有記錄
      const countResult = await client.query('SELECT COUNT(*) as total FROM homestays');
      console.log(`📊 現有記錄數量: ${countResult.rows[0].total}`);
      
    } else {
      console.log('❌ homestays 資料表不存在');
      console.log('需要先建立資料表');
    }
    
    // 檢查 homestay_types 資料表
    const typesTableCheck = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_name = 'homestay_types'
    `);
    
    if (typesTableCheck.rows.length > 0) {
      console.log('✅ homestay_types 資料表存在');
    } else {
      console.log('⚠️ homestay_types 資料表不存在');
    }
    
    client.release();
    console.log('🔚 資料庫連線測試完成');
    
  } catch (error) {
    console.error('❌ 資料庫連線錯誤:', error.message);
    console.error('錯誤詳情:', error);
    
    // 如果是連線錯誤，提供一些建議
    if (error.message.includes('connect')) {
      console.log('💡 建議檢查：');
      console.log('  1. 網路連線是否正常');
      console.log('  2. 資料庫伺服器是否正常運作');
      console.log('  3. 連線字串是否正確');
    }
  }
}

// 執行測試
testDatabaseConnection();
