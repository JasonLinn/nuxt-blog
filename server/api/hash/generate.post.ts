import { defineEventHandler, readBody, createError } from 'h3'

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)
    const { articleId } = body

    if (!articleId) {
      throw createError({
        statusCode: 400,
        message: '缺少必要參數'
      })
    }

    // 生成一個 8 位數的隨機數字
    const hash = Math.floor(10000000 + Math.random() * 90000000).toString()

    return {
      success: true,
      hash
    }
  } catch (error: any) {
    console.error('Generate hash error:', error)
    
    // 如果是已知的錯誤，直接返回
    if (error.statusCode) {
      throw error
    }
    
    // 其他未知錯誤
    throw createError({
      statusCode: 500,
      message: error.message || '生成序號失敗'
    })
  }
}) 