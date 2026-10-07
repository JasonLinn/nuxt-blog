import { pool } from '../utils/db.js'

// XML 轉義函數
function escapeXml(unsafe: string): string {
  if (!unsafe) return ''
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

export default defineEventHandler(async (event) => {
  try {
    // 設定正確的 Content-Type
    setHeader(event, 'Content-Type', 'application/xml; charset=utf-8')
    setHeader(event, 'Cache-Control', 'public, max-age=3600, s-maxage=3600') // 快取一小時

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
      // 設定客戶端編碼為 UTF-8
      await client.query('SET CLIENT_ENCODING TO UTF8');
      
      // 取得民宿資料（包含圖片和詳細資訊）
      const homestaysResult = await client.query(`
        SELECT 
          id, 
          name,
          image_url,
          updated_at 
        FROM homestays 
        WHERE status = 'approved' AND available = true
        ORDER BY updated_at DESC
      `)
      console.log(`✅ Sitemap: 已加入 ${homestaysResult.rows.length} 個民宿頁面`)
      
      for (const homestay of homestaysResult.rows) {
        const lastmod = homestay.updated_at 
          ? new Date(homestay.updated_at).toISOString() 
          : now
        
        // 基本 URL
        let urlEntry = `
  <url>
    <loc>${baseUrl}/homestays/${homestay.id}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>`
        
        // 如果有圖片，加入圖片資訊（Google Image Search）
        if (homestay.image_url) {
          const imageUrl = homestay.image_url.startsWith('http') 
            ? homestay.image_url 
            : `${baseUrl}${homestay.image_url}`
          
          urlEntry += `
    <image:image>
      <image:loc>${escapeXml(imageUrl)}</image:loc>
      <image:title>${escapeXml(homestay.name || '宜蘭民宿')}</image:title>
      <image:caption>${escapeXml(homestay.name || '宜蘭民宿')} - 宜蘭旅遊通推薦民宿</image:caption>
    </image:image>`
        }
        
        urlEntry += `
  </url>`
        
        urls.push(urlEntry)
      }

      // 取得地點資料
      const placesResult = await client.query(`
        SELECT id, updated_at 
        FROM places 
        WHERE status = 'active'
        ORDER BY updated_at DESC
      `)
      console.log(`✅ Sitemap: 已加入 ${placesResult.rows.length} 個地點頁面`)
      placesResult.rows.forEach((place: any) => {
        const lastmod = place.updated_at 
          ? new Date(place.updated_at).toISOString() 
          : now
        urls.push(`
  <url>
    <loc>${baseUrl}/relative/${place.id}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>`)
      })

      // 取得宜蘭活動資料
      try {
        const activitiesResult = await client.query(`
          SELECT id, updated_at 
          FROM yilan_activities 
          WHERE status = 'approved'
          ORDER BY updated_at DESC
        `)
        console.log(`✅ Sitemap: 已加入 ${activitiesResult.rows.length} 個活動頁面`)
        activitiesResult.rows.forEach((activity: any) => {
          const lastmod = activity.updated_at 
            ? new Date(activity.updated_at).toISOString() 
            : now
          urls.push(`
  <url>
    <loc>${baseUrl}/yilan-activities/${activity.id}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`)
        })
      } catch (activitiesError) {
        console.log('ℹ️ Sitemap: 沒有活動資料或表不存在')
      }
      
      // 取得文章資料（如果有的話）
      try {
        const articlesResult = await client.query(`
          SELECT id, updated_at 
          FROM articles 
          WHERE status = 'published'
          ORDER BY updated_at DESC
        `)
        console.log(`✅ Sitemap: 已加入 ${articlesResult.rows.length} 個文章頁面`)
        articlesResult.rows.forEach((article: any) => {
          const lastmod = article.updated_at 
            ? new Date(article.updated_at).toISOString() 
            : now
          urls.push(`
  <url>
    <loc>${baseUrl}/articles/${article.id}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
  </url>`)
        })
      } catch (articlesError) {
        // 如果沒有 articles 表，繼續執行
        console.log('ℹ️ Sitemap: 沒有文章資料或表不存在')
      }
      
    } catch (dbError) {
      console.error('❌ Sitemap 資料庫查詢錯誤:', dbError)
      // 即使資料庫查詢失敗，仍然回傳包含主要頁面的 sitemap
    } finally {
      client.release()
    }
    
    const totalPages = urls.length
    console.log(`📄 Sitemap 總共包含 ${totalPages} 個 URL`)
    
    // 生成 XML sitemap
    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"
        xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
        xsi:schemaLocation="http://www.sitemaps.org/schemas/sitemap/0.9
                           http://www.sitemaps.org/schemas/sitemap/0.9/sitemap.xsd">
${urls.join('')}
</urlset>`
    
    return sitemap
    
  } catch (error) {
    console.error('❌ 生成 sitemap 時發生嚴重錯誤:', error)
    
    // 返回一個完整、有效的基本 sitemap 作為備援
    const now = new Date().toISOString()
    const basicSitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://yilanpass.com/</loc>
    <lastmod>${now}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>https://yilanpass.com/homestay-list</loc>
    <lastmod>${now}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
  </url>
</urlset>`
    return basicSitemap
  }
})
