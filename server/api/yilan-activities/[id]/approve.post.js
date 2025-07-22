import { query } from '~/server/utils/db.js'

export default defineEventHandler(async (event) => {
  try {
    // TODO: 驗證管理員權限
    // const session = await requireAdminAuth(event)
    
    const id = getRouterParam(event, 'id')
    
    if (!id || isNaN(parseInt(id))) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Invalid activity ID'
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
        statusMessage: 'Only pending activities can be approved'
      })
    }
    
    // 更新活動狀態為已通過
    const updateSql = `
      UPDATE yilan_activities 
      SET 
        status = 'approved',
        approved_at = CURRENT_TIMESTAMP,
        approved_by = $1,
        updated_at = CURRENT_TIMESTAMP,
        rejection_reason = NULL
      WHERE id = $2
      RETURNING *
    `
    
    // TODO: 從 session 獲取管理員名稱
    const adminName = 'Admin' // 暫時硬編碼
    
    const result = await query(updateSql, [adminName, parseInt(id)])
    
    // TODO: 發送通知郵件給投稿人
    
    return {
      success: true,
      data: result.rows[0],
      message: 'Activity approved successfully'
    }
    
  } catch (error) {
    console.error('Error approving activity:', error)
    
    if (error.statusCode) {
      throw error
    }
    
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to approve activity'
    })
  }
})