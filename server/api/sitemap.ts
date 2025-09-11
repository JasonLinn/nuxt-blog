import { pool } from '../utils/db.js'

export default defineEventHandler(async (event) => {
  // 設定正確的響應標頭
  setHeader(event, 'Content-Type', 'application/xml; charset=utf-8')
  setHeader(event, 'Cache-Control', 'max-age=3600') // 緩存1小時
  
  let sitemapContent = ''
  let homestayCount = 0
  let placeCount = 0
  
  try {
    // XML 開頭
    sitemapContent = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`
    
    // 主要頁面
    const mainPages = [
      { loc: '/', priority: 1.0, changefreq: 'daily' },
      { loc: '/homestay-list', priority: 0.9, changefreq: 'daily' },
      { loc: '/about', priority: 0.7, changefreq: 'weekly' },
      { loc: '/rule', priority: 0.6, changefreq: 'monthly' },
      { loc: '/relative', priority: 0.7, changefreq: 'weekly' },
      { loc: '/findRoom', priority: 0.8, changefreq: 'daily' },
      { loc: '/itinerary', priority: 0.8, changefreq: 'daily' }
    ]
    
    mainPages.forEach(page => {
      sitemapContent += `
  <url>
    <loc>https://yilanpass.com${page.loc}</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>`
    })
    
    // 獲取民宿頁面
    try {
      const client = await pool.connect()
      try {
        const homestaysResult = await client.query(`
          SELECT id, updated_at 
          FROM homestays 
          WHERE status = 'approved'
          ORDER BY updated_at DESC
        `)
        
        homestayCount = homestaysResult.rows.length
        
        homestaysResult.rows.forEach((homestay: any) => {
          const lastmod = homestay.updated_at 
            ? new Date(homestay.updated_at).toISOString()
            : new Date().toISOString()
            
          sitemapContent += `
  <url>
    <loc>https://yilanpass.com/homestays/${homestay.id}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`
        })
      } finally {
        client.release()
      }
    } catch (dbError) {
      console.error('❌ 民宿資料庫錯誤:', dbError)
    }
    
    // 獲取地點頁面
    try {
      const client = await pool.connect()
      try {
        const placesResult = await client.query(`
          SELECT id, updated_at 
          FROM places 
          WHERE status = 'active'
          ORDER BY updated_at DESC
        `)
        
        placeCount = placesResult.rows.length
        
        placesResult.rows.forEach((place: any) => {
          const lastmod = place.updated_at 
            ? new Date(place.updated_at).toISOString()
            : new Date().toISOString()
            
          sitemapContent += `
  <url>
    <loc>https://yilanpass.com/relative/${place.id}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>`
        })
      } finally {
        client.release()
      }
    } catch (dbError) {
      console.error('❌ 地點資料庫錯誤:', dbError)
    }
    
    // XML 結尾
    sitemapContent += `
</urlset>`
    
    const totalPages = mainPages.length + homestayCount + placeCount
    console.log(`📄 Sitemap 生成成功: ${totalPages} 個頁面 (${homestayCount} 個民宿, ${placeCount} 個地點)`)
    
    return sitemapContent
    
  } catch (error) {
    console.error('❌ Sitemap 生成錯誤:', error)
    
    // 錯誤時返回最基本的 sitemap
    return `<?xml version="1.0" encoding="UTF-8"?>
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
  }
})
