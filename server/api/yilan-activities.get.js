import { query } from '~/server/utils/db.js'

export default defineEventHandler(async (event) => {
  try {
    const url = getQuery(event)
    const { status, limit, offset, dateFilter } = url
    
    let sql = `
      SELECT 
        id, title, description, images, event_date, event_time, end_date, end_time, is_multi_day,
        location, activity_type, organizer_name, organizer_email, organizer_phone, contact_info,
        status, rejection_reason, submitter_name, submitter_email, admin_notes,
        created_at, updated_at, approved_at, approved_by
      FROM yilan_activities
    `
    
    const params = []
    const conditions = []
    
    if (status) {
      conditions.push('status = $' + (params.length + 1))
      params.push(status)
    }

    // 處理日期篩選
    const today = new Date()
    const sixMonthsAgo = new Date(today.getFullYear(), today.getMonth() - 6, today.getDate())
    
    if (dateFilter) {
      switch (dateFilter) {
        case 'upcoming':
          // 使用 end_date 如果存在，否則使用 event_date
          conditions.push('(CASE WHEN end_date IS NOT NULL THEN end_date ELSE event_date END) >= $' + (params.length + 1))
          params.push(today.toISOString().split('T')[0])
          break
        case 'thisWeek':
          const weekEnd = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000)
          conditions.push('event_date >= $' + (params.length + 1))
          conditions.push('event_date <= $' + (params.length + 2))
          params.push(today.toISOString().split('T')[0])
          params.push(weekEnd.toISOString().split('T')[0])
          break
        case 'thisMonth':
          const monthStart = new Date(today.getFullYear(), today.getMonth(), 1)
          const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0)
          conditions.push('event_date >= $' + (params.length + 1))
          conditions.push('event_date <= $' + (params.length + 2))
          params.push(monthStart.toISOString().split('T')[0])
          params.push(monthEnd.toISOString().split('T')[0])
          break
        case 'nextMonth':
          const nextMonthStart = new Date(today.getFullYear(), today.getMonth() + 1, 1)
          const nextMonthEnd = new Date(today.getFullYear(), today.getMonth() + 2, 0)
          conditions.push('event_date >= $' + (params.length + 1))
          conditions.push('event_date <= $' + (params.length + 2))
          params.push(nextMonthStart.toISOString().split('T')[0])
          params.push(nextMonthEnd.toISOString().split('T')[0])
          break
        case 'past':
          // 使用 end_date 如果存在，否則使用 event_date
          conditions.push('(CASE WHEN end_date IS NOT NULL THEN end_date ELSE event_date END) < $' + (params.length + 1))
          conditions.push('(CASE WHEN end_date IS NOT NULL THEN end_date ELSE event_date END) >= $' + (params.length + 2))
          params.push(today.toISOString().split('T')[0])
          params.push(sixMonthsAgo.toISOString().split('T')[0])
          break
        case 'all':
        default:
          // 即使選擇"所有時間"也只顯示未來活動
          conditions.push('(CASE WHEN end_date IS NOT NULL THEN end_date ELSE event_date END) >= $' + (params.length + 1))
          params.push(today.toISOString().split('T')[0])
          break
      }
    } else {
      // 預設只顯示未來活動
      conditions.push('(CASE WHEN end_date IS NOT NULL THEN end_date ELSE event_date END) >= $' + (params.length + 1))
      params.push(today.toISOString().split('T')[0])
    }
    
    if (conditions.length > 0) {
      sql += ' WHERE ' + conditions.join(' AND ')
    }

    // 排序邏輯：過期活動按倒序，其他按正序
    if (dateFilter === 'past') {
      sql += ' ORDER BY (CASE WHEN end_date IS NOT NULL THEN end_date ELSE event_date END) DESC, created_at DESC'
    } else {
      sql += ' ORDER BY event_date ASC, created_at DESC'
    }
    
    if (limit) {
      sql += ' LIMIT $' + (params.length + 1)
      params.push(parseInt(limit))
    }

    if (offset) {
      sql += ' OFFSET $' + (params.length + 1)
      params.push(parseInt(offset))
    }

    const result = await query(sql, params)
    
    // 計算總數（使用相同的篩選條件）
    let countSql = 'SELECT COUNT(*) as total FROM yilan_activities'
    let countParams = []
    let countConditions = []
    
    if (status) {
      countConditions.push('status = $1')
      countParams.push(status)
    }

    // 重新建構計數查詢的日期條件
    const todayForCount = new Date()
    const sixMonthsAgoForCount = new Date(todayForCount.getFullYear(), todayForCount.getMonth() - 6, todayForCount.getDate())
    
    if (dateFilter) {
      switch (dateFilter) {
        case 'upcoming':
          countConditions.push('(CASE WHEN end_date IS NOT NULL THEN end_date ELSE event_date END) >= $' + (countParams.length + 1))
          countParams.push(todayForCount.toISOString().split('T')[0])
          break
        case 'thisWeek':
          const weekEndForCount = new Date(todayForCount.getTime() + 7 * 24 * 60 * 60 * 1000)
          countConditions.push('event_date >= $' + (countParams.length + 1))
          countConditions.push('event_date <= $' + (countParams.length + 2))
          countParams.push(todayForCount.toISOString().split('T')[0])
          countParams.push(weekEndForCount.toISOString().split('T')[0])
          break
        case 'thisMonth':
          const monthStartForCount = new Date(todayForCount.getFullYear(), todayForCount.getMonth(), 1)
          const monthEndForCount = new Date(todayForCount.getFullYear(), todayForCount.getMonth() + 1, 0)
          countConditions.push('event_date >= $' + (countParams.length + 1))
          countConditions.push('event_date <= $' + (countParams.length + 2))
          countParams.push(monthStartForCount.toISOString().split('T')[0])
          countParams.push(monthEndForCount.toISOString().split('T')[0])
          break
        case 'nextMonth':
          const nextMonthStartForCount = new Date(todayForCount.getFullYear(), todayForCount.getMonth() + 1, 1)
          const nextMonthEndForCount = new Date(todayForCount.getFullYear(), todayForCount.getMonth() + 2, 0)
          countConditions.push('event_date >= $' + (countParams.length + 1))
          countConditions.push('event_date <= $' + (countParams.length + 2))
          countParams.push(nextMonthStartForCount.toISOString().split('T')[0])
          countParams.push(nextMonthEndForCount.toISOString().split('T')[0])
          break
        case 'past':
          countConditions.push('(CASE WHEN end_date IS NOT NULL THEN end_date ELSE event_date END) < $' + (countParams.length + 1))
          countConditions.push('(CASE WHEN end_date IS NOT NULL THEN end_date ELSE event_date END) >= $' + (countParams.length + 2))
          countParams.push(todayForCount.toISOString().split('T')[0])
          countParams.push(sixMonthsAgoForCount.toISOString().split('T')[0])
          break
        case 'all':
        default:
          countConditions.push('(CASE WHEN end_date IS NOT NULL THEN end_date ELSE event_date END) >= $' + (countParams.length + 1))
          countParams.push(todayForCount.toISOString().split('T')[0])
          break
      }
    } else {
      countConditions.push('(CASE WHEN end_date IS NOT NULL THEN end_date ELSE event_date END) >= $' + (countParams.length + 1))
      countParams.push(todayForCount.toISOString().split('T')[0])
    }
    
    if (countConditions.length > 0) {
      countSql += ' WHERE ' + countConditions.join(' AND ')
    }

    const countResult = await query(countSql, countParams)
    const total = parseInt(countResult.rows[0].total)

    return {
      success: true,
      data: result.rows,
      total,
      message: 'Activities fetched successfully'
    }
    
  } catch (error) {
    console.error('Error fetching activities:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to fetch activities'
    })
  }
})