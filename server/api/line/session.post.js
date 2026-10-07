import { setLineSession } from '../../utils/line-session.js'
import { requiredSecret } from '../../utils/security.js'

export default defineEventHandler(async event => {
  const { accessToken } = await readBody(event)
  if (typeof accessToken !== 'string' || accessToken.length > 4096) throw createError({ statusCode: 400, statusMessage: 'Invalid token' })
  try {
    const verified = await $fetch('https://api.line.me/oauth2/v2.1/verify', { query: { access_token: accessToken }, timeout: 10000 })
    if (verified.client_id !== requiredSecret('LINE_LOGIN_CHANNEL_ID') || verified.expires_in <= 0) throw new Error('Invalid audience')
    const profile = await $fetch('https://api.line.me/v2/profile', { headers: { Authorization: `Bearer ${accessToken}` }, timeout: 10000 })
    setLineSession(event, profile)
    return { success: true, profile }
  } catch { throw createError({ statusCode: 401, statusMessage: 'Invalid LINE credentials' }) }
})
