import jwt from 'jsonwebtoken';

export default defineEventHandler(async (event) => {
  try {
    // 驗證管理員身份
    const accessToken = getCookie(event, 'admin_access_token');
    
    if (!accessToken) {
      throw createError({
        statusCode: 401,
        statusMessage: '未登入'
      });
    }

    const decoded = jwt.verify(accessToken, 'JWT_SIGN_SECRET_ADMIN_2024');
    
    if (!decoded.data || decoded.data.type !== 'admin') {
      throw createError({
        statusCode: 401,
        statusMessage: '無權限訪問'
      });
    }

    // 檢查環境變數（不暴露敏感資訊）
    const emailUser = process.env.EMAIL_USER;
    const emailPassword = process.env.EMAIL_PASSWORD;
    
    const config = {
      emailUserConfigured: !!emailUser,
      emailPasswordConfigured: !!emailPassword,
      emailUserValue: emailUser ? `${emailUser.substring(0, 3)}***@${emailUser.split('@')[1] || 'unknown'}` : 'Not set',
      emailPasswordLength: emailPassword ? emailPassword.length : 0,
      runtimeConfig: {
        emailUser: useRuntimeConfig().EMAIL_USER ? 'Configured in runtime' : 'Not in runtime',
        emailPassword: useRuntimeConfig().EMAIL_PASSWORD ? 'Configured in runtime' : 'Not in runtime'
      }
    };

    return {
      success: true,
      config,
      recommendations: [
        emailUser ? '✓ EMAIL_USER 已設定' : '❌ 需要設定 EMAIL_USER',
        emailPassword ? '✓ EMAIL_PASSWORD 已設定' : '❌ 需要設定 EMAIL_PASSWORD',
        emailPassword && emailPassword.length === 16 ? '✓ 密碼長度正確 (應該是 16 位應用程式密碼)' : '⚠️ 密碼長度不是 16 位，可能不是應用程式密碼',
        emailUser && emailUser.includes('@gmail.com') ? '✓ 使用 Gmail 帳號' : '⚠️ 確認是否為完整的 Gmail 地址'
      ]
    };

  } catch (error) {
    console.error('檢查郵件設定失敗:', error);
    
    if (error.statusCode) {
      throw error;
    }
    
    throw createError({
      statusCode: 500,
      statusMessage: `設定檢查失敗: ${error.message}`
    });
  }
}); 