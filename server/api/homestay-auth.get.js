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

    // 獲取價格資料
    const pricingQuery = `
      SELECT 
        price_description,
        price_amount,
        is_weekday,
        is_package
      FROM homestay_pricing 
      WHERE homestay_id = $1
      ORDER BY price_amount
    `;

    const pricingResult = await pool.query(pricingQuery, [homestayId]);

    // 處理價格資料
    const pricing = {
      weekdayRoom: null,
      weekendRoom: null,
      weekdayPackage: null,
      weekendPackage: null
    };

    pricingResult.rows.forEach(row => {
      if (row.is_package) {
        if (row.is_weekday) {
          pricing.weekdayPackage = row.price_amount;
        } else {
          pricing.weekendPackage = row.price_amount;
        }
      } else {
        if (row.is_weekday) {
          pricing.weekdayRoom = row.price_amount;
        } else {
          pricing.weekendRoom = row.price_amount;
        }
      }
    });

    return {
      success: true,
      homestay: {
        ...homestay,
        pricing: pricing
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