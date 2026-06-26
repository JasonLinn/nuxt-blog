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
    //   if (event.context?.auth?.user?.id !== 1) {
        //     throw createError({
            //       statusCode: 401,
            //       message: '沒有權限'
            //     })
            //   }
    // const articleId = await getRouterParam(event, 'id')
    const body = await readBody(event)
    const couponId = body.coupon?.id

    if (!couponId) {
      throw createError({
        statusCode: 400,
        message: '缺少優惠券 ID'
      })
    }

  const couponRecord = await couponPool
    .query(
      `WITH active_coupon AS (
        SELECT 1 FROM "article" WHERE "id" = $3 AND "archived_at" IS NULL
      )
      UPDATE "user"
      SET "coupons" = array_append("coupons", $1)
      WHERE "user_id" = $2
        AND EXISTS (SELECT 1 FROM active_coupon)
      RETURNING *;`,
      [body.coupon, body.user.userId, couponId]
    )
    .then((result) => {
      if (result.rowCount === 1) {
        return result.rows?.[0]
      }
    })
    .catch((error) => {
      console.error(error)
      throw createError({
        statusCode: 500,
        message: '無法更新優惠券，請稍候再試'
      })
    })

  if (!couponRecord) {
    throw createError({
      statusCode: 400,
      message: '優惠券已封存或不存在'
    })
  }

  return 1
})
