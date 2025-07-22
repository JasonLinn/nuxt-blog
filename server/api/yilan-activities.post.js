import { query } from '~/server/utils/db.js'
import formidable from 'formidable'
import fs from 'fs'
import path from 'path'

export default defineEventHandler(async (event) => {
  try {
    // 解析 multipart/form-data
    const form = formidable({
      uploadDir: './public/yilan-activities',
      keepExtensions: true,
      maxFileSize: 5 * 1024 * 1024, // 5MB
      maxFiles: 5
    })
    
    // 確保上傳目錄存在
    if (!fs.existsSync('./public/yilan-activities')) {
      fs.mkdirSync('./public/yilan-activities', { recursive: true })
    }
    
    const [fields, files] = await form.parse(event.node.req)
    
    // 處理圖片上傳
    const imageUrls = []
    if (files.images) {
      const imageFiles = Array.isArray(files.images) ? files.images : [files.images]
      
      for (const file of imageFiles) {
        if (file.size > 0) {
          const timestamp = Date.now()
          const ext = path.extname(file.originalFilename || file.newFilename)
          const newFilename = `${timestamp}-${Math.random().toString(36).substr(2, 9)}${ext}`
          const newPath = path.join('./public/yilan-activities', newFilename)
          
          // 移動文件到目標位置
          fs.renameSync(file.filepath, newPath)
          imageUrls.push(`/yilan-activities/${newFilename}`)
        }
      }
    }
    
    // 提取表單數據
    const getData = (field) => {
      return Array.isArray(fields[field]) ? fields[field][0] : fields[field] || ''
    }
    
    const activityData = {
      title: getData('title'),
      description: getData('description'),
      images: imageUrls,
      event_date: getData('event_date'),
      event_time: getData('event_time') || null,
      location: getData('location') || null,
      activity_type: getData('activity_type') || null,
      organizer_name: getData('organizer_name'),
      organizer_email: getData('organizer_email'),
      organizer_phone: getData('organizer_phone') || null,
      contact_info: getData('contact_info') || null,
      submitter_name: getData('submitter_name'),
      submitter_email: getData('submitter_email'),
      status: 'pending'
    }
    
    // 驗證必填欄位
    if (!activityData.title || !activityData.description || !activityData.event_date ||
        !activityData.organizer_name || !activityData.organizer_email ||
        !activityData.submitter_name || !activityData.submitter_email) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Missing required fields'
      })
    }
    
    // 插入數據庫
    const sql = `
      INSERT INTO yilan_activities (
        title, description, images, event_date, event_time, location, activity_type,
        organizer_name, organizer_email, organizer_phone, contact_info,
        submitter_name, submitter_email, status, created_at, updated_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
      ) RETURNING id
    `
    
    const params = [
      activityData.title,
      activityData.description,
      activityData.images,
      activityData.event_date,
      activityData.event_time,
      activityData.location,
      activityData.activity_type,
      activityData.organizer_name,
      activityData.organizer_email,
      activityData.organizer_phone,
      activityData.contact_info,
      activityData.submitter_name,
      activityData.submitter_email,
      activityData.status
    ]
    
    const result = await query(sql, params)
    const newActivity = result.rows[0]
    
    return {
      success: true,
      data: { 
        id: newActivity.id,
        ...activityData 
      },
      message: 'Activity submitted successfully'
    }
    
  } catch (error) {
    console.error('Error creating activity:', error)
    
    // 如果是驗證錯誤，返回適當的狀態碼
    if (error.statusCode) {
      throw error
    }
    
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to submit activity'
    })
  }
})