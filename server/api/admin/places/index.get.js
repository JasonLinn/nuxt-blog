// 管理員 - 取得所有地點
import { pool } from '../../../utils/db.js';

export default defineEventHandler(async (event) => {
  try {
    // 這裡應該加入管理員權限驗證
    // const user = await validateAdminToken(event);
    
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
        ORDER BY p.created_at DESC
      `;
      
      const result = await client.query(sql);
      
      // 處理 JSON 欄位
      const processedData = result.rows.map(place => {
        // 解析 JSON 欄位
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
        
        return place;
      });
      
      return {
        success: true,
        data: processedData
      };
      
    } finally {
      client.release();
    }

  } catch (error) {
    console.error('獲取地點列表失敗:', error);
    throw createError({
      statusCode: 500,
      statusMessage: '獲取地點列表失敗'
    });
  }
});
