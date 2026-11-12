import { defineEventHandler, setHeader, createError, readRawBody, getHeader } from 'h3'
import { requireAdmin } from '../../../utils/admin-auth.js'
import { pool } from '../../../utils/db.js'
import { confirmAssociationLink } from '../../../services/association-links.js'

export default defineEventHandler(async (event) => {
  setHeader(event, 'Cache-Control', 'private, no-store')
  const admin = requireAdmin(event)
  if (Number(getHeader(event, 'content-length')) > 4096)
    throw createError({ statusCode: 413, statusMessage: 'Request too large' })
  const raw = await readRawBody(event, false)
  if (raw?.length > 4096) throw createError({ statusCode: 413, statusMessage: 'Request too large' })
  let body
  try {
    body = JSON.parse(raw?.toString('utf8') || '')
  } catch {
    throw createError({ statusCode: 400, statusMessage: 'Invalid JSON' })
  }
  try {
    return await confirmAssociationLink(pool, body, admin.id || admin.username || 'admin')
  } catch (error) {
    throw createError({
      statusCode: error.statusCode || 503,
      statusMessage: 'Association link rejected',
      data: { code: error.code, message: error.message }
    })
  }
})
