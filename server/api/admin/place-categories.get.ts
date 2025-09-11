import { pool } from '~/server/utils/db.js'

export default defineEventHandler(async (event) => {
  try {
    const client = await pool.connect()
    
    try {
      const result = await client.query(`
        SELECT 
          pc.id,
          pc.name,
          pc.description,
          pc.sort_order,
          COUNT(p.id) as place_count
        FROM place_categories pc
        LEFT JOIN places p ON p.category_id = pc.id AND p.status = 'approved'
        GROUP BY pc.id, pc.name, pc.description, pc.sort_order
        ORDER BY pc.sort_order ASC, pc.name ASC
      `)
      
      return {
        success: true,
        data: result.rows
      }
    } finally {
      client.release()
    }
  } catch (error) {
    console.error('獲取分類失敗:', error)
    throw createError({
      statusCode: 500,
      statusMessage: '獲取分類失敗'
    })
  }
})
