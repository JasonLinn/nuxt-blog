import { defineEventHandler, setHeader, createError } from 'h3'
import { requireAdmin } from '../../../utils/admin-auth.js'
import { IMPORT_DISABLED_REASON } from '../../../services/association-source.js'

export default defineEventHandler((event) => {
  setHeader(event, 'Cache-Control', 'private, no-store')
  requireAdmin(event)
  // Deliberate code-level gate, independent of env flags and request bodies.
  throw createError({
    statusCode: 409,
    statusMessage: 'Association import disabled',
    data: { code: 'IMPORT_DISABLED', message: IMPORT_DISABLED_REASON }
  })
})
