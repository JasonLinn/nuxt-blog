import { couponPool } from '../utils/coupon-db.js'

export default defineEventHandler(async (event) => {
  try {
    const query = await getQuery(event)
    
    // 參數驗證和初始化
    const page = Math.max(parseInt(query.page) || 1, 1)
    const pageSize = Math.min(Math.max(parseInt(query.pageSize) || 10, 1), 100)
    const category = query.category?.trim() || null
    const township = query.township?.trim() || null
    const searchText = query.searchText?.trim() || null

    console.log('Articles API - Received params:', { category, township, searchText, page, pageSize })

    // 檢查 article 表格是否存在
    let tableExists = false
    try {
      await couponPool.query(`SELECT to_regclass('public.article')`)
      const result = await couponPool.query(`SELECT to_regclass('public.article') as exists`)
      tableExists = result.rows[0]?.exists !== null
    } catch (checkError) {
      console.log('Table check error:', checkError.message)
      tableExists = false
    }

    if (!tableExists) {
      console.log('Article table does not exist, returning empty result')
      return {
        items: [],
        pagination: {
          page,
          pageSize,
          total: 0,
          totalPages: 0,
          hasNext: false,
          hasPrev: false
        },
        message: 'Article table not available - returning empty result'
      }
    }

    // 動態構建 WHERE 條件和參數
    const conditions = []
    const sqlParams = []
    let paramCount = 1

    // 分類條件
    if (category) {
      conditions.push(`category = $${paramCount}`)
      sqlParams.push(category)
      paramCount++
    }

    // 鄉鎮條件 - 使用陣列包含查詢
    if (township) {
      conditions.push(`$${paramCount} = ANY(township)`)
      sqlParams.push(township)
      paramCount++
    }

    // 搜索文本條件 - 支援標題、內容、標籤模糊搜尋
    if (searchText) {
      const searchPattern = `%${searchText}%`
      conditions.push(`(title ILIKE $${paramCount} OR content ILIKE $${paramCount} OR tags ILIKE $${paramCount})`)
      sqlParams.push(searchPattern)
      paramCount++
    }

    // 構建完整的 SQL 查詢
    const whereClause = conditions.length > 0 ? ` WHERE ${conditions.join(' AND ')}` : ''
    
    // 計數查詢
    const countQuery = `SELECT COUNT(*) as total FROM "article"${whereClause}`
    
    // 數據查詢 - 添加分頁參數，使用隨機排序
    const dataQuery = `SELECT * FROM "article"${whereClause} ORDER BY RANDOM() OFFSET $${paramCount} LIMIT $${paramCount + 1}`
    const dataParams = [...sqlParams, (page - 1) * pageSize, pageSize]

    console.log('Count Query:', countQuery)
    console.log('Count Params:', sqlParams)
    console.log('Data Query:', dataQuery)
    console.log('Data Params:', dataParams)

    // 先執行計數查詢
    let countResult
    try {
      countResult = await couponPool.query(countQuery, sqlParams)
    } catch (countError) {
      console.error('Count query error:', countError)
      throw countError
    }

    // 再執行數據查詢
    let dataResult
    try {
      dataResult = await couponPool.query(dataQuery, dataParams)
    } catch (dataError) {
      console.error('Data query error:', dataError)
      throw dataError
    }

    const total = parseInt(countResult.rows[0]?.total || 0)
    const totalPages = Math.ceil(total / pageSize)

    console.log('Query successful:', { total, itemsReturned: dataResult.rows.length })

    return {
      items: dataResult.rows,
      pagination: {
        page,
        pageSize,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    }
  } catch (error) {
    console.error('Articles API error:', {
      message: error.message,
      code: error.code,
      detail: error.detail,
      stack: error.stack
    })
    
    // 如果是表格不存在的錯誤，返回空結果而不是錯誤
    if (error.code === '42P01') { // relation does not exist
      console.log('Article table does not exist, returning empty result')
      return {
        items: [],
        pagination: {
          page: Math.max(parseInt(query.page) || 1, 1),
          pageSize: Math.min(Math.max(parseInt(query.pageSize) || 10, 1), 100),
          total: 0,
          totalPages: 0,
          hasNext: false,
          hasPrev: false
        },
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
      message: '無法取得文章列表，請稍候再試'
    })
  }
})
