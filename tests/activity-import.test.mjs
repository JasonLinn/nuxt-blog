import test from 'node:test'
import assert from 'node:assert/strict'
import { activityWindow, dateOnly, overlapsActivity, taipeiToday } from '../utils/activity-dates.js'
import { normalizeCulture, normalizeYilanCalendar, collectActivities, reviewReasons, safeSourceUrl, sameEvent, possiblySameEvent, fetchSource, activitySources } from '../server/services/activity-sources.js'

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
  assert.equal(normalizeYilanCalendar(calendarHtml(2026, [{ ...yilanRow, hide_address: true }]), 2026)[0].location, '')
  assert.deepEqual(normalizeYilanCalendar(calendarHtml(2027, []), 2027), [])
  assert.throws(() => normalizeYilanCalendar(calendarHtml(2025, []), 2026), /年份/)
  assert.throws(() => normalizeYilanCalendar('<html>Request Rejected</html>', 2026), /結構/)
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
