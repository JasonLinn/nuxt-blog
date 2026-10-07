import { randomUUID } from 'node:crypto'
import { createError } from 'h3'

export function parseCoupons(values) {
  return (values || []).map(value => typeof value === 'string' ? JSON.parse(value) : value).filter(Boolean)
}

// Inventory, serial allocation and wallet append commit together, under row locks.
export async function claimCoupon(db, userId, articleId, referral = null) {
  if (!/^\d+$/.test(String(articleId))) throw createError({ statusCode: 400, statusMessage: 'Invalid coupon ID' })
  const client = await db.connect()
  try {
    await client.query('BEGIN')
    const { rows: articles } = await client.query('SELECT * FROM "article" WHERE id = $1 AND archived_at IS NULL FOR UPDATE', [articleId])
    const article = articles[0]
    if (!article || Number(article.amount) <= 0) throw createError({ statusCode: 409, statusMessage: 'Coupon unavailable' })
    const { rows: users } = await client.query('SELECT * FROM "user" WHERE user_id = $1 FOR UPDATE', [userId])
    const user = users[0]
    if (!user) throw createError({ statusCode: 401, statusMessage: 'Member registration required' })
    const coupons = parseCoupons(user.coupons)
    if (article.isonce && coupons.some(coupon => String(coupon.id) === String(article.id))) throw createError({ statusCode: 409, statusMessage: 'Coupon already claimed' })
    if (article.isReferral && !referral) throw createError({ statusCode: 400, statusMessage: 'Valid referral required' })
    const coupon = { ...article, referral, claimId: randomUUID(), gotTime: new Date().toISOString(), received: false, qrCodeData: null }
    if (article.hash === true) {
      const { rows } = await client.query('SELECT id, index_number, hash_value FROM available_hash ORDER BY id LIMIT 1 FOR UPDATE SKIP LOCKED')
      if (!rows[0]) throw createError({ statusCode: 409, statusMessage: 'No serials available' })
      const hash = rows[0]
      await client.query('DELETE FROM available_hash WHERE id = $1', [hash.id])
      await client.query('INSERT INTO used_hash (index_number, hash_value, article_id) VALUES ($1, $2, $3)', [hash.index_number, hash.hash_value, article.id])
      coupon.qrCodeData = hash.hash_value
    }
    const { rows } = await client.query('UPDATE "article" SET amount = amount - 1, updated_at = NOW() WHERE id = $1 AND archived_at IS NULL AND amount > 0 RETURNING amount', [article.id])
    if (!rows[0]) throw createError({ statusCode: 409, statusMessage: 'Coupon unavailable' })
    coupon.amount = rows[0].amount
    await client.query('UPDATE "user" SET coupons = array_append(coupons, $1) WHERE user_id = $2', [JSON.stringify(coupon), userId])
    await client.query('COMMIT')
    return { success: true, coupon, amount: coupon.amount }
  } catch (error) {
    await client.query('ROLLBACK')
    throw error
  } finally { client.release() }
}

export async function redeemCoupon(db, userId, articleId, claimId, gotTime) {
  if (!articleId || (!claimId && !gotTime)) throw createError({ statusCode: 400, statusMessage: 'Coupon claim required' })
  const client = await db.connect()
  try {
    await client.query('BEGIN')
    const { rows: articles } = await client.query('SELECT id FROM "article" WHERE id = $1 AND archived_at IS NULL FOR UPDATE', [articleId])
    if (!articles[0]) throw createError({ statusCode: 409, statusMessage: 'Coupon unavailable' })
    const { rows: users } = await client.query('SELECT * FROM "user" WHERE user_id = $1 FOR UPDATE', [userId])
    const user = users[0]
    if (!user) throw createError({ statusCode: 404, statusMessage: 'Member not found' })
    const coupons = parseCoupons(user.coupons)
    const coupon = coupons.find(item => String(item.id) === String(articleId) && (claimId ? item.claimId === claimId : item.gotTime === gotTime))
    if (!coupon) throw createError({ statusCode: 404, statusMessage: 'Coupon not in wallet' })
    if (coupon.received) throw createError({ statusCode: 409, statusMessage: 'Already redeemed' })
    coupon.received = true
    coupon.receivedTime = new Date().toISOString()
    await client.query('INSERT INTO received (coupon_title, coupon_id, coupon_content, user_id, user_name, remark, received_time) VALUES ($1, $2, $3, $4, $5, $6, $7)', [coupon.title, coupon.id, coupon.content, userId, user.name, '', coupon.receivedTime])
    await client.query('UPDATE "user" SET coupons = $1 WHERE user_id = $2', [coupons.map(item => JSON.stringify(item)), userId])
    await client.query('COMMIT')
    return { success: true, coupons }
  } catch (error) {
    await client.query('ROLLBACK')
    throw error
  } finally { client.release() }
}
