// 管理員 - 刪除地點
import { pool } from '../../../utils/db.js';

export default defineEventHandler(async (event) => {
  try {
    // 這裡應該加入管理員權限驗證
    // const user = await validateAdminToken(event);
    
    const placeId = getRouterParam(event, 'id');
    
    if (!placeId) {
      throw createError({
        statusCode: 400,
        statusMessage: '地點 ID 為必填欄位'
      });
    }

    const client = await pool.connect();
    
    try {
      // 檢查地點是否存在
      const checkSql = 'SELECT id FROM places WHERE id = $1';
      const checkResult = await client.query(checkSql, [placeId]);
      
      if (checkResult.rows.length === 0) {
        throw createError({
          statusCode: 404,
          statusMessage: '地點不存在'
        });
      }

      // 刪除地點
      const deleteSql = 'DELETE FROM places WHERE id = $1';
      await client.query(deleteSql, [placeId]);
      
      return {
        success: true,
        message: '地點已刪除'
      };
      
    } finally {
      client.release();
    }

  } catch (error) {
    console.error('刪除地點失敗:', error);
    
    if (error.statusCode) {
      throw error;
    }
    
    throw createError({
      statusCode: 500,
      statusMessage: '刪除地點失敗'
    });
  }
});
