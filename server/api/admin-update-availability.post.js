import jwt from 'jsonwebtoken';
import { pool } from '../utils/db.js';

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
    const { homestayId, available } = body;

    if (!homestayId || typeof available !== 'boolean') {
      throw createError({
        statusCode: 400,
        statusMessage: '參數錯誤'
      });
    }

    // 更新 available 狀態
    const updateQuery = `
      UPDATE homestays 
      SET available = $1, updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
      RETURNING id, name, available, status
    `;

    const result = await pool.query(updateQuery, [available, homestayId]);

    if (result.rows.length === 0) {
      throw createError({
        statusCode: 404,
        statusMessage: '找不到指定的民宿'
      });
    }

    return {
      success: true,
      message: `民宿 ${homestayId} 的可用狀態已更新為 ${available ? '可用' : '不可用'}`,
      homestay: result.rows[0]
    };

  } catch (error) {
    console.error('更新可用狀態錯誤:', error);
    
    if (error.statusCode) {
      throw error;
    }
    
    throw createError({
      statusCode: 500,
      statusMessage: '系統錯誤，請稍後重試'
    });
  }
});