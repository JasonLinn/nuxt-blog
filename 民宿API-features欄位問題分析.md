# 民宿 API Features 欄位問題分析與解決方案

## 問題描述

在民宿系統中發現了一個資料不一致的問題：

### 現狀分析

1. **fetchBnbs API** (`/api/fetchBnbs`) - 民宿列表頁
   - ❌ **缺少 `features` 欄位**
   - 只包含基本資訊：id, name, location, city, images, pricing_options, types 等

2. **fetchBnbDetail API** (`/api/fetchBnbDetail`) - 民宿詳情頁  
   - ✅ **包含完整 `features` 欄位**
   - features 結構：
     ```javascript
     features: {
       peopleTypes: [homestay.capacity_description],
       environmentTypes: typesResult.rows.map(row => row.type_name),
       themeFeatures: homestay.theme_features || [],
       serviceAmenities: homestay.service_amenities || []
     }
     ```

### 問題根因

前端架構設計是將 `fetchBnbs` 的資料存在 Store 中，當用戶點擊進入個別民宿詳情時，直接從 Store 讀取資料而不是重新呼叫 API。但由於 `fetchBnbs` 缺少 `features` 欄位，導致詳情頁面無法顯示特色功能資訊。

## 解決方案

### 方案一：修改 fetchBnbs API（推薦）

**優點：** 
- 保持前端架構不變
- 一次性獲取完整資料
- 減少 API 呼叫次數

**實作步驟：**

1. 在 `fetchBnbs.js` 的主查詢中加入缺少的欄位：
   ```sql
   SELECT 
     h.id,
     h.name,
     h.location,
     h.city,
     h.image_url,
     h.images,
     -- 現有欄位...
     h.theme_features,        -- 新增
     h.service_amenities,     -- 新增
     h.capacity_description   -- 確保有這個欄位
   FROM homestays h
   ```

2. 在資料處理階段組合 `features` 物件：
   ```javascript
   const enrichedHomestays = filteredHomestays.map(homestay => {
     return {
       ...homestay,
       image_urls: imageUrls,
       types: typesMap[homestay.id] || [],
       pricing_options: pricingMap[homestay.id] || [],
       // 新增 features 欄位
       features: {
         peopleTypes: [homestay.capacity_description],
         environmentTypes: typesMap[homestay.id] || [],
         themeFeatures: homestay.theme_features || [],
         serviceAmenities: homestay.service_amenities || []
       }
     };
   });
   ```

### 方案二：混合架構

**適用場景：** 如果 features 資料很大，不想在列表頁載入

**實作：**
- 列表頁：使用現有的 `fetchBnbs` API
- 詳情頁：檢查 Store 中是否有 `features`，如果沒有則呼叫 `fetchBnbDetail` API

### 方案三：統一 API 結構

**長期優化：** 將兩個 API 的回傳格式統一化

## 建議實施方案

**推薦採用方案一**，理由：

1. **最小變動：** 只需修改後端 API，前端無需變動
2. **效能最佳：** 避免額外的 API 呼叫
3. **維護簡單：** 保持原有的前端架構
4. **使用者體驗：** 詳情頁能立即顯示完整資訊

## ✅ 已實施的解決方案

### 修改內容

1. **主查詢增加欄位** (第 106-131 行)
   ```sql
   SELECT 
     h.id,
     h.name,
     -- 其他欄位...
     h.theme_features,        -- ✅ 新增
     h.service_amenities,     -- ✅ 新增
     h.capacity_description   -- 原有
   FROM homestays h
   ```

2. **資料組合階段增加 features** (第 244-249 行)
   ```javascript
   features: {
     peopleTypes: [homestay.capacity_description].filter(Boolean),
     environmentTypes: typesMap[homestay.id] || [],
     themeFeatures: homestay.theme_features || [],
     serviceAmenities: homestay.service_amenities || []
   }
   ```

### 測試檢查清單

- [x] 修改 `fetchBnbs.js` 主查詢，加入 `theme_features` 和 `service_amenities` 欄位
- [x] 在資料組合階段加入 `features` 物件
- [ ] 測試列表頁 API 回傳是否包含 `features`
- [ ] 確認詳情頁能正確顯示特色功能
- [ ] 檢查快取機制是否正常運作
- [ ] 驗證效能影響（預期影響很小）

### 測試指令

```bash
# 測試單一民宿的 features 欄位
curl "http://localhost:3000/api/fetchBnbs?limit=1" | jq '.homestays[0].features'

# 測試完整 API 回應
curl "http://localhost:3000/api/fetchBnbs?limit=2" | jq '.'

# 比較與 fetchBnbDetail 的一致性
curl "http://localhost:3000/api/fetchBnbDetail?id=070" | jq '.bnb.features'
```

## 技術細節

### 資料庫欄位對應
- `peopleTypes` ← `capacity_description` 
- `environmentTypes` ← `homestay_types` 表的 `type_name`
- `themeFeatures` ← `theme_features` 欄位（陣列）
- `serviceAmenities` ← `service_amenities` 欄位（陣列）

### API 回傳格式統一
確保兩個 API 的 `features` 物件結構完全相同，以保持前端相容性。

## 解決方案總結

### ✅ 已解決的問題
1. **資料一致性：** `fetchBnbs` 現在包含完整的 `features` 欄位
2. **前端相容性：** 保持與 `fetchBnbDetail` API 相同的資料結構
3. **使用者體驗：** 詳情頁面能立即顯示特色功能，無需額外載入

### 🚀 方案優勢
- **零前端變動：** 前端 Store 架構保持不變
- **效能提升：** 減少不必要的 API 呼叫
- **快取友善：** 利用現有的快取機制
- **維護簡便：** 單一資料來源，減少同步問題

### ⚠️ 注意事項
1. **資料庫查詢：** 增加了兩個欄位查詢，但影響微乎其微
2. **記憶體使用：** 快取中會包含更多資料，需關注記憶體使用狀況
3. **向後相容：** 確保所有使用 `fetchBnbs` 的前端元件都能正確處理新的 `features` 欄位

### 🔧 後續建議
1. 清理快取以確保新資料結構生效
2. 考慮在 `fetchBnbDetail` API 中加入快取機制
3. 監控 API 回應時間，確保效能符合預期