import { pool } from '@/server/utils/db'

export default defineEventHandler(async (event) => {
  const user_id = getRouterParam(event, 'id')

  const userRecord = await pool
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
  console.log(userRecord, 'ooooooo')
  return userRecord
})
