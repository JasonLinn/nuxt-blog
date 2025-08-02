import jwt from 'jsonwebtoken';
import { pool } from '../utils/db.js';

export default defineEventHandler(async (event) => {
  try {
    // 驗證管理員身份
    const accessToken = getCookie(event, 'admin_access_token');
    
    if (!accessToken) {
      throw createError({
        statusCode: 401,
        statusMessage: '未登入'
      });
    }

    const decoded = jwt.verify(accessToken, 'JWT_SIGN_SECRET_ADMIN_2024');
    
    if (!decoded.data || decoded.data.type !== 'admin') {
      throw createError({
        statusCode: 401,
        statusMessage: '無權限訪問'
      });
    }

    const body = await readBody(event);
    const { homestayId, pricing } = body;

    if (!homestayId || !pricing) {
      throw createError({
        statusCode: 400,
        statusMessage: '缺少必要參數'
      });
    }

    // 開始交易
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');

      // 處理價格資料
      let minPrice = null, maxPrice = null, averagePrice = null;
      const prices = [];
      
      // 收集所有價格
      if (pricing.weekdayRoom) prices.push(parseInt(pricing.weekdayRoom));
      if (pricing.weekendRoom) prices.push(parseInt(pricing.weekendRoom));
      if (pricing.weekdayPackage) prices.push(parseInt(pricing.weekdayPackage));
      if (pricing.weekendPackage) prices.push(parseInt(pricing.weekendPackage));
      
      if (prices.length > 0) {
        minPrice = Math.min(...prices);
        maxPrice = Math.max(...prices);
        averagePrice = Math.round(prices.reduce((a, b) => a + b, 0) / prices.length);
      }

      // 更新 homestays 表的價格欄位
      await client.query(`
        UPDATE homestays 
        SET min_price = $1, max_price = $2, average_price = $3, updated_at = CURRENT_TIMESTAMP
        WHERE id = $4
      `, [minPrice, maxPrice, averagePrice, homestayId]);

      // 先刪除舊的價格記錄
      await client.query('DELETE FROM homestay_pricing WHERE homestay_id = $1', [homestayId]);
      
      // 插入新的價格記錄
      const pricingInserts = [];
      
      if (pricing.weekdayRoom) {
        pricingInserts.push({
          amount: parseInt(pricing.weekdayRoom),
          isWeekday: true,
          isPackage: false,
          description: '平日住宿'
        });
      }
      
      if (pricing.weekendRoom) {
        pricingInserts.push({
          amount: parseInt(pricing.weekendRoom),
          isWeekday: false,
          isPackage: false,
          description: '假日住宿'
        });
      }
      
      if (pricing.weekdayPackage) {
        pricingInserts.push({
          amount: parseInt(pricing.weekdayPackage),
          isWeekday: true,
          isPackage: true,
          description: '平日包棟'
        });
      }
      
      if (pricing.weekendPackage) {
        pricingInserts.push({
          amount: parseInt(pricing.weekendPackage),
          isWeekday: false,
          isPackage: true,
          description: '假日包棟'
        });
      }
      
      // 批量插入價格記錄
      for (const pricingData of pricingInserts) {
        await client.query(`
          INSERT INTO homestay_pricing (
            homestay_id, price_amount, is_weekday, is_package, price_description
          ) VALUES ($1, $2, $3, $4, $5)
        `, [homestayId, pricingData.amount, pricingData.isWeekday, pricingData.isPackage, pricingData.description]);
      }

      // 提交交易
      await client.query('COMMIT');

      return {
        success: true,
        message: `民宿 ${homestayId} 價格資料已修復`,
        pricing_summary: {
          min_price: minPrice,
          max_price: maxPrice,
          average_price: averagePrice,
          pricing_records: pricingInserts.length
        }
      };

    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }

  } catch (error) {
    console.error('修復價格錯誤:', error);
    
    if (error.statusCode) {
      throw error;
    }
    
    throw createError({
      statusCode: 500,
      statusMessage: '系統錯誤，請稍後重試'
    });
  }
});