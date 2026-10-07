import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

const source = name => readFile(new URL(`../${name}`, import.meta.url), 'utf8')
async function makeStore(fetcher = async () => ({})) {
  const text = (await source('store/index.js')).replace(/^import .*;\r?\n/gm, '').replace('export default useStore;', 'return useStore;')
  const options = new Function('defineStore', 'fetchUser', '$fetch', text)((name, options) => options, async () => null, fetcher)
  const store = { userData: { userId: 'owner', coupons: [] }, couponData: [] }
  for (const [name, action] of Object.entries(options.actions)) store[name] = action.bind(store)
  return store
}

test('homestay editor reads enabled public feature options and keeps its expected data shape', async () => {
  const text = await source('pages/homestay-admin.vue')
  const start = text.indexOf('const loadFeatures = async')
  const code = text.slice(start, text.indexOf('const setFallbackFeatures', start))
  const data = { value: {} }
  const load = new Function('$fetch', 'featuresData', 'setFallbackFeatures', `${code}; return loadFeatures;`)(async url => {
    assert.equal(url, '/api/features-options')
    return { success: true, data: { themeFeatures: ['新主題'], serviceAmenities: ['新設施'] } }
  }, data, () => assert.fail('Normal owner flow must not fall back'))
  await load()
  assert.deepEqual(data.value, { themeFeatures: [{ name: '新主題', is_active: true }], serviceAmenities: [{ name: '新設施', is_active: true }] })
})

test('claim, refresh and redemption synchronize wallet and the membership snapshot used by once-only checks', async () => {
  const coupon = { id: 7, claimId: 'claim-7', gotTime: '2026-10-08T00:00:00Z' }
  const store = await makeStore(async () => ({ coupons: [JSON.stringify({ ...coupon, received: true })] }))
  store.recordClaim(coupon)
  store.recordClaim(coupon)
  assert.equal(store.couponData.length, 1)
  assert.equal(JSON.parse(store.userData.coupons[0]).id, 7)
  await store.getCoupons('owner')
  assert.equal(store.couponData[0].received, true)
  assert.equal(JSON.parse(store.userData.coupons[0]).received, true)
})

for (const file of ['pages/articles/[id].vue', 'components/couponInfo.vue']) {
  test(`${file}: successful claim updates once-only state; rejected claim leaves it intact and resets loading`, async () => {
    const text = await source(file)
    const start = text.indexOf('const patchUser = async')
    const code = text.slice(start, text.indexOf('const checkReferral =', start))
    const store = await makeStore()
    const loading = { value: false }
    const article = { value: { id: 7, amount: 5 } }
    let rejected = false
    const claim = new Function('$fetch', 'article', 'referralStore', 'store', 'alert', 'navigateTo', 'iconLoading', `${code}; return patchUser;`)(async () => {
      assert.equal(loading.value, true)
      if (rejected) throw new Error('409')
      return { amount: 4, coupon: { id: 7, claimId: 'claim-7' } }
    }, article, { value: null }, store, () => {}, async () => {}, loading)
    await claim()
    assert.equal(loading.value, false)
    assert.equal(JSON.parse(store.userData.coupons[0]).id, article.value.id)
    rejected = true
    await assert.rejects(claim(), /409/)
    assert.equal(loading.value, false)
    assert.equal(store.couponData.length, 1)
    assert.equal(article.value.amount, 4)
  })
}
