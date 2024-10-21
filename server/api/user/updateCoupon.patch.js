import { pool } from '@/server/utils/db'

export default defineEventHandler(async (event) => {
    const body = await readBody(event)
    console.log(event, body, 'dfadfsdfcccc')

  const couponRecord = await pool
    .query(
      'UPDATE "user" SET "coupons" =  $1 WHERE "user_id" = $2 RETURNING *;',
      [body.coupons, body.user.userId]
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
