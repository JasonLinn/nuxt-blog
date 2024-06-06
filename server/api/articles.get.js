import { pool } from '@/server/utils/db'

export default defineEventHandler(async (event) => {
  const query = await getQuery(event)

  const page = Math.max(parseInt(query.page) || 1, 1)
  const pageSize = Math.min(Math.max(parseInt(query.pageSize) || 10, 1), 100)
  const category = query.category
  const where = category ? `SELECT * FROM "article" WHERE category = $3` : `SELECT * FROM "article"`
  const param = category ? [
    (page - 1) * pageSize,
    pageSize,
    category
  ] : [
    (page - 1) * pageSize,
    pageSize
  ]
  const articleRecords = await pool
    .query(`${where} ORDER BY "updated_at" DESC OFFSET $1 LIMIT $2;`, param)
    .then((result) => result.rows)
    .catch((error) => {
      console.error(error)
      throw createError({
        statusCode: 500,
        message: '無法取得文章列表，請稍候再試'
      })
    })

  return {
    items: articleRecords,
    page,
    pageSize
  }
})
