<template>
  <div class="coupon-submit-container">
    <div class="page-header">
      <h1>提交優惠券</h1>
      <p class="page-subtitle">分享您的優惠券給其他使用者，提交後需經過管理員審核</p>
    </div>

    <form @submit.prevent="submitCoupon" class="coupon-form">
      <div class="form-section">
        <h3>基本資訊</h3>
        
        <div class="form-group">
          <label for="title" class="required">優惠券標題</label>
          <input 
            id="title"
            v-model="form.title" 
            type="text" 
            placeholder="請輸入優惠券標題"
            required 
          />
        </div>

        <div class="form-group">
          <label for="content" class="required">優惠券內容</label>
          <textarea 
            id="content"
            v-model="form.content" 
            placeholder="請詳細描述優惠券內容、使用方式等"
            rows="4"
            required
          ></textarea>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label for="discount_type">優惠類型</label>
            <select id="discount_type" v-model="form.discount_type">
              <option value="percentage">百分比折扣</option>
              <option value="fixed">固定金額折扣</option>
              <option value="special">特殊優惠</option>
            </select>
          </div>

          <div class="form-group">
            <label for="discount_value">優惠金額/折扣</label>
            <input 
              id="discount_value"
              v-model="form.discount_value" 
              type="number" 
              placeholder="例如：100 或 0.8"
              step="0.01"
            />
          </div>
        </div>
      </div>

      <div class="form-section">
        <h3>商家資訊</h3>
        
        <div class="form-group">
          <label for="business_name" class="required">商家名稱</label>
          <input 
            id="business_name"
            v-model="form.business_name" 
            type="text" 
            placeholder="請輸入商家名稱"
            required 
          />
        </div>

        <div class="form-row">
          <div class="form-group">
            <label for="category">商家類別</label>
            <select id="category" v-model="form.category">
              <option value="">請選擇類別</option>
              <option value="restaurant">餐廳</option>
              <option value="accommodation">住宿</option>
              <option value="attraction">景點</option>
              <option value="shopping">購物</option>
              <option value="entertainment">娛樂</option>
              <option value="service">服務</option>
              <option value="other">其他</option>
            </select>
          </div>

          <div class="form-group">
            <label for="township">鄉鎮區域</label>
            <select id="township" v-model="form.township">
              <option value="">請選擇區域</option>
              <option value="羅東鎮">羅東鎮</option>
              <option value="宜蘭市">宜蘭市</option>
              <option value="冬山鄉">冬山鄉</option>
              <option value="五結鄉">五結鄉</option>
              <option value="礁溪鄉">礁溪鄉</option>
              <option value="頭城鎮">頭城鎮</option>
              <option value="蘇澳鎮">蘇澳鎮</option>
              <option value="三星鄉">三星鄉</option>
              <option value="員山鄉">員山鄉</option>
              <option value="壯圍鄉">壯圍鄉</option>
              <option value="大同鄉">大同鄉</option>
              <option value="南澳鄉">南澳鄉</option>
            </select>
          </div>
        </div>

        <div class="form-group">
          <label for="address">商家地址</label>
          <input 
            id="address"
            v-model="form.address" 
            type="text" 
            placeholder="請輸入詳細地址"
          />
        </div>

        <div class="form-row">
          <div class="form-group">
            <label for="phone">聯絡電話</label>
            <input 
              id="phone"
              v-model="form.phone" 
              type="tel" 
              placeholder="例如：03-1234567"
            />
          </div>

          <div class="form-group">
            <label for="website">官方網站</label>
            <input 
              id="website"
              v-model="form.website" 
              type="url" 
              placeholder="https://"
            />
          </div>
        </div>
      </div>

      <div class="form-section">
        <h3>優惠券設定</h3>
        
        <div class="form-row">
          <div class="form-group">
            <label for="amount">發放數量</label>
            <input 
              id="amount"
              v-model.number="form.amount" 
              type="number" 
              placeholder="預計發放的優惠券數量"
              min="1"
            />
          </div>

          <div class="form-group">
            <label for="category_id">優惠券分類</label>
            <select id="category_id" v-model.number="form.category_id">
              <option value="">請選擇分類</option>
              <option value="1">餐飲美食</option>
              <option value="2">住宿旅館</option>
              <option value="3">景點門票</option>
              <option value="4">交通運輸</option>
              <option value="5">購物商城</option>
              <option value="6">休閒娛樂</option>
              <option value="7">其他服務</option>
            </select>
          </div>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label>
              <input 
                type="checkbox" 
                v-model="form.isonce"
              />
              每個帳號限領一次
            </label>
          </div>

          <div class="form-group">
            <label>
              <input 
                type="checkbox" 
                v-model="form.isReferral"
              />
              顯示為推薦商家
            </label>
          </div>
        </div>

        <div class="form-group">
          <label for="tags">標籤 (用逗號分隔)</label>
          <input 
            id="tags"
            v-model="form.tags" 
            type="text" 
            placeholder="例如：#美食 #特惠 #限時"
          />
        </div>

        <div class="form-group">
          <label for="position">商家位置 (經緯度)</label>
          <input 
            id="position"
            v-model="form.position" 
            type="text" 
            placeholder="例如：24.63567884891394, 121.79100640000001"
          />
          <small>可以從 Google 地圖獲取經緯度座標</small>
        </div>
      </div>

      <div class="form-section">
        <h3>優惠券圖片</h3>
        
        <div class="form-group">
          <label for="cover_image">封面圖片</label>
          <div class="image-upload-area" @click="triggerImageUpload">
            <input 
              ref="imageInput"
              type="file" 
              accept="image/*" 
              @change="handleImageUpload"
              style="display: none;"
            />
            <div v-if="form.cover_preview" class="image-preview">
              <img :src="form.cover_preview" alt="預覽圖片" />
              <button type="button" @click.stop="removeImage" class="remove-image-btn">
                <Icon name="mdi:close" />
              </button>
            </div>
            <div v-else class="upload-placeholder">
              <Icon name="mdi:cloud-upload" />
              <p>點擊上傳圖片</p>
              <small>支援 JPG、PNG 格式，建議尺寸 800x600px</small>
            </div>
          </div>
        </div>
      </div>

      <div class="form-section">
        <h3>使用條件</h3>
        
        <div class="form-row">
          <div class="form-group">
            <label for="valid_from">開始日期</label>
            <input 
              id="valid_from"
              v-model="form.valid_from" 
              type="date"
            />
          </div>

          <div class="form-group">
            <label for="valid_until">結束日期</label>
            <input 
              id="valid_until"
              v-model="form.valid_until" 
              type="date"
            />
          </div>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label for="min_purchase">最低消費金額</label>
            <input 
              id="min_purchase"
              v-model="form.min_purchase" 
              type="number" 
              placeholder="0"
              min="0"
            />
          </div>

          <div class="form-group">
            <label for="max_usage">使用次數限制</label>
            <input 
              id="max_usage"
              v-model="form.max_usage" 
              type="number" 
              placeholder="不限制請留空"
              min="1"
            />
          </div>
        </div>

        <div class="form-group">
          <label for="usage_notes">使用說明</label>
          <textarea 
            id="usage_notes"
            v-model="form.usage_notes" 
            placeholder="請說明使用方式、注意事項等"
            rows="3"
          ></textarea>
        </div>
      </div>

      <div class="form-section">
        <h3>提交者資訊</h3>
        
        <div class="form-row">
          <div class="form-group">
            <label for="submitter_name" class="required">您的姓名</label>
            <input 
              id="submitter_name"
              v-model="form.submitter_name" 
              type="text" 
              placeholder="請輸入您的真實姓名"
              required 
            />
          </div>

          <div class="form-group">
            <label for="submitter_phone" class="required">聯絡電話</label>
            <input 
              id="submitter_phone"
              v-model="form.submitter_phone" 
              type="tel" 
              placeholder="請輸入您的聯絡電話"
              required 
            />
          </div>
        </div>

        <div class="form-group">
          <label for="submitter_email">電子郵件</label>
          <input 
            id="submitter_email"
            v-model="form.submitter_email" 
            type="email" 
            placeholder="您的電子郵件地址"
          />
        </div>
      </div>

      <div class="form-actions">
        <button type="button" @click="resetForm" class="btn-reset">
          <Icon name="mdi:refresh" />
          重設表單
        </button>
        <button type="submit" :disabled="submitting" class="btn-submit">
          <Icon v-if="submitting" name="eos-icons:loading" />
          <Icon v-else name="mdi:send" />
          {{ submitting ? '提交中...' : '提交審核' }}
        </button>
      </div>
    </form>

    <!-- 成功提交的模態框 -->
    <div v-if="showSuccessModal" class="modal-overlay" @click="closeSuccessModal">
      <div class="modal" @click.stop>
        <div class="modal-header">
          <Icon name="mdi:check-circle" class="success-icon" />
          <h3>提交成功！</h3>
        </div>
        <div class="modal-body">
          <p>您的優惠券已成功提交，我們會在 1-3 個工作天內進行審核。</p>
          <p>審核結果將透過您提供的聯絡方式通知。</p>
        </div>
        <div class="modal-actions">
          <button @click="closeSuccessModal" class="btn-primary">
            確定
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'

// 設定頁面標題
useHead({
  title: '提交優惠券 - 宜蘭旅遊網',
  meta: [
    { name: 'description', content: '分享您的優惠券給其他旅客，豐富宜蘭旅遊體驗' }
  ]
})

// 響應式資料
const submitting = ref(false)
const showSuccessModal = ref(false)
const imageInput = ref(null)

// 表單資料
const form = reactive({
  title: '',
  content: '',
  discount_type: 'percentage',
  discount_value: '',
  business_name: '',
  category: '',
  township: '',
  address: '',
  phone: '',
  website: '',
  cover_image: null,
  cover_preview: null,
  valid_from: '',
  valid_until: '',
  min_purchase: 0,
  max_usage: '',
  usage_notes: '',
  submitter_name: '',
  submitter_phone: '',
  submitter_email: '',
  // 新增 articles 表格需要的欄位
  amount: 1000,
  category_id: '',
  isonce: true,
  isReferral: false,
  tags: '',
  position: ''
})

// 觸發圖片上傳
const triggerImageUpload = () => {
  imageInput.value?.click()
}

// 處理圖片上傳
const handleImageUpload = (event) => {
  const file = event.target.files[0]
  if (file) {
    // 檢查檔案大小（最大5MB）
    if (file.size > 5 * 1024 * 1024) {
      alert('圖片大小不能超過 5MB')
      return
    }

    // 檢查檔案類型
    if (!file.type.startsWith('image/')) {
      alert('請選擇圖片檔案')
      return
    }

    form.cover_image = file

    // 建立預覽
    const reader = new FileReader()
    reader.onload = (e) => {
      form.cover_preview = e.target.result
    }
    reader.readAsDataURL(file)
  }
}

// 移除圖片
const removeImage = () => {
  form.cover_image = null
  form.cover_preview = null
  if (imageInput.value) {
    imageInput.value.value = ''
  }
}

// 重設表單
const resetForm = () => {
  if (confirm('確定要重設表單？所有資料將會清除。')) {
    Object.keys(form).forEach(key => {
      if (key === 'discount_type') {
        form[key] = 'percentage'
      } else if (key === 'min_purchase') {
        form[key] = 0
      } else if (key === 'amount') {
        form[key] = 1000
      } else if (key === 'isonce') {
        form[key] = true
      } else if (key === 'isReferral') {
        form[key] = false
      } else if (key === 'cover_image' || key === 'cover_preview') {
        form[key] = null
      } else {
        form[key] = ''
      }
    })
    if (imageInput.value) {
      imageInput.value.value = ''
    }
  }
}

// 提交優惠券
const submitCoupon = async () => {
  try {
    submitting.value = true

    // 建立 FormData 來處理檔案上傳
    const formData = new FormData()
    
    // 添加所有表單欄位
    Object.keys(form).forEach(key => {
      if (key !== 'cover_preview' && form[key] !== null && form[key] !== '') {
        formData.append(key, form[key])
      }
    })

    // 提交資料
    const response = await $fetch('/api/coupons/submit', {
      method: 'POST',
      body: formData
    })

    if (response.success) {
      showSuccessModal.value = true
      resetForm()
    } else {
      throw new Error(response.message || '提交失敗')
    }

  } catch (error) {
    console.error('提交優惠券失敗:', error)
    alert('提交失敗：' + (error.data?.message || error.message || '請稍後再試'))
  } finally {
    submitting.value = false
  }
}

// 關閉成功模態框
const closeSuccessModal = () => {
  showSuccessModal.value = false
}
</script>

<style lang="scss" scoped>
.coupon-submit-container {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
  background: #f8fafc;
  min-height: 100vh;
}

.page-header {
  text-align: center;
  margin-bottom: 40px;
  
  h1 {
    color: #1f2937;
    font-size: 32px;
    font-weight: 700;
    margin-bottom: 12px;
  }
  
  .page-subtitle {
    color: #6b7280;
    font-size: 16px;
    line-height: 1.6;
  }
}

.coupon-form {
  background: white;
  border-radius: 12px;
  padding: 30px;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
}

.form-section {
  margin-bottom: 40px;
  
  &:last-child {
    margin-bottom: 0;
  }
  
  h3 {
    color: #1f2937;
    font-size: 20px;
    font-weight: 600;
    margin-bottom: 20px;
    padding-bottom: 8px;
    border-bottom: 2px solid #e5e7eb;
  }
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
  
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
}

.form-group {
  margin-bottom: 20px;
  
  label {
    display: block;
    color: #374151;
    font-weight: 500;
    margin-bottom: 8px;
    
    &.required::after {
      content: ' *';
      color: #ef4444;
    }
  }
  
  input, textarea, select {
    width: 100%;
    padding: 12px 16px;
    border: 1px solid #d1d5db;
    border-radius: 8px;
    font-size: 14px;
    transition: border-color 0.2s ease, box-shadow 0.2s ease;
    
    &:focus {
      outline: none;
      border-color: #3b82f6;
      box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
    }
    
    &::placeholder {
      color: #9ca3af;
    }
  }
  
  textarea {
    resize: vertical;
    min-height: 80px;
  }
}

.image-upload-area {
  border: 2px dashed #d1d5db;
  border-radius: 8px;
  padding: 20px;
  text-align: center;
  cursor: pointer;
  transition: border-color 0.2s ease, background-color 0.2s ease;
  position: relative;
  
  &:hover {
    border-color: #3b82f6;
    background-color: #f8fafc;
  }
  
  .image-preview {
    position: relative;
    
    img {
      max-width: 100%;
      max-height: 200px;
      border-radius: 8px;
      object-fit: cover;
    }
    
    .remove-image-btn {
      position: absolute;
      top: -8px;
      right: -8px;
      background: #ef4444;
      color: white;
      border: none;
      border-radius: 50%;
      width: 24px;
      height: 24px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      
      &:hover {
        background: #dc2626;
      }
    }
  }
  
  .upload-placeholder {
    color: #6b7280;
    
    svg {
      width: 48px;
      height: 48px;
      margin-bottom: 12px;
      color: #9ca3af;
    }
    
    p {
      margin: 0 0 4px 0;
      font-weight: 500;
    }
    
    small {
      color: #9ca3af;
      font-size: 12px;
    }
  }
}

.form-actions {
  display: flex;
  gap: 16px;
  justify-content: flex-end;
  margin-top: 40px;
  padding-top: 20px;
  border-top: 1px solid #e5e7eb;
  
  @media (max-width: 768px) {
    flex-direction: column;
  }
  
  button {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 12px 24px;
    border: none;
    border-radius: 8px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;
    
    &:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }
  }
  
  .btn-reset {
    background: #f3f4f6;
    color: #374151;
    
    &:hover:not(:disabled) {
      background: #e5e7eb;
    }
  }
  
  .btn-submit {
    background: #3b82f6;
    color: white;
    
    &:hover:not(:disabled) {
      background: #2563eb;
    }
  }
}

// 模態框樣式
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal {
  background: white;
  border-radius: 12px;
  padding: 24px;
  max-width: 400px;
  width: 90%;
  text-align: center;
  
  .modal-header {
    margin-bottom: 16px;
    
    .success-icon {
      width: 48px;
      height: 48px;
      color: #10b981;
      margin-bottom: 12px;
    }
    
    h3 {
      margin: 0;
      color: #1f2937;
      font-size: 20px;
      font-weight: 600;
    }
  }
  
  .modal-body {
    margin-bottom: 24px;
    
    p {
      color: #6b7280;
      line-height: 1.6;
      margin-bottom: 8px;
      
      &:last-child {
        margin-bottom: 0;
      }
    }
  }
  
  .modal-actions {
    .btn-primary {
      background: #3b82f6;
      color: white;
      border: none;
      padding: 12px 24px;
      border-radius: 8px;
      font-weight: 500;
      cursor: pointer;
      
      &:hover {
        background: #2563eb;
      }
    }
  }
}
</style>