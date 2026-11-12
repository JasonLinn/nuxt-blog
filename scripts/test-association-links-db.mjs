import assert from 'node:assert/strict'
import { readFile, mkdir, writeFile } from 'node:fs/promises'
import { pool } from '../server/utils/db.js'
import {
  stageAssociationMembers as stage,
  readAssociationReviews as read,
  confirmAssociationLink as confirm
} from '../server/services/association-links.js'

// Every mutation, including synthetic homestays, is restricted to this disposable schema.
const schema = `association_test_${Date.now()}`
assert.match(schema, /^association_test_\d+$/)
const admin = await pool.connect()
const isolated = {
  connect: async () => {
    const client = await pool.connect()
    try {
      await client.query(`SET search_path TO "${schema}"`)
      assert.equal((await client.query('SELECT current_schema() AS schema')).rows[0].schema, schema)
      return { query: client.query.bind(client), release: () => client.release(true) }
    } catch (error) {
      client.release(true)
      throw error
    }
  }
}
const now = Date.now()
let rows = []
let generation = new Date(now).toISOString()
const source = (id, patch = {}) => ({
  id,
  name: `民宿 ${id}`,
  area: '冬山鄉',
  phone: '',
  line_url: '',
  website: `https://${id}.example.com`,
  photos: [],
  updated_at: new Date(now - 60000).toISOString(),
  ...patch
})
const options = {
  now,
  env: { YTHMA_BNB_API_KEY: 'synthetic-test-only' },
  fetcher: async () =>
    new Response(
      JSON.stringify({ ok: true, count: rows.length, generated_at: generation, data: rows }),
      { headers: { 'content-type': 'application/json' } }
    )
}
const query = async (sql, args = []) => {
  const client = await isolated.connect()
  try {
    return await client.query(sql, args)
  } finally {
    client.release()
  }
}
const counts = async () =>
  (
    await query(`SELECT (SELECT count(*)::int FROM association_member_reviews) AS reviews,
  (SELECT count(*)::int FROM association_member_links) AS links,
  (SELECT count(*)::int FROM association_member_link_events) AS events`)
  ).rows[0]
const fingerprint = async () =>
  (
    await admin.query(
      "SELECT count(*)::int AS count, md5(string_agg((to_jsonb(h)-'view_count')::text, '|' ORDER BY id)) AS digest FROM public.homestays h"
    )
  ).rows[0]
const checks = []
let created = false
try {
  const before = await fingerprint()
  await admin.query(`CREATE SCHEMA "${schema}"`)
  created = true
  await query(`CREATE TABLE homestays (id varchar(10) PRIMARY KEY, name text, location text,
    website text, phone text, social_line text, image_url text, images jsonb,
    status text, available boolean)`)
  const migration = await readFile('migrations/20261113_association_member_links.sql', 'utf8')
  await query(migration)
  await query(migration)
  await query(
    'CREATE TABLE association_public_listings(external_id text,state text,source_id text)'
  )
  checks.push('migration can be repeated')
  for (const [id, name, website, status] of [
    ['001', '民宿 alpha', 'https://alpha.example.com', 'approved'],
    ['002', '民宿 ambiguous', 'https://different.example.com', 'approved'],
    ['003', '競爭民宿', 'https://race.example.com', 'approved'],
    ['004', '民宿 protected', 'https://protected.example.com', 'rejected'],
    ['005', '民宿 stale', 'https://stale.example.com', 'approved']
  ])
    await query(
      `INSERT INTO homestays (id,name,location,website,phone,images,status,available)
    VALUES ($1,$2,'冬山鄉',$3,'','[]',$4,true)`,
      [id, name, website, status]
    )
  rows = [
    source('alpha'),
    source('ambiguous'),
    source('protected'),
    source('stale'),
    source('newone'),
    source('race_a', { name: '競爭民宿', website: 'https://race.example.com' }),
    source('race_b', { name: '競爭民宿', website: 'https://race.example.com' })
  ]
  await stage(isolated, options)
  assert.deepEqual(await counts(), { reviews: 7, links: 0, events: 0 })
  await stage(isolated, options)
  let saved = await read(isolated)
  assert.ok(saved.items.every((item) => item.revision === 1 && !item.needs_refresh))
  assert.equal(saved.items.find((item) => item.external_id === 'ambiguous').category, 'review')
  assert.equal(saved.items.find((item) => item.external_id === 'protected').category, 'blocked')
  checks.push('persistent review queue and repeated staging create no links')
  const link = (external_id, homestay_id, revision = 1, note = '') =>
    confirm(isolated, { external_id, homestay_id, revision, note }, 'test-admin', options)
  const repeated = await Promise.all([link('alpha', '001'), link('alpha', '001')])
  assert.equal(repeated.filter((result) => result.already_confirmed).length, 1)
  assert.deepEqual(await counts(), { reviews: 7, links: 1, events: 1 })
  await assert.rejects(link('alpha', '002'), { code: 'MAPPING_IMMUTABLE' })
  await assert.rejects(
    query(
      "INSERT INTO association_member_links (source_id,external_id,homestay_id,confirmed_by) VALUES ('ythma','newone','001','test')"
    ),
    { code: '23505' }
  )
  await assert.rejects(
    query(
      "INSERT INTO association_member_links (source_id,external_id,homestay_id,confirmed_by) VALUES ('ythma','alpha','002','test')"
    ),
    { code: '23505' }
  )
  checks.push(
    'concurrent identical confirmation is idempotent; both ID uniqueness constraints enforced'
  )
  await assert.rejects(link('ambiguous', '002'), { code: 'REVIEW_NOTE_REQUIRED' })
  await assert.rejects(link('ambiguous', '005', 1, '人工核對相符'), { code: 'UNREVIEWABLE_LINK' })
  await assert.rejects(link('protected', '004', 1, '人工核對相符'), { code: 'UNREVIEWABLE_LINK' })
  await link('ambiguous', '002', 1, '人工核對相符')
  const race = await Promise.allSettled([
    link('race_a', '003', 1, '人工核對相符'),
    link('race_b', '003', 1, '人工核對相符')
  ])
  assert.equal(race.filter((result) => result.status === 'fulfilled').length, 1)
  assert.equal(race.find((result) => result.status === 'rejected').reason.code, 'MAPPING_CONFLICT')
  assert.deepEqual(await counts(), { reviews: 7, links: 3, events: 3 })
  checks.push(
    'ambiguous records require evidence; protected and wrong candidates rejected; concurrent competing IDs cannot duplicate'
  )
  rows.find((row) => row.id === 'alpha').name = '全面改名'
  rows.find((row) => row.id === 'alpha').website = 'https://renamed.example.com'
  await stage(isolated, options)
  saved = await read(isolated)
  assert.equal(
    saved.items.find((item) => item.external_id === 'alpha').confirmed_homestay_id,
    '001'
  )
  assert.equal(saved.items.find((item) => item.external_id === 'alpha').category, 'linked')
  const removed = rows.shift()
  await stage(isolated, options)
  saved = await read(isolated)
  assert.equal(saved.items.find((item) => item.external_id === 'alpha').present_in_source, false)
  assert.equal((await counts()).links, 3)
  rows.push(removed)
  await stage(isolated, options)
  assert.equal(
    (await read(isolated)).items.find((item) => item.external_id === 'alpha').confirmed_homestay_id,
    '001'
  )
  checks.push('renaming, removal and reappearance preserve confirmed IDs without changing listings')
  const staleRevision = (await read(isolated)).items.find(
    (item) => item.external_id === 'stale'
  ).revision
  rows.find((row) => row.id === 'stale').phone = '039500005'
  await assert.rejects(link('stale', '005', staleRevision), { code: 'REVIEW_CHANGED' })
  await stage(isolated, options)
  await assert.rejects(link('stale', '005', staleRevision), { code: 'REVIEW_CHANGED' })
  await query("UPDATE homestays SET phone='039500099' WHERE id='005'")
  saved = await read(isolated)
  assert.equal(saved.items.find((item) => item.external_id === 'stale').needs_refresh, true)
  await assert.rejects(link('stale', '005', staleRevision + 1), { code: 'REVIEW_CHANGED' })
  const beforeFailure = await query(
    'SELECT external_id,content_hash,revision FROM association_member_reviews ORDER BY external_id'
  )
  rows.find((row) => row.id === 'stale').updated_at = new Date(now - 120000).toISOString()
  await assert.rejects(stage(isolated, options), { code: 'SOURCE_VERSION_REGRESSION' })
  assert.deepEqual(
    (
      await query(
        'SELECT external_id,content_hash,revision FROM association_member_reviews ORDER BY external_id'
      )
    ).rows,
    beforeFailure.rows
  )
  generation = new Date(now - 1000).toISOString()
  await assert.rejects(stage(isolated, options), { code: 'STALE_SNAPSHOT' })
  generation = new Date(now).toISOString()
  rows.push(rows[0])
  await assert.rejects(stage(isolated, options))
  assert.equal((await counts()).links, 3)
  checks.push(
    'stale source, changed local data, outdated UI and malformed snapshots reject atomically'
  )
  const after = await fingerprint()
  assert.deepEqual(after, before)
  checks.push('public account fields unchanged (excluding live view counters)')
  const evidence = {
    checked_at: new Date().toISOString(),
    isolated_schema: true,
    checks,
    public_before: before,
    public_after: after,
    homestays_unchanged: true
  }
  await mkdir('docs/evidence/association-links-20261113', { recursive: true })
  await writeFile(
    'docs/evidence/association-links-20261113/database-tests.json',
    JSON.stringify(evidence, null, 2) + '\n'
  )
  console.log(JSON.stringify({ success: true, checks }))
} finally {
  if (created) await admin.query(`DROP SCHEMA "${schema}" CASCADE`)
  admin.release()
  await pool.end()
}
