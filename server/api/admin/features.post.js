import pool from '~/server/utils/db.js';

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event);
    const { name, type, is_active = true } = body;

    // 驗證必填欄位
    if (!name || !type) {
      return {
        success: false,
        error: '名稱和類型為必填欄位'
      };
    }

    // 驗證類型
    if (!['theme', 'service'].includes(type)) {
      return {
        success: false,
        error: '類型必須是 theme 或 service'
      };
    }

    // 獲取該類型的最大排序值
    const sortOrderQuery = `
      SELECT COALESCE(MAX(sort_order), 0) + 1 as next_sort_order 
      FROM feature_items 
      WHERE type = $1
    `;
    const sortResult = await pool.query(sortOrderQuery, [type]);
    const sortOrder = sortResult.rows[0].next_sort_order;

    // 插入新項目
    const insertQuery = `
      INSERT INTO feature_items (name, type, is_active, sort_order)
      VALUES ($1, $2, $3, $4)
      RETURNING id, name, type, is_active, sort_order, created_at, updated_at
    `;

    const result = await pool.query(insertQuery, [name, type, is_active, sortOrder]);

    return {
      success: true,
      data: result.rows[0],
      message: '特色項目新增成功'
    };

  } catch (error) {
    console.error('新增特色項目錯誤:', error);
    
    // 處理重複名稱錯誤
    if (error.code === '23505') {
      return {
        success: false,
        error: '該名稱已存在，請使用不同的名稱'
      };
    }

    return {
      success: false,
      error: '新增特色項目時發生錯誤: ' + error.message
    };
  }
});