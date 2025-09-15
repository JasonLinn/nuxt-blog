import { query } from '~/server/utils/db.js'
import formidable from 'formidable'
import { readFile } from 'fs/promises'

export default defineEventHandler(async (event) => {
  try {
    // 檢查內容類型
    const contentType = getHeader(event, 'content-type')
    
    let fields, imageUrls = []
    
    if (contentType && contentType.includes('multipart/form-data')) {
      // 處理包含檔案上傳的請求
      const form = formidable({
        keepExtensions: true,
        maxFileSize: 5 * 1024 * 1024, // 5MB
        maxFiles: 5
      })
      
      const [formFields, files] = await form.parse(event.node.req)
      fields = formFields
      
      // 處理圖片上傳 - 使用與民宿相同的上傳邏輯
      if (files && files.images) {
        const imageFiles = Array.isArray(files.images) ? files.images : [files.images]
        
        for (const file of imageFiles) {
          if (file.size > 0) {
            try {
              // 直接使用上傳 API 的內部邏輯
              const uploadResult = await uploadFile(file)
              if (uploadResult.success) {
                imageUrls.push(uploadResult.url)
              }
            } catch (uploadError) {
              console.error('圖片上傳失敗:', uploadError)
              // 繼續處理其他圖片，不中斷整個流程
            }
          }
        }
      }
    } else {
      // 處理 JSON 請求（無檔案上傳）
      fields = await readBody(event)
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

// 圖片上傳函式 - 複製自 upload.post.ts 的邏輯
async function uploadFile(file) {
  try {
    const config = useRuntimeConfig()
    const { GITHUB_USERNAME, GITHUB_REPO, GITHUB_TOKEN } = config

    // 驗證文件類型
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif']
    if (!file.mimetype || !allowedTypes.includes(file.mimetype)) {
      throw new Error('Invalid file type. Only JPEG, PNG and GIF are allowed.')
    }

    // 驗證文件大小 (5MB)
    const maxSize = 5 * 1024 * 1024
    if (file.size > maxSize) {
      throw new Error('File too large. Maximum size is 5MB.')
    }

    // 檢查 GitHub 配置是否完整
    const hasGitHubConfig = GITHUB_USERNAME && GITHUB_REPO && GITHUB_TOKEN
    
    if (hasGitHubConfig) {
      // 使用 GitHub 上傳
      return await uploadToGitHub(file, config)
    } else {
      // 使用本地上傳作為備用方案
      console.warn('GitHub 配置不完整，使用本地上傳')
      return await uploadToLocal(file)
    }

  } catch (error) {
    console.error('Upload error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    }
  }
}

// GitHub 上傳函數
async function uploadToGitHub(file, config) {
  const { GITHUB_USERNAME, GITHUB_REPO, GITHUB_TOKEN } = config
  
  // 生成唯一的檔案名稱
  const timestamp = new Date().getTime()
  const fileName = `${timestamp}-${file.originalFilename || file.newFilename}`

  // 讀取檔案並轉換為 base64
  const fileData = await readFile(file.filepath)
  const base64Data = Buffer.from(fileData).toString('base64')

  // 上傳到 GitHub
  const response = await fetch(
    `https://api.github.com/repos/${GITHUB_USERNAME}/${GITHUB_REPO}/contents/public/yilan-activities/${fileName}`,
    {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${GITHUB_TOKEN}`,
        'Content-Type': 'application/json',
        'Accept': 'application/vnd.github.v3+json'
      },
      body: JSON.stringify({
        message: `Upload yilan-activity image ${fileName}`,
        content: base64Data
      })
    }
  )

  if (!response.ok) {
    const errorData = await response.json()
    throw new Error(`GitHub upload failed: ${errorData.message || 'Unknown error'}`)
  }

  const data = await response.json()
  return {
    success: true,
    url: data.content.download_url,
    provider: 'github'
  }
}

// 本地上傳函數
async function uploadToLocal(file) {
  const { writeFile, mkdir } = await import('fs/promises')
  const { join } = await import('path')
  const { existsSync } = await import('fs')
  
  // 生成唯一的檔案名稱
  const timestamp = new Date().getTime()
  const extension = file.originalFilename?.split('.').pop() || 'jpg'
  const fileName = `${timestamp}-${Math.random().toString(36).substr(2, 9)}.${extension}`

  // 設定上傳目錄
  const uploadDir = join(process.cwd(), 'public', 'yilan-activities')
  
  // 確保上傳目錄存在
  if (!existsSync(uploadDir)) {
    await mkdir(uploadDir, { recursive: true })
  }

  // 讀取並儲存文件
  const fileData = await readFile(file.filepath)
  const filePath = join(uploadDir, fileName)
  await writeFile(filePath, fileData)

  // 返回可訪問的 URL
  const fileUrl = `/yilan-activities/${fileName}`

  return {
    success: true,
    url: fileUrl,
    provider: 'local'
  }
}