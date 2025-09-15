import { query } from '~/server/utils/db.js'
import formidable from 'formidable'
import { readFile } from 'fs/promises'

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
    const isVercel = process.env.VERCEL === '1' || process.env.VERCEL_ENV
    
    if (contentType && contentType.includes('multipart/form-data')) {
      // 處理包含文件上傳的請求
      const form = formidable({
        keepExtensions: true,
        maxFileSize: 5 * 1024 * 1024,
        maxFiles: 5
      })
      
      const [fields, files] = await form.parse(event.node.req)
      
      // 處理新上傳的圖片
      if (files.images) {
        const imageFiles = Array.isArray(files.images) ? files.images : [files.images]
        
        for (const file of imageFiles) {
          if (file.size > 0) {
            try {
              // 使用統一的上傳函式
              const uploadResult = await uploadFile(file)
              if (uploadResult.success) {
                newImageUrls.push(uploadResult.url)
              }
            } catch (uploadError) {
              console.error('圖片上傳失敗:', uploadError)
              // 繼續處理其他圖片
            }
          }
        }
      }
      
      // 處理要刪除的圖片
      const imagesToDelete = fields.deleteImages ? 
        (Array.isArray(fields.deleteImages) ? fields.deleteImages : [fields.deleteImages]) : []
      
      imagesToDelete.forEach(imageUrl => {
        newImageUrls = newImageUrls.filter(url => url !== imageUrl)
        // 注意：GitHub 存儲的圖片無法直接刪除，本地圖片可以刪除
        if (imageUrl.startsWith('/yilan-activities/')) {
          try {
            const { join } = require('path')
            const { unlinkSync, existsSync } = require('fs')
            const imagePath = join('./public', imageUrl)
            if (existsSync(imagePath)) {
              unlinkSync(imagePath)
            }
          } catch (error) {
            console.error('Error deleting local image file:', error)
          }
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
        images: newImageUrls
      }
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
        params.push(updateData[key])
        paramIndex++
      }
    })
    
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

// 圖片上傳函式 - 與 POST API 相同邏輯
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