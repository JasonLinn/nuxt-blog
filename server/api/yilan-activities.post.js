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
      const value = Array.isArray(fields[field]) ? fields[field][0] : fields[field]
      return value || null
    }
    
    const getBooleanData = (field) => {
      const value = getData(field)
      return value === 'true' || value === true
    }

    // 構建活動資料
    const activityData = {
      title: getData('title'),
      description: getData('description'),
      images: imageUrls.length > 0 ? imageUrls : null,
      event_date: getData('event_start_date'),
      end_date: getData('event_end_date'),
      event_time: getData('event_start_time'),
      end_time: getData('event_end_time'),
      location: getData('location'),
      activity_type: getData('activity_type'),
      organizer_name: getData('organizer_name'),
      organizer_email: getData('organizer_email'),
      organizer_phone: getData('organizer_phone'),
      contact_info: getData('organizer_contact'),
      submitter_name: getData('submitter_name') || getData('organizer_name'),
      submitter_email: getData('submitter_email') || getData('organizer_email'),
      status: 'pending'
    }
    
    // 驗證必填欄位
    const requiredFields = ['title', 'description', 'event_date', 'organizer_name', 'organizer_email', 'submitter_name', 'submitter_email']
    for (const field of requiredFields) {
      if (!activityData[field] || activityData[field].toString().trim() === '') {
        throw createError({
          statusCode: 400,
          statusMessage: `Missing required field: ${field}`
        })
      }
    }
    
    // 如果有結束日期，驗證多天活動
    const isMultiDay = getBooleanData('is_multi_day')
    if (isMultiDay && !activityData.end_date) {
      throw createError({
        statusCode: 400,
        statusMessage: 'End date is required for multi-day events'
      })
    }
    
    // 使用正確的表結構進行插入
    const sql = `
      INSERT INTO yilan_activities (
        title, description, images, event_date, end_date, event_time, end_time, is_multi_day,
        location, activity_type, organizer_name, organizer_email, organizer_phone,
        contact_info, submitter_name, submitter_email, status, created_at, updated_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, 
        CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
      ) RETURNING id
    `
    
    const params = [
      activityData.title,
      activityData.description,
      activityData.images,
      activityData.event_date,
      activityData.end_date,
      activityData.event_time,
      activityData.end_time,
      isMultiDay,
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
    
    console.log('Attempting to insert activity with params:', params)
    
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
    
    // 詳細錯誤日誌
    if (error.code) {
      console.error('Database error code:', error.code)
      console.error('Database error detail:', error.detail)
    }
    
    // 如果是驗證錯誤，返回適當的狀態碼
    if (error.statusCode) {
      throw error
    }
    
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to submit activity',
      cause: error
    })
  }
})