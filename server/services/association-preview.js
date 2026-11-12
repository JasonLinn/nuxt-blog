import { createHash } from 'node:crypto'
import {
  AssociationError,
  fetchAssociationSnapshot,
  safeAssociationUrl,
  IMPORT_DISABLED_REASON
} from './association-source.js'

export function normalizeName(value) {
  return String(value || '')
    .normalize('NFKC')
    .toLowerCase()
    .replace(/[\s\p{P}\p{S}]/gu, '')
}

export function normalizePhone(value) {
  let phone = String(value || '')
    .normalize('NFKC')
    .replace(/[\s().-]/g, '')
  if (/^(\+886|00886)/.test(phone)) phone = phone.replace(/^(\+886|00886)0?/, '0')
  return /^0\d{8,9}$/.test(phone) ? phone : ''
}

export function websiteIdentity(value) {
  const safe = safeAssociationUrl(value)
  if (!safe) return ''
  const url = new URL(safe)
  const host = url.hostname.toLowerCase().replace(/^www\./, '')
  for (const key of [...url.searchParams.keys()]) {
    if (/^utm_/i.test(key) || ['fbclid', 'gclid'].includes(key.toLowerCase()))
      url.searchParams.delete(key)
  }
  url.searchParams.sort()
  // Keep tenant paths and meaningful parameters: two properties on the same
  // booking platform or Facebook are not the same business.
  const pathname = url.pathname.replace(/\/+$/, '')
  return host + (url.port ? `:${url.port}` : '') + pathname + url.search
}

function keys(row) {
  return {
    name: normalizeName(row.name),
    area: normalizeName(row.area),
    website: websiteIdentity(row.website),
    phone: normalizePhone(row.phone)
  }
}

function signals(a, b) {
  return ['name', 'website', 'phone'].filter((key) => a[key] && a[key] === b[key])
}

function localRecord(row) {
  return {
    id: String(row.id),
    name: String(row.name || ''),
    area: String(row.location || ''),
    website: safeAssociationUrl(row.website) || '',
    phone: String(row.phone || ''),
    line_url: safeAssociationUrl(row.social_line) || '',
    photos: (Array.isArray(row.images) && row.images.length ? row.images : [row.image_url])
      .map(safeAssociationUrl)
      .filter(Boolean),
    status: row.status,
    available: row.available === true
  }
}

function differences(source, local) {
  const fields = ['name', 'area', 'website', 'phone', 'line_url', 'photos']
  return fields.flatMap((field) => {
    const before = local[field]
    const after = field === 'photos' ? source.photos.map((photo) => photo.url) : source[field]
    return JSON.stringify(before) !== JSON.stringify(after)
      ? [
          {
            field,
            before,
            after,
            requires_confirmation: !after || (Array.isArray(after) && !after.length)
          }
        ]
      : []
  })
}

export function buildAssociationPreview(snapshot, localRows, now = new Date()) {
  const locals = localRows.map(localRecord)
  const localKeys = locals.map(keys)
  const sourceKeys = snapshot.records.map(keys)
  const items = snapshot.records.map((source, index) => {
    const identity = sourceKeys[index]
    const sourceDuplicates = snapshot.records.flatMap((other, otherIndex) => {
      const evidence = otherIndex === index ? [] : signals(identity, sourceKeys[otherIndex])
      return evidence.length
        ? [{ external_id: other.external_id, name: other.name, signals: evidence }]
        : []
    })
    const candidates = locals
      .flatMap((local, localIndex) => {
        const evidence = signals(identity, localKeys[localIndex])
        if (!evidence.length) return []
        const areaMatches = !!identity.area && identity.area === localKeys[localIndex].area
        return [
          {
            ...local,
            signals: evidence,
            area_matches: areaMatches,
            protected: local.status !== 'approved' || !local.available,
            differences: differences(source, local)
          }
        ]
      })
      .sort((a, b) => b.signals.length - a.signals.length || a.id.localeCompare(b.id))
    let category = 'new'
    const reasons = [...source.issues]
    if (source.issues.length) category = 'invalid'
    else if (candidates.some((candidate) => candidate.protected)) {
      category = 'blocked'
      reasons.push('候選包含待審核、已停用或被拒絕的既有民宿，不能重新刊登')
    } else if (sourceDuplicates.length) {
      category = 'review'
      reasons.push('來源名單內有相同名稱、官網或電話，需先確認是否同一家')
    } else if (
      candidates.length === 1 &&
      candidates[0].signals.length >= 2 &&
      candidates[0].area_matches
    ) {
      category = 'match'
      reasons.push('至少兩項識別條件及區域一致，建議配對；尚未確認或寫入')
    } else if (candidates.length) {
      category = 'review'
      reasons.push(
        candidates.length > 1
          ? '有多個既有候選，不能自動決定'
          : '只有單一識別條件相符或區域不同，需人工確認'
      )
    } else reasons.push('未找到既有候選；不是已核准新增，仍待開通條件確認')
    return { ...source, category, reasons, source_duplicates: sourceDuplicates, candidates }
  })
  // A local record claimed by more than one source can never be a high-confidence
  // proposal, even if those source rows share different identifiers.
  const claimants = new Map()
  for (const item of items)
    for (const candidate of item.candidates) {
      claimants.set(candidate.id, [...(claimants.get(candidate.id) || []), item.external_id])
    }
  for (const item of items) {
    if (item.category === 'match' && claimants.get(item.candidates[0].id).length > 1) {
      item.category = 'review'
      item.reasons = ['同一既有民宿被多筆來源指向，需確認一對一關係']
    }
  }
  const summary = {
    source_count: items.length,
    local_count: locals.length,
    new: 0,
    match: 0,
    review: 0,
    blocked: 0,
    invalid: 0,
    writes: 0
  }
  for (const item of items) summary[item.category]++
  const unmatchedLocals = locals
    .filter((local) => !claimants.has(local.id))
    .map(({ id, name, area, status, available }) => ({ id, name, area, status, available }))
  const fingerprint = createHash('sha256')
    .update(JSON.stringify({ generated_at: snapshot.generated_at, items }))
    .digest('hex')
  return {
    mode: 'preview_only',
    can_import: false,
    import_disabled_reason: IMPORT_DISABLED_REASON,
    generated_at: snapshot.generated_at,
    previewed_at: now.toISOString(),
    fingerprint,
    summary,
    items,
    local_without_candidates: unmatchedLocals,
    warnings: [
      ...snapshot.warnings,
      'API 是否等於已開通旅遊通尚待確認；本次沒有新增、更新、配對或下架任何正式會員。',
      '未找到來源候選的既有民宿只列供核對，不視為取消刊登。'
    ]
  }
}

async function closeReadOnlyPreview(client) {
  try {
    await client.query('ROLLBACK')
  } catch {
    client.release(true)
    throw new AssociationError('LOCAL_READ_FAILED', '會員預覽連線結束失敗，請稍後重試。', 503)
  }
  client.release()
}

export async function previewAssociationMembers(pool, options = {}) {
  const snapshot = await fetchAssociationSnapshot(options)
  let client
  try {
    client = await pool.connect()
    await client.query('BEGIN ISOLATION LEVEL REPEATABLE READ READ ONLY')
    await client.query("SET LOCAL statement_timeout = '10s'")
    const result = await client.query(`SELECT id, name, location, website, phone, social_line,
      image_url, images, status, available FROM homestays ORDER BY id LIMIT 10001`)
    if (result.rows.length > 10000)
      throw new AssociationError('LOCAL_LIMIT', '既有會員超過預覽上限，請調整比對策略。', 503)
    return buildAssociationPreview(snapshot, result.rows)
  } catch (error) {
    if (error instanceof AssociationError) throw error
    throw new AssociationError('LOCAL_READ_FAILED', '無法讀取既有會員，未產生預覽。', 503)
  } finally {
    if (client) await closeReadOnlyPreview(client)
  }
}
