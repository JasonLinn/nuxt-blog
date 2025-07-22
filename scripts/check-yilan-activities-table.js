import { pool } from '../server/utils/db.js';

async function checkYilanActivitiesTable() {
  console.log('🔍 檢查 yilan_activities 資料表結構...');
  
  try {
    const client = await pool.connect();
    
    // 檢查資料表是否存在
    const tableCheck = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_name = 'yilan_activities'
    `);
    
    if (tableCheck.rows.length === 0) {
      console.log('❌ yilan_activities 資料表不存在');
      client.release();
      return;
    }
    
    console.log('✅ yilan_activities 資料表存在');
    
    // 檢查資料表結構
    const columnCheck = await client.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'yilan_activities' 
      ORDER BY ordinal_position
    `);
    
    console.log('📋 yilan_activities 資料表結構:');
    const columnNames = [];
    columnCheck.rows.forEach(col => {
      columnNames.push(col.column_name);
      console.log(`  - ${col.column_name}: ${col.data_type} (${col.is_nullable === 'YES' ? 'nullable' : 'not null'})`);
    });
    
    // 檢查是否缺少 organizer_contact 欄位
    if (!columnNames.includes('organizer_contact')) {
      console.log('❌ 缺少 organizer_contact 欄位');
      console.log('💡 需要新增此欄位到資料表');
    } else {
      console.log('✅ organizer_contact 欄位存在');
    }
    
    // 檢查現有記錄數量
    const countResult = await client.query('SELECT COUNT(*) as total FROM yilan_activities');
    console.log(`📊 現有記錄數量: ${countResult.rows[0].total}`);
    
    // 如果有記錄，顯示前幾筆的 ID
    if (parseInt(countResult.rows[0].total) > 0) {
      const sampleResult = await client.query('SELECT id, title FROM yilan_activities ORDER BY id LIMIT 5');
      console.log('📋 現有記錄樣本:');
      sampleResult.rows.forEach(row => {
        console.log(`  - ID: ${row.id}, 標題: ${row.title}`);
      });
    }
    
    client.release();
    console.log('🔚 資料表檢查完成');
    
  } catch (error) {
    console.error('❌ 檢查資料表時發生錯誤:', error.message);
    console.error('錯誤詳情:', error);
  }
}

// 執行檢查
checkYilanActivitiesTable();
