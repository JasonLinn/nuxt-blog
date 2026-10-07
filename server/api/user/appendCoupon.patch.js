import { handleCouponClaim } from '../../utils/coupon-claim-handler.js'
// claimCoupon verifies archived_at IS NULL and commits inventory + wallet together.
export default defineEventHandler(handleCouponClaim)
