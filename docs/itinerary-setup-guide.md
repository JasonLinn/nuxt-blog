# 行程規劃系統設定指南

這份指南將協助您設定完整的行程規劃系統。

## 1. 環境變數設定

1. 複製 `.env.example` 到 `.env`：
   ```bash
   cp .env.example .env
   ```

2. 編輯 `.env` 檔案，填入以下資訊：

### 必要設定

#### Google Maps API Key
```
GOOGLE_MAPS_API_KEY=你的_Google_Maps_API_金鑰
```

**取得方式：**
1. 前往 [Google Cloud Console](https://console.cloud.google.com/)
2. 建立新專案或選擇現有專案
3. 啟用以下 API：
   - Maps JavaScript API
   - Places API
   - Geocoding API
4. 建立憑證 > API 金鑰
5. 複製金鑰到 `.env` 檔案

#### 資料庫連線（Neon）
```
DATABASE_URL=你的_Neon_資料庫連線字串
```

**取得方式：**
1. 前往 [Neon Console](https://console.neon.tech/)
2. 建立新專案或選擇現有專案
3. 在 Dashboard 中複製連線字串
4. 格式：`postgresql://username:password@host/database?sslmode=require`

## 2. 資料庫初始化

1. 執行資料庫建表腳本：
   ```bash
   # 如果您有 psql 指令
   psql "你的_DATABASE_URL" -f scripts/create-places-tables.sql
   ```

   或者您可以：
   - 登入 Neon Console
   - 開啟 SQL Editor
   - 複製 `scripts/create-places-tables.sql` 的內容並執行

## 3. 安裝相依套件

```bash
npm install
```

## 4. 啟動開發伺服器

```bash
npm run dev
```

## 5. 存取系統

- **一般使用者頁面**：http://localhost:3000/itinerary
- **管理員頁面**：http://localhost:3000/admin/places

## 6. 系統功能測試

### 管理員功能測試
1. 前往 `/admin/places`
2. 點擊「新增地點」
3. 使用 Google 地圖搜尋功能添加地點
4. 確認地點正確儲存到資料庫

### 使用者功能測試
1. 前往 `/itinerary`
2. 選擇旅行日期
3. 從地點列表新增行程項目
4. 確認地圖正確顯示路線

## 7. 生產環境部署

### Vercel 部署
1. 在 Vercel 專案設定中新增環境變數
2. 確保 `DATABASE_URL` 和 `GOOGLE_MAPS_API_KEY` 已設定

### 其他平台
確保所有環境變數都已正確設定在部署平台上。

## 8. 故障排除

### Google Maps 無法載入
- 檢查 API 金鑰是否正確
- 確認已啟用必要的 Google APIs
- 檢查 API 金鑰的網域限制

### 資料庫連線失敗
- 確認 DATABASE_URL 格式正確
- 檢查 Neon 專案是否啟用
- 確認資料庫表格已建立

### API 呼叫失敗
- 檢查瀏覽器開發者工具的 Console
- 確認後端 API 路由正常運作
- 檢查資料庫連線狀態

## 9. 系統架構說明

### 資料庫表格
- `places` - 地點資料
- `place_categories` - 地點分類
- `place_images` - 地點圖片
- `itineraries` - 行程資料
- `itinerary_items` - 行程項目

### API 端點
- `/api/google/places/search` - Google 地點搜尋
- `/api/google/places/details` - Google 地點詳情
- `/api/admin/places` - 管理員地點管理
- `/api/places` - 公開地點列表
- `/api/place-categories` - 地點分類

### 前端頁面
- `/itinerary` - 使用者行程規劃
- `/admin/places` - 管理員地點管理

## 10. 進階設定

### Google Maps API 配額管理
- 監控 API 使用量
- 設定適當的配額限制
- 考慮使用 API 金鑰限制

### 效能優化
- 啟用資料庫索引
- 使用 CDN 快取圖片
- 考慮實作 Redis 快取

如有任何問題，請檢查相關日誌檔案或聯繫技術支援。
