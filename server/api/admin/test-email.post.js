import jwt from 'jsonwebtoken';
import { testEmailConnection, sendApprovalEmail } from '../../utils/emailService.js';

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

    const body = await readBody(event);
    const { testType, testEmail } = body;

    // 驗證輸入
    if (!testType || !['connection', 'send'].includes(testType)) {
      throw createError({
        statusCode: 400,
        statusMessage: '無效的測試類型'
      });
    }

    if (testType === 'send' && !testEmail) {
      throw createError({
        statusCode: 400,
        statusMessage: '發送測試郵件時必須提供收件者信箱'
      });
    }

    let result;

    if (testType === 'connection') {
      // 測試郵件服務連接
      result = await testEmailConnection();
    } else if (testType === 'send') {
      // 發送測試郵件
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(testEmail)) {
        throw createError({
          statusCode: 400,
          statusMessage: '無效的信箱格式'
        });
      }

      try {
        await sendApprovalEmail(
          testEmail,
          '測試民宿 (這是測試郵件)',
          'TEST-001'
        );
        
        result = {
          success: true,
          message: `測試郵件已成功發送至 ${testEmail}`
        };
      } catch (emailError) {
        throw new Error(`測試郵件發送失敗: ${emailError.message}`);
      }
    }

    // 記錄測試活動
    console.log(`郵件功能測試: ${testType}, 操作者: ${decoded.data.username}, 時間: ${new Date().toISOString()}`);
    if (testType === 'send') {
      console.log(`測試郵件收件者: ${testEmail}`);
    }

    return {
      success: true,
      testType,
      result,
      timestamp: new Date().toISOString(),
      tester: decoded.data.username
    };

  } catch (error) {
    console.error('郵件測試失敗:', error);
    
    if (error.statusCode) {
      throw error;
    }
    
    throw createError({
      statusCode: 500,
      statusMessage: `郵件測試失敗: ${error.message}`
    });
  }
}); 