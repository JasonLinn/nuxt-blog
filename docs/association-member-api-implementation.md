---
status: 草稿
author: AI
created: 2026-11-13
updated: 2026-11-13
---

# 協會會員 API：正式匯入與固定 ID 對照

使用者已同意依 API 名單同步，並於 2026-11-13 授權正式匯入與部署。34 筆沒有既有候選的民宿已匯入獨立公開資料表；22 筆高可信配對及 27 筆疑似重複共 49 筆仍待人工確認。沒有自動建立既有帳號對照。

既有 55 筆 `homestays` 帳號資料不受匯入修改，其中 46 筆已公開；整合來源後公開清單共有 80 家。首次匯入前後完整帳號雜湊相同；持續驗證另外排除會隨真實訪客增加的 `view_count`，核對所有其餘欄位。

## 公開呈現與操作

- 清單、詳情、統計、地圖、房況搜尋、sitemap、llms 使用共用 `public_homestays` view，合併去重後再搜尋、排序、分頁與計數。公開 view 不包含 Email、密碼或審核私人資料。
- 新來源 ID 為 `ythma_{external_id}`，來源 ID 全程字串、不截短，不建立假 Email 或共用登入帳號。未提供的價格、評分、地址、座標、容量及房況不自行補值。
- 新來源無座標不出現在地圖，無房況不列在指定日期可預訂結果；官網、LINE、電話及照片使用來源提供的公開資訊。
- 已確認配對保留原 `/homestays/{id}`、帳號、房況與價格。公開基本資料由來源覆蓋呈現，不覆寫原帳號列。已刊登的來源頁日後完成配對，詳情頁以 301 導向既有 ID。
- 來源管理的既有會員，後台基本欄位與照片停用本地編輯並指向協會官網；本地價格、房況及其他功能仍保留。更新 API 會保護原有基本資料，不接受偽造表單覆寫。
- 管理入口 `/admin/association-sync`：預覽、保存候選、逐筆確認對照、匯入符合條件資料。來源／既有內容變動，舊畫面確認會被拒絕。
- 真正匯入只接受已確認對照或沒有重複候選的來源；高可信候選也不自動配對。疑似重複需人工選擇、勾選及至少 4 字核對依據。

## 防重複與故障處理

對照表 `(source_id, external_id)` 主鍵與 `(source_id, homestay_id)` 唯一限制確保一對一；來源公開表也以來源 ID 為主鍵。交易 advisory lock 協調保存、配對、匯入與會員更新，防止重跑／併發新增第二筆。

名稱、電話、完整官網交叉比對，保留共用平台的商家路徑及重要查詢參數。比對包括全部既有會員、當期來源重複，以及已匯入但不在新名單內的來源：改用另一個來源 ID 不會繞過去重。

已配對的改名保持原 ID；未配對新來源按來源 ID 更新。新變更出現重複、審核限制或異常時暫停來源公開呈現，保留資料等待確認。`hidden` 管理停用標記不會被同步清除。

來源缺席只保留缺席紀錄，不自動下架，因供應端尚未明確保證缺席即取消刊登。API 失敗、空名單、認證錯誤、429、過舊或格式不完整的快照不會清空公開資料。來源 ID 永久不重用、完整名單與取消／重新開通行為仍需供應端保障。

來源限固定 `https://ythma.com/api/bnb/`，12 秒逾時含本文、5 MiB、2,000 筆上限、既有會員 10,000 筆上限；剔除 Email、負責人及未知欄位，禁止轉址攜帶金鑰。拒絕來源／快照版本倒退。

## 儲存與部署設定

- `association_member_reviews`：候選、內容雜湊、審核版本、來源出現狀態。
- `association_member_links`／`association_member_link_events`：固定對照與確認人、時間、依據。
- `association_public_listings`：白名單公開內容、來源版本、停用與隔離狀態。
- `association_import_runs`：每次成功交易的聚合紀錄；失敗交易不標成成功，管理 API 回淨化錯誤。
- `association_member_sync_state`：最近保存快照時間與筆數。

Vercel 專案 `yilanpass`、團隊 `jasonlinns-projects`、既有 Pro 方案。正式環境私有設定 `YTHMA_BNB_API_KEY`、`ASSOCIATION_SYNC_ENABLED=true`，沿用既有 `CRON_SECRET`。金鑰不在 Git、文件或瀏覽器中。

`vercel.json` 加入 `/api/cron/association-sync`，每 5 分鐘執行。排程驗證 Bearer secret；手動匯入要求管理員與明確 `apply:true`、跨站保護。公開清單程序快取與 sitemap／llms CDN 快取最多 60 秒。正常延遲目標約 6 分鐘，實際排程結果以部署後紀錄為準。[Vercel 排程限制](https://vercel.com/docs/schedules/cron-jobs/usage-and-pricing)

## 驗證與操作指令

58 項會員／安全／民宿 SEO 測試通過。隔離 PostgreSQL 測試涵蓋唯一限制、同組及競爭配對、重跑／併發匯入、來源改名／換 ID、缺席保留、管理停用、舊版本拒絕及帳號資料保留。新增程式與 Vue 檢查無錯誤（既有頁面 console 警告保留），Nuxt production build 通過。

本機與正式站均已驗證 80 家清單、34 個新增頁面之 sitemap／llms、官網連結、統計、地圖／房況排除、桌面／手機及匿名匯入／cron 拒絕。後台再次匯入回新增 0、未變 34、待確認 49。證據：`docs/evidence/association-import-20261113/`；[首次匯入](./evidence/association-import-20261113/initial-import.json)、[資料庫測試](./evidence/association-import-20261113/database-tests.json)、[本機驗證](./evidence/association-import-20261113/local-verification.json)、[正式站驗證](./evidence/association-import-20261113/production-verification.json)。

正式部署 `dpl_FpgYjrxTu41Y4PYjHBrpAGkupVg2` 為 READY，對應已推送 commit `1d49584b88bc29e8905f6d2cfb3846136e4ccfe8`，已掛上 `yilanpass.com` 與 `www.yilanpass.com`。2026-11-13 02:00:05 台灣時間觀察到第一輪自然排程成功，來源 83、未變 34、待確認 49，未新增重複資料。見[部署與排程紀錄](./evidence/association-import-20261113/release.json)。未操作真實協會會員修改，更新行為由隔離資料庫測試驗證。

```powershell
npm run association:migrate # 預演，不套用
node --env-file=.env scripts/migrate-association-links.mjs --apply
npm run association:preview
npm run association:stage
# 僅在已授權且設定 ASSOCIATION_SYNC_ENABLED=true 時匯入
node --env-file=.env scripts/import-association-members.mjs --apply
npm run test:association
npm run test:association:db
npm run test:association:import-db
```

回復：關閉 `ASSOCIATION_SYNC_ENABLED` 並部署可停止後續同步；若要撤回公開呈現，可回復匯入前的網站版本，或由管理員將來源的 `hidden` 設為 true。不要刪除帳號、來源 ID 或對照紀錄。資料庫新增表／view 為加法 migration，舊網站仍只讀原有會員表。
