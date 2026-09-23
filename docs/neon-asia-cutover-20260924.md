# 民宿資料庫正式切換完成

日期：2026-09-24，Asia/Taipei。使用者於準備完成後明確批准「可以切換了」。本報告不含密碼。

## 正式狀態

- 正式網站：https://yilanpass.com 。已解除維護，民宿資料實際讀寫 AWS 新加坡 `aws-ap-southeast-1`。
- Neon 專案：`yilan-homestay-asia` / `withered-mouse-93872083`。
- 正式分支：`production-cutover-20260924` / `br-cold-snow-b37z8ghz`；資料庫 `neondb`。
- 正式端點：`ep-steep-sea-b346nvz4.c-4.ap-southeast-1.aws.neon.tech`。
- 切換部署：`dpl_GojPzTzMb5zwwKD8wghKSn4hbeEF`，程式 commit `045e6679c9bcbaab55e45214c4d75863283066a5`。後續 main 同步部署使用相同程式與正式環境變數。
- 優惠券維持原 `nuxt-marketing` 資料庫，沒有搬移、合併、清空或覆寫；`DATABASE_URL` 保留原值，`MARKETING_DATABASE_URL` 指向同一原庫。
- Azure 原專案 `mute-rain-53718608`、原 main 與固定備份分支均保留。Azure owner 密碼已輪替，舊直接連線與 pooler 憑證皆被拒絕。
- Vercel 運算區域仍為 `iad1`；這次確認的是資料庫位於亞洲。

## 停寫、備份與完整性

01:19:19 已確認正式 GET/POST 均回 503；01:19:49 已確認舊 Azure 登入失效且舊連線清空。其後才備份與還原。新加坡部署於約 01:24 推廣，01:25:54 完成全部正式 API 驗證；維護約 5 分鐘（首個確認 503 至恢復後驗證的保守上限約 7 分鐘）。

最終 archive `final-after-freeze.dump`：222,966 bytes，SHA-256 `80fe06bc544ba8186bbc8945b5edb8ac8b4e5ed4987a0cf55a0a8d85f2a47c3e`。完整私密備份、Azure 輪替後回復連線與原 production env 保存在 `%LOCALAPPDATA%\nuxt-blog-migration\20260923`，目錄權限限定本機使用者與 SYSTEM，未放入 Git。

備份已實際還原到新建空白最終分支，不是僅確認檔案存在。保留應用 owner/ACL，僅排除兩筆 Neon 平台 `cloud_admin` default ACL。停寫後來源與最終目標比對：19 張表、1,193 筆資料（51 筆民宿）、253 欄位、69 索引、45 約束、17 序列、函式/trigger/view、角色與必要權限全部一致。完整欄位 canonical JSON SHA-256 與序列值皆相同。表示差異正規化範圍見切換前報告。

- [最終完整性比對](migration-evidence/final-comparison.json)
- [最終備份 SHA-256](migration-evidence/final-backup-sha256.json)
- [Azure 寫入隔離證據](migration-evidence/source-freeze-evidence.json)
- [正式維護回應](migration-evidence/maintenance-live.json)
- [正式 API 與資料流驗證](migration-evidence/production-verification.json)

## 驗證結果與界線

- 本機 production build 成功，15/15 單元測試通過。
- 隔離的新加坡驗證分支：25/25 功能測試通過，含登入、業者修改、房況修改/SQL 重讀、管理員審核/撤銷、行程修改、未登入與跨民宿拒絕。測試資料沒有進入正式切換分支。
- 正式網域：16 項檢查通過，含列表、詳細、地圖、景點/分類、活動、特色、行程、房況、管理員/業者登入、cookie 身分、待審列表、未授權房況更新 401、優惠券與站點統計。
- 正式詳細頁 id 2373 使新加坡 `view_count` 93 → 94；同時 Azure 93 → 93。這是實際 runtime 寫入目的地證據，不只檢查環境變數。
- Chrome 正式列表與民宿詳細頁已顯示名稱、中文介紹、人數、特色、價格等真實資料。
- 切換部署的 Vercel runtime logs 查詢未見 5xx（當時觀察窗口）；預期未授權測試產生 401。
- 正式站未用真實業者資料執行審核/內容改寫壓測；相關有副作用流程已在隔離分支完整驗證。未驗證實際外寄通知與第三方 LINE 全流程。

## 回復與後續

**新加坡已接受正式寫入。不得直接切回舊 Azure 或舊 deployment。** 若需回復：先停寫新加坡、完整備份最新資料，再還原到新 Azure 回復分支並完整比對，或核對補回所有切換後寫入；部署新程式指向已同步回復庫，確認後解除維護。保留原 Azure 本庫。舊部署的內嵌 Azure 密碼已失效，不能當作一鍵回復方案。

目前無阻擋此次切換的待辦。仍需另案處理原有管理員/JWT 硬編碼、舊業者密碼回退規則與歷史 Git 行銷庫憑證輪替；本次沒有聲稱完成整體認證安全改造。若有外部排程仍持舊 Azure 密碼，會拒絕登入，需另核對其用途後配置專用新連線；沒有將新密碼散發给未知程式。Vercel 運算遷至新加坡可另行評估。
