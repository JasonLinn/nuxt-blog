import { query } from '~/server/utils/db.js'
import formidable from 'formidable'
import fs from 'fs'
import path from 'path'

export default defineEventHandler(async (event) => {
  try {
    // TODO: 驗證管理員權限
    // const session = await requireAdminAuth(event)
    
    const id = getRouterParam(event, 'id')
    
    if (!id || isNaN(parseInt(id))) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Invalid activity ID'
      })
    }
    
    // 檢查活動是否存在
    const checkSql = 'SELECT * FROM yilan_activities WHERE id = $1'
    const checkResult = await query(checkSql, [parseInt(id)])
    
    if (checkResult.rows.length === 0) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Activity not found'
      })
    }
    
    const existingActivity = checkResult.rows[0]
    
    // 解析請求數據（可能是 JSON 或 multipart）
    let updateData
    let newImageUrls = existingActivity.images || []
    
    const contentType = getHeader(event, 'content-type')
    
    if (contentType && contentType.includes('multipart/form-data')) {
      // 處理包含文件上傳的請求
      const form = formidable({
        uploadDir: './public/activities',
        keepExtensions: true,
        maxFileSize: 5 * 1024 * 1024,
        maxFiles: 5
      })
      
      if (!fs.existsSync('./public/activities')) {
        fs.mkdirSync('./public/activities', { recursive: true })
      }
      
      const [fields, files] = await form.parse(event.node.req)
      
      // 處理新上傳的圖片
      if (files.images) {
        console.log('=== 處理新上傳的圖片 ===')
        const imageFiles = Array.isArray(files.images) ? files.images : [files.images]
        console.log('圖片檔案數量:', imageFiles.length)
        
        for (const file of imageFiles) {
          if (file.size > 0) {
            console.log('處理圖片檔案:', file.originalFilename, file.size, 'bytes')
            
            const timestamp = Date.now()
            const ext = path.extname(file.originalFilename || file.newFilename)
            const newFilename = `${timestamp}-${Math.random().toString(36).substr(2, 9)}${ext}`
            const newPath = path.join('./public/activities', newFilename)
            
            fs.renameSync(file.filepath, newPath)
            const imageUrl = `/activities/${newFilename}`
            newImageUrls.push(imageUrl)
            
            console.log('圖片儲存成功:', imageUrl)
          }
        }
        
        console.log('所有圖片處理完成，總數:', newImageUrls.length)
      }
      
      // 處理要刪除的圖片
      const imagesToDelete = fields.deleteImages ? 
        (Array.isArray(fields.deleteImages) ? fields.deleteImages : [fields.deleteImages]) : []
      
      imagesToDelete.forEach(imageUrl => {
        newImageUrls = newImageUrls.filter(url => url !== imageUrl)
        // 刪除物理文件
        try {
          const imagePath = path.join('./public', imageUrl)
          if (fs.existsSync(imagePath)) {
            fs.unlinkSync(imagePath)
          }
        } catch (error) {
          console.error('Error deleting image file:', error)
        }
      })
      
      // 提取表單數據
      const getData = (field) => {
        return Array.isArray(fields[field]) ? fields[field][0] : fields[field]
      }
      
      updateData = {
        title: getData('title'),
        description: getData('description'),
        event_date: getData('event_date'),
        event_time: getData('event_time') || null,
        location: getData('location') || null,
        activity_type: getData('activity_type') || null,
        organizer_name: getData('organizer_name'),
        organizer_email: getData('organizer_email'),
        organizer_phone: getData('organizer_phone') || null,
        contact_info: getData('contact_info') || null,
        admin_notes: getData('admin_notes') || null,
        images: newImageUrls  // 直接使用陣列，不要轉換為 JSON 字串
      }
      
      console.log('=== 準備更新的資料 ===')
      console.log('最終圖片 URLs:', newImageUrls)
      console.log('圖片陣列類型:', Array.isArray(newImageUrls))
      console.log('圖片陣列長度:', newImageUrls.length)
    } else {
      // 處理 JSON 請求
      const body = await readBody(event)
      updateData = body
      
      // 如果有圖片更新
      if (body.images !== undefined) {
        newImageUrls = body.images || []
      }
    }
    
    // 驗證必填欄位
    if (updateData.title !== undefined && !updateData.title.trim()) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Title is required'
      })
    }
    
    // 構建更新 SQL
    const updateFields = []
    const params = []
    let paramIndex = 1
    
    Object.keys(updateData).forEach(key => {
      if (updateData[key] !== undefined && updateData[key] !== null) {
        updateFields.push(`${key} = $${paramIndex}`)
        if (key === 'images') {
          // PostgreSQL ARRAY 類型：直接傳送 JavaScript 陣列
          // @neondatabase/serverless 會自動處理陣列轉換
          params.push(updateData[key])
        } else {
          params.push(updateData[key])
        }
        paramIndex++
      }
    })
    
    console.log('=== SQL 更新參數 ===')
    console.log('更新欄位:', updateFields)
    console.log('參數值:', params)
    
    if (updateFields.length === 0) {
      throw createError({
        statusCode: 400,
        statusMessage: 'No valid fields to update'
      })
    }
    
    // 添加更新時間
    updateFields.push(`updated_at = CURRENT_TIMESTAMP`)
    
    const sql = `
      UPDATE yilan_activities 
      SET ${updateFields.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING *
    `
    
    params.push(parseInt(id))
    
    const result = await query(sql, params)
    
    return {
      success: true,
      data: result.rows[0],
      message: 'Activity updated successfully'
    }
    
  } catch (error) {
    console.error('Error updating activity:', error)
    
    if (error.statusCode) {
      throw error
    }
    
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to update activity'
    })
  }
})
