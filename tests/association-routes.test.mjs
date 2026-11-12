import test from 'node:test'
import assert from 'node:assert/strict'
import { build } from 'esbuild'
import { mkdir } from 'node:fs/promises'
import { createServer } from 'node:http'
import { pathToFileURL } from 'node:url'
import path from 'node:path'
import * as h3 from 'h3'
import jwt from 'jsonwebtoken'

const originalFetch = globalThis.fetch
process.env.ADMIN_JWT_SECRET = 'association-admin-test-key'
process.env.LEGACY_JWT_SECRET = 'association-legacy-test-key'
process.env.YTHMA_BNB_API_KEY = 'private-source-key'
const cookie = `admin_access_token=${jwt.sign(
  { data: { type: 'admin' } },
  process.env.ADMIN_JWT_SECRET
)}`
const dir = path.resolve('.cache/association-route-tests')
await mkdir(dir, { recursive: true })
let index = 0
async function load(file) {
  const outfile = path.join(dir, `${index++}.mjs`)
  await build({
    entryPoints: [file],
    outfile,
    bundle: true,
    platform: 'node',
    format: 'esm',
    packages: 'external',
    tsconfigRaw: {},
    logLevel: 'silent',
    plugins: [
      {
        name: 'read-only-db',
        setup(builder) {
          builder.onResolve({ filter: /\/db\.js$/ }, () => ({ path: 'mock-db', namespace: 'test' }))
          builder.onLoad({ filter: /.*/, namespace: 'test' }, () => ({
            contents: 'export const pool = {connect: () => globalThis.associationTestConnect()};'
          }))
        }
      }
    ]
  })
  return (await import(pathToFileURL(outfile))).default
}
const handlers = {
  preview: await load('server/api/admin/association-sync/preview.post.js'),
  status: await load('server/api/admin/association-sync/status.get.js'),
  run: await load('server/api/admin/association-sync/run.post.js')
}
const auth = await load('server/middleware/auth.js')
async function withServer(fn) {
  const app = h3.createApp()
  app.use(auth)
  const router = h3.createRouter()
  for (const [name, handler] of Object.entries(handlers))
    router.use(`/api/admin/association-sync/${name}`, handler)
  app.use(router)
  const server = createServer(h3.toNodeListener(app))
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve))
  const request = async (name, options = {}) => {
    const response = await originalFetch(
      `http://127.0.0.1:${server.address().port}/api/admin/association-sync/${name}`,
      options
    )
    return { status: response.status, headers: response.headers, data: await response.json() }
  }
  try {
    await fn(request)
  } finally {
    await new Promise((resolve) => server.close(resolve))
  }
}

test('all routes require a real admin and reject cross-site preview before provider/DB access', async () => {
  let calls = 0
  globalThis.fetch = async () => {
    calls++
    throw new Error('unexpected')
  }
  globalThis.associationTestConnect = async () => {
    calls++
    throw new Error('unexpected')
  }
  try {
    await withServer(async (request) => {
      for (const name of Object.keys(handlers))
        for (const badCookie of [
          '',
          'admin_access_token=fake',
          `admin_access_token=${jwt.sign(
            { data: { type: 'homestay' } },
            process.env.ADMIN_JWT_SECRET
          )}`
        ]) {
          assert.equal(
            (
              await request(name, {
                method: name === 'status' ? 'GET' : 'POST',
                headers: { cookie: badCookie }
              })
            ).status,
            401
          )
        }
      assert.equal(
        (
          await request('preview', {
            method: 'POST',
            headers: { cookie, origin: 'https://evil.example', 'sec-fetch-site': 'cross-site' }
          })
        ).status,
        403
      )
    })
    assert.equal(calls, 0)
  } finally {
    globalThis.fetch = originalFetch
  }
})

test('import cannot be unlocked by env flags or apply body; status exposes no credentials', async () => {
  process.env.ASSOCIATION_SYNC_ENABLED = 'true'
  process.env.ASSOCIATION_SYNC_DRY_RUN = 'false'
  await withServer(async (request) => {
    const result = await request('run', {
      method: 'POST',
      headers: { cookie, 'content-type': 'application/json' },
      body: '{"apply":true}'
    })
    assert.equal(result.status, 409)
    assert.equal(result.data.data.code, 'IMPORT_DISABLED')
    const status = await request('status', { headers: { cookie } })
    assert.equal(status.data.can_import, false)
    assert.equal(status.data.scheduled, false)
    assert.equal(status.data.source_configured, true)
    assert.doesNotMatch(JSON.stringify(status.data), /private-source-key/)
    assert.match(status.headers.get('cache-control'), /no-store/)
  })
})

test('authenticated preview ignores write/URL input and coalesces concurrent requests without writes', async () => {
  let providerCalls = 0
  const sqls = []
  globalThis.fetch = async (url) => {
    providerCalls++
    assert.equal(url, 'https://ythma.com/api/bnb/')
    await new Promise((resolve) => setTimeout(resolve, 50))
    return new Response(
      JSON.stringify({ ok: true, count: 0, generated_at: new Date().toISOString(), data: [] }),
      { headers: { 'content-type': 'application/json' } }
    )
  }
  globalThis.associationTestConnect = async () => ({
    query: async (sql) => {
      sqls.push(sql)
      return { rows: [] }
    },
    release() {}
  })
  try {
    await withServer(async (request) => {
      const results = await Promise.all(
        [1, 2].map(() =>
          request('preview', {
            method: 'POST',
            headers: { cookie, 'content-type': 'application/json' },
            body: '{"apply":true,"url":"https://evil.example"}'
          })
        )
      )
      for (const result of results) {
        assert.equal(result.status, 200)
        assert.equal(result.data.can_import, false)
        assert.equal(result.data.summary.writes, 0)
        assert.match(result.headers.get('cache-control'), /no-store/)
      }
    })
    assert.equal(providerCalls, 1)
    assert.equal(sqls.filter((sql) => sql === 'ROLLBACK').length, 1)
    assert.ok(sqls.every((sql) => !/INSERT|UPDATE|DELETE/.test(sql)))
  } finally {
    globalThis.fetch = originalFetch
  }
})
