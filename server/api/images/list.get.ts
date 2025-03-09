import { defineEventHandler, createError } from 'h3'

export default defineEventHandler(async (event) => {
  try {
    const config = useRuntimeConfig()
    const { GITHUB_USERNAME, GITHUB_REPO, GITHUB_TOKEN } = config

    if (!GITHUB_USERNAME || !GITHUB_REPO || !GITHUB_TOKEN) {
      console.error('Missing GitHub configuration:', {
        username: !!GITHUB_USERNAME,
        repo: !!GITHUB_REPO,
        token: !!GITHUB_TOKEN
      })
      throw createError({
        statusCode: 500,
        message: 'GitHub 配置缺失'
      })
    }

    const response = await fetch(
      `https://api.github.com/repos/${GITHUB_USERNAME}/${GITHUB_REPO}/contents/public/shop`,
      {
        headers: {
          'Authorization': `token ${GITHUB_TOKEN}`,
          'Accept': 'application/vnd.github.v3+json'
        }
      }
    )

    if (!response.ok) {
      const errorData = await response.json()
      console.error('GitHub API Error:', errorData)
      throw createError({
        statusCode: response.status,
        message: errorData.message || '獲取圖片列表失敗'
      })
    }

    const data = await response.json()
    return data
  } catch (error: any) {
    console.error('Error fetching images:', error)
    if (error.statusCode) {
      throw error
    } else {
      throw createError({
        statusCode: 500,
        message: error.message || '獲取圖片列表失敗'
      })
    }
  }
}) 