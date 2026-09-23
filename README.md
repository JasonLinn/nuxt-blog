# 宜蘭旅遊整合平台

一個基於 Nuxt 3 開發的宜蘭旅遊服務整合平台，包含優惠券系統、民宿管理、商家推薦、部落格文章等多項功能。

## 🏗️ 系統架構

本平台採用多資料庫架構設計，將不同功能模組的資料分離管理：

### 主要功能模組

- **💰 優惠券系統** - 獨立資料庫
- **🏠 民宿管理系統** - 獨立資料庫 (Neon PostgreSQL)
- **📝 部落格文章系統** - 獨立資料庫
- **🏪 相關商家推薦** - 獨立資料庫
- **👥 用戶管理系統** - 跨系統整合
- **🤖 Line Bot 整合** - 通知與互動
- **🗺️ Google Maps 整合** - 地圖服務

## 🚀 快速開始

### 環境需求

- Node.js 18+ 
- npm 或 pnpm 或 yarn
- PostgreSQL 資料庫 (建議使用 Neon)

### 安裝步驟

1. **克隆專案**
```bash
git clone <repository-url>
cd nuxt-blog
```

2. **安裝相依套件**
```bash
npm install
# 或
pnpm install
# 或
yarn install
```

3. **環境變數設定**

創建 `.env` 檔案並設定以下變數：

```bash
# 資料庫連接
HOMESTAY_DATABASE_URL=postgresql://ROLE:PASSWORD@HOMESTAY_HOST/neondb?sslmode=require
MARKETING_DATABASE_URL=postgresql://ROLE:PASSWORD@MARKETING_HOST/nuxt-marketing?sslmode=require

# Google Maps API
GOOGLE_MAPS_API_KEY=your_google_maps_api_key

# GitHub 整合 (用於圖片上傳)
GITHUB_TOKEN=your_github_token
GITHUB_USERNAME=your_github_username
GITHUB_REPO=your_github_repo

# Google Analytics
GA_MEASUREMENT_ID=G-XXXXXXXXXX

# Ngrok (開發用)
NGROK_AUTHTOKEN=your_ngrok_token
```

4. **資料庫初始化**

執行資料庫遷移腳本：
```bash
node scripts/run-migration.js
```

5. **啟動開發伺服器**
```bash
npm run dev
```

伺服器將在 `http://localhost:3000` 啟動

## 📁 專案結構

```
nuxt-blog/
├── components/          # Vue 元件
│   ├── ui/             # UI 通用元件
│   ├── CategorySelector.vue
│   ├── CouponList.vue
│   ├── GoogleMap.vue
│   └── ...
├── pages/              # 頁面路由
│   ├── admin/          # 管理員頁面
│   ├── articles/       # 文章相關頁面
│   ├── homestays/      # 民宿相關頁面
│   ├── relative_shop/  # 商家頁面
│   └── ...
├── server/             # 後端 API
│   ├── api/            # API 端點
│   │   ├── articles/   # 文章 API
│   │   ├── homestays/  # 民宿 API
│   │   ├── relative/   # 商家 API
│   │   ├── user/       # 用戶 API
│   │   └── ...
│   └── utils/          # 工具函數
├── store/              # Pinia 狀態管理
├── assets/             # 靜態資源
├── public/             # 公開檔案
└── plugins/            # Nuxt 插件
```

## 🔌 API 文檔

### 優惠券系統 API

#### 取得優惠券列表
```http
GET /api/cupon
```

#### 更新優惠券狀態
```http
PATCH /api/cupon
Content-Type: application/json

{
  "couponId": "string",
  "status": "used|unused"
}
```

### 民宿系統 API

#### 民宿註冊
```http
POST /api/homestay-register
Content-Type: application/json

{
  "account": "string",
  "password": "string", 
  "email": "string",
  "name": "string",
  "location": "string",
  "city": "string",
  "types": ["type1", "type2"]
}
```

#### 民宿登入
```http
POST /api/homestay-login
Content-Type: application/json

{
  "account": "string",
  "password": "string"
}
```

#### 取得民宿列表
```http
GET /api/fetchBnbs?location=宜蘭&category=溫泉
```

#### 取得民宿詳情
```http
GET /api/fetchBnbDetail?id=123
```

### 管理員系統 API

#### 管理員登入
```http
POST /api/admin-login
Content-Type: application/json

{
  "username": "string",
  "password": "string"
}
```

#### 取得待審核民宿
```http
GET /api/admin-pending-homestays?status=pending&page=1&limit=20
```

#### 審核民宿
```http
POST /api/admin-review-homestay
Content-Type: application/json

{
  "homestayId": "string",
  "action": "approve|reject",
  "reason": "string"
}
```

### 文章系統 API

#### 取得文章列表
```http
GET /api/articles?category=旅遊&page=1&limit=10
```

#### 創建文章
```http
POST /api/articles
Content-Type: application/json

{
  "title": "string",
  "content": "string",
  "category": "string",
  "tags": ["tag1", "tag2"]
}
```

#### 更新文章瀏覽數
```http
POST /api/articles/view/[id]
```

### 相關商家 API

#### 取得商家列表
```http
GET /api/relative?category=美食&location=宜蘭
```

#### 新增商家
```http
POST /api/relative
Content-Type: application/json

{
  "name": "string",
  "category": "string",
  "location": "string",
  "description": "string"
}
```

## 🔐 權限管理

### 用戶角色

1. **一般用戶** - 瀏覽內容、使用優惠券
2. **民宿業者** - 管理民宿資訊、查看訂單
3. **商家** - 管理商家資訊、發布優惠
4. **管理員** - 系統管理、內容審核

### JWT Token 認證

系統使用 JWT Token 進行身份認證：

- **用戶 Token**: `access_token` cookie
- **民宿業者 Token**: `homestay_access_token` cookie  
- **管理員 Token**: `admin_access_token` cookie

## 🗄️ 資料庫設計

### 主要資料表

#### homestays 表 (民宿)
```sql
CREATE TABLE homestays (
  id INTEGER PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  location VARCHAR(255) NOT NULL,
  city VARCHAR(100),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  status VARCHAR(20) DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### articles 表 (文章)
```sql
CREATE TABLE articles (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  category VARCHAR(100),
  view_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### coupons 表 (優惠券)
```sql
CREATE TABLE coupons (
  id VARCHAR(50) PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  status VARCHAR(20) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## 🔧 開發指南

### 本地開發

1. **啟動開發伺服器**
```bash
npm run dev
```

2. **程式碼檢查**
```bash
npm run lint
```

3. **資料庫遷移**
```bash
node scripts/run-migration.js
```

### 部署

1. **建置應用程式**
```bash
npm run build
```

2. **預覽建置結果**
```bash
npm run preview
```

3. **部署到生產環境**
```bash
npm run generate  # 靜態生成
```

## 🔗 外部服務整合

### Line Bot
- Webhook 處理: `/api/webhook`
- 訊息推送: `/api/sendMsg`
- 通知服務: `/api/notify`

### Google Maps
- 地圖顯示元件: `components/GoogleMap.vue`
- API 金鑰設定: `GOOGLE_MAPS_API_KEY`

### GitHub 圖片上傳
- 上傳端點: `/api/upload`
- 圖片管理: `/api/images/`

## 📱 功能特色

### 優惠券系統
- ✅ QR Code 生成
- ✅ 優惠券狀態管理
- ✅ 使用記錄追蹤
- ✅ Line Bot 整合

### 民宿管理
- ✅ 民宿註冊審核
- ✅ 資訊管理
- ✅ 圖片上傳
- ✅ 地圖定位

### 內容管理
- ✅ 文章發布
- ✅ 分類標籤
- ✅ 瀏覽統計
- ✅ SEO 優化

### 商家推薦
- ✅ 分類瀏覽
- ✅ 地區篩選
- ✅ 評價系統
- ✅ 聯絡資訊

## 🐛 故障排除

### 常見問題

1. **資料庫連接失敗**
   - 檢查 `HOMESTAY_DATABASE_URL` / `MARKETING_DATABASE_URL` 環境變數
   - 確認資料庫伺服器可訪問
   - 檢查防火牆設定

2. **API 500 錯誤**
   - 查看伺服器日誌
   - 檢查資料表是否存在
   - 驗證 JWT Token 設定

3. **圖片上傳失敗**
   - 檢查 GitHub Token 權限
   - 確認儲存庫設定
   - 檢查檔案大小限制

## 📄 授權條款

本專案採用 MIT 授權條款。

## 👥 貢獻指南

歡迎提交 Issue 和 Pull Request 來改善本專案。

## 📞 聯絡資訊

如有任何問題或建議，請聯絡開發團隊。

---

**注意**: 本系統採用多資料庫架構，優惠券和民宿系統使用不同的資料庫實例，請在部署時注意資料庫連接設定。
