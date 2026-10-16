import test from 'node:test'
import assert from 'node:assert/strict'
import { activityWindow, dateOnly, overlapsActivity, taipeiToday } from '../utils/activity-dates.js'
import { normalizeCulture, normalizeYilanCalendar, collectActivities, reviewReasons, safeSourceUrl, sameEvent, possiblySameEvent, fetchSource, activitySources, safeActivityImage, parseExhibitionImages, enrichOfficialMedia, opentixEventUrl, parseProgramDetails, enrichCulturePrograms } from '../server/services/activity-sources.js'

test('Taiwan boundaries include ongoing events and the final day', () => {
  const now = new Date('2026-10-15T16:01:00Z')
  assert.equal(taipeiToday(now), '2026-10-16')
  assert.deepEqual(activityWindow('thisWeek', now), ['2026-10-16', '2026-10-22'])
  assert.deepEqual(activityWindow('nextMonth', new Date('2026-12-31T12:00:00Z')), ['2027-01-01', '2027-01-31'])
  assert.equal(overlapsActivity({ event_date: '2026-09-01', end_date: '2026-10-16' }, ...activityWindow('thisWeek', now)), true)
  assert.equal(overlapsActivity({ event_date: '2026-09-01', end_date: '2026-10-15' }, ...activityWindow('thisWeek', now)), false)
  assert.equal(dateOnly('2026-02-30'), null)
})
test('culture splits touring events by venue and flags discontinuous sessions', () => {
  const rows = [{ UID: 'a', title: '巡演', descriptionFilterHtml: '說明', masterUnit: ['主辦'], showInfo: [
    { location: '宜蘭縣宜蘭市中山路', locationName: '文化館', time: '2026/11/01 10:00:00', endTime: '2026/11/01 12:00:00' },
    { location: '宜蘭縣宜蘭市中山路', locationName: '文化館', time: '2026/11/10 10:00:00', endTime: '2026/11/10 12:00:00' },
    { location: '臺北市中山路', time: '2026/11/20 10:00:00' }
  ] }]
  const events = normalizeCulture(rows, activitySources[1])
  assert.equal(events.length, 1)
  assert.equal(events[0].end_date, '2026-11-10')
  assert.ok(reviewReasons(events[0], true).includes('日期或場次需確認'))
  rows[0].showInfo[0].time = '2026/11/02 10:00:00'
  assert.equal(normalizeCulture(rows, activitySources[1])[0].external_id, events[0].external_id)
})
test('trust and completeness are both required; unsafe links never become public source links', () => {
  const item = { title: '音樂會', event_date: '2026-11-01', end_date: '2026-11-01', location: '宜蘭文化中心', organizer_name: '主辦', description: '說明', source_url: 'https://example.com/event' }
  assert.deepEqual(reviewReasons(item, true), [])
  assert.ok(reviewReasons(item, false).length)
  assert.ok(reviewReasons({ ...item, cancelled: true }, true).length)
  assert.ok(reviewReasons({ ...item, title: '預計音樂會' }, true).length)
  for (const url of ['javascript:alert(1)', 'https://127.0.0.1/test', 'https://user:pass@example.com/', 'http://example.com/']) assert.equal(safeSourceUrl(url), null)
  assert.equal(sameEvent(item, { ...item, title: '音 樂 會！' }), true)
  assert.equal(sameEvent(item, { ...item, location: '另一場館' }), false)
})
test('HTTP 200 error pages and changed data schemas fail visibly', async () => {
  await assert.rejects(fetchSource(activitySources[0], async () => new Response('<html>Error</html>', { headers: { 'content-type': 'text/html' } })), /HTML/)
  assert.throws(() => normalizeCulture([], activitySources[1]), /空白/)
})
test('similar cross-source titles in overlapping dates require human comparison', () => {
  const a = { title: '「世紀初戀．楊麗花」歌仔戲特展', event_date: '2025-12-25', end_date: '2026-10-25' }
  assert.equal(possiblySameEvent(a, { title: '世紀初戀－楊麗花歌仔戲特展', event_date: '2026-01-01', end_date: '2026-10-25' }), true)
  assert.equal(possiblySameEvent(a, { ...a, event_date: '2027-01-01', end_date: '2027-10-25' }), false)
})

const calendarHtml = (year, data) => `<html><script id="__NEXT_DATA__" type="application/json">${JSON.stringify({ props: { pageProps: { title: '活動年曆', year, data } } })}</script></html>`
const yilanRow = { id: 219, title: '2026 冬山河馬拉松', date_begin: '2026-11-14T05:50:00', date_end: '2026-11-14T15:00:00', description: '活動資訊<br>完整介紹 &mdash; 地方活動', organizer: null, geographies: [{ county: '宜蘭縣', district: '冬山鄉', address: '冬山車站站前廣場' }] }
test('Yilan website extracts calendar JSON, keeps full descriptions and never invents organizer', () => {
  const [item] = normalizeYilanCalendar(calendarHtml(2026, [yilanRow]), 2026)
  assert.equal(item.external_id, '219')
  assert.equal(item.description, '活動資訊\n完整介紹 — 地方活動')
  assert.equal(item.source_url, 'https://travel.yilan.gov.tw/zh-tw/event/219/')
  assert.ok(reviewReasons(item, true).includes('缺少主辦單位'))
  const policy = activitySources.find(s => s.id === 'yilan-site')
  assert.deepEqual(reviewReasons(item, true, policy), [])
  assert.ok(reviewReasons(item, false, policy).includes('缺少主辦單位'))
  assert.ok(reviewReasons({ ...item, title: '暫定活動' }, true, policy).includes('日期或場次需確認'))
  assert.equal(normalizeYilanCalendar(calendarHtml(2026, [{ ...yilanRow, hide_address: true }]), 2026)[0].location, '')
  assert.deepEqual(normalizeYilanCalendar(calendarHtml(2027, []), 2027), [])
  assert.throws(() => normalizeYilanCalendar(calendarHtml(2025, []), 2026), /年份/)
  assert.throws(() => normalizeYilanCalendar('<html>Request Rejected</html>', 2026), /結構/)
})

test('official images exclude logos, unrelated hosts and mismatched exhibition pages', () => {
  const url = 'https://admin.px-sunmake.org.tw/Public/exhibition/955/2.jpeg'
  assert.equal(safeActivityImage(url), url)
  assert.equal(safeActivityImage('https://127.0.0.1/pic.jpg'), null)
  assert.equal(safeActivityImage('https://travel.yilan.gov.tw.evil.example/pic.jpg'), null)
  assert.equal(safeActivityImage('https://www.px-sunmake.org.tw/images/logo.png'), null)
  const html = `<h2>舉人之力：蘭陽首舉百宅第常設展</h2><img src="/images/logo.png"><img src="${url}"><img src="${url}">`
  assert.deepEqual(parseExhibitionImages(html), [url])
  assert.throws(() => parseExhibitionImages(html.replace('舉人之力', '別的展覽')), /不符/)
  assert.throws(() => parseExhibitionImages('<h2>舉人之力：蘭陽首舉百宅第常設展</h2>'), /找不到/)
  const [row] = normalizeYilanCalendar(calendarHtml(2026, [{ ...yilanRow, images: [{url:'https://travel.yilan.gov.tw/_api/content/images/articles/1/event.jpg'}, {url:'https://example.com/tracker.jpg'}] }]), 2026)
  assert.equal(row.images.length, 1)
})

test('verified cross-source identity shares images but unrelated similar events do not', async () => {
  const image = 'https://travel.yilan.gov.tw/_api/content/images/articles/27087/event.jpg'
  const culture = { external_id: '697678ed26b32454e437c439:venue', title: '世紀初戀－楊麗花歌仔戲特展', end_date: '2026-10-25', images: [] }
  const direct = { external_id: '192', title: '「世紀初戀．楊麗花」歌仔戲特展', end_date: '2026-10-25', images: [image], source_url: 'https://travel.yilan.gov.tw/zh-tw/event/192/' }
  const sources = [{source:'culture-6',ok:true,items:[culture]}, {source:'yilan-site',ok:true,items:[direct]}]
  await enrichOfficialMedia(sources, () => { throw new Error('no network expected') })
  assert.deepEqual(culture.images, [image])
  assert.equal(direct.duplicate_of.external_id, culture.external_id)
  assert.equal(culture.image_source_url, direct.source_url)
  const other = { ...direct, external_id: '193', duplicate_of: undefined }
  culture.images = []
  await enrichOfficialMedia([sources[0],{source:'yilan-site',ok:true,items:[other]}])
  assert.deepEqual(culture.images, [])
  assert.equal(other.duplicate_of, undefined)
})
test('Yilan fetch covers current and next Taiwan year with bounded requests', async () => {
  const urls = []
  const result = await fetchSource(activitySources.find(s => s.id === 'yilan-site'), async url => {
    urls.push(url)
    const year = Number(url.split('/').at(-2))
    return new Response(calendarHtml(year, year === 2027 ? [yilanRow] : []), { headers: { 'content-type': 'text/html' } })
  }, new Date('2026-12-31T16:01:00Z'))
  assert.deepEqual(urls, ['https://travel.yilan.gov.tw/zh-tw/events/2027/', 'https://travel.yilan.gov.tw/zh-tw/events/2028/'])
  assert.equal(result.length, 1)
})
test('only approved sources are fetched and Yilan failures remain visible', async () => {
  const fetcher = fail => async url => {
    if (url.includes('cloud.culture.tw')) return new Response(JSON.stringify([{ UID: 'elsewhere', showInfo: [] }]))
    if (fail) return new Response('unavailable', { status: 503 })
    const year = Number(url.split('/').at(-2))
    return new Response(calendarHtml(year, year === 2026 ? [yilanRow] : []), { headers: { 'content-type': 'text/html' } })
  }
  const now = new Date('2026-10-16T00:00:00Z')
  assert.deepEqual(activitySources.map(s => s.id), ['culture-1', 'culture-6', 'culture-7', 'yilan-site'])
  let sources = await collectActivities({ fetcher: fetcher(false), now })
  assert.equal(sources.find(s => s.source === 'yilan-site').items.length, 1)
  sources = await collectActivities({ fetcher: fetcher(true), now })
  assert.equal(sources.find(s => s.source === 'yilan-site').ok, false)
})

const programItem = { title: '宜蘭音樂會', event_date: '2026-11-01', end_date: '2026-11-01', location: '宜蘭縣宜蘭市中山路 宜蘭演藝廳', source_url: 'https://www.opentix.life/program/123', images: [], description: '', organizer_name: '' }
const programEvent = { '@type': 'Event', name: programItem.title, startDate: '2026-11-01T19:00:00', endDate: '2026-11-01T21:00:00', description: '官方簡介', organizer: [{ name: '音樂團' }], image: 'https://s3.resource.opentix.life/upload/program/poster.png', location: { name: '宜蘭演藝廳', address: { addressLocality: '宜蘭縣' } } }
const programHtml = event => `<script type="application/ld+json">${JSON.stringify(event)}</script>`

test('approved official sources tolerate blank details but still require confirmed core fields', () => {
  for (const policy of activitySources) {
    assert.deepEqual(reviewReasons(programItem, true, policy), [])
    assert.ok(reviewReasons(programItem, false, policy).includes('缺少活動說明'))
    assert.ok(reviewReasons({ ...programItem, location: '' }, true, policy).includes('缺少活動地點'))
    assert.ok(reviewReasons({ ...programItem, schedule_uncertain: true }, true, policy).includes('日期或場次需確認'))
  }
})

test('program enrichment validates title, dates and venue before borrowing any photo', () => {
  const details = parseProgramDetails(programHtml(programEvent), programItem)
  assert.deepEqual(details.images, [programEvent.image])
  assert.equal(details.organizer_name, '音樂團')
  assert.throws(() => parseProgramDetails(programHtml({ ...programEvent, name: '別場音樂會' }), programItem), /相符/)
  for (const override of [{ startDate: '2026-12-01' }, { location: { name: '別的場館', address: { addressLocality: '宜蘭縣' } } }]) {
    assert.deepEqual(parseProgramDetails(programHtml({ ...programEvent, ...override }), programItem), { source_conflict: true })
  }
  assert.equal(parseProgramDetails(programHtml({ ...programEvent, eventStatus: 'https://schema.org/EventCancelled' }), programItem).cancelled, true)
  assert.deepEqual(parseProgramDetails(programHtml({ ...programEvent, image: 'https://s3.resource.opentix.life/logo.png' }), programItem).images, [])
})

test('program fetch only accepts exact host numeric URLs and retains feed content on failures', async () => {
  assert.equal(opentixEventUrl(programItem.source_url), 'https://www.opentix.life/event/123')
  for (const url of ['https://www.opentix.life.evil.example/event/123', 'https://www.opentix.life/event/123?redirect=evil', 'https://www.opentix.life/admin', 'http://www.opentix.life/event/123']) assert.equal(opentixEventUrl(url), null)
  const item = structuredClone(programItem)
  const sources = [{ source: 'culture-1', ok: true, items: [item] }]
  await enrichCulturePrograms(sources, async (url, options) => {
    assert.equal(url, 'https://www.opentix.life/event/123')
    assert.equal(options.redirect, 'error')
    return new Response(programHtml(programEvent))
  })
  assert.deepEqual(item.images, [programEvent.image])
  assert.equal(item.description, '官方簡介')
  assert.equal(item.image_source_name, 'OPENTIX 官方活動頁')
  await enrichCulturePrograms(sources, async () => { throw new Error('timeout') })
  assert.deepEqual(item.images, [programEvent.image])
  assert.equal(sources[0].warnings.length, 1)
})
