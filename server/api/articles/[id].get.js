import pkg from 'pg'
const { Pool } = pkg

// 優惠券專用資料庫連線
const couponPool = new Pool({
  connectionString: 'postgresql://nuxt-marketing_owner:ys7ZNVhOrg9c@ep-rough-voice-a1ele0z6-pooler.ap-southeast-1.aws.neon.tech/nuxt-marketing?sslmode=require&channel_binding=require',
  ssl: {
    rejectUnauthorized: false
  }
})

export default defineEventHandler(async (event) => {
  try {
    const articleId = getRouterParam(event, 'id')

    if (!articleId) {
      throw createError({
        statusCode: 400,
        statusMessage: '缺少優惠券 ID'
      })
    }

    const articleRecord = await couponPool.query(
      'SELECT * FROM article WHERE id = $1', 
      [articleId]
    )

    if (articleRecord.rows.length === 0) {
      throw createError({
        statusCode: 404,
        statusMessage: '找不到此優惠券'
      })
    }

    return articleRecord.rows[0]
  } catch (error) {
    console.error('取得優惠券詳情錯誤:', error)
    
    if (error.statusCode) {
      throw error
    }
    
    throw createError({
      statusCode: 500,
      statusMessage: '伺服器錯誤，請稍後再試'
    })
  }
})
