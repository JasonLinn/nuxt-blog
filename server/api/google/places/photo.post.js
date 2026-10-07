import { googlePhotoParams } from '../../../utils/google-photo.js'

// Keep stored photo values small and usable as URLs without exposing the server key.
export default defineEventHandler(async event => {
  const params = googlePhotoParams(await readBody(event))
  return {
    success: true,
    ...params,
    url: `/api/google/places/image?${new URLSearchParams(Object.entries(params).map(([key, value]) => [key, String(value)]))}`
  }
})
