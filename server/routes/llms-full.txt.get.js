import { pool } from '../utils/db.js'
import { couponPool } from '../utils/coupon-db.js'
import { taipeiDate } from '../../utils/activity-seo.js'

const siteUrl = 'https://yilanpass.com'
// Markdown 連結文字不能含方括號或換行
const linkText = (value) =>
  String(value || '')
    .replace(/[[\]\r\n]+/g, ' ')
    .trim()

async function section(title, load) {
  try {
    const lines = await load()
    return lines.length ? `## ${title}\n\n${lines.join('\n')}\n` : ''
  } catch (error) {
    console.error(`llms-full.txt：讀取${title}失敗`, error)
    return ''
  }
}

export default defineEventHandler(async (event) => {
  setHeader(event, 'Content-Type', 'text/markdown; charset=utf-8')
  setHeader(event, 'Cache-Control', 'public, max-age=3600, s-maxage=3600')

  const homestays = await section('宜蘭合法民宿', async () => {
    const { rows } = await pool.query(`
      SELECT id, name, city, location
      FROM homestays
      WHERE status = 'approved' AND available = true
      ORDER BY city, name
    `)
    return rows.map((row) => {
      const area = [row.city, row.location].filter(Boolean).join(' ')
      return `- [${linkText(row.name)}](${siteUrl}/homestays/${encodeURIComponent(row.id)})${
        area ? `：${linkText(area)}` : ''
      }`
    })
  })

  const coupons = await section('宜蘭店家優惠券', async () => {
    const { rows } = await couponPool.query(`
      SELECT id, title, township
      FROM "article"
      WHERE "archived_at" IS NULL
      ORDER BY id DESC
    `)
    return rows.map((row) => {
      const town = Array.isArray(row.township) ? row.township[0] : row.township
      return `- [${linkText(row.title)}](${siteUrl}/articles/${encodeURIComponent(row.id)})${
        town ? `：宜蘭${linkText(town)}` : ''
      }`
    })
  })

  const activities = await section('宜蘭活動', async () => {
    const { rows } = await pool.query(`
      SELECT id, title, event_date, end_date, location
      FROM yilan_activities
      WHERE status = 'approved'
      ORDER BY event_date DESC
    `)
    return rows.map((row) => {
      const start = taipeiDate(row.event_date)
      const end = taipeiDate(row.end_date)
      const when = end && end !== start ? `${start} 至 ${end}` : start
      const detail = [when, linkText(row.location)].filter(Boolean).join('，')
      return `- [${linkText(row.title)}](${siteUrl}/yilan-activities/${encodeURIComponent(
        row.id
      )})${detail ? `：${detail}` : ''}`
    })
  })

  return `# 宜蘭旅遊通（完整清單）

> 宜蘭旅遊通由宜蘭觀光民宿行銷協會發起，提供宜蘭在地店家的免費電子優惠券、合法民宿推薦與宜蘭活動資訊。本檔列出全站民宿、優惠券與活動頁面；網站簡介見 [llms.txt](${siteUrl}/llms.txt)。

${[homestays, coupons, activities].filter(Boolean).join('\n')}`
})
