import pg from 'pg';
const { Pool } = pg;

/**
 * 獲取民宿日曆可用性 API (v2 - 使用陣列結構)
 * 支援查詢指定民宿在指定日期範圍內的可用性狀態
 * 
 * Query 參數:
 * - homestayId: 民宿ID (必填)
 * - startDate: 開始日期 (可選，預設為今天)
 * - endDate: 結束日期 (可選，預設為開始日期+30天)
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

// 過濾指定日期範圍的可用性資料
const filterAvailabilityByDateRange = (availabilityData, startDate, endDate) => {
  return availabilityData.filter(item => {
    const itemDate = new Date(item.date);
    const start = new Date(startDate);
    const end = new Date(endDate);
    return itemDate >= start && itemDate <= end;
  });
};

export default defineEventHandler(async (event) => {
  const query = getQuery(event);
  const { homestayId, startDate, endDate } = query;

  console.log('=== 民宿可用性查詢 API v2 ===');
  console.log('參數:', { homestayId, startDate, endDate });

  try {
    // 驗證必填參數
    if (!homestayId) {
      return {
        success: false,
        error: '缺少民宿ID參數',
        code: 'MISSING_HOMESTAY_ID'
      };
    }

    // 設定預設日期範圍
    const today = new Date();
    const defaultStartDate = formatDate(today);
    
    const defaultEndDate = (() => {
      const date = new Date(today);
      date.setDate(date.getDate() + 30);
      return formatDate(date);
    })();

    const queryStartDate = startDate || defaultStartDate;
    const queryEndDate = endDate || defaultEndDate;

    // 驗證日期格式
    if (!isValidDate(queryStartDate)) {
      return {
        success: false,
        error: '開始日期格式無效，請使用 YYYY-MM-DD 格式',
        code: 'INVALID_START_DATE'
      };
    }

    if (!isValidDate(queryEndDate)) {
      return {
        success: false,
        error: '結束日期格式無效，請使用 YYYY-MM-DD 格式',
        code: 'INVALID_END_DATE'
      };
    }

    // 驗證日期邏輯
    if (new Date(queryStartDate) > new Date(queryEndDate)) {
      return {
        success: false,
        error: '開始日期不能晚於結束日期',
        code: 'INVALID_DATE_RANGE'
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
      // 檢查民宿是否存在
      const homestayCheckQuery = `
        SELECT id, name, status, available 
        FROM homestays 
        WHERE (id = $1 OR id::text = $1) 
          AND status = 'approved' 
          AND available = true
      `;
      
      const homestayResult = await pool.query(homestayCheckQuery, [homestayId]);
      
      if (homestayResult.rows.length === 0) {
        return {
          success: false,
          error: '找不到指定的民宿或民宿不可用',
          code: 'HOMESTAY_NOT_FOUND'
        };
      }

      const homestay = homestayResult.rows[0];

      // 查詢民宿的訂房狀態資料
      const availabilityQuery = `
        SELECT 
          availability_data,
          default_available,
          updated_at
        FROM homestay_booking_status
        WHERE homestay_id = $1 OR homestay_id = $1::text
      `;

      const availabilityResult = await pool.query(availabilityQuery, [homestayId]);
      
      if (availabilityResult.rows.length === 0) {
        return {
          success: false,
          error: '找不到民宿的訂房狀態資料',
          code: 'AVAILABILITY_DATA_NOT_FOUND'
        };
      }

      const { availability_data, default_available } = availabilityResult.rows[0];

      // 過濾指定日期範圍的資料
      const filteredAvailability = filterAvailabilityByDateRange(
        availability_data, 
        queryStartDate, 
        queryEndDate
      );

      // 檢查預訂衝突（如果有預訂系統的話）
      const bookingsQuery = `
        SELECT 
          check_in_date,
          check_out_date,
          booking_status
        FROM homestay_bookings
        WHERE (homestay_id = $1 OR homestay_id = $1::text)
          AND booking_status IN ('confirmed', 'pending')
          AND (
            (check_in_date <= $3 AND check_out_date > $2)
          )
        ORDER BY check_in_date ASC
      `;

      const bookingsResult = await pool.query(bookingsQuery, [
        homestayId,
        queryStartDate,
        queryEndDate
      ]);

      // 建立預訂日期的 Set
      const bookedDates = new Set();
      bookingsResult.rows.forEach(booking => {
        const checkIn = new Date(booking.check_in_date);
        const checkOut = new Date(booking.check_out_date);
        
        for (let d = new Date(checkIn); d < checkOut; d.setDate(d.getDate() + 1)) {
          bookedDates.add(formatDate(d));
        }
      });

      // 處理可用性資料
      const processedAvailability = filteredAvailability.map(item => {
        const isBooked = bookedDates.has(item.date);
        const currentDate = new Date(item.date);
        
        return {
          date: item.date,
          is_available: item.available && !isBooked,
          is_booked: isBooked,
          is_weekend: item.is_weekend,
          notes: item.notes,
          day_type: item.is_weekend ? 'weekend' : 'weekday',
          last_updated: item.last_updated
        };
      });

      // 統計資訊
      const stats = {
        total_days: processedAvailability.length,
        available_days: processedAvailability.filter(day => day.is_available).length,
        booked_days: processedAvailability.filter(day => day.is_booked).length,
        unavailable_days: processedAvailability.filter(day => !day.is_available && !day.is_booked).length
      };

      console.log('✅ 成功獲取可用性資料 (v2):', {
        homestayName: homestay.name,
        dateRange: `${queryStartDate} ~ ${queryEndDate}`,
        totalDays: stats.total_days,
        availableDays: stats.available_days
      });

      return {
        success: true,
        data: {
          homestay: {
            id: homestay.id,
            name: homestay.name
          },
          date_range: {
            start: queryStartDate,
            end: queryEndDate
          },
          availability: processedAvailability,
          stats,
          default_available,
          bookings: bookingsResult.rows
        }
      };

    } finally {
      await pool.end();
    }

  } catch (error) {
    console.error('❌ 獲取民宿可用性失敗 (v2):', error);
    
    return {
      success: false,
      error: '伺服器錯誤',
      message: process.env.NODE_ENV === 'development' ? error.message : '請稍後再試',
      code: 'SERVER_ERROR'
    };
  }
});