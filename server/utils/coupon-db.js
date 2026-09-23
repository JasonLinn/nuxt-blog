import databaseConfig from '../../utils/database-config.cjs';
const { databaseUrl } = databaseConfig;
import pkg from 'pg'
const { Pool } = pkg

// 優惠券專用資料庫連線
const couponPool = new Pool({
  connectionString: databaseUrl('marketing'),
  ssl: {
    rejectUnauthorized: false
  }
})

// 測試連線
couponPool.on('connect', () => {
  console.log('✅ 優惠券資料庫連線成功')
})

couponPool.on('error', (err) => {
  console.error('❌ 優惠券資料庫連線錯誤:', err)
})

export { couponPool } 