import sharp from 'sharp'
import { randomUUID } from 'node:crypto'
import { readFile, writeFile, mkdir, rm, lstat, realpath } from 'node:fs/promises'
import path from 'node:path'
import { createError } from 'h3'

export async function normalizeImage(data) {
  if (!Buffer.isBuffer(data) || !data.length || data.length > 5 * 1024 * 1024) throw createError({ statusCode: 400, statusMessage: 'Invalid image size' })
  try {
    const image = sharp(data, { limitInputPixels: 25000000 })
    const metadata = await image.metadata()
    if (!['jpeg', 'png', 'gif', 'webp'].includes(metadata.format)) throw new Error('Unsupported format')
    return { data: await image.rotate().webp({ quality: 85 }).toBuffer(), filename: `${randomUUID()}.webp`, type: 'image/webp' }
  } catch { throw createError({ statusCode: 400, statusMessage: 'Invalid raster image' }) }
}

export async function saveLocalImage(file, directory = 'activities') {
  try {
    const image = await normalizeImage(await readFile(file.filepath))
    const folder = path.resolve('public', directory)
    await mkdir(folder, { recursive: true })
    await writeFile(path.join(folder, image.filename), image.data)
    return `/${directory}/${image.filename}`
  } finally { await rm(file.filepath, { force: true }) }
}

export function containedImagePath(url, directory) {
  const prefix = `/${directory}/`
  if (typeof url !== 'string' || !url.startsWith(prefix)) return null
  const name = url.slice(prefix.length)
  if (!/^[a-zA-Z0-9_-]+\.(?:jpe?g|png|gif|webp)$/i.test(name)) return null
  const root = path.resolve('public', directory)
  const target = path.resolve(root, name)
  return path.dirname(target) === root ? target : null
}

export async function deleteOwnedImage(url, ownedUrls, directory) {
  if (!Array.isArray(ownedUrls) || !ownedUrls.includes(url)) throw createError({ statusCode: 400, statusMessage: 'Image does not belong to this activity' })
  const target = containedImagePath(url, directory)
  if (!target) return
  try {
    const stat = await lstat(target)
    if (stat.isSymbolicLink() || path.dirname(await realpath(target)) !== await realpath(path.resolve('public', directory))) throw createError({ statusCode: 400, statusMessage: 'Invalid image path' })
    await rm(target)
  } catch (error) { if (error.code !== 'ENOENT') throw error }
}
