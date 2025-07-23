# 宜蘭通優惠券 + 活動總匯專案

## 🎯 專案技術棧
**⚠️ 重要：本專案使用 Bootstrap 5 + SCSS，不使用 Tailwind CSS！**

- **Frontend**: Nuxt.js 3 + Vue.js 3
- **CSS Framework**: Bootstrap 5 + SCSS（位於 `assets/scss/`）
- **Backend**: Nuxt Server API
- **Database**: Neon (PostgreSQL) with Serverless
- **Image Processing**: Formidable for file uploads

## 🚨 開發注意事項

### CSS 風格指南
- ✅ **使用**: Bootstrap 類別 (`container`, `card`, `btn`, `form-control`, `table`, etc.)
- ❌ **不使用**: Tailwind 類別 (`mx-auto`, `p-6`, `text-gray-600`, `bg-white`, etc.)
- 自定義樣式放在 `assets/scss/` 目錄下
- 組件樣式使用 `<style scoped lang="scss">`

### 正確的 Bootstrap 類別示例
```html
<!-- ✅ 正確的 Bootstrap 寫法 -->
<div class="container">
  <div class="card shadow">
    <div class="card-header">
      <h1 class="display-5 fw-bold text-primary">標題</h1>
    </div>
    <div class="card-body">
      <button class="btn btn-primary">按鈕</button>
    </div>
  </div>
</div>

<!-- ❌ 錯誤的 Tailwind 寫法 -->
<div class="container mx-auto p-6">
  <div class="bg-white shadow-lg rounded-lg">
    <div class="p-6 border-b">
      <h1 class="text-3xl font-bold text-gray-800">標題</h1>
    </div>
  </div>
</div>
```

## 📁 專案結構

### 宜蘭活動總匯功能
- `pages/yilan-activities/` - 前端頁面
  - `index.vue` - 活動列表頁（Bootstrap 卡片佈局）
  - `[id].vue` - 活動詳情頁（自定義美觀設計）
  - `submit.vue` - 活動投稿表單（Bootstrap 表單）
- `pages/admin/yilan-activities.vue` - 管理後台（Bootstrap 表格）
- `server/api/yilan-activities/` - API 端點
- `components/LayoutHeader.vue` - 導航選單

### 資料庫表結構
```sql
-- yilan_activities 表包含以下欄位：
id, title, description, images, event_date, event_time, location, 
activity_type, organizer_name, organizer_email, organizer_phone, 
contact_info, status, rejection_reason, submitter_name, 
submitter_email, admin_notes, created_at, updated_at, 
approved_at, approved_by
```

## 🛠️ 開發指令

### 啟動開發服務器
```bash
npm run dev
```

### 代碼檢查和修復
```bash
npm run lint        # 檢查代碼風格
npm run typecheck   # 類型檢查（如果有 TypeScript）
```

## 📝 API 端點

### 宜蘭活動總匯 API
- `GET /api/yilan-activities` - 獲取活動列表
- `GET /api/yilan-activities/[id]` - 獲取單個活動詳情  
- `POST /api/yilan-activities` - 提交新活動投稿
- `POST /api/yilan-activities/[id]/approve` - 審核通過活動
- `POST /api/yilan-activities/[id]/reject` - 退回活動投稿

## 🎨 UI/UX 設計原則

1. **響應式設計**：使用 Bootstrap 網格系統
2. **一致性**：統一使用 Bootstrap 組件和工具類
3. **可讀性**：充足的對比度和清晰的字體層級
4. **用戶體驗**：載入狀態、錯誤處理和成功反饋

## 🔧 常見修復模式

### 將 Tailwind 轉換為 Bootstrap
```html
<!-- Tailwind → Bootstrap 轉換示例 -->
bg-white          → card / bg-white
shadow-lg         → shadow
rounded-lg        → rounded
p-6               → p-4 / p-3
text-gray-600     → text-muted
font-bold         → fw-bold
flex items-center → d-flex align-items-center
```

## 🚀 部署注意事項

- 確保所有圖片路徑正確
- 檢查環境變數設定
- 驗證資料庫連線配置
- 測試 API 端點功能