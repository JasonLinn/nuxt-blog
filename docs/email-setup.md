# 郵件服務設定說明

## 概述

民宿審核系統已整合郵件通知功能，當管理員審核民宿申請時，系統會自動發送審核結果通知郵件給申請者。

## 功能特色

- 🎉 **審核通過通知**：美觀的 HTML 郵件模板，包含審核結果和後續指引
- 📋 **審核拒絕通知**：詳細的拒絕原因說明和改善建議
- 💌 **專業模板**：響應式設計，支援各種郵件客戶端
- 🔒 **錯誤處理**：郵件發送失敗不影響審核流程

## 環境變數設定

在專案根目錄的 `.env` 檔案中添加以下設定：

```env
# 郵件服務設定 (Gmail SMTP)
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-gmail-app-password
```

## Gmail SMTP 設定步驟

### 1. 啟用兩步驟驗證

1. 前往 [Google 帳戶設定](https://myaccount.google.com/)
2. 點選「安全性」
3. 啟用「兩步驟驗證」

### 2. 產生應用程式密碼

1. 在「安全性」頁面中找到「應用程式密碼」
2. 或直接前往：https://myaccount.google.com/apppasswords
3. 選擇「郵件」和您的裝置
4. 點選「產生」
5. 複製產生的 16 位數密碼

### 3. 設定環境變數

將產生的應用程式密碼設定為 `EMAIL_PASSWORD`：

```env
EMAIL_USER=youremail@gmail.com
EMAIL_PASSWORD=abcd efgh ijkl mnop  # 16位數應用程式密碼
```

## 測試郵件設定

可以創建測試 API 來驗證郵件設定：

```javascript
// server/api/test-email.post.js
import { testEmailConnection } from '../utils/emailService.js';

export default defineEventHandler(async (event) => {
  try {
    const result = await testEmailConnection();
    return result;
  } catch (error) {
    throw createError({
      statusCode: 500,
      statusMessage: error.message
    });
  }
});
```

## 其他郵件服務

如果不想使用 Gmail，可以修改 `server/utils/emailService.js` 中的 `createTransporter` 函數：

### SendGrid

```javascript
const transporter = nodemailer.createTransport({
  service: 'SendGrid',
  auth: {
    user: 'apikey',
    pass: process.env.SENDGRID_API_KEY
  }
});
```

### 自定義 SMTP

```javascript
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: true, // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD
  }
});
```

## 郵件模板自定義

郵件模板位於 `server/utils/emailService.js` 中的：
- `getApprovalEmailTemplate()` - 審核通過模板
- `getRejectionEmailTemplate()` - 審核拒絕模板

可以根據需求修改樣式和內容。

## 故障排除

### 常見錯誤

1. **Invalid login**: 檢查帳號密碼是否正確
2. **Less secure app access**: 使用應用程式密碼而非一般密碼
3. **Connection timeout**: 檢查網路連線和防火牆設定

### 日誌檢查

郵件發送狀態會記錄在伺服器日誌中：
- 成功：`審核通過郵件已發送至: email@example.com`
- 失敗：`郵件發送失敗: 錯誤訊息`

### 測試指令

```bash
# 在專案根目錄執行
node -e "
import('./server/utils/emailService.js').then(async (module) => {
  const result = await module.testEmailConnection();
  console.log(result);
});
"
```

## 安全注意事項

1. 🔐 **保護環境變數**：確保 `.env` 檔案不被提交到版本控制
2. 🚫 **限制權限**：使用應用程式密碼而非主要密碼
3. 📧 **監控使用量**：定期檢查郵件發送量，避免超過限制
4. 🔄 **定期更新**：定期更新應用程式密碼

## 進階功能

未來可以考慮添加：
- 📊 郵件發送統計
- 📝 郵件模板管理界面
- 🔄 重發失敗郵件功能
- 📱 多種通知方式 (SMS, Push notification) 