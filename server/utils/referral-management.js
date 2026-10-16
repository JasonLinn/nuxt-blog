import { createHash } from 'node:crypto'
import { referral } from '../../utils/referral.js'

export function referralRevision(rows) {
  const entries = rows.map(({ code, name }) => [code, name])
    .sort((a, b) => a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0)
  return createHash('sha256').update(JSON.stringify(entries)).digest('hex')
}

export function availableReferralCodes(rows) {
  const used = new Set(rows.map(item => item.code.trim().toUpperCase()))
  return [...new Set(referral.filter(item => !item.name.trim()).map(item => item.code))]
    .filter(code => !used.has(code.toUpperCase()))
}

export function validateReferralItems(items) {
  if (!Array.isArray(items)) throw new Error('推薦代碼資料格式錯誤。')
  const used = new Set()
  return items.map(item => {
    if (typeof item?.code !== 'string' || typeof item?.name !== 'string') {
      throw new Error('推薦代碼與店家名稱必須為文字。')
    }
    const code = item.code.trim()
    const name = item.name.trim()
    if (!code || code.length > 50 || name.length > 255) {
      throw new Error('推薦代碼不可空白，且代碼最多 50 字、店家名稱最多 255 字。')
    }
    const key = code.toUpperCase()
    if (used.has(key)) throw new Error(`推薦代碼重複：${code}，請修改後再儲存。`)
    used.add(key)
    return { code, name }
  })
}
