import { requireLineUser } from '../utils/line-session.js'
import { couponPool } from '../utils/coupon-db.js'
import { redeemCoupon } from '../utils/coupon-wallet.js'
// redeemCoupon requires archived_at IS NULL and updates the wallet atomically.
export default defineEventHandler(async event => {
  const user = requireLineUser(event)
  const body = await readBody(event)
  if (body.user_id && body.user_id !== user.sub) throw createError({ statusCode: 403, statusMessage: 'Forbidden' })
  return redeemCoupon(couponPool, user.sub, body.coupon_id, body.claimId, body.gotTime)
})
