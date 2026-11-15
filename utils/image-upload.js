import { imageSelectionError } from './upload-failures.js'

// Leave room for multipart headers under the production request limit.
const maxRequestFileBytes = 4 * 1024 * 1024

export async function prepareUploadImage(file, maxBytes = maxRequestFileBytes) {
  if (!['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'].includes(file.type)) {
    throw imageSelectionError('format')
  }
  if (!file.size) throw imageSelectionError('empty')
  if (file.size <= maxBytes) return file

  let url
  try {
    url = URL.createObjectURL(file)
    const image = new Image()
    image.src = url
    await image.decode()
    const canvas = document.createElement('canvas')
    const context = canvas.getContext('2d')
    let scale = Math.min(1, 2048 / Math.max(image.naturalWidth, image.naturalHeight))
    do {
      canvas.width = Math.max(1, Math.round(image.naturalWidth * scale))
      canvas.height = Math.max(1, Math.round(image.naturalHeight * scale))
      context.drawImage(image, 0, 0, canvas.width, canvas.height)
      const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/webp', 0.85))
      if (!blob) break
      if (blob.size <= maxBytes) {
        const name = file.name.replace(/\.[^.]+$/, '') + (blob.type === 'image/webp' ? '.webp' : '.png')
        return new File([blob], name, { type: blob.type })
      }
      scale *= 0.75
    } while (canvas.width > 1 || canvas.height > 1)
  } catch {
    // Decoding or encoding can fail for damaged files or limited device memory.
  } finally {
    if (url) URL.revokeObjectURL(url)
  }
  throw imageSelectionError('decode')
}

// Activity forms send all new images in the same multipart request.
export async function appendActivityImages(body, files) {
  if (!files.length) return
  if (files.length > 5) throw imageSelectionError('tooMany')
  const maxBytes = Math.floor(maxRequestFileBytes / files.length)
  for (const file of files) {
    try { body.append('images', await prepareUploadImage(file, maxBytes)) }
    catch (error) { error.uploadFile = file; throw error }
  }
}
