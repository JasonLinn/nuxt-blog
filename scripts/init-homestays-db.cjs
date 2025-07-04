const { Pool, neonConfig } = require('@neondatabase/serverless')
const fs = require('fs')
const path = require('path')
const ws = require('ws')

// 配置 WebSocket
if (typeof window === 'undefined') {
  neonConfig.webSocketConstructor = ws
}

// 資料庫連接配置
const connectionString = process.env.DATABASE_URL || 'postgresql://neondb_owner:npg_DSt86GUynwli@ep-fancy-snow-a8232ddc-pooler.eastus2.azure.neon.tech/neondb?sslmode=require'
const pool = new Pool({ 
  connectionString,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
})

async function initHomestaysDatabase() {
  try {
    console.log('🚀 開始初始化民宿資料庫...')
    
    // 測試連接
    console.log('📡 測試資料庫連接...')
    await pool.query('SELECT 1')
    console.log('✅ 資料庫連接成功')
    
    // 讀取 SQL 腳本
    const sqlScript = fs.readFileSync(path.join(__dirname, 'create-homestays-table.sql'), 'utf8')
    
    // 執行 SQL 腳本
    console.log('📄 執行資料庫初始化腳本...')
    await pool.query(sqlScript)
    console.log('✅ 資料庫初始化完成！')
    
    // 驗證表是否成功創建
    console.log('🔍 驗證表結構...')
    
    const tablesResult = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('homestays', 'homestay_types')
      ORDER BY table_name
    `)
    
    console.log('📋 已創建的表:', tablesResult.rows.map(row => row.table_name))
    
    // 檢查欄位
    const columnsResult = await pool.query(`
      SELECT column_name, data_type, is_nullable, column_default 
      FROM information_schema.columns 
      WHERE table_name = 'homestays' 
      AND table_schema = 'public'
      ORDER BY ordinal_position
    `)
    
    console.log('📊 homestays 表結構:')
    columnsResult.rows.forEach(col => {
      console.log(`  - ${col.column_name}: ${col.data_type} ${col.is_nullable === 'NO' ? 'NOT NULL' : ''} ${col.column_default ? `DEFAULT ${col.column_default}` : ''}`)
    })
    
    // 檢查資料
    const dataResult = await pool.query('SELECT COUNT(*) as count FROM homestays')
    console.log(`📈 民宿資料筆數: ${dataResult.rows[0].count}`)
    
    const statusResult = await pool.query(`
      SELECT status, COUNT(*) as count 
      FROM homestays 
      GROUP BY status 
      ORDER BY status
    `)
    
    console.log('📊 民宿狀態統計:')
    statusResult.rows.forEach(row => {
      console.log(`  - ${row.status}: ${row.count} 筆`)
    })
    
    console.log('\n🎉 民宿資料庫初始化完成！')
    console.log('💡 現在你可以：')
    console.log('   1. 啟動開發伺服器: npm run dev')
    console.log('   2. 訪問管理員頁面: http://localhost:3000/admin-login')
    console.log('   3. 使用帳號 admin / 密碼 admin123 登入')
    
  } catch (error) {
    console.error('❌ 資料庫初始化失敗:', error.message)
    console.error('詳細錯誤:', error)
    process.exit(1)
  } finally {
    await pool.end()
  }
}

// 執行初始化
initHomestaysDatabase() 