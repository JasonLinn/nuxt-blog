import { Pool } from '@neondatabase/serverless'

// 優惠券資料庫連線
const couponPool = new Pool({
  connectionString: 'postgresql://nuxt-marketing_owner:ys7ZNVhOrg9c@ep-rough-voice-a1ele0z6-pooler.ap-southeast-1.aws.neon.tech/nuxt-marketing'
})

export default defineEventHandler(async (event) => {
  const relativeId = getRouterParam(event, 'id')

  const relativeRecord = await couponPool
    .query('SELECT * FROM "relative" WHERE "id" = $1;', [relativeId])
    .then((result) => result.rows?.[0])
    .catch((error) => {
      console.error(error)
      throw createError({
        statusCode: 500,
        message: '無法取得優惠券，請稍候再試'
      })
    })

  if (!relativeRecord) {
    throw createError({
      statusCode: 400,
      message: '取得優惠券失敗，請稍候再試'
    })
  }

  return relativeRecord
})
