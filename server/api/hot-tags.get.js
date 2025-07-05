import pkg from 'pg'
const { Pool } = pkg

// 優惠券專用資料庫連線
const couponPool = new Pool({
  connectionString: 'postgresql://nuxt-marketing_owner:ys7ZNVhOrg9c@ep-rough-voice-a1ele0z6-pooler.ap-southeast-1.aws.neon.tech/nuxt-marketing?sslmode=require&channel_binding=require',
  ssl: {
    rejectUnauthorized: false
  }
})

export default defineEventHandler(async (event) => {
  try {
    const query = await getQuery(event)
    const limit = Math.min(parseInt(query.limit) || 3, 10)

    // 定義要分析的標籤關鍵字
    const tagKeywords = [
      '伴手禮', '租車', '湯屋', '溫泉', '美食', '住宿', 
      '體驗', '活動', '優惠', '特價', '免費', '限時',
      '餐廳', '咖啡', '甜點', '民宿', '飯店', '景點',
      '親子', '家庭', '情侶', '團體', '個人'
    ]

    // 為每個標籤計算總使用次數 (使用 used_times 代替 view_count)
    const tagPromises = tagKeywords.map(async (tag) => {
      const result = await couponPool.query(
        `SELECT COUNT(*) as article_count, SUM(COALESCE(used_times, 0)) as total_usage
         FROM "article" 
         WHERE (title ILIKE $1 OR content ILIKE $1 OR tags ILIKE $1)`,
        [`%${tag}%`]
      )
      
      return {
        tag,
        totalViews: parseInt(result.rows[0]?.total_usage || 0) + parseInt(result.rows[0]?.article_count || 0)
      }
    })

    const tagResults = await Promise.all(tagPromises)
    
    // 按使用量和文章數排序，取前 N 個
    const hotTags = tagResults
      .filter(item => item.totalViews > 0)
      .sort((a, b) => b.totalViews - a.totalViews)
      .slice(0, limit)
      .map(item => item.tag)

    // 如果沒有足夠的熱門標籤，用預設值補足
    const defaultTags = ['伴手禮', '租車', '湯屋']
    if (hotTags.length < limit) {
      defaultTags.forEach(tag => {
        if (!hotTags.includes(tag) && hotTags.length < limit) {
          hotTags.push(tag)
        }
      })
    }

    return {
      hotTags,
      message: hotTags.length > 0 ? '基於使用量和文章數生成' : '使用預設標籤'
    }
  } catch (error) {
    console.error('獲取熱門標籤失敗:', error)
    
    // 發生錯誤時返回預設標籤
    return {
      hotTags: ['伴手禮', '租車', '湯屋'],
      message: '使用預設標籤（發生錯誤）'
    }
  }
}) 