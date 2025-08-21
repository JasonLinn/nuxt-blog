import pg from 'pg';
const { Pool } = pg;

/**
 * 管理員更新民宿可用性狀態 API (v2 - 使用陣列結構)
 * 
 * Body 參數:
 * - homestayId: 民宿ID (必填)
 * - updates: 更新陣列 [{ date: 'YYYY-MM-DD', available: boolean, notes?: string }] (必填)
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

export default defineEventHandler(async (event) => {
  // 只允許 POST 方法
  if (getMethod(event) !== 'POST') {
    throw createError({
      statusCode: 405,
      statusMessage: 'Method Not Allowed'
    });
  }

  const body = await readBody(event);
  const { homestayId, updates } = body;

  console.log('=== 管理員更新可用性狀態 API v2 ===');
  console.log('參數:', { homestayId, updates: updates?.length });

  try {
    // 驗證必填參數
    if (!homestayId) {
      return {
        success: false,
        error: '缺少民宿ID參數',
        code: 'MISSING_HOMESTAY_ID'
      };
    }

    if (!updates || !Array.isArray(updates) || updates.length === 0) {
      return {
        success: false,
        error: '缺少更新資料或格式錯誤',
        code: 'INVALID_UPDATES'
      };
    }

    // 驗證更新資料格式
    for (const update of updates) {
      if (!update.date || typeof update.available !== 'boolean') {
        return {
          success: false,
          error: '更新資料格式錯誤，需包含 date 和 available 欄位',
          code: 'INVALID_UPDATE_FORMAT'
        };
      }

      if (!isValidDate(update.date)) {
        return {
          success: false,
          error: `日期格式無效: ${update.date}，請使用 YYYY-MM-DD 格式`,
          code: 'INVALID_DATE_FORMAT'
        };
      }

      // 檢查不能更新過去的日期
      const updateDate = new Date(update.date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (updateDate < today) {
        return {
          success: false,
          error: `不能更新過去的日期: ${update.date}`,
          code: 'CANNOT_UPDATE_PAST_DATE'
        };
      }
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
      // 開始事務
      const client = await pool.connect();
      
      try {
        await client.query('BEGIN');

        // 檢查民宿是否存在
        const homestayCheckQuery = `
          SELECT id, name, status, available 
          FROM homestays 
          WHERE (id = $1 OR id::text = $1)
            AND status = 'approved' 
            AND available = true
        `;
        
        const homestayResult = await client.query(homestayCheckQuery, [homestayId]);
        
        if (homestayResult.rows.length === 0) {
          await client.query('ROLLBACK');
          return {
            success: false,
            error: '找不到指定的民宿或民宿不可用',
            code: 'HOMESTAY_NOT_FOUND'
          };
        }

        const homestay = homestayResult.rows[0];

        // 獲取當前的可用性資料
        const getCurrentDataQuery = `
          SELECT availability_data, default_available
          FROM homestay_booking_status
          WHERE homestay_id = $1 OR homestay_id = $1::text
        `;

        const currentDataResult = await client.query(getCurrentDataQuery, [homestayId]);
        
        if (currentDataResult.rows.length === 0) {
          await client.query('ROLLBACK');
          return {
            success: false,
            error: '找不到民宿的訂房狀態資料',
            code: 'AVAILABILITY_DATA_NOT_FOUND'
          };
        }

        let { availability_data } = currentDataResult.rows[0];

        // 檢查預訂衝突
        const conflictingBookings = [];
        
        for (const update of updates) {
          if (update.available) continue; // 只檢查要設為不可用的日期
          
          const bookingCheckQuery = `
            SELECT booking_reference, guest_name, check_in_date, check_out_date
            FROM homestay_bookings
            WHERE (homestay_id = $1 OR homestay_id = $1::text)
              AND booking_status IN ('confirmed', 'pending')
              AND check_in_date <= $2 
              AND check_out_date > $2
          `;
          
          const bookingResult = await client.query(bookingCheckQuery, [homestayId, update.date]);
          
          if (bookingResult.rows.length > 0) {
            conflictingBookings.push({
              date: update.date,
              bookings: bookingResult.rows
            });
          }
        }

        if (conflictingBookings.length > 0) {
          await client.query('ROLLBACK');
          return {
            success: false,
            error: '以下日期有已確認的預訂，無法設為不可用',
            code: 'BOOKING_CONFLICT',
            conflicts: conflictingBookings
          };
        }

        // 更新可用性資料
        const updatedData = [...availability_data];
        const updateResults = [];

        for (const update of updates) {
          // 找到對應日期的資料索引
          const dateIndex = updatedData.findIndex(item => item.date === update.date);
          
          if (dateIndex !== -1) {
            // 更新現有資料
            updatedData[dateIndex] = {
              ...updatedData[dateIndex],
              available: update.available,
              notes: update.notes || updatedData[dateIndex].notes,
              last_updated: new Date().toISOString()
            };
            
            updateResults.push({
              date: update.date,
              available: update.available,
              action: 'updated'
            });
          } else {
            // 新增資料（如果日期不在原始範圍內）
            const dateObj = new Date(update.date);
            const isWeekend = dateObj.getDay() === 0 || dateObj.getDay() === 6;
            
            updatedData.push({
              date: update.date,
              available: update.available,
              is_weekend: isWeekend,
              notes: update.notes || null,
              last_updated: new Date().toISOString()
            });
            
            updateResults.push({
              date: update.date,
              available: update.available,
              action: 'created'
            });
          }
        }

        // 按日期排序
        updatedData.sort((a, b) => new Date(a.date) - new Date(b.date));

        // 更新資料庫
        const updateQuery = `
          UPDATE homestay_booking_status 
          SET 
            availability_data = $2,
            updated_at = CURRENT_TIMESTAMP
          WHERE homestay_id = $1 OR homestay_id = $1::text
        `;
        
        await client.query(updateQuery, [homestayId, JSON.stringify(updatedData)]);

        // 提交事務
        await client.query('COMMIT');

        console.log('✅ 成功更新可用性狀態 (v2):', {
          homestayName: homestay.name,
          updatesCount: updateResults.length
        });

        return {
          success: true,
          data: {
            homestay: {
              id: homestay.id,
              name: homestay.name
            },
            updates: updateResults,
            updated_count: updateResults.length
          },
          message: `成功更新 ${updateResults.length} 筆可用性狀態`
        };

      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      } finally {
        client.release();
      }

    } finally {
      await pool.end();
    }

  } catch (error) {
    console.error('❌ 更新可用性狀態失敗 (v2):', error);
    
    return {
      success: false,
      error: '伺服器錯誤',
      message: process.env.NODE_ENV === 'development' ? error.message : '請稍後再試',
      code: 'SERVER_ERROR'
    };
  }
});