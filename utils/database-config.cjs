// Shared by Nitro and maintenance scripts. Never fall back across systems.
function databaseUrl(system, env = process.env) {
  const keys = { homestay: 'HOMESTAY_DATABASE_URL', marketing: 'MARKETING_DATABASE_URL' }
  const key = keys[system]
  if (!key) throw new Error('Unknown database system')
  const value = env[key]
  if (!value) throw new Error(`${key} is required`)
  let url
  try { url = new URL(value) } catch { throw new Error(`${key} must be a PostgreSQL URL`) }
  if (!['postgres:', 'postgresql:'].includes(url.protocol) || !url.hostname || !url.username || !url.password) {
    throw new Error(`${key} must be a complete PostgreSQL URL`)
  }
  const database = decodeURIComponent(url.pathname.slice(1))
  if (system === 'homestay' && database !== 'neondb') throw new Error(`${key} must use the dedicated neondb database`)
  if (system === 'marketing' && database !== 'nuxt-marketing') throw new Error(`${key} must use nuxt-marketing`)
  if (url.searchParams.get('sslmode') !== 'require' && url.searchParams.get('sslmode') !== 'verify-full') {
    throw new Error(`${key} must require TLS`)
  }
  return value
}

module.exports = { databaseUrl }
