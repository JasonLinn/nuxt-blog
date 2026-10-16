import { requireAdmin } from '../../../utils/admin-auth.js'
import { pool } from '../../../utils/db.js'
import { syncActivities } from '../../../services/activity-import.js'

export default defineEventHandler(async event => {
  requireAdmin(event)
  setHeader(event, 'Cache-Control', 'no-store')
  const body = await readBody(event)
  return syncActivities(pool, { dryRun: body?.dryRun === true })
})
