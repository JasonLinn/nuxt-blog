import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { officialPageSources, parseOfficialPage, parseSunmakeCover } from '../server/services/activity-official-pages.js'
import { collectActivities, activitySources, safeActivityImage, enrichOfficialPageMedia } from '../server/services/activity-sources.js'
import { verifyCollectionCoverage } from '../server/services/activity-import.js'

const fixtures = Object.fromEntries(await Promise.all(officialPageSources.map(async s => [s.id,
  await readFile(new URL(`./fixtures/activity-official/${s.id}.html`, import.meta.url), 'utf8')])) )
const media = Object.fromEntries(await Promise.all(['lanyang-museum', 'necoast', 'sunmake', 'sunmake-show'].map(async id => [id,
  await readFile(new URL(`./fixtures/activity-official/${id}-media.html`, import.meta.url), 'utf8')])))

test('official activity covers are imported from the matching page, not logos', () => {
  for (const id of ['lanyang-museum', 'necoast', 'sunmake']) {
    const source = officialPageSources.find(s => s.id === id)
    const rows = parseOfficialPage(media[id] + fixtures[id], source)
    const item = rows.find(i => id !== 'sunmake' || i.external_id === '107-peace')
    assert.equal(item.images.length, 1)
    assert.ok(safeActivityImage(item.images[0]))
  }
  const museum = officialPageSources.find(s => s.id === 'lanyang-museum')
  assert.deepEqual(parseOfficialPage('<meta property="og:image" content="https://www.lym.gov.tw/logo.png">' + fixtures['lanyang-museum'], museum)[0].images, [])
  assert.equal(safeActivityImage('https://events.necoast-nsa.gov.tw/flower25/common/images/fbimg.jpg'), null)
  assert.equal(safeActivityImage('https://admin.px-sunmake.org.tw/Public/show/999/photo.png'), null)
})

test('Nezha media requires matching official ID, title and both dates', () => {
  const expected = { id: 1045, title: '11月主題劇場「哪吒海底歷險記—海洋之心」', start: '2026-11-01', end: '2026-11-30' }
  assert.equal(parseSunmakeCover(media['sunmake-show'], expected).length, 1)
  for (const change of [{ id: 1046 }, { title: '另一場活動' }, { start: '2025-11-01' }, { end: '2026-12-31' }]) {
    assert.deepEqual(parseSunmakeCover(media['sunmake-show'], { ...expected, ...change }), [])
  }
})

test('hot spring pages only import article photos, never site branding or related events', () => {
  const source = officialPageSources.find(s => s.id === 'taiwan-hotspring')
  const html = `<meta property="og:image" content="https://taiwanhotspring.net/images/ogimg.jpg"><img src="/UserFiles/image/logo.png"><div class="container-article"><img src="images/loader.gif" data-src="/UserFiles/image/event.jpg"></div><div class="container-aside"><img src="/UserFiles/image/unrelated.jpg"></div>`
  assert.deepEqual(parseOfficialPage(fixtures['taiwan-hotspring'] + html, source)[0].images, ['https://taiwanhotspring.net/UserFiles/image/event.jpg'])
  assert.deepEqual(parseOfficialPage(fixtures['taiwan-hotspring'], source)[0].images, [])
})

test('official media fetch failures preserve existing images and missing covers are visible warnings', async () => {
  const item = { external_id: '107-november', event_date: '2026-11-01', end_date: '2026-11-30', images: ['existing-photo'] }
  const sources = [{ source: 'sunmake', ok: true, items: [item] }, { source: 'taiwan-hotspring', ok: true, items: [{ title: '溫泉季', images: [] }] }]
  await enrichOfficialPageMedia(sources, async () => { throw new Error('unavailable') })
  assert.deepEqual(item.images, ['existing-photo'])
  assert.match(sources[0].warnings[0], /保留既有圖片/)
  assert.match(sources[1].warnings[0], /尚無可核對/)
  await enrichOfficialPageMedia(sources, async () => new Response(media['sunmake-show']))
  assert.match(item.images[0], /\/show\/1045\//)
})

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
  const truncated = { source: 'culture-7', ok: true, rawCount: 10, contentHash: 'first-response-hash', fetchedAt: '2026-11-04T02:00:00Z', items: [] }
  const [failed] = await verifyCollectionCoverage([truncated], {}, async ({ fallback }) => {
    assert.equal(fallback, true)
    return [truncated]
  }, { 'culture-7': 99 })
  assert.equal(failed.ok, false)
  assert.match(failed.error, /原始筆數異常縮減/)
  const [recovered] = await verifyCollectionCoverage([truncated], {}, async () => [{ ...truncated, rawCount: 100 }], { 'culture-7': 99 })
  assert.equal(recovered.ok, true)
  assert.equal(recovered.firstAttempt.rawCount, 10)
  assert.equal(recovered.firstAttempt.contentHash, 'first-response-hash')
  assert.equal(recovered.firstAttempt.fetchedAt, '2026-11-04T02:00:00Z')
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
