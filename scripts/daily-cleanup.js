#!/usr/bin/env node
import databaseConfig from '../utils/database-config.cjs';
const { databaseUrl } = databaseConfig;

/**
 * 每日自動清理腳本
 * 可以通過 cron job 或其他排程工具執行
 * 
 * 使用方式:
 * node scripts/daily-cleanup.js
 * 
 * Cron 設定範例 (每天凌晨 1 點執行):
 * 0 1 * * * cd /path/to/your/app && node scripts/daily-cleanup.js
 */

import pg from 'pg';
import dotenv from 'dotenv';
const { Pool } = pg;

// 載入環境變數
dotenv.config();

async function runDailyCleanup() {
  const connectionString = databaseUrl('homestay');
  
  if (!connectionString) {
    console.error('❌ HOMESTAY_DATABASE_URL 環境變數未設定');
    process.exit(1);
  }

  console.log(`🕐 開始每日清理作業 - ${new Date().toISOString()}`);
  
  const pool = new Pool({
    connectionString,
    ssl: { rejectUnauthorized: false }
  });

  try {
    const startTime = Date.now();

    // 執行清理函數
    console.log('🔄 執行清理函數...');
    const cleanupQuery = 'SELECT * FROM cleanup_old_availability_data()';
    const cleanupResult = await pool.query(cleanupQuery);

    const executionTime = Date.now() - startTime;

    // 統計結果
    const stats = {
      total_homestays: cleanupResult.rows.length,
      total_cleaned_dates: cleanupResult.rows.reduce((sum, row) => sum + row.cleaned_dates, 0),
      execution_time_ms: executionTime
    };

    // 記錄清理日誌
    try {
      const logQuery = `
        INSERT INTO cleanup_logs (
          cleanup_date, 
          homestays_processed, 
          dates_cleaned, 
          execution_time_ms,
          created_at
        ) VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)
        ON CONFLICT (cleanup_date) 
        DO UPDATE SET
          homestays_processed = EXCLUDED.homestays_processed,
          dates_cleaned = EXCLUDED.dates_cleaned,
          execution_time_ms = EXCLUDED.execution_time_ms
      `;

      await pool.query(logQuery, [
        new Date().toISOString().split('T')[0],
        stats.total_homestays,
        stats.total_cleaned_dates,
        stats.execution_time_ms
      ]);
    } catch (logError) {
      console.warn('⚠️ 無法記錄清理日誌:', logError.message);
    }

    // 輸出結果
    console.log('✅ 清理作業完成!');
    console.log(`📊 統計資料:`);
    console.log(`   處理民宿數: ${stats.total_homestays}`);
    console.log(`   清理過期資料: ${stats.total_cleaned_dates} 筆`);
    console.log(`   執行時間: ${stats.execution_time_ms}ms`);

    if (cleanupResult.rows.length > 0) {
      console.log(`\n📋 清理詳情:`);
      cleanupResult.rows.forEach(row => {
        if (row.cleaned_dates > 0) {
          console.log(`   民宿 ${row.homestay_id}: 清理 ${row.cleaned_dates} 筆過期資料`);
          console.log(`     新期間: ${row.current_period_start} ~ ${row.current_period_end}`);
        }
      });
    }

    // 發送成功通知 (可擴展)
    await sendNotification('success', stats);

  } catch (error) {
    console.error('❌ 清理作業失敗:', error.message);
    
    // 發送失敗通知 (可擴展)
    await sendNotification('error', { error: error.message });
    
    process.exit(1);
  } finally {
    await pool.end();
    console.log(`🔚 清理作業結束 - ${new Date().toISOString()}`);
  }
}

// 通知函數 (可擴展為 email、Slack 等)
async function sendNotification(type, data) {
  if (process.env.NODE_ENV === 'development') {
    console.log(`📧 通知 (${type}):`, JSON.stringify(data, null, 2));
  }
  
  // 可在此處添加實際的通知邏輯:
  // - 發送 email
  // - 推送到 Slack
  // - 寫入監控系統
  // - 等等...
}

// 執行清理
runDailyCleanup().catch(error => {
  console.error('💥 腳本執行失敗:', error);
  process.exit(1);
});