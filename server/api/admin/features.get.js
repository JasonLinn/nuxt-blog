import pool from '~/server/utils/db.js';

export default defineEventHandler(async (event) => {
  try {
    // 從資料庫獲取所有特色項目
    const query = `
      SELECT id, name, type, is_active, sort_order, created_at, updated_at
      FROM feature_items 
      ORDER BY type, sort_order, name
    `;

    const result = await pool.query(query);
    
    // 按類型分組
    const themeFeatures = result.rows.filter(item => item.type === 'theme');
    const serviceAmenities = result.rows.filter(item => item.type === 'service');

    return {
      success: true,
      data: {
        themeFeatures: themeFeatures,
        serviceAmenities: serviceAmenities,
        total: result.rows.length
      }
    };

  } catch (error) {
    console.error('獲取特色項目錯誤:', error);
    return {
      success: false,
      error: '載入特色項目時發生錯誤: ' + error.message
    };
  }
});