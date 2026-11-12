import assert from 'node:assert/strict'
import { readFile, mkdir, writeFile } from 'node:fs/promises'
import { pool } from '../server/utils/db.js'
import { importAssociationMembers } from '../server/services/association-import.js'
import {
  readAssociationReviews,
  confirmAssociationLink
} from '../server/services/association-links.js'
const schema = `association_import_test_${Date.now()}`
assert.match(schema, /^association_import_test_\d+$/)
const admin = await pool.connect()
let created = false
const isolated = {
  connect: async () => {
    const client = await pool.connect()
    await client.query(`SET search_path TO "${schema}"`)
    return client
  }
}
const query = async (sql, args = []) => {
  const client = await isolated.connect()
  try {
    return await client.query(sql, args)
  } finally {
    client.release()
  }
}
const now = Date.now()
const source = (id, patch = {}) => ({
  id,
  name: `測試 ${id}`,
  area: '冬山鄉',
  website: `https://${id}.example.com`,
  phone: '',
  line_url: '',
  photos: [],
  updated_at: new Date(now - 60000).toISOString(),
  ...patch
})
let rows = [source('newone'), source('matched'), source('ambiguous'), source('protected')]
const options = {
  now,
  env: { YTHMA_BNB_API_KEY: 'synthetic-only', ASSOCIATION_SYNC_ENABLED: 'true' },
  fetcher: async () =>
    new Response(
      JSON.stringify({
        ok: true,
        count: rows.length,
        generated_at: new Date(now).toISOString(),
        data: rows
      }),
      { headers: { 'content-type': 'application/json' } }
    )
}
const run = () => importAssociationMembers(isolated, 'test-admin', options)
const checks = []
const publicFingerprint = async () =>
  (
    await admin.query(
      "SELECT count(*)::int AS count,md5(string_agg((to_jsonb(h)-'view_count')::text,'|' ORDER BY id)) AS digest FROM public.homestays h"
    )
  ).rows[0]
try {
  const before = await publicFingerprint()
  await admin.query(`CREATE SCHEMA "${schema}"`)
  created = true
  await query(
    'CREATE TABLE homestays (LIKE public.homestays INCLUDING DEFAULTS INCLUDING CONSTRAINTS); ALTER TABLE homestays ADD PRIMARY KEY(id)'
  )
  for (const [id, name, website, status] of [
    ['001', '測試 matched', 'https://matched.example.com', 'approved'],
    ['002', '測試 ambiguous', 'https://other.example.com', 'approved'],
    ['003', '測試 protected', 'https://protected.example.com', 'rejected']
  ]) {
    await query(
      "INSERT INTO homestays(id,name,location,website,email,password_hash,status,available,images) VALUES($1::text,$2,'冬山鄉',$3,$1||'@example.invalid','test-only',$4,true,'{}')",
      [id, name, website, status]
    )
  }
  for (const name of [
    '20261113_association_member_links.sql',
    '20261113_association_public_listings.sql'
  ])
    await query(await readFile(`migrations/${name}`, 'utf8'))
  await query(await readFile('migrations/20261113_association_public_listings.sql', 'utf8'))
  const localBefore = (
    await query(
      "SELECT md5(string_agg((to_jsonb(h)-'view_count')::text,'|' ORDER BY id)) AS hash FROM homestays h"
    )
  ).rows[0]
  let result = await run()
  assert.equal(result.summary.inserted, 1)
  assert.equal(result.summary.held, 3)
  const listing = (await query("SELECT * FROM public_homestays WHERE id='ythma_newone'")).rows[0]
  assert.equal(listing.rating, null)
  assert.equal(listing.min_price, null)
  assert.equal(listing.latitude, null)
  assert.equal(listing.total_reviews, 0)
  assert.ok(!('email' in listing))
  assert.ok(!('password_hash' in listing))
  assert.equal(
    (await query('SELECT count(*)::int AS count FROM public_homestays')).rows[0].count,
    3
  )
  assert.equal(
    (await query('SELECT count(*)::int AS count FROM association_member_links')).rows[0].count,
    0
  )
  checks.push(
    'only unambiguous new sources imported; candidates and protected accounts held; no invented ratings prices coordinates or login fields'
  )
  const parallel = await Promise.all([run(), run()])
  assert.ok(parallel.every((r) => r.summary.inserted === 0 && r.summary.unchanged === 1))
  assert.equal(
    (await query('SELECT count(*)::int AS count FROM association_public_listings')).rows[0].count,
    1
  )
  checks.push('repeated and concurrent imports are idempotent')
  let reviews = await readAssociationReviews(isolated)
  await confirmAssociationLink(
    isolated,
    {
      external_id: 'matched',
      homestay_id: '001',
      revision: reviews.items.find((r) => r.external_id === 'matched').revision
    },
    'test-admin',
    options
  )
  result = await run()
  assert.equal(result.summary.inserted, 1)
  rows.find((r) => r.id === 'matched').name = '已改名民宿'
  rows.find((r) => r.id === 'matched').phone = '039500001'
  result = await run()
  assert.equal(result.summary.updated, 1)
  assert.equal(
    (await query("SELECT name FROM public_homestays WHERE id='001'")).rows[0].name,
    '已改名民宿'
  )
  assert.equal(
    (await query("SELECT count(*)::int AS count FROM public_homestays WHERE id='ythma_matched'"))
      .rows[0].count,
    0
  )
  assert.deepEqual(
    (
      await query(
        "SELECT md5(string_agg((to_jsonb(h)-'view_count')::text,'|' ORDER BY id)) AS hash FROM homestays h"
      )
    ).rows[0],
    localBefore
  )
  checks.push(
    'confirmed mappings keep old IDs and overlay source fields without changing any account row'
  )
  const removed = rows.shift()
  await run()
  assert.equal(
    (await query("SELECT count(*)::int AS count FROM public_homestays WHERE id='ythma_newone'"))
      .rows[0].count,
    1
  )
  rows.push({ ...removed, id: 'changed_id' })
  result = await run()
  assert.equal(result.summary.inserted, 0)
  assert.equal(
    (await query("SELECT count(*)::int AS count FROM public_homestays WHERE id='ythma_changed_id'"))
      .rows[0].count,
    0
  )
  checks.push('missing source retains prior page; reused business under a new source ID is held')
  rows = rows.filter((r) => r.id !== 'changed_id')
  rows.push(removed)
  await query("UPDATE association_public_listings SET hidden=true WHERE external_id='newone'")
  await run()
  assert.equal(
    (await query("SELECT count(*)::int AS count FROM public_homestays WHERE id='ythma_newone'"))
      .rows[0].count,
    0
  )
  const runCount = (await query('SELECT count(*)::int AS count FROM association_import_runs'))
    .rows[0].count
  rows[0].updated_at = new Date(now - 120000).toISOString()
  await assert.rejects(run(), { code: 'SOURCE_VERSION_REGRESSION' })
  assert.equal(
    (await query('SELECT count(*)::int AS count FROM association_import_runs')).rows[0].count,
    runCount
  )
  checks.push(
    'manual hidden status survives sync; older versions roll back without a successful run record'
  )
  const after = await publicFingerprint()
  assert.deepEqual(after, before)
  await mkdir('docs/evidence/association-import-20261113', { recursive: true })
  await writeFile(
    'docs/evidence/association-import-20261113/database-tests.json',
    JSON.stringify(
      {
        checked_at: new Date().toISOString(),
        checks,
        isolated_schema: true,
        public_before: before,
        public_after: after,
        accounts_unchanged: true
      },
      null,
      2
    ) + '\n'
  )
  console.log(JSON.stringify({ success: true, checks }))
} finally {
  if (created) await admin.query(`DROP SCHEMA "${schema}" CASCADE`)
  admin.release()
  await pool.end()
}
