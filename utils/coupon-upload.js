const maxFileBytes = 5 * 1024 * 1024
// Leave room for multipart headers under the production request limit.
const maxRequestFileBytes = 4 * 1024 * 1024

export async function prepareCouponImage(file) {
  if (!['image/jpeg', 'image/png', 'image/gif'].includes(file.type)) {
    throw new Error('請選擇 JPEG、PNG 或 GIF 圖片。')
  }
  if (file.size > maxFileBytes) throw new Error('圖片超過 5 MB，請縮小後重新選取。')
  if (file.size <= maxRequestFileBytes) return file

  const url = URL.createObjectURL(file)
  try {
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
      if (blob.size <= maxRequestFileBytes) return blob
      scale *= 0.75
    } while (canvas.width > 1 || canvas.height > 1)
  } finally {
    URL.revokeObjectURL(url)
  }
  throw new Error('無法處理圖片，請重新選取或更換圖片。')
}
