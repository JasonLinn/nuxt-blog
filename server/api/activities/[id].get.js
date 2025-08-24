import { query } from '~/server/utils/db.js'

export default defineEventHandler(async (event) => {
  try {
    const id = getRouterParam(event, 'id')
    
    if (!id || isNaN(parseInt(id))) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Invalid activity ID'
      })
    }
    
    const sql = `
      SELECT 
        id, title, description, images, event_date, event_time, location, activity_type,
        organizer_name, organizer_email, organizer_phone, contact_info,
        status, rejection_reason, submitter_name, submitter_email, admin_notes,
        created_at, updated_at, approved_at, approved_by
      FROM yilan_activities 
      WHERE id = $1
    `
    
    const result = await query(sql, [parseInt(id)])
    
    if (result.rows.length === 0) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Activity not found'
      })
    }
    
    return {
      success: true,
      data: result.rows[0],
      message: 'Activity fetched successfully'
    }
    
  } catch (error) {
    console.error('Error fetching activity:', error)
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      code: error.code
    })
    
    if (error.statusCode) {
      throw error
    }
    
    throw createError({
      statusCode: 500,
      statusMessage: `Failed to fetch activity: ${error.message}`
    })
  }
})
