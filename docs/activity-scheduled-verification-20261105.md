# 2026-11-05 活動同步排程驗收

台灣時間 10:15 起驗收。結果：當日排程同步成功，未發現需修復的同步或公開資料問題。本次沒有手動同步、修改正式資料或重新部署。

## 自然排程證據

- 正式 `activity_import_runs` run **32**：`success`；UTC `2026-11-05T02:00:38.171Z` 開始、`02:00:44.875Z` 完成，即台灣時間 **10:00:38–10:00:44**。
- 本次查核前該執行已存在，上一筆 run 31 是前日手動驗證。本次沒有呼叫同步端點或平台手動 Cron。
- Vercel Cron 回讀：`enabled: true`、`/api/cron/activity-import`、`0 2 * * *`，無 undeployed/modified 設定，host 為目前正式部署。
- 11 個來源全部 `ok: true`，各 `attempts: 1`，沒有觸發重試或備援。新增 0、更新 0：當日官方重點活動內容未變，不是未執行。
- 來源資料量未見昨日的異常縮水；當日再次唯讀擷取的原始量亦相同。

| 來源 | run 32 原始量 |
| --- | ---: |
| culture-1 音樂 | 468 |
| culture-6 展覽 | 278 |
| culture-7 講座 | 100 |
| yilan-site 宜蘭年曆 | 60 |
| culture-other 其他藝文 | 1328 |
| yilan-news | 1 |
| ncfta | 1 |
| lanyang-museum | 1 |
| sunmake | 2 |
| necoast | 1 |
| taiwan-hotspring | 1 |

## 正式資料與頁面

- 正式列表 API HTTP 200，當日未結束公開活動 **13 筆**，ID 集合與正式資料庫一致；13 是當日結果，非永久標準。
- 楊麗花 ID 63 與新補登 ID 77–82，七個詳細 API 均 HTTP 200，日期、圖片與資料庫一致；七個公開詳細頁均 HTTP 200，HTML 包含對應活動名稱。列表頁 HTTP 200。
- 楊麗花結束日仍為 **2027-03-01**，與當日傳藝中心官方內容一致，未被舊來源覆寫。官方來源的 `last_seen_at` 與本次 run 開始時間一致。
- 六項補登活動當日官方內容皆存在且日期一致，來源映射均為 `published`，`last_seen_at` 均更新至本次執行。楊麗花的年曆來源映射標為 `duplicate` 是預期去重，不代表另外刊登一筆。
- 同標題、日期及地點之公開未結束活動重複檢查為空。
- 六項新增活動中五項圖片均實際 GET 成功（HTTP 200、image MIME）：礁溪馬拉松、正港宜蘭、哪吒、傳藝謝平安、芒花季。昨日補圖仍保留。
- **冬戀蘭陽溫泉季仍無可核對的官方活動圖**；當日來源與正式資料均無圖，run 保留缺圖警告。這是已知素材缺口，不是同步失敗。

## 正式版本與證據位置

- Vercel 正式部署：`dpl_2gmwSMZBEDbqJ5c7zdFENXf51AKj`，狀態 `READY`。
- SHA：`1785c8cb7892df5fecfca1e47c73f9798ac40e12`；正式別名 `https://yilanpass.com`。
- `output/activity-scheduled-check-20261105/runs-before.json`：先於任何手動觸發的正式歷史執行讀回（本次始終沒有手動觸發）。
- `output/activity-scheduled-check-20261105/verification.json`：正式資料、映射、公開 API、詳細頁 HTTP、官方內容比對與圖片讀取結果。
- `output/activity-scheduled-check-20261105/cron-status.json`：Vercel CLI `crons ls --format json` 回讀。

## 驗收界線與後續

本次確認排程時段自然產生的成功執行及資料到公開頁面的結果；Vercel runtime console 查詢沒有回傳日誌，未以空日誌推論無錯誤，也未取得完整 HTTP request user-agent 證據。未進行新的瀏覽器視覺或全站功能回歸測試，未改程式，因此未重跑昨日程式測試。本次結果不能保證未來永遠正常或所有宜蘭活動皆已收錄。

一次性 Codex 追蹤驗收至此結束；網站每日台灣時間 10:00 Cron 保留。
