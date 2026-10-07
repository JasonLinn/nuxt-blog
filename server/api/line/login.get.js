import { randomBytes } from 'node:crypto'
import { requiredSecret } from '../../utils/security.js'

export default defineEventHandler(event => {
  const state = randomBytes(32).toString('hex')
  const returnTo = getQuery(event).returnTo
  const destination = typeof returnTo === 'string' && /^\/(?!\/)/.test(returnTo) && !/[\\\r\n]/.test(returnTo) ? returnTo : '/'
  setCookie(event, 'line_oauth_state', state, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', path: '/', maxAge: 600 })
  setCookie(event, 'line_oauth_return', destination, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', path: '/', maxAge: 600 })
  const url = new URL('https://access.line.me/oauth2/v2.1/authorize')
  url.search = new URLSearchParams({ response_type: 'code', client_id: requiredSecret('LINE_LOGIN_CHANNEL_ID'), redirect_uri: `${getRequestURL(event).origin}/line_callback`, state, scope: 'openid profile', bot_prompt: 'normal' }).toString()
  return sendRedirect(event, url.href)
})
