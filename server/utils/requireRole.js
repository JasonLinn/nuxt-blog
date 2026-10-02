import { verifyJwt } from './jwtSecret.js'

export function requireRole(event, tokenType, cookieName) {
  const token = getCookie(event, cookieName)
  if (!token) {
    throw createError({
      statusCode: 401,
      statusMessage: '未登入'
    })
  }

  try {
    return verifyJwt(token, tokenType, event).data
  } catch {
    throw createError({
      statusCode: 401,
      statusMessage: '登入已過期或無權限'
    })
  }
}

export function requireAdminRole(event) {
  return requireRole(event, 'admin', 'admin_access_token')
}

export function requireHomestayRole(event) {
  return requireRole(event, 'homestay', 'homestay_access_token')
}
