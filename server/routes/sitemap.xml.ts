import { pool } from '../utils/db.js'
import { couponPool } from '../utils/coupon-db.js'
import { toSiteImageUrl } from '../utils/site-images.js'

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
      { loc: '/itinerary', priority: '0.8', changefreq: 'daily' },
      { loc: '/yilan-activities', priority: '0.8', changefreq: 'daily' },
      { loc: '/map', priority: '0.7', changefreq: 'weekly' },
      { loc: '/coupon-services', priority: '0.7', changefreq: 'weekly' }
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
            ? toSiteImageUrl(homestay.image_url) 
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
      
      // 優惠券（/articles/:id）與特色店家（/relative_shop/:id）在優惠券資料庫
      const couponPages = [
        { table: 'article', path: 'articles', where: 'WHERE "archived_at" IS NULL', priority: '0.8', label: '優惠券' },
        { table: 'relative', path: 'relative_shop', where: '', priority: '0.6', label: '特色店家' }
      ]
      for (const page of couponPages) {
        try {
          // to_jsonb 讀時間欄位，欄位不存在時回 null 而不是讓查詢失敗
          const result = await couponPool.query(`
            SELECT id, title,
              to_jsonb(t)->>'updated_at' AS updated_at,
              to_jsonb(t)->>'created_at' AS created_at,
              to_jsonb(t)->'cover'->>0 AS cover
            FROM "${page.table}" t
            ${page.where}
            ORDER BY id DESC
          `)
          console.log(`✅ Sitemap: 已加入 ${result.rows.length} 個${page.label}頁面`)
          for (const row of result.rows) {
            const time = row.updated_at || row.created_at
            const lastmod = time && !isNaN(Date.parse(time)) ? new Date(time).toISOString() : now
            let entry = `
  <url>
    <loc>${baseUrl}/${page.path}/${encodeURIComponent(row.id)}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>${page.priority}</priority>`
            const cover = typeof row.cover === 'string' ? toSiteImageUrl(row.cover.trim()) : ''
            if (/^(https?:\/\/|\/)/.test(cover)) {
              const imageUrl = cover.startsWith('http') ? cover : `${baseUrl}${cover}`
              entry += `
    <image:image>
      <image:loc>${escapeXml(imageUrl)}</image:loc>
      <image:title>${escapeXml(row.title || page.label)}</image:title>
    </image:image>`
            }
            urls.push(`${entry}
  </url>`)
          }
        } catch (couponError) {
          console.error(`❌ Sitemap: 讀取${page.label}失敗`, couponError)
        }
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
