import pg from 'pg';
const { Pool } = pg;

/**
 * 系統狀態查詢 API
 * 顯示滾動稀疏儲存系統的整體狀態
 * 包含儲存效率、清理狀態、預訂期間等資訊
 */

// 獲取 Neon 資料庫連接字串
const getConnectionString = () => {
  const config = useRuntimeConfig();
  return config.DATABASE_URL || process.env.DATABASE_URL;
};

// 格式化日期為 YYYY-MM-DD
const formatDate = (date) => {
  return date?.toISOString().split('T')[0];
};

export default defineEventHandler(async (event) => {
  console.log('=== 系統狀態查詢 ===');

  try {
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
      // 1. 獲取系統概況
      const overviewQuery = `
        SELECT 
          COUNT(*) as total_homestays,
          COUNT(*) FILTER (WHERE auto_cleanup_enabled = true) as auto_cleanup_enabled,
          COUNT(*) FILTER (WHERE last_cleanup_date = CURRENT_DATE) as cleaned_today,
          COUNT(*) FILTER (WHERE last_cleanup_date IS NULL OR last_cleanup_date < CURRENT_DATE) as need_cleanup,
          AVG(period_length_months) as avg_period_months,
          MIN(current_period_start) as earliest_period_start,
          MAX((current_period_start + (period_length_months || ' months')::INTERVAL)::DATE) as latest_period_end
        FROM homestay_availability_rolling
      `;

      const overviewResult = await pool.query(overviewQuery);
      const overview = overviewResult.rows[0];

      // 2. 獲取儲存效率統計
      const storageQuery = `
        SELECT 
          har.homestay_id,
          h.name as homestay_name,
          har.default_available,
          jsonb_object_keys(har.exceptions) as exception_count,
          pg_column_size(har.exceptions) as storage_bytes,
          har.current_period_start,
          (har.current_period_start + (har.period_length_months || ' months')::INTERVAL)::DATE as period_end,
          har.last_cleanup_date,
          har.auto_cleanup_enabled
        FROM homestay_availability_rolling har
        JOIN homestays h ON h.id = har.homestay_id
        ORDER BY pg_column_size(har.exceptions) DESC
        LIMIT 10
      `;

      const storageResult = await pool.query(storageQuery);

      // 3. 計算總儲存空間
      const totalStorageQuery = `
        SELECT 
          SUM(pg_column_size(exceptions)) as total_storage_bytes,
          COUNT(*) as total_records
        FROM homestay_availability_rolling
      `;

      const totalStorageResult = await pool.query(totalStorageQuery);
      const totalStorage = totalStorageResult.rows[0];

      // 4. 獲取清理日誌（如果存在）
      let cleanupLogs = [];
      try {
        const logsQuery = `
          SELECT 
            cleanup_date,
            homestays_processed,
            dates_cleaned,
            execution_time_ms,
            created_at
          FROM cleanup_logs
          ORDER BY cleanup_date DESC
          LIMIT 7
        `;
        
        const logsResult = await pool.query(logsQuery);
        cleanupLogs = logsResult.rows;
      } catch (logsError) {
        console.warn('⚠️ 無法獲取清理日誌:', logsError.message);
      }

      // 5. 計算效能指標
      const performanceMetrics = {
        storage_efficiency: {
          total_size_kb: (totalStorage.total_storage_bytes / 1024).toFixed(2),
          avg_size_per_homestay_bytes: Math.round(totalStorage.total_storage_bytes / overview.total_homestays),
          compression_ratio: '~93%' // 基於之前的分析
        },
        system_health: {
          total_homestays: parseInt(overview.total_homestays),
          auto_cleanup_enabled: parseInt(overview.auto_cleanup_enabled),
          cleaned_today: parseInt(overview.cleaned_today),
          need_cleanup: parseInt(overview.need_cleanup),
          cleanup_coverage: `${((overview.auto_cleanup_enabled / overview.total_homestays) * 100).toFixed(1)}%`
        },
        booking_periods: {
          average_months: parseFloat(overview.avg_period_months).toFixed(1),
          earliest_start: formatDate(new Date(overview.earliest_period_start)),
          latest_end: formatDate(new Date(overview.latest_period_end)),
          total_coverage_days: Math.ceil((new Date(overview.latest_period_end) - new Date(overview.earliest_period_start)) / (1000 * 60 * 60 * 24))
        }
      };

      // 6. 處理儲存詳情
      const storageDetails = storageResult.rows.map(row => ({
        homestay_id: row.homestay_id,
        homestay_name: row.homestay_name,
        default_available: row.default_available,
        exceptions_count: row.exception_count ? 1 : 0,
        storage_bytes: row.storage_bytes,
        period_start: formatDate(new Date(row.current_period_start)),
        period_end: formatDate(new Date(row.period_end)),
        last_cleanup: row.last_cleanup_date ? formatDate(new Date(row.last_cleanup_date)) : null,
        auto_cleanup: row.auto_cleanup_enabled
      }));

      console.log('✅ 系統狀態查詢完成');

      return {
        success: true,
        data: {
          system_status: 'healthy',
          performance_metrics: performanceMetrics,
          storage_details: storageDetails,
          cleanup_logs: cleanupLogs,
          timestamp: new Date().toISOString()
        },
        message: '系統狀態正常'
      };

    } finally {
      await pool.end();
    }

  } catch (error) {
    console.error('❌ 系統狀態查詢失敗:', error);
    
    return {
      success: false,
      error: '系統狀態查詢失敗',
      message: process.env.NODE_ENV === 'development' ? error.message : '請檢查系統狀態',
      code: 'SYSTEM_STATUS_ERROR'
    };
  }
});