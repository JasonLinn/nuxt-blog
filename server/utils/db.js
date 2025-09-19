import { Pool, neonConfig } from '@neondatabase/serverless'
import ws from 'ws'

// 在 Node.js 環境中配置 WebSocket
if (typeof window === 'undefined') {
  neonConfig.webSocketConstructor = ws
}

// 使用明確的連線字串，確保連線正常 // DB使用民宿資料庫
const connectionString = 'postgresql://neondb_owner:npg_DSt86GUynwli@ep-fancy-snow-a8232ddc-pooler.eastus2.azure.neon.tech/neondb?sslmode=require&charset=utf8'

export const pool = new Pool({ 
  connectionString,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
  // 明確設定 UTF-8 編碼以確保中文字元正確處理
  application_name: 'nuxt-blog',
  client_encoding: 'UTF8',
})

// 便利的查詢函數
export const query = async (text, params = []) => {
  try {
    const result = await pool.query(text, params)
    return result
  } catch (error) {
    console.error('Database query error:', error)
    throw error
  }
}

export default {
  pool,
  query
}
