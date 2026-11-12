import { defineEventHandler, setHeader } from 'h3'
import { requireAdmin } from '../../../utils/admin-auth.js'
import {
  ASSOCIATION_API_URL,
  IMPORT_DISABLED_REASON
} from '../../../services/association-source.js'

export default defineEventHandler((event) => {
  setHeader(event, 'Cache-Control', 'private, no-store')
  requireAdmin(event)
  return {
    mode: 'preview_only',
    can_import: false,
    import_disabled_reason: IMPORT_DISABLED_REASON,
    source_configured:
      !!process.env.YTHMA_BNB_API_KEY &&
      (!process.env.YTHMA_BNB_API_URL || process.env.YTHMA_BNB_API_URL === ASSOCIATION_API_URL),
    scheduled: false,
    persists_previews: false
  }
})
