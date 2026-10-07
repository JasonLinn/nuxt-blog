import { requiredSecret } from './security.js'
import jwt from 'jsonwebtoken'
import { getCookie, createError } from 'h3'



export const requireAdmin = (event) => {
  const modernToken = getCookie(event, 'admin_access_token')
  const accessToken = modernToken || getCookie(event, 'access_token')

  if (!accessToken) {
    throw createError({
      statusCode: 401,
      statusMessage: '未登入'
    })
  }

  try {
    const decoded = jwt.verify(accessToken, requiredSecret(modernToken ? 'ADMIN_JWT_SECRET' : 'LEGACY_JWT_SECRET'), { algorithms: ['HS256'] })

    if (!decoded.data || (modernToken ? decoded.data.type !== 'admin' : decoded.data.id !== 1)) {
      throw new Error('Invalid admin token')
    }

    return { ...decoded.data, type: 'admin' }
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
