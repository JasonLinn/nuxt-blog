import { pool } from '../utils/db.js'

export default defineEventHandler(async (event) => {
  try {
    // 設定正確的 Content-Type
    setHeader(event, 'Content-Type', 'application/xml; charset=utf-8')
    
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
    <loc>https://yilanpass.com${page.loc}</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>`)
    })
    
    try {
      // 取得民宿資料
      const client = await pool.connect()
      const homestaysResult = await client.query(`
        SELECT id, location, city, updated_at 
        FROM homestays 
        WHERE status = 'approved'
        ORDER BY updated_at DESC
      `)
      client.release()
      
      console.log(`✅ Sitemap: 已加入 ${homestaysResult.rows.length} 個民宿頁面`)
      
      homestaysResult.rows.forEach((homestay: any) => {
        urls.push(`
  <url>
    <loc>https://yilanpass.com/homestays/${homestay.id}</loc>
    <lastmod>${homestay.updated_at ? new Date(homestay.updated_at).toISOString() : new Date().toISOString()}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`)
      })
    } catch (dbError) {
      console.error('❌ 資料庫連接錯誤:', dbError)
    }
    
    try {
      // 取得地點資料
      const client = await pool.connect()
      const placesResult = await client.query(`
        SELECT id, updated_at 
        FROM places 
        WHERE status = 'active'
        ORDER BY updated_at DESC
      `)
      client.release()
      
      console.log(`✅ Sitemap: 已加入 ${placesResult.rows.length} 個地點頁面`)
      
      placesResult.rows.forEach((place: any) => {
        urls.push(`
  <url>
    <loc>https://yilanpass.com/relative/${place.id}</loc>
    <lastmod>${place.updated_at ? new Date(place.updated_at).toISOString() : new Date().toISOString()}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>`)
      })
    } catch (dbError) {
      console.error('❌ 地點資料庫連接錯誤:', dbError)
    }
    
    const totalUrls = mainPages.length + urls.filter(url => url.includes('/homestays/')).length + urls.filter(url => url.includes('/relative/')).length
    console.log(`📄 Sitemap 總共包含 ${totalUrls} 個 URL`)
    
    // 生成 XML sitemap
    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join('')}
</urlset>`
    
    return sitemap
    
  } catch (error) {
    console.error('❌ 生成 sitemap 時發生錯誤:', error)
    
    // 返回基本的 sitemap
    const basicSitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://yilanpass.com/</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>https://yilanpass.com/homestay-list</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
  </url>
</urlset>`
    
    return basicSitemap
  }
})
