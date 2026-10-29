# yilanpass.com SEO 排查報告（2026-10-29）

- 工具：[claude-seo](https://github.com/AgriciDaniel/claude-seo) v2.5.0（commit `6be93f4`）的腳本（`sitemap_discovery`、`agentic_check`、`fetch_page`、`parse_html`），依其 `seo-audit` 流程與評分權重執行；效能用本機 Lighthouse 12.8.2。
- claude-seo 放在 `C:\Github\claude-seo`（獨立 clone + `.venv`），沒有安裝進 `~/.claude`，所以沒有全域 hook。
- 範圍：sitemap 全部 95 頁，加上從頁面連結找到的頁面，共爬 105 頁（只看伺服器回傳的 HTML，也就是不跑 JavaScript 時搜尋引擎拿到的內容），再對照程式碼。原始資料在 `data/`。
- 沒有的資料：Google Search Console、GA4、CrUX 真實使用者數據（沒有設定金鑰），所以沒有排名、曝光、點擊數字。

## 已處理（2026-10-30，分支 `fix/seo-audit-20261029`，尚未部署）

驗證方式：`nuxt build` 後用本機正式版伺服器，以 claude-seo 的 `parse_html` 重新檢查伺服器端 HTML，並在瀏覽器確認沒有 hydration 錯誤。

| 項目 | 狀態 | 修改 |
|---|---|---|
| 1. 活動內頁 canonical 指向首頁 | 已修 | `pages/yilan-activities/[id].vue` 改伺服器端載入，輸出自己的標題、描述、canonical 與 `Event` 結構化資料（`utils/activity-seo.js`）；找不到回 404 |
| 2. 全站 canonical 寫死首頁 | 已修 | 刪掉 `nuxt.config.ts` 的寫死值；`app.vue` 依路徑輸出預設 canonical 與 og:url |
| 3. 優惠券、特色店家不在 sitemap | 已修 | sitemap 改查優惠券資料庫，209 個網址（原 95）；首頁第一頁優惠券改伺服器端載入（HTML 內 12 個優惠券連結） |
| 4. 標題重複品牌名 | 已修 | `app.vue` 的 titleTemplate 在標題已含「宜蘭旅遊通」時不再加 |
| 5. 優惠券誤用 Product | 已修 | 改為店家 `LocalBusiness` + `makesOffer`（`utils/coupon-seo.js`） |
| 6. 沒有 Organization / WebSite | 已修 | 首頁加上 |
| 7. 效能 | 部分 | Google Fonts 改非同步；LINE LIFF SDK 改需要時才載入；bootstrap JS 只載 Modal、Collapse。主要 JS 156 KB → 107 KB（gzip）。本機 Lighthouse 首頁 FCP 10.8 → 5.9 秒、LCP 15.2 → 約 11 秒（本機未壓縮，數字僅供比較）。HTML 內嵌約 240 KB CSS、同時載入 gtag 與 GTM 兩套追蹤碼未處理（見下） |
| 8. 47 頁共用描述 | 已修 | 隨第 1 項解決 |
| 9. llms.txt 沒有連結 | 已修 | 改寫為 Markdown 連結 + 摘要；新增 `/llms-full.txt`（186 個連結） |
| 10. 首頁標題 | 已修 | 「宜蘭旅遊通｜宜蘭優惠券、合法民宿與在地活動」 |
| 11. 沒有 `Vary: Accept` | 已修 | `server/middleware/agent-discovery.js` |
| 12. 最後一頁仍有「下一頁」連結 | 已修 | 停用時不輸出 href |
| 13. www 用 307 | **未修** | 需要在 Vercel 後台操作（見下） |
| 14. 首頁圖片缺 alt | 已修 | 封面拼貼圖補上店家名稱 |
| 15. 圖片放在 raw.githubusercontent.com | 已修 | build 時列出 `public/` 已部署的圖片，API 與 sitemap 回傳本站網址；尚未部署的新圖保留原網址 |
| 16. robots.txt `Content-Signal` | 保留 | 刻意的 AI 使用偏好宣告 |

順手修正：
- Pinia store 在伺服器端跨請求共用同一份狀態（`state: () => initState`），改為每個請求各自一份。
- GTM noscript 寫在 template 造成每頁 hydration 錯誤，改由 `useHead` 輸出。
- 活動日期用 `toLocaleDateString`，Node 與瀏覽器格式不同造成 hydration 錯誤，改用固定格式 `formatTaipeiDate`。
- 優惠券頁、特色店家頁在 dev 模式回 500（LIFF SDK 在伺服器端載入時讀 `sessionStorage`），改為瀏覽器端才載入（`utils/liff-client.js`）。
- `nuxt.config.ts` 引用不存在的 favicon 檔案（404），改指向 `favicon.png`。
- 特色店家頁 og:url 指向不存在的 `/relative-store/`，改正並加 canonical。
- `/launch-schedule` 內容只有更新時間，設為 `noindex, follow`。

### 還需要你處理

1. **www 轉址改 308**：Vercel → 專案 yilanpass → Settings → Domains → Add `www.yilanpass.com`，設定 Redirect to `yilanpass.com`、狀態碼 308。
2. **gtag 與 GTM 兩套追蹤碼**（`nuxt.config.ts` 的 `G-45PDMJHNT9`、`app.vue` 的 `GTM-N97SLNC2`）合計約 300 KB。若 GTM 裡已設定 GA4，可拿掉 gtag 那段；要看你的追蹤設定決定。
3. **內嵌 CSS 約 240 KB**：來自全站 Bootstrap + 設計系統 SCSS，精簡需要另外規劃。

## 總分（修正前）：約 56 / 100

| 類別 | 權重 | 分數 | 重點 |
|---|---|---|---|
| 技術 SEO | 22% | 55 | HTTPS、308 轉址、真 404、sitemap 格式都正常；**47 頁 canonical 指向首頁**；優惠券頁不在 sitemap |
| 內容品質 | 23% | 60 | 民宿頁內容紮實；活動內頁伺服器端沒有內容；47 頁共用同一段描述 |
| 頁面 SEO | 20% | 55 | 約 150 頁（含優惠券頁）標題重複兩次「宜蘭旅遊通」；活動內頁沒有 H1；首頁標題偏弱 |
| 結構化資料 | 10% | 50 | 42 間民宿有 LodgingBusiness、列表有 ItemList；優惠券誤用 Product；沒有 Organization／WebSite／Event |
| 效能 | 10% | 45 | Lighthouse 手機版首頁效能 56，LCP 15.2 秒，阻擋渲染的資源約 8.4 秒 |
| AI 搜尋準備度 | 10% | 65 | robots、Content-Signal、api-catalog、Markdown 版都有；llms.txt 沒有連結 |
| 圖片 | 5% | 65 | 民宿頁 alt 文字 385/385 完整；首頁 5 張有 3 張缺 alt；部分圖片放在 raw.githubusercontent.com |

## 各頁型結果（伺服器回傳的 HTML）

| 頁型 | 頁數 | 在 sitemap | canonical 指向首頁 | 沒有 H1 | 標題重複品牌 | 結構化資料 |
|---|---|---|---|---|---|---|
| `/homestays/:id` | 42 | 42 | 0 | 0 | 0 | LodgingBusiness |
| `/yilan-activities/:id` | 47 | 46 | **47** | **46** | **46** | 無 |
| `/articles/:id`（優惠券） | 97 筆 | **0** | 0 | — | 有 | Product（誤用） |
| `/relative_shop/:id`（特色店家） | 14 筆 | **0** | — | — | — | — |
| 其他頁面（含民宿列表分頁） | 16 | 7 | 2（不含首頁本身） | 0 | 7 | 只有民宿列表有 ItemList |

優惠券和特色店家頁一頁都沒被爬到：sitemap 沒有，伺服器端 HTML 也沒有任何指向它們的連結。

## 優先處理

### Critical（立即）

1. **活動內頁 46 頁全部宣告「我是首頁的重複」**
   - `pages/yilan-activities/[id].vue:519` 在 `onMounted` 才抓資料，SEO 標籤寫在 `watchEffect` 裡，伺服器端拿不到資料，所以輸出的是全站預設值：標題「宜蘭旅遊通-宜蘭觀光民宿行銷協會 | …」、全站描述、`canonical = https://yilanpass.com`（來自 `nuxt.config.ts:100`）。
   - 實測：`/yilan-activities/75` 的 HTML 標題、描述、canonical 都是首頁的。Google 會把這 46 頁當成首頁的重複頁面，不收錄。
   - 修法：改用 `await useFetch()`（跟 `pages/homestays/[id].vue` 一樣），用 `useSeoMeta` 輸出活動自己的標題、描述、og:image、canonical，加上 `Event` 結構化資料（名稱、日期、地點、主辦單位）。

2. **全站預設 canonical 寫死成首頁**
   - `nuxt.config.ts:100` 的 `{ rel: 'canonical', href: 'https://yilanpass.com' }` 會套到所有沒有自己設 canonical 的頁面。目前受影響的頁面還有 `/coupons/submit`、`/launch-schedule`，以後新增的頁面只要忘了設也會中。
   - 修法：刪掉這行，改在 `app.vue` 依目前路徑輸出預設 canonical（`https://yilanpass.com` + `route.path`），頁面有自己的設定時會覆蓋。`app.vue:60` 的 `og:url` 也是同樣問題。

3. **97 張優惠券頁不在 sitemap，也沒有可爬的連結**
   - `server/routes/sitemap.xml.ts:146` 查的是主資料庫的 `articles` 表、條件 `status = 'published'`，但優惠券實際在 coupon 資料庫（`couponPool`）的 `article` 表，用 `archived_at IS NULL` 判斷上架。查詢失敗後被 `catch` 吞掉，所以 sitemap 一張優惠券都沒有。
   - 首頁優惠券清單在 `pages/index.vue:542` 用 `watch(..., { immediate: true })` 觸發 `$fetch`，伺服器端不會等它，所以首頁 HTML 裡 0 個優惠券連結（Lighthouse 也顯示最大內容元素是之後才載入的優惠券圖片）。
   - 修法：sitemap 改用 `couponPool` 查 `article`（`archived_at IS NULL`），一併加入 14 個 `/relative_shop/:id`、`/yilan-activities`、`/map`、`/coupon-services`；首頁第一頁清單改成伺服器端載入（`useAsyncData`）。

### High（一週內）

4. **標題重複兩次品牌名**（爬到的 53 頁，加上全部 97 張優惠券頁）：`app.vue:23` 的 titleTemplate 會自動加「- 宜蘭旅遊通」，但很多頁的標題本身已經寫了，例如 `pages/about.vue:67` →「關於我們 - 宜蘭旅遊通 - 宜蘭旅遊通」、優惠券頁「沐吉手作工坊 | 宜蘭旅遊通 - 優惠券詳情 - 宜蘭旅遊通」。把各頁標題裡的品牌名拿掉即可。
5. **優惠券頁誤用 Product 結構化資料**：`pages/articles/[id].vue:1057` 宣告成 `Product`，品牌寫「宜蘭旅遊通」、價格 0、附運費和退貨政策。優惠券不是商品，這種標記可能被 Google 判定為不實結構化資料。建議改成店家的 `LocalBusiness`（名稱、地址、電話），用 `makesOffer` 描述優惠內容，或至少拿掉運費和退貨欄位、品牌改成店家。
6. **首頁、全站沒有 Organization / WebSite 結構化資料**：建議在首頁加 `Organization`（宜蘭觀光民宿行銷協會、logo、社群連結）和 `WebSite`。
7. **效能：手機 LCP 15.2 秒**：主要被 Google Fonts CSS（`nuxt.config.ts:108`）和 `entry.css` 阻擋渲染（約 8.4 秒）。建議字型改成自架或 `media="print" onload` 非同步載入、減少字重；未使用的 CSS 約 167 KiB、JS 約 218 KiB。
8. **47 頁共用同一段描述**（大多是活動內頁，修好第 1 項就會解決）。

### Medium

9. **llms.txt 沒有任何連結**（claude-seo 與 Lighthouse 判定不合格）：`server/routes/llms.txt.get.js` 補上「重要頁面」的 Markdown 連結（民宿列表、優惠券、活動總匯、地圖），開頭加一行 `> 摘要`。可以順便補 `/llms-full.txt`（目前 404）。
10. **首頁標題偏弱**：「優惠券列表 - 探索最新優惠 - 宜蘭旅遊通」沒有「宜蘭」這個關鍵字在前面。建議類似「宜蘭旅遊通｜宜蘭優惠券、合法民宿與在地活動」。
11. **Markdown 版本沒有 `Vary: Accept`**：用 `Accept: text/markdown` 請求首頁會回 Markdown，但沒有 `Vary: Accept`，快取可能把 Markdown 給瀏覽器、或把 HTML 給 AI。
12. **民宿列表最後一頁仍輸出「下一頁」連結**：`pages/homestay-list.vue:431` 在最後一頁只加 `is-disabled`，`href` 仍指向 `?page=5`（回 404）。最後一頁不要輸出 href。
13. **www 用 307 暫時轉址**：`https://www.yilanpass.com/` → 307。到 Vercel 網域設定改成永久轉址（308）。

### Low

14. 首頁 5 張圖有 3 張缺 alt。
15. 部分優惠券圖片放在 `raw.githubusercontent.com`（快取只有 5 分鐘、沒有轉 WebP），建議移到自己的網域或 Vercel Blob。
16. Lighthouse 把 robots.txt 第 27 行 `Content-Signal` 判為「未知指令」，SEO 分數因此扣分（92）。這是刻意的 AI 使用偏好宣告，Google 會忽略，可保留。
17. `/findroom`（小寫）與 `/about/`（結尾斜線）都回 200，靠 canonical 處理，目前沒問題。

## 做得好的地方

- 民宿內頁：伺服器端渲染、獨立標題與描述、正確 canonical、LodgingBusiness 結構化資料、alt 文字完整。
- 民宿列表分頁：每頁有自己的 canonical 和 ItemList。
- HTTP→HTTPS 308、HSTS、真正的 404、robots.txt 與 sitemap 都可讀取。
- AI 爬蟲（GPTBot、ClaudeBot、PerplexityBot 等）都沒有被擋，回應內容與瀏覽器一致；有 Content-Signal、api-catalog、Markdown 版本。

## 原始資料

- `data/sitemap.json`：sitemap 偵測結果
- `data/agentic.json`：AI 爬蟲與 llms.txt 檢查
- `data/crawl.json`：105 頁的標題、描述、canonical、H1、結構化資料、圖片
- `data/lighthouse-home-mobile.json`：首頁手機版 Lighthouse
