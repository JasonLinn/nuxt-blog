import { requireAdmin } from '../utils/admin-auth.js'
import { readBody } from 'h3'
import { pool } from '../utils/db.js'
import { availableReferralCodes, referralRevision, validateReferralItems } from '../utils/referral-management.js'

export default defineEventHandler(async (event) => {
  requireAdmin(event)
  const method = event.method

  if (method === 'GET') {
    try {
      const result = await pool.query('SELECT code, name FROM referrals ORDER BY code ASC')
      return {
        success: true,
        data: result.rows,
        revision: referralRevision(result.rows),
        availableCodes: availableReferralCodes(result.rows)
      }
    } catch (error) {
      console.error('[referral-manage API] GET error:', error)
      return { success: false, message: '讀取推薦代碼失敗: ' + error.message }
    }
  }

  if (method === 'POST') {
    try {
      const body = await readBody(event)

      if (!body || typeof body.revision !== 'string') {
        return { success: false, message: '請重新載入頁面後再儲存，以確認代碼尚未被使用。' }
      }
      let items
      try {
        items = validateReferralItems(body.items)
      } catch (error) {
        return { success: false, message: error.message }
      }

      const client = await pool.connect()
      try {
        await client.query('BEGIN')

        // Serialize writers and reject stale lists before replacing any data.
        await client.query('LOCK TABLE referrals IN EXCLUSIVE MODE')
        const current = await client.query('SELECT code, name FROM referrals ORDER BY code ASC')
        if (referralRevision(current.rows) !== body.revision) {
          await client.query('ROLLBACK')
          return { success: false, message: '推薦代碼已被其他視窗更新，本次未儲存。請先保留輸入內容，再重新載入清單，避免重複分配或覆蓋資料。' }
        }

        // Clear existing data since the client sends the entire state
        await client.query('TRUNCATE TABLE referrals')

        // Insert new data
        let inserted = 0
        for (const item of items) {
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
