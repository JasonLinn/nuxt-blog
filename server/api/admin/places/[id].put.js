// 管理員 - 更新地點
import { pool } from '../../../utils/db.js';

export default defineEventHandler(async (event) => {
  let requestBody = null;
  
  try {
    // 這裡應該加入管理員權限驗證
    // const user = await validateAdminToken(event);
    
    const placeId = getRouterParam(event, 'id');
    requestBody = await readBody(event);
    
    console.log('更新地點 API 被呼叫:', {
      placeId: placeId,
      method: getMethod(event),
      hasBody: !!requestBody
    });
    
    if (!placeId) {
      throw createError({
        statusCode: 400,
        statusMessage: '地點 ID 為必填欄位'
      });
    }

    const {
      name,
      category_id,
      description,
      formatted_address,
      latitude,
      longitude,
      phone_number,
      website,
      rating,
      price_level,
      recommended_duration,
      tips,
      is_featured,
      is_private,
      status,
      google_place_id,
      photos
    } = requestBody;

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

      // 更新地點
      const updateSql = `
        UPDATE places SET
          name = $2,
          category_id = $3,
          description = $4,
          formatted_address = $5,
          latitude = $6,
          longitude = $7,
          phone_number = $8,
          website = $9,
          rating = $10,
          price_level = $11,
          recommended_duration = $12,
          tips = $13,
          is_featured = $14,
          is_private = $15,
          status = $16,
          google_place_id = $17,
          photos = $18,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = $1
        RETURNING *
      `;

      const values = [
        placeId,
        name,
        category_id ? parseInt(category_id) : null,
        description || null,
        formatted_address || null,
        latitude ? parseFloat(latitude) : null,
        longitude ? parseFloat(longitude) : null,
        phone_number || null,
        website || null,
        rating ? parseFloat(rating) : null,
        price_level && price_level !== "" ? parseInt(price_level) : null,
        recommended_duration ? parseInt(recommended_duration) : null,
        tips || null,
        Boolean(is_featured),
        Boolean(is_private),
        status || 'pending',
        google_place_id || null,
        photos && Array.isArray(photos) ? JSON.stringify(photos) : null
      ];

      const result = await client.query(updateSql, values);
      
      return {
        success: true,
        data: result.rows[0],
        message: '地點已更新'
      };
      
    } finally {
      client.release();
    }

  } catch (error) {
    console.error('更新地點失敗:', {
      placeId: getRouterParam(event, 'id'),
      error: error.message,
      stack: error.stack,
      requestBody: requestBody
    });
    
    if (error.statusCode) {
      throw error;
    }
    
    throw createError({
      statusCode: 500,
      statusMessage: '更新地點失敗: ' + error.message
    });
  }
});
