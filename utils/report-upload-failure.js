import { classifyFailure, couponFields, failureReasons, incidentIdPattern } from './upload-failures.js'

const prefix = 'yilanpass:upload-failure:'
const pending = new Map()
let sending = false
let retryTimer

function newIncidentId() {
  if (crypto.randomUUID) return crypto.randomUUID()
  const bytes = crypto.getRandomValues(new Uint8Array(16))
  bytes[6] = (bytes[6] & 15) | 64
  bytes[8] = (bytes[8] & 63) | 128
  const hex = Array.from(bytes, byte => byte.toString(16).padStart(2, '0')).join('')
  return [hex.slice(0, 8), hex.slice(8, 12), hex.slice(12, 16), hex.slice(16, 20), hex.slice(20)].join('-')
}

function storedReports() {
  try {
    return Object.keys(localStorage).filter(key => key.startsWith(prefix))
      .flatMap(key => {
        try { return [JSON.parse(localStorage.getItem(key))] } catch { localStorage.removeItem(key); return [] }
      })
  } catch { return [] }
}

function forget(id) {
  pending.delete(id)
  try { localStorage.removeItem(prefix + id) } catch { /* Storage may be disabled. */ }
}

export async function flushUploadFailures() {
  if (sending || navigator.onLine === false) return
  sending = true
  try {
    for (const record of storedReports()) pending.set(record.id, record)
    for (const [id, record] of pending) {
      if (Date.now() - Date.parse(record.at) > 7 * 86400000) { forget(id); continue }
      const response = await fetch('/api/upload-failures', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(record), keepalive: true
      })
      if (response.status === 400 || response.status === 413) { forget(id); continue }
      if (!response.ok || !(await response.json()).recorded) break
      forget(id)
    }
  } catch { /* Retry on reconnect, next visit or while the form stays open. */ }
  finally {
    sending = false
    clearTimeout(retryTimer)
    if (pending.size) retryTimer = setTimeout(flushUploadFailures, 60000)
  }
}

export function reportUploadFailure(source, stage, error, file) {
  const server = error?.data?.data?.incident
  const fromServer = server && incidentIdPattern.test(server.id) && Object.hasOwn(failureReasons, server.reason)
  const record = fromServer ? { ...server } : {
    id: newIncidentId(), at: new Date().toISOString(), source,
    stage: error?.failureStage || stage, ...classifyFailure(error),
    detail: Object.hasOwn(couponFields, error?.field) ? error.field : null
  }
  if (!fromServer || !server.saved) {
    delete record.saved
    file = error?.uploadFile || file
    if (file) {
      record.mime = /^image\/(?:jpeg|jpg|png|gif|webp|heic|heif)$/.test(file.type) ? file.type : 'other'
      record.bytes = file.size
    }
    pending.set(record.id, record)
    try {
      const stored = storedReports().sort((a, b) => a.at.localeCompare(b.at))
      if (stored.length >= 50) forget(stored[0].id)
      localStorage.setItem(prefix + record.id, JSON.stringify(record))
    } catch { /* Keep the in-memory copy. */ }
    void flushUploadFailures()
  }
  return `${failureReasons[record.reason]} 查詢碼 ${record.id}`
}
