import test from 'node:test'
import assert from 'node:assert/strict'
import { buildImportPlan, importAssociationMembers } from '../server/services/association-import.js'
import { normalizeAssociationSnapshot } from '../server/services/association-source.js'
test('import fails closed without the explicit server-side switch', async () => {
  await assert.rejects(
    importAssociationMembers(
      {
        connect: () => {
          throw new Error('must not connect')
        }
      },
      'admin',
      { env: {} }
    ),
    { code: 'IMPORT_DISABLED' }
  )
})
test('matching and ambiguous candidates cannot be auto-confirmed by import', () => {
  const now = new Date().toISOString()
  const rows = ['new', 'match', 'review'].map((id) => ({
    id,
    name: id,
    area: '冬山鄉',
    website: `https://${id}.example.com`,
    phone: '',
    line_url: '',
    photos: [],
    updated_at: now
  }))
  const snapshot = normalizeAssociationSnapshot({
    ok: true,
    count: 3,
    generated_at: now,
    data: rows
  })
  const locals = [
    {
      id: '001',
      name: 'match',
      location: '冬山鄉',
      website: rows[1].website,
      status: 'approved',
      available: true
    },
    {
      id: '002',
      name: 'review',
      location: '冬山鄉',
      website: '',
      status: 'approved',
      available: true
    }
  ]
  assert.deepEqual(
    buildImportPlan(snapshot, locals, [], []).accepted.map((r) => r.external_id),
    ['new']
  )
  assert.equal(
    buildImportPlan(snapshot, locals, [], [{ external_id: 'old_id', name: 'new' }]).accepted.length,
    0
  )
  assert.equal(
    buildImportPlan(snapshot, [...locals, { id: 'ythma_new' }], [], []).accepted.length,
    0
  )
})
