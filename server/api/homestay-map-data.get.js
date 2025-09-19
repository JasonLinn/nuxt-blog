import { pool } from '../utils/db.js';

/**
 * 民宿地圖資料 API
 * 提供經緯度座標的民宿資料，用於地圖顯示
 */

export default defineEventHandler(async (event) => {
  try {
    // 設定客戶端編碼為 UTF-8
    await pool.query('SET CLIENT_ENCODING TO UTF8');
    
    const query = getQuery(event);
    
    // 獲取篩選參數
    const filters = {
      area: query.area || '',
      featured_only: query.featured_only === 'true',
      limit: Math.min(parseInt(query.limit) || 50, 100)
    };

    // 建構查詢條件
    const whereConditions = [
      'available = true',
      'status = \'approved\'',
      'latitude IS NOT NULL',
      'longitude IS NOT NULL'
    ];
    
    const params = [];
    let paramIndex = 1;

    // 地區篩選
    if (filters.area) {
      whereConditions.push(`location ILIKE $${paramIndex}`);
      params.push(`%${filters.area}%`);
      paramIndex++;
    }

    // 精選民宿篩選
    if (filters.featured_only) {
      whereConditions.push('featured = true');
    }

    // 建構查詢
    const homestayQuery = `
      SELECT 
        id,
        name,
        location,
        city,
        latitude,
        longitude,
        image_url,
        images,
        website,
        phone,
        min_price,
        max_price,
        average_price,
        rating,
        total_reviews,
        featured,
        capacity_description,
        min_guests,
        max_guests
      FROM homestays
      WHERE ${whereConditions.join(' AND ')}
      ORDER BY 
        featured DESC,
        rating DESC NULLS LAST,
        total_reviews DESC NULLS LAST
      LIMIT $${paramIndex}
    `;

    params.push(filters.limit);

    console.log('執行民宿地圖查詢:', homestayQuery);
    console.log('參數:', params);

    const result = await pool.query(homestayQuery, params);
    const homestays = result.rows;

    // 轉換為地圖資料格式
    const mapData = homestays.map(homestay => {
      // 處理圖片
      let imageUrl = homestay.image_url;
      if (!imageUrl && homestay.images && homestay.images.length > 0) {
        imageUrl = homestay.images[0];
      }

      // 處理價格顯示
      let priceDisplay = '請洽詢';
      if (homestay.min_price && homestay.max_price) {
        if (homestay.min_price === homestay.max_price) {
          priceDisplay = `NT$ ${new Intl.NumberFormat('zh-TW').format(homestay.min_price)}`;
        } else {
          priceDisplay = `NT$ ${new Intl.NumberFormat('zh-TW').format(homestay.min_price)} - ${new Intl.NumberFormat('zh-TW').format(homestay.max_price)}`;
        }
      } else if (homestay.average_price) {
        priceDisplay = `NT$ ${new Intl.NumberFormat('zh-TW').format(homestay.average_price)}`;
      }

      return {
        id: homestay.id,
        title: homestay.name,
        category: 'housing', // 對應地圖的 '住' 類別
        content: homestay.capacity_description || '',
        description: `${homestay.location}${homestay.city ? `, ${homestay.city}` : ''}`,
        position: {
          lat: parseFloat(homestay.latitude),
          lng: parseFloat(homestay.longitude)
        },
        image_url: imageUrl,
        website: homestay.website,
        phone: homestay.phone,
        price: priceDisplay,
        rating: homestay.rating ? parseFloat(homestay.rating) : null,
        total_reviews: homestay.total_reviews || 0,
        featured: homestay.featured || false,
        min_guests: homestay.min_guests,
        max_guests: homestay.max_guests,
        // 添加民宿特有的連結
        detailUrl: `/homestays/${homestay.id}`
      };
    });

    return {
      success: true,
      data: {
        items: mapData,
        total: mapData.length
      },
      source: 'homestay',
      database_info: {
        connection: '✅ 已連接到 Neon 資料庫',
        table: 'homestays',
        total_records: mapData.length,
        has_coordinates: true
      }
    };

  } catch (error) {
    console.error('民宿地圖資料 API 錯誤:', error);
    
    return {
      success: false,
      error: '無法獲取民宿地圖資料',
      details: error.message,
      data: {
        items: [],
        total: 0
      }
    };
  }
});