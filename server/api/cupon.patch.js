import databaseConfig from '../../utils/database-config.cjs';
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

  const articleRecord = await couponPool
    .query(
      'UPDATE "article" SET "amount" = $1, "updated_at" = NOW() WHERE "id" = $2 AND "archived_at" IS NULL RETURNING *;',
      [body.amount, body.id]
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
      message: '優惠券已封存或不存在'
    })
  }

  return articleRecord
})
