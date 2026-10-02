import { getAdminUsername, verifyAdminCredentials } from './adminCredentials.js'
import { signJwt } from './jwtSecret.js'

export async function loginAdmin(event, username, password, legacyResponse = false) {
  const authenticated = await verifyAdminCredentials(username, password, event)
  if (!authenticated) {
    throw createError({
      statusCode: 401,
      statusMessage: '帳號或密碼錯誤'
    })
  }

  const maxAge = 60 * 60 * 24
  const expires = Math.floor(Date.now() / 1000) + maxAge
  const adminUsername = getAdminUsername(event)
  const jwtToken = signJwt(
    {
      exp: expires,
      data: {
        id: 'admin',
        type: 'admin',
        username: adminUsername
      }
    },
    'admin',
    event
  )

  setCookie(event, 'admin_access_token', jwtToken, {
    maxAge,
    expires: new Date(expires * 1000),
    secure: true,
    httpOnly: true,
    path: '/'
  })

  if (legacyResponse) return '登入成功'

  return {
    success: true,
    message: '登入成功',
    admin: {
      username: adminUsername,
      type: 'admin'
    }
  }
}
