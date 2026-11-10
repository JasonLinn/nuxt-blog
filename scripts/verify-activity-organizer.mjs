import assert from 'node:assert/strict'
import { mkdir, writeFile } from 'node:fs/promises'
import { buildActivityOrganizer } from '../utils/activity-organizers.js'

const baseline = process.argv.includes('--baseline')
const site = 'https://yilanpass.com'
const rows = new Map()
for (const dateFilter of ['upcoming', 'past']) {
  const response = await fetch(`${site}/api/yilan-activities?dateFilter=${dateFilter}`)
  assert.equal(response.status, 200)
  const data = await response.json()
  assert.equal(data.success, true)
  assert.equal(data.data.length, data.total)
  for (const row of data.data) rows.set(String(row.id), row)
}
const sitemap = await (await fetch(`${site}/sitemap.xml`)).text()
const sitemapIds = [...sitemap.matchAll(/<loc>https:\/\/yilanpass.com\/yilan-activities\/(\d+)<\/loc>/g)]
  .map(match => match[1])
for (const id of sitemapIds) {
  if (rows.has(id)) continue
  const response = await fetch(`${site}/api/yilan-activities/${id}`)
  assert.equal(response.status, 200)
  const data = await response.json()
  assert.equal(data.success, true)
  rows.set(id, data.data)
}
assert.ok(rows.size > 0)
const pages = []
for (const row of rows.values()) {
  const url = `${site}/yilan-activities/${row.id}`
  const response = await fetch(url)
  const html = await response.text()
  const schemas = [...html.matchAll(/<script\b[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g)]
    .map(match => JSON.parse(match[1]))
  const events = schemas.filter(schema => schema['@type'] === 'Event')
  const event = events[0]
  const expected = buildActivityOrganizer(row.organizer_name)
  const body = html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/g, '')
  const linked = expected ? body.includes(`href="${expected.url}"`) : false
  const result = { id: row.id, url, status: response.status, eventCount: events.length,
    organizerName: row.organizer_name || null, organizer: event?.organizer || null,
    verifiedOrganizer: Boolean(expected), linked }
  pages.push(result)
  if (!baseline) {
    assert.equal(response.status, 200, url)
    assert.equal(events.length, 1, url)
    assert.equal(event.name, row.title, url)
    assert.equal(event.url, url)
    assert.deepEqual(event.organizer, expected, url)
    if (expected) assert.ok(linked, `Missing visible organizer link: ${url}`)
    if (row.organizer_name?.trim()) assert.ok(body.includes(row.organizer_name.trim()), `Missing visible host: ${url}`)
  }
}
const report = { checkedAt: new Date().toISOString(), baseline, sitemapActivityCount: sitemapIds.length,
  checkedPages: pages.length, namedOrganizers: pages.filter(page => page.organizerName).length,
  verifiedOrganizers: pages.filter(page => page.verifiedOrganizer).length,
  unverifiedOrganizers: pages.filter(page => page.organizerName && !page.verifiedOrganizer).length,
  missingOrganizerUrls: pages.filter(page => page.organizer && !page.organizer.url).length, pages }
const directory = 'docs/evidence/activity-organizer-20261110'
await mkdir(directory, { recursive: true })
await writeFile(`${directory}/${baseline ? 'before' : 'production'}.json`, JSON.stringify(report, null, 2) + '\n')
console.log(JSON.stringify({ ...report, pages: undefined }))
