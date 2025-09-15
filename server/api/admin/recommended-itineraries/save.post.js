// 管理員建立/更新推薦行程
import { createPool } from '@vercel/postgres'
import jwt from 'jsonwebtoken'

const pool = createPool({
  connectionString: process.env.POSTGRES_URL || process.env.DATABASE_URL
})

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
    
    const body = await readBody(event)
    const { 
      id, 
      title, 
      description, 
      days, 
      image_url, 
      difficulty_level, 
      price_range, 
      tags, 
      places, 
      is_active 
    } = body
    
    // 驗證必要欄位
    if (!title || !days || !places) {
      throw createError({
        statusCode: 400,
        statusMessage: '缺少必要欄位'
      })
    }
    
    const client = await pool.connect()
    let result
    
    if (id) {
      // 更新現有行程
      result = await client.query(`
        UPDATE recommended_itineraries 
        SET title = $1, description = $2, days = $3, image_url = $4,
            difficulty_level = $5, price_range = $6, tags = $7, places = $8,
            is_active = $9, updated_at = CURRENT_TIMESTAMP
        WHERE id = $10
        RETURNING *
      `, [title, description, days, image_url, difficulty_level, price_range, 
          JSON.stringify(tags), JSON.stringify(places), is_active, id])
    } else {
      // 建立新行程
      result = await client.query(`
        INSERT INTO recommended_itineraries 
        (title, description, days, image_url, difficulty_level, price_range, tags, places, is_active)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING *
      `, [title, description, days, image_url, difficulty_level, price_range,
          JSON.stringify(tags), JSON.stringify(places), is_active])
    }
    
    client.release()
    
    return {
      success: true,
      data: result.rows[0],
      message: id ? '行程更新成功' : '行程建立成功'
    }
  } catch (error) {
    console.error('儲存推薦行程失敗:', error)
    throw createError({
      statusCode: 500,
      statusMessage: '儲存推薦行程失敗'
    })
  }
})
