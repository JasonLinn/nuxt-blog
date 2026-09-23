# 民宿 Neon 亞洲遷移：準備完成，正式站尚未切換

檢查日期：2026-09-23（Asia/Taipei）。本文件不含連線密碼。程式變更僅在本機，尚未 push、部署或修改 Vercel 正式環境變數。

## 已核對的環境與隔離界線

| 用途 | 已核對資訊 |
| --- | --- |
| 正式網站 | https://yilanpass.com，Vercel 專案 `yilanpass` / `prj_GwFJ5f2mjS5IVAFbcFkI5emuiIg5` |
| 正式版本 | `dpl_C2Fb9sQyRtAc7pG39G5dH7trNzVi`，Git `39a207bf062a9158cc186395fe693934ff25f7b0`，與修改前本機相同 |
| 正式運算區域 | Vercel `iad1`；尚未更動，資料庫移到亞洲不代表運算也已移到亞洲 |
| Azure 來源 | `yilan-homestay-real-data` / `mute-rain-53718608`，`azure-eastus2`，PG 17.11 |
| 來源分支／資料庫／角色 | `main` / `br-aged-tree-a81ozb8j`，`neondb`，`neondb_owner` |
| 來源端點 | `ep-fancy-snow-a8232ddc.eastus2.azure.neon.tech`（原程式使用 pooler） |
| 固定備份分支 | `migration-backup-20260923` / `br-withered-poetry-a8uhp3o8`，建立於 2026-09-23 23:36:27 +08:00；LSN `0/3729B948` |
| 新目標專案 | `yilan-homestay-asia` / `withered-mouse-93872083`，**AWS 新加坡 `aws-ap-southeast-1`**，PG 17 |
| 目標分支／資料庫 | `main` / `br-quiet-hall-b3rxiw04`，`neondb` |
| 目標端點 | `ep-crimson-pine-b3yad4cr.c-4.ap-southeast-1.aws.neon.tech` |
| 寫入測試分支 | `migration-validation-20260923` / `br-solitary-band-b3lxruch`；已含測試修改，不可當正式資料使用 |

Neon MCP 已成功列出帳戶區域、專案、分支、資料庫、角色並查詢來源。目標在原 Cheng 組織 `org-bold-bonus-28625858` 中獨立建立。原 Azure 專案、分支及資料庫保留。

本機 `.env` 和目前 Vercel production 設定的 `DATABASE_URL` 均指向既有 AWS 新加坡 `nuxt-marketing`，並不是民宿庫。已直接查詢該庫：只有 `article`、`available_hash`、`pending_coupons`、`received`、`relative`、`site_pageview`、`used_hash`、`user` 共 8 張 public 表；未把這些表複製到民宿目標。

Vercel 另有 `POSTGRES_URL*` 指向 AWS us-east-1 的 `verceldb`，屬舊整合設定；沒有拿它當遷移來源或目標，也未修改它。本機 `insert-sample-itineraries.js` 原先的通用回退已移除。

正式部署對應的 `server/utils/db.js` 寫死 Azure 民宿連線。原本部分房況、系統狀態、推薦行程 API 卻讀取通用 `DATABASE_URL`，因此會誤查沒有這些表的優惠券庫。本次修正同時涵蓋這些路徑與相關維護腳本。

## 程式變更

- `HOMESTAY_DATABASE_URL`：民宿、登入／審核、房況、價格、推薦行程、景點、宜蘭活動、轉介及既有共用來源表。
- `MARKETING_DATABASE_URL`：優惠券、文章、使用者、雜湊及站點瀏覽數。保持原資料庫位置。
- `utils/database-config.cjs`：必須明確指定專用變數；不回退到 `DATABASE_URL` 或 `POSTGRES_URL`；檢查資料庫名稱及 TLS。錯誤不輸出連線值。
- 各連線消費端移除寫死 PostgreSQL URL；共用 helper 同時支援 ESM 與 CJS 腳本。`nuxt.config.ts` 移除通用 DB runtimeConfig，專用變數在伺服器執行時讀取，不放在 public config。
- 房況修改 API 新增登入檢查：管理員可操作，民宿業者限自身 ID；匿名回 401、跨民宿回 403。
- `SITE_MAINTENANCE_MODE=true` 啟用全站伺服器維護回應：503、`Retry-After: 1200`、`Cache-Control: no-store`。預設不啟用。
- 本機 `.env` 已新增兩個專用變數；民宿仍指向 Azure，避免把日常開發默默切到演練庫。驗證伺服器以程序環境指定獨立測試分支。

## 備份與還原證據

私密備份目錄（不在 Git）：`C:\Users\cheng\AppData\Local\nuxt-blog-migration\20260923`。目錄 ACL 限目前使用者及 SYSTEM。包含原本機設定、Vercel 設定快照、私密 URL 檔、PostgreSQL 17.11 工具、custom-format 備份及還原記錄。請勿將整個資料夾上傳到 Git 或公開分享。

- `source-snapshot.dump`：222,970 bytes。
- SHA-256：`f3dea041bc54ee35084c3caf9471453c60f0d9c5b5966dcc03438bb469b2ca1a`。
- 使用固定來源分支、非 pooler 連線、完整 `pg_dump -Fc`；保留資料、結構、索引、約束、序列、函式、觸發器、owner 及 ACL。
- 第一次 `pg_restore --single-transaction --exit-on-error` 因平台 `cloud_admin` default ACL 權限而失敗，交易已完整回滾。
- 第二次只在 TOC 中排除 **兩項 `cloud_admin` 的預設 TABLE/SEQUENCE ACL**，其餘 owner / ACL 不略過；原始 archive 完整保留。還原 exit 0，約 28.8 秒。這兩項屬 Neon 平台角色，應用程式不以該角色建立物件。
- 目標 owner 仍是 `neondb_owner`，角色屬性、物件 owner / ACL 比對相同。
- 已完成實際還原與全表比對，並非僅確認檔案存在。

比對結果見 [database-comparison.json](migration-evidence/database-comparison.json)：

| 項目 | 結果 |
| --- | --- |
| 19 張表、1,193 筆資料 | 逐表筆數與所有欄位 canonical JSON SHA-256 相同，包含密碼雜湊、時間、JSON、陣列及 null |
| 民宿 | 51 筆；其餘包含 740 筆日曆房況、160 筆價格、126 筆轉介、23 筆景點、35 筆宜蘭活動 |
| 253 個可見欄位 | 類型、預設值、null/identity 設定及可見順序一致 |
| 69 個索引、45 個約束 | 定義一致（下述等價表示正規化後） |
| 17 個序列 | 定義、last_value、is_called 一致 |
| 3 個函式、1 個 trigger、1 個 view | 定義一致 |
| 106 個 relation 的 owner / ACL / RLS | 一致；沒有應用程式 RLS policy 或額外 default ACL |

已明確記錄的表示差異：來源 `homestays` 曾刪除欄位，留下實體 ordinal 空洞；還原後可見欄位順序相同。三個 CHECK 的 varchar 常值陣列轉型，在 PG 17 重新解析後由整個陣列 cast 變成逐元素 cast，語義相同。驗證器僅正規化這個確切常值陣列形式，不忽略任意約束內容。

## 功能驗證

- `npm run build` 成功；有原專案 Sass／套件 deprecation 與 chunk 提示。
- `node --test tests/*.test.mjs`：15/15 通過。
- `node scripts/test-migration-workflows.mjs ...`：25/25 通過，證據見 [workflow-results.json](migration-evidence/workflow-results.json)。
- 真實新加坡驗證分支上的 API 與 SQL 重讀：民宿／管理員登入、錯密碼、cookie 身分、業者修改、房況修改與讀回、管理員審核／撤銷、推薦行程修改；匿名及跨民宿拒絕測試通過。
- 共用讀取：列表、詳細資料、地圖、景點／分類、宜蘭活動、特色選項、行程、房況搜尋、系統狀態。
- Chrome 實際顯示民宿列表、詳細頁的名稱、中文介紹、人數、特色、價格與聯絡資訊。
- 真實建置伺服器維護模式的 GET / POST 都回 503，含上述 no-store 與 Retry-After。
- 還原工具對非空目標實際拒絕操作；不會將備份合併進既有資料庫。
- 發信環境變數在測試伺服器清空，測試聯絡地址設為 `example.invalid`；沒有寄出審核通知。優惠券庫以唯讀連線作讀取回歸測試（一般瀏覽器第一次載入可能產生原有頁面瀏覽計數，未修改其業務資料）。

驗證界線：不是全站每個前端表單的完整自動化，也未測實際郵件寄送、第三方 LINE 流程、所有歷史腳本或正式 Vercel 執行環境。只有 4 筆民宿有 `homestay_booking_status`，其他民宿的日曆 API 仍會回既有 `AVAILABILITY_DATA_NOT_FOUND`；沒有為遷移自行補造房況。

既有登入風險仍存在：硬編碼的管理員驗證／JWT 簽章設定及舊 `B + ID` 密碼回退規則不屬本次完整認證改造。本次房況授權檢查沿用現有登入機制，不能視為整個登入系統已完成安全改善。歷史 Git 曾含資料庫憑證，本次移除目前程式中的連線密碼，但沒有重寫歷史；來源密碼輪替列入切換寫入隔離步驟，行銷庫憑證需另行協調所有使用者後輪替。

## 正式切換提案：需要使用者確認，尚未執行

建議窗口：**2026-09-24 01:00–01:20 Asia/Taipei**。若批准時間已過，須重新約定窗口，不自動順延。預估全站伺服器維護最多 20 分鐘；20 分鐘是預留窗口，不是保證。失敗時先維持維護或按以下規則回復。

影響：民宿瀏覽／詳細、登入、房況、投稿、審核、修改、景點／活動／行程，以及同站優惠券頁面/API 暫停；既有靜態資產可能仍可載入。維護 API 回 503，前端送出表單可能需稍後重試。不得只封鎖 POST：詳細頁及登入也會更新計數。

1. 在窗口前完成待部署版本及私密設定檢查，保留本報告、原 deployment ID 與 Azure 回復連線。不得把含正式連線的 preview 公開給訪客；Preview 若建立，限定驗證分支並停用外發功能。
2. 確認沒有其他專案／外部排程使用來源庫。Vercel 目前 crons 為空；repository 有 `scripts/daily-cleanup.js`，本機 Task Scheduler 未找到對應任務；`C:\Github` 一般程式檔未找到其他來源端點引用（未把所有被忽略的私密設定視為已完成盤點）。遠端 cron 或其他部署仍需在切換前核對並停用或一併改設定。
3. 經批准部署維護版本（新程式、民宿暫指 Azure、行銷仍指原庫、維護 flag=true），確認正式 domain 的 GET/POST 503。保留所有新環境設定在伺服器端，**不得改寫通用 DATABASE_URL 為民宿庫**。
4. 在維護期間輪替 **Azure 來源 owner 密碼**，新密碼只交給遷移程序／私密回復設定；暫不交給可寫入的應用程式。終止來源舊應用連線並確認不存在其他應用登入角色／寫入者。已部署舊版本含舊密碼，不能再重新連線；這也阻止舊 deployment URL 繞過維護繼續寫 Azure。若無法證明寫入已停止，停止切換。
5. 在已停止寫入的 Azure 重新完整備份；這次才是最終資料。固定來源分支留作原始演練證據，不能拿它代替此最終備份。
6. 在新加坡目標專案另建最終切換分支並準備空 `neondb`（僅清理新建的專用切換副本，不碰 Azure、行銷庫或測試證據），使用下方工具 restore 到空庫；驗證最新來源與最終目標所有資料／結構／權限及序列。
7. 設定 Vercel 的 `HOMESTAY_DATABASE_URL` 指向最終切換分支，`MARKETING_DATABASE_URL` 沿用原行銷庫，保留維護模式直到設定／部署準備完成。最終端點需記錄到新報告；目前 main 是已驗證演練副本，並非已開始接正式寫入的分支。
8. 經批准正式部署／解除維護，確認 production alias、commit、實際 runtime 連線、列表／詳細／房況／登入，以及有授權的後台流程。核對每次 HTTP 回傳的業務成功值及 DB 重讀，不只看 200。觀察錯誤後才宣告正式遷移完成。
9. Azure 保留且不讓舊應用重連。正式恢復後不再雙向寫入；所有已知背景腳本也只用新的民宿專用變數。Vercel 目前在 iad1，是否改 sin1 可一併評估，但尚未修改或驗證。

## 回復規則

- **新加坡尚未接受正式寫入前**：維持維護，將新程式的 `HOMESTAY_DATABASE_URL` 指回 Azure（使用輪替後憑證），重新部署／驗證後解除維護。不要直接切回仍含舊密碼的歷史 deployment。
- **新加坡已接受任何正式寫入後**：先再停寫新加坡、完整備份，再將新加坡的最新資料還原到新的 Azure 回復分支並驗證，或逐筆核對／回補新增寫入。不可只把 env 或 alias 指回舊 Azure，否則會遺失切換後資料。
- 若需要 SQL 清理／覆寫，必須先核對專案、分支及空目標；保留雙方快照和 archive。原 Azure 本庫不自動刪除。

## 可重用命令（沒有正式切換副作用）

工具只讀 URL 私密檔，密碼以子程序環境變數傳遞，不出現在指令列。restore 只允許 AWS 新加坡、指定 hostname、資料庫 `neondb`，且拒絕任何非空目標。它不會幫忙停寫，也不會部署。

```powershell
$migrationDir = "$env:LOCALAPPDATA\nuxt-blog-migration\20260923"
python scripts/neon-backup-restore.py backup `
  --url-file "$migrationDir\source.url" `
  --expected-host ep-fancy-snow-a8232ddc.eastus2.azure.neon.tech `
  --archive "$migrationDir\final-after-freeze.dump" `
  --pg-bin "$migrationDir\pgsql\bin"

# 僅對當次確認的空最終目標使用；FINAL_HOST 需要由 Neon metadata 核對。
python scripts/neon-backup-restore.py restore `
  --url-file "$migrationDir\final-target.url" `
  --expected-host FINAL_HOST `
  --archive "$migrationDir\final-after-freeze.dump" `
  --pg-bin "$migrationDir\pgsql\bin"

node scripts/verify-database-copy.mjs `
  "$migrationDir\source.url" "$migrationDir\final-target.url" "$migrationDir\final-comparison.json"
```

目前「backup + restore 演練成功」、「本機程式／功能驗證通過」都不等於「正式站遷移完成」。截至本報告，**正式站仍在 Azure，未停寫、未輪替來源密碼、未部署、未切換**。

參考：[Neon migration tools](https://neon.com/tools)、[Neon export guide](https://github.com/neondatabase/website/blob/main/content/docs/guides/export-neon-postgres-compatible.md)、[PostgreSQL Windows clients](https://www.postgresql.org/download/windows/)、[EDB PostgreSQL binaries](https://www.enterprisedb.com/download-postgresql-binaries)。
