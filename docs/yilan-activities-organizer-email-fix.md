# 🔧 修正宜蘭活動主辦單位信箱顯示問題

## 📋 問題描述

在宜蘭活動詳情頁面中,當活動沒有主辦單位信箱時,系統會顯示「提交者」的信箱,這可能造成混淆和隱私問題。

### 問題根源:

1. **後端問題**: 在 `server/api/yilan-activities.post.js` 中,如果沒有主辦單位信箱,會自動填入提交者信箱
   ```javascript
   organizer_email: getData('organizer_email') || getData('submitter_email')
   ```

2. **前端問題**: 在 `pages/yilan-activities/[id].vue` 中,只要 `organizer_email` 有值就會顯示,沒有檢查是否與提交者信箱相同

## ✅ 修正內容

### 1. 後端修正 - `server/api/yilan-activities.post.js`

#### 修正 1.1: 移除自動填入邏輯
```javascript
// 修正前
organizer_email: getData('organizer_email') || getData('submitter_email'),

// 修正後
organizer_email: getData('organizer_email'), // 允許為 null,不自動填入提交者信箱
```

#### 修正 1.2: 更新必填欄位驗證
```javascript
// 修正前
const requiredFields = ['title', 'event_date', 'organizer_name', 'organizer_email', 'submitter_name', 'submitter_email']

// 修正後
const requiredFields = ['title', 'event_date', 'organizer_name', 'submitter_name', 'submitter_email']
```

#### 修正 1.3: 確保插入時允許 NULL
```javascript
// 修正前
activityData.organizer_email, // 必填欄位，已有預設值處理

// 修正後
activityData.organizer_email || null, // 允許為 null,不強制填入
```

### 2. 前端修正 - `pages/yilan-activities/[id].vue`

#### 修正 2.1: 只在有獨立主辦信箱時才顯示
```vue
<!-- 修正前 -->
<div v-if="activity.organizer_email" class="info-row">
  <div class="info-label">聯絡信箱</div>
  <div class="info-value">
    <a :href="'mailto:' + activity.organizer_email" class="contact-link">
      {{ activity.organizer_email }}
    </a>
  </div>
</div>

<!-- 修正後 -->
<div v-if="activity.organizer_email && activity.organizer_email !== activity.submitter_email" class="info-row">
  <div class="info-label">聯絡信箱</div>
  <div class="info-value">
    <a :href="'mailto:' + activity.organizer_email" class="contact-link">
      {{ activity.organizer_email }}
    </a>
  </div>
</div>
```

## 🎯 修正效果

### Before (修正前):
- ❌ 沒有主辦單位信箱時,會顯示提交者信箱
- ❌ 造成資料混淆
- ❌ 可能洩露提交者個人信箱

### After (修正後):
- ✅ 沒有主辦單位信箱時,不顯示該欄位
- ✅ 只有當主辦單位信箱與提交者信箱不同時才顯示
- ✅ 保護提交者隱私
- ✅ 資料更清晰明確

## 📊 影響範圍

### 新提交的活動:
- 主辦單位信箱欄位變為**選填**
- 如果不填寫,資料庫會儲存 `NULL`
- 前端不會顯示聯絡信箱欄位

### 現有活動:
- 如果 `organizer_email` 等於 `submitter_email`,前端不會顯示
- 如果 `organizer_email` 有獨立值,會正常顯示
- 不需要修改現有資料

## 🔍 資料庫結構

`yilan_activities` 表格:
```sql
-- organizer_email 允許 NULL
organizer_email VARCHAR(255) NULL,  -- 主辦單位信箱(選填)
submitter_email VARCHAR(255) NOT NULL,  -- 提交者信箱(必填)
```

## 🧪 測試建議

### 測試場景 1: 新活動 - 有主辦單位信箱
```
提交資料:
- organizer_name: "宜蘭縣政府"
- organizer_email: "yilan@gov.tw"
- submitter_email: "user@example.com"

預期結果:
✅ 前端顯示主辦單位信箱: yilan@gov.tw
```

### 測試場景 2: 新活動 - 沒有主辦單位信箱
```
提交資料:
- organizer_name: "個人主辦"
- organizer_email: (空白)
- submitter_email: "user@example.com"

預期結果:
✅ 資料庫儲存 NULL
✅ 前端不顯示聯絡信箱欄位
```

### 測試場景 3: 新活動 - 主辦單位信箱與提交者信箱相同
```
提交資料:
- organizer_name: "張三"
- organizer_email: "user@example.com"
- submitter_email: "user@example.com"

預期結果:
✅ 資料庫儲存相同信箱
✅ 前端不顯示聯絡信箱欄位(避免重複)
```

## 📝 相關檔案

修改的檔案:
- ✅ `server/api/yilan-activities.post.js` - 後端提交邏輯
- ✅ `pages/yilan-activities/[id].vue` - 前端顯示邏輯

檢查過的檔案:
- ✅ `server/api/yilan-activities/[id].get.js` - API 正常回傳兩個欄位
- ✅ `server/api/yilan-activities/[id].patch.js` - 編輯邏輯正常,允許 NULL

## 🚀 部署注意事項

1. 這次修正**不需要資料庫遷移**
2. 現有資料**不需要更新**
3. 向後相容,不會影響現有活動
4. 建議在測試環境先驗證三個測試場景

## ✨ 總結

這次修正解決了:
- ✅ 資料混淆問題
- ✅ 隱私保護問題
- ✅ 使用者體驗問題

修正原則:
- 📌 **源頭治理**: 從後端 API 開始修正,不自動填入
- 📌 **防禦性顯示**: 前端檢查兩次,確保不誤顯示
- 📌 **欄位語義**: `organizer_email` 只用於主辦單位,不混用

---

**修正日期**: 2025-10-18  
**修正者**: GitHub Copilot  
**狀態**: ✅ 已完成 - 待測試驗證
