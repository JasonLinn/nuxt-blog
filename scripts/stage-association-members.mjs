import assert from 'node:assert/strict'
import { pool } from '../server/utils/db.js'
import {
  stageAssociationMembers,
  readAssociationReviews
} from '../server/services/association-links.js'

// Explicit metadata staging only; never inserts or updates a public homestay.
try {
  if (process.argv.length > 2) throw new Error('INVALID_ARGUMENT')
  const fingerprint = async () =>
    (
      await pool.query(
        "SELECT count(*)::int AS count, md5(string_agg(row_to_json(h)::text, '|' ORDER BY id)) AS digest FROM homestays h"
      )
    ).rows[0]
  const before = await fingerprint()
  const staged = await stageAssociationMembers(pool)
  const reviews = await readAssociationReviews(pool)
  const after = await fingerprint()
  assert.deepEqual(
    after,
    before,
    'Public member data changed during staging; investigate before continuing'
  )
  console.log(
    JSON.stringify(
      {
        checked_at: new Date().toISOString(),
        staged,
        review_summary: reviews.summary,
        stale_reviews: reviews.items.filter((item) => item.needs_refresh).length,
        public_before: before,
        public_after: after,
        homestays_unchanged: true
      },
      null,
      2
    )
  )
} catch (error) {
  console.error(JSON.stringify({ success: false, code: error.code || 'STAGING_FAILED' }))
  process.exitCode = 1
} finally {
  await pool.end()
}
