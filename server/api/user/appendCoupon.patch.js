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
    console.log(event, body, 'cccccccccccc')

  const couponRecord = await couponPool
    .query(
      'UPDATE "user" SET "coupons" = array_append("coupons", $1) WHERE "user_id" = $2 RETURNING *;',
      [body.coupon, body.user.userId]
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
      message: '更新優惠券失敗，請稍候再試'
    })
  }

  return 1
})
