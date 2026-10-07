import { readBody, createError } from 'h3'
import { requireLineUser } from './line-session.js'
import { couponPool } from './coupon-db.js'
import { pool } from './db.js'
import { claimCoupon } from './coupon-wallet.js'
import { enforceQuota } from './rate-limit.js'

export async function handleCouponClaim(event) {
  const user = requireLineUser(event)
  await enforceQuota(event, 'coupon-claim', 10, 2000)
  const body = await readBody(event)
  if (body.user?.userId && body.user.userId !== user.sub) throw createError({ statusCode: 403, statusMessage: 'Forbidden' })
  const code = body.referralCode || body.coupon?.referral?.code
  let referral = null
  if (code) {
    const result = await pool.query('SELECT code, name FROM referrals WHERE code = $1', [code])
    referral = result.rows[0] || null
  }
  return claimCoupon(couponPool, user.sub, body.articleId || body.coupon?.id, referral)
}
