// Exact organizer-name matches only: a ticketing/aggregation source is not the organizer.
// Verified official sites/profiles and evidence: docs/activity-organizer-schema.md.
const organizerUrls = new Map([
  ['國立傳統藝術中心', 'https://www.ncfta.gov.tw/'],
  ['財團法人全聯善美的文化藝術基金會', 'https://www.px-sunmake.org.tw/'],
  ['宜蘭縣立蘭陽博物館', 'https://www.lym.gov.tw/ch/'],
  ['宜蘭傳藝園區', 'https://www.px-sunmake.org.tw/'],
  ['東北角及宜蘭海岸國家風景區管理處', 'https://www.necoast-nsa.gov.tw/'],
  ['社團法人中華民國超級馬拉松運動協會', 'https://www.ctau.org.tw/'],
  ['新逸藝術有限公司', 'https://newartinc.org/'],
  ['雙子打擊樂團', 'https://www.twinpercussion.com/'],
  ['國立臺灣大學EMBA合唱團', 'https://www.facebook.com/NTUEMBACHOIR'],
  ['宜蘭縣五十蘭愛樂合唱團', 'https://www.facebook.com/WuShiLan.Philharmonic.Choir/'],
  ['財團法人台北市新合唱文化藝術基金會-台灣合唱音樂中心', 'https://linktr.ee/tcmc.taiwan']
])

export function buildActivityOrganizer(value) {
  const name = typeof value === 'string' ? value.trim() : ''
  const url = organizerUrls.get(name)
  // Keep unverified names visible on the page, but omit incomplete optional JSON-LD.
  return url ? { '@type': 'Organization', name, url } : undefined
}
