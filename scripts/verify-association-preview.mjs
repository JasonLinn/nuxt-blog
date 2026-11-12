// Local-only browser verification. Never visits or modifies production pages.
import assert from 'node:assert/strict'
import { mkdir, writeFile, readFile } from 'node:fs/promises'
import { pathToFileURL } from 'node:url'
import jwt from 'jsonwebtoken'
import { pool } from '../server/utils/db.js'
import { buildAssociationPreview } from '../server/services/association-preview.js'
import { normalizeAssociationSnapshot } from '../server/services/association-source.js'

const base = process.env.ASSOCIATION_PREVIEW_ORIGIN || 'http://127.0.0.1:3213'
assert.equal(new URL(base).hostname, '127.0.0.1', 'Verification must use a local server')
const { chromium } = await import(
  process.env.PLAYWRIGHT_MODULE ? pathToFileURL(process.env.PLAYWRIGHT_MODULE).href : 'playwright'
)
const out = 'docs/evidence/association-preview-20261113'
await mkdir(out, { recursive: true })
const token = jwt.sign(
  { data: { type: 'admin', username: 'local-preview-verification' } },
  process.env.ADMIN_JWT_SECRET,
  { expiresIn: '5m' }
)
const browser = await chromium.launch({ headless: true })
const evidence = {
  local_origin: base,
  checked_at: new Date().toISOString(),
  screenshots_use_synthetic_data: true
}
// Entire rows are hashed inside PostgreSQL and never returned to the script.
async function databaseFingerprint() {
  const client = await pool.connect()
  try {
    await client.query('BEGIN READ ONLY')
    return (
      await client.query(
        "SELECT count(*)::int AS count, md5(string_agg(row_to_json(h)::text, '|' ORDER BY id)) AS digest FROM homestays h"
      )
    ).rows[0]
  } finally {
    await client.query('ROLLBACK')
    client.release()
  }
}
try {
  evidence.database_before = await databaseFingerprint()
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } })
  await context.addCookies([
    { name: 'admin_access_token', value: token, url: base, httpOnly: true, sameSite: 'Lax' }
  ])
  await context.route(
    /https:\/\/(?:[^/]+\.)?(?:googletagmanager|google-analytics)\.com\//,
    (route) => route.abort()
  )
  const page = await context.newPage()
  const errors = []
  page.on('pageerror', (error) => errors.push(error.message))
  await page.goto(`${base}/admin/association-sync`, { waitUntil: 'domcontentloaded' })
  await page.getByRole('button', { name: '產生同步預覽', exact: true }).waitFor()
  const responsePromise = page.waitForResponse((response) =>
    response.url().endsWith('/api/admin/association-sync/preview')
  )
  await page.getByRole('button', { name: '產生同步預覽', exact: true }).click()
  const response = await responsePromise
  assert.equal(response.status(), 200)
  const live = await response.json()
  assert.equal(live.can_import, false)
  assert.equal(live.summary.writes, 0)
  assert.ok(live.summary.source_count > 0)
  assert.doesNotMatch(JSON.stringify(live), /"(?:email|owner_name|password_hash)"/)
  assert.ok(!JSON.stringify(live).includes(process.env.YTHMA_BNB_API_KEY))
  await page.getByRole('button', { name: '下載比對結果', exact: true }).waitFor()
  evidence.live_preview = {
    status: response.status(),
    generated_at: live.generated_at,
    previewed_at: live.previewed_at,
    summary: live.summary,
    unmatched_local_count: live.local_without_candidates.length,
    fingerprint: live.fingerprint
  }
  const blockedImport = await context.request.post(`${base}/api/admin/association-sync/run`, {
    data: { apply: true }
  })
  assert.equal(blockedImport.status(), 409)
  evidence.import_status = blockedImport.status()
  const anonymous = await browser.newContext()
  const denied = await anonymous.request.post(`${base}/api/admin/association-sync/preview`)
  assert.equal(denied.status(), 401)
  evidence.anonymous_status = denied.status()
  await anonymous.close()
  evidence.database_after = await databaseFingerprint()
  assert.deepEqual(evidence.database_after, evidence.database_before)
  evidence.database_unchanged = true

  const syntheticRows = Array.from({ length: 13 }, (_, index) => ({
    id: `sample_${index}`,
    name: `示範民宿 ${index + 1}`,
    area: '冬山鄉',
    phone: '',
    website: `https://demo${index}.example.com`,
    line_url: '',
    photos: [],
    updated_at: new Date().toISOString()
  }))
  const fixture = buildAssociationPreview(
    normalizeAssociationSnapshot({
      ok: true,
      count: syntheticRows.length,
      generated_at: new Date().toISOString(),
      data: syntheticRows
    }),
    [
      {
        id: '001',
        name: '示範民宿 1',
        location: '冬山鄉',
        website: 'https://demo0.example.com',
        phone: '039500001',
        images: [],
        status: 'approved',
        available: true
      }
    ]
  )
  await page.route('**/api/admin/association-sync/preview', (route) =>
    route.fulfill({ json: fixture })
  )
  await page.getByRole('button', { name: '重新預覽', exact: true }).click()
  await page.getByText('示範民宿 2', { exact: true }).waitFor()
  await page.getByText('檢視 1 項資料差異', { exact: true }).click()
  await page.getByText('目前：039500001', { exact: true }).waitFor()
  await page.getByText('空值是否清除舊資料，需另行確認', { exact: true }).waitFor()
  await page.screenshot({ path: `${out}/desktop.png`, fullPage: false })
  assert.equal(await page.locator('[data-testid=live-preview-table] tbody tr').count(), 10)
  await page.getByRole('button', { name: '下一頁', exact: true }).click()
  assert.equal(await page.locator('[data-testid=live-preview-table] tbody tr').count(), 3)
  await page.getByLabel('比對分類', { exact: true }).selectOption('match')
  assert.equal(await page.locator('[data-testid=live-preview-table] tbody tr').count(), 1)
  await page.getByLabel('比對分類', { exact: true }).selectOption('')
  await page.getByLabel('搜尋名稱或識別碼', { exact: true }).fill('no-such-homestay')
  await page.getByRole('heading', { name: '沒有符合條件的資料' }).waitFor()
  await page.getByLabel('搜尋名稱或識別碼', { exact: true }).fill('')
  const downloadPromise = page.waitForEvent('download')
  await page.getByRole('button', { name: '下載比對結果', exact: true }).click()
  const downloaded = await downloadPromise
  assert.equal(JSON.parse(await readFile(await downloaded.path(), 'utf8')).mode, 'preview_only')
  await page.setViewportSize({ width: 375, height: 900 })
  await page.screenshot({ path: `${out}/mobile.png`, fullPage: false })
  assert.ok(
    await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
    'Mobile page overflows'
  )
  await page.unroute('**/api/admin/association-sync/preview')
  await page.route('**/api/admin/association-sync/preview', (route) =>
    route.fulfill({ status: 503, json: { data: { message: '測試用來源暫時無法連線' } } })
  )
  await page.getByRole('button', { name: '重新預覽', exact: true }).click()
  await page.getByRole('heading', { name: '無法產生預覽' }).waitFor()
  assert.equal(
    await page.locator('[data-testid=live-preview-table] tbody tr').count(),
    0,
    'Failed refresh must clear old results'
  )
  await page.unroute('**/api/admin/association-sync/preview')
  await page.route('**/api/admin/association-sync/preview', (route) =>
    route.fulfill({ json: fixture })
  )
  await page.getByRole('button', { name: '重新嘗試', exact: true }).click()
  await page.getByText('示範民宿 2', { exact: true }).waitFor()
  await page.route('**/api/admin/association-sync/status', (route) =>
    route.fulfill({ json: { source_configured: false, can_import: false } })
  )
  await page.reload({ waitUntil: 'domcontentloaded' })
  await page
    .getByText('尚未完成協會資料連線設定，請由網站管理者設定後再預覽。', { exact: true })
    .waitFor()
  assert.equal(
    await page.getByRole('button', { name: '產生同步預覽', exact: true }).isDisabled(),
    true
  )
  assert.deepEqual(errors, [])
  evidence.browser = {
    desktop: '1440x1000',
    mobile: '375x900',
    pagination: true,
    search: true,
    category_filter: true,
    download: true,
    field_differences: true,
    failure_clears_stale_results: true,
    retry: true,
    unconfigured_state: true,
    page_errors: errors,
    mobile_overflow: false
  }
  await writeFile(`${out}/verification.json`, JSON.stringify(evidence, null, 2) + '\n')
  console.log(JSON.stringify(evidence, null, 2))
} finally {
  await browser.close()
  await pool.end()
}
