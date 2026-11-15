import { createError, readMultipartFormData, type H3Event } from 'h3'
import { mkdir, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { normalizeImage } from './safe-images.js'
import { recordSuccess } from './upload-events.js'

export async function uploadImage(event: H3Event, source: string) {
  const parts = await readMultipartFormData(event)
  if (!parts?.length) throw createError({ statusCode: 400, message: 'No file uploaded' })

  const file = await normalizeImage(parts[0].data)
  if (file.data.length > 5 * 1024 * 1024) {
    throw createError({ statusCode: 413, message: 'File too large. Maximum size is 5MB.' })
  }

  const result = await storeImage(file)
  await recordSuccess(source, 'upload', { mime: file.type, bytes: file.data.length })
  return result
}

async function storeImage(file: Awaited<ReturnType<typeof normalizeImage>>) {
  const { GITHUB_USERNAME, GITHUB_REPO, GITHUB_TOKEN } = useRuntimeConfig()
  if (!GITHUB_USERNAME || !GITHUB_REPO || !GITHUB_TOKEN) {
    console.warn('GitHub 配置不完整，使用本地上傳')
    const directory = join(process.cwd(), 'public', 'uploads')
    await mkdir(directory, { recursive: true })
    await writeFile(join(directory, file.filename), file.data)
    return { success: true, url: `/uploads/${file.filename}`, provider: 'local' }
  }

  const response = await fetch(
    `https://api.github.com/repos/${GITHUB_USERNAME}/${GITHUB_REPO}/contents/public/shop/${file.filename}`,
    {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${GITHUB_TOKEN}`,
        'Content-Type': 'application/json',
        Accept: 'application/vnd.github.v3+json'
      },
      body: JSON.stringify({ message: `Upload ${file.filename}`, content: file.data.toString('base64') })
    }
  )
  const data = await response.json()
  if (!response.ok) throw Object.assign(new Error(`GitHub upload failed: ${data.message || 'Unknown error'}`), { providerStatus: response.status })
  return { success: true, url: data.content.download_url, provider: 'github' }
}
