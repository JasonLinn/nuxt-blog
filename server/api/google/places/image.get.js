import { googlePhotoParams, fetchGooglePhoto } from '../../../utils/google-photo.js'

export default defineEventHandler(async event => {
  const params = googlePhotoParams(getQuery(event))
  const photo = await fetchGooglePhoto(params, useRuntimeConfig().GOOGLE_MAPS_API_KEY)
  setHeader(event, 'Content-Type', photo.type)
  setHeader(event, 'X-Content-Type-Options', 'nosniff')
  setHeader(event, 'Cache-Control', 'public, max-age=3600')
  return photo.bytes
})
