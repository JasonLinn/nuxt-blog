// 從優惠券標題 / 內容推測「折扣值」標籤，供卡片顯示（例如「9 折」「85 折」「折 $50」）。
// 找不到明確折扣時回傳 null，卡片改顯示「免費 / 限量」標籤。

const CN_DIGITS = { 一: 1, 二: 2, 三: 3, 四: 4, 五: 5, 六: 6, 七: 7, 八: 8, 九: 9 }

const normalize = (text = '') =>
  String(text)
    .replace(/<[^>]*>/g, ' ')
    .replace(/[０-９]/g, (d) => String.fromCharCode(d.charCodeAt(0) - 0xfee0))
    .replace(/\s+/g, ' ')

export const extractDeal = (...sources) => {
  const text = normalize(sources.filter(Boolean).join(' '))
  if (!text) return null

  // 85折、9折、8.5折、九折、八五折
  let m = text.match(/(\d{1,2}(?:\.\d)?)\s*折/)
  if (m) {
    const n = m[1]
    if (Number(n) > 0 && Number(n) < 100) return { label: `${n} 折`, short: n, unit: '折' }
  }
  m = text.match(/([一二三四五六七八九])([一二三四五六七八九五])?\s*折/)
  if (m) {
    const n = `${CN_DIGITS[m[1]]}${m[2] ? CN_DIGITS[m[2]] : ''}`
    return { label: `${n} 折`, short: n, unit: '折' }
  }

  // 折50、折價5元、折抵100元、現折 $30
  m = text.match(/(?:現折|折價|折抵|折)\s*(?:NT\$|\$)?\s*(\d{1,5})\s*元?/)
  if (m) return { label: `折 $${m[1]}`, short: `$${m[1]}`, unit: '折抵' }

  // 買一送一
  m = text.match(/買\s*([一二三四五\d])\s*送\s*([一二三四五\d])/)
  if (m) return { label: `買${m[1]}送${m[2]}`, short: `買${m[1]}送${m[2]}`, unit: '' }

  if (/贈送|免費贈|送.{0,6}(乙|一)(份|個|杯|瓶)/.test(text))
    return { label: '好禮贈送', short: '贈', unit: '' }

  return null
}

// 取優惠內容第一句（去掉序號、條款字眼）當作卡片上的「優惠說明」
export const summarizeOffer = (content = '', max = 40) => {
  const text = normalize(content).trim()
  if (!text) return ''
  const parts = text
    .split(/(?:\s?\d+[.、)]\s?)|[。！!；;：:]|➡️|‧/)
    .map((s) => s.replace(/^[\s,，、-]+|[\s,，、-]+$/g, ''))
    .map((s) => s.replace(/\s*活動亮點$/, ''))
    .filter((s) => s.length >= 2 && !/^(使用前|注意|說明|活動亮點)/.test(s))
  const best =
    parts.find((s) => /折|送|贈|優惠|免費|元/.test(s) && !/不得|不可|限單次/.test(s)) ||
    parts[0] ||
    text
  return best.length > max ? `${best.slice(0, max)}…` : best
}
