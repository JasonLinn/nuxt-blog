/**
 * GET /api/markdown
 * Returns a Markdown representation of the homepage for AI agents.
 * Implements Markdown content negotiation (Accept: text/markdown).
 */
export default defineEventHandler((event) => {
  setResponseHeader(event, 'Content-Type', 'text/markdown; charset=utf-8')
  setResponseHeader(event, 'x-markdown-tokens', '800')
  setResponseHeader(event, 'Cache-Control', 'public, max-age=3600')

  return `# 宜蘭旅遊通 — 宜蘭觀光民宿行銷協會

**網址**: https://yilanpass.com
**描述**: 宜蘭地區合法民宿推薦平台，提供親子民宿、寵物民宿、海景民宿、包棟民宿等多種主題住宿。

## 主要服務

- 搜尋並預訂宜蘭各區優質合法民宿
- 依特色篩選：親子 / 寵物 / 海景 / 包棟 / 戲水池 / KTV / 烤肉
- 查詢熱門住宿方案與即時優惠券
- 探索宜蘭旅遊景點與活動資訊
- 業者管理住宿資訊與行銷服務

## 主要頁面

| 路徑 | 說明 |
|------|------|
| / | 首頁 — 精選民宿、最新文章、優惠 |
| /homestay-list | 民宿列表 — 全部合法民宿搜尋 |
| /homestays/{id} | 民宿詳情 — 房型、價格、設施、位置 |
| /articles | 旅遊文章列表 |
| /articles/{id} | 旅遊文章詳情 |
| /relative | 宜蘭周邊景點、活動、優惠 |
| /llms.txt | AI 模型參考文件 |

## API 端點

| 路徑 | 說明 |
|------|------|
| /api/fetchBnbs | 民宿列表查詢（含篩選條件） |
| /api/fetchBnbDetail | 民宿詳細資訊查詢 |
| /api/search-available-homestays | 依入住日期搜尋可用民宿 |
| /api/articles | 旅遊文章列表 |
| /api/coupons | 優惠券資訊 |

## 機構資訊

- **名稱**: 宜蘭觀光民宿行銷協會
- **地區**: 宜蘭縣（台灣）
- **Sitemap**: https://yilanpass.com/sitemap.xml
- **robots.txt**: https://yilanpass.com/robots.txt
`
})
