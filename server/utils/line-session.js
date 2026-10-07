import jwt from 'jsonwebtoken'
import { getCookie, setCookie, createError } from 'h3'
import { requiredSecret } from './security.js'

export function setLineSession(event, profile) {
  const token = jwt.sign({ sub: profile.userId, name: profile.displayName, picture: profile.pictureUrl, type: 'line' }, requiredSecret('LINE_SESSION_SECRET'), { algorithm: 'HS256', expiresIn: '1d', audience: 'coupon-wallet' })
  setCookie(event, 'line_session', token, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', path: '/', maxAge: 86400 })
}

export function requireLineUser(event, expectedId) {
  try {
    const user = jwt.verify(getCookie(event, 'line_session') || '', requiredSecret('LINE_SESSION_SECRET'), { algorithms: ['HS256'], audience: 'coupon-wallet' })
    if (user.type !== 'line' || typeof user.sub !== 'string') throw new Error('Invalid identity')
    if (expectedId !== undefined && expectedId !== user.sub) throw createError({ statusCode: 403, statusMessage: 'Forbidden' })
    return user
  } catch (error) {
    if (error.statusCode === 403 || error.statusCode === 503) throw error
    throw createError({ statusCode: 401, statusMessage: 'LINE login required' })
  }
}
