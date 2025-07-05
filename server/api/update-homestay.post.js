import jwt from 'jsonwebtoken';
import { pool } from '../utils/db.js';

export default defineEventHandler(async (event) => {
  try {
    // 驗證登入狀態
    const accessToken = getCookie(event, 'homestay_access_token');
    
    if (!accessToken) {
      throw createError({
        statusCode: 401,
        statusMessage: '未登入'
      });
    }

    const decoded = jwt.verify(accessToken, 'JWT_SIGN_SECRET_HOMESTAY_2024');
    
    if (!decoded.data || decoded.data.type !== 'homestay') {
      throw createError({
        statusCode: 401,
        statusMessage: '無效的登入狀態'
      });
    }

    const homestayId = decoded.data.id;
    const updateData = await readBody(event);

    // 驗證必要欄位
    if (!updateData.name || !updateData.location) {
      throw createError({
        statusCode: 400,
        statusMessage: '民宿名稱和位置為必填欄位'
      });
    }

    // 開始交易
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');

      // 處理圖片資料 - 支援新的 images 陣列和舊的 image_url
      let finalImages = [];
      let primaryImageUrl = '';
      
      if (updateData.images && Array.isArray(updateData.images) && updateData.images.length > 0) {
        // 如果有新的圖片陣列，使用它
        finalImages = updateData.images.filter(url => url && url.trim());
        primaryImageUrl = finalImages[0] || '';
      } else if (updateData.image_url) {
        // 如果沒有新的圖片陣列但有舊的單一圖片URL，使用它
        finalImages = [updateData.image_url];
        primaryImageUrl = updateData.image_url;
      }

      // 更新民宿基本資訊
      const updateHomestayQuery = `
        UPDATE homestays 
        SET 
          name = $1,
          location = $2,
          city = $3,
          image_url = $4,
          images = $5,
          website = $6,
          phone = $7,
          social_line = $8,
          social_instagram = $9,
          social_facebook = $10,
          capacity_description = $11,
          min_guests = $12,
          max_guests = $13,
          theme_features = $14,
          service_amenities = $15,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = $16 AND status = 'approved'
      `;

      const homestayValues = [
        updateData.name,
        updateData.location,
        updateData.city || null,
        primaryImageUrl || null,
        finalImages, // PostgreSQL 陣列
        updateData.website || null,
        updateData.phone || null,
        updateData.social?.line || null,
        updateData.social?.instagram || null,
        updateData.social?.facebook || null,
        updateData.capacity_description || null,
        updateData.min_guests || null,
        updateData.max_guests || null,
        JSON.stringify(updateData.theme_features || []),
        JSON.stringify(updateData.service_amenities || []),
        homestayId
      ];

      const result = await client.query(updateHomestayQuery, homestayValues);

      if (result.rowCount === 0) {
        throw createError({
          statusCode: 404,
          statusMessage: '找不到指定的民宿或無權限修改'
        });
      }

      // 處理環境類型更新
      if (updateData.types && Array.isArray(updateData.types)) {
        // 先刪除現有的類型
        await client.query('DELETE FROM homestay_types WHERE homestay_id = $1', [homestayId]);
        
        // 插入新的類型
        if (updateData.types.length > 0) {
          const typeQueries = updateData.types.map(type => 
            client.query(
              'INSERT INTO homestay_types (homestay_id, type_name) VALUES ($1, $2)',
              [homestayId, type]
            )
          );
          await Promise.all(typeQueries);
        }
      }

      // 提交交易
      await client.query('COMMIT');

      return {
        success: true,
        message: '民宿資料更新成功',
        updated_fields: {
          name: updateData.name,
          location: updateData.location,
          city: updateData.city,
          phone: updateData.phone,
          website: updateData.website,
          social: updateData.social || {},
          image_url: primaryImageUrl,
          images: finalImages,
          capacity_description: updateData.capacity_description,
          min_guests: updateData.min_guests,
          max_guests: updateData.max_guests,
          types: updateData.types || []
        }
      };

    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }

  } catch (error) {
    console.error('更新民宿資料錯誤:', error);
    
    if (error.statusCode) {
      throw error;
    }
    
    throw createError({
      statusCode: 500,
      statusMessage: '更新民宿資料時發生錯誤'
    });
  }
}); 