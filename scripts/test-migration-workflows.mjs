// Mutates ONLY the explicitly pinned disposable migration-validation branch.
// No email credentials are supplied to the local server used by this test.
import fs from 'node:fs'
import assert from 'node:assert/strict'
import { randomBytes } from 'node:crypto'
import pg from 'pg'
import bcrypt from 'bcryptjs'

const [urlFile, reportFile] = process.argv.slice(2)
const connectionString = fs.readFileSync(urlFile, 'utf8').trim()
assert.equal(new URL(connectionString).hostname, 'ep-sweet-bar-b3cpny32.c-4.ap-southeast-1.aws.neon.tech', 'Refusing non-validation database')
const base = 'http://127.0.0.1:3217'
const results = []
const db = new pg.Client({ connectionString })
const secret = randomBytes(24).toString('hex')
async function request(name, path, { body, cookie, status = 200, success = true } = {}) {
  const response = await fetch(base + path, { method: body ? 'POST' : 'GET', headers: { ...(body ? { 'content-type': 'application/json' } : {}), ...(cookie ? { cookie } : {}) }, ...(body ? { body: JSON.stringify(body) } : {}) })
  const data = await response.json()
  assert.equal(response.status, status, `${name}: unexpected HTTP status`)
  if (status === 200 && success) assert.equal(data.success, true, `${name}: ${data.code || 'API_FAILED'}`)
  results.push({ name, status, passed: true })
  return { data, cookie: response.headers.get('set-cookie')?.split(';')[0] }
}
try {
  await db.connect()
  const { rows } = await db.query("SELECT h.* FROM homestays h JOIN homestay_booking_status b ON b.homestay_id=h.id WHERE h.status='approved' AND h.available=true ORDER BY h.id LIMIT 1")
  assert.ok(rows.length, 'Need existing booking-status fixture')
  const fixture = rows[0]
  await db.query("UPDATE homestays SET password_hash=$1,email='migration-validation@example.invalid' WHERE id=$2", [await bcrypt.hash(secret, 10), fixture.id])
  const adminSource = fs.readFileSync('server/api/admin-login.post.js', 'utf8')
  const username = adminSource.match(/username: '([^']+)'/)[1]
  const password = adminSource.match(/password: '([^']+)'/)[1]
  const admin = await request('admin login', '/api/admin-login', { body: { username, password } })
  await request('reject anonymous review', '/api/admin-review-homestay', { body: { homestayId: fixture.id, action: 'approve' }, status: 401 })
  await db.query("UPDATE homestays SET status='pending' WHERE id=$1", [fixture.id])
  await request('admin approve', '/api/admin-review-homestay', { body: { homestayId: fixture.id, action: 'approve' }, cookie: admin.cookie })
  assert.equal((await db.query('SELECT status FROM homestays WHERE id=$1', [fixture.id])).rows[0].status, 'approved')
  const owner = await request('homestay password login', '/api/homestay-login', { body: { account: fixture.id, password: secret } })
  const auth = await request('homestay auth cookie', '/api/homestay-auth', { cookie: owner.cookie })
  await request('reject invalid password', '/api/homestay-login', { body: { account: fixture.id, password: randomBytes(16).toString('hex') }, status: 401 })
  await request('reject anonymous edit', '/api/update-homestay', { body: { name: 'test' }, status: 401 })
  const changedName = fixture.name + ' [migration validation]'
  await request('owner edit', '/api/update-homestay', { cookie: owner.cookie, body: { ...auth.data.homestay, name: changedName, social: { line: fixture.social_line, instagram: fixture.social_instagram, facebook: fixture.social_facebook } } })
  assert.equal((await db.query('SELECT name FROM homestays WHERE id=$1', [fixture.id])).rows[0].name, changedName)
  const future = new Date(Date.now() + 7 * 86400000).toISOString().slice(0,10)
  const updates = [{ date: future, available: true, notes: 'migration validation' }]
  await request('reject anonymous room update', '/api/admin/update-availability-v2', { body: { homestayId: fixture.id, updates }, status: 401 })
  await request('reject another property room update', '/api/admin/update-availability-v2', { cookie: owner.cookie, body: { homestayId: 'another-property', updates }, status: 403 })
  await request('owner room update', '/api/admin/update-availability-v2', { cookie: owner.cookie, body: { homestayId: fixture.id, updates } })
  const room = await request('room availability reread', `/api/homestay-availability-v2?homestayId=${encodeURIComponent(fixture.id)}&startDate=${future}&endDate=${future}`)
  assert.equal(room.data.data.availability[0].is_available, true)
  const saved = (await db.query('SELECT availability_data FROM homestay_booking_status WHERE homestay_id=$1', [fixture.id])).rows[0]
  assert.ok(saved.availability_data.some(d => d.date === future && d.available === true))
  await request('admin room update', '/api/admin/update-availability-v2', { cookie: admin.cookie, body: { homestayId: fixture.id, updates } })
  const detail = await request('detail after edit', '/api/fetchBnbDetail?id=' + encodeURIComponent(fixture.id))
  assert.ok(JSON.stringify(detail.data).includes(changedName))
  for (const path of ['/api/fetchBnbs','/api/homestay-map-data','/api/places','/api/place-categories','/api/yilan-activities','/api/features-options','/api/recommended-itineraries','/api/admin/system-status','/api/search-available-homestays?checkIn='+future+'&checkOut='+new Date(Date.now()+8*86400000).toISOString().slice(0,10)]) {
    await request(path.split('?')[0], path)
  }
  const itinerary = (await db.query('SELECT * FROM recommended_itineraries ORDER BY id LIMIT 1')).rows[0]
  if (itinerary) {
    await request('admin itinerary edit', '/api/admin/recommended-itineraries/save', { cookie: admin.cookie, body: { ...itinerary, title: itinerary.title + ' [migration validation]' } })
    assert.ok((await db.query('SELECT title FROM recommended_itineraries WHERE id=$1',[itinerary.id])).rows[0].title.endsWith('[migration validation]'))
  }
  await request('admin revoke approval', '/api/admin-review-homestay', { cookie: admin.cookie, body: { homestayId: fixture.id, action: 'revoke', rejectionReason: 'migration validation' } })
  assert.equal((await db.query('SELECT status FROM homestays WHERE id=$1',[fixture.id])).rows[0].status, 'rejected')
  console.log(JSON.stringify({ passed: results.length, failed: 0 }))
} catch (error) {
  results.push({ passed: false, error: error.code || error.message.replaceAll(secret, '[REDACTED]') })
  console.error(JSON.stringify(results.at(-1)))
  process.exitCode = 1
} finally {
  fs.writeFileSync(reportFile, JSON.stringify({ checkedAt: new Date().toISOString(), results }, null, 2))
  await db.end()
}
