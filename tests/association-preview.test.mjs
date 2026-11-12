import test from 'node:test'
import assert from 'node:assert/strict'
import {
  fetchAssociationSnapshot,
  normalizeAssociationSnapshot,
  safeAssociationUrl
} from '../server/services/association-source.js'
import {
  buildAssociationPreview,
  normalizePhone,
  websiteIdentity,
  previewAssociationMembers
} from '../server/services/association-preview.js'

const now = Date.parse('2026-11-13T01:00:00+08:00')
const source = (patch = {}) => ({
  id: 'external_01',
  name: '山海民宿',
  area: '冬山鄉',
  phone: '039500001',
  website: 'https://stay.example.com/room?id=1',
  line_url: 'https://line.me/ti/p/example',
  photos: [],
  updated_at: '2026-11-12T01:00:00+08:00',
  email: 'private@example.com',
  owner_name: 'PRIVATE OWNER',
  ...patch
})
const payload = (rows = [source()]) => ({
  ok: true,
  count: rows.length,
  generated_at: new Date(now).toISOString(),
  data: rows
})
const snapshot = (rows) => normalizeAssociationSnapshot(payload(rows), now)
const local = (patch = {}) => ({
  id: '001',
  name: '山海民宿',
  location: '冬山鄉',
  phone: '03-9500001',
  website: 'http://www.stay.example.com/room?id=1&utm_source=old',
  social_line: 'https://line.me/ti/p/example',
  images: [],
  status: 'approved',
  available: true,
  email: 'LOCAL PRIVATE',
  password_hash: 'PRIVATE HASH',
  ...patch
})
const options = (fetcher) => ({
  env: { YTHMA_BNB_API_KEY: 'test-private-key' },
  fetcher,
  now,
  sleep: async () => {}
})
const jsonResponse = (value) =>
  new Response(JSON.stringify(value), {
    headers: { 'content-type': 'application/json; charset=utf-8' }
  })

test('source adapter uses the intended host/header and strips private and unknown fields', async () => {
  const result = await fetchAssociationSnapshot(
    options(async (url, request) => {
      assert.equal(url, 'https://ythma.com/api/bnb/')
      assert.equal(request.headers['X-Api-Key'], 'test-private-key')
      assert.equal(request.redirect, 'manual')
      return jsonResponse(payload([source({ future_secret: 'do not return' })]))
    })
  )
  assert.equal(result.records.length, 1)
  assert.doesNotMatch(JSON.stringify(result), /PRIVATE|private@example|future_secret|do not return/)
})

test('invalid, incomplete, duplicate and stale snapshots fail instead of implying a deletion', () => {
  for (const value of [
    null,
    { ok: false },
    { ...payload(), count: 2 },
    payload([source(), source()]),
    { ...payload(), generated_at: '2026-11-10T01:00:00Z' },
    { ...payload(), generated_at: '2030-01-01T01:00:00Z' },
    payload([source({ id: '' })]),
    payload([source({ id: '../unsafe' })])
  ]) {
    assert.throws(() => normalizeAssociationSnapshot(value, now))
  }
  const empty = snapshot([])
  assert.equal(empty.count, 0)
  assert.match(empty.warnings.join(), /不能解讀/)
})

test('invalid row links and photos are quarantined while missing photos remain a warning', () => {
  const result = snapshot([
    source({
      website: 'javascript:alert(1)',
      photos: [{ url: 'https://evil.example/p.jpg', thumb: 'https://ythma.com/p.jpg' }]
    })
  ])
  const preview = buildAssociationPreview(result, [])
  assert.equal(preview.items[0].category, 'invalid')
  assert.equal(preview.items[0].website, '')
  assert.deepEqual(preview.items[0].photos, [])
  assert.equal(snapshot([source()]).records[0].issues.length, 0)
})

test('unsafe display URLs cannot reach href attributes', () => {
  for (const url of [
    'javascript:alert(1)',
    'data:text/html,x',
    'file:///secret',
    'https://user:pass@example.com',
    'http://127.0.0.1',
    'http://2130706433',
    'http://[::1]',
    'https://foo.local',
    'https://localhost',
    'https://example.com:9000'
  ]) {
    assert.equal(safeAssociationUrl(url), null, url)
  }
  assert.equal(safeAssociationUrl('https://ythma.com/photo.jpg'), 'https://ythma.com/photo.jpg')
})

test('website identity keeps shared-platform property paths, query IDs and path case', () => {
  assert.equal(
    websiteIdentity('https://WWW.example.com/a/?b=2&a=1&utm_source=fb#top'),
    websiteIdentity('http://example.com/a?a=1&b=2')
  )
  assert.notEqual(
    websiteIdentity('https://book.example.com/?id=1'),
    websiteIdentity('https://book.example.com/?id=2')
  )
  assert.notEqual(
    websiteIdentity('https://book.example.com/A'),
    websiteIdentity('https://book.example.com/a')
  )
  assert.notEqual(
    websiteIdentity('https://facebook.com/business-a'),
    websiteIdentity('https://facebook.com/business-b')
  )
  assert.equal(normalizePhone('+886 (0)3-9500001'), '039500001')
  assert.equal(normalizePhone('003'), '')
})

test('multi-signal one-to-one candidates preserve leading-zero local IDs and produce actual differences', () => {
  const result = buildAssociationPreview(snapshot([source()]), [local()], new Date(now))
  assert.equal(result.summary.match, 1)
  assert.equal(result.items[0].candidates[0].id, '001')
  assert.deepEqual(result.items[0].candidates[0].signals, ['name', 'website', 'phone'])
  assert.deepEqual(
    result.items[0].candidates[0].differences.map((d) => d.field),
    ['website', 'phone']
  )
  assert.equal(result.can_import, false)
  assert.equal(result.summary.writes, 0)
  assert.doesNotMatch(JSON.stringify(result), /PRIVATE|password_hash|email|owner_name/)
})

test('name-only and cross-area candidates require review, never merge automatically', () => {
  const nameOnly = local({ phone: '', website: '' })
  assert.equal(
    buildAssociationPreview(snapshot([source()]), [nameOnly]).items[0].category,
    'review'
  )
  assert.equal(
    buildAssociationPreview(snapshot([source()]), [local({ location: '三星鄉' })]).items[0]
      .category,
    'review'
  )
})

test('all local rows participate and protected local records cannot be re-published by a new external ID', () => {
  for (const state of [{ status: 'pending' }, { status: 'rejected' }, { available: false }]) {
    const result = buildAssociationPreview(snapshot([source()]), [local(state)])
    assert.equal(result.items[0].category, 'blocked')
    assert.equal(result.summary.local_count, 1)
  }
})

test('source duplicates and multiple local candidates are surfaced for manual review', () => {
  const result = buildAssociationPreview(snapshot([source(), source({ id: 'external_02' })]), [
    local()
  ])
  assert.equal(result.summary.review, 2)
  assert.equal(result.items[0].source_duplicates.length, 1)
  assert.equal(
    buildAssociationPreview(snapshot([source()]), [local(), local({ id: '002' })]).items[0]
      .category,
    'review'
  )
})

test('different identifiers that point to the same local record still prevent a one-to-one proposal', () => {
  const records = [
    source(),
    source({
      id: 'other',
      name: '不同名稱',
      website: 'https://other.example.com',
      phone: '039500002'
    })
  ]
  const result = buildAssociationPreview(snapshot(records), [local({ phone: '039500002' })])
  assert.equal(result.summary.match, 0)
  assert.equal(result.items[0].source_duplicates.length, 0)
  assert.match(result.items[0].reasons.join(), /一對一/)
})

test('unmatched locals are informational, empty snapshots never become removal proposals', () => {
  const result = buildAssociationPreview(snapshot([]), [local()])
  assert.equal(result.local_without_candidates.length, 1)
  assert.equal(result.items.length, 0)
  assert.equal(result.summary.writes, 0)
  assert.doesNotMatch(JSON.stringify(result), /"delete"|"deactivate"/)
})

test('new records stay proposals and blank fields explicitly require confirmation before clearing', () => {
  assert.equal(buildAssociationPreview(snapshot([source()]), []).items[0].category, 'new')
  const result = buildAssociationPreview(snapshot([source({ line_url: '' })]), [local()])
  const diff = result.items[0].candidates[0].differences.find((d) => d.field === 'line_url')
  assert.equal(diff.requires_confirmation, true)
})

test('403, redirects, 304, 429 and HTML never leak provider response text or retry authentication', async () => {
  for (const status of [403, 302, 304, 429]) {
    let calls = 0
    await assert.rejects(
      fetchAssociationSnapshot(
        options(async () => {
          calls++
          return new Response(status === 304 ? null : 'PRIVATE SECRET', {
            status,
            headers: { location: 'https://evil.example' }
          })
        })
      ),
      (error) => !error.message.includes('PRIVATE SECRET')
    )
    assert.equal(calls, 1)
  }
  await assert.rejects(
    fetchAssociationSnapshot(options(async () => new Response('<html>secret</html>'))),
    { code: 'INVALID_CONTENT_TYPE' }
  )
})

test('retries one transient failure but rejects an alternate API host before any fetch', async () => {
  let calls = 0
  await fetchAssociationSnapshot(
    options(async () =>
      ++calls === 1 ? new Response('', { status: 503 }) : jsonResponse(payload())
    )
  )
  assert.equal(calls, 2)
  calls = 0
  await assert.rejects(
    fetchAssociationSnapshot({
      ...options(async () => {
        calls++
      }),
      env: { YTHMA_BNB_API_KEY: 'test', YTHMA_BNB_API_URL: 'https://evil.example' }
    }),
    { code: 'UNTRUSTED_SOURCE_URL' }
  )
  assert.equal(calls, 0)
  await assert.rejects(fetchAssociationSnapshot({ env: {} }), { code: 'SOURCE_NOT_CONFIGURED' })
})

test('bounded body and deadline cover chunked responses and bodies that never finish', async () => {
  await assert.rejects(
    fetchAssociationSnapshot({ ...options(async () => jsonResponse(payload())), maxBytes: 20 }),
    { code: 'RESPONSE_TOO_LARGE' }
  )
  const stream = new ReadableStream({
    start(controller) {
      controller.enqueue(new TextEncoder().encode('{'))
    }
  })
  await assert.rejects(
    fetchAssociationSnapshot({
      ...options(
        async () => new Response(stream, { headers: { 'content-type': 'application/json' } })
      ),
      timeoutMs: 20
    }),
    { code: 'SOURCE_UNAVAILABLE' }
  )
})

test('repository reads within an explicit read-only transaction and always rolls back/releases', async () => {
  const statements = []
  let released = false
  const pool = {
    connect: async () => ({
      query: async (sql) => {
        statements.push(sql)
        return { rows: sql.startsWith('SELECT') ? [local()] : [] }
      },
      release() {
        released = true
      }
    })
  }
  const result = await previewAssociationMembers(
    pool,
    options(async () => jsonResponse(payload()))
  )
  assert.equal(result.summary.local_count, 1)
  assert.equal(statements[0], 'BEGIN ISOLATION LEVEL REPEATABLE READ READ ONLY')
  assert.equal(statements.at(-1), 'ROLLBACK')
  assert.ok(statements.every((sql) => !/INSERT|UPDATE|DELETE|CREATE|ALTER/.test(sql)))
  assert.ok(!statements.find((sql) => sql.startsWith('SELECT')).includes('WHERE'))
  assert.equal(released, true)
})

test('database failures release the connection and return a sanitized error', async () => {
  let released = false
  const statements = []
  const pool = {
    connect: async () => ({
      query: async (sql) => {
        statements.push(sql)
        if (sql.startsWith('SELECT')) throw new Error('postgres://private-password')
        return { rows: [] }
      },
      release() {
        released = true
      }
    })
  }
  await assert.rejects(
    previewAssociationMembers(
      pool,
      options(async () => jsonResponse(payload()))
    ),
    { code: 'LOCAL_READ_FAILED' }
  )
  assert.equal(released, true)
  assert.equal(statements.at(-1), 'ROLLBACK')
})
