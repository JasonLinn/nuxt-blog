import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { pool } from '../utils/db.js';

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event);
    const { account, password } = body;

    if (!account || !password) {
      throw createError({
        statusCode: 400,
        statusMessage: '請輸入帳號和密碼'
      });
    }

    // 檢查民宿是否存在並取得密碼hash
    const homestayQuery = `
      SELECT 
        id,
        name,
        location,
        city,
        image_url,
        website,
        phone,
        capacity_description,
        available,
        status,
        password_hash
      FROM homestays 
      WHERE id = $1 AND available = true AND status = 'approved'
    `;

    const result = await pool.query(homestayQuery, [account]);
    
    if (result.rows.length === 0) {
      throw createError({
        statusCode: 401,
        statusMessage: '民宿不存在、已停用或未通過審核'
      });
    }

    const homestay = result.rows[0];

    // 驗證密碼 - 支援兩種方式
    let passwordValid = false;
    
    if (homestay.password_hash) {
      // 方式1: 新的加密密碼驗證
      passwordValid = await bcrypt.compare(password, homestay.password_hash);
    }
    
    if (!passwordValid) {
      // 方式2: 舊的 B + 編號格式（向後相容）
      const expectedPassword = `B${account}`;
      passwordValid = (password === expectedPassword);
    }

    if (!passwordValid) {
      throw createError({
        statusCode: 401,
        statusMessage: '帳號或密碼錯誤'
      });
    }

    // 創建 JWT Token
    const jwtTokenPayload = {
      id: homestay.id,
      type: 'homestay',
      name: homestay.name,
      location: homestay.location,
      image_url: homestay.image_url
    };

    const maxAge = 60 * 60 * 24 * 7; // 7天
    const expires = Math.floor(Date.now() / 1000) + maxAge;

    const jwtToken = jwt.sign(
      {
        exp: expires,
        data: jwtTokenPayload
      },
      'JWT_SIGN_SECRET_HOMESTAY_2024'
    );

    // 設置Cookie
    setCookie(event, 'homestay_access_token', jwtToken, {
      maxAge,
      expires: new Date(expires * 1000),
      secure: true,
      httpOnly: true,
      path: '/'
    });

    // 記錄登入
    const loginLogQuery = `
      UPDATE homestays 
      SET view_count = view_count + 1 
      WHERE id = $1
    `;
    await pool.query(loginLogQuery, [homestay.id]);

    return {
      success: true,
      message: '登入成功',
      homestay: {
        id: homestay.id,
        name: homestay.name,
        location: homestay.location
      }
    };

  } catch (error) {
    console.error('民宿登入錯誤:', error);
    
    if (error.statusCode) {
      throw error;
    }
    
    throw createError({
      statusCode: 500,
      statusMessage: '登入系統發生錯誤'
    });
  }
}); 