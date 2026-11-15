import { createError, getRequestURL } from 'h3'

function challengeError(statusCode, reason) {
  return Object.assign(createError({ statusCode, message: 'Coupon verification failed' }), { failureReason: reason })
}

export async function verifyCouponChallenge(event, token) {
  if (typeof token !== 'string' || !token.trim() || token.length > 2048) {
    throw challengeError(422, 'challenge')
  }
  const secret = process.env.TURNSTILE_SECRET_KEY
  if (!secret) throw challengeError(503, 'challengeService')

  let result
  try {
    const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      body: new URLSearchParams({ secret, response: token }),
      signal: AbortSignal.timeout(8000)
    })
    if (!response.ok) throw new Error('Siteverify unavailable')
    result = await response.json()
  } catch {
    throw challengeError(503, 'challengeService')
  }
  if (typeof result?.success !== 'boolean' ||
      result['error-codes']?.some(code => ['internal-error', 'invalid-input-secret', 'missing-input-secret'].includes(code))) {
    throw challengeError(503, 'challengeService')
  }
  if (!result.success || result.action !== 'coupon_submit' || result.hostname !== getRequestURL(event).hostname) {
    throw challengeError(422, 'challenge')
  }
}
