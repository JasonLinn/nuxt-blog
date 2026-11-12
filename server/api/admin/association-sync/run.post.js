import { defineEventHandler, setHeader, createError, readBody } from 'h3'
import { requireAdmin } from '../../../utils/admin-auth.js'
import { importAssociationMembers } from '../../../services/association-import.js'
import { pool } from '../../../utils/db.js'

export default defineEventHandler(async (event) => {
  setHeader(event, 'Cache-Control', 'private, no-store')
  const admin = requireAdmin(event)
  const body = await readBody(event)
  if (body?.apply !== true || Object.keys(body).some((key) => key !== 'apply'))
    throw createError({ statusCode: 400, statusMessage: 'Explicit import required' })
  try {
    return await importAssociationMembers(pool, admin.id || admin.username || 'admin')
  } catch (error) {
    throw createError({
      statusCode: error.statusCode || 503,
      statusMessage: 'Association import failed',
      data: { code: error.code, message: error.message }
    })
  }
})
