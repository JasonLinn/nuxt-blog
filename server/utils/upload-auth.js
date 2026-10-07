import jwt from 'jsonwebtoken'
import { getCookie, createError } from 'h3'
import { getAdmin } from './admin-auth.js'
import { requireLineUser } from './line-session.js'
import { requiredSecret } from './security.js'

export function requireUploader(event) {
  const admin = getAdmin(event)
  if (admin) return admin
  const token = getCookie(event, 'homestay_access_token')
  if (token) {
    try {
      const decoded = jwt.verify(token, requiredSecret('HOMESTAY_JWT_SECRET'), { algorithms: ['HS256'] })
      if (decoded.data?.type === 'homestay' && decoded.data.id) return decoded.data
    } catch { /* Try the independent LINE session. */ }
  }
  return requireLineUser(event)
}
