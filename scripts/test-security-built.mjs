import { spawn } from 'node:child_process'
import { createServer } from 'node:net'
import { once } from 'node:events'
import assert from 'node:assert/strict'
import { createHmac } from 'node:crypto'
const probe = createServer()
probe.listen(0, '127.0.0.1')
await once(probe, 'listening')
const port = probe.address().port
await new Promise(resolve => probe.close(resolve))
const proc = spawn(process.execPath, ['.output/server/index.mjs'], { windowsHide: true, env: {
  ...process.env, NITRO_HOST: '127.0.0.1', NITRO_PORT: String(port),
  HOMESTAY_DATABASE_URL: 'postgresql://test:test@127.0.0.1:1/neondb?sslmode=require',
  MARKETING_DATABASE_URL: 'postgresql://test:test@127.0.0.1:1/nuxt-marketing?sslmode=require',
  ADMIN_JWT_SECRET: 'smoke-admin', LEGACY_JWT_SECRET: 'smoke-legacy', HOMESTAY_JWT_SECRET: 'smoke-home',
  LINE_SESSION_SECRET: 'smoke-line', LINE_MESSAGING_CHANNEL_SECRET: 'smoke-webhook',
  CHANNEL_ACCESS_TOKEN: 'test', LINE_LOGIN_CHANNEL_ID: 'test', LINE_LOGIN_CHANNEL_SECRET: 'test',
  NUXT_GITHUB_TOKEN: '', NUXT_GOOGLE_MAPS_API_KEY: '', SITE_MAINTENANCE_MODE: 'false'
}, stdio: ['ignore', 'pipe', 'pipe'] })
let output = ''
proc.stdout.on('data', value => { output += value })
proc.stderr.on('data', value => { output += value })
const base = `http://127.0.0.1:${port}`
try {
  await new Promise((resolve, reject) => {
    const start = Date.now()
    const interval = setInterval(() => {
      if (output.includes('Listening')) { clearInterval(interval); resolve() }
      else if (proc.exitCode !== null || Date.now() - start > 20000) { clearInterval(interval); reject(new Error('Isolated server did not start')) }
    }, 100)
  })
  const routes = [
    ['POST', '/api/admin/places/1/approve'], ['GET', '/api/admin/places/1'], ['GET', '/api/coupons/review'],
    ['POST', '/api/referral-manage'], ['POST', '/api/relative'], ['PATCH', '/api/activities/1'], ['PATCH', '/api/yilan-activities/1'],
    ['GET', '/api/images/list'], ['POST', '/api/images/delete'], ['POST', '/api/upload'], ['POST', '/api/upload-local'],
    ['POST', '/api/ai/extract-activity-info'], ['POST', '/api/sendMsg'], ['PATCH', '/api/cupon'], ['GET', '/api/user/victim'],
    ['POST', '/api/user/user'], ['PATCH', '/api/user/appendCoupon'], ['PATCH', '/api/user/updateCoupon'], ['POST', '/api/received'],
    ['POST', '/api/hash/generate'], ['POST', '/api/activities'], ['POST', '/api/yilan-activities']
  ]
  for (const [method, route] of routes) {
    const response = await fetch(base + route, { method, headers: { cookie: 'admin_access_token=fake; line_session=fake' } })
    assert.equal(response.status, 401, `${method} ${route}`)
  }
  const body = '{"events":[]}'
  const signature = createHmac('sha256', 'smoke-webhook').update(body).digest('base64')
  assert.equal((await fetch(base + '/api/webhook', { method: 'POST', body, headers: { 'x-line-signature': signature } })).status, 200)
  assert.equal((await fetch(base + '/api/webhook', { method: 'POST', body })).status, 401)
  const login = await fetch(base + '/api/line/login?returnTo=%2FuserInfo', { redirect: 'manual' })
  assert.equal(login.status, 302)
  assert.match(login.headers.get('location'), /^https:\/\/access.line.me\//)
  assert.match(login.headers.get('set-cookie'), /HttpOnly/)
  console.log('Production build smoke: 22 protected routes + webhook signed/unsigned + OAuth redirect passed; no production DB/provider calls.')
} finally {
  proc.kill()
  if (proc.exitCode === null) await once(proc, 'exit')
}
