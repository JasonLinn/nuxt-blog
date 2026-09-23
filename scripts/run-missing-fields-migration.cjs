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

async function runMissingFieldsMigration() {
  try {
    console.log('🔄 開始執行民宿註冊欄位遷移...')
    
    // 測試連接
    console.log('📡 測試資料庫連接...')
    await pool.query('SELECT 1')
    console.log('✅ 資料庫連接成功')
    
    // 讀取遷移 SQL 腳本
    const migrationScript = fs.readFileSync(path.join(__dirname, 'add-missing-fields.sql'), 'utf8')
    
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
      AND column_name IN ('min_guests', 'max_guests', 'email', 'password_hash', 'updated_at')
      ORDER BY column_name
    `)
    
    console.log('📊 新添加的欄位:')
    columnsResult.rows.forEach(col => {
      console.log(`  ✅ ${col.column_name}: ${col.data_type} ${col.is_nullable === 'NO' ? 'NOT NULL' : ''} ${col.column_default ? `DEFAULT ${col.column_default}` : ''}`)
    })
    
    // 檢查完整的表結構
    const allColumnsResult = await pool.query(`
      SELECT column_name, data_type, is_nullable, column_default 
      FROM information_schema.columns 
      WHERE table_name = 'homestays' 
      AND table_schema = 'public'
      ORDER BY ordinal_position
    `)
    
    console.log('\n📋 完整的 homestays 表結構:')
    allColumnsResult.rows.forEach(col => {
      console.log(`  - ${col.column_name}: ${col.data_type} ${col.is_nullable === 'NO' ? 'NOT NULL' : ''} ${col.column_default ? `DEFAULT ${col.column_default}` : ''}`)
    })
    
    // 檢查範例資料
    const sampleResult = await pool.query('SELECT id, name, email, status FROM homestays LIMIT 3')
    console.log('\n📄 範例資料:')
    sampleResult.rows.forEach((row, index) => {
      console.log(`  ${index + 1}. ID: ${row.id}, Name: ${row.name}, Email: ${row.email}, Status: ${row.status}`)
    })
    
    console.log('\n🎉 民宿註冊欄位遷移完成！')
    console.log('💡 現在民宿註冊功能應該可以正常運作了')
    
  } catch (error) {
    console.error('❌ 遷移執行失敗:', error.message)
    console.error('詳細錯誤:', error)
    process.exit(1)
  } finally {
    await pool.end()
  }
}

// 執行遷移
runMissingFieldsMigration() 