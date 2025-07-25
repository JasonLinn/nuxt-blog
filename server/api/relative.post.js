import { Pool } from '@neondatabase/serverless'

// 優惠券資料庫連線
const couponPool = new Pool({
  connectionString: 'postgresql://nuxt-marketing_owner:ys7ZNVhOrg9c@ep-rough-voice-a1ele0z6-pooler.ap-southeast-1.aws.neon.tech/nuxt-marketing'
})

export default defineEventHandler(async (event) => {
  // if (event.context?.auth?.user?.id !== 1) {
  //   throw createError({
  //     statusCode: 401,
  //     message: '沒有權限'
  //   })
  // }
  const body = await readBody(event)

  const relativeRecord = await couponPool
    .query('INSERT INTO "relative" ("title", "category", "content", "cover", "amount", "used_times", "isReferral", "hash") VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *;', [
      body.title,
      body.category,
      body.content,
      body.cover,
      body.amount,
      body.usedTimes,
      body.isReferral,
      body.hash
    ])
    .then((result) => {
      if (result.rowCount === 1) {
        return result.rows?.[0]
      }
    })
    .catch((error) => {
      console.error(error)
      throw createError({
        statusCode: 500,
        message: '無法建立文章，請稍候再試'
      })
    })

  if (!relativeRecord) {
    throw createError({
      statusCode: 400,
      message: '建立文章失敗，請稍候再試'
    })
  }

  return relativeRecord
})
