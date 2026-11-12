import assert from 'node:assert/strict'
import { mkdir, writeFile } from 'node:fs/promises'
import { pathToFileURL } from 'node:url'
import jwt from 'jsonwebtoken'
import { pool } from '../server/utils/db.js'
const base = process.env.ASSOCIATION_VERIFY_ORIGIN || 'http://127.0.0.1:3213'
assert.ok(['http://127.0.0.1:3213', 'https://yilanpass.com'].includes(base))
const production = base.startsWith('https:')
const out = 'docs/evidence/association-import-20261113'
await mkdir(out, { recursive: true })
const { chromium } = await import(
  process.env.PLAYWRIGHT_MODULE ? pathToFileURL(process.env.PLAYWRIGHT_MODULE).href : 'playwright'
)
const browser = await chromium.launch({ headless: true })
const fingerprint = async () =>
  (
    await pool.query(
      "SELECT count(*)::int AS count,md5(string_agg((to_jsonb(h)-'view_count')::text,'|' ORDER BY id)) AS digest FROM homestays h"
    )
  ).rows[0]
const json = async (path, options = {}) => {
  const response = await fetch(base + path, options)
  assert.equal(response.status, 200, `${path} HTTP status`)
  return response.json()
}
try {
  const before = await fingerprint()
  const expected = (await pool.query('SELECT id,name,website FROM public_homestays ORDER BY id'))
    .rows
  const imported = expected.filter((row) => row.id.startsWith('ythma_'))
  assert.ok(imported.length >= 34)
  const list = await json('/api/fetchBnbs?limit=100&sort_by=name')
  assert.equal(list.success, true)
  assert.equal(list.total_count, expected.length)
  assert.equal(new Set(list.homestays.map((row) => row.id)).size, expected.length)
  assert.deepEqual(list.homestays.map((row) => row.id).sort(), expected.map((row) => row.id).sort())
  assert.doesNotMatch(JSON.stringify(list), /"(?:email|owner_name|password_hash)"/)
  const example = imported[0]
  const detail = await json(`/api/fetchBnbDetail?id=${encodeURIComponent(example.id)}`)
  assert.equal(detail.bnb.contact.website, example.website)
  assert.equal(detail.bnb.rating, null)
  assert.ok(Object.values(detail.bnb.prices).every((value) => value === null))
  const stats = await json('/api/site-stats')
  assert.equal(stats.partnerHotels, expected.length)
  const map = await json('/api/homestay-map-data?limit=100')
  assert.equal(map.success, true)
  assert.ok(map.data.items.every((item) => !item.id.startsWith('ythma_')))
  const sitemap = await (await fetch(base + '/sitemap.xml')).text()
  const llms = await (await fetch(base + '/llms-full.txt')).text()
  for (const row of imported) {
    assert.ok(sitemap.includes(`/homestays/${row.id}</loc>`))
    assert.ok(llms.includes(`/homestays/${row.id})`))
  }
  const itemLlms = await (await fetch(base + `/homestays/${example.id}/llms.txt`)).text()
  assert.ok(itemLlms.includes(example.website))
  const start = new Date(Date.now() + 2 * 86400000).toISOString().slice(0, 10),
    end = new Date(Date.now() + 3 * 86400000).toISOString().slice(0, 10)
  const availability = await json(
    `/api/search-available-homestays?checkIn=${start}&checkOut=${end}`
  )
  assert.equal(availability.success, true, 'Availability search must still execute')
  assert.ok(
    !JSON.stringify(availability).includes('ythma_'),
    'Source-only listings have no bookable inventory'
  )
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } })
  await context.route(
    /https:\/\/(?:[^/]+\.)?(?:googletagmanager|google-analytics)\.com\//,
    (route) => route.abort()
  )
  const page = await context.newPage()
  const errors = []
  page.on('pageerror', (error) => errors.push(error.message))
  const response = await page.goto(base + `/homestays/${example.id}`, {
    waitUntil: 'domcontentloaded'
  })
  assert.equal(response.status(), 200)
  await page.getByRole('heading', { name: example.name, exact: true }).waitFor()
  assert.equal(
    await page
      .getByRole('link', { name: /前往官網/ })
      .first()
      .getAttribute('href'),
    example.website
  )
  assert.equal(
    await page.locator('link[rel=canonical]').getAttribute('href'),
    `https://yilanpass.com/homestays/${example.id}`
  )
  await page.screenshot({
    path: `${out}/${production ? 'production' : 'local'}-desktop.png`,
    fullPage: false
  })
  await page.setViewportSize({ width: 375, height: 900 })
  await page.screenshot({
    path: `${out}/${production ? 'production' : 'local'}-mobile.png`,
    fullPage: false
  })
  assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth))
  await page.goto(base + '/homestay-list', { waitUntil: 'domcontentloaded' })
  await page.getByRole('heading', { name: /民宿/ }).first().waitFor()
  assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth))
  const token = jwt.sign(
    { data: { type: 'admin', username: 'release-verification' } },
    process.env.ADMIN_JWT_SECRET,
    { expiresIn: '5m' }
  )
  const statusResponse = await fetch(base + '/api/admin/association-sync/status', {
    headers: { cookie: `admin_access_token=${token}` }
  })
  const adminStatus = statusResponse.status === 200 ? await statusResponse.json() : null
  if (!production) {
    assert.equal(statusResponse.status, 200)
    assert.equal(adminStatus.can_import, true)
    await context.addCookies([
      { name: 'admin_access_token', value: token, url: base, httpOnly: true, sameSite: 'Lax' }
    ])
    await page.setViewportSize({ width: 1440, height: 1000 })
    await page.goto(base + '/admin/association-sync', { waitUntil: 'domcontentloaded' })
    await page.getByRole('button', { name: '產生同步預覽', exact: true }).click()
    const responsePromise = page.waitForResponse((response) =>
      response.url().endsWith('/api/admin/association-sync/run')
    )
    await page.getByRole('button', { name: '匯入符合條件的會員', exact: true }).click()
    const run = await responsePromise
    assert.equal(run.status(), 200)
    const applied = await run.json()
    assert.equal(applied.summary.inserted, 0)
    assert.equal(applied.summary.unchanged, 34)
    assert.equal(applied.summary.held, 49)
    await page
      .getByText('新增 0 筆、更新 0 筆、未變 34 筆、保留待確認 49 筆。', { exact: true })
      .waitFor()
    await page.screenshot({ path: `${out}/local-admin.png`, fullPage: false })
  }
  const anonymous = await fetch(base + '/api/admin/association-sync/run', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ apply: true })
  })
  assert.equal(anonymous.status, 401)
  const cron = await fetch(base + '/api/cron/association-sync')
  assert.equal(cron.status, 401)
  assert.deepEqual(errors, [])
  const after = await fingerprint()
  assert.deepEqual(after, before)
  const evidence = {
    checked_at: new Date().toISOString(),
    origin: base,
    public_count: expected.length,
    imported_count: imported.length,
    example_url: `${base}/homestays/${example.id}`,
    checks: {
      unique_list: true,
      detail: true,
      official_link: true,
      unprovided_facts_absent: true,
      sitemap: true,
      llms: true,
      map_no_invented_coordinates: true,
      no_invented_availability: true,
      statistics: true,
      desktop_mobile: true,
      anonymous_import: anonymous.status,
      unauthorized_cron: cron.status,
      admin_status: statusResponse.status,
      admin_import_enabled: adminStatus?.can_import || false,
      page_errors: errors
    },
    accounts_before: before,
    accounts_after: after,
    accounts_unchanged: true
  }
  await writeFile(
    `${out}/${production ? 'production' : 'local'}-verification.json`,
    JSON.stringify(evidence, null, 2) + '\n'
  )
  console.log(JSON.stringify(evidence, null, 2))
} finally {
  await browser.close()
  await pool.end()
}
