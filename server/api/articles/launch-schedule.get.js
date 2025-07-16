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
    console.log('Launch Schedule API - Fetching all articles')

    // 查詢文章表格
    const articleQuery = 'SELECT * FROM "article" ORDER BY updated_at DESC'
    
    // 查詢代訂服務表格
    const relativeQuery = 'SELECT * FROM "relative" ORDER BY updated_at DESC'
    
    console.log('Article Query:', articleQuery)
    console.log('Relative Query:', relativeQuery)

    // 執行查詢
    const [articleResult, relativeResult] = await Promise.all([
      couponPool.query(articleQuery).catch(() => ({ rows: [] })),
      couponPool.query(relativeQuery).catch(() => ({ rows: [] }))
    ])

    // 為代訂服務添加標識
    const relativeItems = relativeResult.rows.map(item => ({
      ...item,
      isReferral: true,
      isreferral: true,
      source: 'relative'
    }))
    
    // 為文章添加來源標識
    const articleItems = articleResult.rows.map(item => ({
      ...item,
      source: 'article'
    }))

    // 合併並排序所有項目
    const allItems = [...articleItems, ...relativeItems]
    
    // 按更新時間重新排序
    allItems.sort((a, b) => {
      const dateA = new Date(a.updated_at || 0)
      const dateB = new Date(b.updated_at || 0)
      return dateB - dateA
    })

    console.log('Query successful:', { 
      articles: articleResult.rows.length,
      relatives: relativeResult.rows.length,
      total: allItems.length 
    })

    return {
      items: allItems
    }
  } catch (error) {
    console.error('Launch Schedule API error:', {
      message: error.message,
      code: error.code,
      detail: error.detail,
      stack: error.stack
    })
    // 額外 log 原始錯誤
    console.error(error)
    
    // 如果是表格不存在的錯誤，返回空結果而不是錯誤
    if (error.code === '42P01') { // relation does not exist
      console.log('Article table does not exist, returning empty result')
      return {
        items: [],
        message: 'Article table not available - returning empty result'
      }
    }
    
    // 區分不同類型的錯誤
    if (error.code) {
      // 資料庫錯誤
      throw createError({
        statusCode: 500,
        message: `資料庫查詢失敗: ${error.message}`
      })
    }
    
    // 其他錯誤
    throw createError({
      statusCode: 500,
      message: '無法取得上架時間列表，請稍候再試'
    })
  }
}) 