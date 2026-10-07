export function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]))
}

export function safeImageUrl(value) {
  if (typeof value !== 'string') return ''
  if (/^\/(?!\/)/.test(value) && !/[\\\x00-\x20]/.test(value)) return value
  try {
    const url = new URL(value)
    return ['http:', 'https:'].includes(url.protocol) ? url.href : ''
  } catch { return '' }
}
