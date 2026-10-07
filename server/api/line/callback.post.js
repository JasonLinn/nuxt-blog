import { equalSecret, requiredSecret } from '../../utils/security.js'
import { setLineSession } from '../../utils/line-session.js'

export default defineEventHandler(async event => {
  const { code, state } = await readBody(event)
  if (typeof code !== 'string' || !state || !equalSecret(state, getCookie(event, 'line_oauth_state'))) throw createError({ statusCode: 401, statusMessage: 'Invalid login state' })
  const returnTo = getCookie(event, 'line_oauth_return') || '/'
  deleteCookie(event, 'line_oauth_state', { path: '/' })
  deleteCookie(event, 'line_oauth_return', { path: '/' })
  try {
    const token = await $fetch('https://api.line.me/oauth2/v2.1/token', { method: 'POST', body: new URLSearchParams({ grant_type: 'authorization_code', code, redirect_uri: `${getRequestURL(event).origin}/line_callback`, client_id: requiredSecret('LINE_LOGIN_CHANNEL_ID'), client_secret: requiredSecret('LINE_LOGIN_CHANNEL_SECRET') }), timeout: 10000 })
    const profile = await $fetch('https://api.line.me/v2/profile', { headers: { Authorization: `Bearer ${token.access_token}` }, timeout: 10000 })
    setLineSession(event, profile)
    return { profile, returnTo: /^\/(?!\/)/.test(returnTo) && !/[\\\r\n]/.test(returnTo) ? returnTo : '/' }
  } catch { throw createError({ statusCode: 401, statusMessage: 'LINE login failed' }) }
})
