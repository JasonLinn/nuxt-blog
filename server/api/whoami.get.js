import { requiredSecret } from '../utils/security.js'
import jwt from 'jsonwebtoken'

export default defineEventHandler((event) => {
  const jwtToken = getCookie(event, 'access_token')

  try {
    const { data: userInfo } = jwt.verify(jwtToken, requiredSecret('LEGACY_JWT_SECRET'))

    return {
      id: userInfo.id,
      nickname: userInfo.nickname,
      email: userInfo.email,
      avatar: userInfo.avatar
    }
  } catch (e) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Unauthorized'
    })
  }
})
