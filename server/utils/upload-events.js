import { randomUUID } from 'node:crypto'
import { getHeader } from 'h3'
import { query } from './db.js'

const sharedUploadSources = new Set(['article', 'shop', 'place', 'homestay', 'homestayEdit'])

export function sharedUploadSource(event) {
  const source = getHeader(event, 'x-upload-source')
  return sharedUploadSources.has(source) ? source : 'upload'
}

// Called only after the operation succeeds. A log outage must not prompt a duplicate submission.
export async function recordSuccess(source, stage, { mime = null, bytes = null, submissionId = null } = {}, db = { query }) {
  const id = randomUUID()
  const sql = `INSERT INTO upload_failures
    (id, occurred_at, source, stage, outcome, reporter, file_type, file_bytes, submission_id)
    VALUES ($1, now(), $2, $3, 'success', 'server', $4, $5, $6)`
  try {
    await db.query(sql, [id, source, stage, mime, bytes, submissionId])
  } catch {
    console.error('Could not record successful operation', id, source, stage)
  }
}
