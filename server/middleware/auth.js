import { defineEventHandler, getRequestURL, getHeader, createError } from 'h3'
import { requireAdmin } from '../utils/admin-auth.js'
export default defineEventHandler(event => {
  const pathname = getRequestURL(event).pathname
  if (!pathname.startsWith('/api/')) return
  if (!['GET', 'HEAD', 'OPTIONS'].includes(event.method)) {
    const origin = getHeader(event, 'origin')
    if (getHeader(event, 'sec-fetch-site') === 'cross-site' || (origin && origin !== getRequestURL(event).origin)) {
      throw createError({ statusCode: 403, statusMessage: 'Cross-origin request rejected' })
    }
  }
  if ((pathname === '/api/articles' && event.method === 'POST') || (/^\/api\/articles\/[^/]+\/?$/.test(pathname) && ['PATCH', 'DELETE'].includes(event.method))) {
    const user = requireAdmin(event)
    event.context.auth = { user: { ...user, id: 1 } }
  }
})
