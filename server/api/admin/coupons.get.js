import { couponPool } from '../../utils/coupon-db.js'
import { requireAdmin } from '../../utils/admin-auth.js'

export default defineEventHandler(async (event) => {
  requireAdmin(event)

  const query = getQuery(event)
  const status = query.status === 'archived' ? 'archived' : 'active'
  const searchText = query.searchText?.trim() || null
  const page = Math.max(parseInt(query.page) || 1, 1)
  const pageSize = Math.min(Math.max(parseInt(query.pageSize) || 20, 1), 100)

  const conditions = [
    status === 'archived' ? '"archived_at" IS NOT NULL' : '"archived_at" IS NULL'
  ]
  const params = []

  if (searchText) {
    params.push(`%${searchText}%`)
    conditions.push(`(title ILIKE $${params.length} OR content ILIKE $${params.length} OR tags ILIKE $${params.length})`)
  }

  const whereClause = `WHERE ${conditions.join(' AND ')}`
  const offsetParam = params.length + 1
  const limitParam = params.length + 2

  const countResult = await couponPool.query(
    `SELECT COUNT(*)::int AS total FROM "article" ${whereClause}`,
    params
  )

  const dataResult = await couponPool.query(
    `SELECT id, title, category, township, amount, used_times, "isReferral", isonce, updated_at, archived_at
     FROM "article"
     ${whereClause}
     ORDER BY COALESCE(archived_at, updated_at) DESC, id DESC
     OFFSET $${offsetParam} LIMIT $${limitParam}`,
    [...params, (page - 1) * pageSize, pageSize]
  )

  const total = countResult.rows[0]?.total || 0
  const totalPages = Math.ceil(total / pageSize)

  return {
    items: dataResult.rows,
    pagination: {
      page,
      pageSize,
      total,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1
    }
  }
})
