import { defineEventHandler, readMultipartFormData } from 'h3'
import { Buffer } from 'buffer'

export default defineEventHandler(async (event) => {
  try {
    const config = useRuntimeConfig()
    const { GITHUB_USERNAME, GITHUB_REPO, GITHUB_TOKEN } = config

    // 讀取上傳的文件
    const files = await readMultipartFormData(event)
    if (!files || files.length === 0) {
      throw new Error('No file uploaded')
    }

    const file = files[0]
    
    // 驗證文件類型
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif']
    if (!allowedTypes.includes(file.type)) {
      throw new Error('Invalid file type. Only JPEG, PNG and GIF are allowed.')
    }

    // 驗證文件大小 (5MB)
    const maxSize = 5 * 1024 * 1024
    if (file.data.length > maxSize) {
      throw new Error('File too large. Maximum size is 5MB.')
    }

    // 生成唯一的檔案名稱
    const timestamp = new Date().getTime()
    const fileName = `${timestamp}-${file.filename}`

    // 轉換為 base64
    const base64Data = Buffer.from(file.data).toString('base64')

    // 上傳到 GitHub
    const response = await fetch(
      `https://api.github.com/repos/${GITHUB_USERNAME}/${GITHUB_REPO}/contents/public/shop/${fileName}`,
      {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${GITHUB_TOKEN}`,
          'Content-Type': 'application/json',
          'Accept': 'application/vnd.github.v3+json'
        },
        body: JSON.stringify({
          message: `Upload ${fileName}`,
          content: base64Data
        })
      }
    )

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.message || 'Upload failed')
    }

    const data = await response.json()
    return {
      success: true,
      url: data.content.download_url
    }

  } catch (error) {
    console.error('Upload error:', error)
    return {
      success: false,
      error: error.message
    }
  }
}) 