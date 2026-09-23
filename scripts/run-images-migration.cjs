const { databaseUrl } = require('../utils/database-config.cjs');
const { Pool, neonConfig } = require('@neondatabase/serverless');
const fs = require('fs');
const path = require('path');

// 添加 WebSocket 支持
const ws = require('ws');

// 在 Node.js 環境中配置 WebSocket
if (typeof window === 'undefined') {
  neonConfig.webSocketConstructor = ws;
}

// 資料庫連接設置
const connectionString = databaseUrl('homestay');

const pool = new Pool({ 
  connectionString,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});

async function runMigration() {
  console.log('🚀 開始執行民宿圖片欄位遷移...');
  
  try {
    // 讀取遷移 SQL 文件
    const migrationSQL = fs.readFileSync(path.join(__dirname, 'add-images-column.sql'), 'utf8');
    
    // 連接到資料庫
    const client = await pool.connect();
    
    try {
      console.log('📡 已連接到資料庫');
      
      // 執行遷移
      const result = await client.query(migrationSQL);
      
      console.log('✅ 遷移執行成功！');
      console.log('📊 結果:', result);
      
      // 驗證新欄位是否成功添加
      const verifyQuery = `
        SELECT column_name, data_type, is_nullable 
        FROM information_schema.columns 
        WHERE table_name = 'homestays' 
        AND column_name IN ('images', 'updated_at')
        ORDER BY column_name;
      `;
      
      const verifyResult = await client.query(verifyQuery);
      
      if (verifyResult.rows.length > 0) {
        console.log('✅ 新欄位驗證成功:');
        verifyResult.rows.forEach(row => {
          console.log(`  - ${row.column_name}: ${row.data_type} (nullable: ${row.is_nullable})`);
        });
      } else {
        console.log('⚠️  警告: 未找到新添加的欄位');
      }
      
      // 檢查現有資料的遷移情況
      const dataCheckQuery = `
        SELECT 
          COUNT(*) as total_records,
          COUNT(images) as records_with_images,
          COUNT(image_url) as records_with_image_url
        FROM homestays;
      `;
      
      const dataCheckResult = await client.query(dataCheckQuery);
      
      if (dataCheckResult.rows.length > 0) {
        const stats = dataCheckResult.rows[0];
        console.log('📈 資料統計:');
        console.log(`  - 總記錄數: ${stats.total_records}`);
        console.log(`  - 有圖片陣列的記錄: ${stats.records_with_images}`);
        console.log(`  - 有原始圖片URL的記錄: ${stats.records_with_image_url}`);
      }
      
    } finally {
      client.release();
    }
    
  } catch (error) {
    console.error('❌ 遷移失敗:', error);
    process.exit(1);
  } finally {
    await pool.end();
    console.log('🔌 資料庫連接已關閉');
  }
}

// 執行遷移
runMigration()
  .then(() => {
    console.log('🎉 遷移完成！');
    process.exit(0);
  })
  .catch(error => {
    console.error('💥 遷移過程中發生錯誤:', error);
    process.exit(1);
  }); 