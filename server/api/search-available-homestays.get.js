import pg from 'pg';
const { Pool } = pg;

/**
 * 根據日期搜尋可用民宿 API
 * 支援根據入住和退房日期搜尋可預訂的民宿
 * 
 * Query 參數:
 * - checkIn: 入住日期 (必填, YYYY-MM-DD)
 * - checkOut: 退房日期 (必填, YYYY-MM-DD)
 * - guestCount: 住客人數 (可選)
 * - area: 地區篩選 (可選)
 * - limit: 限制回傳數量 (可選，預設20)
 * - offset: 分頁偏移 (可選，預設0)
 */

// 獲取 Neon 資料庫連接字串
const getConnectionString = () => {
  const config = useRuntimeConfig();
  return config.DATABASE_URL || process.env.DATABASE_URL;
};

// 驗證日期格式
const isValidDate = (dateString) => {
  const date = new Date(dateString);
  return date instanceof Date && !isNaN(date) && dateString.match(/^\d{4}-\d{2}-\d{2}$/);
};

// 格式化日期為 YYYY-MM-DD
const formatDate = (date) => {
  return date.toISOString().split('T')[0];
};

// 生成日期範圍陣列
const getDateRange = (startDate, endDate) => {
  const dates = [];
  const current = new Date(startDate);
  const end = new Date(endDate);
  
  while (current < end) {
    dates.push(formatDate(current));
    current.setDate(current.getDate() + 1);
  }
  
  return dates;
};

export default defineEventHandler(async (event) => {
  const query = getQuery(event);
  const { checkIn, checkOut, guestCount, area, limit = 20, offset = 0 } = query;

  console.log('=== 搜尋可用民宿 API ===');
  console.log('搜尋參數:', { checkIn, checkOut, guestCount, area, limit, offset });

  try {
    // 驗證必填參數
    if (!checkIn || !checkOut) {
      return {
        success: false,
        error: '缺少入住或退房日期參數',
        code: 'MISSING_DATES'
      };
    }

    // 驗證日期格式
    if (!isValidDate(checkIn)) {
      return {
        success: false,
        error: '入住日期格式無效，請使用 YYYY-MM-DD 格式',
        code: 'INVALID_CHECKIN_DATE'
      };
    }

    if (!isValidDate(checkOut)) {
      return {
        success: false,
        error: '退房日期格式無效，請使用 YYYY-MM-DD 格式',
        code: 'INVALID_CHECKOUT_DATE'
      };
    }

    // 驗證日期邏輯
    const checkInDate = new Date(checkIn);
    const checkOutDate = new Date(checkOut);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (checkInDate < today) {
      return {
        success: false,
        error: '入住日期不能是過去的日期',
        code: 'PAST_CHECKIN_DATE'
      };
    }

    if (checkInDate >= checkOutDate) {
      return {
        success: false,
        error: '退房日期必須晚於入住日期',
        code: 'INVALID_DATE_RANGE'
      };
    }

    // 計算住宿天數
    const stayNights = Math.ceil((checkOutDate - checkInDate) / (1000 * 60 * 60 * 24));
    
    if (stayNights > 30) {
      return {
        success: false,
        error: '住宿天數不能超過30天',
        code: 'EXCESSIVE_STAY_DURATION'
      };
    }

    // 連接資料庫
    const connectionString = getConnectionString();
    if (!connectionString) {
      throw new Error('資料庫連接字串未設定');
    }

    const pool = new Pool({
      connectionString,
      ssl: { rejectUnauthorized: false }
    });

    try {
      // 生成入住期間的日期列表
      const stayDates = getDateRange(checkIn, checkOut);
      
      // 建立複雜查詢：找出在指定日期範圍內完全可用的民宿
      let baseQuery = `
        WITH available_homestays AS (
          SELECT 
            h.id,
            h.name,
            h.location as area,
            h.city,
            h.image_url,
            h.images,
            h.min_guests,
            h.max_guests,
            h.theme_features,
            h.service_amenities,
            h.rating,
            h.total_reviews,
            h.view_count,
            h.featured,
            -- 計算該期間所有日期都有可用性記錄且都可用
            COUNT(CASE WHEN ha.is_available = true THEN 1 END) as available_days,
            COUNT(ha.date) as total_availability_records,
            -- 計算價格範圍
            MIN(CASE 
              WHEN ha.special_price IS NOT NULL THEN ha.special_price
              WHEN EXTRACT(DOW FROM ha.date) IN (0, 6) AND ha.weekend_price IS NOT NULL THEN ha.weekend_price
              WHEN EXTRACT(DOW FROM ha.date) NOT IN (0, 6) AND ha.weekday_price IS NOT NULL THEN ha.weekday_price
              ELSE NULL 
            END) as min_price,
            MAX(CASE 
              WHEN ha.special_price IS NOT NULL THEN ha.special_price
              WHEN EXTRACT(DOW FROM ha.date) IN (0, 6) AND ha.weekend_price IS NOT NULL THEN ha.weekend_price
              WHEN EXTRACT(DOW FROM ha.date) NOT IN (0, 6) AND ha.weekday_price IS NOT NULL THEN ha.weekday_price
              ELSE NULL 
            END) as max_price,
            -- 計算平均價格
            AVG(CASE 
              WHEN ha.special_price IS NOT NULL THEN ha.special_price
              WHEN EXTRACT(DOW FROM ha.date) IN (0, 6) AND ha.weekend_price IS NOT NULL THEN ha.weekend_price
              WHEN EXTRACT(DOW FROM ha.date) NOT IN (0, 6) AND ha.weekday_price IS NOT NULL THEN ha.weekday_price
              ELSE NULL 
            END) as avg_price
          FROM homestays h
          INNER JOIN homestay_availability ha ON h.id = ha.homestay_id
          WHERE h.status = 'approved' 
            AND h.available = true
            AND ha.date = ANY($1::date[])
            AND ha.min_stay_nights <= $2
            AND ha.max_stay_nights >= $2
      `;

      let queryParams = [stayDates, stayNights];
      let paramIndex = 2;

      // 加入人數篩選
      if (guestCount && parseInt(guestCount) > 0) {
        paramIndex++;
        baseQuery += ` AND (h.min_guests IS NULL OR h.min_guests <= $${paramIndex})`;
        queryParams.push(parseInt(guestCount));
        
        paramIndex++;
        baseQuery += ` AND (h.max_guests IS NULL OR h.max_guests >= $${paramIndex})`;
        queryParams.push(parseInt(guestCount));
      }

      // 加入地區篩選
      if (area) {
        paramIndex++;
        baseQuery += ` AND h.location = $${paramIndex}`;
        queryParams.push(area);
      }

      baseQuery += `
          GROUP BY h.id, h.name, h.location, h.city, h.image_url, h.min_guests, 
                   h.max_guests, h.theme_features, h.service_amenities, h.rating, 
                   h.total_reviews, h.view_count, h.featured
          HAVING COUNT(CASE WHEN ha.is_available = true THEN 1 END) = $${paramIndex + 1}
        ),
        homestays_without_bookings AS (
          SELECT ah.*
          FROM available_homestays ah
          WHERE NOT EXISTS (
            SELECT 1 
            FROM homestay_bookings hb 
            WHERE hb.homestay_id = ah.id 
              AND hb.booking_status IN ('confirmed', 'pending')
              AND hb.check_in_date < $${paramIndex + 3}
              AND hb.check_out_date > $${paramIndex + 2}
          )
        )
        SELECT 
          *,
          COUNT(*) OVER() as total_count
        FROM homestays_without_bookings
        ORDER BY 
          featured DESC,
          rating DESC NULLS LAST,
          total_reviews DESC,
          view_count DESC
        LIMIT $${paramIndex + 4} OFFSET $${paramIndex + 5}
      `;

      queryParams.push(stayDates.length, checkIn, checkOut, parseInt(limit), parseInt(offset));

      console.log('執行查詢:', baseQuery);
      console.log('查詢參數:', queryParams);

      const result = await pool.query(baseQuery, queryParams);

      // 處理結果
      const homestays = result.rows.map(row => ({
        id: row.id,
        name: row.name,
        area: row.area,
        city: row.city,
        image_url: row.image_url,
        image_urls: row.images || (row.image_url ? [row.image_url] : []),
        min_guests: row.min_guests,
        max_guests: row.max_guests,
        features: {
          themeFeatures: row.theme_features || [],
          serviceAmenities: row.service_amenities || []
        },
        rating: row.rating ? parseFloat(row.rating) : null,
        total_reviews: row.total_reviews || 0,
        view_count: row.view_count || 0,
        featured: row.featured || false,
        prices: {
          min: row.min_price ? parseFloat(row.min_price) : null,
          max: row.max_price ? parseFloat(row.max_price) : null,
          average: row.avg_price ? parseFloat(row.avg_price) : null
        },
        availability_info: {
          available_days: row.available_days,
          required_days: stayDates.length,
          stay_nights: stayNights
        }
      }));

      const totalCount = result.rows.length > 0 ? parseInt(result.rows[0].total_count) : 0;
      const totalPages = Math.ceil(totalCount / parseInt(limit));

      console.log('✅ 搜尋完成:', {
        searchCriteria: { checkIn, checkOut, guestCount, area },
        results: homestays.length,
        totalCount,
        stayNights
      });

      return {
        success: true,
        data: {
          homestays,
          search_criteria: {
            check_in: checkIn,
            check_out: checkOut,
            stay_nights: stayNights,
            guest_count: guestCount ? parseInt(guestCount) : null,
            area: area || null
          },
          pagination: {
            current_page: Math.floor(parseInt(offset) / parseInt(limit)) + 1,
            total_pages: totalPages,
            total_count: totalCount,
            limit: parseInt(limit),
            offset: parseInt(offset)
          }
        }
      };

    } finally {
      await pool.end();
    }

  } catch (error) {
    console.error('❌ 搜尋可用民宿失敗:', error);
    
    return {
      success: false,
      error: '伺服器錯誤',
      message: process.env.NODE_ENV === 'development' ? error.message : '請稍後再試',
      code: 'SERVER_ERROR'
    };
  }
});