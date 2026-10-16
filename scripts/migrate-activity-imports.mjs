import { readFile } from 'node:fs/promises'
import { pool } from '../server/utils/db.js'

const client = await pool.connect()
try {
  await client.query('BEGIN')
  await client.query("SET LOCAL lock_timeout = '5s'")
  await client.query(await readFile('migrations/20261016_activity_imports.sql', 'utf8'))
  const apply = process.argv.includes('--apply')
  await client.query(apply ? 'COMMIT' : 'ROLLBACK')
  console.log(apply ? '活動匯入資料表已建立；原活動資料保留。' : 'Migration 驗證成功並已回復。正式套用請加 --apply。')
} catch (error) {
  await client.query('ROLLBACK')
  console.error(`Migration 失敗：${error.code || 'DATABASE_ERROR'}`)
  process.exitCode = 1
} finally {
  client.release()
  await pool.end()
}
