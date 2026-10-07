import { requireLineUser } from '../../utils/line-session.js'
import { couponPool } from '../../utils/coupon-db.js'
export default defineEventHandler(async event => {
  const user = requireLineUser(event)
  const body = await readBody(event)
  if (body.user_id && body.user_id !== user.sub) throw createError({ statusCode: 403, statusMessage: 'Forbidden' })
  const client = await couponPool.connect()
  try {
    await client.query('BEGIN')
    await client.query('SELECT pg_advisory_xact_lock(hashtext($1))', [user.sub])
    let result = await client.query('SELECT user_id, name, cover FROM "user" WHERE user_id = $1', [user.sub])
    if (!result.rows.length) result = await client.query('INSERT INTO "user" (name, cover, user_id, coupons, msg_times) VALUES ($1, $2, $3, $4, 0) RETURNING user_id, name, cover', [user.name, user.picture, user.sub, []])
    await client.query('COMMIT')
    return result.rows[0]
  } catch (error) { await client.query('ROLLBACK'); throw error } finally { client.release() }
})
