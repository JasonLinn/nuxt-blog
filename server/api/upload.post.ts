import { defineEventHandler, readMultipartFormData } from 'h3'
import { Buffer } from 'buffer'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { existsSync } from 'fs'

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
    if (!file.type || !allowedTypes.includes(file.type)) {
      throw new Error('Invalid file type. Only JPEG, PNG and GIF are allowed.')
    }

    // 驗證文件大小 (5MB)
    const maxSize = 5 * 1024 * 1024
    if (file.data.length > maxSize) {
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
})

// GitHub 上傳函數
async function uploadToGitHub(file: any, config: any) {
  const { GITHUB_USERNAME, GITHUB_REPO, GITHUB_TOKEN } = config
  
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
async function uploadToLocal(file: any) {
  // 生成唯一的檔案名稱
  const timestamp = new Date().getTime()
  const extension = file.filename?.split('.').pop() || 'jpg'
  const fileName = `${timestamp}-${Math.random().toString(36).substr(2, 9)}.${extension}`

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
    url: fileUrl,
    provider: 'local'
  }
} 