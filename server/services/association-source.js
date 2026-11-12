import { isIP } from 'node:net'

export const ASSOCIATION_API_URL = 'https://ythma.com/api/bnb/'
export const IMPORT_DISABLED_REASON = '目前只開放預覽與確認 ID 對照，正式會員匯入尚未開放。'
const MAX_BYTES = 5 * 1024 * 1024
const MAX_ROWS = 2000

export class AssociationError extends Error {
  constructor(code, message, statusCode = 502) {
    super(message)
    this.code = code
    this.statusCode = statusCode
  }
}

// These URLs are only displayed, never fetched by the importer. Exclude local hosts
// and credentials as well as non-web schemes before returning them to the browser.
export function safeAssociationUrl(value) {
  if (typeof value !== 'string' || value.length > 2000) return null
  try {
    const url = new URL(value.trim())
    const host = url.hostname.replace(/^\[|\]$/g, '')
    if (
      !['https:', 'http:'].includes(url.protocol) ||
      url.username ||
      url.password ||
      isIP(host) ||
      !host.includes('.') ||
      /\.(localhost|local|internal|test|invalid)$/.test(host) ||
      host.endsWith('.') ||
      (url.port && !['80', '443'].includes(url.port))
    )
      return null
    return url.href
  } catch {
    return null
  }
}

function text(value, max, required = false) {
  if (
    typeof value !== 'string' ||
    value.length > max ||
    [...value].some((char) => char.charCodeAt(0) < 32)
  )
    return null
  const result = value.trim()
  return required && !result ? null : result
}

function timestamp(value) {
  return typeof value === 'string' &&
    /^\d{4}-\d\d-\d\dT.*(?:Z|[+-]\d\d:\d\d)$/.test(value) &&
    Number.isFinite(Date.parse(value))
    ? new Date(value).toISOString()
    : null
}

export function normalizeAssociationSnapshot(payload, now = Date.now()) {
  if (
    !payload ||
    payload.ok !== true ||
    !Array.isArray(payload.data) ||
    !Number.isSafeInteger(payload.count) ||
    payload.count !== payload.data.length ||
    payload.count > MAX_ROWS
  ) {
    throw new AssociationError('INVALID_SNAPSHOT', '協會資料格式或筆數不符，未產生預覽。')
  }
  const generatedAt = timestamp(payload.generated_at)
  if (
    !generatedAt ||
    Date.parse(generatedAt) > now + 5 * 60_000 ||
    Date.parse(generatedAt) < now - 24 * 60 * 60_000
  ) {
    throw new AssociationError(
      'STALE_SNAPSHOT',
      '協會名單產生時間異常或超過 24 小時，請稍後重新預覽。'
    )
  }
  const ids = new Set()
  const records = payload.data.map((row, index) => {
    if (!row || typeof row !== 'object' || Array.isArray(row)) {
      throw new AssociationError('INVALID_SNAPSHOT', '協會名單包含無效資料列。')
    }
    const id = text(row.id, 128, true)
    if (!id || !/^[A-Za-z0-9_-]+$/.test(id) || ids.has(id)) {
      throw new AssociationError('DUPLICATE_SOURCE_ID', '協會識別碼缺漏或重複，無法安全比對。')
    }
    ids.add(id)
    const issues = []
    const warnings = []
    const name = text(row.name, 255, true)
    const area = text(row.area, 100, true)
    const phone = text(row.phone, 80)
    const website = safeAssociationUrl(row.website)
    const lineUrl = row.line_url === '' ? '' : safeAssociationUrl(row.line_url)
    const updatedAt = timestamp(row.updated_at)
    if (!name) issues.push('民宿名稱缺漏或格式不符')
    if (!area) issues.push('區域缺漏或格式不符')
    if (phone === null) issues.push('電話欄位格式不符')
    if (!website) issues.push('官網網址缺漏或不安全')
    if (lineUrl === null) issues.push('LINE 網址格式不符')
    if (!updatedAt || Date.parse(updatedAt) > Date.parse(generatedAt) + 5 * 60_000)
      issues.push('修改時間格式不符或晚於快照')
    const photos = []
    if (!Array.isArray(row.photos) || row.photos.length > 100) issues.push('照片欄位格式不符')
    else {
      for (const photo of row.photos) {
        const url = safeAssociationUrl(photo?.url)
        const thumb = photo?.thumb ? safeAssociationUrl(photo.thumb) : url
        if (
          !url ||
          !thumb ||
          new URL(url).hostname !== 'ythma.com' ||
          new URL(thumb).hostname !== 'ythma.com'
        ) {
          issues.push('照片網址不符合協會來源')
          continue
        }
        if (!photos.some((p) => p.url === url)) photos.push({ url, thumb })
      }
    }
    if (!photos.length) warnings.push('未提供照片，刊登時需使用預設圖')
    if (!phone) warnings.push('未提供公開電話')
    if (!lineUrl) warnings.push('未提供 LINE 連結')
    // Explicit allowlist: owner_name, email and any future private fields never leave here.
    return {
      external_id: id,
      source_index: index + 1,
      name: name || '',
      area: area || '',
      phone: phone || '',
      website: website || '',
      line_url: lineUrl || '',
      photos,
      source_updated_at: updatedAt,
      issues: [...new Set(issues)],
      warnings
    }
  })
  return {
    generated_at: generatedAt,
    count: records.length,
    records,
    warnings: records.length ? [] : ['來源回傳空名單；不能解讀為所有會員已停用。']
  }
}

async function boundedJson(response, signal, maxBytes) {
  if (!/^application\/json(?:\s*;|$)/i.test(response.headers.get('content-type') || '')) {
    throw new AssociationError('INVALID_CONTENT_TYPE', '協會未回傳 JSON 資料。')
  }
  if (Number(response.headers.get('content-length')) > maxBytes) {
    throw new AssociationError('RESPONSE_TOO_LARGE', '協會回應超過大小限制。')
  }
  const reader = response.body?.getReader()
  if (!reader) throw new AssociationError('EMPTY_RESPONSE', '協會回應沒有內容。')
  const chunks = []
  let size = 0
  // The timeout remains active while streaming the body, not just until headers arrive.
  const abort = () => {
    reader.cancel().catch(() => {})
  }
  signal.addEventListener('abort', abort, { once: true })
  try {
    while (true) {
      signal.throwIfAborted()
      const { done, value } = await reader.read()
      signal.throwIfAborted()
      if (done) break
      size += value.byteLength
      if (size > maxBytes)
        throw new AssociationError('RESPONSE_TOO_LARGE', '協會回應超過大小限制。')
      chunks.push(Buffer.from(value))
    }
    try {
      return JSON.parse(Buffer.concat(chunks).toString('utf8'))
    } catch {
      throw new AssociationError('INVALID_JSON', '協會 JSON 無法解析。')
    }
  } finally {
    signal.removeEventListener('abort', abort)
    await reader.cancel().catch(() => {})
  }
}

export async function fetchAssociationSnapshot({
  env = process.env,
  fetcher = fetch,
  timeoutMs = 12_000,
  maxBytes = MAX_BYTES,
  now = Date.now(),
  sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))
} = {}) {
  const apiKey = env.YTHMA_BNB_API_KEY
  if (!apiKey || typeof apiKey !== 'string' || /[\r\n]/.test(apiKey)) {
    throw new AssociationError('SOURCE_NOT_CONFIGURED', '尚未設定協會 API 金鑰。', 503)
  }
  if (env.YTHMA_BNB_API_URL && env.YTHMA_BNB_API_URL !== ASSOCIATION_API_URL) {
    throw new AssociationError('UNTRUSTED_SOURCE_URL', '協會 API 位址不符，已停止讀取。', 503)
  }
  for (let attempt = 0; attempt < 2; attempt++) {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), timeoutMs)
    try {
      const response = await fetcher(ASSOCIATION_API_URL, {
        method: 'GET',
        redirect: 'manual',
        headers: { 'X-Api-Key': apiKey, Accept: 'application/json' },
        signal: controller.signal
      })
      if (response.status !== 200) {
        await response.body?.cancel().catch(() => {})
        // Never follow a redirect or echo an upstream error body (it may contain secrets).
        if (response.status === 429)
          throw new AssociationError(
            'SOURCE_RATE_LIMITED',
            '協會暫時限制讀取頻率，請稍後重試。',
            503
          )
        if (response.status >= 500 && attempt === 0) {
          await sleep(300)
          continue
        }
        throw new AssociationError(
          'SOURCE_HTTP_ERROR',
          `協會 API 回應異常（HTTP ${response.status}）。`
        )
      }
      return normalizeAssociationSnapshot(
        await boundedJson(response, controller.signal, maxBytes),
        now
      )
    } catch (error) {
      if (error instanceof AssociationError) throw error
      if (attempt === 0 && !controller.signal.aborted) {
        await sleep(300)
        continue
      }
      throw new AssociationError('SOURCE_UNAVAILABLE', '協會連線失敗或逾時，請稍後重試。', 503)
    } finally {
      clearTimeout(timer)
    }
  }
}
