import { query } from '~/server/utils/db.js'

export default defineEventHandler(async (event) => {
  try {
    const url = getQuery(event)
    const { status, limit, offset } = url
    
    let sql = `
      SELECT 
        id, title, description, images, event_date, event_time, location, activity_type,
        organizer_name, organizer_email, organizer_phone, contact_info,
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
    
    if (conditions.length > 0) {
      sql += ' WHERE ' + conditions.join(' AND ')
    }
    
    sql += ' ORDER BY created_at DESC'
    
    if (limit) {
      sql += ' LIMIT $' + (params.length + 1)
      params.push(parseInt(limit))
    }
    
    if (offset) {
      sql += ' OFFSET $' + (params.length + 1)
      params.push(parseInt(offset))
    }
    
    const result = await query(sql, params)
    
    // 計算總數
    let countSql = 'SELECT COUNT(*) as total FROM yilan_activities'
    const countParams = []
    
    if (status) {
      countSql += ' WHERE status = $1'
      countParams.push(status)
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
