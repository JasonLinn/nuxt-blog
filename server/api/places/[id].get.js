// 前台 - 取得單個地點的詳細資訊（包含照片、評論等）
import { pool } from '../../utils/db.js';

export default defineEventHandler(async (event) => {
  try {
    const placeId = getRouterParam(event, 'id');
    
    if (!placeId) {
      throw createError({
        statusCode: 400,
        statusMessage: '缺少地點 ID'
      });
    }
    
    const client = await pool.connect();
    
    try {
      // 取得地點詳細資訊
      const placeResult = await client.query(`
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
        WHERE p.id = $1 AND p.status = 'approved'
      `, [placeId]);
      
      if (placeResult.rows.length === 0) {
        throw createError({
          statusCode: 404,
          statusMessage: '找不到該地點'
        });
      }
      
      const place = placeResult.rows[0];
      
      // 處理 JSON 欄位
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
      
      // 確保數值欄位是正確的型別
      if (place.latitude) place.latitude = parseFloat(place.latitude);
      if (place.longitude) place.longitude = parseFloat(place.longitude);
      if (place.rating) place.rating = parseFloat(place.rating);
      if (place.price_level) place.price_level = parseInt(place.price_level);
      
      // 更新瀏覽次數
      await client.query(
        'UPDATE places SET view_count = COALESCE(view_count, 0) + 1 WHERE id = $1',
        [placeId]
      );
      
      return {
        success: true,
        data: place
      };
      
    } finally {
      client.release();
    }
    
  } catch (error) {
    console.error('獲取地點詳細資訊失敗:', error);
    if (error.statusCode) {
      throw error;
    }
    throw createError({
      statusCode: 500,
      statusMessage: '獲取地點詳細資訊失敗'
    });
  }
});