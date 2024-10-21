import { pool } from '@/server/utils/db'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)

  const receivedRecord = await pool
    .query('INSERT INTO "received" ("coupon_title", "coupon_id", "coupon_content", "user_id", "user_name", "remark") VALUES ($1, $2, $3, $4, $5, $6) RETURNING *;', [
      body.coupon_title,
      body.coupon_id,
      body.coupon_content,
      body.user_id,
      body.user_name,
      body.remark
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
        message: '無法兌換，請稍候再試'
      })
    })

  if (!receivedRecord) {
    throw createError({
      statusCode: 400,
      message: '兌換失敗，請稍候再試'
    })
  }

  return receivedRecord
})
