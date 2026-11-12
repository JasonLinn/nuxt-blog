import assert from 'node:assert/strict'
import { mkdir, writeFile } from 'node:fs/promises'
import { pathToFileURL } from 'node:url'
import jwt from 'jsonwebtoken'
import { pool } from '../server/utils/db.js'
import { normalizeAssociationSnapshot } from '../server/services/association-source.js'
import { buildAssociationPreview } from '../server/services/association-preview.js'

const base = process.env.ASSOCIATION_PREVIEW_ORIGIN || 'http://127.0.0.1:3213'
assert.equal(new URL(base).hostname, '127.0.0.1')
const { chromium } = await import(
  process.env.PLAYWRIGHT_MODULE ? pathToFileURL(process.env.PLAYWRIGHT_MODULE).href : 'playwright'
)
const browser = await chromium.launch({ headless: true })
const out = 'docs/evidence/association-links-20261113'
await mkdir(out, { recursive: true })
const fingerprint = async () =>
  (
    await pool.query(`SELECT (SELECT count(*)::int FROM association_member_links) AS links,
  (SELECT count(*)::int FROM association_member_link_events) AS events,
  count(*)::int AS homestays, md5(string_agg(row_to_json(h)::text,'|' ORDER BY id)) AS digest FROM homestays h`)
  ).rows[0]
const token = jwt.sign(
  { data: { type: 'admin', username: 'local-link-verification' } },
  process.env.ADMIN_JWT_SECRET,
  { expiresIn: '10m' }
)
try {
  const before = await fingerprint()
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } })
  await context.addCookies([
    { name: 'admin_access_token', value: token, url: base, httpOnly: true, sameSite: 'Lax' }
  ])
  await context.route(
    /https:\/\/(?:[^/]+\.)?(?:googletagmanager|google-analytics)\.com\//,
    (route) => route.abort()
  )
  const live = await context.request.get(`${base}/api/admin/association-sync/reviews`)
  assert.equal(live.status(), 200)
  const liveReviews = await live.json()
  assert.equal(liveReviews.can_import, false)
  assert.ok(liveReviews.summary.total > 0)
  assert.ok(liveReviews.items.every((item) => !item.needs_refresh))
  assert.doesNotMatch(JSON.stringify(liveReviews), /"(?:email|owner_name|password_hash)"/)
  const now = new Date().toISOString()
  const rows = Array.from({ length: 7 }, (_, i) => ({
    id: `demo_${i}`,
    name: `示範對照民宿 ${i + 1}`,
    area: '冬山鄉',
    phone: '',
    line_url: '',
    website: `https://demo${i}.example.com`,
    photos: [],
    updated_at: now
  }))
  const fixture = buildAssociationPreview(
    normalizeAssociationSnapshot({ ok: true, count: rows.length, generated_at: now, data: rows }),
    [
      {
        id: '001',
        name: rows[0].name,
        location: '冬山鄉',
        website: 'https://different.example.com',
        phone: '039500001',
        status: 'approved',
        available: true
      },
      {
        id: '002',
        name: rows[1].name,
        location: '冬山鄉',
        website: rows[1].website,
        status: 'approved',
        available: true
      }
    ]
  )
  const items = fixture.items.map((item) => ({
    ...item,
    revision: 1,
    present_in_source: true,
    needs_refresh: false,
    confirmed_homestay_id: null
  }))
  items[6].present_in_source = false
  const response = () => ({
    success: true,
    can_import: false,
    items,
    summary: {
      total: items.length,
      linked: items.filter((i) => i.confirmed_homestay_id).length,
      pending: items.filter((i) => !i.confirmed_homestay_id).length,
      absent: 1
    }
  })
  let stages = 0,
    links = 0
  await context.route('**/api/admin/association-sync/reviews', (route) =>
    route.fulfill({ json: response() })
  )
  await context.route('**/api/admin/association-sync/stage', (route) => {
    stages++
    return route.fulfill({ json: { success: true, staged: 7 } })
  })
  await context.route('**/api/admin/association-sync/link', (route) => {
    links++
    const body = route.request().postDataJSON()
    if (body.external_id === 'demo_1')
      return route.fulfill({
        status: 409,
        json: { data: { message: '來源或既有會員資料已變動，請更新候選清單後再確認。' } }
      })
    assert.deepEqual(body, {
      external_id: 'demo_0',
      homestay_id: '001',
      revision: 1,
      note: '已人工核對電話與官網'
    })
    items[0].confirmed_homestay_id = '001'
    return route.fulfill({ json: { success: true, homestay_id: '001' } })
  })
  const page = await context.newPage()
  const errors = []
  page.on('pageerror', (error) => errors.push(error.message))
  const open = async () => {
    await page.goto(`${base}/admin/association-sync`, { waitUntil: 'domcontentloaded' })
    await page.getByText('會員 ID 對照與待確認清單', { exact: true }).click()
    await page.getByRole('button', { name: '更新待確認清單', exact: true }).waitFor()
  }
  await open()
  const section = page.getByRole('region', { name: '會員 ID 對照', exact: true })
  assert.equal(await section.locator('tbody tr').count(), 5)
  const button = page.getByRole('button', { name: '示範對照民宿 1：確認此對照', exact: true })
  assert.equal(await button.isDisabled(), true)
  await page.getByLabel('示範對照民宿 1對照民宿', { exact: true }).selectOption('001')
  assert.equal(await button.isDisabled(), true)
  await section.locator('#ack-demo_0').check()
  await button.click()
  assert.equal(links, 0, 'Empty evidence must not submit an ambiguous match')
  await page.getByLabel('示範對照民宿 1確認依據', { exact: true }).fill('已人工核對電話與官網')
  await button.click()
  await page.getByText('已保存固定對照 #001；會員公開資料未變更。', { exact: true }).waitFor()
  assert.equal(links, 1)
  await open()
  await page.getByLabel('保存狀態', { exact: true }).selectOption('linked')
  await page.getByText('固定對照：#001', { exact: false }).waitFor()
  assert.equal(await section.locator('form').count(), 0)
  await page.getByLabel('保存狀態', { exact: true }).selectOption('pending')
  await page.getByLabel('搜尋已保存會員', { exact: true }).fill('demo_1')
  await page.getByLabel('示範對照民宿 2對照民宿', { exact: true }).selectOption('002')
  await section.locator('#ack-demo_1').check()
  await page.getByRole('button', { name: '示範對照民宿 2：確認此對照', exact: true }).click()
  await page.getByRole('alert').filter({ hasText: '來源或既有會員資料已變動' }).waitFor()
  assert.equal(items[1].confirmed_homestay_id, null)
  await page.getByRole('button', { name: '更新待確認清單', exact: true }).click()
  await page.getByText('已保存 7 筆候選；沒有自動確認配對或匯入會員。', { exact: true }).waitFor()
  assert.equal(stages, 1)
  await page.getByLabel('搜尋已保存會員', { exact: true }).fill('')
  await page.getByRole('button', { name: '後一頁待確認', exact: true }).click()
  assert.equal(await section.locator('tbody tr').count(), 1)
  await page.getByLabel('保存狀態', { exact: true }).selectOption('absent')
  await page.getByText('本次名單未出現，保留對照與待確認記錄。', { exact: true }).waitFor()
  assert.equal(await section.locator('form').count(), 0)
  await page.getByLabel('保存狀態', { exact: true }).selectOption('all')
  await page.screenshot({ path: `${out}/desktop.png`, fullPage: false })
  await page.setViewportSize({ width: 375, height: 900 })
  await section.locator('tbody tr').first().scrollIntoViewIfNeeded()
  await page.screenshot({ path: `${out}/mobile.png`, fullPage: false })
  assert.equal(
    await section
      .locator('tbody td')
      .first()
      .evaluate((node) => getComputedStyle(node).display),
    'block'
  )
  assert.ok(
    (await section.locator('.review-form').first().boundingBox()).width >= 250,
    'Mobile confirmation form must remain readable'
  )
  await section.locator('.review-form').first().scrollIntoViewIfNeeded()
  await page.screenshot({ path: `${out}/mobile-form.png`, fullPage: false })
  assert.ok(
    await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
    'Mobile horizontal overflow'
  )
  assert.deepEqual(errors, [])
  const after = await fingerprint()
  assert.deepEqual(after, before)
  const evidence = {
    checked_at: new Date().toISOString(),
    live_reviews: liveReviews.summary,
    live_stale_reviews: 0,
    synthetic_browser_writes: true,
    checks: [
      'manual selection and acknowledgement',
      'ambiguous evidence required',
      'confirmation persists across reload',
      'saved ID shown without reconfirmation',
      'stale confirmation fails visibly',
      'stage saves without importing',
      'search filters and pagination',
      'absent records retained',
      'desktop and mobile without overflow or page errors'
    ],
    before,
    after,
    database_unchanged: true
  }
  await writeFile(`${out}/browser.json`, JSON.stringify(evidence, null, 2) + '\n')
  console.log(JSON.stringify(evidence, null, 2))
} finally {
  await browser.close()
  await pool.end()
}
