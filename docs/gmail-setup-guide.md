# 📧 Gmail SMTP 設定完整指南

## 🚨 重要提醒

**您遇到的錯誤 "Invalid login: Username and Password not accepted" 通常是因為：**
1. 沒有啟用兩步驟驗證
2. 使用了普通密碼而不是應用程式密碼
3. 環境變數設定錯誤

---

## 📋 設定步驟

### 第一步：啟用兩步驟驗證

1. **前往 Google 帳戶設定**
   - 網址：https://myaccount.google.com/
   - 點選左側選單「安全性」

2. **找到兩步驟驗證**
   - 在「登入 Google」區塊找到「兩步驟驗證」
   - 點選「兩步驟驗證」

3. **設定兩步驟驗證**
   - 按照指示設定手機驗證
   - 完成後會看到「兩步驟驗證：已開啟」

### 第二步：產生應用程式密碼

1. **回到安全性頁面**
   - 確保兩步驟驗證已啟用
   - 找到「應用程式密碼」選項

2. **產生新密碼**
   - 點選「應用程式密碼」
   - 或直接前往：https://myaccount.google.com/apppasswords
   - 選擇應用程式：「郵件」
   - 選擇裝置：「其他 (自訂名稱)」，輸入「民宿系統」

3. **複製密碼**
   - Google 會產生一組 16 位數的密碼，格式如：`abcd efgh ijkl mnop`
   - **立即複製這個密碼！**（只會顯示一次）

### 第三步：設定環境變數

1. **在專案根目錄創建或編輯 `.env` 檔案**

```env
# Gmail SMTP 設定
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=abcdefghijklmnop

# 注意事項：
# - EMAIL_USER 必須是完整的 Gmail 地址
# - EMAIL_PASSWORD 是 16 位數的應用程式密碼（移除空格）
# - 不要使用您的一般 Gmail 密碼！
```

2. **確認格式正確**
   - EMAIL_USER: `youremail@gmail.com`
   - EMAIL_PASSWORD: `abcdefghijklmnop` (16位，無空格)

### 第四步：重新啟動伺服器

```bash
# 停止開發伺服器 (Ctrl+C)
# 然後重新啟動
npm run dev
```

---

## 🔧 故障排除

### 常見錯誤和解決方案

#### 1. "Invalid login: Username and Password not accepted"

**原因：**
- ❌ 使用了普通密碼而非應用程式密碼
- ❌ 沒有啟用兩步驟驗證
- ❌ 應用程式密碼格式錯誤

**解決方案：**
1. 確認已啟用兩步驟驗證
2. 重新產生應用程式密碼
3. 檢查 `.env` 檔案格式

#### 2. "Less secure app access"

**原因：**
- Google 已停用「低安全性應用程式存取權」

**解決方案：**
- **必須**使用應用程式密碼，無其他選擇

#### 3. "Could not authenticate"

**原因：**
- 環境變數未正確載入
- 伺服器未重新啟動

**解決方案：**
1. 檢查 `.env` 檔案位置（必須在專案根目錄）
2. 重新啟動開發伺服器
3. 使用檢查設定功能驗證

### 檢查清單

✅ **設定檢查清單**

- [ ] Gmail 帳戶已啟用兩步驟驗證
- [ ] 已產生應用程式密碼（16位數）
- [ ] `.env` 檔案在專案根目錄
- [ ] EMAIL_USER 是完整的 Gmail 地址
- [ ] EMAIL_PASSWORD 是應用程式密碼（無空格）
- [ ] 已重新啟動開發伺服器
- [ ] 使用「檢查設定」功能驗證

---

## 🧪 測試步驟

### 1. 檢查設定
1. 進入民宿審核頁面 `/admin-review`
2. 點選「📧 測試郵件」
3. 點選「檢查設定」按鈕
4. 確認所有項目都是 ✓

### 2. 測試連接
1. 點選「測試連接」
2. 應該顯示「郵件服務連接成功」

### 3. 發送測試郵件
1. 輸入您的測試信箱
2. 點選「發送測試郵件」
3. 檢查信箱收到測試郵件

---

## 📝 範例 .env 檔案

```env
# 資料庫設定
DATABASE_URL=your_database_url

# Google Maps
GOOGLE_MAPS_API_KEY=your_google_maps_key

# Gmail SMTP 設定
EMAIL_USER=admin@gmail.com
EMAIL_PASSWORD=abcdefghijklmnop

# 其他設定...
```

---

## 🔐 安全提醒

1. **永遠不要提交 `.env` 檔案到 Git**
   ```bash
   # 確保 .gitignore 包含：
   .env
   .env.local
   .env.*.local
   ```

2. **定期更新應用程式密碼**
   - 建議每 3-6 個月更新一次

3. **監控郵件使用量**
   - Gmail 有每日發送限制
   - 個人帳戶：每天 500 封
   - G Suite：每天 2000 封

---

## 🆘 仍然有問題？

### 常見問題診斷

1. **運行設定檢查**
   ```javascript
   // 在瀏覽器控制台執行：
   fetch('/api/admin/debug-email-config')
     .then(r => r.json())
     .then(console.log)
   ```

2. **檢查環境變數**
   ```bash
   # 在終端機執行：
   echo $EMAIL_USER
   echo $EMAIL_PASSWORD
   ```

3. **手動測試 Gmail 登入**
   - 嘗試用您的帳號和應用程式密碼登入其他郵件客戶端
   - 如 Outlook 或 Thunderbird

### 聯繫支援

如果以上步驟都無法解決問題，請提供：
1. 設定檢查的結果
2. 完整的錯誤訊息
3. Gmail 帳戶類型（個人/G Suite）

---

## 📚 相關連結

- [Gmail 應用程式密碼說明](https://support.google.com/accounts/answer/185833)
- [兩步驟驗證設定](https://www.google.com/landing/2step/)
- [Gmail SMTP 設定參考](https://support.google.com/mail/answer/7126229)
- [Nodemailer Gmail 文檔](https://nodemailer.com/usage/using-gmail/) 