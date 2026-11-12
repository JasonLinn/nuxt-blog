---
status: 草稿
author: AI
created: 2026-11-13
updated: 2026-11-13
---

# 協會會員 API：同步預覽與去重實作

已完成本機可操作的預覽版本。正式匯入固定停用，沒有套用資料庫 migration、建立會員、儲存配對或修改公開名單，也沒有設定自動同步排程。尚未部署到正式網站。

## 操作入口

- 管理員後台：`/admin/association-sync`，側欄「協會同步預覽」。本機預覽服務為 `http://127.0.0.1:3213/admin/association-sync`，使用原有管理員登入。
- 按「產生同步預覽」才會讀取協會 API；不會隨頁面載入自動抓取。
- 結果可依類別篩選、搜尋來源／既有名稱及 ID、分頁、展開欄位差異、檢查來源內重複候選，或下載本次 JSON 快照。
- 配對是建議，不是已寫入的關係。此版沒有人工確認寫入功能；下載檔也不能直接匯入。下次重新讀取來源及 DB 重新比對。
- API 未設定、讀取失敗、來源空名單均有對應畫面；重新預覽失敗會清除前一次畫面，避免誤用舊結果。

## 這次真實唯讀比對

2026-11-13 台灣時間，來源 83 筆、全部既有會員 55 筆（包含非公開資料）。

| 分類 | 筆數 | 解讀 |
|---|---:|---|
| 高可信配對候選 | 22 | 至少兩項識別條件及區域相符、一對一，仍待確認 |
| 疑似重複待確認 | 27 | 單一條件、跨區、多候選、來源內重複或多筆指向同一既有民宿 |
| 待新增確認 | 34 | 未找到候選，仍須確認開通資格，不直接新增 |
| 既有審核限制 | 0 | 若匹配到待審核、拒絕或停用會員，會另列限制 |
| 資料異常 | 0 | 若網址、必填欄位、照片或時間格式不合，會隔離列示 |

18 筆既有會員沒有任何來源候選，僅供核對，不當作應下架名單。計數和前期僅比對公開 46 筆的粗查不同：此版納入全部會員、電話訊號、來源內重複和一對一限制。

## 去重規則

1. ID 全程維持字串，保留 `001` 的前導零。來源 ID 與既有帳號不混用。
2. 名稱做 Unicode NFKC、大小寫、空白與標點正規化。
3. 電話處理常見分隔符及 +886／00886 格式；無效短號碼不作比對訊號。
4. 官網移除 www、http/https 差異、已知追蹤參數及 fragment；保留租戶路徑、路徑大小寫、重要查詢參數與非預設埠。共享訂房平台不按網域直接合併。
5. 名稱／官網／電話任一相符即列候選。至少兩項相符、區域一致、單一候選且無來源重複才列高可信候選。
6. 若候選涉及非公開會員，優先標示審核限制；多筆來源爭用同一既有會員不得列為高可信候選。
7. 比對差異僅涵蓋名稱、區域、官網、電話、LINE 與照片；不處理登入帳密、價格、房況、評價或特色。來源空值若會清掉原值，另標示需確認。

## 安全與不匯入的保證範圍

- `POST /api/admin/association-sync/preview`：管理員驗證後讀取來源，再於 PostgreSQL `REPEATABLE READ READ ONLY` transaction 讀取全部既有會員，最後 `ROLLBACK` 並釋放連線。SQL 只選必要欄位，不讀 Email／密碼。
- `GET /api/admin/association-sync/status`：只回設定是否齊備，不回金鑰。無歷史執行紀錄資料表，故不宣稱有持久化同步狀態。
- `POST /api/admin/association-sync/run`：管理員驗證後固定回 HTTP 409 / `IMPORT_DISABLED`。即使傳 `apply=true` 或把環境變數改成啟用，也不能開啟。
- 沿用既有跨站請求檢查；三個 API 都使用 `private, no-store`。
- 來源只接受固定 `https://ythma.com/api/bnb/`；手動處理轉址，不傳金鑰到第三方。逾時涵蓋下載本文，最多 5 MiB、2,000 筆來源與 10,000 筆既有會員。
- 對 5xx／網路失敗最多重試一次；401／403／429、轉址、304、HTML、壞 JSON 不當成有效名單。來源時間超過 24 小時或超前 5 分鐘則拒絕。
- 同一程序內的併發預覽共用進行中的請求；未設跨 instance 的持久化限流，這是手動預覽版，不能當成高頻排程服務。
- Email、負責人及未知來源欄位在正規化時剔除，不回傳前端、不儲存原始 payload。JSON 下載只有白名單商家資訊，仍應只交給有權檢視的管理者。
- 金鑰已放在 Git 忽略的本機 `.env`；沒有保存到文件、知識庫、測試樣本或程式碼。

## 指令與檔案

```powershell
npm run association:preview
npm run test:association
npm run build
```

CLI 只輸出統計、指紋、時間與警告，不輸出整份會員資料；任何額外參數（包括 `--apply`）都會被拒絕。

| 檔案 | 用途 |
|---|---|
| `server/services/association-source.js` | 固定來源、認證、串流大小／時間上限、完整性驗證、白名單正規化 |
| `server/services/association-preview.js` | 會員比對、衝突分類、差異、唯讀 DB 流程 |
| `server/api/admin/association-sync/` | 預覽、設定狀態、鎖定的匯入入口 |
| `pages/admin/association-sync.vue` | 管理員預覽頁 |
| `scripts/preview-association-members.mjs` | 唯讀 CLI |
| `scripts/verify-association-preview.mjs` | 本機瀏覽器、真實 API 與 DB 無變更驗證 |
| `tests/association-*.test.mjs` | 來源、配對、限制、權限與故障測試 |

## 驗證

- 新增 20 項測試通過；連同既有安全及民宿 SEO 測試共 50 項通過。
- 變更的服務、API、Vue 頁與選單 ESLint 通過；Nuxt production build 通過。
- 本機正式建置服務實際讀取協會 API 與既有 DB，管理員預覽 HTTP 200、未登入 HTTP 401、正式匯入 HTTP 409。
- 讀取前後整張 `homestays` 表的筆數及列內容雜湊相同；未觸發會增加瀏覽數的民宿詳情 API。
- 瀏覽器驗證 1440px 桌面及 375px 手機，涵蓋搜尋、分類、分頁、下載、錯誤清除舊資料、重試、未設定狀態。無 pageerror，手機無水平溢出。
- 截圖使用合成民宿資料；真實預覽只存聚合證據。
- [驗證紀錄](./evidence/association-preview-20261113/verification.json)、[桌面截圖](./evidence/association-preview-20261113/desktop.png)、[手機截圖](./evidence/association-preview-20261113/mobile.png)。
- 建置有既有 Browserslist 資料過期及依賴 exports deprecation 提示；本次沒有擴大更新依賴。

瀏覽器腳本需可用的 Playwright；若未安裝在此 repo，可用 `PLAYWRIGHT_MODULE` 指向既有 `playwright/index.mjs`。只允許 `127.0.0.1`，避免誤測正式服務。

## 確認開通條件後的下一階段

依[原規劃](./association-member-api-plan.md)確認篩選／完整名單／取消刊登契約，完成初始人工配對與來源表 migration、交易式匯入及停用策略、共用公開查詢與快取失效，再設定排程和部署驗收。此版刻意不包含可寫入的匯入實作；不能只換一個環境變數就正式匯入。
