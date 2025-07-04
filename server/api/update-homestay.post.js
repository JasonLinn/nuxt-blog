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

      // 更新民宿基本資訊
      const updateHomestayQuery = `
        UPDATE homestays 
        SET 
          name = $1,
          location = $2,
          city = $3,
          image_url = $4,
          website = $5,
          phone = $6,
          capacity_description = $7,
          min_guests = $8,
          max_guests = $9,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = $10 AND available = true
      `;

      const homestayValues = [
        updateData.name,
        updateData.location,
        updateData.city || null,
        updateData.image_url || null,
        updateData.website || null,
        updateData.phone || null,
        updateData.capacity_description || null,
        updateData.min_guests || null,
        updateData.max_guests || null,
        homestayId
      ];

      const result = await client.query(updateHomestayQuery, homestayValues);

      if (result.rowCount === 0) {
        throw createError({
          statusCode: 404,
          statusMessage: '找不到指定的民宿或無權限修改'
        });
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
          image_url: updateData.image_url,
          capacity_description: updateData.capacity_description,
          min_guests: updateData.min_guests,
          max_guests: updateData.max_guests
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