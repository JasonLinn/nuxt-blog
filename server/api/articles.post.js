import { couponPool } from '../utils/coupon-db.js'

export default defineEventHandler(async (event) => {
  if (event.context?.auth?.user?.id !== 1) {
    throw createError({
      statusCode: 401,
      message: '沒有權限'
    })
  }
  const body = await readBody(event)

  const articleRecord = await couponPool
    .query('INSERT INTO "article" ("title", "category", "adress", "township", "content", "cover", "amount", "used_times", "isReferral", "hash", "isonce", "position", "tags") VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13) RETURNING *;', [
      body.title,
      body.category,
      body.adress,
      body.township,
      body.content,
      body.cover,
      body.amount,
      body.usedTimes,
      body.isReferral,
      body.hash,
      body.isonce,
      body.position,
      body.tags
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
        message: '無法建立優惠券，請稍候再試'
      })
    })

  if (!articleRecord) {
    throw createError({
      statusCode: 400,
      message: '建立優惠券失敗，請稍候再試'
    })
  }

  return articleRecord
})
