// 前台 - 取得地點分類（供使用者瀏覽）
import { pool } from '../utils/db.js';

export default defineEventHandler(async (event) => {
  try {
    const client = await pool.connect();
    
    try {
      const sql = `
        SELECT 
          pc.id,
          pc.name,
          pc.icon,
          pc.color,
          pc.description,
          COUNT(p.id) as place_count
        FROM place_categories pc
        LEFT JOIN places p ON pc.id = p.category_id AND p.status = 'approved'
        WHERE pc.is_active = true
        GROUP BY pc.id, pc.name, pc.icon, pc.color, pc.description
        ORDER BY pc.sort_order ASC, pc.name ASC
      `;
      
      const result = await client.query(sql);
      
      const categories = result.rows.map(row => ({
        id: row.id,
        name: row.name,
        icon: row.icon,
        color: row.color,
        description: row.description,
        place_count: parseInt(row.place_count || 0)
      }));

      return {
        success: true,
        data: categories
      };
       
    } finally {
      client.release();
    }

  } catch (error) {
    console.error('取得分類列表失敗:', error);
    throw createError({
      statusCode: 500,
      statusMessage: '取得分類列表失敗'
    });
  }
});
