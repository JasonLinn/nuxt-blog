import { pool } from '../utils/db.js';

// 簡單的記憶體快取
const cache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 分鐘快取

// 產生快取鍵
const getCacheKey = (filters) => {
  return JSON.stringify(filters);
};

// 檢查快取
const getFromCache = (key) => {
  const cached = cache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }
  cache.delete(key);
  return null;
};

// 設置快取
const setCache = (key, data) => {
  cache.set(key, {
    data,
    timestamp: Date.now()
  });

  // 清理過期的快取項目
  if (cache.size > 100) {
    const now = Date.now();
    for (const [cacheKey, value] of cache.entries()) {
      if (now - value.timestamp > CACHE_TTL) {
        cache.delete(cacheKey);
      }
    }
  }
};

export default defineEventHandler(async (event) => {
  try {
    // 設定客戶端編碼為 UTF-8
    await pool.query('SET CLIENT_ENCODING TO UTF8');

    const query = getQuery(event);

    // 設置篩選參數
    const page = Math.max(1, parseInt(query.page) || 1);
    const limit = Math.min(Math.max(1, parseInt(query.limit) || 12), 100); // 預設 12，最大 100
    const offset = (page - 1) * limit;

    const filters = {
      search: query.search || '',
      location: query.location || '',
      type: query.type || '',
      sort_by: query.sort_by || 'rating',
      order: query.order || 'desc',
      featured_only: query.featured_only === 'true',
      is_package: query.is_package || '',
      guest_count: parseInt(query.guest_count) || null,
      themes: query.themes ? (Array.isArray(query.themes) ? query.themes : [query.themes]) : [],
      amenities: query.amenities ? (Array.isArray(query.amenities) ? query.amenities : [query.amenities]) : []
    };

    // 檢查快取 (僅在沒有複雜篩選時使用快取，或者可以針對特定頁碼快取)
    // 為了簡化，這裡暫時只針對沒有搜尋和篩選的請求做快取，或者根據完整參數做快取
    const cacheKey = getCacheKey({ ...filters, page, limit });
    const cachedResult = getFromCache(cacheKey);
    if (cachedResult) {
      return {
        success: true,
        ...cachedResult,
        cached: true,
        cache_timestamp: new Date().toISOString()
      };
    }

    // 建構主查詢的 WHERE 條件
    const whereConditions = ['h.available = true'];
    const params = [];
    let paramIndex = 1;

    // 關鍵字搜尋 (名稱、描述、地點)
    if (filters.search) {
      whereConditions.push(`(
        h.name ILIKE $${paramIndex} OR 
        h.location ILIKE $${paramIndex} OR 
        h.capacity_description ILIKE $${paramIndex} OR
        ${/* 搜尋主題特色陣列轉字串 */ ''}
        h.theme_features::text ILIKE $${paramIndex}
      )`);
      params.push(`%${filters.search}%`);
      paramIndex++;
    }

    // 地點篩選
    if (filters.location) {
      whereConditions.push(`h.location = $${paramIndex}`); // 精確匹配區域，如 "羅東鎮"
      params.push(filters.location);
      paramIndex++;
    }

    if (filters.featured_only) {
      whereConditions.push('h.featured = true');
    }

    // 人數篩選
    if (filters.guest_count) {
      whereConditions.push(`
        (h.min_guests IS NULL OR h.min_guests <= $${paramIndex}) AND 
        (h.max_guests IS NULL OR h.max_guests >= $${paramIndex})
      `);
      params.push(filters.guest_count);
      paramIndex++;
    }

    // 主題特色篩選 (PostgreSQL Array Containment @>)
    if (filters.themes.length > 0) {
      whereConditions.push(`h.theme_features @> $${paramIndex}::jsonb`);
      params.push(JSON.stringify(filters.themes));
      paramIndex++;
    }

    // 服務設施篩選
    if (filters.amenities.length > 0) {
      whereConditions.push(`h.service_amenities @> $${paramIndex}::jsonb`);
      params.push(JSON.stringify(filters.amenities));
      paramIndex++;
    }

    // 包棟篩選 (較複雜，需要 JOIN 或子查詢，這裡使用 EXISTS 優化)
    // 為了效能，這裡假設有 pricing_types 欄位或是關聯查詢
    // 如果沒有 denormalized 欄位，我們用子查詢
    if (filters.is_package) {
      const isPackage = filters.is_package === 'true';
      whereConditions.push(`EXISTS (
        SELECT 1 FROM homestay_pricing hp 
        WHERE hp.homestay_id = h.id AND hp.is_package = $${paramIndex}
      )`);
      params.push(isPackage);
      paramIndex++;
    }

    // 取得總筆數 (用於分頁)
    const countQuery = `
      SELECT COUNT(*) as total
      FROM homestays h
      WHERE ${whereConditions.join(' AND ')}
    `;

    // 注意：params 已經包含了所有 where 條件所需的參數
    // 但因為 countQuery 不需要 limit/offset，所以這裡是安全的

    // 建構 ORDER BY
    const orderMap = {
      'rating': 'h.rating',
      'price': 'h.min_price',
      'name': 'h.name',
      'view_count': 'h.view_count',
      'random': 'RANDOM()' // 如果需要隨機
    };

    const orderBy = orderMap[filters.sort_by] || 'h.rating';
    const orderDirection = filters.order === 'asc' ? 'ASC' : 'DESC';

    // 主查詢
    const mainQuery = `
      SELECT 
        h.id,
        h.name,
        h.location,
        h.city,
        h.image_url,
        h.images,
        h.website,
        h.phone,
        h.social_line,
        h.social_instagram,
        h.social_facebook,
        h.capacity_description,
        h.min_guests,
        h.max_guests,
        h.theme_features,
        h.service_amenities,
        h.min_price,
        h.max_price,
        h.average_price,
        h.rating,
        h.total_reviews,
        h.featured,
        h.view_count
      FROM homestays h
      WHERE ${whereConditions.join(' AND ')}
      ORDER BY ${orderBy} ${orderDirection} NULLS LAST
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;

    // 執行查詢 (並行)
    const [countResult, homestaysResult] = await Promise.all([
      pool.query(countQuery, params), // params 只有 where 條件
      pool.query(mainQuery, [...params, limit, offset]) // 加上 limit 和 offset
    ]);

    const totalCount = parseInt(countResult.rows[0].total);
    const homestays = homestaysResult.rows;

    if (homestays.length === 0) {
      const emptyResult = {
        homestays: [],
        total_count: 0,
        total_pages: 0,
        current_page: page,
        database_info: {
          connection: '✅ 已連接到 Neon 資料庫',
          query_time: new Date().toISOString()
        }
      };
      // 只有在第一頁且無結果時才快取
      if (page === 1) setCache(cacheKey, emptyResult);
      return { success: true, ...emptyResult };
    }

    // 批量獲取民宿類型和價格資訊 (針對當前頁的民宿)
    const homestayIds = homestays.map(h => h.id);

    // 批量查詢價格選項
    const pricingQuery = `
      SELECT 
        homestay_id,
        price_amount,
        is_weekday,
        is_package,
        price_description
      FROM homestay_pricing 
      WHERE homestay_id = ANY($1)
      ORDER BY homestay_id, price_amount
    `;

    const pricingResult = await pool.query(pricingQuery, [homestayIds]);

    // 組織價格資料
    const pricingMap = {};
    pricingResult.rows.forEach(row => {
      if (!pricingMap[row.homestay_id]) {
        pricingMap[row.homestay_id] = [];
      }
      pricingMap[row.homestay_id].push({
        amount: row.price_amount,
        is_weekday: row.is_weekday,
        is_package: row.is_package,
        description: row.price_description
      });
    });

    // 合併資料
    const enrichedHomestays = homestays.map(homestay => {
      // 處理圖片資料
      let imageUrls = [];
      if (homestay.images && Array.isArray(homestay.images) && homestay.images.length > 0) {
        imageUrls = homestay.images.filter(url => url && url.trim());
      } else if (homestay.image_url) {
        imageUrls = [homestay.image_url];
      }

      // 處理價格資訊
      const prices = {
        weekday: homestay.min_price ? `NT$ ${new Intl.NumberFormat('zh-TW').format(homestay.min_price)}` : null,
        weekend: homestay.max_price ? `NT$ ${new Intl.NumberFormat('zh-TW').format(homestay.max_price)}` : null,
        fullRentWeekday: null,
        fullRentWeekend: null
      };

      const pricingOptions = pricingMap[homestay.id] || [];
      pricingOptions.forEach(pricing => {
        const formattedPrice = `NT$ ${new Intl.NumberFormat('zh-TW').format(pricing.amount)}`;
        if (pricing.is_package) {
          if (pricing.is_weekday) {
            prices.fullRentWeekday = formattedPrice;
          } else {
            prices.fullRentWeekend = formattedPrice;
          }
        }
      });

      return {
        ...homestay,
        area: homestay.location,
        address: homestay.city,
        description: homestay.capacity_description,
        image_urls: imageUrls,
        pricing_options: pricingMap[homestay.id] || [],
        features: {
          peopleTypes: [homestay.capacity_description].filter(Boolean),
          themeFeatures: homestay.theme_features || [],
          serviceAmenities: homestay.service_amenities || []
        },
        prices: prices,
        contact: {
          phone: homestay.phone,
          website: homestay.website,
          line: homestay.social_line,
          instagram: homestay.social_instagram,
          facebook: homestay.social_facebook
        }
      };
    });

    const finalResult = {
      homestays: enrichedHomestays,
      total_count: totalCount,
      total_pages: Math.ceil(totalCount / limit),
      current_page: page,
      database_info: {
        connection: '✅ 已連接到 Neon 資料庫',
        project: 'yilan-homestay-real-data',
        query_time: new Date().toISOString(),
        cache_enabled: true
      }
    };

    // 設置快取
    setCache(cacheKey, finalResult);

    return { success: true, ...finalResult };

  } catch (error) {
    console.error('資料庫查詢錯誤:', error);
    return {
      success: false,
      error: '載入民宿資料時發生錯誤: ' + error.message,
      database_info: {
        connection: '❌ 資料庫連接失敗',
        error: error.message
      }
    };
  }
});

// 輔助函數：從容量描述中提取最大人數
function extractMaxGuests(description) {
  if (!description) return null;

  // 尋找最大的數字
  const numbers = description.match(/\d+/g);
  if (numbers) {
    return Math.max(...numbers.map(Number));
  }
  return null;
} 