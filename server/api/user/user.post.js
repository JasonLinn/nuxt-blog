import { pool } from '@/server/utils/db'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
    console.log(body, 'bbbbbbbb')
  const userRecord = await pool
    .query('INSERT INTO "user" ("name", "cover", "token") VALUES ($1, $2, $3) RETURNING *;', [
      body.name,
      body.cover,
      body.token,
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
        message: '無法新增會員，請稍候再試'
      })
    })

  if (!userRecord) {
    throw createError({
      statusCode: 400,
      message: '新增會員，請稍候再試'
    })
  }

  return userRecord
})
