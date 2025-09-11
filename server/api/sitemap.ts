import { pool } from '../utils/db.js'

export default defineSitemapEventHandler(async () => {
  const urls: any[] = []
  
  // 主要頁面
  urls.push(
    {
      loc: '/',
      changefreq: 'daily' as const,
      priority: 1.0,
      lastmod: new Date().toISOString()
    },
    {
      loc: '/homestay-list',
      changefreq: 'daily' as const,
      priority: 0.9,
      lastmod: new Date().toISOString()
    },
    {
      loc: '/about',
      changefreq: 'weekly' as const,
      priority: 0.7,
      lastmod: new Date().toISOString()
    },
    {
      loc: '/rule',
      changefreq: 'monthly' as const,
      priority: 0.6,
      lastmod: new Date().toISOString()
    },
    {
      loc: '/relative',
      changefreq: 'weekly' as const,
      priority: 0.7,
      lastmod: new Date().toISOString()
    },
    {
      loc: '/findRoom',
      changefreq: 'daily' as const,
      priority: 0.8,
      lastmod: new Date().toISOString()
    },
    {
      loc: '/itinerary',
      changefreq: 'daily' as const,
      priority: 0.8,
      lastmod: new Date().toISOString()
    }
  )

  try {
    // 動態獲取所有合法民宿頁面
    const client = await pool.connect()
    
    try {
      // 獲取所有已審核的民宿
      const homestaysResult = await client.query(`
        SELECT id, name, updated_at, created_at, location, city
        FROM homestays 
        WHERE status = 'approved' 
        ORDER BY updated_at DESC
      `)
      
      // 為每個民宿添加 sitemap 項目
      homestaysResult.rows.forEach(homestay => {
        urls.push({
          loc: `/homestays/${homestay.id}`,
          lastmod: homestay.updated_at || homestay.created_at || new Date().toISOString(),
          changefreq: 'weekly' as const,
          priority: 0.8,
          // 為 SEO 添加額外的 meta 資訊
          meta: {
            name: homestay.name,
            location: homestay.location,
            city: homestay.city
          }
        })
      })
      
      console.log(`✅ Sitemap: 已加入 ${homestaysResult.rows.length} 個民宿頁面`)
      
      // 獲取所有已審核的地點
      const placesResult = await client.query(`
        SELECT id, name, updated_at, created_at
        FROM places 
        WHERE status = 'active'
        ORDER BY updated_at DESC
      `)
      
      // 為每個地點添加 sitemap 項目（如果有地點詳細頁面的話）
      placesResult.rows.forEach(place => {
        urls.push({
          loc: `/places/${place.id}`,
          lastmod: place.updated_at || place.created_at || new Date().toISOString(),
          changefreq: 'weekly' as const,
          priority: 0.7
        })
      })
      
      console.log(`✅ Sitemap: 已加入 ${placesResult.rows.length} 個地點頁面`)
      
    } finally {
      client.release()
    }
    
  } catch (error) {
    console.error('❌ 生成 sitemap 時發生錯誤:', error)
    // 即使資料庫查詢失敗，也要返回基本頁面
  }
  
  console.log(`📄 Sitemap 總共包含 ${urls.length} 個 URL`)
  return urls
})
