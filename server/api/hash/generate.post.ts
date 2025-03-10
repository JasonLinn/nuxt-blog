import { defineEventHandler, readBody, createError } from 'h3'
import pg from 'pg'
import dotenv from 'dotenv'

// 加載環境變量
dotenv.config()

// 創建數據庫連接池
const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL
})

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)
    const { articleId } = body

    if (!articleId) {
      throw createError({
        statusCode: 400,
        message: '缺少必要參數'
      })
    }

    // 從數據庫獲取可用的 hash
    const client = await pool.connect()
    try {
      await client.query('BEGIN')
      
      // 獲取第一個可用的 hash
      const result = await client.query(`
        SELECT id, index_number, hash_value 
        FROM available_hash 
        LIMIT 1
        FOR UPDATE
      `)

      if (result.rows.length === 0) {
        await client.query('ROLLBACK')
        throw createError({
          statusCode: 400,
          message: '目前沒有可用的序號'
        })
      }

      const hash = result.rows[0]
      
      // 從可用列表中刪除
      await client.query(
        'DELETE FROM available_hash WHERE id = $1',
        [hash.id]
      )
      
      // 記錄使用情況
      await client.query(
        'INSERT INTO used_hash (index_number, hash_value, article_id) VALUES ($1, $2, $3)',
        [hash.index_number, hash.hash_value, articleId]
      )
      
      await client.query('COMMIT')
      
      return {
        success: true,
        hash: hash.hash_value,
        index: hash.index_number
      }
    } catch (error: any) {
      await client.query('ROLLBACK')
      throw error
    } finally {
      client.release()
    }
  } catch (error: any) {
    console.error('Generate hash error:', error)
    
    // 如果是已知的錯誤，直接返回
    if (error.statusCode) {
      throw error
    }
    
    // 其他未知錯誤
    throw createError({
      statusCode: 500,
      message: error.message || '生成序號失敗'
    })
  }
}) 