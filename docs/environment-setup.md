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
HOMESTAY_DATABASE_URL=postgresql://ROLE:PASSWORD@HOMESTAY_HOST/neondb?sslmode=require
MARKETING_DATABASE_URL=postgresql://ROLE:PASSWORD@MARKETING_HOST/nuxt-marketing?sslmode=require

# 管理員登入 (必需)
ADMIN_USERNAME=<管理員帳號>
ADMIN_PASSWORD_HASH=<bcrypt 雜湊>

# JWT 簽章密鑰 (必需；每種 token 使用不同的隨機值)
JWT_SECRET_ADMIN=<openssl rand -base64 48 的輸出>
JWT_SECRET_HOMESTAY=<openssl rand -base64 48 的輸出>
JWT_SECRET_USER=<openssl rand -base64 48 的輸出>

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

使用專案既有的 bcryptjs 在本機產生管理員密碼雜湊；請在本機安全地提供 `ADMIN_PASSWORD`，不要把明文密碼放進指令歷史、程式碼或版本庫：

```bash
node --input-type=module -e "import bcrypt from 'bcryptjs'; console.log(await bcrypt.hash(process.env.ADMIN_PASSWORD, 12))"
```

部署至 Vercel 前，在 **Project Settings → Environment Variables** 為 `ADMIN_USERNAME`、`ADMIN_PASSWORD_HASH`、`JWT_SECRET_ADMIN`、`JWT_SECRET_HOMESTAY`、`JWT_SECRET_USER` 設定正確範圍（Production、Preview、Development）；只在 Vercel 安全介面輸入正式值，不要貼到 PR、issue 或聊天。三個 JWT 密鑰須彼此不同且為新產生的隨機值。未設定任一必要值時，對應登入／驗證會失敗關閉。換用新 JWT 密鑰會使所有既有管理員、民宿及一般使用者 token/session 失效，需重新登入。

上線前的登入準備、唯讀民宿雜湊統計及阻擋條件請依 [`security-auth-rollout.md`](./security-auth-rollout.md) 執行。不得自行修改民宿密碼；若統計發現缺少有效雜湊的帳號，先提出遷移方案並等待擁有者批准。

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