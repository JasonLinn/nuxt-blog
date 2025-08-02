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

    // 調試：檢查接收到的特色資料
    console.log('接收到的更新資料:');
    console.log('theme_features:', updateData.theme_features);
    console.log('service_amenities:', updateData.service_amenities);
    console.log('theme_features type:', typeof updateData.theme_features);
    console.log('service_amenities type:', typeof updateData.service_amenities);

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

      // 處理價格資料
      let minPrice = null, maxPrice = null, averagePrice = null;
      
      if (updateData.pricing) {
        const prices = [];
        
        // 收集所有價格
        if (updateData.pricing.weekdayRoom) prices.push(parseInt(updateData.pricing.weekdayRoom));
        if (updateData.pricing.weekendRoom) prices.push(parseInt(updateData.pricing.weekendRoom));
        if (updateData.pricing.weekdayPackage) prices.push(parseInt(updateData.pricing.weekdayPackage));
        if (updateData.pricing.weekendPackage) prices.push(parseInt(updateData.pricing.weekendPackage));
        
        if (prices.length > 0) {
          minPrice = Math.min(...prices);
          maxPrice = Math.max(...prices);
          averagePrice = Math.round(prices.reduce((a, b) => a + b, 0) / prices.length);
        }
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
          min_price = $16,
          max_price = $17,
          average_price = $18,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = $19 AND status = 'approved'
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
        minPrice,
        maxPrice,
        averagePrice,
        homestayId
      ];

      const result = await client.query(updateHomestayQuery, homestayValues);

      if (result.rowCount === 0) {
        throw createError({
          statusCode: 404,
          statusMessage: '找不到指定的民宿或無權限修改'
        });
      }

      // 更新詳細價格資料到 homestay_pricing 表
      if (updateData.pricing) {
        // 先刪除舊的價格記錄
        await client.query('DELETE FROM homestay_pricing WHERE homestay_id = $1', [homestayId]);
        
        // 插入新的價格記錄
        const pricingInserts = [];
        
        if (updateData.pricing.weekdayRoom) {
          pricingInserts.push({
            amount: parseInt(updateData.pricing.weekdayRoom),
            isWeekday: true,
            isPackage: false,
            description: '平日住宿'
          });
        }
        
        if (updateData.pricing.weekendRoom) {
          pricingInserts.push({
            amount: parseInt(updateData.pricing.weekendRoom),
            isWeekday: false,
            isPackage: false,
            description: '假日住宿'
          });
        }
        
        if (updateData.pricing.weekdayPackage) {
          pricingInserts.push({
            amount: parseInt(updateData.pricing.weekdayPackage),
            isWeekday: true,
            isPackage: true,
            description: '平日包棟'
          });
        }
        
        if (updateData.pricing.weekendPackage) {
          pricingInserts.push({
            amount: parseInt(updateData.pricing.weekendPackage),
            isWeekday: false,
            isPackage: true,
            description: '假日包棟'
          });
        }
        
        // 批量插入價格記錄
        for (const pricing of pricingInserts) {
          await client.query(`
            INSERT INTO homestay_pricing (
              homestay_id, price_amount, is_weekday, is_package, price_description
            ) VALUES ($1, $2, $3, $4, $5)
          `, [homestayId, pricing.amount, pricing.isWeekday, pricing.isPackage, pricing.description]);
        }
        
        console.log(`已更新 ${pricingInserts.length} 個價格記錄`);
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
          pricing: updateData.pricing || null,
          price_summary: {
            min_price: minPrice,
            max_price: maxPrice,
            average_price: averagePrice
          }
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