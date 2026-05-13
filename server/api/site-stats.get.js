import { couponPool } from '../utils/coupon-db.js'
import { pool as homestayPool } from '../utils/db.js'

// 後備值（DB 異常時使用，回 0 讓 UI 維持預設）
const FALLBACK = {
  pageview: 0,
  partnerStores: 0,
  partnerHotels: 0,
}

// 單一查詢的 timeout（ms），避免 DB hang 拖垮 server worker
const QUERY_TIMEOUT_MS = 3000

// Promise.race + clearTimeout，避免 serverless 環境延遲 event loop 結束
const withTimeout = (promise, ms, label) => {
  let timer
  const timeout = new Promise((_, reject) => {
    timer = setTimeout(
      () => reject(new Error(`${label} timeout after ${ms}ms`)),
      ms
    )
  })
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer))
}

// 解析查詢結果：fulfilled 且為合法非負數字才接受；其餘 fallback
// 注意：用 Number.isFinite 而非 `|| fallback`，避免真實 COUNT = 0 被誤判
const parseCount = (settled, fallback) => {
  if (settled.status !== 'fulfilled') return fallback
  const raw = settled.value?.rows?.[0]?.c ?? settled.value?.rows?.[0]?.count
  const n = Number(raw)
  return Number.isFinite(n) && n >= 0 ? n : fallback
}

export default defineEventHandler(async (event) => {
  // 不快取：pageview 為即時遞增
  setResponseHeader(event, 'Cache-Control', 'no-store')

  const [pvRes, storesRes, hotelsRes] = await Promise.allSettled([
    withTimeout(
      couponPool.query('SELECT count AS c FROM site_pageview WHERE id = 1'),
      QUERY_TIMEOUT_MS,
      'pageview'
    ),
    withTimeout(
      couponPool.query('SELECT COUNT(*)::int AS c FROM "article"'),
      QUERY_TIMEOUT_MS,
      'partner_stores'
    ),
    withTimeout(
      homestayPool.query(
        `SELECT COUNT(*)::int AS c FROM homestays WHERE status = 'approved'`
      ),
      QUERY_TIMEOUT_MS,
      'partner_hotels'
    ),
  ])

  if (pvRes.status === 'rejected') {
    console.error('pageview 查詢失敗:', pvRes.reason?.message)
  }
  if (storesRes.status === 'rejected') {
    console.error('partner_stores 查詢失敗:', storesRes.reason?.message)
  }
  if (hotelsRes.status === 'rejected') {
    console.error('partner_hotels 查詢失敗:', hotelsRes.reason?.message)
  }

  return {
    pageview: parseCount(pvRes, FALLBACK.pageview),
    partnerStores: parseCount(storesRes, FALLBACK.partnerStores),
    partnerHotels: parseCount(hotelsRes, FALLBACK.partnerHotels),
  }
})
