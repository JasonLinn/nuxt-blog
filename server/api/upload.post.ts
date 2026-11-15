import { defineEventHandler } from 'h3'
import { requireUploader } from '../utils/upload-auth.js'
import { uploadImage } from '../utils/upload-image'
import { sharedUploadSource } from '../utils/upload-events.js'

export default defineEventHandler(async (event) => {
  requireUploader(event)
  try {
    return await uploadImage(event, sharedUploadSource(event))
  } catch (error) {
    console.error('Upload error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    }
  }
})
