// 使用者提交優惠券
import { couponPool } from '../../utils/coupon-db.js'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { randomUUID } from 'crypto'

export default defineEventHandler(async (event) => {
  try {
    const formData = await readMultipartFormData(event)
    
    if (!formData || formData.length === 0) {
      throw createError({
        statusCode: 400,
        statusMessage: '無效的表單資料'
      })
    }

    // 解析表單資料
    const data = {}
    let imageFile = null

    formData.forEach(item => {
      if (item.name === 'cover_image' && item.filename) {
        imageFile = item
      } else if (item.name && item.data) {
        data[item.name] = item.data.toString()
      }
    })

    // 必填欄位驗證
    const requiredFields = ['title', 'content', 'business_name', 'submitter_name', 'submitter_phone']
    for (const field of requiredFields) {
      if (!data[field] || data[field].trim() === '') {
        throw createError({
          statusCode: 400,
          statusMessage: `缺少必填欄位: ${field}`
        })
      }
    }

    let coverImageUrl = null

    // 處理圖片上傳
    if (imageFile) {
      try {
        const fileExtension = imageFile.filename.split('.').pop()
        const fileName = `${randomUUID()}.${fileExtension}`
        const uploadDir = join(process.cwd(), 'public', 'uploads', 'coupons')
        
        // 確保上傳目錄存在
        await mkdir(uploadDir, { recursive: true })
        
        const filePath = join(uploadDir, fileName)
        await writeFile(filePath, imageFile.data)
        
        coverImageUrl = `/uploads/coupons/${fileName}`
      } catch (uploadError) {
        console.error('圖片上傳失敗:', uploadError)
        // 不阻止提交，但記錄錯誤
      }
    }

    const client = await couponPool.connect()
    
    try {
    // 插入優惠券資料到資料庫
    const result = await client.query(`
      INSERT INTO pending_coupons (
        title, content, discount_type, discount_value,
        business_name, category, township, address, phone, website,
        cover_image, valid_from, valid_until, min_purchase, max_usage,
        usage_notes, submitter_name, submitter_phone, submitter_email,
        amount, category_id, isonce, isReferral, tags, position,
        status, created_at, updated_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
        $11, $12, $13, $14, $15, $16, $17, $18, $19,
        $20, $21, $22, $23, $24, $25,
        'pending', NOW(), NOW()
      ) RETURNING id
    `, [
      data.title,
      data.content,
      data.discount_type || 'percentage',
      data.discount_value ? parseFloat(data.discount_value) : null,
      data.business_name,
      data.category || null,
      data.township || null,
      data.address || null,
      data.phone || null,
      data.website || null,
      coverImageUrl,
      data.valid_from || null,
      data.valid_until || null,
      data.min_purchase ? parseFloat(data.min_purchase) : 0,
      data.max_usage ? parseInt(data.max_usage) : null,
      data.usage_notes || null,
      data.submitter_name,
      data.submitter_phone,
      data.submitter_email || null,
      data.amount ? parseInt(data.amount) : 1000,
      data.category_id ? parseInt(data.category_id) : 1,
      data.isonce === 'true' || data.isonce === true,
      data.isReferral === 'true' || data.isReferral === true,
      data.tags || null,
      data.position || null
    ])
      
      const couponId = result.rows[0].id

      return {
        success: true,
        message: '優惠券提交成功，等待審核',
        data: { id: couponId }
      }

    } finally {
      client.release()
    }

  } catch (error) {
    console.error('提交優惠券失敗:', error)
    
    if (error.statusCode) {
      throw error
    }
    
    throw createError({
      statusCode: 500,
      statusMessage: '提交優惠券失敗，請稍後再試'
    })
  }
})