# Codex Scan 修補紀錄

Scan: `wfr_cdc77759efba17feb20bef71ec526d42a9ea5fee676a9a75e89b6cfeccaca9bb`
掃描版本：`3f681f64420dd04082d404a56dbef69d9fba483f`
修補分支：`codex/security-scan-fixes`

本次修補程式與本機設定，修復分支依使用者指示於審查通過後推送；未執行正式部署、未修改正式資料庫、未發送 LINE 訊息，也未將雲端掃描項目標記為已修復。使用者明確要求不更換已暴露的密碼；既有帳密及簽章金鑰值保留，移到 Git 忽略的本機 `.env`。新增 LINE 會員 Session 使用獨立隨機金鑰。

## 22 項對照

| # | 掃描問題 | 程式處理 |
|---|---|---|
| 1 | LINE 憑證內嵌前後端 | LINE Login 在伺服器交換 Token；訊息 Token 改讀私有環境變數；移除已停止服務的 Notify 憑證。歷史洩漏未輪替。 |
| 2 | 民宿備援密碼繞過 | 只接受已存在的 bcrypt hash，不再接受 B＋編號。 |
| 3 | 管理 API 缺少授權 | 管理、審核、推薦碼與代訂內容修改入口先驗證管理員。民宿可用性原有管理員／本人雙角色限制保留。 |
| 4 | 活動 PATCH SQL 注入 | 動態欄位必須出現在固定 allowlist，拒絕未知欄位與無效型別。 |
| 5 | rich text XSS | 公開活動與代訂內容使用共用 allowlist HTML 清理器，涵蓋既有儲存資料。 |
| 6 | 匿名 GitHub 圖片操作 | 上傳須管理員、民宿或經驗證的 LINE 登入；清單／刪除限管理員；固定儲存目錄與隨機圖片檔名。 |
| 7 | 固定管理員帳密 | 改讀私有環境變數，缺值不啟用預設帳密。按使用者要求保留既有值，歷史洩漏風險仍存在。 |
| 8 | 地圖 popup 圖片 XSS | 圖片 URL 限 http(s)／本地路徑，HTML 屬性跳脫；照片 reference URL 編碼；基本／詳細 popup 都處理。 |
| 9 | 固定 JWT 金鑰 | 所有既有簽發／驗證端改讀環境變數。按要求保留既有值，因此已知旧金鑰仍可能偽造 Session，不能宣稱此風險已消除。 |
| 10 | Google API 濫用與 Key 回傳 | 共用資料庫每來源與每日配額；Photo API 回傳站內代理圖片網址，不回傳伺服器 Key；瀏覽器 Key 使用獨立設定。 |
| 11 | 待審內容個資暴露 | 公開活動只查 approved；隱藏提交者資料、審核備註與原因；管理／優惠券審核讀取須管理員。 |
| 12 | 可上傳主動內容 | 解碼 JPEG／PNG／GIF／WebP，重新輸出 WebP，限制像素與大小；移除任意 `/api/files` 寫入入口。 |
| 13 | Gemini 只檢查 Cookie 存在 | 改成實際 JWT 與管理員角色驗證，再執行圖片處理；另有配額。 |
| 14 | 任意修改別人票券 | LINE Session 綁定本人；新會員欄位由驗證資料產生；領券內容由資料庫產生；停用整包錢包覆寫 API。 |
| 15 | 任意推送 LINE 訊息 | 僅管理員可使用，限制收件者／文字格式，加入配額，第三方失敗不回成功。 |
| 16 | 任意庫存、兌換與序號操作 | 庫存直接設定限管理員；領券、庫存扣減、序號配發同一交易；兌換核對本人持有券並同交易更新，拒絕重複兌換。 |
| 17 | 活動圖片刪除路徑穿越 | 必須屬於該活動、符合檔名格式與目錄邊界，拒絕 symlink 跳出。 |
| 18 | Sitemap XML 注入 | 圖片 URL 先 XML 跳脫。 |
| 19 | LINE webhook 無簽章 | 對原始 request bytes 驗證 HMAC-SHA256，再解析及執行事件。 |
| 20 | 管理通知信 HTML 注入 | 申請資料在插入通知模板前 HTML 跳脫。 |
| 21 | OAuth Token 出現在網址與 log | 停用舊 Notify callback；新 LINE callback 只回傳 Profile 與站內路徑；Token 存 HttpOnly Session。 |
| 22 | 任意讀取會員資料 | 路徑會員 ID 必須與驗證的 LINE Session 相同，只回傳錢包需要欄位。 |

## 部署前必須完成

1. 將 `.env.example` 的伺服器設定配置到目標環境；本機 `.env` 已保留原先程式中的帳密／JWT／LINE Login／推送憑證值，沒有上傳到遠端。
2. `LINE_MESSAGING_CHANNEL_SECRET` 必須是 webhook 所屬 Messaging API Channel Secret，不能拿 Login Channel Secret 代替。
3. `GOOGLE_MAPS_BROWSER_API_KEY` 使用限制網站來源與 API 的瀏覽器 Key；`GOOGLE_MAPS_API_KEY` 保留為伺服器 Key。提供者端費用與配額限制也需要設定；此分支未修改 Google Console。
4. 在 **HOMESTAY_DATABASE_URL** 對應資料庫套用 `migrations/20261008_security_rate_limits.sql`。未建立此表時，受配額保護的端點會回 503，採拒絕放行。配額是跨 instance 共用的原子計數，不能以重新啟動 instance 歸零。
5. 沒有 `password_hash` 的舊民宿帳號需要補設密碼，本次沒有自動改動正式帳號。
6. 在測試環境完成實際 LINE／LIFF 登入、投稿圖片、Google 地圖、管理登入、領券與兌換流程，再部署及重新掃描。本次測試不使用真實客戶、正式庫存或付費 API。

本次不輪替既有憑證，代表第 1、7、9 項只完成「移除程式內嵌／前端暴露」的程式處理，不代表已撤銷外洩憑證。Git 歷史未重寫。

## 行為變更

- 投稿表單先檢查上傳身分，未登入者導向 LINE Login，登入後回到原表單頁。民宿與管理員保留上傳權限。
- 領券與兌換不再信任瀏覽器傳入的庫存、姓名、券內容或整包錢包。
- `/api/user/updateCoupon`、`/api/files` 以及舊 Notify API 回 410，前台票券流程已改接原子領券／兌換。
- LINE Notify 已於 2025-03-31 結束服務：[官方公告](https://notify-bot.line.me/closing-announce)。本次未另外開發新的訂房通知服務。
- GIF 上傳會重新輸出為第一幀 WebP；最大 5 MB、2500 萬像素。

## 驗證範圍

- `node --test tests/*.test.mjs`：42 項既有／安全／審查回歸測試全部通過。
- 新增安全測試以實際 H3 HTTP handler 驗證 22 個敏感端點的匿名／偽造 Cookie 拒絕；資料庫與第三方服務隔離，不存取正式系統。
- 驗證 SQL 注入、公開狀態過濾、跨帳號存取、LINE 原始 bytes 簽章、OAuth state、XSS、假圖片與路徑穿越。
- 票券交易測試使用資料庫 test double，驗證權限／一次領取／重複兌換／失敗 rollback；不等於正式 PostgreSQL 併發壓力測試。
- 另以本機隔離 PGlite PostgreSQL 引擎實際執行限流表 migration、計數上限／時間窗重置，以及領券扣庫存／配序號、重複領取拒絕、兌換及重複兌換拒絕。這不是正式資料庫或多連線併發壓測。
- `npm run build`：完整 Nuxt production build 成功。
- `npm run test:security:build`：建置後 Nitro 伺服器的 22 個受保護入口、webhook 正確／錯誤簽章與 OAuth 導向通過；使用隔離的假憑證與不可連線的資料庫地址。
- 雲端 Scan 尚未重跑，不將本機建置視為正式環境已修復。

LINE 登入與簽章依據：[Login API](https://developers.line.biz/en/reference/line-login/)、[Webhook signature](https://developers.line.biz/en/docs/messaging-api/verify-webhook-signature/)。

## 審查後修正

- 民宿業者編輯頁改讀 `/api/features-options`，轉換為原本的選項格式；管理端權限維持不變。
- 圖片上傳改用獨立 `uploads` 配額（每來源每分鐘 20 次、全站每日 1000 次）；表單仍使用 `submissions` 配額（每來源每分鐘 5 次、全站每日 200 次）。五張圖片上傳後仍可正常投稿，超過圖片配額仍回 429。
- 領券直接用伺服器回傳的券同步錢包與會員快照，避免返回詳情頁仍顯示可領。刷新與兌換也同步兩份資料；兩個領券入口在失敗後恢復 loading 狀態並提供錯誤訊息。
- 新增五項流程回歸測試，涵蓋業者特色選項、上傳後投稿、錢包同步與兩個領券入口的成功／失敗處理。
- 最後審查改用站內圖片代理，避免把 Base64 圖片存入網址欄位；地圖支援已儲存的字串圖片網址，代理限制內容類型與串流大小。上游參數依 [Google 官方 Place Photos 文件](https://developers.google.com/maps/documentation/places/web-service/legacy/photos) 使用 `photo_reference`；新增四項回歸測試。Google reference 仍可能過期，此修改不保證第三方 reference 永久有效。
