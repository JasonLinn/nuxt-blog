import pool from '~/server/utils/db.js';

export default defineEventHandler(async (event) => {
  try {
    const id = getRouterParam(event, 'id');

    // 驗證 ID
    if (!id || isNaN(parseInt(id))) {
      return {
        success: false,
        error: '無效的項目 ID'
      };
    }

    // 檢查項目是否存在
    const checkQuery = `SELECT id, name FROM feature_items WHERE id = $1`;
    const checkResult = await pool.query(checkQuery, [parseInt(id)]);

    if (checkResult.rows.length === 0) {
      return {
        success: false,
        error: '找不到指定的特色項目'
      };
    }

    // 刪除項目
    const deleteQuery = `DELETE FROM feature_items WHERE id = $1`;
    await pool.query(deleteQuery, [parseInt(id)]);

    return {
      success: true,
      message: `特色項目「${checkResult.rows[0].name}」已成功刪除`
    };

  } catch (error) {
    console.error('刪除特色項目錯誤:', error);
    
    // 處理外鍵約束錯誤（如果有民宿正在使用此特色）
    if (error.code === '23503') {
      return {
        success: false,
        error: '無法刪除此項目，因為有民宿正在使用此特色'
      };
    }

    return {
      success: false,
      error: '刪除特色項目時發生錯誤: ' + error.message
    };
  }
});