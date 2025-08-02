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
    const { action, homestayId } = body;

    if (action === 'fix-070') {
      // 修復編號 070 民宿的 available 狀態
      const updateQuery = `
        UPDATE homestays 
        SET available = true, updated_at = CURRENT_TIMESTAMP
        WHERE id = '070' AND status = 'approved'
        RETURNING id, name, status, available
      `;

      const result = await pool.query(updateQuery);

      if (result.rows.length === 0) {
        throw createError({
          statusCode: 404,
          statusMessage: '找不到編號 070 的已審核民宿'
        });
      }

      return {
        success: true,
        message: '編號 070 民宿已修復，現在可以在前台顯示',
        homestay: result.rows[0]
      };
    }

    if (action === 'enable' && homestayId) {
      // 啟用指定民宿
      const updateQuery = `
        UPDATE homestays 
        SET available = true, updated_at = CURRENT_TIMESTAMP
        WHERE id = $1 AND status = 'approved'
        RETURNING id, name, status, available
      `;

      const result = await pool.query(updateQuery, [homestayId]);

      if (result.rows.length === 0) {
        throw createError({
          statusCode: 404,
          statusMessage: '找不到指定的已審核民宿'
        });
      }

      return {
        success: true,
        message: `民宿 ${homestayId} 已啟用`,
        homestay: result.rows[0]
      };
    }

    throw createError({
      statusCode: 400,
      statusMessage: '無效的操作'
    });

  } catch (error) {
    console.error('快速修復錯誤:', error);
    
    if (error.statusCode) {
      throw error;
    }
    
    throw createError({
      statusCode: 500,
      statusMessage: '系統錯誤，請稍後重試'
    });
  }
});