import test from 'node:test'
import assert from 'node:assert/strict'
import { createServer } from 'node:http'
import { createApp, eventHandler, toNodeListener } from 'h3'
import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import sharp from 'sharp'
import { requireAdmin } from '../server/utils/admin-auth.js'
import { setLineSession, requireLineUser } from '../server/utils/line-session.js'
import { validateActivityUpdate, publicActivity } from '../server/utils/security.js'
import { normalizeImage, containedImagePath } from '../server/utils/safe-images.js'
import { verifyHomestayPassword } from '../server/utils/homestay-password.js'
import { sanitizeRichContent } from '../utils/rich-content.js'
import { escapeHtml, safeImageUrl } from '../utils/safe-content.js'
import { claimCoupon, redeemCoupon } from '../server/utils/coupon-wallet.js'

process.env.ADMIN_JWT_SECRET = 'test-admin-key-only'
process.env.LEGACY_JWT_SECRET = 'test-legacy-key-only'
process.env.LINE_SESSION_SECRET = 'test-line-key-only'

async function withServer(handler, run) {
  const server = createServer(toNodeListener(createApp().use(eventHandler(handler))))
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve))
  try { await run(`http://127.0.0.1:${server.address().port}`) }
  finally { await new Promise(resolve => server.close(resolve)) }
}

test('admin guard rejects missing, forged, expired and wrong-role cookies; accepts verified admin', async () => {
  await withServer(event => requireAdmin(event), async url => {
    const tokens = ['', 'anything', jwt.sign({ data: { type: 'admin' } }, 'attacker'), jwt.sign({ data: { type: 'homestay' } }, process.env.ADMIN_JWT_SECRET), jwt.sign({ data: { type: 'admin' } }, process.env.ADMIN_JWT_SECRET, { expiresIn: -1 })]
    for (const token of tokens) assert.equal((await fetch(url, { headers: { cookie: `admin_access_token=${token}` } })).status, 401)
    const token = jwt.sign({ data: { type: 'admin', id: 'admin' } }, process.env.ADMIN_JWT_SECRET)
    assert.equal((await fetch(url, { headers: { cookie: `admin_access_token=${token}` } })).status, 200)
    const legacy = jwt.sign({ data: { id: 1 } }, process.env.LEGACY_JWT_SECRET)
    assert.equal((await fetch(url, { headers: { cookie: `access_token=${legacy}` } })).status, 200)
  })
})

test('LINE session is HttpOnly and rejects another wallet identity or an unsigned token', async () => {
  let cookie
  await withServer(event => { setLineSession(event, { userId: 'owner', displayName: 'Name' }); return {} }, async url => {
    cookie = (await fetch(url)).headers.get('set-cookie')
    assert.match(cookie, /HttpOnly/i)
    assert.match(cookie, /SameSite=Lax/i)
  })
  await withServer(event => requireLineUser(event, 'owner'), async url => {
    assert.equal((await fetch(url, { headers: { cookie: cookie.split(';')[0] } })).status, 200)
    assert.equal((await fetch(url, { headers: { cookie: 'line_session=forged' } })).status, 401)
  })
  await withServer(event => requireLineUser(event, 'victim'), async url => {
    assert.equal((await fetch(url, { headers: { cookie: cookie.split(';')[0] } })).status, 403)
  })
})

test('homestay login never accepts deterministic fallback or an absent hash', async () => {
  const hash = await bcrypt.hash('actual-password', 4)
  assert.equal(await verifyHomestayPassword('actual-password', hash), true)
  assert.equal(await verifyHomestayPassword('B123', hash), false)
  assert.equal(await verifyHomestayPassword('B123', null), false)
})

test('activity updates reject injected SQL identifiers, protected columns and malformed values', () => {
  for (const body of [{ 'title = NULL; DROP TABLE x;--': 'x' }, { id: 22 }, { approved_by: 'me' }, { status: 'anything' }, { images: ['javascript:alert(1)'] }, { title: {} }, []]) assert.throws(() => validateActivityUpdate(body), { statusCode: 400 })
  assert.deepEqual(validateActivityUpdate({ title: '活動', images: ['/activities/abc.webp'] }), { title: '活動', images: ['/activities/abc.webp'] })
})

test('public activities omit submitter contact and moderation details', () => {
  assert.deepEqual(publicActivity({ id: 1, title: '公開', submitter_email: 'private', submitter_name: 'private', admin_notes: 'private', rejection_reason: 'private', approved_by: 'private' }), { id: 1, title: '公開' })
})

test('rich text retains formatting while removing executable content and unsafe attributes', () => {
  const clean = sanitizeRichContent('<p>Hello <strong>world</strong></p><script>alert(1)</script><img src="x" onerror="alert(2)"><a href="javascript:alert(3)">click</a><svg onload="alert(4)"></svg>')
  assert.match(clean, /<strong>world<\/strong>/)
  assert.doesNotMatch(clean, /onerror|onload|javascript:|<script|<svg|alert\(/)
  assert.equal(escapeHtml('"/><script>&'), '&quot;/&gt;&lt;script&gt;&amp;')
  assert.equal(safeImageUrl('javascript:alert(1)'), '')
  assert.equal(safeImageUrl('//evil.example/a'), '')
})

test('image decoder rejects active content and rewrites real image bytes with a safe filename', async () => {
  for (const content of ['<html><script>alert(1)</script></html>', '<svg xmlns="http://www.w3.org/2000/svg"><rect width="1" height="1"/></svg>', 'fake png']) await assert.rejects(normalizeImage(Buffer.from(content)), { statusCode: 400 })
  const png = await sharp({ create: { width: 2, height: 2, channels: 3, background: '#fff' } }).png().toBuffer()
  const image = await normalizeImage(png)
  assert.match(image.filename, /^[a-f0-9-]+\.webp$/)
  assert.equal((await sharp(image.data).metadata()).format, 'webp')
})

test('image deletion confines filenames to the activity directory', () => {
  for (const url of ['/activities/../../.env', '/activities/%2e%2e/secret.png', '/activities/..\\secret.png', '/uploads/x.png', '/activities/a.svg', '/activities/a.png/../b.png']) assert.equal(containedImagePath(url, 'activities'), null)
  assert.ok(containedImagePath('/activities/abc-123.webp', 'activities'))
})

function walletDb({ amount = 2, coupons = [], isonce = true, hash = false, archived = false, failAppend = false } = {}) {
  const calls = []
  const client = {
    async query(sql, params = []) {
      calls.push({ sql, params })
      if (sql.startsWith('SELECT * FROM "article"')) return { rows: archived ? [] : [{ id: 1, amount, isonce, hash, title: 'Real coupon', content: 'Real terms' }] }
      if (sql.startsWith('SELECT id FROM "article"')) return { rows: archived ? [] : [{ id: 1 }] }
      if (sql.startsWith('SELECT * FROM "user"')) return { rows: [{ user_id: 'owner', name: 'Real user', coupons }] }
      if (sql.startsWith('SELECT id, index_number')) return { rows: [{ id: 7, index_number: 8, hash_value: 'REAL-SERIAL' }] }
      if (sql.startsWith('UPDATE "article"')) return { rows: [{ amount: amount - 1 }] }
      if (sql.startsWith('UPDATE "user"') && failAppend) throw new Error('DB write failed')
      return { rows: [] }
    }, release() { calls.push({ sql: 'RELEASE' }) }
  }
  return { calls, connect: async () => client }
}

test('claim uses authoritative content, commits inventory and serial with the authenticated wallet', async () => {
  const db = walletDb({ hash: true })
  const result = await claimCoupon(db, 'owner', 1)
  assert.equal(result.coupon.title, 'Real coupon')
  assert.equal(result.coupon.qrCodeData, 'REAL-SERIAL')
  assert.equal(result.amount, 1)
  assert.equal(db.calls.find(c => c.sql.startsWith('UPDATE "user"')).params[1], 'owner')
  assert.equal(db.calls.at(-2).sql, 'COMMIT')
})

test('sold out, archived, already claimed, or failed wallet write never commits a claim', async () => {
  for (const setup of [{ amount: 0 }, { archived: true }, { coupons: [JSON.stringify({ id: 1 })] }, { failAppend: true, hash: true }]) {
    const db = walletDb(setup)
    await assert.rejects(claimCoupon(db, 'owner', 1))
    assert.ok(db.calls.some(c => c.sql === 'ROLLBACK'))
    assert.ok(!db.calls.some(c => c.sql === 'COMMIT'))
  }
})

test('redemption requires an owned, unredeemed, unarchived claim; content and identity come from storage', async () => {
  const owned = { id: 1, claimId: 'claim', title: 'Real title', content: 'Real terms', gotTime: 'time' }
  const db = walletDb({ coupons: [JSON.stringify(owned)] })
  const result = await redeemCoupon(db, 'owner', 1, 'claim')
  assert.equal(result.coupons[0].received, true)
  const inserted = db.calls.find(c => c.sql.startsWith('INSERT INTO received')).params
  assert.deepEqual(inserted.slice(0, 5), ['Real title', 1, 'Real terms', 'owner', 'Real user'])
  for (const setup of [{ coupons: [] }, { archived: true }, { coupons: [{ ...owned, received: true }] }]) {
    const badDb = walletDb(setup)
    await assert.rejects(redeemCoupon(badDb, 'owner', 1, 'claim'))
    assert.ok(!badDb.calls.some(c => c.sql.startsWith('INSERT INTO received')))
  }
})
