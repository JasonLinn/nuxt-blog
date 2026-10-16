export default defineEventHandler((event) => {
  // 設定回應的 Content-Type 為 text/plain 或 text/markdown
  setHeader(event, 'Content-Type', 'text/markdown; charset=utf-8')

  return `# 宜蘭旅遊通-宜蘭觀光民宿行銷協會

本網站提供宜蘭在地店家的免費電子優惠券、合法民宿推薦與旅遊資訊。民宿服務以住宿資訊與推薦為主，不提供旅宿優惠券。

## 網站資訊
- **網站名稱**: 宜蘭旅遊通-宜蘭觀光民宿行銷協會
- **網站網址**: https://yilanpass.com

## 主要服務
- 搜尋宜蘭各區合法民宿推薦與住宿資訊
- 查詢熱門住宿方案與價格
- 探索宜蘭旅遊景點與在地店家電子優惠券
- 提供業者管理住宿資訊與行銷服務

我們致力於為旅客提供最全面且有保障的宜蘭住宿選擇，讓您輕鬆規劃完美的宜蘭之旅。
`
})
