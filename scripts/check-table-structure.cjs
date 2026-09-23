const { databaseUrl } = require('../utils/database-config.cjs');
const { Pool, neonConfig } = require('@neondatabase/serverless')
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

async function checkTableStructure() {
  try {
    console.log('🔍 檢查資料庫表結構...')
    
    // 檢查所有表
    const tablesResult = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `)
    
    console.log('📋 現有的表:')
    tablesResult.rows.forEach(row => {
      console.log(`  - ${row.table_name}`)
    })
    
    // 檢查 homestays 表是否存在
    const homestaysExists = tablesResult.rows.some(row => row.table_name === 'homestays')
    
    if (homestaysExists) {
      console.log('\n📊 homestays 表結構:')
      const columnsResult = await pool.query(`
        SELECT column_name, data_type, is_nullable, column_default 
        FROM information_schema.columns 
        WHERE table_name = 'homestays' 
        AND table_schema = 'public'
        ORDER BY ordinal_position
      `)
      
      columnsResult.rows.forEach(col => {
        console.log(`  - ${col.column_name}: ${col.data_type} ${col.is_nullable === 'NO' ? 'NOT NULL' : ''} ${col.column_default ? `DEFAULT ${col.column_default}` : ''}`)
      })
      
      // 檢查資料數量
      const countResult = await pool.query('SELECT COUNT(*) as count FROM homestays')
      console.log(`\n📈 homestays 表資料筆數: ${countResult.rows[0].count}`)
      
      // 如果有資料，顯示前幾筆
      if (countResult.rows[0].count > 0) {
        const sampleResult = await pool.query('SELECT * FROM homestays LIMIT 3')
        console.log('\n📄 範例資料:')
        sampleResult.rows.forEach((row, index) => {
          console.log(`  ${index + 1}. ID: ${row.id}, Name: ${row.name || 'N/A'}`)
        })
      }
    } else {
      console.log('\n❌ homestays 表不存在')
    }
    
    // 檢查 homestay_types 表
    const typesExists = tablesResult.rows.some(row => row.table_name === 'homestay_types')
    
    if (typesExists) {
      console.log('\n📊 homestay_types 表結構:')
      const typesColumnsResult = await pool.query(`
        SELECT column_name, data_type, is_nullable, column_default 
        FROM information_schema.columns 
        WHERE table_name = 'homestay_types' 
        AND table_schema = 'public'
        ORDER BY ordinal_position
      `)
      
      typesColumnsResult.rows.forEach(col => {
        console.log(`  - ${col.column_name}: ${col.data_type} ${col.is_nullable === 'NO' ? 'NOT NULL' : ''} ${col.column_default ? `DEFAULT ${col.column_default}` : ''}`)
      })
    } else {
      console.log('\n❌ homestay_types 表不存在')
    }
    
  } catch (error) {
    console.error('❌ 檢查失敗:', error.message)
    console.error('詳細錯誤:', error)
  } finally {
    await pool.end()
  }
}

// 執行檢查
checkTableStructure() 