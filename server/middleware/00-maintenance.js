// Opt-in only, enabled during an explicitly approved cutover window.
// Blocks GET too: existing detail/login/pageview routes can write to the database.
export default defineEventHandler((event) => {
  if (process.env.SITE_MAINTENANCE_MODE !== 'true') return
  setResponseHeader(event, 'Retry-After', '1200')
  setResponseHeader(event, 'Cache-Control', 'no-store')
  throw createError({ statusCode: 503, statusMessage: 'Maintenance', message: '網站資料維護中，請稍後再試。' })
})
