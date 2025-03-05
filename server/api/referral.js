import { readBody, createError } from '#imports'

// 直接在处理函数中导入 referral 数据
export default defineEventHandler(async (event) => {
  try {
    // 动态导入 referral 数据
    const { referral } = await import('../../utils/referral.js')
    
    // 读取请求体
    const body = await readBody(event);
    
    // 验证请求体中是否包含 code
    if (!body || !body.code) {
      throw createError({
        statusCode: 400,
        message: "缺少推薦代碼"
      });
    }

    const { code } = body;

    // 使用 referral.js 中的数据
    const referralData = referral.find(ref => ref.code === code && ref.name); // 只匹配有名字的推荐码

    if (!referralData) {
      throw createError({
        statusCode: 404,
        message: "無效的推薦代碼"
      });
    }

    return {
      success: true,
      data: referralData
    };

  } catch (error) {
    console.error('推薦代碼驗證錯誤:', error);
    
    throw createError({
      statusCode: error.statusCode || 500,
      message: error.message || "服務器錯誤，請稍後再試"
    });
  }
}); 