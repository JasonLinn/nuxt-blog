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
  const user_id = getRouterParam(event, 'id')

  const userRecord = await couponPool
    .query('SELECT * FROM "user" WHERE "user_id" = $1;', [user_id])
    .then((result) => result.rows?.[0])
    .catch((error) => {
      console.error(error)
      throw createError({
        statusCode: 500,
        message: '無法取得LINE ID，請稍候再試'
      })
    })

  if (!userRecord) {
    throw createError({
      statusCode: 400,
      message: '取得LINE ID失敗，請稍候再試'
    })
  }
  // console.log(userRecord, 'ooooooo')
  return userRecord
})
