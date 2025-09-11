// 管理員 - 更新地點
import { pool } from '../../../utils/db.js';

export default defineEventHandler(async (event) => {
  try {
    // 這裡應該加入管理員權限驗證
    // const user = await validateAdminToken(event);
    
    const placeId = getRouterParam(event, 'id');
    const body = await readBody(event);
    
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
      locality,
      administrative_area_level_1,
      phone_number,
      website,
      rating,
      price_level,
      recommended_duration,
      tips,
      images,
      is_featured,
      is_private,
      status,
      google_place_id,
      photos
    } = body;

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
          locality = $8,
          administrative_area_level_1 = $9,
          phone_number = $10,
          website = $11,
          rating = $12,
          price_level = $13,
          recommended_duration = $14,
          tips = $15,
          images = $16,
          is_featured = $17,
          is_private = $18,
          status = $19,
          google_place_id = $20,
          photos = $21,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = $1
        RETURNING *
      `;

      const values = [
        placeId,
        name,
        category_id,
        description,
        formatted_address,
        latitude,
        longitude,
        locality,
        administrative_area_level_1,
        phone_number,
        website,
        rating,
        price_level,
        recommended_duration,
        tips,
        JSON.stringify(images || []),
        is_featured || false,
        is_private || false,
        status || 'pending',
        google_place_id,
        JSON.stringify(photos || [])
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
    console.error('更新地點失敗:', error);
    
    if (error.statusCode) {
      throw error;
    }
    
    throw createError({
      statusCode: 500,
      statusMessage: '更新地點失敗'
    });
  }
});
