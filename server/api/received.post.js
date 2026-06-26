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
  const body = await readBody(event)

  const receivedRecord = await couponPool
    .query(
      `WITH active_coupon AS (
        SELECT 1 FROM "article" WHERE "id" = $2 AND "archived_at" IS NULL
      )
      INSERT INTO "received" ("coupon_title", "coupon_id", "coupon_content", "user_id", "user_name", "remark", "received_time")
      SELECT $1, $2, $3, $4, $5, $6, $7
      WHERE EXISTS (SELECT 1 FROM active_coupon)
      RETURNING *;`,
      [
        body.coupon_title,
        body.coupon_id,
        body.coupon_content,
        body.user_id,
        body.user_name,
        body.remark,
        body.received_time
      ]
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
        message: '無法兌換，請稍候再試'
      })
    })

  if (!receivedRecord) {
    throw createError({
      statusCode: 400,
      message: '優惠券已封存或不存在'
    })
  }

  return receivedRecord
})
