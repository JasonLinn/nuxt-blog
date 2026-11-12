import { readFile } from 'node:fs/promises'
import { pool } from '../server/utils/db.js'

const client = await pool.connect()
try {
  if (process.argv.slice(2).some((arg) => arg !== '--apply')) throw new Error('INVALID_ARGUMENT')
  await client.query('BEGIN')
  await client.query("SET LOCAL lock_timeout = '5s'")
  await client.query(await readFile('migrations/20261113_association_member_links.sql', 'utf8'))
  await client.query(process.argv.includes('--apply') ? 'COMMIT' : 'ROLLBACK')
  console.log(
    JSON.stringify({
      success: true,
      applied: process.argv.includes('--apply'),
      homestays_written: 0
    })
  )
} catch (error) {
  await client.query('ROLLBACK')
  console.error(JSON.stringify({ success: false, code: error.code || 'MIGRATION_FAILED' }))
  process.exitCode = 1
} finally {
  client.release()
  await pool.end()
}
