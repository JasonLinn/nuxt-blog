import { createHash } from 'node:crypto'
import { dateOnly, taipeiToday } from '../../utils/activity-dates.js'

const cultureUrl = category => `https://cloud.culture.tw/frontsite/opendata/activityOpenDataJsonAction.do?category=${category}&method=doFindActivitiesByCategory`
export const activitySources = [
  ...[1, 6, 7].map(category => ({ id: `culture-${category}`, name: `文化部（${{ 1: '音樂', 6: '展覽', 7: '講座' }[category]}）`, official: true, organizerOptional: true, descriptionOptional: true, url: 'https://data.gov.tw/dataset/10042', feed: cultureUrl(category), format: 'json' })),
  { id: 'yilan-site', name: '宜蘭勁好玩', official: true, organizerOptional: true, descriptionOptional: true, url: 'https://travel.yilan.gov.tw/zh-tw/events/', feed: 'https://travel.yilan.gov.tw/zh-tw/events/', format: 'yilan-calendar' }
]
export const digest = value => createHash('sha256').update(JSON.stringify(value)).digest('hex')
export const plainText = value => String(value || '').replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/\\r\\n/g, '\n').trim()
export function safeSourceUrl(value) {
  try {
    const u = new URL(value)
    if (u.protocol !== 'https:' || u.username || u.password || u.port || !u.hostname.includes('.') || /^(localhost|127\.|10\.|192\.168\.|169\.254\.|172\.(1[6-9]|2\d|3[01])\.)/.test(u.hostname)) return null
    return u.href
  } catch { return null }
}
const cleanTitle = value => plainText(value).normalize('NFKC').toLowerCase().replace(/[\p{P}\p{S}\s]/gu, '')
export function safeActivityImage(value) {
  const safe = safeSourceUrl(value)
  if (!safe) return null
  const { hostname, pathname } = new URL(safe)
  if (hostname === 'travel.yilan.gov.tw' && pathname.startsWith('/_api/content/images/')) return safe
  if (hostname === 'admin.px-sunmake.org.tw' && /^\/Public\/(exhibition|post)\/\d+\//.test(pathname)) return safe
  if (hostname === 's3.resource.opentix.life' && /^\/upload\/program\/[^/]+\.(jpg|jpeg|png|webp)$/i.test(pathname)) return safe
  if (['cloud.culture.tw', 'event.culture.tw', 'www.culture.tw'].includes(hostname) && /\.(jpg|jpeg|png|webp)(?:$)/i.test(pathname)) return safe
  return null
}

export function parseExhibitionImages(html) {
  if (!html.includes('舉人之力：蘭陽首舉百宅第常設展')) throw new Error('展覽頁內容不符')
  const images = [...html.matchAll(/<img\b[^>]*\bsrc=["']([^"']+)["']/gi)]
    .map(match => safeActivityImage(match[1]))
    .filter(url => url && new URL(url).pathname.startsWith('/Public/exhibition/955/'))
  if (!images.length) throw new Error('展覽頁找不到展間照片')
  return [...new Set(images)].slice(0, 6)
}

// Explicitly reviewed identity mapping; fuzzy title similarity never copies photographs.
export async function enrichOfficialMedia(sources, fetcher = fetch) {
  const yilan = sources.find(s => s.source === 'yilan-site' && s.ok)
  const culture = sources.find(s => s.source === 'culture-6' && s.ok)
  if (!culture) return
  const yang = culture.items.find(i => i.external_id.startsWith('697678ed26b32454e437c439:') && cleanTitle(i.title) === cleanTitle('世紀初戀－楊麗花歌仔戲特展'))
  const direct = yilan?.items.find(i => i.external_id === '192' && cleanTitle(i.title) === cleanTitle('「世紀初戀．楊麗花」歌仔戲特展'))
  if (yang && direct && yang.end_date === direct.end_date) {
    if (!yang.images.length && direct.images.length) Object.assign(yang, { images: direct.images, image_source_name: '宜蘭勁好玩', image_source_url: direct.source_url })
    direct.duplicate_of = { source: 'culture-6', external_id: yang.external_id }
  }
  const exhibition = culture.items.find(i => i.external_id.startsWith('6977d86a26b32454e437c46e:') && cleanTitle(i.title) === cleanTitle('舉人之力：蘭陽首舉百宅第常設展'))
  if (exhibition && !exhibition.images.length && !exhibition.expired) {
    const url = 'https://www.px-sunmake.org.tw/exhibition/955'
    try {
      const html = await fetchSourceBytes(url, fetcher, true)
      Object.assign(exhibition, { images: parseExhibitionImages(html.toString('utf8')), image_source_name: '宜蘭傳藝園區／全聯善美的文化藝術基金會', image_source_url: url })
    } catch {
      culture.warnings = ['舉人之力官方圖片暫時無法更新，保留既有圖片']
    }
  }
}
export function sameEvent(a, b) {
  return cleanTitle(a.title) === cleanTitle(b.title) && dateOnly(a.event_date) === dateOnly(b.event_date)
    && cleanTitle(a.location) === cleanTitle(b.location)
}
export function possiblySameEvent(a, b) {
  if (!dateOnly(a.event_date) || !dateOnly(b.event_date) || (dateOnly(a.end_date) || dateOnly(a.event_date)) < b.event_date || (b.end_date || b.event_date) < dateOnly(a.event_date)) return false
  const left = cleanTitle(a.title).replace(/20\d{2}/g, '')
  const right = cleanTitle(b.title).replace(/20\d{2}/g, '')
  if (Math.min(left.length, right.length) < 6) return false
  const grams = value => new Set(Array.from({ length: value.length - 1 }, (_, i) => value.slice(i, i + 2)))
  const x = grams(left), y = grams(right)
  const common = [...x].filter(g => y.has(g)).length
  return 2 * common / (x.size + y.size) >= 0.6
}
export function normalizeYilanCalendar(html, expectedYear) {
  const match = html.match(/<script\b[^>]*\bid=["']__NEXT_DATA__["'][^>]*>([\s\S]*?)<\/script>/i)
  if (!match) throw new Error('宜蘭勁好玩頁面結構改變，找不到活動年曆資料')
  const page = JSON.parse(match[1])?.props?.pageProps
  if (page?.year !== expectedYear || page?.title !== '活動年曆' || !Array.isArray(page.data)) throw new Error('宜蘭勁好玩年份或資料格式不符')
  const text = value => plainText(String(value || '').replace(/<(br\s*\/?|\/p|\/li|\/div)>/gi, '\n'))
    .replace(/&(?:mdash|ndash);/g, '—').replace(/&quot;/g, '"').replace(/&apos;|&#39;/g, "'")
    .replace(/&zwj;/g, '\u200d').replace(/\n[ \t]+/g, '\n').replace(/\n{3,}/g, '\n\n')
  return page.data.map(row => {
    if (!Number.isSafeInteger(row.id) || row.id <= 0 || typeof row.title !== 'string' || !Array.isArray(row.geographies)) throw new Error('宜蘭勁好玩活動欄位改變')
    const places = row.geographies.filter(g => g.county === '宜蘭縣' && g.address)
    return {
      external_id: String(row.id), title: text(row.title), description: text(row.description),
      event_date: dateOnly(row.date_begin), end_date: dateOnly(row.date_end),
      location: row.hide_address ? '' : places.map(g => text(`${g.county}${g.district || ''}${g.address}`)).join('；'),
      organizer_name: text(row.organizer), activity_type: '觀光旅遊',
      source_url: `https://travel.yilan.gov.tw/zh-tw/event/${row.id}/`, source_updated_at: row.date_modified || null,
      schedule_uncertain: row.undecided === true || places.length > 1 || /延期|取消|停辦/.test(row.title),
      images: [...new Set([row.cover, ...(row.images || []).filter(i => !i.isSample).map(i => i.url)].map(safeActivityImage).filter(Boolean))].slice(0, 8),
      image_source_name: '宜蘭勁好玩', image_source_url: `https://travel.yilan.gov.tw/zh-tw/event/${row.id}/`
    }
  })
}
export function reviewReasons(item, official = false, { organizerOptional = false, descriptionOptional = false } = {}) {
  const reasons = []
  if (!official) reasons.push('非已核可官方來源')
  for (const [key, label] of [['title', '活動名稱'], ['event_date', '開始日期'], ['end_date', '結束日期'], ['location', '活動地點'], ['organizer_name', '主辦單位'], ['description', '活動說明'], ['source_url', '來源連結']]) {
    const optional = official && ((key === 'organizer_name' && organizerOptional) || (key === 'description' && descriptionOptional))
    if (!item[key] && !optional) reasons.push(`缺少${label}`)
  }
  if (item.event_date && item.end_date && item.end_date < item.event_date) reasons.push('結束日期早於開始日期')
  if (item.schedule_uncertain || /預計|暫定|待定|時間未定/.test(`${item.title} ${item.description}`)) reasons.push('日期或場次需確認')
  if (item.cancelled) reasons.push('來源公告取消或延期')
  if (item.source_conflict) reasons.push('來源日期或場地不一致')
  return reasons
}

export function normalizeCulture(data, source) {
  if (!Array.isArray(data) || !data.length || !data.some(row => row.UID && Array.isArray(row.showInfo))) throw new Error('來源格式改變或空白，保留現有活動')
  const result = []
  for (const row of data) {
    const venues = new Map()
    for (const show of row.showInfo || []) {
      if (!String(show.location || '').startsWith('宜蘭縣')) continue
      const location = plainText(`${show.location} ${show.locationName || ''}`)
      if (!venues.has(location)) venues.set(location, [])
      venues.get(location).push(show)
    }
    for (const [location, shows] of venues) {
      const starts = shows.map(s => dateOnly(s.time)).filter(Boolean).sort()
      const ends = shows.map(s => dateOnly(s.endTime) || dateOnly(s.time)).filter(Boolean).sort()
      result.push({
        external_id: `${row.UID}:${digest(location).slice(0, 16)}`, title: plainText(row.title),
        description: plainText(row.descriptionFilterHtml), event_date: starts[0] || null, end_date: ends.at(-1) || null,
        location, organizer_name: (row.masterUnit || []).map(plainText).filter(Boolean).join('、'),
        activity_type: source.id === 'culture-7' ? '教育講座' : '文化藝術',
        source_url: safeSourceUrl(row.sourceWebPromote) || source.feed,
        source_updated_at: row.editModifyDate || null, images: [safeActivityImage(row.imageUrl)].filter(Boolean), schedule_uncertain: shows.length > 1,
        image_source_name: source.name, image_source_url: safeSourceUrl(row.sourceWebPromote) || source.feed,
        schedule: shows.map(s => ({ start: s.time, end: s.endTime, price: plainText(s.price) }))
      })
    }
  }
  return result
}

async function fetchSourceBytes(url, fetcher, allowHtml = false, timeoutMs = 20000) {
  // Callers use registry URLs or a canonical URL with an exact host and numeric event ID.
  const response = await fetcher(url, { redirect: 'error', signal: AbortSignal.timeout(timeoutMs) })
  if (!response.ok) throw new Error(`來源 HTTP ${response.status}`)
  if (!allowHtml && /text\/html/i.test(response.headers.get('content-type') || '')) throw new Error('來源回傳 HTML 而非活動資料，請檢查來源服務')
  const reader = response.body.getReader()
  const chunks = []
  let size = 0
  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      size += value.length
      if (size > 12 * 1024 * 1024) throw new Error('來源資料超過大小上限')
      chunks.push(Buffer.from(value))
    }
  } finally { await reader.cancel() }
  return Buffer.concat(chunks)
}

export async function fetchSource(source, fetcher = fetch, now = new Date()) {
  if (source.format === 'yilan-calendar') {
    const year = Number(taipeiToday(now).slice(0, 4))
    // Explicit annual URLs avoid the site's redirect and retain next-year events in December.
    const calendars = await Promise.all([year, year + 1].map(async y => {
      const html = await fetchSourceBytes(`${source.feed}${y}/`, fetcher, true)
      return normalizeYilanCalendar(html.toString('utf8'), y)
    }))
    return calendars.flat()
  }
  const buffer = await fetchSourceBytes(source.feed, fetcher)
  const data = JSON.parse(buffer.toString('utf8').replace(/^\uFEFF/, ''))
  return normalizeCulture(data, source)
}

export async function collectActivities({ fetcher = fetch, now = new Date() } = {}) {
  const today = taipeiToday(now)
  const sources = await Promise.all(activitySources.map(async source => {
    try {
      const items = await fetchSource(source, fetcher, now)
      const unique = [...new Map(items.filter(i => i.external_id).map(i => [i.external_id, i])).values()]
      return { source: source.id, name: source.name, ok: true, items: unique.map(item => ({ ...item, reasons: reviewReasons(item, source.official, source), expired: !!item.end_date && item.end_date < today })) }
    } catch (error) {
      return { source: source.id, name: source.name, ok: false, error: error.name === 'TimeoutError' ? '來源逾時' : String(error.message).slice(0, 200), items: [] }
    }
  }))
  await Promise.all([enrichOfficialMedia(sources, fetcher), enrichCulturePrograms(sources, fetcher)])
  for (const source of sources) {
    const policy = activitySources.find(s => s.id === source.source)
    for (const item of source.items) item.reasons = reviewReasons(item, policy.official, policy)
  }
  return sources
}

export function opentixEventUrl(value) {
  const safe = safeSourceUrl(value)
  if (!safe) return null
  const url = new URL(safe)
  const match = url.pathname.match(/^\/(?:program|event)\/(\d+)\/?$/)
  return url.hostname === 'www.opentix.life' && !url.search && !url.hash && match
    ? `https://www.opentix.life/event/${match[1]}` : null
}

export function parseProgramDetails(html, item) {
  const events = []
  for (const match of html.matchAll(/<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)) {
    try {
      const data = JSON.parse(match[1])
      events.push(...(Array.isArray(data) ? data : data['@graph'] || [data]))
    } catch { /* Other page metadata need not be valid event data. */ }
  }
  const event = events.find(e => e['@type'] === 'Event' && cleanTitle(e.name) === cleanTitle(item.title))
  if (!event) throw new Error('找不到相符的活動資料')
  const venue = cleanTitle(event.location?.name)
  if (dateOnly(event.startDate) !== item.event_date || dateOnly(event.endDate) !== item.end_date || !venue || !cleanTitle(item.location).includes(venue) || event.location?.address?.addressLocality !== '宜蘭縣') return { source_conflict: true }
  const images = [event.image].flat().map(safeActivityImage).filter(Boolean).slice(0, 8)
  const organizers = [event.organizer].flat().filter(Boolean).map(o => plainText(o.name)).filter(Boolean)
  return {
    images, description: plainText(plainText(event.description)), organizer_name: organizers.join('、'),
    cancelled: /EventCancelled|EventPostponed|EventRescheduled/.test(event.eventStatus || '')
  }
}

export async function enrichCulturePrograms(sources, fetcher = fetch) {
  const jobs = sources.filter(s => s.ok && s.source.startsWith('culture-')).flatMap(source => source.items
    .filter(item => !item.expired && opentixEventUrl(item.source_url))
    .map(item => ({ source, item })))
  // Keep the scheduled import within its runtime budget even if a provider stalls.
  const queue = jobs.slice(0, 12)
  if (jobs.length > queue.length) for (const source of new Set(jobs.slice(12).map(j => j.source))) (source.warnings ||= []).push('部分活動圖片超過本次抓取上限，保留既有圖片')
  await Promise.all(Array.from({ length: Math.min(4, queue.length) }, async () => {
    while (queue.length) {
      const { source, item } = queue.shift()
      const url = opentixEventUrl(item.source_url)
      try {
        const html = await fetchSourceBytes(url, fetcher, true, 8000)
        const details = parseProgramDetails(html.toString('utf8'), item)
        if (details.source_conflict) { item.source_conflict = true; continue }
        item.cancelled = details.cancelled
        if (!item.description) item.description = details.description
        if (!item.organizer_name) item.organizer_name = details.organizer_name
        if (!item.images.length && details.images.length) Object.assign(item, { images: details.images, image_source_name: 'OPENTIX 官方活動頁', image_source_url: url })
        if (!item.images.length) (source.warnings ||= []).push(`${item.title}：官方頁尚無可用照片`)
      } catch {
        (source.warnings ||= []).push(`${item.title}：官方圖片暫時無法更新，保留既有圖片`)
      }
    }
  }))
}
