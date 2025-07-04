import jwt from 'jsonwebtoken';

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event);
    const { username, password } = body;

    if (!username || !password) {
      throw createError({
        statusCode: 400,
        statusMessage: '請輸入帳號和密碼'
      });
    }

    // 硬編碼的管理員帳密（實際環境應從環境變數取得）
    const adminCredentials = {
      username: 'admin',
      password: 'admin123'
    };

    // 驗證帳號密碼
    if (username !== adminCredentials.username || password !== adminCredentials.password) {
      throw createError({
        statusCode: 401,
        statusMessage: '帳號或密碼錯誤'
      });
    }

    // 創建 JWT Token
    const jwtTokenPayload = {
      id: 'admin',
      type: 'admin',
      username: username
    };

    const maxAge = 60 * 60 * 24 * 1; // 1天
    const expires = Math.floor(Date.now() / 1000) + maxAge;

    const jwtToken = jwt.sign(
      {
        exp: expires,
        data: jwtTokenPayload
      },
      'JWT_SIGN_SECRET_ADMIN_2024'
    );

    // 設置Cookie
    setCookie(event, 'admin_access_token', jwtToken, {
      maxAge,
      expires: new Date(expires * 1000),
      secure: true,
      httpOnly: true,
      path: '/'
    });

    console.log(`管理員登入: ${username} at ${new Date().toISOString()}`);

    return {
      success: true,
      message: '登入成功',
      admin: {
        username: username,
        type: 'admin'
      }
    };

  } catch (error) {
    console.error('管理員登入錯誤:', error);
    
    if (error.statusCode) {
      throw error;
    }
    
    throw createError({
      statusCode: 500,
      statusMessage: '登入系統發生錯誤'
    });
  }
}); 