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

async function checkApprovedHomestays() {
  try {
    console.log('🔍 檢查已審核通過的民宿...')
    
    // 檢查已審核通過的民宿
    const approvedResult = await pool.query(`
      SELECT id, name, status, available, created_at, approved_at
      FROM homestays 
      WHERE status = $1 
      ORDER BY approved_at DESC 
      LIMIT 10
    `, ['approved'])
    
    console.log('\n✅ 已審核通過的民宿:')
    if (approvedResult.rows.length === 0) {
      console.log('   ❌ 沒有已審核通過的民宿')
    } else {
      approvedResult.rows.forEach(h => {
        console.log(`   - ID: ${h.id}, 名稱: ${h.name}, available: ${h.available}, 審核時間: ${h.approved_at}`)
      })
    }
    
    // 檢查前台查詢條件的民宿數量
    const frontendResult = await pool.query(`
      SELECT COUNT(*) as count
      FROM homestays 
      WHERE available = true
    `)
    
    console.log(`\n📊 符合前台顯示條件 (available = true) 的民宿數量: ${frontendResult.rows[0].count}`)
    
    // 檢查各狀態的民宿數量
    const statusResult = await pool.query(`
      SELECT status, available, COUNT(*) as count
      FROM homestays 
      GROUP BY status, available
      ORDER BY status, available
    `)
    
    console.log('\n📈 民宿狀態統計:')
    statusResult.rows.forEach(row => {
      console.log(`   - status: ${row.status}, available: ${row.available}, 數量: ${row.count}`)
    })
    
  } catch (error) {
    console.error('❌ 檢查失敗:', error.message)
  } finally {
    await pool.end()
  }
}

checkApprovedHomestays() 