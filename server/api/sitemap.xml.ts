import { pool } from '../utils/db.js'

export default defineEventHandler(async (event) => {
  try {
    // 設定正確的 Content-Type
    setHeader(event, 'Content-Type', 'application/xml; charset=utf-8')
    setHeader(event, 'Cache-Control', 'max-age=3600') // 快取一小時

    const baseUrl = 'https://yilanpass.com'
    const now = new Date().toISOString()
    const urls: string[] = []

    // 主要頁面
    const mainPages = [
      { loc: '/', priority: '1.0', changefreq: 'daily' },
      { loc: '/homestay-list', priority: '0.9', changefreq: 'daily' },
      { loc: '/about', priority: '0.7', changefreq: 'weekly' },
      { loc: '/rule', priority: '0.6', changefreq: 'monthly' },
      { loc: '/relative', priority: '0.7', changefreq: 'weekly' },
      { loc: '/findRoom', priority: '0.8', changefreq: 'daily' },
      { loc: '/itinerary', priority: '0.8', changefreq: 'daily' }
    ]
    
    mainPages.forEach(page => {
      urls.push(`
  <url>
    <loc>${baseUrl}${page.loc}</loc>
    <lastmod>${now}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>`)
    })

    const client = await pool.connect()
    try {
      // 取得民宿資料
      const homestaysResult = await client.query(`
        SELECT id, updated_at 
        FROM homestays 
        WHERE status = 'approved'
        ORDER BY updated_at DESC
      `)
      console.log(`✅ Sitemap: 已加入 ${homestaysResult.rows.length} 個民宿頁面`)
      homestaysResult.rows.forEach((homestay: any) => {
        urls.push(`
  <url>
    <loc>${baseUrl}/homestays/${homestay.id}</loc>
    <lastmod>${homestay.updated_at ? new Date(homestay.updated_at).toISOString() : now}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`)
      })

      // 取得地點資料
      const placesResult = await client.query(`
        SELECT id, updated_at 
        FROM places 
        WHERE status = 'active'
        ORDER BY updated_at DESC
      `)
      console.log(`✅ Sitemap: 已加入 ${placesResult.rows.length} 個地點頁面`)
      placesResult.rows.forEach((place: any) => {
        urls.push(`
  <url>
    <loc>${baseUrl}/relative/${place.id}</loc>
    <lastmod>${place.updated_at ? new Date(place.updated_at).toISOString() : now}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>`)
      })
    } catch (dbError) {
      console.error('❌ Sitemap 資料庫查詢錯誤:', dbError)
      // 即使資料庫查詢失敗，仍然回傳包含主要頁面的 sitemap
    } finally {
      client.release()
    }
    
    console.log(`📄 Sitemap 總共包含 ${urls.length} 個 URL`)
    
    // 生成 XML sitemap
    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join('')}
</urlset>`
    
    return sitemap
    
  } catch (error) {
    console.error('❌ 生成 sitemap 時發生嚴重錯誤:', error)
    
    // 返回一個完整、有效的基本 sitemap 作為備援
    const basicSitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://yilanpass.com/</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
</urlset>`
    return basicSitemap
  }
})
