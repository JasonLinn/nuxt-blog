import pkg from 'pg'
const { Pool } = pkg

// 優惠券專用資料庫連線
const couponPool = new Pool({
  connectionString: 'postgresql://nuxt-marketing_owner:ys7ZNVhOrg9c@ep-rough-voice-a1ele0z6-pooler.ap-southeast-1.aws.neon.tech/nuxt-marketing?sslmode=require&channel_binding=require',
  ssl: {
    rejectUnauthorized: false
  }
})

const getCouponId = (coupon) => {
  try {
    const parsedCoupon = typeof coupon === 'string' ? JSON.parse(coupon) : coupon
    return parsedCoupon?.id ? String(parsedCoupon.id) : null
  } catch (error) {
    return null
  }
}

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const coupons = Array.isArray(body.coupons) ? body.coupons : []
  const couponIds = coupons.map(getCouponId).filter(Boolean)

  let activeCoupons = coupons

  if (couponIds.length) {
    const activeCouponIds = await couponPool
      .query(
        'SELECT "id" FROM "article" WHERE "id" = ANY($1::int[]) AND "archived_at" IS NULL;',
        [[...new Set(couponIds)].map(Number).filter(Number.isFinite)]
      )
      .then((result) => new Set(result.rows.map((row) => String(row.id))))
      .catch((error) => {
        console.error(error)
        throw createError({
          statusCode: 500,
          message: '無法取得優惠券狀態，請稍候再試'
        })
      })

    activeCoupons = coupons.filter((coupon) => {
      const couponId = getCouponId(coupon)
      if (!couponId) return true
      return activeCouponIds.has(couponId)
    })
  }

  const couponRecord = await couponPool
    .query(
      'UPDATE "user" SET "coupons" =  $1 WHERE "user_id" = $2 RETURNING *;',
      [activeCoupons, body.userId]
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
