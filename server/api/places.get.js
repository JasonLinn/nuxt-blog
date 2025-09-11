// 前台 - 取得已審核的地點（供使用者瀏覽）
import { pool } from '../utils/db.js';

export default defineEventHandler(async (event) => {
  try {
    const query = getQuery(event);
    const { category, featured, private: isPrivate, search, limit = 50 } = query;
    
    const client = await pool.connect();
    
    try {
      let sql = `
        SELECT 
          p.id,
          p.name,
          p.category_id,
          p.description,
          p.formatted_address,
          p.latitude,
          p.longitude,
          p.phone_number,
          p.website,
          p.business_status,
          p.rating,
          p.user_ratings_total,
          p.price_level,
          p.opening_hours,
          p.photos,
          p.place_types,
          p.is_featured,
          p.is_private,
          p.view_count,
          p.created_at,
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
      if (featured === 'true') {
        conditions.push(`p.is_featured = true`);
      }
      
      // 私房景點篩選
      if (isPrivate === 'true') {
        conditions.push(`p.is_private = true`);
      }
      
      // 搜尋篩選
      if (search) {
        conditions.push(`(p.name ILIKE $${paramIndex} OR p.formatted_address ILIKE $${paramIndex})`);
        params.push(`%${search}%`);
        paramIndex++;
      }
      
      // 添加條件到 SQL
      if (conditions.length > 0) {
        sql += ` AND ${conditions.join(' AND ')}`;
      }
      
      sql += ` ORDER BY 
        CASE WHEN p.is_featured = true THEN 0 ELSE 1 END,
        p.rating DESC NULLS LAST,
        p.view_count DESC,
        p.created_at DESC
      `;
      
      sql += ` LIMIT $${paramIndex}`;
      params.push(parseInt(limit));
      
      const result = await client.query(sql, params);
      
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
        
        if (place.opening_hours && typeof place.opening_hours === 'string') {
          try {
            place.opening_hours = JSON.parse(place.opening_hours);
          } catch (e) {
            console.error('解析 opening_hours JSON 失敗:', e);
            place.opening_hours = null;
          }
        }
        
        if (place.place_types && typeof place.place_types === 'string') {
          try {
            place.place_types = JSON.parse(place.place_types);
          } catch (e) {
            console.error('解析 place_types JSON 失敗:', e);
            place.place_types = [];
          }
        }
        
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
    console.error('獲取地點列表失敗:', error);
    throw createError({
      statusCode: 500,
      statusMessage: '獲取地點列表失敗'
    });
  }
});
