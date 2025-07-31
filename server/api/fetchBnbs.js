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
    const query = getQuery(event);
    
    // 設置篩選參數 - 只保留有效參數
    const filters = {
      location: query.location || '',
      type: query.type || '',
      sort_by: query.sort_by || 'rating',
      order: query.order || 'desc',
      featured_only: query.featured_only === 'true',
      is_package: query.is_package || '',
      guest_count: parseInt(query.guest_count) || null, // 新增人數篩選
      limit: Math.min(parseInt(query.limit) || 20, 50) // 限制最大值
    };
    
    // 檢查快取
    const cacheKey = getCacheKey(filters);
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

    if (filters.location) {
      whereConditions.push(`h.location ILIKE $${paramIndex}`);
      params.push(`%${filters.location}%`);
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

    // 建構 ORDER BY
    const orderMap = {
      'rating': 'h.rating',
      'price': 'h.min_price',
      'name': 'h.name',
      'view_count': 'h.view_count'
    };
    
    const orderBy = orderMap[filters.sort_by] || 'h.rating';
    const orderDirection = filters.order === 'asc' ? 'ASC' : 'DESC';

    // 優化後的主查詢 - 包含前端所需的完整欄位
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
      ORDER BY ${orderBy} ${orderDirection}
      LIMIT $${paramIndex}
    `;
    
    params.push(filters.limit);

    console.log('執行主查詢:', mainQuery);
    console.log('參數:', params);

    const result = await pool.query(mainQuery, params);
    const homestays = result.rows;

    if (homestays.length === 0) {
      const emptyResult = {
        homestays: [],
        total_count: 0,
        database_info: {
          connection: '✅ 已連接到 Neon 資料庫',
          query_time: new Date().toISOString()
        }
      };
      setCache(cacheKey, emptyResult);
      return { success: true, ...emptyResult };
    }

    // 批量獲取民宿類型和價格資訊
    const homestayIds = homestays.map(h => h.id);
    
    // 批量查詢類型
    const typesQuery = `
      SELECT homestay_id, type_name 
      FROM homestay_types 
      WHERE homestay_id = ANY($1)
      ORDER BY homestay_id, type_name
    `;
    
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

    console.log('執行批量關聯查詢');
    
    const [typesResult, pricingResult] = await Promise.all([
      pool.query(typesQuery, [homestayIds]),
      pool.query(pricingQuery, [homestayIds])
    ]);

    // 組織類型資料
    const typesMap = {};
    typesResult.rows.forEach(row => {
      if (!typesMap[row.homestay_id]) {
        typesMap[row.homestay_id] = [];
      }
      typesMap[row.homestay_id].push(row.type_name);
    });

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

    // 根據類型篩選進行後處理（因為類型在關聯表中）
    let filteredHomestays = homestays;
    if (filters.type) {
      filteredHomestays = homestays.filter(homestay => {
        const types = typesMap[homestay.id] || [];
        return types.some(type => type.includes(filters.type));
      });
    }

    // 根據住宿形式篩選
    if (filters.is_package) {
      const isPackage = filters.is_package === 'true';
      filteredHomestays = filteredHomestays.filter(homestay => {
        const pricing = pricingMap[homestay.id] || [];
        return pricing.some(p => p.is_package === isPackage);
      });
    }

    // 合併資料
    const enrichedHomestays = filteredHomestays.map(homestay => {
      // 處理圖片資料 - 優先使用 images 陣列
      let imageUrls = [];
      if (homestay.images && Array.isArray(homestay.images) && homestay.images.length > 0) {
        // 使用新的 images 陣列，過濾掉空值
        imageUrls = homestay.images.filter(url => url && url.trim());
      } else if (homestay.image_url) {
        // 備用：使用舊的 image_url 欄位
        imageUrls = [homestay.image_url];
      }

      // 處理價格資訊 - 與 fetchBnbDetail 保持一致的格式
      const prices = {
        weekday: homestay.min_price ? `NT$ ${new Intl.NumberFormat('zh-TW').format(homestay.min_price)}` : null,
        weekend: homestay.max_price ? `NT$ ${new Intl.NumberFormat('zh-TW').format(homestay.max_price)}` : null,
        fullRentWeekday: null,
        fullRentWeekend: null
      };

      // 從 pricing_options 中獲取包棟價格
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
        // 前端期待的欄位格式
        area: homestay.location,
        address: homestay.city,
        description: homestay.capacity_description,
        image_urls: imageUrls,
        types: typesMap[homestay.id] || [],
        pricing_options: pricingMap[homestay.id] || [],
        // features 欄位，與 fetchBnbDetail API 保持一致
        features: {
          peopleTypes: [homestay.capacity_description].filter(Boolean),
          environmentTypes: typesMap[homestay.id] || [],
          themeFeatures: homestay.theme_features || [],
          serviceAmenities: homestay.service_amenities || []
        },
        // prices 欄位，與 fetchBnbDetail API 保持一致
        prices: prices,
        // contact 欄位，與 fetchBnbDetail API 保持一致
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
      total_count: enrichedHomestays.length,
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