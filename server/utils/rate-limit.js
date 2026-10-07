import { createHash } from 'node:crypto'
import { createError, getRequestIP, setHeader } from 'h3'
import { pool } from './db.js'

// Shared counters work across serverless instances. Apply the checked-in SQL before deployment.
export async function consumeQuota(db, key, limit, seconds) {
  const result = await db.query(`
    INSERT INTO security_rate_limits (bucket, window_start, hits)
    VALUES ($1, to_timestamp(floor(extract(epoch from now()) / $2) * $2), 1)
    ON CONFLICT (bucket) DO UPDATE SET
      hits = CASE WHEN security_rate_limits.window_start = EXCLUDED.window_start THEN security_rate_limits.hits + 1 ELSE 1 END,
      window_start = EXCLUDED.window_start
    WHERE security_rate_limits.window_start <> EXCLUDED.window_start OR security_rate_limits.hits < $3
    RETURNING hits`, [key, seconds, limit])
  return result.rows.length > 0
}

export async function enforceQuota(event, category, perMinute = 30, perDay = 1000) {
  // Vercel overwrites this platform header; never trust arbitrary X-Forwarded-For.
  const ip = process.env.VERCEL === '1' ? event.node.req.headers['x-vercel-forwarded-for'] : getRequestIP(event)
  const identity = createHash('sha256').update(String(ip || 'unknown')).digest('hex')
  try {
    const allowed = await consumeQuota(pool, `${category}:client:${identity}`, perMinute, 60)
      && await consumeQuota(pool, `${category}:daily`, perDay, 86400)
    if (!allowed) {
      setHeader(event, 'Retry-After', '60')
      throw createError({ statusCode: 429, statusMessage: 'Request limit reached' })
    }
  } catch (error) {
    if (error.statusCode === 429) throw error
    throw createError({ statusCode: 503, statusMessage: 'Request protection unavailable' })
  }
}
