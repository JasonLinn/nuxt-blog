import { defineEventHandler, readBody } from 'h3'

export default defineEventHandler(async (event) => {
  try {
    const config = useRuntimeConfig()
    const { GITHUB_USERNAME, GITHUB_REPO, GITHUB_TOKEN } = config

    // 檢查配置
    if (!GITHUB_USERNAME || !GITHUB_REPO || !GITHUB_TOKEN) {
      console.error('Missing GitHub configuration:', {
        username: !!GITHUB_USERNAME,
        repo: !!GITHUB_REPO,
        token: !!GITHUB_TOKEN
      })
      return {
        success: false,
        error: 'GitHub 配置缺失'
      }
    }

    const body = await readBody(event)
    const { name, sha } = body

    if (!name || !sha) {
      return {
        success: false,
        error: '缺少必要參數'
      }
    }

    console.log('Attempting to delete file:', {
      username: GITHUB_USERNAME,
      repo: GITHUB_REPO,
      path: `public/shop/${name}`,
      sha: sha
    })

    // 先檢查文件是否存在
    const checkResponse = await fetch(
      `https://api.github.com/repos/${GITHUB_USERNAME}/${GITHUB_REPO}/contents/public/shop/${name}`,
      {
        headers: {
          'Authorization': `token ${GITHUB_TOKEN}`,
          'Accept': 'application/vnd.github.v3+json'
        }
      }
    )

    if (!checkResponse.ok) {
      const errorData = await checkResponse.json()
      console.error('File not found:', errorData)
      return {
        success: false,
        error: '文件不存在或已被刪除'
      }
    }

    // 執行刪除操作
    const deleteResponse = await fetch(
      `https://api.github.com/repos/${GITHUB_USERNAME}/${GITHUB_REPO}/contents/public/shop/${name}`,
      {
        method: 'DELETE',
        headers: {
          'Authorization': `token ${GITHUB_TOKEN}`,
          'Content-Type': 'application/json',
          'Accept': 'application/vnd.github.v3+json'
        },
        body: JSON.stringify({
          message: `Delete ${name}`,
          sha: sha
        })
      }
    )

    if (!deleteResponse.ok) {
      const errorData = await deleteResponse.json()
      console.error('Delete failed:', {
        status: deleteResponse.status,
        statusText: deleteResponse.statusText,
        data: errorData
      })
      return {
        success: false,
        error: errorData.message || '刪除失敗'
      }
    }

    console.log('File deleted successfully')
    return {
      success: true
    }
  } catch (error: any) {
    console.error('Delete error:', error)
    return {
      success: false,
      error: error.message || '刪除失敗'
    }
  }
}) 