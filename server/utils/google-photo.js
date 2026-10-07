import { createError } from 'h3'

export function googlePhotoParams(input) {
  const { photo_reference, maxwidth = 800, maxheight } = input || {}
  const validSize = value => /^\d+$/.test(String(value)) && Number(value) >= 1 && Number(value) <= 1600
  if (typeof photo_reference !== 'string' || photo_reference.length > 2048 || !/^[A-Za-z0-9_-]+$/.test(photo_reference) || !validSize(maxwidth) || (maxheight != null && !validSize(maxheight))) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid photo parameters' })
  }
  return { photo_reference, maxwidth: Number(maxwidth), ...(maxheight != null ? { maxheight: Number(maxheight) } : {}) }
}

export async function fetchGooglePhoto(params, apiKey, fetcher = fetch) {
  if (!apiKey) throw createError({ statusCode: 503, statusMessage: 'Google Maps server key not configured' })
  const url = new URL('https://maps.googleapis.com/maps/api/place/photo')
  url.search = new URLSearchParams({ photo_reference: params.photo_reference, key: apiKey, maxwidth: String(params.maxwidth), ...(params.maxheight ? { maxheight: String(params.maxheight) } : {}) }).toString()
  try {
    const response = await fetcher(url, { signal: AbortSignal.timeout(10000) })
    const type = response.headers.get('content-type')?.split(';')[0]
    if (!response.ok || !['image/jpeg', 'image/png', 'image/webp'].includes(type) || !response.body) throw new Error('Invalid photo response')
    const chunks = []
    let size = 0
    for await (const chunk of response.body) {
      size += chunk.length
      if (size > 5 * 1024 * 1024) throw new Error('Photo too large')
      chunks.push(chunk)
    }
    return { type, bytes: Buffer.concat(chunks) }
  } catch { throw createError({ statusCode: 502, statusMessage: 'Photo retrieval failed' }) }
}
