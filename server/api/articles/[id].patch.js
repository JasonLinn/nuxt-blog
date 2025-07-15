import { couponPool } from '../../utils/coupon-db.js'

export default defineEventHandler(async (event) => {
  if (event.context?.auth?.user?.id !== 1) {
    throw createError({
      statusCode: 401,
      message: '沒有權限'
    })
  }
  const articleId = await getRouterParam(event, 'id')
  const body = await readBody(event)

  const articleRecord = await couponPool
    .query(
      'UPDATE "article" SET "title" = $1, "category" = $2, "content" = $3, "cover" = $4, "amount" = $5, "hash" = $6, "adress" = $8, "township" = $9, "isReferral" = $10, "isonce" = $11, "position" = $12, "tags" = $13, "updated_at" = NOW() WHERE "id" = $7 RETURNING *;',
      [body.title, body.category, body.content, body.cover, body.amount, body.hash, articleId, body.adress, body.township, body.isReferral, body.isonce, body.position, body.tags]
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
