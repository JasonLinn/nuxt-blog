import { defineEventHandler, readMultipartFormData } from 'h3'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { existsSync } from 'fs'

export default defineEventHandler(async (event) => {
  try {
    // 讀取上傳的文件
    const files = await readMultipartFormData(event)
    if (!files || files.length === 0) {
      throw new Error('No file uploaded')
    }

    const file = files[0]
    
    // 檢查文件類型
    if (!file.type) {
      throw new Error('File type is missing')
    }
    
    // 驗證文件類型
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif']
    if (!allowedTypes.includes(file.type)) {
      throw new Error('Invalid file type. Only JPEG, PNG and GIF are allowed.')
    }

    // 檢查文件名
    if (!file.filename) {
      throw new Error('Filename is missing')
    }

    // 驗證文件大小 (5MB)
    const maxSize = 5 * 1024 * 1024
    if (file.data.length > maxSize) {
      throw new Error('File too large. Maximum size is 5MB.')
    }

    // 生成唯一的檔案名稱
    const timestamp = new Date().getTime()
    const extension = file.filename.split('.').pop()
    const fileName = `${timestamp}-${file.filename}`

    // 設定上傳目錄
    const uploadDir = join(process.cwd(), 'public', 'uploads')
    
    // 確保上傳目錄存在
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true })
    }

    // 儲存文件
    const filePath = join(uploadDir, fileName)
    await writeFile(filePath, file.data)

    // 返回可訪問的 URL
    const fileUrl = `/uploads/${fileName}`

    return {
      success: true,
      url: fileUrl
    }

  } catch (error) {
    console.error('Upload error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    }
  }
}) 