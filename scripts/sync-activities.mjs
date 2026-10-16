import { writeFile, mkdir } from 'node:fs/promises'
import { collectActivities } from '../server/services/activity-sources.js'
import { collectionSummary, syncActivities } from '../server/services/activity-import.js'

const apply = process.argv.includes('--apply')
if (apply) {
  const { pool } = await import('../server/utils/db.js')
  try { console.log(JSON.stringify(await syncActivities(pool), null, 2)) }
  finally { await pool.end() }
} else {
  const sources = await collectActivities()
  await mkdir('.cache/activity-import', { recursive: true })
  await writeFile('.cache/activity-import/preview.json', JSON.stringify({ fetchedAt: new Date().toISOString(), sources }, null, 2))
  console.log(JSON.stringify({ dryRun: true, summary: collectionSummary(sources), preview: '.cache/activity-import/preview.json' }, null, 2))
  if (sources.some(s => !s.ok)) process.exitCode = 1
}
