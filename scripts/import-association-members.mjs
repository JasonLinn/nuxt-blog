import assert from 'node:assert/strict'
import { pool } from '../server/utils/db.js'
import { importAssociationMembers } from '../server/services/association-import.js'
try {
  if (process.argv.slice(2).join(' ') !== '--apply') throw new Error('Explicit --apply required')
  const fingerprint = async () =>
    (
      await pool.query(
        "SELECT count(*)::int AS count,md5(string_agg(row_to_json(h)::text,'|' ORDER BY id)) AS digest FROM homestays h"
      )
    ).rows[0]
  const before = await fingerprint()
  const result = await importAssociationMembers(pool, 'authorized-release-cli')
  const after = await fingerprint()
  assert.deepEqual(after, before, 'Account data changed during import')
  const publicCount = (await pool.query('SELECT count(*)::int AS count FROM public_homestays'))
    .rows[0].count
  console.log(
    JSON.stringify(
      {
        checked_at: new Date().toISOString(),
        ...result,
        public_count: publicCount,
        accounts_before: before,
        accounts_after: after,
        accounts_unchanged: true
      },
      null,
      2
    )
  )
} catch (error) {
  console.error(
    JSON.stringify({ success: false, code: error.code || 'IMPORT_FAILED', message: error.message })
  )
  process.exitCode = 1
} finally {
  await pool.end()
}
