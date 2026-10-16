import { requireAdmin } from '../../../utils/admin-auth.js'
import { pool } from '../../../utils/db.js'
import { reviewImport } from '../../../services/activity-import.js'

export default defineEventHandler(async event => {
  requireAdmin(event)
  setHeader(event, 'Cache-Control', 'no-store')
  const body = await readBody(event)
  if (!body || typeof body.source !== 'string' || typeof body.externalId !== 'string') throw createError({ statusCode: 400, statusMessage: '缺少來源識別碼' })
  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    const result = await reviewImport(client, body)
    await client.query('COMMIT')
    return result
  } catch (error) {
    await client.query('ROLLBACK')
    throw error
  } finally { client.release() }
})
