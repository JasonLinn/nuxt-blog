// 管理員 - 取得單個地點詳情
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
      const sql = `
        SELECT 
          p.*,
          pc.name as category_name,
          pc.icon as category_icon,
          pc.color as category_color
        FROM places p
        LEFT JOIN place_categories pc ON p.category_id = pc.id
        WHERE p.id = $1
      `;
      
      const result = await client.query(sql, [placeId]);
      
      if (result.rows.length === 0) {
        throw createError({
          statusCode: 404,
          statusMessage: '地點不存在'
        });
      }

      const place = result.rows[0];

      // 處理 JSON 欄位
      if (place.photos && typeof place.photos === 'string') {
        try {
          place.photos = JSON.parse(place.photos);
        } catch (e) {
          console.error('解析 photos JSON 失敗:', e);
          place.photos = [];
        }
      }
      
      if (place.images && typeof place.images === 'string') {
        try {
          place.images = JSON.parse(place.images);
        } catch (e) {
          console.error('解析 images JSON 失敗:', e);
          place.images = [];
        }
      }
      
      return {
        success: true,
        data: place
      };
      
    } finally {
      client.release();
    }

  } catch (error) {
    console.error('獲取地點詳情失敗:', error);
    
    if (error.statusCode) {
      throw error;
    }
    
    throw createError({
      statusCode: 500,
      statusMessage: '獲取地點詳情失敗'
    });
  }
});
