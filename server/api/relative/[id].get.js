import { pool } from '@/server/utils/db'

export default defineEventHandler(async (event) => {
  const relativeId = getRouterParam(event, 'id')

  const relativeRecord = await pool
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
