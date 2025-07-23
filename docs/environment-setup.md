# 環境變數設定指南

## 快速修復上傳錯誤

如果你遇到圖片上傳的 "Bad credentials" 錯誤，請按照以下步驟設定：

### 方案 1: 使用本地上傳（推薦，簡單）

**無需任何配置！** 最新版本的上傳功能已經支援本地上傳作為備用方案。
- 圖片會自動儲存到 `public/uploads/` 目錄
- 不需要設定 GitHub Token
- 立即可用

### 方案 2: 設定 GitHub 上傳（選用）

如果你想使用 GitHub 來儲存圖片，請建立 `.env` 檔案：

```bash
# 在專案根目錄建立 .env 檔案
DATABASE_URL=你的資料庫連接字串

# GitHub 上傳設定（選填）
GITHUB_TOKEN=你的GitHub個人存取權杖
GITHUB_USERNAME=你的GitHub用戶名
GITHUB_REPO=用來儲存圖片的倉庫名稱
```

#### 取得 GitHub Token 步驟：

1. 到 [GitHub Settings > Developer settings > Personal access tokens](https://github.com/settings/personal-access-tokens/tokens)
2. 點擊 "Generate new token (classic)"
3. 設定範圍：勾選 `repo` 權限
4. 生成後複製 token 到 `.env` 檔案

## 所有環境變數說明

```bash
# 資料庫 (必需)
DATABASE_URL=postgresql://username:password@host:port/database

# Google Maps (選填)
GOOGLE_MAPS_API_KEY=你的Google地圖API金鑰

# GitHub 圖片上傳 (選填)
GITHUB_TOKEN=你的GitHub個人存取權杖
GITHUB_USERNAME=你的GitHub用戶名
GITHUB_REPO=用來儲存圖片的倉庫名稱

# 分析 (選填)
GA_MEASUREMENT_ID=G-XXXXXXXXXX

# 開發工具 (選填)
NGROK_AUTHTOKEN=你的ngrok權杖

# Line Bot (選填)
CHANNEL_ACCESS_TOKEN=你的Line Bot權杖
```

## 重新啟動

設定完環境變數後，請重新啟動開發伺服器：

```bash
npm run dev
```

## 故障排除

### 1. 上傳仍然失敗
- 檢查 `public/uploads/` 目錄是否有寫入權限
- 檢查圖片檔案大小是否超過 5MB
- 檢查檔案格式是否為 JPG、PNG 或 GIF

### 2. GitHub 上傳失敗
- 檢查 GitHub Token 是否有效
- 檢查 Token 是否有 `repo` 權限
- 檢查倉庫名稱和用戶名是否正確

### 3. 檢查上傳狀態
上傳成功後會顯示使用的儲存方式：
- `provider: 'local'` - 本地上傳
- `provider: 'github'` - GitHub 上傳 