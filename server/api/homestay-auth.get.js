import jwt from 'jsonwebtoken';
import { pool } from '../utils/db.js';

export default defineEventHandler(async (event) => {
  try {
    const accessToken = getCookie(event, 'homestay_access_token');

    if (!accessToken) {
      throw createError({
        statusCode: 401,
        statusMessage: '未登入'
      });
    }

    // 驗證 JWT Token
    const decoded = jwt.verify(accessToken, 'JWT_SIGN_SECRET_HOMESTAY_2024');
    
    if (!decoded.data || decoded.data.type !== 'homestay') {
      throw createError({
        statusCode: 401,
        statusMessage: '無效的登入狀態'
      });
    }

    const homestayId = decoded.data.id;

    // 獲取完整的民宿資料
    const homestayQuery = `
      SELECT 
        id,
        name,
        location,
        city,
        image_url,
        images,
        website,
        phone,
        social_line,
        social_instagram,
        social_facebook,
        capacity_description,
        min_guests,
        max_guests,
        theme_features,
        service_amenities,
        available,
        status
      FROM homestays
      WHERE id = $1 AND available = true AND status = 'approved'
    `;

    const result = await pool.query(homestayQuery, [homestayId]);
    
    if (result.rows.length === 0) {
      throw createError({
        statusCode: 404,
        statusMessage: '民宿不存在或已停用'
      });
    }

    const homestay = result.rows[0];

    // 調試：檢查從資料庫讀取的特色資料
    console.log('從資料庫讀取的民宿資料:');
    console.log('theme_features:', homestay.theme_features);
    console.log('service_amenities:', homestay.service_amenities);
    console.log('theme_features type:', typeof homestay.theme_features);
    console.log('service_amenities type:', typeof homestay.service_amenities);


    return {
      success: true,
      homestay: {
        ...homestay
      }
    };

  } catch (error) {
    console.error('民宿身份驗證錯誤:', error);
    
    if (error.statusCode) {
      throw error;
    }
    
    throw createError({
      statusCode: 401,
      statusMessage: '身份驗證失敗'
    });
  }
}); 