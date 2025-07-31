import pool from '~/server/utils/db.js';

export default defineEventHandler(async (event) => {
  try {
    const id = getRouterParam(event, 'id');
    const body = await readBody(event);
    const { name, is_active } = body;

    // 驗證 ID
    if (!id || isNaN(parseInt(id))) {
      return {
        success: false,
        error: '無效的項目 ID'
      };
    }

    // 驗證必填欄位
    if (!name) {
      return {
        success: false,
        error: '名稱為必填欄位'
      };
    }

    // 更新項目
    const updateQuery = `
      UPDATE feature_items 
      SET name = $1, is_active = $2, updated_at = CURRENT_TIMESTAMP
      WHERE id = $3
      RETURNING id, name, type, is_active, sort_order, created_at, updated_at
    `;

    const result = await pool.query(updateQuery, [name, is_active, parseInt(id)]);

    if (result.rows.length === 0) {
      return {
        success: false,
        error: '找不到指定的特色項目'
      };
    }

    return {
      success: true,
      data: result.rows[0],
      message: '特色項目更新成功'
    };

  } catch (error) {
    console.error('更新特色項目錯誤:', error);
    
    // 處理重複名稱錯誤
    if (error.code === '23505') {
      return {
        success: false,
        error: '該名稱已存在，請使用不同的名稱'
      };
    }

    return {
      success: false,
      error: '更新特色項目時發生錯誤: ' + error.message
    };
  }
});