import { requireLineUser } from '../../utils/line-session.js'
// Bulk wallet replacement is retired. Redemption checks archived_at IS NULL server-side.
export default defineEventHandler(event => {
  requireLineUser(event)
  throw createError({ statusCode: 410, statusMessage: 'Use coupon redemption' })
})
