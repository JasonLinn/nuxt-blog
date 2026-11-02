// Reviewed one-event editorial backfill. This is not a general news crawler.
// Preview by default; --apply publishes once through the existing review workflow.
import { digest, plainText, safeActivityImage } from '../server/services/activity-sources.js'
import { acquireImportLock, reviewImport } from '../server/services/activity-import.js'

const sourceUrl = 'https://travel.yilan.gov.tw/zh-tw/news/272/'
const organizerUrl = 'https://www.ctau.org.tw/news/2026-11-20-21-%E5%AE%9C%E8%98%AD%E5%86%AC%E5%B1%B1%E6%B2%B3%E8%B6%85%E7%B4%9A%E9%A6%AC%E6%8B%89%E6%9D%BE/'
async function readOfficial(url) {
  const response = await fetch(url, { redirect: 'error', signal: AbortSignal.timeout(20000) })
  if (!response.ok) throw new Error(`Official source HTTP ${response.status}`)
  return response.text()
}
const [html, organizerHtml] = await Promise.all([readOfficial(sourceUrl), readOfficial(organizerUrl)])
const match = html.match(/<script\b[^>]*\bid=["']__NEXT_DATA__["'][^>]*>([\s\S]*?)<\/script>/i)
const news = match && JSON.parse(match[1]).props?.pageProps?.data
const section = news?.description?.split('【宜蘭冬山河超級馬拉松】')[1]?.split('【跑旅關鍵')[0]
if (news?.id !== 272 || !section || !section.includes('2026年11月20日－2026年11月21日') || /取消|停辦|延期/.test(section)
  || !plainText(organizerHtml).includes('親水公園') || !plainText(organizerHtml).includes('2026.11.20-21')) {
  throw new Error('Official event evidence changed; editorial review required before publication')
}
const images = (news.images || []).filter(i => i.subject === '宜蘭冬山河超級馬拉松').map(i => safeActivityImage(i.url)).filter(Boolean)
const candidate = {
  external_id: 'news-272-ultra-2026', title: '2026 宜蘭冬山河超級馬拉松',
  event_date: '2026-11-20', end_date: '2026-11-21', location: '宜蘭縣五結鄉冬山河親水公園',
  organizer_name: '社團法人中華民國超級馬拉松運動協會', activity_type: '觀光旅遊',
  description: `冬山河超級馬拉松，活動日期為 2026 年 11 月 20 至 21 日，地點為冬山河親水公園。各組別起跑時間、賽程及異動請以主辦單位最新簡章為準。\n主辦單位公告：${organizerUrl}`,
  source_url: sourceUrl, images, image_source_name: '宜蘭勁好玩', image_source_url: sourceUrl
}
if (!process.argv.includes('--apply')) {
  console.log(JSON.stringify({ preview: true, candidate }, null, 2))
} else {
  const { pool } = await import('../server/utils/db.js')
  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    await acquireImportLock(client)
    const previous = (await client.query('SELECT state, activity_id FROM activity_import_items WHERE source_id = $1 AND external_id = $2 FOR UPDATE', ['yilan-site', candidate.external_id])).rows[0]
    if (previous) console.log(JSON.stringify({ skipped: true, ...previous }))
    else {
      await client.query(`INSERT INTO activity_import_items (source_id, external_id, source_name, candidate, content_hash, reasons, state)
        VALUES ($1,$2,$3,$4::jsonb,$5,'[]'::jsonb,'pending')`,
      ['yilan-site', candidate.external_id, '宜蘭勁好玩（官方新聞／人工核對）', JSON.stringify(candidate), digest(candidate)])
      console.log(JSON.stringify(await reviewImport(client, { source: 'yilan-site', externalId: candidate.external_id, action: 'publish' })))
    }
    await client.query('COMMIT')
  } catch (error) { await client.query('ROLLBACK'); throw error }
  finally { client.release(); await pool.end() }
}
