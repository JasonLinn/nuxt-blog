---
status: 草稿
author: AI
created: 2026-11-13
updated: 2026-11-13
---

# 協會會員 API：同步預覽、固定 ID 對照與防重複

已完成本機預覽、持久化待確認清單及逐筆確認 ID 對照。依使用者指示，以協會 API 名單作為同步來源；疑似重複先保留，不直接匯入。已在會員資料庫建立獨立對照／審核表並保存 83 筆候選，已確認對照 0 筆。沒有新增、修改或下架任何公開會員，未部署網站或設定排程。

## 操作

入口：`/admin/association-sync`，本機為 `http://127.0.0.1:3213/admin/association-sync`，沿用管理員登入。

1. 「產生同步預覽」讀取最新來源並比對，提供搜尋、分類、分頁、欄位差異及 JSON 下載；不保存資料。
2. 展開「會員 ID 對照與待確認清單」讀取保存資料，重新整理後仍保留。
3. 「更新待確認清單」保存最新候選與版本，不建立對照或匯入會員。
4. 核對來源與候選的名稱、區域、電話、完整官網及比對訊號，逐筆選擇既有民宿、勾選已核對。疑似重複須填至少 4 字核對依據。
5. 「確認此對照」只保存協會 ID → 既有民宿 ID 與確認紀錄。高可信候選也須人工確認。
6. 無候選、資料異常、審核限制或來源已缺席的資料保留，不提供直接新增。資料變動則須先更新清單。

## 實際名單狀態

2026-11-13 台灣時間，來源 83 筆、既有會員 55 筆（含非公開會員）。

| 分類 | 筆數 | 處理 |
|---|---:|---|
| 高可信配對候選 | 22 | 仍須逐筆確認 |
| 疑似重複待確認 | 27 | 保留並要求核對依據 |
| 待新增確認 | 34 | 不直接建立會員 |
| 既有審核限制／資料異常 | 0 | 若出現則阻擋配對 |
| 已確認對照 | 0 | 未代替管理員確認真實會員 |

18 筆既有會員沒有來源候選，只供核對，不當成下架名單。保存前後 `homestays` 的 55 筆完整資料雜湊相同；[保存證據](./evidence/association-links-20261113/staging.json)只有聚合資料。

## 固定 ID 與防重複

- ID 全程為字串，保留 `001` 等前導零；協會 ID 不當成旅遊通帳號 ID。
- `association_member_links` 以 `(source_id, external_id)` 為主鍵，另有 `(source_id, homestay_id)` 唯一限制。來源只能對應一家，既有民宿也不能被兩位協會會員重複占用。
- 已確認 ID 優先於文字比對。名稱、電話、官網更改仍使用原 ID；來源暫時消失或重現只改清單出現狀態，對照不刪除。
- 名稱正規化 Unicode、大小寫、空白與標點；電話正規化 +886 與分隔符；官網略過 www、http/https 差異與追蹤參數，保留商家路徑、大小寫與重要查詢參數。共用平台不因網域相同而合併。
- 至少兩項識別條件與區域相符、單一候選且無來源重複才列高可信候選。單一訊號、多候選、跨區、來源內重複與多人指向同一家均待確認。
- 確認時重新取得來源，比對已保存版本／內容雜湊，鎖定既有資料；來源或候選已變動則 HTTP 409，不套用舊畫面。
- 寫入交易以 advisory lock 協調，再由唯一限制保底。重複確認相同 ID 不新增第二筆對照或確認紀錄；同一來源改配另一家會拒絕，沒有自動重配或解除功能。
- 確認人、時間、依據與審核版本保存為管理紀錄，不公開呈現。
- 來源 ID 永久且不重用仍須供應端契約保障，不能單憑一次快照證明。

## 資料表與 API

Migration：`migrations/20261113_association_member_links.sql`，只新增表與索引，未改既有 `homestays` 欄位或資料。

| 資料表 | 用途 |
|---|---|
| `association_member_reviews` | 白名單候選、版本、內容雜湊及來源出現狀態 |
| `association_member_links` | 人工確認的一對一 ID 與依據 |
| `association_member_link_events` | 確認紀錄 |
| `association_member_sync_state` | 最新保存快照時間與筆數 |

| 管理 API | 行為 |
|---|---|
| `POST /api/admin/association-sync/preview` | 唯讀預覽，已確認對照優先 |
| `GET /api/admin/association-sync/reviews` | 讀取保存清單，檢查候選是否變動 |
| `POST /api/admin/association-sync/stage` | 保存候選，不建立對照或會員 |
| `POST /api/admin/association-sync/link` | 逐筆確認，驗證 ID、版本及候選 |
| `GET /api/admin/association-sync/status` | 設定與支援功能，不回金鑰 |
| `POST /api/admin/association-sync/run` | 固定 HTTP 409／`IMPORT_DISABLED` |

所有端點要求管理員，使用 `private, no-store`，寫入沿用跨站請求防護。不能用環境變數或 `apply=true` 開啟匯入。

來源限固定 `https://ythma.com/api/bnb/`，不將金鑰送往轉址。12 秒逾時含本文、最多 5 MiB／2,000 筆、既有會員最多 10,000 筆；5xx／網路錯誤最多重試一次。拒絕認證錯誤、429、轉址、壞 JSON、不完整筆數、重複來源 ID、過舊或超前時間；保存時另拒絕快照與會員修改時間倒退。空名單不刪對照或會員。

Email、負責人及未知欄位會剔除，不回傳或保存原始 payload。金鑰只在 Git 忽略的 `.env`。目前是手動功能，沒有跨 instance 的持久化 API 限流或自動排程。

## 指令與程式

```powershell
npm run association:preview
npm run association:migrate # 預演，ROLLBACK
node --env-file=.env scripts/migrate-association-links.mjs --apply
npm run association:stage # 只保存審核清單
npm run test:association
npm run test:association:db # 獨立 schema 的合成資料，結束後清除
npm run build
```

CLI 只輸出統計／雜湊，不輸出金鑰及完整會員名單。公開匯入尚無可執行入口。

核心：`server/services/association-{source,preview,links}.js`、`pages/admin/association-sync.vue`、`components/admin/AssociationMemberReview.vue`。

## 驗證與限制

- 會員測試加上安全及民宿 SEO 共 56 項通過；變更程式 ESLint、Nuxt production build 通過。
- 真實 PostgreSQL 在獨立 schema 測試重跑、雙向唯一限制、同組及競爭確認併發、疑似重複證據要求、審核限制、改名、缺席／重現、來源及既有資料變動、舊畫面與版本倒退；測試 schema 已清除。見[資料庫測試](./evidence/association-links-20261113/database-tests.json)。
- 真實管理員預覽 HTTP 200、未登入 HTTP 401、正式匯入 HTTP 409，完整會員雜湊前後相同。見[預覽驗證](./evidence/association-preview-20261113/verification.json)。
- 瀏覽器確認對照使用合成資料與攔截的寫入回應；真正交易由隔離資料庫測試覆蓋，不把測試對照寫入真實表。
- 1440px 桌面／375px 手機已驗證選擇與勾選、必填核對依據、重新載入、已保存對照、版本衝突、清單保存、搜尋／篩選／分頁及來源缺席保留。無頁面錯誤及水平溢出，手機表單寬度可用。見[瀏覽器證據](./evidence/association-links-20261113/browser.json)、[桌面](./evidence/association-links-20261113/desktop.png)、[手機](./evidence/association-links-20261113/mobile.png)與[手機確認表單](./evidence/association-links-20261113/mobile-form.png)。
- 本機已建置，尚未部署正式網站。建置有既有 Browserslist／依賴 deprecation 提示。

下一階段：人工確認初始配對、處理無候選會員的新增方式、公開呈現與交易式匯入、停用規則及排程，再部署驗收。依名單同步已獲使用者同意，不等於現在已匯入或自動刊登。
