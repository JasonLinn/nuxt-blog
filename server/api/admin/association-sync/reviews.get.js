import { defineEventHandler, setHeader, createError } from 'h3'
import { requireAdmin } from '../../../utils/admin-auth.js'
import { pool } from '../../../utils/db.js'
import { readAssociationReviews } from '../../../services/association-links.js'

export default defineEventHandler(async (event) => {
  setHeader(event, 'Cache-Control', 'private, no-store')
  requireAdmin(event)
  try {
    return await readAssociationReviews(pool)
  } catch (error) {
    throw createError({
      statusCode: error.statusCode || 503,
      statusMessage: 'Association reviews unavailable',
      data: { code: error.code, message: error.message }
    })
  }
})
