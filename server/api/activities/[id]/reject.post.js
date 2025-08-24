import { query } from '~/server/utils/db.js'

export default defineEventHandler(async (event) => {
  try {
    // TODO: 驗證管理員權限
    // const session = await requireAdminAuth(event)
    
    const id = getRouterParam(event, 'id')
    const body = await readBody(event)
    
    if (!id || isNaN(parseInt(id))) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Invalid activity ID'
      })
    }
    
    if (!body.reason || !body.reason.trim()) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Rejection reason is required'
      })
    }
    
    // 檢查活動是否存在
    const checkSql = 'SELECT id, status FROM yilan_activities WHERE id = $1'
    const checkResult = await query(checkSql, [parseInt(id)])
    
    if (checkResult.rows.length === 0) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Activity not found'
      })
    }
    
    const activity = checkResult.rows[0]
    
    if (activity.status !== 'pending') {
      throw createError({
        statusCode: 400,
        statusMessage: 'Only pending activities can be rejected'
      })
    }
    
    // 更新活動狀態為已退回
    const updateSql = `
      UPDATE yilan_activities 
      SET 
        status = 'rejected',
        rejection_reason = $1,
        updated_at = CURRENT_TIMESTAMP,
        approved_at = NULL,
        approved_by = NULL
      WHERE id = $2
      RETURNING *
    `
    
    const result = await query(updateSql, [body.reason.trim(), parseInt(id)])
    
    // TODO: 發送通知郵件給投稿人
    
    return {
      success: true,
      data: result.rows[0],
      message: 'Activity rejected successfully'
    }
    
  } catch (error) {
    console.error('Error rejecting activity:', error)
    
    if (error.statusCode) {
      throw error
    }
    
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to reject activity'
    })
  }
})
