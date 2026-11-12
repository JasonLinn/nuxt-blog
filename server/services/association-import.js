import { AssociationError, fetchAssociationSnapshot } from './association-source.js'
import {
  buildAssociationPreview,
  normalizeName,
  normalizePhone,
  websiteIdentity
} from './association-preview.js'
import {
  withAssociationTransaction,
  stageAssociationSnapshot,
  readLocalsAndLinks,
  reviewHash
} from './association-links.js'

export function assertImportEnabled(env = process.env) {
  if (env.ASSOCIATION_SYNC_ENABLED !== 'true')
    throw new AssociationError('IMPORT_DISABLED', '正式同步尚未啟用。', 409)
}
const identity = (row) => ({
  name: normalizeName(row.name),
  phone: normalizePhone(row.phone),
  website: websiteIdentity(row.website)
})
export function buildImportPlan(snapshot, locals, links, published) {
  const preview = buildAssociationPreview(snapshot, locals, new Date(), links)
  const accepted = []
  const held = []
  for (const item of preview.items) {
    const current = identity(item)
    // A provider changing IDs must not create a second public profile, even if
    // the old ID has disappeared from the latest source snapshot.
    const duplicate = published.some(
      (other) =>
        other.external_id !== item.external_id &&
        Object.entries(identity(other)).some(([key, value]) => value && current[key] === value)
    )
    if (
      !['new', 'linked'].includes(item.category) ||
      duplicate ||
      locals.some((local) => String(local.id) === `ythma_${item.external_id}`)
    ) {
      held.push(item)
      continue
    }
    accepted.push(item)
  }
  return { accepted, held, preview }
}

export async function importAssociationMembers(pool, actor, options = {}) {
  assertImportEnabled(options.env || process.env)
  const snapshot = await fetchAssociationSnapshot(options)
  return withAssociationTransaction(pool, async (client) => {
    // Serializes with staging and manual link confirmation; one atomic commit.
    const { locals, links } = await readLocalsAndLinks(client, true)
    const previous = (
      await client.query('SELECT * FROM association_public_listings WHERE source_id=$1', ['ythma'])
    ).rows
    for (const row of snapshot.records) {
      const prior = previous.find((item) => item.external_id === row.external_id)
      if (prior && Date.parse(row.source_updated_at) < new Date(prior.source_updated_at).getTime())
        throw new AssociationError('SOURCE_VERSION_REGRESSION', '來源版本倒退，未匯入。', 409)
    }
    await stageAssociationSnapshot(client, snapshot)
    const plan = buildImportPlan(snapshot, locals, links, previous)
    let inserted = 0
    let updated = 0
    let unchanged = 0
    const entries = plan.accepted.map((item) => {
      const profile = Object.fromEntries(
        [
          'external_id',
          'name',
          'area',
          'website',
          'phone',
          'line_url',
          'photos',
          'source_updated_at'
        ].map((key) => [key, item[key]])
      )
      const hash = reviewHash(profile)
      const prior = previous.find((row) => row.external_id === item.external_id)
      if (!prior) inserted++
      else if (prior.content_hash !== hash || prior.state !== 'active') updated++
      else unchanged++
      return { ...profile, content_hash: hash }
    })
    if (entries.length)
      await client.query(
        `INSERT INTO association_public_listings
      (source_id,external_id,name,area,website,phone,line_url,photos,source_updated_at,content_hash)
      SELECT 'ythma',external_id,name,area,website,phone,line_url,photos,source_updated_at,content_hash
      FROM jsonb_to_recordset($1::jsonb) AS entry(external_id text,name text,area text,website text,
        phone text,line_url text,photos jsonb,source_updated_at timestamptz,content_hash text)
      ON CONFLICT(source_id,external_id) DO UPDATE SET
        name=EXCLUDED.name,area=EXCLUDED.area,website=EXCLUDED.website,phone=EXCLUDED.phone,
        line_url=EXCLUDED.line_url,photos=EXCLUDED.photos,source_updated_at=EXCLUDED.source_updated_at,
        content_hash=EXCLUDED.content_hash,state='active',updated_at=now()
      WHERE association_public_listings.content_hash<>EXCLUDED.content_hash OR association_public_listings.state<>'active'`,
        [JSON.stringify(entries)]
      )
    // Newly ambiguous data is quarantined; absence alone never means withdrawal.
    const quarantined = await client.query(
      `UPDATE association_public_listings SET state='quarantined',updated_at=now()
      WHERE source_id='ythma' AND state<>'quarantined' AND external_id=ANY($1::text[])`,
      [plan.held.map((item) => item.external_id)]
    )
    const summary = {
      source_count: snapshot.count,
      inserted,
      updated,
      unchanged,
      held: plan.held.length,
      quarantined: quarantined.rowCount,
      missing_retained: previous.filter(
        (row) => !snapshot.records.some((item) => item.external_id === row.external_id)
      ).length,
      homestays_written: 0,
      links_created: 0
    }
    await client.query(
      'INSERT INTO association_import_runs(actor,source_generated_at,summary) VALUES($1,$2,$3)',
      [String(actor || 'admin').slice(0, 100), snapshot.generated_at, JSON.stringify(summary)]
    )
    return { success: true, summary }
  })
}
