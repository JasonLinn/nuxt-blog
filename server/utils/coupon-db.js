import pkg from 'pg'
const { Pool } = pkg

// 優惠券專用資料庫連線
const couponPool = new Pool({
  connectionString: 'postgresql://nuxt-marketing_owner:ys7ZNVhOrg9c@ep-rough-voice-a1ele0z6-pooler.ap-southeast-1.aws.neon.tech/nuxt-marketing?sslmode=require&channel_binding=require',
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