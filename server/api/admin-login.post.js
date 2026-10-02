import { loginAdmin } from '../utils/adminLogin.js'

export default defineEventHandler(async (event) => {
  try {
    const { username, password } = await readBody(event)
    if (!username || !password) {
      throw createError({
        statusCode: 400,
        statusMessage: '請輸入帳號和密碼'
      })
    }

    return await loginAdmin(event, username, password)
  } catch (error) {
    if (error.statusCode) throw error

    throw createError({
      statusCode: 500,
      statusMessage: '登入系統發生錯誤'
    })
  }
})
