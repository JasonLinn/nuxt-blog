// Uses an isolated transactional schema; rolls back all test data and DDL.
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { pool } from '../server/utils/db.js'
import { applyCollection, reviewImport, acquireImportLock } from '../server/services/activity-import.js'
import { reviewReasons } from '../server/services/activity-sources.js'

const client = await pool.connect()
const schema = `activity_test_${Date.now()}`
const item = (external_id, overrides = {}) => {
  const row = { external_id, title: `活動 ${external_id}`, description: '完整說明', event_date: '2099-10-16', end_date: '2099-10-18', location: '宜蘭縣冬山鄉親水公園', organizer_name: '測試主辦', activity_type: '觀光旅遊', source_url: 'https://example.com/event', images: [], ...overrides }
  return { ...row, expired: false, reasons: reviewReasons(row, true) }
}
const collection = (items, source = 'test-official') => [{ source, name: '測試官方來源', ok: true, items }]
try {
  await client.query('BEGIN')
  await client.query(`CREATE SCHEMA ${schema}`)
  await client.query(`SET LOCAL search_path TO ${schema}, public`)
  // Explicit identity keeps the live activity table's sequence untouched.
  await client.query(`CREATE TABLE yilan_activities (
    id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY, title varchar(255) NOT NULL, description text,
    event_date date NOT NULL, end_date date, location varchar(255), organizer_name varchar(255) NOT NULL,
    activity_type varchar(50), images text[], is_multi_day boolean, submitter_name varchar(255) NOT NULL,
    submitter_email varchar(255) NOT NULL, status varchar(20), approved_by text,
    created_at timestamp, updated_at timestamp, approved_at timestamp
  )`)
  await client.query(await readFile('migrations/20261016_activity_imports.sql', 'utf8'))
  await client.query(await readFile('migrations/20261016_activity_images.sql', 'utf8'))
  await acquireImportLock(client)
  let summary = await applyCollection(client, collection([item('a'), item('b', { organizer_name: '' })]))
  assert.equal(summary[0].published, 1)
  assert.equal(summary[0].pending, 1)
  summary = await applyCollection(client, collection([item('a'), item('b', { organizer_name: '' })]))
  assert.equal(summary[0].unchanged, 2)
  assert.equal(Number((await client.query('SELECT COUNT(*) FROM yilan_activities')).rows[0].count), 1)
  summary = await applyCollection(client, collection([item('a', { description: '新說明' })]))
  assert.equal(summary[0].updated, 1)
  summary = await applyCollection(client, collection([item('a', { cancelled: true })]))
  assert.equal(summary[0].pending, 1)
  assert.equal((await client.query('SELECT status FROM yilan_activities')).rows[0].status, 'pending')
  await applyCollection(client, collection([item('a')]))
  await client.query("UPDATE yilan_activities SET title = '人工修訂', import_managed = false")
  summary = await applyCollection(client, collection([item('a', { title: '來源改名' })]))
  assert.equal(summary[0].preserved, 1)
  assert.equal((await client.query('SELECT title FROM yilan_activities')).rows[0].title, '人工修訂')
  await reviewImport(client, { source: 'test-official', externalId: 'b', action: 'publish', data: { organizer_name: '補齊主辦' } })
  await assert.rejects(reviewImport(client, { source: 'test-official', externalId: 'b', action: 'publish' }), /已處理/)
  summary = await applyCollection(client, collection([item('cross', { title: '活動 b' })], 'second-source'))
  assert.equal(summary[0].duplicate, 1)
  await client.query("DELETE FROM yilan_activities WHERE title = '活動 b'")
  summary = await applyCollection(client, collection([item('b', { organizer_name: '主辦' })]))
  assert.equal(summary[0].preserved, 1)
  assert.equal((await client.query("SELECT state FROM activity_import_items WHERE external_id = 'b'")).rows[0].state, 'deleted')
  await applyCollection(client, collection([item('reject', { organizer_name: '' })]))
  await reviewImport(client, { source: 'test-official', externalId: 'reject', action: 'dismiss' })
  summary = await applyCollection(client, collection([item('reject')]))
  assert.equal(summary[0].preserved, 1)
  summary = await applyCollection(client, [
    ...collection([item('bad', { title: 'x'.repeat(300) })], 'broken-source'),
    ...collection([item('good')], 'healthy-source')
  ])
  assert.equal(summary[0].ok, false)
  assert.equal(summary[1].published, 1)
  assert.equal((await client.query("SELECT COUNT(*) FROM activity_import_items WHERE source_id = 'broken-source'")).rows[0].count, '0')
  // Changing only the publishing policy must re-evaluate an unchanged pending item.
  const blankOrganizer = item('optional-organizer', { organizer_name: '' })
  await applyCollection(client, collection([blankOrganizer], 'yilan-site'))
  summary = await applyCollection(client, collection([{ ...blankOrganizer, reasons: [] }], 'yilan-site'))
  assert.equal(summary[0].published, 1)
  assert.equal((await client.query("SELECT organizer_name FROM yilan_activities WHERE title = '活動 optional-organizer'")).rows[0].organizer_name, '')
  const photo = 'https://travel.yilan.gov.tw/_api/content/images/articles/1/event.jpg'
  const withImage = item('photo', { images: [photo], image_source_name: '宜蘭勁好玩', image_source_url: 'https://travel.yilan.gov.tw/zh-tw/event/1/' })
  await applyCollection(client, collection([withImage]))
  assert.deepEqual((await client.query("SELECT images FROM yilan_activities WHERE title = '活動 photo'")).rows[0].images, [photo])
  await applyCollection(client, collection([item('photo')]))
  const kept = (await client.query("SELECT images, image_source_name FROM yilan_activities WHERE title = '活動 photo'")).rows[0]
  assert.deepEqual(kept.images, [photo])
  assert.equal(kept.image_source_name, '宜蘭勁好玩')
  summary = await applyCollection(client, collection([item('photo-mirror', { duplicate_of: {source:'test-official',external_id:'photo'} })], 'yilan-site'))
  assert.equal(summary[0].duplicate, 1)
  assert.equal(summary[0].published, 0)
  // Verify current live feed records traverse real SQL, but never retain them.
  const live = JSON.parse(await readFile('.cache/activity-import/preview.json', 'utf8'))
  const realSummary = await applyCollection(client, live.sources)
  assert.ok(realSummary.every(s => s.ok))
  console.log(JSON.stringify({ success: true, scenarios: ['insert', 'idempotency', 'update', 'cancel', 'editor-preservation', 'manual-review', 'cross-source-duplicate', 'deleted-tombstone', 'dismissed-tombstone', 'source-rollback', 'live-feed-sql'], live: realSummary, rollback: true }, null, 2))
} finally {
  await client.query('ROLLBACK')
  client.release()
  await pool.end()
}
