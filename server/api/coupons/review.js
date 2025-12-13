// 管理員審核優惠券
import { couponPool } from '../../utils/coupon-db.js'

export default defineEventHandler(async (event) => {
  const method = getMethod(event)
  
  try {
    if (method === 'GET') {
      // 獲取所有待審核優惠券
      const client = await couponPool.connect()
      
      try {
        const result = await client.query(`
          SELECT 
            id, title, content, discount_type, discount_value,
            business_name, category, township, address, phone, website,
            cover_image, valid_from, valid_until, min_purchase, max_usage,
            usage_notes, submitter_name, submitter_phone, submitter_email,
            amount, category_id, isonce, isReferral, tags, position, hash,
            cover, adress,
            status, created_at, updated_at
          FROM pending_coupons 
          ORDER BY 
            CASE status 
              WHEN 'pending' THEN 1 
              WHEN 'approved' THEN 2 
              WHEN 'rejected' THEN 3 
            END,
            created_at DESC
        `)

        return {
          success: true,
          data: result.rows
        }
      } finally {
        client.release()
      }
    }
    
    else if (method === 'POST') {
      // 審核優惠券
      const body = await readBody(event)
      const { id, status } = body

      if (!id || !status) {
        throw createError({
          statusCode: 400,
          statusMessage: '缺少必要參數'
        })
      }

      if (!['approved', 'rejected'].includes(status)) {
        throw createError({
          statusCode: 400,
          statusMessage: '無效的狀態值'
        })
      }

      const client = await couponPool.connect()
      
      try {
        await client.query('BEGIN')

        // 更新審核狀態
        const updateResult = await client.query(`
          UPDATE pending_coupons 
          SET status = $1, updated_at = NOW()
          WHERE id = $2 AND status = 'pending'
          RETURNING *
        `, [status, id])

        if (updateResult.rows.length === 0) {
          throw createError({
            statusCode: 404,
            statusMessage: '找不到待審核的優惠券'
          })
        }

        const coupon = updateResult.rows[0]

        // 如果核准，複製到正式優惠券表 (articles)
        if (status === 'approved') {
          // 轉換資料格式以符合 articles 表格結構
          // 注意：pending_coupons 現在已經有與 articles 相容的欄位 (cover, adress, township, position, hash)
          // 如果這些新欄位有值，優先使用；否則回退到舊欄位進行轉換
          
          const articleData = {
            title: coupon.title,
            category: coupon.category || coupon.category_id || 1, // 優先使用 category (字串)，若無則嘗試 category_id
            adress: coupon.adress || (coupon.address ? [coupon.address] : []), // 優先使用 adress 陣列
            township: coupon.township || (typeof coupon.township === 'string' ? [coupon.township] : []), // 優先使用 township 陣列
            content: coupon.content,
            cover: coupon.cover || (coupon.cover_image ? [coupon.cover_image] : []), // 優先使用 cover 陣列
            amount: coupon.amount || 1000, // 使用提交的發放數量
            used_times: 0, // 初始使用次數
            isReferral: coupon.isreferral || false, // 使用提交的設定
            hash: coupon.hash || false, // 使用提交的設定
            isonce: coupon.isonce !== false, // 使用提交的設定
            position: coupon.position, // 現在應該已經是 JSON 格式
            tags: coupon.tags || coupon.business_name || '' // 使用提交的標籤
          }

          // 如果 position 是舊格式字串，嘗試解析 (為了相容舊資料)
          if (typeof articleData.position === 'string') {
             const parsePosition = (positionStr) => {
                if (!positionStr) return null
                try {
                  const coords = positionStr.match(/\d+\.\d+/g)
                  if (coords && coords.length >= 2) {
                    return {
                      lat: parseFloat(coords[0]),
                      lng: parseFloat(coords[1])
                    }
                  }
                } catch (e) {
                  console.error('解析經緯度失敗:', e)
                }
                return null
              }
              articleData.position = parsePosition(articleData.position)
          }

          await client.query(`
            INSERT INTO "article" (
              "title", "category", "adress", "township", "content", "cover", 
              "amount", "used_times", "isReferral", "hash", "isonce", "position", "tags"
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
          `, [
            articleData.title,
            articleData.category,
            articleData.adress,
            articleData.township,
            articleData.content,
            articleData.cover,
            articleData.amount,
            articleData.used_times,
            articleData.isReferral,
            articleData.hash,
            articleData.isonce,
            articleData.position,
            articleData.tags
          ])
        }

        await client.query('COMMIT')

        return {
          success: true,
          message: status === 'approved' ? '優惠券核准成功' : '優惠券已拒絕',
          data: coupon
        }

      } catch (error) {
        await client.query('ROLLBACK')
        throw error
      } finally {
        client.release()
      }
    }

    else {
      throw createError({
        statusCode: 405,
        statusMessage: '不支援的請求方法'
      })
    }

  } catch (error) {
    console.error('審核優惠券失敗:', error)
    
    if (error.statusCode) {
      throw error
    }
    
    throw createError({
      statusCode: 500,
      statusMessage: '審核優惠券失敗，請稍後再試'
    })
  }
})