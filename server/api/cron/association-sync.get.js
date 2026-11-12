import { defineEventHandler, setHeader, getHeader, createError } from 'h3'
import { equalSecret } from '../../utils/security.js'
import { pool } from '../../utils/db.js'
import { importAssociationMembers } from '../../services/association-import.js'

export default defineEventHandler(async (event) => {
  setHeader(event, 'Cache-Control', 'no-store')
  if (
    !process.env.CRON_SECRET ||
    !equalSecret(getHeader(event, 'authorization'), `Bearer ${process.env.CRON_SECRET}`)
  )
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  if (process.env.ASSOCIATION_SYNC_ENABLED !== 'true') return { skipped: true }
  try {
    return await importAssociationMembers(pool, 'cron')
  } catch (error) {
    throw createError({
      statusCode: error.statusCode || 503,
      statusMessage: 'Association sync failed',
      data: { code: error.code, message: error.message }
    })
  }
})
