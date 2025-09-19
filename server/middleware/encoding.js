/**
 * 全域編碼設定中介軟體
 * 確保所有 API 響應都使用正確的 UTF-8 編碼
 */

export default defineEventHandler(async (event) => {
  // 只處理 API 路由
  if (!event.node.req.url?.startsWith('/api/')) {
    return
  }

  // 設定響應標頭
  setHeader(event, 'Content-Type', 'application/json; charset=utf-8')
  
  // 如果是資料庫相關的 API，設定資料庫編碼
  if (event.node.req.url?.includes('fetch') || 
      event.node.req.url?.includes('homestay') ||
      event.node.req.url?.includes('bnb')) {
    
    try {
      // 動態引入資料庫連接
      const { pool } = await import('../utils/db.js')
      
      // 確保資料庫連接使用 UTF-8 編碼
      await pool.query('SET CLIENT_ENCODING TO UTF8')
      await pool.query('SET NAMES utf8')
    } catch (error) {
      console.log('設定資料庫編碼時發生錯誤:', error.message)
    }
  }
})