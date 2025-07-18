# 民宿會員後台系統

這是一個專為民宿業者設計的管理後台系統，允許民宿業者登入並編輯自己的民宿資訊。

## 🚀 功能特色

### 🔐 安全登入系統
- **帳號**: 使用民宿編號作為帳號
- **密碼**: B + 民宿編號（例如：民宿編號2591，密碼為B2591）
- **安全**: 使用JWT Token進行身份驗證，Cookie存儲登入狀態

### 📝 完整編輯功能
- **基本資訊**: 民宿名稱、位置、城市、電話、網站
- **圖片管理**: 上傳和更新民宿圖片
- **容量描述**: 詳細描述民宿可容納人數和設施
- **即時預覽**: 圖片URL即時預覽功能

### 💾 資料庫整合
- 直接連接Neon PostgreSQL資料庫
- 交易安全，確保資料一致性
- 只能編輯自己的民宿資料

## 🌐 系統頁面

### 1. 民宿登入頁面 (`/homestay-login`)
- 美觀的漸層背景設計
- 響應式佈局，支援手機和桌面
- 密碼格式提示
- 錯誤處理和載入狀態

### 2. 管理後台 (`/homestay-admin`)
- 現代化的管理介面
- 分區域表單設計
- 即時資料載入和更新
- 成功/錯誤訊息通知

## 🔒 安全機制

### 身份驗證
```javascript
// 登入驗證流程
1. 檢查民宿編號是否存在
2. 驗證密碼格式 (B + 編號)
3. 生成JWT Token
4. 設置安全Cookie
```

### 權限控制
- 中介軟體保護後台頁面
- 只能編輯自己的民宿資料
- Token過期自動跳轉登入

### 資料驗證
- 必填欄位檢查
- URL格式驗證
- 資料庫交易保護

## 📊 API 端點

### 登入相關
- `POST /api/homestay-login` - 民宿登入
- `GET /api/homestay-auth` - 檢查登入狀態
- `POST /api/homestay-logout` - 登出

### 資料管理
- `POST /api/update-homestay` - 更新民宿資料
- `GET /api/fetchBnbDetail?id={id}` - 獲取民宿詳情

## 🎨 使用者體驗

### 設計特色
- **現代化UI**: 使用漸層色彩和圓角設計
- **響應式**: 完美適配各種螢幕尺寸
- **動畫效果**: 按鈕懸停和過渡效果
- **直觀操作**: 清晰的表單結構和提示

### 便民功能
- 圖片即時預覽
- 表單資料重置
- 自動儲存提示
- 錯誤處理友善

## 🛠 技術架構

### 前端技術
- **Vue 3**: 現代化前端框架
- **Nuxt 3**: 全端Vue框架
- **SCSS**: 進階CSS預處理器
- **響應式設計**: 支援各種裝置

### 後端技術
- **Nuxt Server API**: 伺服器端API
- **PostgreSQL**: 企業級資料庫
- **JWT**: 安全的身份驗證
- **事務處理**: 確保資料一致性

### 安全特性
- **HTTPS Cookie**: 安全的狀態管理
- **SQL預處理**: 防止SQL注入
- **權限驗證**: 多層安全檢查
- **錯誤處理**: 完整的例外處理

## 📱 使用方式

### 對於民宿業者
1. **訪問登入頁面**: 在民宿列表或詳情頁點擊「民宿業者登入」
2. **輸入帳號密碼**: 
   - 帳號：您的民宿編號
   - 密碼：B + 民宿編號
3. **編輯資料**: 登入後即可編輯所有民宿資訊
4. **儲存變更**: 點擊儲存按鈕更新資料

### 對於系統管理員
- 民宿帳號自動根據資料庫中的民宿ID生成
- 密碼格式固定為「B + 民宿ID」
- 可在資料庫中管理民宿的啟用狀態

## 🔍 快速入口

在網站中，民宿業者可以通過以下方式快速訪問管理後台：

1. **民宿列表頁** (`/bnbs`) - 右上角「民宿業者登入」按鈕
2. **民宿詳情頁** (`/bnbs/{id}`) - 右上角「登入管理」按鈕
3. **直接訪問** - `/homestay-login`

## 🎯 範例帳號

基於現有資料庫中的民宿，以下是一些範例帳號：

| 民宿名稱 | 帳號 | 密碼 |
|---------|------|------|
| 根本家民宿 | 2591 | B2591 |
| 甘瓜別墅 | 2732 | B2732 |
| 蘆藈別墅 | 1612 | B1612 |
| 布朗尼 | 1212 | B1212 |
| 小北歐699 | 1968 | B1968 |
| Cest la vie 珊珊來此 | 2689 | B2689 |

---

*此系統專為提升民宿業者的管理效率而設計，提供安全、直觀的資料管理體驗。* 