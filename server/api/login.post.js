import { loginAdmin } from '../utils/adminLogin.js'

export default defineEventHandler(async (event) => {
  try {
    const { account, password } = await readBody(event)
    if (!account || !password) {
      throw createError({
        statusCode: 400,
        statusMessage: '請輸入帳號和密碼'
      })
    }

    return await loginAdmin(event, account, password, true)
  } catch (error) {
    if (error.statusCode) throw error

    throw createError({
      statusCode: 500,
      statusMessage: '登入系統發生錯誤'
    })
  }
})
