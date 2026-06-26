import { couponPool } from '../../utils/coupon-db.js'
import { getAdmin } from '../../utils/admin-auth.js'

export default defineEventHandler(async (event) => {
  try {
    const articleId = getRouterParam(event, 'id')

    if (!articleId) {
      throw createError({
        statusCode: 400,
        statusMessage: '缺少優惠券 ID'
      })
    }

    const isAdmin = Boolean(getAdmin(event))
    const archivedFilter = isAdmin ? '' : ' AND "archived_at" IS NULL'

    const articleRecord = await couponPool.query(
      `SELECT * FROM article WHERE id = $1${archivedFilter}`,
      [articleId]
    )

    if (articleRecord.rows.length === 0) {
      throw createError({
        statusCode: 404,
        statusMessage: '找不到此優惠券'
      })
    }

    return articleRecord.rows[0]
  } catch (error) {
    console.error('取得優惠券詳情錯誤:', error)
    
    if (error.statusCode) {
      throw error
    }
    
    throw createError({
      statusCode: 500,
      statusMessage: '伺服器錯誤，請稍後再試'
    })
  }
})
