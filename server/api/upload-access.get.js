import { requireUploader } from '../utils/upload-auth.js'
export default defineEventHandler(event => {
  requireUploader(event)
  setHeader(event, 'Cache-Control', 'private, no-store')
  return { success: true }
})
