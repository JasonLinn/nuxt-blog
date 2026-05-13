import { couponPool } from '../utils/coupon-db.js'

// 站點瀏覽計數初始基礎值（資料列不存在時使用，僅限第一次呼叫）
const BASELINE = 21388

// 增加站點瀏覽次數 — 單一 UPSERT，避免併發 race
export default defineEventHandler(async () => {
  try {
    const result = await couponPool.query(
      `INSERT INTO site_pageview (id, count, updated_at)
       VALUES (1, $1 + 1, NOW())
       ON CONFLICT (id) DO UPDATE
         SET count = site_pageview.count + 1,
             updated_at = NOW()
       RETURNING count`,
      [BASELINE]
    )

    return {
      success: true,
      count: Number(result.rows[0].count),
    }
  } catch (error) {
    console.error('更新站點瀏覽數失敗:', error)
    return { success: false, count: null }
  }
})
