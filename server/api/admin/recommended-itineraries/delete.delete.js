import pg from 'pg';
import databaseConfig from '../../../../utils/database-config.cjs';
import { requireAdminRole } from '../../../utils/requireRole.js'

// 刪除推薦行程
const { Pool } = pg;
const { databaseUrl } = databaseConfig;

// 獲取 Neon 資料庫連接字串
const getConnectionString = () => {
  return databaseUrl('homestay');
};

export default defineEventHandler(async (event) => {
  try {
    // 檢查管理員權限
    const accessToken = getCookie(event, 'admin_access_token')
    if (!accessToken) {
      throw createError({
        statusCode: 401,
        statusMessage: 'Need admin permission'
      })
    }

    try {
      requireAdminRole(event)
    } catch (jwtError) {
      throw createError({
        statusCode: 401,
        statusMessage: 'Need admin permission'
      })
    }

    const query = getQuery(event)
    const { id } = query

    if (!id) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Missing itinerary ID'
      })
    }

    const connectionString = getConnectionString();
    const pool = new Pool({
      connectionString,
      ssl: { rejectUnauthorized: false }
    });

    try {
      const client = await pool.connect()

      // 檢查行程是否存在
      const checkResult = await client.query(
        'SELECT id, title FROM recommended_itineraries WHERE id = $1',
        [id]
      )

      if (checkResult.rows.length === 0) {
        client.release()
        throw createError({
          statusCode: 404,
          statusMessage: 'Itinerary not found'
        })
      }

      const itinerary = checkResult.rows[0]

      // 先刪除相關的評分記錄
      await client.query(
        'DELETE FROM itinerary_ratings WHERE itinerary_id = $1',
        [id]
      )

      // 刪除推薦行程
      const deleteResult = await client.query(
        'DELETE FROM recommended_itineraries WHERE id = $1',
        [id]
      )

      client.release()

      if (deleteResult.rowCount === 0) {
        throw createError({
          statusCode: 500,
          statusMessage: 'Delete failed'
        })
      }

      return {
        success: true,
        message: `Itinerary "${itinerary.title}" deleted successfully`
      }

    } finally {
      await pool.end()
    }

  } catch (error) {
    console.error('Delete itinerary failed:', error)

    // 如果是已知錯誤，直接拋出
    if (error.statusCode) {
      throw error
    }

    // 未知錯誤
    throw createError({
      statusCode: 500,
      statusMessage: 'Delete itinerary failed'
    })
  }
})