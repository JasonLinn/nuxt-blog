# 活動主辦單位結構化資料

2026-11-10 修正 Search Console 的「url 欄位未填（位於 organizer）」建議。

## 行為

- `utils/activity-organizers.js` 維護核對過的單位名稱與官方網址，以完整名稱比對（只去除首尾空白）。
- `utils/activity-seo.js` 使用同一份資料輸出 `Organization.name` 與 `Organization.url`；詳情頁的主辦單位名稱連向相同網址。
- 不將宜蘭通首頁、售票網站首頁或活動資料來源當作主辦單位網址，不從名稱、信箱或來源網域猜測。
- 未核對的新單位仍在頁面顯示原名稱，但不輸出缺少網址的可選 `organizer` 節點。新單位應先確認官方網站／官方專頁，再新增對照。
- 無資料庫遷移，也不改動活動日期、來源、主辦單位原始名稱或匯入排程。

依據：[Google 活動結構化資料文件](https://developers.google.com/search/docs/appearance/structured-data/event#structured-data-type-definitions)。`organizer` 為建議欄位；提供時應包含 `name` 與主辦方網址。

## 網址核對依據（2026-11-10）

| 主辦單位 | 官方網址／核對來源 |
| --- | --- |
| 國立傳統藝術中心 | https://www.ncfta.gov.tw/ |
| 財團法人全聯善美的文化藝術基金會、宜蘭傳藝園區 | https://www.px-sunmake.org.tw/；https://www.px-sunmake.org.tw/about 說明營運單位關係 |
| 宜蘭縣立蘭陽博物館 | https://www.lym.gov.tw/ch/ |
| 東北角及宜蘭海岸國家風景區管理處 | https://www.necoast-nsa.gov.tw/ |
| 社團法人中華民國超級馬拉松運動協會 | https://www.ctau.org.tw/ |
| 新逸藝術有限公司 | https://newartinc.org/ |
| 雙子打擊樂團 | https://www.twinpercussion.com/ |
| 國立臺灣大學EMBA合唱團 | https://www.facebook.com/NTUEMBACHOIR；臺大官方社團介紹 https://management.ntu.edu.tw/EMBA/student-life/organization/sociality 列出此專頁 |
| 宜蘭縣五十蘭愛樂合唱團 | https://www.facebook.com/WuShiLan.Philharmonic.Choir/；主辦方活動頁 https://www.opentix.life/event/2089567965038850049 列出此專頁 |
| 財團法人台北市新合唱文化藝術基金會-台灣合唱音樂中心 | https://linktr.ee/tcmc.taiwan 自述基金會關係並列官方社群；舊站 tcmc.org.tw 本次無法連線，未採用 |

## 驗證

回歸測試：`npm run test:activities`，30 項全部通過。`npm run build` 成功；本機建置產物在 3417 port 驗證活動 63、11、87 的 SSR JSON-LD 與可見主辦單位內容通過。

部署前 `node scripts/verify-activity-organizer.mjs --baseline` 已巡覽 sitemap 的 58 個公開活動頁，45 頁含主辦單位但皆缺少網址。紀錄：`docs/evidence/activity-organizer-20261110/before.json`。

本次 11 個已核對單位涵蓋 13 頁；32 頁的歷史單位網址未核實，將只保留畫面原名稱；13 頁原本未提供單位，不新增虛構資料。

正式站驗收紀錄待部署後補入。Search Console 必須等 Google 重新擷取與驗證；網站輸出驗收不等於 Google 報表已更新。
