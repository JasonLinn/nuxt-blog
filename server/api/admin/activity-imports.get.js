import { requireAdmin } from '../../utils/admin-auth.js'
import { query } from '../../utils/db.js'
import { activitySources } from '../../services/activity-sources.js'

export default defineEventHandler(async event => {
  requireAdmin(event)
  setHeader(event, 'Cache-Control', 'no-store')
  try {
    const [items, runs] = await Promise.all([
      query("SELECT * FROM activity_import_items WHERE state = 'pending' ORDER BY updated_at DESC LIMIT 200"),
      query('SELECT * FROM activity_import_runs ORDER BY id DESC LIMIT 10')
    ])
    return { items: items.rows, runs: runs.rows, sources: activitySources.map(({ feed, format, ...s }) => s) }
  } catch (error) {
    if (error.code === '42P01') throw createError({ statusCode: 503, statusMessage: '請先執行活動匯入資料庫 migration' })
    throw error
  }
})
