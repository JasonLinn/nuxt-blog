import jwt from 'jsonwebtoken'

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
    const decoded = jwt.verify(accessToken, 'JWT_SIGN_SECRET_ADMIN_2024')
    
    if (!decoded.data || decoded.data.type !== 'admin') {
      return {
        isAdmin: false
      }
    }

    return {
      isAdmin: true,
      adminId: decoded.data.admin_id,
      adminName: decoded.data.admin_name
    }

  } catch (error) {
    console.error('檢查管理員權限失敗:', error)
    return {
      isAdmin: false
    }
  }
})