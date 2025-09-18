// 前台 - 取得地點基本資訊（用於地圖標記）
import { pool } from '../utils/db.js';

export default defineEventHandler(async (event) => {
  try {
    const query = getQuery(event);
    const { category, featured, private: isPrivate, search, limit = 200 } = query;
    
    const client = await pool.connect();
    
    try {
      // 只載入基本資訊，不包含 photos、opening_hours 等大型資料
      let sql = `
        SELECT 
          p.id,
          p.name,
          p.category_id,
          p.description,
          p.formatted_address as address,
          p.latitude,
          p.longitude,
          p.rating,
          p.user_ratings_total,
          p.is_featured,
          p.is_private,
          pc.name as category_name,
          pc.icon as category_icon,
          pc.color as category_color
        FROM places p
        LEFT JOIN place_categories pc ON p.category_id = pc.id
        WHERE p.status = 'approved'
      `;
      
      const conditions = [];
      const params = [];
      let paramIndex = 1;
      
      // 分類篩選
      if (category) {
        conditions.push(`p.category_id = $${paramIndex}`);
        params.push(category);
        paramIndex++;
      }
      
      // 精選篩選
      if (featured !== undefined) {
        conditions.push(`p.is_featured = $${paramIndex}`);
        params.push(featured === 'true');
        paramIndex++;
      }
      
      // 私人地點篩選
      if (isPrivate !== undefined) {
        conditions.push(`p.is_private = $${paramIndex}`);
        params.push(isPrivate === 'true');
        paramIndex++;
      }
      
      // 搜尋
      if (search) {
        conditions.push(`(
          p.name ILIKE $${paramIndex} OR 
          p.description ILIKE $${paramIndex} OR 
          p.formatted_address ILIKE $${paramIndex}
        )`);
        params.push(`%${search}%`);
        paramIndex++;
      }
      
      if (conditions.length > 0) {
        sql += ' AND ' + conditions.join(' AND ');
      }
      
      sql += ` ORDER BY 
        p.is_featured DESC, 
        p.view_count DESC, 
        p.rating DESC
        LIMIT $${paramIndex}`;
      params.push(parseInt(limit));
      
      const result = await client.query(sql, params);
      
      const processedData = result.rows.map(place => {
        // 確保座標是數字
        if (place.latitude) place.latitude = parseFloat(place.latitude);
        if (place.longitude) place.longitude = parseFloat(place.longitude);
        if (place.rating) place.rating = parseFloat(place.rating);
        
        return place;
      });
      
      return {
        success: true,
        data: processedData,
        total: processedData.length
      };
      
    } finally {
      client.release();
    }
    
  } catch (error) {
    console.error('獲取地點基本資訊失敗:', error);
    throw createError({
      statusCode: 500,
      statusMessage: '獲取地點基本資訊失敗'
    });
  }
});