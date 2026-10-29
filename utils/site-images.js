// 上傳流程會把圖片 commit 到 repo 的 public/ 並回傳 raw.githubusercontent.com 網址。
// 圖片部署後已由本站提供（可長期快取），所以把「這次 build 已包含」的檔案改回本站網址；
// 還沒部署的新圖片保留原網址，避免破圖。
const siteUrl = 'https://yilanpass.com'
const rawPublicPrefix = /^https:\/\/raw\.githubusercontent\.com\/[^/]+\/[^/]+\/[^/]+\/public\/(.+)$/

export function createSiteImageRewriter(publicFiles) {
  const files = new Set(publicFiles)

  const rewrite = (url) => {
    if (typeof url !== 'string') return url
    const match = url.trim().match(rawPublicPrefix)
    if (!match) return url
    let path
    try {
      path = decodeURIComponent(match[1])
    } catch {
      return url
    }
    return files.has(path) ? `${siteUrl}/${encodeURI(path)}` : url
  }

  // 改寫一筆資料中的圖片欄位（字串或字串陣列），回傳新物件
  const rewriteRow = (row, fields = ['cover', 'images']) => {
    if (!row || typeof row !== 'object') return row
    const next = { ...row }
    for (const field of fields) {
      const value = next[field]
      if (Array.isArray(value)) next[field] = value.map(rewrite)
      else if (typeof value === 'string') next[field] = rewrite(value)
    }
    return next
  }

  return { rewrite, rewriteRow }
}
