// 管理員取得推薦行程 (包含未啟用的)
import pg from 'pg';
const { Pool } = pg;
import jwt from 'jsonwebtoken'

// 獲取 Neon 資料庫連接字串
const getConnectionString = () => {
  const config = useRuntimeConfig();
  return config.DATABASE_URL || process.env.DATABASE_URL;
};

export default defineEventHandler(async (event) => {
  try {
    // 檢查管理員權限
    const accessToken = getCookie(event, 'admin_access_token')
    if (!accessToken) {
      throw createError({
        statusCode: 401,
        statusMessage: '需要管理員權限'
      })
    }

    try {
      const decoded = jwt.verify(accessToken, 'JWT_SIGN_SECRET_ADMIN_2024')
      if (!decoded.data || decoded.data.type !== 'admin') {
        throw createError({
          statusCode: 401,
          statusMessage: '需要管理員權限'
        })
      }
    } catch (jwtError) {
      throw createError({
        statusCode: 401,
        statusMessage: '需要管理員權限'
      })
    }
    
    const query = getQuery(event)
    const { days, active } = query
    
    let sql = `
      SELECT 
        ri.*,
        COALESCE(AVG(ir.rating), 0) as average_rating,
        COUNT(ir.rating) as rating_count
      FROM recommended_itineraries ri
      LEFT JOIN itinerary_ratings ir ON ri.id = ir.itinerary_id
      WHERE 1=1
    `
    
    const params = []
    
    if (active !== undefined) {
      sql += ` AND ri.is_active = $${params.length + 1}`
      params.push(active === 'true')
    }
    
    if (days) {
      sql += ` AND ri.days = $${params.length + 1}`
      params.push(days)
    }
    
    sql += ` GROUP BY ri.id ORDER BY ri.created_at DESC`
    
    const connectionString = getConnectionString();
    const pool = new Pool({
      connectionString,
      ssl: { rejectUnauthorized: false }
    });
    
    try {
      const client = await pool.connect()
      const result = await client.query(sql, params)
      client.release()
      
      return {
        success: true,
        data: result.rows.map(row => ({
          ...row,
          average_rating: parseFloat(row.average_rating) || 0,
          rating_count: parseInt(row.rating_count) || 0,
          places: typeof row.places === 'string' ? JSON.parse(row.places) : row.places,
          tags: typeof row.tags === 'string' ? JSON.parse(row.tags) : row.tags
        }))
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
