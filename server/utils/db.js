import databaseConfig from '../../utils/database-config.cjs';
const { databaseUrl } = databaseConfig;
import { Pool, neonConfig } from '@neondatabase/serverless'
import ws from 'ws'

// 在 Node.js 環境中配置 WebSocket
if (typeof window === 'undefined') {
  neonConfig.webSocketConstructor = ws
}

// 民宿及共用景點、活動、行程使用專用連線；不回退到優惠券資料庫。
const connectionString = databaseUrl('homestay')

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
    console.error('Database query error:', { code: error.code || 'QUERY_FAILED' })
    throw error
  }
}

export default {
  pool,
  query
}
