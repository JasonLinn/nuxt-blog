import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { officialPageSources, parseOfficialPage } from '../server/services/activity-official-pages.js'
import { collectActivities, activitySources } from '../server/services/activity-sources.js'
import { verifyCollectionCoverage } from '../server/services/activity-import.js'

const fixtures = Object.fromEntries(await Promise.all(officialPageSources.map(async s => [s.id,
  await readFile(new URL(`./fixtures/activity-official/${s.id}.html`, import.meta.url), 'utf8')])) )

test('real official pages supply all missing events and the extended Yang exhibition', () => {
  const parsed = Object.fromEntries(officialPageSources.map(s => [s.id, parseOfficialPage(fixtures[s.id], s)]))
  assert.equal(Object.values(parsed).flat().length, 7)
  assert.equal(parsed.ncfta[0].event_date, '2025-12-25')
  assert.equal(parsed.ncfta[0].end_date, '2027-03-01')
  assert.equal(parsed['lanyang-museum'][0].end_date, '2027-05-18')
  assert.equal(parsed['yilan-news'][0].event_date, '2026-12-12')
  assert.equal(parsed.necoast[0].event_date, '2026-11-14')
  assert.equal(parsed.necoast[0].end_date, '2026-12-13')
  assert.match(parsed.sunmake[0].description, /11\/1-11\/15[\s\S]*臨水劇場/)
  assert.equal(parsed.sunmake[1].event_date, '2026-11-21')
  assert.match(parsed['taiwan-hotspring'][0].description, /不代表每天/)
})

test('a changed official date is parsed, but missing dates or mismatched identity fail closed', () => {
  const source = officialPageSources.find(s => s.id === 'ncfta')
  assert.equal(parseOfficialPage(fixtures.ncfta.replaceAll('2027-03-01', '2027-04-01'), source)[0].end_date, '2027-04-01')
  assert.throws(() => parseOfficialPage(fixtures.ncfta.replaceAll('2027-03-01', '尚未公告'), source), /展期/)
  for (const source of officialPageSources) assert.throws(() => parseOfficialPage('<html>維護中</html>', source))
  const news = officialPageSources[0]
  assert.throws(() => parseOfficialPage(fixtures['yilan-news'].replace('2026年12月12日', '2026年02月30日'), news), /日期/)
})

test('nonzero truncated feeds and zero-local feeds with no known events cannot pass a volume collapse', async () => {
  const truncated = { source: 'culture-7', ok: true, rawCount: 10, items: [] }
  const [failed] = await verifyCollectionCoverage([truncated], {}, async ({ fallback }) => {
    assert.equal(fallback, true)
    return [truncated]
  }, { 'culture-7': 99 })
  assert.equal(failed.ok, false)
  assert.match(failed.error, /原始筆數異常縮減/)
  const [recovered] = await verifyCollectionCoverage([truncated], {}, async () => [{ ...truncated, rawCount: 100 }], { 'culture-7': 99 })
  assert.equal(recovered.ok, true)
  assert.equal(recovered.firstAttempt.rawCount, 10)
  const partial = { source: 'culture-1', ok: true, rawCount: 8, items: [{ external_id: 'one' }] }
  assert.equal((await verifyCollectionCoverage([partial], {}, async () => [partial], { 'culture-1': 465 }))[0].ok, false)
})

test('retry uses the alternate official endpoint and unrelated categories are retained once', async () => {
  const urls = []
  const fetcher = async url => {
    urls.push(url)
    return new Response(JSON.stringify([
      { UID: 'music', title: '音樂', category: '1', showInfo: [{ location: '宜蘭縣宜蘭市', time: '2026/12/01', endTime: '2026/12/01' }] },
      { UID: 'drama', title: '戲劇', category: '2', showInfo: [{ location: '宜蘭縣宜蘭市', time: '2026/12/02', endTime: '2026/12/02' }] }
    ]))
  }
  const [other] = await collectActivities({ fetcher, sourceIds: ['culture-other'] })
  assert.equal(other.items.length, 1)
  assert.match(other.items[0].external_id, /^drama:/)
  await collectActivities({ fetcher, sourceIds: ['culture-1'], fallback: true })
  assert.equal(urls.at(-1), activitySources[0].fallbackFeed)
})
