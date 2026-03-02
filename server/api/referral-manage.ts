import { readBody } from '#imports'
import { pool } from '../utils/db.js'

export default defineEventHandler(async (event) => {
  const method = event.method

  if (method === 'GET') {
    try {
      const result = await pool.query('SELECT code, name FROM referrals ORDER BY code ASC')
      return { success: true, data: result.rows }
    } catch (error) {
      console.error('[referral-manage API] GET error:', error)
      return { success: false, message: '讀取推薦代碼失敗: ' + error.message }
    }
  }

  if (method === 'POST') {
    try {
      const body = await readBody(event)

      if (!Array.isArray(body)) {
        return { success: false, message: 'Data must be an array' }
      }

      const client = await pool.connect()
      try {
        await client.query('BEGIN')

        // Clear existing data since the client sends the entire state
        await client.query('TRUNCATE TABLE referrals')

        // Insert new data
        let inserted = 0
        for (const item of body) {
          if (!item.code || !item.name) continue

          await client.query(`
            INSERT INTO referrals (code, name) 
            VALUES ($1, $2)
          `, [item.code, item.name])

          inserted++
        }

        await client.query('COMMIT')
        console.log(`[referral-manage API] Successfully updated ${inserted} referral codes.`)
      } catch (err) {
        await client.query('ROLLBACK')
        throw err
      } finally {
        client.release()
      }

      return { success: true, message: 'Updated successfully' }
    } catch (error) {
      console.error('[referral-manage API] POST error:', error)
      return { success: false, message: '儲存推薦代碼失敗: ' + error.message }
    }
  }
})
