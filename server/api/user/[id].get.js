import pkg from 'pg'
const { Pool } = pkg

// 優惠券專用資料庫連線
const couponPool = new Pool({
  connectionString: 'postgresql://nuxt-marketing_owner:ys7ZNVhOrg9c@ep-rough-voice-a1ele0z6-pooler.ap-southeast-1.aws.neon.tech/nuxt-marketing?sslmode=require&channel_binding=require',
  ssl: {
    rejectUnauthorized: false
  }
})

export default defineEventHandler(async (event) => {
  const user_id = getRouterParam(event, 'id')

  const userRecord = await couponPool
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

  const coupons = Array.isArray(userRecord.coupons) ? userRecord.coupons : []
  const couponIds = coupons
    .map((coupon) => {
      try {
        const parsedCoupon = typeof coupon === 'string' ? JSON.parse(coupon) : coupon
        return parsedCoupon?.id ? String(parsedCoupon.id) : null
      } catch (error) {
        return null
      }
    })
    .filter(Boolean)

  if (!couponIds.length) return userRecord

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

  return {
    ...userRecord,
    coupons: coupons.filter((coupon) => {
      try {
        const parsedCoupon = typeof coupon === 'string' ? JSON.parse(coupon) : coupon
        if (!parsedCoupon?.id) return true
        return activeCouponIds.has(String(parsedCoupon.id))
      } catch (error) {
        return true
      }
    })
  }
})
