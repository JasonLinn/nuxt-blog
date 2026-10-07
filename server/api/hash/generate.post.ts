import { handleCouponClaim } from '../../utils/coupon-claim-handler.js'
// A serial is allocated only as part of a committed claim, never independently.
export default defineEventHandler(async event => {
  const result = await handleCouponClaim(event)
  return { ...result, hash: result.coupon.qrCodeData }
})
