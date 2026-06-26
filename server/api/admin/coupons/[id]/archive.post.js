import { couponPool } from '../../../../utils/coupon-db.js'
import { requireAdmin } from '../../../../utils/admin-auth.js'

const getCouponId = (coupon) => {
  try {
    const parsedCoupon = typeof coupon === 'string' ? JSON.parse(coupon) : coupon
    return parsedCoupon?.id ? String(parsedCoupon.id) : null
  } catch (error) {
    return null
  }
}

const removeIssuedCouponSnapshots = async (client, couponId) => {
  const users = await client.query(
    'SELECT "user_id", "coupons" FROM "user" WHERE "coupons" IS NOT NULL AND array_length("coupons", 1) > 0;'
  )

  for (const user of users.rows) {
    const coupons = Array.isArray(user.coupons) ? user.coupons : []
    const activeCoupons = coupons.filter((coupon) => getCouponId(coupon) !== String(couponId))

    if (activeCoupons.length === coupons.length) continue

    await client.query(
      'UPDATE "user" SET "coupons" = $1 WHERE "user_id" = $2;',
      [activeCoupons, user.user_id]
    )
  }
}

export default defineEventHandler(async (event) => {
  requireAdmin(event)

  const couponId = getRouterParam(event, 'id')
  const client = await couponPool.connect()

  try {
    await client.query('BEGIN')

    const result = await client.query(
      'UPDATE "article" SET "archived_at" = NOW(), "updated_at" = NOW() WHERE "id" = $1 RETURNING *;',
      [couponId]
    )

    if (result.rowCount !== 1) {
      throw createError({
        statusCode: 404,
        statusMessage: '找不到優惠券'
      })
    }

    await removeIssuedCouponSnapshots(client, couponId)
    await client.query('COMMIT')

    return {
      message: '優惠券已封存',
      data: result.rows[0]
    }
  } catch (error) {
    await client.query('ROLLBACK')
    if (error.statusCode) throw error

    console.error(error)
    throw createError({
      statusCode: 500,
      statusMessage: '封存優惠券失敗'
    })
  } finally {
    client.release()
  }
})
