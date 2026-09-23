import databaseConfig from '../../../utils/database-config.cjs';
const { databaseUrl } = databaseConfig;
import pkg from 'pg'
const { Pool } = pkg

// 優惠券專用資料庫連線
const couponPool = new Pool({
  connectionString: databaseUrl('marketing'),
  ssl: {
    rejectUnauthorized: false
  }
})

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const record = await couponPool
  .query('SELECT * FROM "user" WHERE "user_id" = $1;', [body.user_id])
  .then((result) => {
    if (!result.rows?.[0]) {
      const userRecord =  couponPool
            .query('INSERT INTO "user" ("name", "cover", "user_id", "coupons", "msg_times") VALUES ($1, $2, $3, $4, $5) RETURNING *;', [
              body.name,
              body.cover,
              body.user_id,
              body.coupons,
              body.msg_times,
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

    }
  })
  .catch((error) => {
    console.error(error)
    throw createError({
      statusCode: 500,
      message: '無法取得優惠券，請稍候再試'
    })
  })

  return record
})
