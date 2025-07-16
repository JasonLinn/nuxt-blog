# 圖片批量處理工具說明

## 📖 功能介紹

這個工具提供完整的圖片批量處理功能，包含：
- 🖼️ 圖片壓縮和裁剪
- 📱 多種預設處理模式
- 💾 自動備份原始文件
- 🎯 批量處理大量圖片
- 📊 處理統計和進度顯示

## 🚀 快速開始

### 1. 安裝依賴

```bash
npm install
```

### 2. 快速處理（推薦）

```bash
# 處理 shop 目錄的圖片
npm run images:process

# 或使用快速模式
node scripts/quickImageProcess.js shop
node scripts/quickImageProcess.js relative  
node scripts/quickImageProcess.js all
```

### 3. 互動式處理

```bash
npm run images:web
```

## 📁 目錄結構

```
public/
├── shop/           # 商店圖片
├── relative/       # 代訂服務圖片  
├── icon/           # 圖標文件
└── backup_images/  # 自動備份目錄（處理後創建）
```

## ⚙️ 處理模式

### 1. Web 優化 (預設)
- **尺寸**: 800x600px
- **品質**: 80%
- **格式**: JPEG
- **用途**: 網頁顯示

### 2. 手機優化
- **尺寸**: 600x400px  
- **品質**: 75%
- **格式**: JPEG
- **用途**: 手機端顯示

### 3. 縮圖
- **尺寸**: 300x200px
- **品質**: 70% 
- **格式**: JPEG
- **用途**: 縮圖預覽

### 4. 純壓縮
- **尺寸**: 保持原始
- **品質**: 85%
- **格式**: JPEG
- **用途**: 減小文件大小

### 5. WebP 轉換
- **尺寸**: 800x600px
- **品質**: 80%
- **格式**: WebP
- **用途**: 現代瀏覽器

## 🔧 進階使用

### 自定義配置

編輯 `utils/imageProcessor.js` 中的 config 對象：

```javascript
const config = {
  resize: {
    width: 1200,      // 寬度
    height: 800,      // 高度  
    fit: 'cover',     // 裁剪方式
  },
  compression: {
    quality: 85,      // 品質 (1-100)
    progressive: true // 漸進式載入
  },
  outputFormat: 'jpeg' // 輸出格式
}
```

### 裁剪方式說明

- `cover`: 裁剪並填滿目標尺寸
- `contain`: 保持比例，完整顯示
- `fill`: 拉伸填滿（可能變形）
- `inside`: 保持比例，不超出尺寸
- `outside`: 保持比例，完全覆蓋

## 📊 使用示例

### 基本處理
```bash
# 處理 shop 目錄
node scripts/quickImageProcess.js shop

# 處理結果
✅ 成功處理: 45 個文件
💾 原始總大小: 12.5 MB  
💾 壓縮後總大小: 6.8 MB
📉 整體壓縮率: 45.6%
```

### 互動式處理
```bash
npm run images:process

📁 可用的圖片目錄:
1. public: D:\github\nuxt-blog\public
2. shop: D:\github\nuxt-blog\public\shop  
3. relative: D:\github\nuxt-blog\public\relative
4. icons: D:\github\nuxt-blog\public\icon
5. 自定義路徑

請選擇要處理的目錄 (輸入數字): 2

⚙️ 處理模式:
1. Web 優化: 適合網頁顯示的壓縮 (800x600, 80% 品質)
2. 手機優化: 適合手機顯示的壓縮 (600x400, 75% 品質)  
3. 縮圖: 創建縮圖 (300x200, 70% 品質)
4. 壓縮: 只壓縮不改變尺寸 (85% 品質)
5. WebP 轉換: 轉換為 WebP 格式 (80% 品質)

請選擇處理模式 (輸入數字): 1
```

## 🛡️ 安全保障

### 自動備份
- ✅ 處理前自動備份原始文件
- 📁 備份存放在 `backup_images/` 目錄
- 🔒 避免重複備份，節省空間
- 📝 清楚的備份日誌

### 錯誤處理
- ⚠️ 處理失敗時保留原文件
- 📊 詳細的錯誤報告
- 🔄 支援部分失敗後繼續處理
- 💾 臨時文件自動清理

## 📈 性能優化

### 大量文件處理
- 🔄 逐個處理，避免內存溢出
- 📊 實時進度顯示
- ⚡ 高效的 Sharp 圖片處理引擎
- 🗂️ 智能跳過已處理文件

### 文件格式支援
- ✅ JPEG/JPG
- ✅ PNG  
- ✅ WebP
- ✅ 自動格式轉換

## 🚨 注意事項

1. **備份重要性**: 雖然工具會自動備份，建議重要文件手動備份
2. **磁盤空間**: 確保有足夠空間存放備份和處理後的文件
3. **處理時間**: 大量文件處理需要時間，請耐心等待
4. **文件覆蓋**: 相同文件名會被覆蓋，請注意備份
5. **格式轉換**: 轉換為 JPEG 會移除透明背景

## 🆘 故障排除

### 常見問題

**Q: 提示 "sharp" 模組找不到**
```bash
npm install sharp
```

**Q: 權限錯誤**  
```bash
# Windows
以管理員身份運行命令提示字元

# Linux/Mac  
sudo npm run images:process
```

**Q: 內存不足**
- 減少批量處理的文件數量
- 降低輸出圖片品質和尺寸

**Q: 處理速度慢**
- 關閉其他程序釋放CPU
- 使用SSD硬碟
- 減小輸出尺寸

## 📞 技術支援

如果遇到問題，請檢查：
1. Node.js 版本 >= 18
2. 磁盤可用空間
3. 文件讀寫權限
4. Sharp 依賴是否正確安裝

---

*最後更新: 2025-01-16*