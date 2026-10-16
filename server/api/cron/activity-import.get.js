import { equalSecret } from '../../utils/security.js'
import { pool } from '../../utils/db.js'
import { syncActivities } from '../../services/activity-import.js'

export default defineEventHandler(async event => {
  setHeader(event, 'Cache-Control', 'no-store')
  if (!process.env.CRON_SECRET || !equalSecret(getHeader(event, 'authorization'), `Bearer ${process.env.CRON_SECRET}`)) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }
  if (process.env.ACTIVITY_IMPORT_ENABLED !== 'true') return { skipped: true, reason: '活動自動更新尚未啟用' }
  const result = await syncActivities(pool)
  if (!result.ok) setResponseStatus(event, 503)
  return result
})
