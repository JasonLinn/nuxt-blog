import test from 'node:test'
import assert from 'node:assert/strict'
import {
  reviewHash,
  validateLinkRequest,
  withAssociationTransaction
} from '../server/services/association-links.js'
import { buildAssociationPreview } from '../server/services/association-preview.js'
import { normalizeAssociationSnapshot } from '../server/services/association-source.js'

test('review hash survives jsonb object ordering and source reordering, but detects meaningful changes', () => {
  assert.equal(
    reviewHash({ source_index: 1, foo: { a: 1, b: 2 } }),
    reviewHash({ foo: { b: 2, a: 1 }, source_index: 8 })
  )
  assert.notEqual(reviewHash({ foo: [1, 2] }), reviewHash({ foo: [2, 1] }))
})
test('link input preserves leading zeros and rejects untrusted fields or IDs', () => {
  const valid = { external_id: 'external', homestay_id: '001', revision: 1, note: ' 已核對網站 ' }
  assert.equal(validateLinkRequest(valid).homestay_id, '001')
  assert.equal(validateLinkRequest(valid).note, '已核對網站')
  for (const patch of [
    { revision: 0 },
    { homestay_id: 1 },
    { external_id: '../x' },
    { approved: true },
    { note: 'x'.repeat(501) }
  ]) {
    assert.throws(() => validateLinkRequest({ ...valid, ...patch }), {
      code: 'INVALID_LINK_REQUEST'
    })
  }
})

test('reordering a source snapshot does not invalidate a saved review with multiple source duplicates', () => {
  const data = ['z', 'a', 'm'].map((id) => ({
    id,
    name: '同名民宿',
    area: '冬山鄉',
    website: 'https://same.example.com',
    phone: '',
    line_url: '',
    photos: [],
    updated_at: '2026-11-13T00:00:00Z'
  }))
  const snapshot = (rows) =>
    normalizeAssociationSnapshot(
      { ok: true, count: rows.length, generated_at: '2026-11-13T00:00:00Z', data: rows },
      Date.parse('2026-11-13T00:00:00Z')
    )
  const original = buildAssociationPreview(snapshot(data), [])
  const reordered = buildAssociationPreview(snapshot([...data].reverse()), [])
  for (const item of original.items)
    assert.equal(
      reviewHash(item),
      reviewHash(reordered.items.find((row) => row.external_id === item.external_id))
    )
})
test('fixed mappings win over changed names; protected targets remain blocked', () => {
  const snapshot = normalizeAssociationSnapshot({
    ok: true,
    count: 2,
    generated_at: new Date().toISOString(),
    data: [
      {
        id: 'linked',
        name: '改名後',
        phone: '',
        line_url: '',
        area: '冬山鄉',
        website: 'https://new.example.com',
        photos: [],
        updated_at: new Date().toISOString()
      },
      {
        id: 'other',
        name: '原名稱',
        phone: '',
        line_url: '',
        area: '冬山鄉',
        website: 'https://old.example.com',
        photos: [],
        updated_at: new Date().toISOString()
      }
    ]
  })
  const locals = [
    {
      id: '001',
      name: '原名稱',
      location: '冬山鄉',
      website: 'https://old.example.com',
      status: 'approved',
      available: true
    }
  ]
  const links = [{ external_id: 'linked', homestay_id: '001' }]
  const result = buildAssociationPreview(snapshot, locals, new Date(), links)
  assert.equal(result.items[0].category, 'linked')
  assert.equal(result.items[0].candidates[0].id, '001')
  assert.equal(result.items[1].category, 'review')
  assert.equal(result.items[1].candidates[0].claimed_by, 'linked')
  assert.equal(
    buildAssociationPreview(snapshot, [{ ...locals[0], available: false }], new Date(), links)
      .items[0].category,
    'blocked'
  )
})
test('failed metadata transactions roll back and sanitize DB details', async () => {
  const calls = []
  const pool = {
    connect: async () => ({
      query: async (sql) => {
        calls.push(sql)
      },
      release: () => calls.push('released')
    })
  }
  await assert.rejects(
    withAssociationTransaction(pool, async () => {
      throw new Error('private database detail')
    }),
    { code: 'MAPPING_FAILED' }
  )
  assert.deepEqual(calls.slice(-2), ['ROLLBACK', 'released'])
  assert.ok(!calls.includes('COMMIT'))
})
