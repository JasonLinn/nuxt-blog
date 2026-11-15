import { createError, defineEventHandler, isError } from 'h3'
import { uploadImage } from '../../utils/upload-image'

export default defineEventHandler(async (event) => {
  try {
    return await uploadImage(event)
  } catch (error) {
    if (isError(error)) throw error
    console.error('優惠券圖片上傳失敗:', error)
    throw createError({ statusCode: 502, statusMessage: 'Coupon image upload failed' })
  }
})
