import { couponPool } from '../utils/coupon-db.js'

export default defineEventHandler(async (event) => {
  try {
    const query = await getQuery(event)
    
    // 參數驗證和初始化
    const page = Math.max(parseInt(query.page) || 1, 1)
    const pageSize = Math.min(Math.max(parseInt(query.pageSize) || 10, 1), 100)
    const category = query.category?.trim() || null
    const searchText = query.searchText?.trim() || null

    console.log('Received params:', { category, searchText, page, pageSize })

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

    // 搜索文本條件 - 支援標題、內容模糊搜尋
    if (searchText) {
      const searchPattern = `%${searchText}%`
      conditions.push(`(title ILIKE $${paramCount} OR content ILIKE $${paramCount})`)
      sqlParams.push(searchPattern)
      paramCount++
    }

    // 構建完整的 SQL 查詢
    const whereClause = conditions.length > 0 ? ` WHERE ${conditions.join(' AND ')}` : ''
    
    // 計數查詢
    const countQuery = `SELECT COUNT(*) as total FROM "relative"${whereClause}`
    
    // 數據查詢 - 添加分頁參數，使用隨機排序
    const dataQuery = `SELECT * FROM "relative"${whereClause} ORDER BY RANDOM() OFFSET $${paramCount} LIMIT $${paramCount + 1}`
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
    console.error('Relative API error:', {
      message: error.message,
      code: error.code,
      detail: error.detail,
      stack: error.stack
    })
    
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
      message: '無法取得店家列表，請稍候再試'
    })
  }
})
