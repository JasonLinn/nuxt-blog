import { Pool, neonConfig } from '@neondatabase/serverless'
import ws from 'ws'

// 在 Node.js 環境中配置 WebSocket
if (typeof window === 'undefined') {
  neonConfig.webSocketConstructor = ws
}

// 使用明確的連線字串，確保連線正常
const connectionString = process.env.DATABASE_URL || 'postgresql://neondb_owner:npg_DSt86GUynwli@ep-fancy-snow-a8232ddc-pooler.eastus2.azure.neon.tech/neondb?sslmode=require'

export const pool = new Pool({ 
  connectionString,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
})

export default {
  pool
}
