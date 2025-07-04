export default defineEventHandler(async (event) => {
  try {
    // 清除 Cookie
    setCookie(event, 'homestay_access_token', '', {
      maxAge: 0,
      expires: new Date(0),
      secure: true,
      httpOnly: true,
      path: '/'
    });

    return {
      success: true,
      message: '登出成功'
    };

  } catch (error) {
    console.error('民宿登出錯誤:', error);
    
    throw createError({
      statusCode: 500,
      statusMessage: '登出失敗'
    });
  }
}); 