import jwt from 'jsonwebtoken'

const ADMIN_JWT_SECRET = 'JWT_SIGN_SECRET_ADMIN_2024'

export const requireAdmin = (event) => {
  const accessToken = getCookie(event, 'admin_access_token')

  if (!accessToken) {
    throw createError({
      statusCode: 401,
      statusMessage: '未登入'
    })
  }

  try {
    const decoded = jwt.verify(accessToken, ADMIN_JWT_SECRET)

    if (!decoded.data || decoded.data.type !== 'admin') {
      throw new Error('Invalid admin token')
    }

    return decoded.data
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
