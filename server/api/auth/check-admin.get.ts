import { requireAdminRole } from '../../utils/requireRole.js'

export default defineEventHandler(async (event) => {
  try {
    // 檢查管理員 token
    const accessToken = getCookie(event, 'admin_access_token')
    
    if (!accessToken) {
      return {
        isAdmin: false
      }
    }

    // 驗證 JWT token
    const admin = requireAdminRole(event)

    return {
      isAdmin: true,
      adminId: admin.admin_id,
      adminName: admin.admin_name
    }

  } catch (error) {
    console.error('檢查管理員權限失敗:', error)
    return {
      isAdmin: false
    }
  }
})