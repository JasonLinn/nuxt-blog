import { defineEventHandler, setHeader } from 'h3'
import { requireAdmin } from '../../../utils/admin-auth.js'
import { pool } from '../../../utils/db.js'
import { ASSOCIATION_API_URL } from '../../../services/association-source.js'

export default defineEventHandler(async (event) => {
  setHeader(event, 'Cache-Control', 'private, no-store')
  requireAdmin(event)
  const enabled = process.env.ASSOCIATION_SYNC_ENABLED === 'true'
  const latest = await pool.query(
    'SELECT created_at,summary FROM association_import_runs ORDER BY id DESC LIMIT 1'
  )
  return {
    mode: enabled ? 'sync_enabled' : 'preview_only',
    can_import: enabled,
    last_import: latest.rows[0] || null,
    import_disabled_reason: enabled ? null : '正式同步尚未啟用。',
    source_configured:
      !!process.env.YTHMA_BNB_API_KEY &&
      (!process.env.YTHMA_BNB_API_URL || process.env.YTHMA_BNB_API_URL === ASSOCIATION_API_URL),
    scheduled: enabled && process.env.VERCEL_ENV === 'production',
    persists_previews: false,
    supports_saved_reviews: true,
    supports_manual_links: true
  }
})
