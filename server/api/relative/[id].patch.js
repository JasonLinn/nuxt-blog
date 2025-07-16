import { Pool, neonConfig } from '@neondatabase/serverless'

// 強制使用 HTTP fetch 連線，避免 serverless 環境 WebSocket 問題
neonConfig.webSocket = false;

// 優惠券資料庫連線
const couponPool = new Pool({
  connectionString: 'postgresql://nuxt-marketing_owner:ys7ZNVhOrg9c@ep-rough-voice-a1ele0z6-pooler.ap-southeast-1.aws.neon.tech/nuxt-marketing'
})

export default defineEventHandler(async (event) => {
//   if (event.context?.auth?.user?.id !== 1) {
//     throw createError({
//       statusCode: 401,
//       message: '沒有權限'
//     })
//   }
  const relativeId = await getRouterParam(event, 'id')
  const body = await readBody(event)

  const relativeRecord = await couponPool
    .query(
      'UPDATE "relative" SET "title" = $1, "category" = $2, "content" = $3, "cover" = $4, "amount" = $5, "hash" = $6, "updated_at" = NOW() WHERE "id" = $7 RETURNING *;',
      [body.title, body.category, body.content, body.cover, body.amount, body.hash, relativeId]
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

  if (!relativeRecord) {
    throw createError({
      statusCode: 400,
      message: '更新優惠券失敗，請稍候再試'
    })
  }

  return relativeRecord
})
