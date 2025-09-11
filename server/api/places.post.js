import { pool } from '../utils/db.js';

/**
 * 新增地點 API - 支援自動匯入 Google Places 照片
 * 
 * Body 參數:
 * - name: 地點名稱 (必填)
 * - description: 地點描述
 * - address: 地址
 * - latitude: 緯度 (必填)
 * - longitude: 經度 (必填)
 * - category_id: 分類 ID (必填)
 * - google_place_id: Google Place ID (可選)
 * - auto_import_photo: 是否自動匯入照片 (預設 true)
 * - website: 官方網站
 * - phone: 電話
 * - opening_hours: 營業時間 JSON
 * - status: 狀態 (pending/approved/rejected, 預設 pending)
 * - is_featured: 是否精選 (預設 false)
 * - is_private: 是否私人地點 (預設 false)
 */

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event);
    const {
      name,
      description,
      address,
      latitude,
      longitude,
      category_id,
      google_place_id,
      auto_import_photo = true,
      website,
      phone,
      opening_hours,
      status = 'pending',
      is_featured = false,
      is_private = false
    } = body;

    // 驗證必填欄位
    if (!name || !latitude || !longitude || !category_id) {
      throw createError({
        statusCode: 400,
        statusMessage: '地點名稱、座標和分類為必填欄位'
      });
    }

    // 驗證座標格式
    const lat = parseFloat(latitude);
    const lng = parseFloat(longitude);
    
    if (isNaN(lat) || isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      throw createError({
        statusCode: 400,
        statusMessage: '座標格式不正確'
      });
    }

    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');

      let finalGooglePlaceId = google_place_id;
      let imageUrl = null;
      let additionalData = {};

      // 如果需要自動匯入照片且沒有提供 google_place_id，先搜尋地點
      if (auto_import_photo && !google_place_id && name) {
        try {
          console.log(`搜尋地點: ${name} 以獲取 Google Place ID`);
          
          const searchResponse = await $fetch('/api/google/places/search', {
            method: 'POST',
            body: {
              query: name,
              location: {
                lat: lat,
                lng: lng
              }
            }
          });

          if (searchResponse.success && searchResponse.data && searchResponse.data.length > 0) {
            const foundPlace = searchResponse.data[0];
            finalGooglePlaceId = foundPlace.place_id;
            console.log(`找到匹配的 Google Place: ${foundPlace.name}, ID: ${finalGooglePlaceId}`);
          }
        } catch (error) {
          console.warn('搜尋 Google Place 失敗:', error);
        }
      }

      // 如果有 Google Place ID，獲取詳細資訊和照片
      if (auto_import_photo && finalGooglePlaceId) {
        try {
          console.log(`獲取 Google Place 詳細資訊: ${finalGooglePlaceId}`);
          
          const detailsResponse = await $fetch('/api/google/places/details', {
            method: 'POST',
            body: {
              place_id: finalGooglePlaceId,
              fields: [
                'name',
                'formatted_address',
                'photos',
                'rating',
                'user_ratings_total',
                'formatted_phone_number',
                'website',
                'opening_hours'
              ]
            }
          });

          if (detailsResponse.success && detailsResponse.data) {
            const googleData = detailsResponse.data;
            
            // 自動匯入第一張照片作為預設圖片
            if (googleData.photos && googleData.photos.length > 0) {
              imageUrl = googleData.photos[0].url;
              console.log('成功匯入 Google 照片:', imageUrl);
            }

            // 補充其他資訊
            additionalData = {
              google_rating: googleData.rating || null,
              google_rating_count: googleData.user_ratings_total || null,
              formatted_address: googleData.formatted_address || address,
              formatted_phone: googleData.formatted_phone_number || phone,
              google_website: googleData.website || website,
              google_opening_hours: googleData.opening_hours || opening_hours
            };
          }
        } catch (error) {
          console.warn('獲取 Google Place 詳細資訊失敗:', error);
        }
      }

      // 檢查分類是否存在
      const categoryCheck = await client.query(
        'SELECT id FROM place_categories WHERE id = $1 AND is_active = true',
        [category_id]
      );

      if (categoryCheck.rows.length === 0) {
        throw createError({
          statusCode: 400,
          statusMessage: '指定的分類不存在或已停用'
        });
      }

      // 插入新地點
      const insertQuery = `
        INSERT INTO places (
          name,
          description,
          address,
          latitude,
          longitude,
          category_id,
          google_place_id,
          image_url,
          website,
          phone,
          opening_hours,
          rating,
          rating_count,
          status,
          is_featured,
          is_private,
          created_at,
          updated_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
        )
        RETURNING id, name, description, address, latitude, longitude, category_id, 
                  google_place_id, image_url, website, phone, opening_hours, 
                  rating, rating_count, status, is_featured, is_private, 
                  created_at, updated_at
      `;

      const values = [
        name,
        description || null,
        additionalData.formatted_address || address || null,
        lat,
        lng,
        category_id,
        finalGooglePlaceId || null,
        imageUrl || null,
        additionalData.google_website || website || null,
        additionalData.formatted_phone || phone || null,
        additionalData.google_opening_hours || opening_hours || null,
        additionalData.google_rating || null,
        additionalData.google_rating_count || null,
        status,
        is_featured,
        is_private
      ];

      const result = await client.query(insertQuery, values);
      const newPlace = result.rows[0];

      // 提交交易
      await client.query('COMMIT');

      console.log(`新地點建立成功: ID=${newPlace.id}, 名稱=${newPlace.name}`);
      
      // 如果成功匯入了 Google 照片，在回應中註明
      const importInfo = {
        photo_imported: !!imageUrl,
        google_data_enriched: Object.keys(additionalData).length > 0,
        google_place_id_found: !!finalGooglePlaceId
      };

      return {
        success: true,
        message: '地點新增成功' + (imageUrl ? '，已自動匯入 Google 照片' : ''),
        data: newPlace,
        import_info: importInfo
      };

    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }

  } catch (error) {
    console.error('新增地點錯誤:', error);
    
    if (error.statusCode) {
      throw error;
    }
    
    // 處理重複名稱錯誤
    if (error.code === '23505') {
      throw createError({
        statusCode: 409,
        statusMessage: '該地點名稱已存在'
      });
    }
    
    throw createError({
      statusCode: 500,
      statusMessage: '新增地點時發生錯誤'
    });
  }
});
