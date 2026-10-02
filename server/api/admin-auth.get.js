import { requireAdminRole } from '../utils/requireRole.js';

export default defineEventHandler(async (event) => {
  try {
    // 取得 Access Token
    const accessToken = getCookie(event, 'admin_access_token');
    
    if (!accessToken) {
      throw createError({
        statusCode: 401,
        statusMessage: '未登入'
      });
    }

    // 驗證 JWT Token
    const decoded = { data: requireAdminRole(event) };
    
    if (!decoded.data || decoded.data.type !== 'admin') {
      throw createError({
        statusCode: 401,
        statusMessage: '無效的登入狀態'
      });
    }

    return {
      success: true,
      admin: {
        username: decoded.data.username,
        type: decoded.data.type
      }
    };

  } catch (error) {
    console.error('管理員認證錯誤:', error);
    
    if (error.statusCode) {
      throw error;
    }
    
    throw createError({
      statusCode: 401,
      statusMessage: '登入已過期，請重新登入'
    });
  }
}); 