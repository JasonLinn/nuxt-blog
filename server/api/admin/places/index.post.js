// 管理員 - 新增地點
import { pool } from '../../../utils/db.js';

export default defineEventHandler(async (event) => {
  try {
    // 這裡應該加入管理員權限驗證
    // const user = await validateAdminToken(event);
    
    const body = await readBody(event);
    const {
      name,
      category_id,
      description,
      formatted_address,
      latitude,
      longitude,
      phone_number,
      website,
      business_status,
      rating,
      user_ratings_total,
      price_level,
      opening_hours,
      photos,
      place_types,
      place_id,
      google_place_id,
      tips,
      recommended_duration,
      best_visit_time,
      is_featured = false,
      is_private = false,
      tags = [],
      features = []
    } = body;

    // 基本驗證
    if (!name || !category_id) {
      throw createError({
        statusCode: 400,
        statusMessage: '地點名稱和分類為必填欄位'
      });
    }

    // 驗證 category_id 是有效的整數
    const categoryIdInt = parseInt(category_id);
    if (isNaN(categoryIdInt)) {
      throw createError({
        statusCode: 400,
        statusMessage: '分類 ID 必須是有效的整數'
      });
    }

    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // 檢查是否已存在相同的 google_place_id 或 place_id
      if (google_place_id) {
        const existingPlace = await client.query(
          'SELECT id FROM places WHERE google_place_id = $1',
          [google_place_id]
        );
        
        if (existingPlace.rows.length > 0) {
          throw createError({
            statusCode: 400,
            statusMessage: '此 Google 地點已存在'
          });
        }
      }
      
      if (place_id && place_id !== google_place_id) {
        const existingPlace = await client.query(
          'SELECT id FROM places WHERE place_id = $1',
          [place_id]
        );
        
        if (existingPlace.rows.length > 0) {
          throw createError({
            statusCode: 400,
            statusMessage: '此地點已存在'
          });
        }
      }
      
      const sql = `
        INSERT INTO places (
          name, category_id, description, formatted_address,
          latitude, longitude, phone_number, website,
          business_status, rating, user_ratings_total, price_level,
          opening_hours, photos, place_types, place_id, google_place_id,
          tips, recommended_duration, best_visit_time,
          is_featured, is_private, tags, features,
          status, created_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
          $11, $12, $13, $14, $15, $16, $17, $18, $19, $20,
          $21, $22, $23, $24, 'approved', NOW()
        ) RETURNING id
      `;
      
      const values = [
        name, 
        categoryIdInt, 
        description || null, 
        formatted_address || null,
        latitude ? parseFloat(latitude) : null, 
        longitude ? parseFloat(longitude) : null, 
        phone_number || null, 
        website || null,
        business_status || null, 
        rating ? parseFloat(rating) : null, 
        user_ratings_total ? parseInt(user_ratings_total) : null, 
        price_level ? parseInt(price_level) : null,
        opening_hours ? JSON.stringify(opening_hours) : null,
        photos ? JSON.stringify(photos) : null,
        place_types ? JSON.stringify(place_types) : null,
        place_id || null,
        google_place_id || place_id || null,
        tips || null, 
        recommended_duration || null, 
        best_visit_time || null,
        is_featured || false, 
        is_private || false,
        tags ? JSON.stringify(tags) : null,
        features ? JSON.stringify(features) : null
      ];
      
      const result = await client.query(sql, values);
      const newPlaceId = result.rows[0].id;
      
      await client.query('COMMIT');
      
      return {
        success: true,
        data: { id: newPlaceId },
        message: '地點新增成功'
      };
      
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }

  } catch (error) {
    console.error('新增地點失敗:', error);
    
    if (error.statusCode) {
      throw error;
    }
    
    throw createError({
      statusCode: 500,
      statusMessage: '新增地點失敗'
    });
  }
});
