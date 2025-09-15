// 取得所有推薦行程
import pg from 'pg';
const { Pool } = pg;

// 獲取 Neon 資料庫連接字串
const getConnectionString = () => {
  const config = useRuntimeConfig();
  return config.DATABASE_URL || process.env.DATABASE_URL;
};

export default defineEventHandler(async (event) => {
  try {
    const query = getQuery(event)
    const { days, active = true } = query
    
    const connectionString = getConnectionString();
    
    let sql = `
      SELECT 
        ri.*,
        COALESCE(AVG(ir.rating), 0) as average_rating,
        COUNT(ir.rating) as rating_count
      FROM recommended_itineraries ri
      LEFT JOIN itinerary_ratings ir ON ri.id = ir.itinerary_id
      WHERE ri.is_active = $1
    `
    
    const params = [active]
    
    if (days) {
      sql += ` AND ri.days = $${params.length + 1}`
      params.push(days)
    }
    
    sql += ` GROUP BY ri.id ORDER BY ri.created_at DESC`
    
    const pool = new Pool({
      connectionString,
      ssl: { rejectUnauthorized: false }
    });
    
    try {
      const client = await pool.connect()
      const result = await client.query(sql, params)
      client.release()
      
      const processedData = result.rows.map(row => ({
        ...row,
        average_rating: parseFloat(row.average_rating) || 0,
        rating_count: parseInt(row.rating_count) || 0,
        places: typeof row.places === 'string' ? JSON.parse(row.places) : row.places,
        tags: typeof row.tags === 'string' ? JSON.parse(row.tags) : row.tags
      }))
      
      return {
        success: true,
        data: processedData
      }
    } finally {
      await pool.end()
    }
  } catch (error) {
    console.error('取得推薦行程失敗:', error)
    throw createError({
      statusCode: 500,
      statusMessage: '取得推薦行程失敗'
    })
  }
})
