// Date-only activity boundaries use Taiwan's calendar, including on UTC servers.
export function taipeiToday(now = new Date()) {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Taipei', year: 'numeric', month: '2-digit', day: '2-digit' }).format(now)
}

export function dateOnly(value) {
  if (value instanceof Date) return taipeiToday(value)
  const match = String(value || '').match(/^(\d{4})[-/](\d{2})[-/](\d{2})/)
  if (!match) return null
  const date = `${match[1]}-${match[2]}-${match[3]}`
  const parsed = new Date(`${date}T00:00:00Z`)
  return !isNaN(parsed) && parsed.toISOString().slice(0, 10) === date ? date : null
}

export function activityWindow(filter, now = new Date()) {
  const today = taipeiToday(now)
  const [year, month] = today.split('-').map(Number)
  const day = (y, m, d) => new Date(Date.UTC(y, m, d)).toISOString().slice(0, 10)
  if (filter === 'all') return [null, null]
  if (filter === 'thisWeek') return [today, day(year, month - 1, Number(today.slice(8)) + 6)]
  if (filter === 'thisMonth') return [day(year, month - 1, 1), day(year, month, 0)]
  if (filter === 'nextMonth') return [day(year, month, 1), day(year, month + 1, 0)]
  if (filter === 'past') return [day(year, month - 7, Number(today.slice(8))), day(year, month - 1, Number(today.slice(8)) - 1)]
  return [today, null]
}

export function overlapsActivity(activity, start, end) {
  const first = dateOnly(activity.event_date)
  const last = dateOnly(activity.end_date) || first
  return !!first && (!start || last >= start) && (!end || first <= end)
}
