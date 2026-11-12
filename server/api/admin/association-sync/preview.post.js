import { defineEventHandler, createError, setHeader } from 'h3'
import { requireAdmin } from '../../../utils/admin-auth.js'
import { pool } from '../../../utils/db.js'
import { previewAssociationMembers } from '../../../services/association-preview.js'
import { AssociationError } from '../../../services/association-source.js'

let pending = null

export default defineEventHandler(async (event) => {
  setHeader(event, 'Cache-Control', 'private, no-store')
  requireAdmin(event)
  // No request-supplied URL, credential, apply flag or member payload is accepted.
  // Coalesce concurrent previews within an instance; no raw snapshot is cached.
  if (!pending)
    pending = previewAssociationMembers(pool).finally(() => {
      pending = null
    })
  try {
    return await pending
  } catch (error) {
    throw createError({
      statusCode: error instanceof AssociationError ? error.statusCode : 503,
      statusMessage: 'Association preview unavailable',
      data: {
        code: error instanceof AssociationError ? error.code : 'PREVIEW_FAILED',
        message:
          error instanceof AssociationError ? error.message : '預覽暫時無法使用，請稍後重試。'
      }
    })
  }
})
