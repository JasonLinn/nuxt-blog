import { requireRole } from '../utils/requireRole.js'

export default defineEventHandler((event) => {
  try {
    const userInfo = requireRole(event, 'user', 'access_token')

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
