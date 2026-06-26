import { couponPool } from '../../../../utils/coupon-db.js'
import { requireAdmin } from '../../../../utils/admin-auth.js'

export default defineEventHandler(async (event) => {
  requireAdmin(event)

  const couponId = getRouterParam(event, 'id')

  const result = await couponPool.query(
    'UPDATE "article" SET "archived_at" = NULL, "updated_at" = NOW() WHERE "id" = $1 RETURNING *;',
    [couponId]
  )

  if (result.rowCount !== 1) {
    throw createError({
      statusCode: 404,
      statusMessage: '找不到優惠券'
    })
  }

  return {
    message: '優惠券已恢復',
    data: result.rows[0]
  }
})
