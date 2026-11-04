// Reviewed official pages. Dates are parsed on every run, never advanced by guessing
// next year's schedule. A changed structure is a source failure, not an empty feed.
const policy = { official: true, organizerOptional: true, descriptionOptional: true, format: 'official-page' }
export const officialPageSources = [
  { id: 'yilan-news', name: '宜蘭勁好玩（官方新聞）', feed: 'https://travel.yilan.gov.tw/zh-tw/news/307/' },
  { id: 'ncfta', name: '國立傳統藝術中心', feed: 'https://www.ncfta.gov.tw/News_Content3.aspx?n=2802&s=248557' },
  { id: 'lanyang-museum', name: '蘭陽博物館', feed: 'https://www.lym.gov.tw/ch/exhibition/special-exhibition/TSLymSpecialExhibition-000044/' },
  { id: 'sunmake', name: '宜蘭傳藝園區', feed: 'https://www.px-sunmake.org.tw/news/107' },
  { id: 'necoast', name: '東北角及宜蘭海岸國家風景區管理處', feed: 'https://events.necoast-nsa.gov.tw/flower26/page-2.html' },
  { id: 'taiwan-hotspring', name: '交通部觀光署台灣好湯', feed: 'https://taiwanhotspring.net/News-Content.aspx?a=4307&l=1' }
].map(s => ({ ...policy, ...s, url: s.feed }))

// Identity reviewed against both original publishers. Never infer identity from dates.
export const authoritativeActivityAliases = {
  'ncfta:248557': { source: 'culture-6', externalId: '697678ed26b32454e437c439:693524ccf9c5c735' }
}

export function officialText(html) {
  return String(html).replace(/<(script|style)\b[^>]*>[\s\S]*?<\/\1>/gi, '')
    .replace(/<(?:br\b[^>]*|\/p|\/div|\/h[1-6]|\/li|\/span)>/gi, '\n')
    .replace(/<[^>]*>/g, '').replace(/&nbsp;|&#160;/g, ' ').replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/\r/g, '').replace(/[ \t]+/g, ' ').replace(/\n\s*\n/g, '\n').trim()
}
function need(value, label) { if (!value) throw new Error(`官方頁面${label}改變，需重新確認`); return value }
function day(y, m, d) {
  const value = `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`
  const date = new Date(`${value}T00:00:00Z`)
  need(!isNaN(date) && date.toISOString().slice(0, 10) === value, '日期')
  return value
}
function range(text) {
  const m = need(text.match(/(20\d{2})[./-](\d{1,2})[./-](\d{1,2})\s*[~～－–—-]\s*(20\d{2})[./-](\d{1,2})[./-](\d{1,2})/), '展期')
  return { event_date: day(m[1], m[2], m[3]), end_date: day(m[4], m[5], m[6]) }
}
function block(text, start, end) {
  const at = text.indexOf(start)
  need(at >= 0, start)
  return text.slice(at + start.length).split(end)[0].trim()
}
function pageCover(html, base, accepts) {
  const tag = html.match(/<meta\b[^>]*property=["']og:image["'][^>]*>/i)?.[0]
  const value = tag?.match(/content=["']([^"']+)["']/i)?.[1]
  if (!value) return []
  try { const url = new URL(value.replace(/&amp;/g, '&'), base); return accepts(url) ? [url.href] : [] } catch { return [] }
}

// Resolve only the current page's Nuxt record, not another suggested activity's image.
export function parseSunmakeCover(html, { id, title, start, end }) {
  try {
    const match = html.match(/<script\b[^>]*id=["']__NUXT_DATA__["'][^>]*>([\s\S]*?)<\/script>/i)
    const data = JSON.parse(match?.[1] || 'null')
    if (!Array.isArray(data)) return []
    const cache = data[data[1]?.data]
    const response = data[cache?.getStoreDetail ?? cache?.getActivityDetail]
    const record = data[response?.Data]
    if (!record || data[record.Id] !== id || data[record.Title] !== title) return []
    if (start && (data[record.ActivityStartOn]?.slice(0, 10) !== start || data[record.ActivityEndOn]?.slice(0, 10) !== end)) return []
    const url = new URL(data[record.Picture])
    if (url.protocol !== 'https:' || url.hostname !== 'admin.px-sunmake.org.tw' || url.username || url.password || url.port) return []
    if (!/^\/Public\/(post|show)\/\d+\/[^/]+\.(png|jpe?g|webp)$/i.test(url.pathname)) return []
    return [url.href]
  } catch { return [] }
}
export function parseOfficialPage(html, source) {
  const text = officialText(html)
  const item = (id, title, dates, location, description, extra = {}) => ({
    external_id: id, title, ...dates, location, description: description.slice(0, 15000),
    organizer_name: '', activity_type: '文化藝術', source_url: source.feed, images: [],
    ...extra
  })
  if (source.id === 'yilan-news') {
    const json = need(html.match(/<script\b[^>]*id=["']__NEXT_DATA__["'][^>]*>([\s\S]*?)<\/script>/i), '新聞結構')
    const row = JSON.parse(json[1]).props?.pageProps?.data
    need(row?.id === 307 && row.title.includes('礁溪溫泉馬拉松'), '新聞身分')
    const body = officialText(row.description)
    const m = need(body.match(/活動日期[：:]\s*(20\d{2})年(\d{1,2})月(\d{1,2})日/), '活動日期')
    const location = need(body.match(/活動地點[：:]\s*([^\n]+)/)?.[1], '活動地點')
    return [item('307', row.title, { event_date: day(m[1], m[2], m[3]), end_date: day(m[1], m[2], m[3]) },
      `宜蘭縣礁溪鄉${location}`, body, { activity_type: '戶外運動', images: (row.images || []).filter(i => !i.isSample).map(i => i.url),
        image_source_name: source.name, image_source_url: source.feed, cancelled: /活動(?:取消|延期)|停止舉辦/.test(body) })]
  }
  if (source.id === 'ncfta') {
    need(text.includes('世紀初戀') && text.includes('楊麗花'), '展覽身分')
    const details = block(text, '活動期間：', '場次資訊')
    need(details.includes('宜蘭園區展示館'), '展覽場地')
    return [item('248557', '世紀初戀－楊麗花歌仔戲特展', range(details),
      '宜蘭縣五結鄉五濱路二段201號 國立傳統藝術中心宜蘭園區展示館',
      '展出楊麗花影音、照片、戲服及電視道具，介紹歌仔戲藝術。展覽開放時間及休館異動請參閱主辦單位公告。',
      { organizer_name: '國立傳統藝術中心', cancelled: /活動取消|展覽取消|提前閉展/.test(details) })]
  }
  if (source.id === 'lanyang-museum') {
    need(text.includes('正港宜蘭－烏石港正口兩百年特展') && text.includes('蘭陽博物館一樓特展室'), '展覽身分或場地')
    const details = block(text, '正港宜蘭－烏石港正口兩百年特展', '展覽網站')
    return [item('TSLymSpecialExhibition-000044', '正港宜蘭－烏石港正口兩百年特展', range(details),
      '宜蘭縣頭城鎮青雲路三段750號 蘭陽博物館一樓特展室',
      '紀念烏石港設立正口兩百年，透過史料、文物及多媒體呈現宜蘭水運歷史。09:00–17:00，每週三休館（國定假日依館方公告）；16:30停止售票。', { organizer_name: '宜蘭縣立蘭陽博物館',
        images: pageCover(html, source.feed, u => u.hostname === 'www.lym.gov.tw' && /^\/export\/sites\/lym\/images\/exhibition\/Special-Exhibition\/2-2-SE-20260413-port-\d+\.jpg$/.test(u.pathname)) })]
  }
  if (source.id === 'sunmake') {
    need(text.includes('感恩十載 傳藝謝平安') && text.includes('2026/01/21'), '年度節目身分')
    const year = 2026 // Only the explicitly reviewed 2026 Q4 page; never infer a new edition.
    const result = []
    const title = '哪吒海底歷險記－海洋之心'
    const show = block(text, `《${title}》`, '〖12月')
    const dates = need(show.match(/演出期間[：:]\s*(\d{1,2})\/(\d{1,2})[－–~-](\d{1,2})\/(\d{1,2})/), '月節目日期')
    need(show.includes('廟埕廣場'), '月節目場地')
    const venue = show.includes('臨水劇場') ? '廟埕廣場／臨水劇場（日期與場地異動詳見活動說明）' : '廟埕廣場'
    result.push(item('107-november', `宜蘭傳藝園區｜11月主題演出《${title}》`,
      { event_date: day(year, dates[1], dates[2]), end_date: day(year, dates[3], dates[4]) },
      `宜蘭縣五結鄉五濱路二段201號 宜蘭傳藝園區${venue}`, show, { organizer_name: '宜蘭傳藝園區' }))
    const ceremony = block(text, '謝平安系列活動', '毛孩歡喜遊')
    const single = need(ceremony.match(/活動時間[：:]\s*(\d{1,2})\/(\d{1,2})/), '謝平安日期')
    const place = need(ceremony.match(/活動地點[：:]\s*([^\n]+)/)?.[1], '謝平安場地')
    result.push(item('107-peace', '感恩十載 傳藝謝平安', { event_date: day(year, single[1], single[2]), end_date: day(year, single[1], single[2]) },
      `宜蘭縣五結鄉五濱路二段201號 宜蘭傳藝園區${place}`, ceremony, { activity_type: '節慶慶典', organizer_name: '宜蘭傳藝園區',
        images: parseSunmakeCover(html, { id: 107, title: '感恩十載 傳藝謝平安' }), image_source_name: '宜蘭傳藝園區（2026第四季系列主視覺；謝平安日為11/21）', image_source_url: source.feed }))
    return result
  }
  if (source.id === 'necoast') {
    need(text.includes('2026草嶺古道芒花季') && text.includes('大里遊客中心'), '芒花季身分或場地')
    const m = need(text.match(/開放時間[：:]\s*(20\d{2})\/(\d{1,2})\/(\d{1,2})[^\n]*?至\s*(20\d{2})\/(\d{1,2})\/(\d{1,2})/), '延期後活動日期')
    const dates = { event_date: day(m[1], m[2], m[3]), end_date: day(m[4], m[5], m[6]) }
    return [item('flower26', '2026草嶺古道芒花季', dates, '宜蘭縣頭城鎮大里遊客中心、草嶺古道（跨宜蘭與新北）',
      `活動期間為${dates.event_date}至${dates.end_date}。包含芒花健行、大里遊客中心主題裝置及假日體驗。接駁、手作、古裝體驗各有指定場次；請依官方活動頁及步道開放公告安排行程。`,
      { activity_type: '戶外運動', organizer_name: source.name,
        images: pageCover(html, source.feed, u => u.hostname === 'events.necoast-nsa.gov.tw' && u.pathname === '/flower26/common/images/fbimg.jpg') })]
  }
  if (source.id === 'taiwan-hotspring') {
    need(text.includes('礁溪溫泉') && text.includes('2026 冬戀蘭陽溫泉季'), '溫泉季身分')
    const details = block(text, '活動日期：', '更多好湯活動')
    const article = html.split('class="container-article"')[1]?.split('class="container-aside"')[0] || ''
    const images = [...article.matchAll(/<img\b[^>]*>/gi)].flatMap(([tag]) => {
      const src = tag.match(/\bdata-src=["']([^"']+)["']/i)?.[1] || tag.match(/\bsrc=["']([^"']+)["']/i)?.[1]
      try {
        const u = new URL(src || '', source.feed)
        return u.hostname === 'taiwanhotspring.net' && /^\/UserFiles\/image\/[^?#]+\.(png|jpe?g|webp)$/i.test(u.pathname) ? [u.href] : []
      } catch { return [] }
    })
    return [item('4307', '2026 冬戀蘭陽溫泉季系列活動', range(details), '宜蘭縣礁溪鄉礁溪溫泉區（各子活動場地依主辦公告）',
      `本頁為系列活動期間，不代表每天均有現場節目。子活動的確切地點、場次與內容以主辦單位後續公告為準。\n${details}`, { activity_type: '節慶慶典', images: [...new Set(images)].slice(0, 6) })]
  }
  throw new Error('未核可的官方頁面')
}
