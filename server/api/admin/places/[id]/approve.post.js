// 管理員 - 審核地點
import { pool } from '../../../../utils/db.js';

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
      const checkSql = 'SELECT id, status FROM places WHERE id = $1';
      const checkResult = await client.query(checkSql, [placeId]);
      
      if (checkResult.rows.length === 0) {
        throw createError({
          statusCode: 404,
          statusMessage: '地點不存在'
        });
      }

      // 更新地點狀態為已審核
      const updateSql = `
        UPDATE places 
        SET status = 'approved', updated_at = CURRENT_TIMESTAMP 
        WHERE id = $1
        RETURNING *
      `;
      
      const result = await client.query(updateSql, [placeId]);
      
      return {
        success: true,
        data: result.rows[0],
        message: '地點已審核通過'
      };
      
    } finally {
      client.release();
    }

  } catch (error) {
    console.error('審核地點失敗:', error);
    
    if (error.statusCode) {
      throw error;
    }
    
    throw createError({
      statusCode: 500,
      statusMessage: '審核地點失敗'
    });
  }
});
