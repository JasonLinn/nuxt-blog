const { databaseUrl } = require('../utils/database-config.cjs');
const { Pool, neonConfig } = require('@neondatabase/serverless')
const fs = require('fs')
const path = require('path')
const ws = require('ws')

// 配置 WebSocket
if (typeof window === 'undefined') {
  neonConfig.webSocketConstructor = ws
}

// 資料庫連接配置
const connectionString = databaseUrl('homestay')
const pool = new Pool({ 
  connectionString,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
})

async function runHomestaysMigration() {
  try {
    console.log('🔄 開始執行 homestays 表遷移...')
    
    // 測試連接
    console.log('📡 測試資料庫連接...')
    await pool.query('SELECT 1')
    console.log('✅ 資料庫連接成功')
    
    // 讀取遷移 SQL 腳本
    const migrationScript = fs.readFileSync(path.join(__dirname, 'migrate-homestays-simple.sql'), 'utf8')
    
    // 執行遷移腳本
    console.log('📄 執行遷移腳本...')
    await pool.query(migrationScript)
    console.log('✅ 遷移腳本執行完成！')
    
    // 驗證遷移結果
    console.log('🔍 驗證遷移結果...')
    
    const columnsResult = await pool.query(`
      SELECT column_name, data_type, is_nullable, column_default 
      FROM information_schema.columns 
      WHERE table_name = 'homestays' 
      AND table_schema = 'public'
      ORDER BY ordinal_position
    `)
    
    console.log('📊 更新後的 homestays 表結構:')
    columnsResult.rows.forEach(col => {
      console.log(`  - ${col.column_name}: ${col.data_type} ${col.is_nullable === 'NO' ? 'NOT NULL' : ''} ${col.column_default ? `DEFAULT ${col.column_default}` : ''}`)
    })
    
    // 檢查 status 欄位統計
    try {
      const statusResult = await pool.query(`
        SELECT status, COUNT(*) as count 
        FROM homestays 
        GROUP BY status 
        ORDER BY status
      `)
      
      console.log('\n📊 民宿狀態統計:')
      statusResult.rows.forEach(row => {
        console.log(`  - ${row.status}: ${row.count} 筆`)
      })
    } catch (err) {
      console.log('⚠️ 無法取得狀態統計（可能 status 欄位尚未完全生效）')
    }
    
    // 檢查範例資料
    const sampleResult = await pool.query('SELECT id, name, email, status FROM homestays LIMIT 3')
    console.log('\n📄 範例資料:')
    sampleResult.rows.forEach((row, index) => {
      console.log(`  ${index + 1}. ID: ${row.id}, Name: ${row.name}, Email: ${row.email}, Status: ${row.status}`)
    })
    
    console.log('\n🎉 homestays 表遷移完成！')
    console.log('💡 現在你可以：')
    console.log('   1. 啟動開發伺服器: npm run dev')
    console.log('   2. 訪問管理員頁面: http://localhost:3000/admin-login')
    console.log('   3. 使用帳號 admin / 密碼 admin123 登入')
    console.log('   4. 民宿業者可以用 ID + 密碼 B{ID} 登入')
    
  } catch (error) {
    console.error('❌ 遷移執行失敗:', error.message)
    console.error('詳細錯誤:', error)
    process.exit(1)
  } finally {
    await pool.end()
  }
}

// 執行遷移
runHomestaysMigration() 