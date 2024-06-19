import { pool } from '@/server/utils/db'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)

  const articleRecord = await pool
    .query(
      'UPDATE "article" SET "amount" = $1, "updated_at" = NOW() WHERE "id" = $2 RETURNING *;',
      [body.amount, body.id]
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

  if (!articleRecord) {
    throw createError({
      statusCode: 400,
      message: '更新優惠券失敗，請稍候再試'
    })
  }

  return articleRecord
})
