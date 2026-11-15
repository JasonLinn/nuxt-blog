import { defineEventHandler } from 'h3'
import { uploadImage } from '../../utils/upload-image'
import { couponFailure } from '../../utils/upload-failures.js'

export default defineEventHandler(async (event) => {
  try {
    return await uploadImage(event, 'coupon')
  } catch (error) {
    throw await couponFailure(error, 'upload')
  }
})
