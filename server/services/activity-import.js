import { collectActivities, digest, sameEvent, possiblySameEvent, reviewReasons, safeSourceUrl, safeActivityImage, plainText, activitySources } from './activity-sources.js'
import { dateOnly, taipeiToday } from '../../utils/activity-dates.js'

export function collectionSummary(sources) {
  return sources.map(({ items, ...source }) => ({ ...source, fetched: items.length, current: items.filter(i => !i.expired).length, eligible: items.filter(i => !i.expired && !i.reasons.length).length, pending: items.filter(i => !i.expired && i.reasons.length).length }))
}

export async function writeActivity(client, item, sourceName, activityId = null, managed = true) {
  const fields = ['title', 'description', 'event_date', 'end_date', 'location', 'organizer_name', 'activity_type']
  const values = fields.map(key => key === 'organizer_name' ? (item[key] || '') : (item[key] || null))
  const images = (item.images || []).map(safeActivityImage).filter(Boolean)
  // A temporary missing image feed must not erase an existing published gallery.
  if (images.length || !activityId) {
    fields.push('images', 'image_source_name', 'image_source_url')
    values.push(images, images.length ? item.image_source_name || sourceName : null, images.length ? safeSourceUrl(item.image_source_url || item.source_url) : null)
  }
  fields.push('is_multi_day', 'source_name', 'source_url', 'import_managed', 'status')
  values.push(item.event_date !== item.end_date, sourceName, item.source_url, managed, 'approved')
  if (activityId) {
    return (await client.query(`UPDATE yilan_activities SET ${fields.map((key, i) => `${key} = $${i + 1}`).join(', ')}, updated_at = now(), last_synced_at = now() WHERE id = $${values.length + 1} RETURNING *`, [...values, activityId])).rows[0]
  }
  fields.push('submitter_name', 'submitter_email', 'approved_by')
  values.push(sourceName, 'automated-import@invalid.example', managed ? 'official-import' : 'admin-import')
  return (await client.query(`INSERT INTO yilan_activities (${fields.join(', ')}, created_at, updated_at, approved_at, last_synced_at) VALUES (${values.map((_, i) => `$${i + 1}`).join(', ')}, now(), now(), now(), now()) RETURNING *`, values)).rows[0]
}

// The caller owns the transaction. One database lock serializes cron, manual sync and inbox approval.
export async function applyCollection(client, sources) {
  const existing = (await client.query('SELECT * FROM yilan_activities')).rows
  const summaries = []
  for (const source of sources) {
    const counts = { source: source.source, name: source.name, ok: source.ok, fetched: source.items.length, published: 0, updated: 0, pending: 0, duplicate: 0, preserved: 0, expired: 0, unchanged: 0 }
    if (source.warnings?.length) counts.warnings = source.warnings
    if (!source.ok) { summaries.push({ ...counts, error: source.error }); continue }
    await client.query('SAVEPOINT import_source')
    const before = existing.map(row => ({ ...row }))
    try {
      for (const rawItem of source.items) {
        const item = { ...rawItem, reasons: [...rawItem.reasons] }
        const key = [source.source, item.external_id]
        const previous = (await client.query('SELECT * FROM activity_import_items WHERE source_id = $1 AND external_id = $2 FOR UPDATE', key)).rows[0]
        if (item.expired && !previous) { counts.expired++; continue }
        const { expired, reasons, ...content } = item
        const hash = digest(content)
        let activity = previous?.activity_id ? existing.find(a => a.id === previous.activity_id) : null
        if (previous?.activity_id) {
          // Re-read under a row lock: an editor may have changed it since this run started.
          const current = (await client.query('SELECT * FROM yilan_activities WHERE id = $1 FOR UPDATE', [previous.activity_id])).rows[0]
          if (activity && current) Object.assign(activity, current)
          else activity = current || null
        }
        let state = previous?.state || 'pending'
        if (['dismissed', 'deleted'].includes(state) || (state === 'published' && !activity)) {
          state = state === 'published' ? 'deleted' : state
          counts.preserved++
        } else if (state === 'duplicate') {
          counts.duplicate++
        } else if (activity && (!activity.import_managed || activity.status === 'rejected')) {
          counts.preserved++
        } else if (previous?.content_hash === hash && JSON.stringify(previous.reasons) === JSON.stringify(item.reasons) && (activity || state === 'pending')) {
          item.reasons = previous.reasons
          counts.unchanged++
        } else if (activity && (item.cancelled || item.reasons.length)) {
          // Withdraw automatically managed information whose dates/venue are no longer trustworthy.
          await client.query("UPDATE yilan_activities SET status = 'pending', updated_at = now(), last_synced_at = now() WHERE id = $1", [activity.id])
          activity.status = 'pending'
          state = 'pending'; counts.pending++
        } else if (item.expired) {
          // Refresh known dates even if an event was shortened to end in the past.
          if (activity && !item.reasons.length) {
            const updated = await writeActivity(client, item, source.name, activity.id)
            Object.assign(activity, updated)
          }
          counts.expired++
        } else {
          const canonical = item.duplicate_of && (await client.query('SELECT activity_id FROM activity_import_items WHERE source_id = $1 AND external_id = $2', [item.duplicate_of.source, item.duplicate_of.external_id])).rows[0]
          const duplicate = !activity && (existing.find(a => a.id === canonical?.activity_id) || existing.find(a => sameEvent(a, item)))
          if (duplicate) {
            activity = duplicate; state = 'duplicate'; counts.duplicate++
          } else if (!activity && existing.some(a => possiblySameEvent(a, item))) {
            const match = existing.find(a => possiblySameEvent(a, item))
            item.reasons.push(`可能與既有活動重複（ID ${match.id}），請比對`)
            state = 'pending'; counts.pending++
          } else if (!item.reasons.length) {
            const updated = await writeActivity(client, item, source.name, activity?.id)
            if (activity) { Object.assign(activity, updated); counts.updated++ }
            else { existing.push(updated); counts.published++ }
            activity = updated; state = 'published'
          } else { state = 'pending'; counts.pending++ }
        }
        await client.query(`INSERT INTO activity_import_items (source_id, external_id, source_name, candidate, content_hash, reasons, state, activity_id)
          VALUES ($1,$2,$3,$4::jsonb,$5,$6::jsonb,$7,$8)
          ON CONFLICT (source_id, external_id) DO UPDATE SET candidate = EXCLUDED.candidate, content_hash = EXCLUDED.content_hash,
            reasons = EXCLUDED.reasons, state = EXCLUDED.state, activity_id = EXCLUDED.activity_id,
            last_seen_at = now(), updated_at = CASE WHEN activity_import_items.content_hash <> EXCLUDED.content_hash THEN now() ELSE activity_import_items.updated_at END`,
        [...key, source.name, JSON.stringify(content), hash, JSON.stringify(item.reasons), state, activity?.id || null])
      }
      await client.query('RELEASE SAVEPOINT import_source')
      summaries.push(counts)
    } catch (error) {
      await client.query('ROLLBACK TO SAVEPOINT import_source')
      existing.splice(0, existing.length, ...before)
      summaries.push({ source: source.source, name: source.name, ok: false, error: `資料寫入失敗（${error.code || 'IMPORT_ERROR'}），本來源已回復` })
    }
  }
  return summaries
}

export async function acquireImportLock(client) {
  const result = await client.query('SELECT pg_try_advisory_xact_lock(160026, 1016) AS locked')
  if (!result.rows[0].locked) throw Object.assign(new Error('活動更新執行中，請稍後再試'), { statusCode: 409 })
}

export async function syncActivities(pool, { dryRun = false } = {}) {
  if (dryRun) {
    const sources = await collectActivities()
    return { dryRun: true, ok: sources.every(s => s.ok), summary: collectionSummary(sources), sources }
  }
  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    await acquireImportLock(client)
    const run = (await client.query("INSERT INTO activity_import_runs (status) VALUES ('running') RETURNING id")).rows[0]
    const sources = await collectActivities()
    const summary = await applyCollection(client, sources)
    const status = summary.every(s => s.ok) ? 'success' : summary.some(s => s.ok) ? 'partial' : 'failed'
    await client.query('UPDATE activity_import_runs SET status = $1, summary = $2::jsonb, finished_at = now() WHERE id = $3', [status, JSON.stringify(summary), run.id])
    await client.query('COMMIT')
    return { ok: status === 'success', status, summary }
  } catch (error) {
    await client.query('ROLLBACK')
    throw error
  } finally { client.release() }
}

export async function reviewImport(client, { source, externalId, action, data = {} }) {
  await acquireImportLock(client)
  const entry = (await client.query('SELECT * FROM activity_import_items WHERE source_id = $1 AND external_id = $2 FOR UPDATE', [source, externalId])).rows[0]
  if (!entry) throw Object.assign(new Error('找不到匯入活動'), { statusCode: 404 })
  if (entry.state !== 'pending') throw Object.assign(new Error('這筆活動已處理，請重新整理'), { statusCode: 409 })
  if (action === 'dismiss') {
    await client.query("UPDATE activity_import_items SET state = 'dismissed', updated_at = now() WHERE source_id = $1 AND external_id = $2", [source, externalId])
    return { state: 'dismissed' }
  }
  if (action !== 'publish') throw Object.assign(new Error('不支援的操作'), { statusCode: 400 })
  const item = { ...entry.candidate }
  for (const key of ['title', 'description', 'location', 'organizer_name']) item[key] = plainText(data[key] ?? item[key]).slice(0, key === 'description' ? 15000 : 250)
  item.event_date = dateOnly(data.event_date ?? item.event_date)
  item.end_date = dateOnly(data.end_date ?? item.end_date)
  item.source_url = safeSourceUrl(item.source_url)
  const policy = activitySources.find(s => s.id === source) || {}
  const missing = reviewReasons({ ...item, schedule_uncertain: false, cancelled: false, source_conflict: false }, true, policy).filter(r => r !== '日期或場次需確認')
  if (missing.length || item.end_date < taipeiToday()) throw Object.assign(new Error('請補齊必要資訊（名稱、日期、地點、來源連結），且活動不可已結束'), { statusCode: 400 })
  const rows = (await client.query('SELECT * FROM yilan_activities')).rows
  const duplicate = rows.find(a => a.id !== entry.activity_id && sameEvent(a, item))
  if (duplicate) throw Object.assign(new Error('已有同名、同日、同地點活動，請退回此筆'), { statusCode: 409 })
  const activity = await writeActivity(client, item, entry.source_name, entry.activity_id, false)
  await client.query("UPDATE activity_import_items SET state = 'published', activity_id = $3, updated_at = now() WHERE source_id = $1 AND external_id = $2", [source, externalId, activity.id])
  return { state: 'published', activityId: activity.id }
}
