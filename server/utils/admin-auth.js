import { requireAdminRole } from './requireRole.js'

export const requireAdmin = (event) => {
  try {
    return requireAdminRole(event)
  } catch (error) {
    throw createError({
      statusCode: 401,
      statusMessage: '登入已過期，請重新登入'
    })
  }
}

export const getAdmin = (event) => {
  try {
    return requireAdmin(event)
  } catch (error) {
    return null
  }
}
