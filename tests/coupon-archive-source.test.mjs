import { access, readFile } from 'node:fs/promises'
import assert from 'node:assert/strict'
import test from 'node:test'

const source = (path) => readFile(new URL(`../${path}`, import.meta.url), 'utf8')

test('public coupon list filters archived coupons', async () => {
  const articlesApi = await source('server/api/articles.get.js')

  assert.match(articlesApi, /archived_at"?\s+IS\s+NULL/i)
})

test('public coupon detail rejects archived coupons', async () => {
  const detailApi = await source('server/api/articles/[id].get.js')

  assert.match(detailApi, /archived_at"?\s+IS\s+NULL/i)
})

test('public secondary coupon surfaces filter archived coupons', async () => {
  const [hotTagsApi, webhookApi, siteStatsApi, launchScheduleApi, viewApi] = await Promise.all([
    source('server/api/hot-tags.get.js'),
    source('server/api/webhook.post.js'),
    source('server/api/site-stats.get.js'),
    source('server/api/articles/launch-schedule.get.js'),
    source('server/api/articles/view/[id].post.js')
  ])

  assert.match(hotTagsApi, /archived_at"?\s+IS\s+NULL/i)
  assert.match(webhookApi, /archived_at"?\s+IS\s+NULL/i)
  assert.match(siteStatsApi, /archived_at"?\s+IS\s+NULL/i)
  assert.match(launchScheduleApi, /archived_at"?\s+IS\s+NULL/i)
  assert.match(viewApi, /archived_at"?\s+IS\s+NULL/i)
})

test('admin archive endpoints preserve rows and update archived_at', async () => {
  await access(new URL('../server/api/admin/coupons/[id]/archive.post.js', import.meta.url))
  await access(new URL('../server/api/admin/coupons/[id]/restore.post.js', import.meta.url))

  const [archiveApi, restoreApi] = await Promise.all([
    source('server/api/admin/coupons/[id]/archive.post.js'),
    source('server/api/admin/coupons/[id]/restore.post.js')
  ])

  assert.match(archiveApi, /UPDATE\s+"article"\s+SET\s+"archived_at"\s*=\s*NOW\(\)/i)
  assert.doesNotMatch(archiveApi, /DELETE\s+FROM\s+"article"/i)
  assert.match(restoreApi, /UPDATE\s+"article"\s+SET\s+"archived_at"\s*=\s*NULL/i)
})

test('admin archive endpoint removes already issued coupon snapshots', async () => {
  const archiveApi = await source('server/api/admin/coupons/[id]/archive.post.js')

  assert.match(archiveApi, /UPDATE\s+"user"\s+SET\s+"coupons"/i)
  assert.match(archiveApi, /JSON\.parse/)
})

test('redemption mutations reject archived coupons', async () => {
  const [couponPatchApi, appendCouponApi, receivedApi, updateCouponApi] = await Promise.all([
    source('server/api/cupon.patch.js'),
    source('server/api/user/appendCoupon.patch.js'),
    source('server/api/received.post.js'),
    source('server/api/user/updateCoupon.patch.js')
  ])

  assert.match(couponPatchApi, /archived_at"?\s+IS\s+NULL/i)
  assert.match(appendCouponApi, /archived_at"?\s+IS\s+NULL/i)
  assert.match(receivedApi, /archived_at"?\s+IS\s+NULL/i)
  assert.match(updateCouponApi, /archived_at"?\s+IS\s+NULL/i)
})

test('user coupon reads hide archived coupons from claimed snapshots', async () => {
  const userCouponApi = await source('server/api/user/[id].get.js')

  assert.match(userCouponApi, /archived_at"?\s+IS\s+NULL/i)
  assert.match(userCouponApi, /activeCouponIds/)
})

test('admin coupons page forwards cookies during SSR data fetch', async () => {
  const adminCouponsPage = await source('pages/admin/coupons.vue')

  assert.match(adminCouponsPage, /headers:\s*useRequestHeaders\(\['cookie'\]\)/)
})

test('admin coupons page refetches when route query changes', async () => {
  const adminCouponsPage = await source('pages/admin/coupons.vue')

  assert.match(adminCouponsPage, /watch\(\(\)\s*=>\s*route\.query,\s*async[\s\S]*await fetchCoupons\(\)/)
})

test('admin coupons page exposes pagination controls', async () => {
  const adminCouponsPage = await source('pages/admin/coupons.vue')

  assert.match(adminCouponsPage, /const pagination = ref/)
  assert.match(adminCouponsPage, /page:\s*pagination\.value\.page/)
  assert.match(adminCouponsPage, /pagination\.value\s*=\s*response\.pagination/)
  assert.match(adminCouponsPage, /const changePage = async/)
  assert.match(adminCouponsPage, /pagination\.hasPrev/)
  assert.match(adminCouponsPage, /pagination\.hasNext/)
})

test('coupon detail admin action archives instead of deleting', async () => {
  const detailPage = await source('pages/articles/[id].vue')

  assert.match(detailPage, /封存/)
  assert.match(detailPage, /\/api\/admin\/coupons\/\$\{route\.params\.id\}\/archive/)
  assert.doesNotMatch(detailPage, /你確定要刪除優惠券嗎/)
})
