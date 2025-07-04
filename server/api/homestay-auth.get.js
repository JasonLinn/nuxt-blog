import jwt from 'jsonwebtoken';

export default defineEventHandler(async (event) => {
  try {
    const accessToken = getCookie(event, 'homestay_access_token');

    if (!accessToken) {
      throw createError({
        statusCode: 401,
        statusMessage: '未登入'
      });
    }

    // 驗證 JWT Token
    const decoded = jwt.verify(accessToken, 'JWT_SIGN_SECRET_HOMESTAY_2024');
    
    if (!decoded.data || decoded.data.type !== 'homestay') {
      throw createError({
        statusCode: 401,
        statusMessage: '無效的登入狀態'
      });
    }

    return {
      success: true,
      homestay: decoded.data
    };

  } catch (error) {
    console.error('民宿身份驗證錯誤:', error);
    
    if (error.statusCode) {
      throw error;
    }
    
    throw createError({
      statusCode: 401,
      statusMessage: '身份驗證失敗'
    });
  }
}); 