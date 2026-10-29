export default defineEventHandler((event) => {
  // 設定回應的 Content-Type 為 text/plain 或 text/markdown
  setHeader(event, 'Content-Type', 'text/markdown; charset=utf-8')
  setHeader(event, 'Cache-Control', 'public, max-age=3600, s-maxage=3600')

  return `# 宜蘭旅遊通

> 宜蘭旅遊通由宜蘭觀光民宿行銷協會發起，提供宜蘭在地店家的免費電子優惠券、合法民宿推薦與宜蘭活動資訊。民宿服務以住宿資訊與推薦為主，不提供旅宿優惠券。

## 重要頁面

- [首頁：宜蘭店家優惠券](https://yilanpass.com/)：依類別、鄉鎮搜尋在地店家的免費電子優惠券
- [宜蘭民宿推薦](https://yilanpass.com/homestay-list)：宜蘭各鄉鎮合法民宿，可依人數、特色篩選
- [優惠券地圖](https://yilanpass.com/map)：在地圖上查看附近的店家優惠
- [宜蘭活動總匯](https://yilanpass.com/yilan-activities)：宜蘭近期活動的日期、地點與主辦單位
- [特色店家](https://yilanpass.com/relative)：宜蘭特色店家與服務
- [行程規劃](https://yilanpass.com/itinerary)：宜蘭推薦行程
- [關於我們](https://yilanpass.com/about)：宜蘭旅遊通與宜蘭觀光民宿行銷協會介紹

## 完整清單

- [llms-full.txt](https://yilanpass.com/llms-full.txt)：全部民宿、優惠券、活動頁面的連結
- [Sitemap](https://yilanpass.com/sitemap.xml)

## 網站資訊

- 網站名稱：宜蘭旅遊通
- 發起單位：宜蘭觀光民宿行銷協會
- 服務地區：台灣宜蘭縣
`
})
