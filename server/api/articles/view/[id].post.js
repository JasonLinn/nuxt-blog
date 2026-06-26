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
    const id = getRouterParam(event, 'id')

    if (!id) {
      throw createError({
        statusCode: 400,
        statusMessage: '缺少文章 ID'
      })
    }

    // 增加瀏覽量
    const updateResult = await couponPool.query(
      'UPDATE article SET view_count = COALESCE(view_count, 0) + 1, view_count_monthly = COALESCE(view_count_monthly, 0) + 1 WHERE id = $1 AND "archived_at" IS NULL RETURNING id',
      [id]
    )

    if (updateResult.rows.length === 0) {
      throw createError({
        statusCode: 404,
        statusMessage: '找不到此優惠券'
      })
    }

    return {
      success: true,
      message: '瀏覽量已記錄'
    }
  } catch (error) {
    console.error('更新瀏覽量錯誤:', error)

    if (error.statusCode) {
      throw error
    }

    throw createError({
      statusCode: 500,
      statusMessage: '伺服器錯誤，請稍後再試'
    })
  }
})
