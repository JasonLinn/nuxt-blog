// 管理員 - 切換地點精選狀態
import { pool } from '../../../../utils/db.js';

export default defineEventHandler(async (event) => {
  try {
    // 這裡應該加入管理員權限驗證
    // const user = await validateAdminToken(event);
    
    const placeId = getRouterParam(event, 'id');
    const body = await readBody(event);
    const { featured } = body;
    
    if (!placeId) {
      throw createError({
        statusCode: 400,
        statusMessage: '地點 ID 為必填欄位'
      });
    }

    const client = await pool.connect();
    
    try {
      // 檢查地點是否存在
      const checkSql = 'SELECT id, is_featured FROM places WHERE id = $1';
      const checkResult = await client.query(checkSql, [placeId]);
      
      if (checkResult.rows.length === 0) {
        throw createError({
          statusCode: 404,
          statusMessage: '地點不存在'
        });
      }

      // 更新地點精選狀態
      const updateSql = `
        UPDATE places 
        SET is_featured = $2, updated_at = CURRENT_TIMESTAMP 
        WHERE id = $1
        RETURNING *
      `;
      
      const result = await client.query(updateSql, [placeId, featured]);
      
      return {
        success: true,
        data: result.rows[0],
        message: featured ? '已設為精選地點' : '已取消精選'
      };
      
    } finally {
      client.release();
    }

  } catch (error) {
    console.error('更新精選狀態失敗:', error);
    
    if (error.statusCode) {
      throw error;
    }
    
    throw createError({
      statusCode: 500,
      statusMessage: '更新精選狀態失敗'
    });
  }
});
