import test from 'node:test'
import assert from 'node:assert/strict'
import { build } from 'esbuild'
import { mkdir, rm } from 'node:fs/promises'
import { createServer } from 'node:http'
import { createHmac } from 'node:crypto'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import * as h3 from 'h3'
import jwt from 'jsonwebtoken'

Object.assign(globalThis, h3)
process.env.ADMIN_JWT_SECRET = 'route-test-key'
process.env.LEGACY_JWT_SECRET = 'route-legacy-key'
process.env.LINE_SESSION_SECRET = 'route-line-key'
process.env.LINE_MESSAGING_CHANNEL_SECRET = 'route-webhook-key'
process.env.CHANNEL_ACCESS_TOKEN = 'not-a-real-provider-token'
process.env.MARKETING_DATABASE_URL = 'postgresql://test:test@127.0.0.1:1/nuxt-marketing?sslmode=require'
process.env.HOMESTAY_DATABASE_URL = 'postgresql://test:test@127.0.0.1:1/neondb?sslmode=require'
globalThis.useRuntimeConfig = () => ({ public: {} })
const adminCookie = `admin_access_token=${jwt.sign({ data: { type: 'admin' } }, process.env.ADMIN_JWT_SECRET)}`
const cache = path.resolve('.cache/security-route-tests')
await mkdir(cache, { recursive: true })
let counter = 0
async function load(relative) {
  const outfile = path.join(cache, `${counter++}.mjs`)
  await build({ entryPoints: [relative], outfile, bundle: true, platform: 'node', format: 'esm', packages: 'external', tsconfigRaw: {}, logLevel: 'silent', plugins: [{
    name: 'isolated-database', setup(builder) {
      builder.onResolve({ filter: /(?:^|\/)(?:db|coupon-db)\.js$/ }, () => ({ path: 'test-db', namespace: 'test' }))
      builder.onResolve({ filter: /^pg$/ }, () => ({ path: 'test-pg', namespace: 'test' }))
      builder.onLoad({ filter: /.*/, namespace: 'test' }, args => ({ contents: args.path === 'test-pg' ? `export default { Pool: class { query(...args) { return globalThis.securityDb(...args) } } }` : `export const query = (...args) => globalThis.securityDb(...args); export const pool = {query}; export const couponPool = pool;` }))
    }
  }] })
  return (await import(pathToFileURL(outfile))).default
}

async function request(handler, route = '/', options = {}) {
  const app = h3.createApp()
  const router = h3.createRouter().use(route, handler)
  app.use(router)
  const server = createServer(h3.toNodeListener(app))
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve))
  try {
    const response = await fetch(`http://127.0.0.1:${server.address().port}${route.replace(':id', '1')}${options.query || ''}`, options)
    const text = await response.text()
    return { status: response.status, text, data: (() => { try { return JSON.parse(text) } catch { return null } })() }
  } finally { await new Promise(resolve => server.close(resolve)) }
}

test('sensitive real route handlers reject anonymous and fake cookies before database/provider work', async () => {
  let calls = 0
  globalThis.securityDb = async () => { calls++; throw new Error('Unexpected database access') }
  const routes = [
    'admin/places/[id]/approve.post.js', 'admin/places/[id].get.js', 'coupons/review.js', 'referral-manage.ts', 'relative.post.js',
    'activities/[id].patch.js', 'yilan-activities/[id].patch.js', 'images/list.get.ts', 'images/delete.post.ts', 'upload.post.ts',
    'upload-local.post.ts', 'ai/extract-activity-info.post.ts', 'sendMsg.post.js', 'cupon.patch.js', 'user/[id].get.js',
    'user/user.post.js', 'user/appendCoupon.patch.js', 'user/updateCoupon.patch.js', 'received.post.js', 'hash/generate.post.ts',
    'activities.post.js', 'yilan-activities.post.js'
  ]
  for (const file of routes) {
    const handler = await load(`server/api/${file}`)
    for (const cookie of ['', 'admin_access_token=anything; line_session=anything']) {
      const result = await request(handler, '/:id', { method: file.endsWith('.get.js') || file.endsWith('.get.ts') ? 'GET' : 'POST', headers: { cookie } })
      assert.equal(result.status, 401, `${file}: ${result.text}`)
    }
  }
  assert.equal(calls, 0)
})

test('real PATCH route rejects a SQL identifier injection without executing UPDATE', async () => {
  const sqls = []
  globalThis.securityDb = async sql => { sqls.push(sql); return { rows: [{ id: 1, images: [] }] } }
  for (const prefix of ['activities', 'yilan-activities']) {
    const result = await request(await load(`server/api/${prefix}/[id].patch.js`), '/:id', { method: 'PATCH', headers: { cookie: adminCookie, 'content-type': 'application/json' }, body: JSON.stringify({ 'title = NULL; DROP TABLE users; --': 'x' }) })
    assert.equal(result.status, 400)
  }
  assert.ok(sqls.every(sql => !sql.includes('UPDATE')))
})

test('real activity list forces approved status for public requests and strips private fields', async () => {
  const queries = []
  globalThis.securityDb = async (sql, params) => { queries.push({ sql, params }); return { rows: sql.includes('COUNT') ? [{ total: 1 }] : [{ id: 1, title: 'public', submitter_email: 'secret', admin_notes: 'secret' }] } }
  const handler = await load('server/api/activities.get.js')
  const result = await request(handler, '/', { query: '?status=pending' })
  assert.equal(result.status, 200)
  assert.deepEqual(result.data.data, [{ id: 1, title: 'public' }])
  assert.ok(queries.every(q => q.params.includes('approved') && !q.params.includes('pending')))
  const admin = await request(handler, '/', { query: '?status=pending', headers: { cookie: adminCookie } })
  assert.equal(admin.data.data[0].submitter_email, 'secret')
})

test('webhook rejects a missing or altered signature and accepts signed raw bytes', async () => {
  globalThis.securityDb = async () => { throw new Error('Unexpected DB call') }
  const handler = await load('server/api/webhook.post.js')
  const body = '{"events":[]}'
  const signature = createHmac('sha256', process.env.LINE_MESSAGING_CHANNEL_SECRET).update(body).digest('base64')
  assert.equal((await request(handler, '/', { method: 'POST', body })).status, 401)
  assert.equal((await request(handler, '/', { method: 'POST', body: body + ' ', headers: { 'x-line-signature': signature } })).status, 401)
  assert.equal((await request(handler, '/', { method: 'POST', body, headers: { 'x-line-signature': signature } })).status, 200)
})

test('OAuth callback rejects missing or mismatched browser state before contacting LINE', async () => {
  const handler = await load('server/api/line/callback.post.js')
  const result = await request(handler, '/', { method: 'POST', headers: { 'content-type': 'application/json', cookie: 'line_oauth_state=correct' }, body: JSON.stringify({ code: 'untrusted', state: 'incorrect' }) })
  assert.equal(result.status, 401)
})

test('shared quota denies exhausted budgets and fails closed when protection storage is unavailable', async () => {
  const middleware = await load('server/middleware/01-security-limits.js')
  const handler = h3.eventHandler(async event => { await middleware(event); return { success: true } })
  const calls = []
  globalThis.securityDb = async (sql, params) => { calls.push(params); return { rows: [{ hits: 1 }] } }
  assert.equal((await request(handler, '/api/google/places/search', { method: 'POST' })).status, 200)
  assert.ok(calls.some(params => params[0] === 'google:daily'))
  globalThis.securityDb = async () => ({ rows: [] })
  assert.equal((await request(handler, '/api/google/places/search', { method: 'POST' })).status, 429)
  globalThis.securityDb = async () => { throw new Error('Storage offline') }
  assert.equal((await request(handler, '/api/google/places/search', { method: 'POST' })).status, 503)
})

test('mutation middleware rejects cross-site browser requests', async () => {
  const middleware = await load('server/middleware/auth.js')
  const handler = h3.eventHandler(event => { middleware(event); return {} })
  assert.equal((await request(handler, '/api/user/user', { method: 'POST', headers: { origin: 'https://evil.example', 'sec-fetch-site': 'cross-site' } })).status, 403)
  assert.equal((await request(handler, '/api/user/user', { method: 'POST' })).status, 200)
})

test('five uploads leave the form submission quota available and upload quota still applies', async () => {
  const middleware = await load('server/middleware/01-security-limits.js')
  const handler = h3.eventHandler(async event => { await middleware(event); return { success: true } })
  const hits = new Map()
  globalThis.securityDb = async (sql, [key, seconds, limit]) => {
    const count = hits.get(key) || 0
    if (count >= limit) return { rows: [] }
    hits.set(key, count + 1)
    return { rows: [{ hits: count + 1 }] }
  }
  const options = { method: 'POST', headers: { cookie: adminCookie } }
  for (let i = 0; i < 5; i++) assert.equal((await request(handler, '/api/upload', options)).status, 200)
  assert.equal((await request(handler, '/api/coupons/submit', options)).status, 200)
  assert.equal(hits.get('uploads:daily'), 5)
  assert.equal(hits.get('submissions:daily'), 1)
  for (let i = 5; i < 20; i++) assert.equal((await request(handler, '/api/upload', options)).status, 200)
  assert.equal((await request(handler, '/api/upload', options)).status, 429)
})

test('photo metadata returns a bounded same-origin URL rather than a credential or Base64 image', async () => {
  const handler = await load('server/api/google/places/photo.post.js')
  const response = await request(handler, '/', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ photo_reference: 'sample-reference', maxwidth: 400 }) })
  assert.equal(response.status, 200)
  assert.match(response.data.url, /^\/api\/google\/places\/image\?/)
  assert.ok(!response.data.url.includes('key=') && !response.data.url.startsWith('data:'))
})

test.after(async () => { await rm(cache, { recursive: true, force: true }) })
