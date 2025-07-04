const { Pool } = require('pg')
const fs = require('fs')
const path = require('path')

// 資料庫連接配置（根據您的實際配置調整）
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://username:password@localhost:5432/your_database',
})

async function runMigration() {
  try {
    console.log('開始執行資料庫遷移...')
    
    // 讀取 SQL 腳本
    const sqlScript = fs.readFileSync(path.join(__dirname, 'add-view-count.sql'), 'utf8')
    
    // 執行 SQL 腳本
    await pool.query(sqlScript)
    
    console.log('✅ 資料庫遷移完成！已添加 view_count 欄位。')
    
    // 驗證欄位是否成功添加
    const result = await pool.query(`
      SELECT column_name, data_type, is_nullable, column_default 
      FROM information_schema.columns 
      WHERE table_name = 'article' AND column_name = 'view_count'
    `)
    
    if (result.rows.length > 0) {
      console.log('✅ 驗證成功：view_count 欄位已存在')
      console.log('欄位資訊：', result.rows[0])
    } else {
      console.log('❌ 警告：無法找到 view_count 欄位')
    }
    
  } catch (error) {
    console.error('❌ 遷移執行失敗：', error.message)
    console.error('錯誤詳情：', error)
  } finally {
    await pool.end()
  }
}

// 執行遷移
runMigration() 