import { createHash } from 'node:crypto'
import { AssociationError, fetchAssociationSnapshot } from './association-source.js'
import { buildAssociationPreview } from './association-preview.js'

const SOURCE = 'ythma'
const localSql = `SELECT id, name, location, website, phone, social_line,
  image_url, images, status, available FROM homestays ORDER BY id LIMIT 10001`

export function reviewHash(item) {
  // These are constructed by our allowlisted preview, never request-supplied JSON.
  const stableItem = { ...item }
  delete stableItem.source_index
  // jsonb does not preserve object key order. Array order remains meaningful.
  const canonical = (value) =>
    Array.isArray(value)
      ? value.map(canonical)
      : value && typeof value === 'object'
      ? Object.fromEntries(
          Object.keys(value)
            .sort()
            .map((key) => [key, canonical(value[key])])
        )
      : value
  return createHash('sha256')
    .update(JSON.stringify(canonical(stableItem)))
    .digest('hex')
}

function safeError(error) {
  if (error instanceof AssociationError) return error
  if (error.code === '42P01')
    return new AssociationError('MAPPING_NOT_READY', '請先建立會員對照資料表。', 503)
  if (['23505', '23503'].includes(error.code))
    return new AssociationError(
      'MAPPING_CONFLICT',
      '此會員已有其他對照或資料已異動，請重新整理。',
      409
    )
  return new AssociationError('MAPPING_FAILED', '會員對照操作失敗，未套用變更。', 503)
}

export async function withAssociationTransaction(pool, work, { readOnly = false } = {}) {
  let client
  let destroyed = false
  try {
    client = await pool.connect()
    await client.query(readOnly ? 'BEGIN ISOLATION LEVEL REPEATABLE READ READ ONLY' : 'BEGIN')
    await client.query("SET LOCAL statement_timeout = '15s'")
    await client.query("SET LOCAL lock_timeout = '5s'")
    if (!readOnly)
      await client.query(
        "SELECT pg_advisory_xact_lock(hashtext(current_schema()), hashtext('ythma-member-links'))"
      )
    const result = await work(client)
    await client.query(readOnly ? 'ROLLBACK' : 'COMMIT')
    return result
  } catch (error) {
    if (client) {
      try {
        await client.query('ROLLBACK')
      } catch {
        client.release(true)
        destroyed = true
      }
    }
    throw safeError(error)
  } finally {
    if (client && !destroyed) client.release()
  }
}

async function readLocalsAndLinks(client, lock = false) {
  const locals = await client.query(localSql + (lock ? ' FOR SHARE' : ''))
  if (locals.rows.length > 10000)
    throw new AssociationError('LOCAL_LIMIT', '既有會員超過比對上限。', 503)
  const links = await client.query(
    'SELECT external_id, homestay_id FROM association_member_links WHERE source_id = $1 ORDER BY external_id',
    [SOURCE]
  )
  return { locals: locals.rows, links: links.rows }
}

async function assertFreshSnapshot(client, snapshot) {
  const previous = await client.query(
    'SELECT generated_at FROM association_member_sync_state WHERE source_id = $1',
    [SOURCE]
  )
  if (
    previous.rows[0] &&
    Date.parse(snapshot.generated_at) < new Date(previous.rows[0].generated_at).getTime()
  ) {
    throw new AssociationError('STALE_SNAPSHOT', '名單比已保存的版本舊，請稍後重新取得。', 409)
  }
}

// This stages review metadata only. It never writes homestays or creates links.
export async function stageAssociationMembers(pool, options = {}) {
  const snapshot = await fetchAssociationSnapshot(options)
  return withAssociationTransaction(pool, async (client) => {
    await assertFreshSnapshot(client, snapshot)
    const { locals, links } = await readLocalsAndLinks(client)
    const preview = buildAssociationPreview(snapshot, locals, new Date(), links)
    const priorRows = await client.query(
      'SELECT external_id, source_updated_at FROM association_member_reviews WHERE source_id = $1',
      [SOURCE]
    )
    const priorById = new Map(priorRows.rows.map((row) => [row.external_id, row.source_updated_at]))
    for (const item of preview.items) {
      const prior = priorById.get(item.external_id)
      if (
        item.source_updated_at &&
        prior &&
        Date.parse(item.source_updated_at) < new Date(prior).getTime()
      ) {
        throw new AssociationError(
          'SOURCE_VERSION_REGRESSION',
          '會員修改時間早於已保存資料，這次清單未更新。',
          409
        )
      }
    }
    if (preview.items.length)
      await client.query(
        `INSERT INTO association_member_reviews
        (source_id, external_id, category, preview_item, content_hash, source_updated_at, source_generated_at)
        SELECT $1, row.external_id, row.category, row.preview_item, row.content_hash, row.source_updated_at, $3::timestamptz
        FROM jsonb_to_recordset($2::jsonb) AS row(external_id text, category text, preview_item jsonb, content_hash text, source_updated_at timestamptz)
        ON CONFLICT (source_id, external_id) DO UPDATE SET
          category = EXCLUDED.category, preview_item = EXCLUDED.preview_item,
          revision = association_member_reviews.revision + CASE WHEN
            association_member_reviews.content_hash <> EXCLUDED.content_hash OR
            NOT association_member_reviews.present_in_source THEN 1 ELSE 0 END,
          content_hash = EXCLUDED.content_hash, present_in_source = true,
          source_updated_at = EXCLUDED.source_updated_at,
          source_generated_at = EXCLUDED.source_generated_at, last_seen_at = now()`,
        [
          SOURCE,
          JSON.stringify(
            preview.items.map((item) => ({
              external_id: item.external_id,
              category: item.category,
              preview_item: item,
              content_hash: reviewHash(item),
              source_updated_at: item.source_updated_at
            }))
          ),
          snapshot.generated_at
        ]
      )
    // Absence only changes review metadata. Confirmed links and public listings survive.
    await client.query(
      `UPDATE association_member_reviews SET present_in_source = false, revision = revision + 1
      WHERE source_id = $1 AND present_in_source AND NOT (external_id = ANY($2::text[]))`,
      [SOURCE, snapshot.records.map((row) => row.external_id)]
    )
    await client.query(
      `INSERT INTO association_member_sync_state (source_id, generated_at, source_count)
      VALUES ($1,$2,$3) ON CONFLICT (source_id) DO UPDATE SET generated_at = EXCLUDED.generated_at,
      source_count = EXCLUDED.source_count, reviewed_at = now()`,
      [SOURCE, snapshot.generated_at, snapshot.count]
    )
    return {
      success: true,
      staged: snapshot.count,
      summary: preview.summary,
      links_created: 0,
      homestays_written: 0,
      can_import: false
    }
  })
}

export function readAssociationReviews(pool) {
  return withAssociationTransaction(
    pool,
    async (client) => {
      const { locals, links } = await readLocalsAndLinks(client)
      const result = await client.query(
        `SELECT external_id, category, preview_item, content_hash,
      revision, present_in_source, source_generated_at, last_seen_at
      FROM association_member_reviews WHERE source_id = $1 ORDER BY external_id`,
        [SOURCE]
      )
      const state = await client.query(
        'SELECT generated_at, reviewed_at, source_count FROM association_member_sync_state WHERE source_id = $1',
        [SOURCE]
      )
      // Re-evaluate candidates against current local data. A saved card can be visible
      // but cannot be confirmed until refreshed if local evidence has since changed.
      const records = result.rows
        .filter((row) => row.present_in_source)
        .map((row) => {
          const item = row.preview_item
          return Object.fromEntries(
            [
              'external_id',
              'source_index',
              'name',
              'area',
              'phone',
              'website',
              'line_url',
              'photos',
              'source_updated_at',
              'issues',
              'warnings'
            ].map((key) => [key, item[key]])
          )
        })
      const current = buildAssociationPreview(
        { records, generated_at: state.rows[0]?.generated_at, warnings: [] },
        locals,
        new Date(),
        links
      )
      const byId = new Map(current.items.map((item) => [item.external_id, item]))
      const linkById = new Map(links.map((link) => [link.external_id, link.homestay_id]))
      const items = result.rows.map((row) => {
        const item = byId.get(row.external_id) || row.preview_item
        return {
          ...item,
          revision: row.revision,
          present_in_source: row.present_in_source,
          needs_refresh:
            !linkById.has(row.external_id) &&
            row.present_in_source &&
            reviewHash(item) !== row.content_hash,
          confirmed_homestay_id: linkById.get(row.external_id) || null,
          last_seen_at: row.last_seen_at
        }
      })
      return {
        success: true,
        can_import: false,
        items,
        state: state.rows[0] || null,
        summary: {
          total: items.length,
          linked: links.length,
          pending: items.filter((item) => !item.confirmed_homestay_id).length,
          absent: items.filter((item) => !item.present_in_source).length
        }
      }
    },
    { readOnly: true }
  )
}

export function validateLinkRequest(body) {
  if (
    !body ||
    typeof body !== 'object' ||
    Array.isArray(body) ||
    Object.keys(body).some(
      (key) => !['external_id', 'homestay_id', 'revision', 'note'].includes(key)
    ) ||
    typeof body.external_id !== 'string' ||
    !/^[A-Za-z0-9_-]{1,128}$/.test(body.external_id) ||
    typeof body.homestay_id !== 'string' ||
    !/^[A-Za-z0-9_-]{1,10}$/.test(body.homestay_id) ||
    !Number.isSafeInteger(body.revision) ||
    body.revision < 1 ||
    (body.note !== undefined && (typeof body.note !== 'string' || body.note.length > 500))
  ) {
    throw new AssociationError('INVALID_LINK_REQUEST', '對照資料不完整或格式不符。', 400)
  }
  return { ...body, note: (body.note || '').trim() }
}

export async function confirmAssociationLink(pool, input, actor, options = {}) {
  const body = validateLinkRequest(input)
  const snapshot = await fetchAssociationSnapshot(options)
  return withAssociationTransaction(pool, async (client) => {
    const saved = await client.query(
      `SELECT revision, content_hash, present_in_source FROM association_member_reviews
      WHERE source_id = $1 AND external_id = $2 FOR UPDATE`,
      [SOURCE, body.external_id]
    )
    if (!saved.rows.length)
      throw new AssociationError('REVIEW_REQUIRED', '請先保存並檢視候選清單。', 409)
    const { locals, links } = await readLocalsAndLinks(client, true)
    const existing = links.find((link) => link.external_id === body.external_id)
    if (existing) {
      if (existing.homestay_id !== body.homestay_id)
        throw new AssociationError(
          'MAPPING_IMMUTABLE',
          '此會員已有固定對照，不能改配到另一家。',
          409
        )
      return {
        success: true,
        already_confirmed: true,
        homestay_id: existing.homestay_id,
        homestays_written: 0
      }
    }
    if (links.some((link) => link.homestay_id === body.homestay_id))
      throw new AssociationError('MAPPING_CONFLICT', '這家旅遊通民宿已對應另一位協會會員。', 409)
    await assertFreshSnapshot(client, snapshot)
    const preview = buildAssociationPreview(snapshot, locals, new Date(), links)
    const item = preview.items.find((row) => row.external_id === body.external_id)
    if (!item || !saved.rows[0].present_in_source)
      throw new AssociationError('SOURCE_ABSENT', '會員不在目前名單內，不能確認配對。', 409)
    if (
      saved.rows[0].revision !== body.revision ||
      reviewHash(item) !== saved.rows[0].content_hash
    ) {
      throw new AssociationError(
        'REVIEW_CHANGED',
        '來源或既有會員資料已變動，請更新候選清單後再確認。',
        409
      )
    }
    if (
      !['match', 'review'].includes(item.category) ||
      !item.candidates.some(
        (candidate) => candidate.id === body.homestay_id && !candidate.protected
      )
    ) {
      throw new AssociationError(
        'UNREVIEWABLE_LINK',
        '此筆沒有可確認的既有候選，或有審核限制。',
        409
      )
    }
    if (item.category === 'review' && body.note.length < 4)
      throw new AssociationError(
        'REVIEW_NOTE_REQUIRED',
        '疑似重複請填寫確認同一民宿的依據（至少 4 字）。',
        400
      )
    await client.query(
      `INSERT INTO association_member_links
      (source_id, external_id, homestay_id, confirmed_by, confirmation_note) VALUES ($1,$2,$3,$4,$5)`,
      [
        SOURCE,
        body.external_id,
        body.homestay_id,
        String(actor || 'admin').slice(0, 100),
        body.note
      ]
    )
    await client.query(
      `INSERT INTO association_member_link_events
      (source_id, external_id, homestay_id, action, actor, review_revision) VALUES ($1,$2,$3,'confirmed',$4,$5)`,
      [
        SOURCE,
        body.external_id,
        body.homestay_id,
        String(actor || 'admin').slice(0, 100),
        body.revision
      ]
    )
    return {
      success: true,
      already_confirmed: false,
      homestay_id: body.homestay_id,
      homestays_written: 0
    }
  })
}
