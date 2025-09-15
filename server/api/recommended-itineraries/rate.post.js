// 對推薦行程評分
import { createPool } from '@vercel/postgres'

const pool = createPool({
  connectionString: process.env.POSTGRES_URL || process.env.DATABASE_URL
})

export default defineEventHandler(async (event) => {
  if (!isMethod(event, 'POST')) {
    throw createError({
      statusCode: 405,
      statusMessage: '僅支援 POST 方法'
    })
  }

  try {
    const body = await readBody(event)
    const { itinerary_id, rating, comment } = body
    
    // 取得使用者資訊 (IP 和 session)
    const clientIP = getClientIP(event)
    const userSession = getCookie(event, 'user-session') || `anonymous_${Date.now()}`
    
    // 驗證評分
    if (!itinerary_id || !rating || rating < 1 || rating > 5) {
      throw createError({
        statusCode: 400,
        statusMessage: '無效的評分資料'
      })
    }
    
    const client = await pool.connect()
    
    // 檢查是否已經評分過 (同一個 session 或 IP)
    const existingRating = await client.query(`
      SELECT id FROM itinerary_ratings 
      WHERE itinerary_id = $1 AND (user_session = $2 OR user_ip = $3)
    `, [itinerary_id, userSession, clientIP])
    
    if (existingRating.rows.length > 0) {
      // 更新現有評分
      await client.query(`
        UPDATE itinerary_ratings 
        SET rating = $1, comment = $2, created_at = CURRENT_TIMESTAMP
        WHERE itinerary_id = $3 AND (user_session = $4 OR user_ip = $5)
      `, [rating, comment, itinerary_id, userSession, clientIP])
    } else {
      // 新增評分
      await client.query(`
        INSERT INTO itinerary_ratings (itinerary_id, user_session, user_ip, rating, comment)
        VALUES ($1, $2, $3, $4, $5)
      `, [itinerary_id, userSession, clientIP, rating, comment])
    }
    
    client.release()
    
    // 設置 session cookie
    setCookie(event, 'user-session', userSession, {
      maxAge: 60 * 60 * 24 * 30, // 30 天
      httpOnly: true,
      sameSite: 'lax'
    })
    
    return {
      success: true,
      message: '評分成功'
    }
  } catch (error) {
    console.error('評分失敗:', error)
    throw createError({
      statusCode: 500,
      statusMessage: '評分失敗'
    })
  }
})
