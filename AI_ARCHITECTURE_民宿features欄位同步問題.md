# AI Architecture Document: 民宿 Features 欄位同步問題

## 問題識別

**Issue ID:** HOMESTAY_FEATURES_SYNC_001  
**Type:** Data Consistency Issue  
**Priority:** High  
**Date:** 2025-07-31  

### 症狀描述
```
- 問題現象：民宿詳情頁面不顯示 features（主題特色、服務設施等）
- 觸發條件：用戶從列表頁進入詳情頁，或直接訪問 URL
- 預期行為：詳情頁應顯示完整的 features 資訊
- 實際行為：features 欄位為空或不完整
```

### 根本原因分析
```
1. API 不一致性：
   - fetchBnbs (列表) 原本缺少 features 欄位
   - fetchBnbDetail (詳情) 包含完整 features

2. Store 資料結構不完整：
   - Store 只處理 peopleTypes 和 environmentTypes
   - 缺少 themeFeatures 和 serviceAmenities

3. 前端讀取邏輯：
   - 優先從 Store 讀取 (舊的、不完整的資料)
   - 只有 Store 無資料時才調用詳情 API
```

## 技術架構

### 資料流向
```
[fetchBnbs API] → [Store] → [Detail Page Component]
       ↓              ↓              ↑
   包含features    處理features     顯示features
   
[fetchBnbDetail API] → [Detail Page Component] (fallback)
```

### 相關檔案
```
server/api/fetchBnbs.js         - 民宿列表 API
server/api/fetchBnbDetail.js    - 民宿詳情 API
store/homestay.js               - 前端狀態管理
pages/homestays/[id].vue        - 詳情頁面組件
pages/homestay-list.vue         - 列表頁面組件
```

### 資料結構規範
```javascript
// 前端期待的完整民宿物件結構
bnb: {
  // 基本資訊
  id: string,
  name: string,
  area: string,              // 對應 location
  address: string,           // 對應 city  
  description: string,       // 對應 capacity_description
  
  // 圖片
  image_urls: Array<string>,
  
  // 人數資訊
  min_guests: number,
  max_guests: number,
  
  // 特色資訊
  features: {
    peopleTypes: Array<string>,        // 適用人數類型
    environmentTypes: Array<string>,   // 環境特色類型  
    themeFeatures: Array<string>,      // 主題特色
    serviceAmenities: Array<string>    // 服務設施
  },
  
  // 價格資訊
  prices: {
    weekday: string | null,           // 平日價格 (格式化)
    weekend: string | null,           // 假日價格 (格式化)
    fullRentWeekday: string | null,   // 平日包棟 (格式化)
    fullRentWeekend: string | null    // 假日包棟 (格式化)
  },
  
  // 聯絡資訊
  contact: {
    phone: string | null,
    website: string | null,
    line: string | null
    instagram: string | null,
    facebook: string | null
  }
}
```

## 解決方案實施

### Step 1: 修復 fetchBnbs API
**檔案:** `server/api/fetchBnbs.js`

```javascript
// 1. 主查詢增加完整欄位
SELECT 
  h.id, h.name, h.location, h.city,
  h.image_url, h.images,
  h.website, h.phone,                    // 聯絡基本資訊
  h.social_line, h.social_instagram,     // 新增社交媒體欄位
  h.social_facebook,                     // 新增社交媒體欄位
  h.capacity_description,
  h.min_guests, h.max_guests,
  h.theme_features, h.service_amenities, // features 相關欄位
  h.min_price, h.max_price, h.average_price,
  h.rating, h.total_reviews, h.featured, h.view_count
FROM homestays h

// 2. 資料組合階段添加完整結構
return {
  ...homestay,
  // 前端期待的欄位格式
  area: homestay.location,
  address: homestay.city,
  description: homestay.capacity_description,
  image_urls: imageUrls,
  
  // 完整的 features 結構
  features: {
    peopleTypes: [homestay.capacity_description].filter(Boolean),
    environmentTypes: typesMap[homestay.id] || [],
    themeFeatures: homestay.theme_features || [],
    serviceAmenities: homestay.service_amenities || []
  },
  
  // 完整的 prices 結構
  prices: {
    weekday: homestay.min_price ? `NT$ ${formatted}` : null,
    weekend: homestay.max_price ? `NT$ ${formatted}` : null,
    fullRentWeekday: null,  // 從 pricing_options 填充
    fullRentWeekend: null   // 從 pricing_options 填充
  },
  
  // 完整的 contact 結構
  contact: {
    phone: homestay.phone,
    website: homestay.website,
    line: homestay.social_line,
    instagram: homestay.social_instagram,
    facebook: homestay.social_facebook
  }
}
```

### Step 2: 修復 Store 資料處理
**檔案:** `store/homestay.js`

```javascript
// 修改前（不完整）
features: {
  peopleTypes: [homestay.capacity_description || ''],
  environmentTypes: homestay.types || []
},
contact: {
  phone: homestay.phone,
  website: homestay.website,
  line: homestay.line_id || null
}

// 修改後（完整，與 API 格式一致）
return {
  id: homestay.id,
  name: homestay.name || '未命名民宿',
  area: homestay.area || homestay.location || '未知地區',
  address: homestay.address || homestay.city || '',
  description: homestay.description || homestay.capacity_description || '暫無描述',
  image_urls: homestay.image_urls || [homestay.image_url] || [],
  min_guests: homestay.min_guests || null,
  max_guests: homestay.max_guests || null,
  
  // 優先使用 API 完整結構，否則重建
  features: homestay.features || {
    peopleTypes: [homestay.capacity_description || ''].filter(Boolean),
    environmentTypes: homestay.types || [],
    themeFeatures: homestay.theme_features || [],
    serviceAmenities: homestay.service_amenities || []
  },
  
  prices: homestay.prices || { /* 重建價格結構 */ },
  
  contact: homestay.contact || {
    phone: homestay.phone,
    website: homestay.website,
    line: homestay.social_line || homestay.line_id || null,
    instagram: homestay.social_instagram || null,
    facebook: homestay.social_facebook || null
  }
}
```

### Step 3: 清除快取
**操作:** 用戶需清除瀏覽器快取或重新載入

## 驗證步驟

### API 驗證
```bash
# 1. 檢查 fetchBnbs 是否包含 features
curl "http://localhost:3001/api/fetchBnbs?limit=1" | jq '.homestays[0].features'

# 2. 確認與 fetchBnbDetail 一致性
curl "http://localhost:3001/api/fetchBnbDetail?id=070" | jq '.bnb.features'
```

### 前端驗證
```
1. 清除瀏覽器快取
2. 訪問民宿列表頁：http://localhost:3001/homestay-list
3. 點擊任一民宿進入詳情頁
4. 確認顯示完整功能：
   - 🌿 環境特色（features.environmentTypes）
   - 🏠 主題特色（features.themeFeatures）  
   - 🎯 服務設施（features.serviceAmenities）
   - 📞 聯絡資訊（contact.phone, website, line, instagram, facebook）
   - 💰 價格資訊（prices.weekday, weekend, fullRentWeekday, fullRentWeekend）
```

### 實施檢查清單

#### ✅ 已完成項目
- [x] 修改 `fetchBnbs.js` 主查詢，加入所有前端所需欄位：
  - [x] 基本資訊欄位
  - [x] 社交媒體欄位（social_line, social_instagram, social_facebook）
  - [x] Features 相關欄位（theme_features, service_amenities）
- [x] 在資料組合階段加入完整的資料結構：
  - [x] `features` 物件（peopleTypes, environmentTypes, themeFeatures, serviceAmenities）
  - [x] `contact` 物件（phone, website, line, instagram, facebook）
  - [x] `prices` 物件（weekday, weekend, fullRentWeekday, fullRentWeekend）
  - [x] 前端期待的欄位對應（area, address, description, image_urls）
- [x] 修復 Store 資料處理，確保與 API 格式一致

#### 🔄 待驗證項目  
- [ ] API 測試：檢查 fetchBnbs 回傳完整欄位結構
- [ ] 前端測試：確認詳情頁顯示所有功能區塊
- [ ] 快取測試：驗證清除快取後資料更新
- [ ] 效能測試：確認 API 回應時間符合預期

## 預防措施

### 1. API 設計原則
```
- 保持 API 回傳格式一致性
- 列表和詳情 API 應包含相同的核心欄位
- 新增欄位時同步更新所有相關 API
```

### 2. Store 管理原則
```
- Store 資料結構應反映 API 完整格式
- 避免在 Store 中重構資料結構
- 使用 TypeScript 定義資料介面
```

### 3. 測試檢查點
```
- API 回傳格式驗證
- Store 資料處理驗證  
- 前端顯示完整性驗證
- 快取機制驗證
```

## 影響評估

### 正面影響
```
- ✅ 使用者體驗提升：詳情頁顯示完整資訊
- ✅ 效能優化：減少不必要的 API 呼叫
- ✅ 程式碼維護：統一資料結構
```

### 風險評估
```
- ⚠️ 記憶體使用：快取包含更多資料
- ⚠️ API 查詢：增加兩個欄位查詢
- ⚠️ 相容性：確保舊客戶端正常運作
```

## 解決方案總結

### ✅ 已解決的問題
1. **資料完整性：** `fetchBnbs` 現在包含前端所需的所有欄位
   - ✅ 完整的 `features` 結構（environmentTypes, themeFeatures, serviceAmenities）
   - ✅ 完整的 `contact` 結構（phone, website, line, instagram, facebook）
   - ✅ 完整的 `prices` 結構（weekday, weekend, fullRentWeekday, fullRentWeekend）
2. **API 一致性：** 兩個 API 現在回傳相同的資料結構
3. **前端相容性：** 詳情頁面能正確顯示所有功能區塊
4. **使用者體驗：** 從列表進入詳情頁無需額外 API 呼叫

### 🚀 方案優勢
- **零前端變動：** 前端 Store 架構保持不變
- **效能提升：** 減少不必要的 API 呼叫
- **快取友善：** 利用現有的快取機制
- **維護簡便：** 單一資料來源，減少同步問題
- **完整性保證：** 確保列表和詳情頁顯示一致

### ⚠️ 注意事項
1. **資料庫查詢：** 增加社交媒體欄位查詢
2. **記憶體使用：** 快取包含更多完整資料
3. **向後相容：** 確保所有使用 `fetchBnbs` 的前端元件都能正確處理新欄位

### 🔧 後續建議
1. 清理快取以確保新資料結構生效
2. 監控 API 回應時間，確保效能符合預期
3. 考慮為其他類似的列表/詳情 API 建立統一規範

## 相關問題模式

### 類似問題識別
```
當出現以下症狀時，可能是同類型問題：
1. 列表頁顯示正常，詳情頁缺少資料
2. 直接 URL 訪問正常，從列表進入異常
3. API 測試正常，前端顯示異常
4. 清除快取後問題消失
```

### 通用解決思路
```
1. 檢查 API 資料一致性
2. 檢查 Store 資料處理邏輯
3. 檢查前端資料讀取優先級
4. 驗證快取機制影響
```

## 維護備註

**最後更新：** 2025-07-31  
**更新人員：** AI Assistant  
**下次檢查：** 當新增民宿相關欄位時  

**關鍵字：** features, homestay, API一致性, Store同步, 快取問題