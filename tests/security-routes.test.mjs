import test from 'node:test'
import assert from 'node:assert/strict'
import { build } from 'esbuild'
import { mkdir, readFile, rm } from 'node:fs/promises'
import { createServer } from 'node:http'
import { createHmac } from 'node:crypto'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import * as h3 from 'h3'
import jwt from 'jsonwebtoken'

Object.assign(globalThis, h3)
const submissionDbUrl = process.env.TEST_ACTIVITY_SUBMISSION_DB === '1' && process.env.HOMESTAY_DATABASE_URL
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
      builder.onResolve({ filter: /^~\/server\/utils\/emailService\.js$/ }, () => ({ path: 'test-mail', namespace: 'test-mail' }))
      builder.onLoad({ filter: /.*/, namespace: 'test-mail' }, () => ({ contents: 'export const sendActivityApprovalEmail = async () => {}' }))
      builder.onResolve({ filter: /^#public-image-files$/ }, () => ({ path: 'test-assets', namespace: 'test-assets' }))
      builder.onLoad({ filter: /.*/, namespace: 'test-assets' }, () => ({ contents: 'export default []' }))
      builder.onLoad({ filter: /.*/, namespace: 'test' }, args => ({ contents: args.path === 'test-pg' ? `export default { Pool: class { query(...args) { return globalThis.securityDb(...args) } } }` : `export const query = (...args) => globalThis.securityDb(...args); export const pool = {query}; export const couponPool = {query, connect: async () => ({query, release() {}})};` }))
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
    const response = await fetch(`http://127.0.0.1:${server.address().port}${route.replace(':id', options.id || '1')}${options.query || ''}`, options)
    const text = await response.text()
    return { status: response.status, headers: response.headers, text, data: (() => { try { return JSON.parse(text) } catch { return null } })() }
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
    'activities.post.js', 'yilan-activities/[id]/approve.post.js', 'admin/upload-failures.get.js',
    'admin/activity-imports.get.js', 'admin/activity-imports/sync.post.js', 'admin/activity-imports/review.post.js', 'cron/activity-import.get.js'
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

test('anonymous coupon image uploads and submissions have separate enforced quotas', async () => {
  const middleware = await load('server/middleware/01-security-limits.js')
  const handler = h3.eventHandler(async event => { await middleware(event); return { success: true } })
  const hits = new Map()
  globalThis.securityDb = async (sql, [key, seconds, limit]) => {
    const count = hits.get(key) || 0
    if (count >= limit) return { rows: [] }
    hits.set(key, count + 1)
    return { rows: [{ hits: count + 1 }] }
  }
  const options = { method: 'POST' }
  for (let i = 0; i < 5; i++) assert.equal((await request(handler, '/api/coupons/upload', options)).status, 200)
  assert.equal((await request(handler, '/api/coupons/submit', options)).status, 200)
  assert.equal(hits.get('uploads:daily'), 5)
  assert.equal(hits.get('submissions:daily'), 1)
  for (let i = 5; i < 20; i++) assert.equal((await request(handler, '/api/coupons/upload', options)).status, 200)
  assert.equal((await request(handler, '/api/coupons/upload', options)).status, 429)
})

const couponBody = { title: 'Test', content: 'Test', business_name: 'Test', submitter_name: 'Guest', township: ['冬山鄉'] }
const verifiedCoupon = { success: true, hostname: '127.0.0.1', action: 'coupon_submit' }
const verifiedActivity = { ...verifiedCoupon, action: 'activity_submit' }
const activityVerificationHeaders = { 'x-turnstile-token': 'activity-test-response' }

function mockSiteverify(t, respond) {
  const original = globalThis.fetch
  t.mock.method(globalThis, 'fetch', (url, options) => {
    if (url !== 'https://challenges.cloudflare.com/turnstile/v0/siteverify') return original(url, options)
    assert.equal(options.method, 'POST')
    assert.equal(options.body.get('secret'), 'submission-test-secret')
    return respond(options.body.get('response'))
  })
}

test('a guest can upload a coupon image and submit it for review after verifying once', async t => {
  process.env.TURNSTILE_SECRET_KEY = 'submission-test-secret'
  t.after(() => { delete process.env.TURNSTILE_SECRET_KEY })
  let verified = 0
  mockSiteverify(t, token => {
    assert.equal(token, 'coupon-test-response')
    verified++
    return Response.json(verified === 1 ? verifiedCoupon : { success: false, 'error-codes': ['timeout-or-duplicate'] })
  })
  const upload = await load('server/api/coupons/upload.post.ts')
  const body = new FormData()
  body.set('file', new Blob(['invalid']), 'invalid.png')
  assert.equal((await request(upload, '/', { method: 'POST', body })).status, 400)

  const sharp = (await import('sharp')).default
  const png = await sharp({ create: { width: 2, height: 2, channels: 3, background: 'white' } }).png().toBuffer()
  body.set('file', new Blob([png], { type: 'image/png' }), 'coupon.png')
  const image = await request(upload, '/', { method: 'POST', body })
  assert.equal(image.status, 200)
  assert.match(image.data.url, /^\/uploads\/[a-f0-9-]+\.webp$/)
  t.after(() => rm(path.join('public', image.data.url), { force: true }))

  const submit = await load('server/api/coupons/submit.post.js')
  let inserted = false
  globalThis.securityDb = async (sql, params) => {
    assert.match(sql, /INSERT INTO pending_coupons/)
    assert.match(sql, /'pending'/)
    assert.deepEqual(params[10], [image.data.url])
    inserted = true
    return { rows: [{ id: 123 }] }
  }
  const result = await request(submit, '/', {
    method: 'POST', headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ ...couponBody, turnstileToken: 'coupon-test-response', cover: [image.data.url], status: 'approved' })
  })
  assert.equal(result.status, 200)
  assert.equal(result.data.data.id, 123)
  assert.ok(inserted)
  globalThis.securityDb = async sql => { assert.match(sql, /INSERT INTO upload_failures/); return { rows: [] } }
  const replay = await request(submit, '/', { method: 'POST', headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ ...couponBody, turnstileToken: 'coupon-test-response' }) })
  assert.equal(replay.status, 422)
  assert.equal(verified, 2)
})

test('coupon submissions fail closed for missing, invalid, misbound or unavailable verification', async t => {
  const handler = await load('server/api/coupons/submit.post.js')
  const queries = []
  globalThis.securityDb = async sql => { queries.push(sql); return { rows: [] } }
  const send = token => request(handler, '/', { method: 'POST', headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ ...couponBody, turnstileToken: token }) })
  let reply
  let calls = 0
  mockSiteverify(t, () => { calls++; return reply() })
  delete process.env.TURNSTILE_SECRET_KEY
  assert.equal((await send('token')).status, 503)
  process.env.TURNSTILE_SECRET_KEY = 'submission-test-secret'
  t.after(() => { delete process.env.TURNSTILE_SECRET_KEY })
  for (const token of [undefined, '', {}, 'x'.repeat(2049)]) assert.equal((await send(token)).status, 422)
  assert.equal(calls, 0)
  for (const result of [{ success: false }, verifiedActivity, { ...verifiedCoupon, hostname: 'other.example' }]) {
    reply = () => Response.json(result)
    assert.equal((await send('invalid')).status, 422)
  }
  for (const outage of [() => { throw new Error('offline') }, () => new Response('', { status: 502 }), () => Response.json({}),
    () => Response.json({ success: false, 'error-codes': ['invalid-input-secret'] })]) {
    reply = outage
    assert.equal((await send('token')).status, 503)
  }
  assert.ok(queries.every(sql => sql.includes('INSERT INTO upload_failures')))
})

async function guestActivityForm() {
  const sharp = (await import('sharp')).default
  const png = await sharp({ create: { width: 3, height: 2, channels: 3, background: 'blue' } }).png().toBuffer()
  const form = new FormData()
  for (const [field, value] of Object.entries({
    title: 'Guest activity', description: 'Details', location: '宜蘭', activity_type: '文化',
    event_start_date: '2099-01-01', organizer_name: 'Organizer', submitter_name: 'Guest',
    submitter_email: 'guest@example.invalid', price: '0', capacity: '12', website: 'https://example.org/',
    status: 'approved'
  })) form.set(field, value)
  form.append('images', new Blob([png], { type: 'image/png' }), 'guest.png')
  return form
}

function mockActivityVerification(t, respond = () => Response.json(verifiedActivity)) {
  process.env.TURNSTILE_SECRET_KEY = 'submission-test-secret'
  t.after(() => { delete process.env.TURNSTILE_SECRET_KEY })
  mockSiteverify(t, token => {
    assert.equal(token, activityVerificationHeaders['x-turnstile-token'])
    return respond()
  })
}

test('both activity submission routes require an activity challenge before parsing or saving', async t => {
  let reply
  mockActivityVerification(t, () => reply())
  let dbCalls = 0
  globalThis.securityDb = async () => { dbCalls++; return { rows: [] } }
  for (const [route, headers] of [['yilan-activities', {}], ['activities', { cookie: adminCookie }]]) {
    const handler = await load(`server/api/${route}.post.js`)
    const send = verification => request(handler, '/', { method: 'POST', headers: { ...headers, ...verification }, body: 'invalid form' })
    const missing = await send({})
    assert.equal(missing.status, 422)
    assert.equal(missing.data.data.failureReason, 'challenge')
    for (const result of [verifiedCoupon, { ...verifiedActivity, hostname: 'other.example' },
      { success: false, 'error-codes': ['timeout-or-duplicate'] }]) {
      reply = () => Response.json(result)
      assert.equal((await send(activityVerificationHeaders)).status, 422)
    }
    reply = () => { throw new Error('Siteverify unavailable') }
    const offline = await send(activityVerificationHeaders)
    assert.equal(offline.status, 503)
    assert.equal(offline.data.data.failureReason, 'challengeService')
  }
  assert.equal(dbCalls, 0)
})

test('verified guest activity submissions normalize images and ignore caller-supplied publication status', async t => {
  mockActivityVerification(t)
  const submit = await load('server/api/yilan-activities.post.js')
  const form = await guestActivityForm()
  let inserts = 0
  globalThis.securityDb = async (sql, params) => {
    assert.match(sql, /'pending'/)
    const [ids, encoded] = params.slice(-2)
    assert.deepEqual(params[2], [`/api/activity-submission-images/${ids[0]}`])
    assert.equal(Buffer.from(encoded[0], 'base64').toString('ascii', 8, 12), 'WEBP')
    inserts++
    return { rows: [{ id: 7 }] }
  }
  const response = await request(submit, '/', { method: 'POST', headers: activityVerificationHeaders, body: form })
  assert.equal(response.status, 200, response.text)
  assert.equal(response.data.data.status, 'pending')
  form.set('images', new Blob(['invalid'], { type: 'image/png' }), 'bad.png')
  assert.equal((await request(submit, '/', { method: 'POST', headers: activityVerificationHeaders, body: form })).status, 400)
  assert.equal(inserts, 1)
  const middleware = await load('server/middleware/01-security-limits.js')
  globalThis.securityDb = async () => ({ rows: [] })
  assert.equal((await request(middleware, '/api/yilan-activities', { method: 'POST' })).status, 429)
})

test('guest activity text and images follow the real review transition in PostgreSQL', { skip: !submissionDbUrl }, async t => {
  mockActivityVerification(t)
  const { Client } = (await import('pg')).default
  const client = new Client({ connectionString: submissionDbUrl })
  const schema = `guest_activity_test_${Date.now()}`
  await client.connect()
  try {
    await client.query('BEGIN')
    await client.query(`CREATE SCHEMA ${schema}`)
    await client.query(`SET LOCAL search_path TO ${schema}`)
    await client.query('CREATE TABLE yilan_activities (LIKE public.yilan_activities INCLUDING DEFAULTS INCLUDING INDEXES)')
    await client.query('CREATE SEQUENCE test_ids')
    await client.query("ALTER TABLE yilan_activities ALTER COLUMN id SET DEFAULT nextval('test_ids')")
    await client.query(await readFile('migrations/20261115_activity_submissions.sql', 'utf8'))
    globalThis.securityDb = (sql, params) => client.query(sql, params)

    const submit = await load('server/api/yilan-activities.post.js')
    const detail = await load('server/api/yilan-activities/[id].get.js')
    const list = await load('server/api/yilan-activities.get.js')
    const image = await load('server/api/activity-submission-images/[id].get.js')
    const approve = await load('server/api/yilan-activities/[id]/approve.post.js')
    const response = await request(submit, '/', { method: 'POST', headers: activityVerificationHeaders, body: await guestActivityForm() })
    assert.equal(response.status, 200, response.text)
    const { id, images } = response.data.data
    const imageId = images[0].split('/').pop()
    const admin = { headers: { cookie: adminCookie } }
    const getImage = (options = {}) => request(image, '/:id', { id: imageId, ...options })
    const getDetail = (options = {}) => request(detail, '/:id', { id, ...options })
    assert.equal((await request(list, '/', { query: '?status=pending' })).data.total, 0)
    assert.equal((await getDetail()).status, 404)
    assert.equal((await getImage({ headers: { cookie: 'admin_access_token=fake' } })).status, 404)
    const pending = (await getDetail(admin)).data.data
    assert.deepEqual([pending.status, pending.price, pending.capacity, pending.website], ['pending', 0, 12, 'https://example.org/'])
    const preview = await getImage(admin)
    assert.equal(preview.headers.get('content-type'), 'image/webp')
    assert.match(preview.headers.get('cache-control'), /no-store/)
    assert.equal(preview.text.slice(8, 12), 'WEBP')
    assert.equal((await request(approve, '/:id', { id, method: 'POST' })).status, 401)
    assert.equal((await request(approve, '/:id', { id, method: 'POST', ...admin })).status, 200)
    assert.equal((await request(list)).data.total, 1)
    const published = (await getDetail()).data.data
    assert.deepEqual(published.images, images)
    assert.ok(!('submitter_email' in published))
    assert.equal((await getImage()).text, preview.text)
    await client.query("UPDATE yilan_activities SET status='rejected' WHERE id=$1", [id])
    assert.equal((await getImage()).status, 404)
    await client.query("UPDATE yilan_activities SET status='approved', images='{}' WHERE id=$1", [id])
    assert.equal((await getImage()).status, 404)
    await client.query('DELETE FROM yilan_activities WHERE id=$1', [id])
    assert.equal((await client.query('SELECT id FROM activity_submission_images')).rowCount, 0)
  } finally {
    await client.query('ROLLBACK')
    await client.end()
  }
})

test('failure reports store allowlisted diagnostics and can be looked up by an admin', async () => {
  const receive = await load('server/api/upload-failures.post.js')
  const lookup = await load('server/api/admin/upload-failures.get.js')
  const id = '6c8ef689-9a39-4931-a1f8-51464635aaef'
  const record = { id, at: new Date().toISOString(), source: 'coupon', stage: 'select', reason: 'format',
    mime: 'image/heic', bytes: 912, filename: 'private-filename', message: 'private-message' }
  let saved
  globalThis.securityDb = async (sql, params) => {
    if (sql.includes('INSERT INTO upload_failures')) {
      assert.match(sql, /ON CONFLICT \(id\) DO NOTHING/)
      saved = params
    }
    return { rows: [{ hits: 1 }] }
  }
  const post = data => request(receive, '/', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(data) })
  assert.equal((await post({ ...record, reason: 'private-message' })).status, 400)
  assert.equal((await post(record)).data.recorded, true)
  assert.deepEqual(saved.slice(2), ['coupon', 'select', 'format', null, 'image/heic', 912, 'browser', null])
  assert.equal(JSON.stringify(saved).includes('private'), false)
  globalThis.securityDb = async (_sql, [key]) => ({ rows: key === id ? [{ id }] : [] })
  assert.deepEqual((await request(lookup, '/', { query: '?id=' + id, headers: { cookie: adminCookie } })).data.rows, [{ id }])
})

test('a rejected coupon submission returns the same reference and reason saved by the server', async () => {
  const handler = await load('server/api/coupons/submit.post.js')
  let saved
  globalThis.securityDb = async (sql, params) => { assert.match(sql, /INSERT INTO upload_failures/); saved = params; return { rows: [] } }
  const result = await request(handler, '/', { method: 'POST', headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ title: 'T', content: 'T', business_name: 'T', submitter_name: 'T', township: [] }) })
  assert.equal(result.status, 400)
  assert.equal(result.data.data.incident.id, saved[0])
  assert.equal(result.data.data.incident.reason, 'township')
  assert.equal(result.data.data.incident.saved, true)
})

test('photo metadata returns a bounded same-origin URL rather than a credential or Base64 image', async () => {
  const handler = await load('server/api/google/places/photo.post.js')
  const response = await request(handler, '/', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ photo_reference: 'sample-reference', maxwidth: 400 }) })
  assert.equal(response.status, 200)
  assert.match(response.data.url, /^\/api\/google\/places\/image\?/)
  assert.ok(!response.data.url.includes('key=') && !response.data.url.startsWith('data:'))
})

test.after(async () => { await rm(cache, { recursive: true, force: true }) })
