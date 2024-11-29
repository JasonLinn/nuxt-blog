import { pool } from '@/server/utils/db'

export default defineEventHandler(async (event) => {
  const query = await getQuery(event)
  const page = Math.max(parseInt(query.page) || 1, 1)
  const pageSize = Math.min(Math.max(parseInt(query.pageSize) || 10, 1), 100)
  const category = query.category
  const township = query.township
  const searchText = query.searchText
  let where = `SELECT * FROM "article"`
  let param = []
  if (category) {
    where = `SELECT * FROM "article" WHERE category = $3`
    param = [category]
  }
  if (township) {
    where = `SELECT * FROM "article" WHERE $3 = ANY(township)`
    param = [township]
  }
  if (searchText) {
    where = `SELECT * FROM "article" WHERE content LIKE $3 OR title LIKE $3`
    param = [`%${searchText}%`]
  }
  if (category && township) {
    where = `SELECT * FROM "article" WHERE category = $3 and $4 = ANY(township)`
    param = [category, township]
  }
  if (category && searchText) {
    where = `SELECT * FROM "article" WHERE category = $3 and (content LIKE $4 OR title LIKE $4)`
    param = [category, `%${searchText}%`]
  }
  if (township && searchText) {
    where = `SELECT * FROM "article" WHERE $3 = ANY(township) and (content LIKE $4 OR title LIKE $4)`
    param = [township, `%${searchText}%`]
  }
  if (category && township && searchText) {
    where = `SELECT * FROM "article" WHERE category = $3 and $4 = ANY(township) and (content LIKE $5 OR title LIKE $5)`
    param = [category, township, `%${searchText}%`]
  }

  console.log(where, param, 'pppppppccccc', query)
  const articleRecords = await pool
    .query(`${where} ORDER BY RANDOM() DESC OFFSET $1 LIMIT $2;`, [(page - 1) * pageSize, pageSize, ...param])
    .then((result) => result.rows)
    .catch((error) => {
      console.error(error)
      throw createError({
        statusCode: 500,
        message: '無法取得優惠券列表，請稍候再試'
      })
    })

  return {
    items: articleRecords,
    page,
    pageSize
  }
})
