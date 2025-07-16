# 🖼️ 圖片批量處理工具

一個強大的圖片批量處理工具，支援剪裁、壓縮和自動備份功能。

## ✨ 主要功能

- 📸 **批量壓縮**: 大幅減少圖片文件大小
- ✂️ **智能裁剪**: 調整圖片尺寸適合網頁顯示  
- 💾 **自動備份**: 處理前自動備份原始文件
- 📊 **處理統計**: 顯示壓縮率和處理進度
- 🎯 **多種模式**: Web、手機、縮圖等預設配置

## 🚀 快速使用

### 1. 互動式處理（推薦新手）
```bash
npm run images:process
```
按照提示選擇目錄和處理模式

### 2. 快速處理（推薦日常使用）
```bash
# 處理商店圖片（最常用）
node scripts/quickImageProcess.js shop

# 處理代訂服務圖片  
node scripts/quickImageProcess.js relative

# 處理所有圖片
node scripts/quickImageProcess.js all
```

### 3. 測試工具
```bash
node scripts/testImageProcessor.js
```

## 📊 處理效果

處理前後對比：
- **文件大小**: 平均減少 40-60%
- **載入速度**: 提升 2-3 倍
- **儲存空間**: 節省大量磁盤空間
- **用戶體驗**: 更快的頁面載入

## 📁 處理目錄

| 目錄 | 說明 | 建議處理 |
|------|------|----------|
| `public/shop/` | 商店優惠券圖片 | ✅ 經常處理 |
| `public/relative/` | 代訂服務圖片 | ✅ 經常處理 |
| `public/icon/` | 圖標文件 | ⚠️ 謹慎處理 |
| `public/` | 所有圖片 | 🔥 一次性處理 |

## ⚙️ 預設配置

### Web 優化模式 (預設)
- 尺寸: 800×600px
- 品質: 80%
- 格式: JPEG
- 適用: 網頁顯示

### 手機優化模式  
- 尺寸: 600×400px
- 品質: 75%
- 格式: JPEG
- 適用: 行動裝置

## 🛡️ 安全保障

- ✅ **自動備份**: 原始文件備份到 `backup_images/`
- ✅ **錯誤恢復**: 處理失敗時保留原文件
- ✅ **重複保護**: 避免重複備份相同文件
- ✅ **進度追蹤**: 即時顯示處理狀態

## 📝 使用範例

### 範例 1: 批量優化商店圖片
```bash
$ node scripts/quickImageProcess.js shop

🚀 快速處理開始: shop
📁 處理目錄: D:\github\nuxt-blog\public\shop
⚙️ 配置: Web優化 (800x600, 80%品質)
💾 備份: 啟用

📦 備份文件: image1.jpg
📊 處理圖片: image1.jpg (1200x800, 450KB)
✅ 完成處理: image1.jpg (180KB, 壓縮 60.0%)

📊 批量處理完成統計:
✅ 成功處理: 45 個文件
💾 原始總大小: 12.50 MB
💾 壓縮後總大小: 5.20 MB
📉 整體壓縮率: 58.4%

🎉 處理完成！耗時 15.2 秒
```

### 範例 2: 互動式處理
```bash
$ npm run images:process

🖼️ 圖片批量處理工具
====================

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

📋 處理設定確認:
📁 目錄: D:\github\nuxt-blog\public\shop
⚙️ 模式: Web 優化
📝 說明: 適合網頁顯示的壓縮 (800x600, 80% 品質)
⚠️ 注意: 原始文件將會被備份到 backup_images 目錄

確定要開始處理嗎？ (y/N): y
```

## 🔧 自定義配置

編輯 `utils/imageProcessor.js` 文件：

```javascript
const config = {
  resize: {
    width: 1000,        // 自定義寬度
    height: 750,        // 自定義高度
    fit: 'cover'        // 裁剪方式
  },
  compression: {
    quality: 85         // 壓縮品質 (1-100)
  }
}
```

## 🆘 常見問題

**Q: 如何恢復原始圖片？**
A: 從 `backup_images/` 目錄複製回原位置

**Q: 處理後圖片變模糊？**  
A: 提高品質設定（85-95%）或增加輸出尺寸

**Q: 磁盤空間不足？**
A: 先清理舊備份，或分批處理

**Q: 處理速度很慢？**
A: 正常現象，大文件需要更多時間

## 🎯 最佳實踐

1. **定期備份**: 重要圖片手動備份到其他位置
2. **分批處理**: 大量圖片分批處理，避免系統負載過高
3. **品質平衡**: Web圖片80%品質通常足夠
4. **格式選擇**: JPEG適合照片，PNG適合圖標
5. **尺寸合理**: 網頁圖片無需超過800x600

---

📞 **需要幫助？** 執行 `node scripts/testImageProcessor.js` 檢查工具狀態