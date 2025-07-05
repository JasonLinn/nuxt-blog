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

    // 獲取民宿類型
    const typesQuery = `
      SELECT type_name 
      FROM homestay_types 
      WHERE homestay_id = $1
      ORDER BY type_name
    `;
    
    const typesResult = await pool.query(typesQuery, [homestayId]);

    return {
      success: true,
      homestay: {
        ...homestay,
        types: typesResult.rows.map(row => row.type_name)
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