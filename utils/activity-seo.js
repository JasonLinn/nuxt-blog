import { absoluteHttpUrl } from './homestay-seo.js'
import { taipeiToday } from './activity-dates.js'

const siteUrl = 'https://yilanpass.com'

// API 回傳的日期可能是 "2026-11-02" 或序列化後的 ISO 時間，一律換算成台灣日期
export function taipeiDate(value) {
  if (!value) return null
  const text = String(value)
  if (/^\d{4}-\d{2}-\d{2}$/.test(text)) return text
  const date = new Date(text)
  return isNaN(date) ? null : taipeiToday(date)
}

function withTime(date, time) {
  const match = String(time || '').match(/^(\d{1,2}):(\d{2})/)
  if (!date || !match) return date || undefined
  return `${date}T${match[1].padStart(2, '0')}:${match[2]}:00+08:00`
}

export function plainText(html) {
  return String(html || '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

export function buildActivitySeo(activity) {
  const url = `${siteUrl}/yilan-activities/${encodeURIComponent(activity.id)}`
  const intro = plainText(activity.description)
  const startDate = taipeiDate(activity.event_date)
  const endDate = taipeiDate(activity.end_date) || startDate
  const dateText =
    startDate && endDate && endDate !== startDate ? `${startDate} 至 ${endDate}` : startDate
  const lead = [dateText, activity.location].filter(Boolean).join('，')
  const description = `${lead ? `${lead}。` : ''}${
    intro || `${activity.title}活動資訊、時間與地點。`
  }`.slice(0, 160)
  const images = (activity.images || []).map(absoluteHttpUrl).filter(Boolean)
  const timeRange = String(activity.event_time || '').split(/[-~～至]/)

  return {
    url,
    title: `${activity.title}｜宜蘭活動總匯｜宜蘭旅遊通`,
    description,
    image: images[0] || `${siteUrl}/logo.png`,
    schema: {
      '@context': 'https://schema.org',
      '@type': 'Event',
      '@id': url,
      url,
      name: activity.title,
      description: intro || description,
      image: images.length ? images : undefined,
      startDate: withTime(startDate, timeRange[0]),
      endDate: withTime(
        endDate,
        activity.end_time || (endDate === startDate ? timeRange[1] : undefined)
      ),
      eventStatus: 'https://schema.org/EventScheduled',
      eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
      location: activity.location
        ? {
            '@type': 'Place',
            name: activity.location,
            address: {
              '@type': 'PostalAddress',
              streetAddress: activity.location,
              addressRegion: '宜蘭縣',
              addressCountry: 'TW'
            }
          }
        : undefined,
      organizer: activity.organizer_name
        ? { '@type': 'Organization', name: activity.organizer_name }
        : undefined
    }
  }
}
