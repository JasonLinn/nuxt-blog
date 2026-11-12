import { pool } from '../server/utils/db.js'
import { previewAssociationMembers } from '../server/services/association-preview.js'
import { AssociationError } from '../server/services/association-source.js'

try {
  if (process.argv.length > 2)
    throw new AssociationError('INVALID_ARGUMENT', '此指令只支援唯讀預覽，不接受匯入參數。')
  const result = await previewAssociationMembers(pool)
  // CLI output is intentionally aggregate-only, suitable for verification records.
  console.log(
    JSON.stringify(
      {
        mode: result.mode,
        can_import: result.can_import,
        generated_at: result.generated_at,
        previewed_at: result.previewed_at,
        fingerprint: result.fingerprint,
        summary: result.summary,
        local_without_candidates: result.local_without_candidates.length,
        warnings: result.warnings
      },
      null,
      2
    )
  )
} catch (error) {
  console.error(
    JSON.stringify({
      code: error instanceof AssociationError ? error.code : 'PREVIEW_FAILED',
      message: error instanceof AssociationError ? error.message : '預覽失敗。'
    })
  )
  process.exitCode = 1
} finally {
  await pool.end()
}
