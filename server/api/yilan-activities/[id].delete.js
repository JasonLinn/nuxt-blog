import { query } from '~/server/utils/db.js'
import jwt from 'jsonwebtoken'

export default defineEventHandler(async (event) => {
  try {
    // 驗證管理員身份
    const accessToken = getCookie(event, 'admin_access_token')
    
    if (!accessToken) {
      throw createError({
        statusCode: 401,
        statusMessage: '未登入'
      })
    }

    const decoded = jwt.verify(accessToken, 'JWT_SIGN_SECRET_ADMIN_2024')
    
    if (!decoded.data || decoded.data.type !== 'admin') {
      throw createError({
        statusCode: 401,
        statusMessage: '無權限'
      })
    }

    const id = getRouterParam(event, 'id')
    
    if (!id) {
      throw createError({
        statusCode: 400,
        statusMessage: '缺少活動ID'
      })
    }

    // 檢查活動是否存在
    const checkSql = 'SELECT id, title, images FROM yilan_activities WHERE id = $1'
    const checkResult = await query(checkSql, [id])
    
    if (checkResult.rows.length === 0) {
      throw createError({
        statusCode: 404,
        statusMessage: '活動不存在'
      })
    }

    const activity = checkResult.rows[0]

    // 刪除活動
    const deleteSql = 'DELETE FROM yilan_activities WHERE id = $1'
    await query(deleteSql, [id])

    console.log(`✅ 管理員 ${decoded.data.email} 刪除活動: ${activity.title} (ID: ${id})`)

    return {
      success: true,
      message: '活動已成功刪除',
      deletedActivity: {
        id: activity.id,
        title: activity.title
      }
    }

  } catch (error) {
    console.error('刪除活動錯誤:', error)
    
    if (error.statusCode) {
      throw error
    }
    
    throw createError({
      statusCode: 500,
      statusMessage: '刪除活動失敗'
    })
  }
})
