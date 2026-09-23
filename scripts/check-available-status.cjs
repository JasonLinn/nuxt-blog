const { databaseUrl } = require('../utils/database-config.cjs');
const { Pool, neonConfig } = require('@neondatabase/serverless')
const ws = require('ws')

if (typeof window === 'undefined') {
  neonConfig.webSocketConstructor = ws
}

const connectionString = databaseUrl('homestay')
const pool = new Pool({ 
  connectionString,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
})

async function checkAvailableStatus() {
  try {
    console.log('🔍 檢查民宿的 available 狀態...')
    
    // 檢查已審核通過的民宿
    const approvedResult = await pool.query(`
      SELECT id, name, status, available 
      FROM homestays 
      WHERE status = 'approved' 
      ORDER BY id 
      LIMIT 10
    `)
    
    console.log('\n✅ 已審核通過的民宿:')
    approvedResult.rows.forEach(h => {
      console.log(`ID: ${h.id}, 名稱: ${h.name}, status: ${h.status}, available: ${h.available}`)
    })
    
    // 檢查 available = true 的民宿
    const availableResult = await pool.query(`
      SELECT id, name, status, available 
      FROM homestays 
      WHERE available = true 
      ORDER BY id 
      LIMIT 10
    `)
    
    console.log('\n🏠 available = true 的民宿:')
    if (availableResult.rows.length === 0) {
      console.log('❌ 沒有找到 available = true 的民宿！')
    } else {
      availableResult.rows.forEach(h => {
        console.log(`ID: ${h.id}, 名稱: ${h.name}, status: ${h.status}, available: ${h.available}`)
      })
    }
    
    await pool.end()
    
  } catch (error) {
    console.error('❌ 錯誤:', error)
  }
}

checkAvailableStatus() 