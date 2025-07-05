<template>
  <div class="admin-container">
    <!-- 載入中狀態 -->
    <div v-if="loading" class="loading-screen">
      <div class="loading-content">
        <Icon class="h-8 w-8 text-blue-500" name="eos-icons:loading" />
        <p>載入管理後台...</p>
      </div>
    </div>

    <!-- 未登入狀態 -->
    <div v-else-if="!homestay" class="unauthorized">
      <div class="unauthorized-content">
        <h1>請先登入</h1>
        <p>您需要登入才能訪問民宿管理後台</p>
        <NuxtLink to="/homestay-login" class="login-link">前往登入</NuxtLink>
      </div>
    </div>

    <!-- 管理後台主介面 -->
    <div v-else class="admin-main">
      <!-- 頂部導航 -->
      <header class="admin-header">
        <div class="header-content">
          <div class="header-left">
            <h1 class="admin-title">{{ homestay.name }} - 管理後台</h1>
            <p class="admin-subtitle">編輯您的民宿資訊</p>
          </div>
          <div class="header-right">
            <button @click="handleLogout" class="logout-btn">
              登出
            </button>
          </div>
        </div>
      </header>

      <!-- 成功/錯誤訊息 -->
      <div v-if="message.text" :class="['message', message.type]">
        {{ message.text }}
      </div>

      <!-- 編輯表單 -->
      <div class="admin-content">
        <form @submit.prevent="handleUpdate" class="edit-form">
          <!-- 基本資訊 -->
          <div class="form-section">
            <h2 class="section-title">基本資訊</h2>
            
            <div class="form-row">
              <div class="form-group">
                <label class="form-label">民宿名稱</label>
                <input
                  v-model="editData.name"
                  type="text"
                  class="form-input"
                  :disabled="saving"
                  required
                />
              </div>
              
              <div class="form-group">
                <label class="form-label">所在位置</label>
                <input
                  v-model="editData.location"
                  type="text"
                  class="form-input"
                  :disabled="saving"
                  required
                />
              </div>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label class="form-label">城市</label>
                <input
                  v-model="editData.city"
                  type="text"
                  class="form-input"
                  :disabled="saving"
                />
              </div>
              
              <div class="form-group">
                <label class="form-label">電話</label>
                <input
                  v-model="editData.phone"
                  type="tel"
                  class="form-input"
                  :disabled="saving"
                />
              </div>
            </div>

            <div class="form-group">
              <label class="form-label">網站</label>
              <input
                v-model="editData.website"
                type="url"
                class="form-input"
                :disabled="saving"
              />
            </div>

            <!-- 更新圖片編輯區塊 -->
            <div class="form-group">
              <label class="form-label">民宿圖片</label>
              
              <!-- 圖片網址輸入 (逗點分隔) -->
              <div class="mt-1 w-full">
                <textarea
                  v-model="editData.images_string"
                  placeholder="請輸入圖片網址，多張圖片用逗點分隔&#10;例如：https://example.com/image1.jpg,https://example.com/image2.jpg"
                  class="form-textarea"
                  :disabled="saving"
                  rows="3"
                />
                <div class="input-hint">
                  支援多張圖片，請用逗點分隔網址。第一張圖片將作為主要圖片顯示。
                </div>
              </div>
              
              <!-- 圖片預覽與排序功能 -->
              <div v-if="imagesArray && imagesArray.length > 0" class="mt-4">
                <label class="block text-sm font-medium text-gray-700 mb-2">圖片預覽與排序：</label>
                <div class="images-grid">
                  <div v-for="(url, index) in imagesArray" :key="index" class="image-item">
                    <img :src="url" :alt="'民宿圖片 ' + (index + 1)" class="preview-image" />
                    
                    <!-- 主要圖片標籤 -->
                    <div v-if="index === 0" class="main-image-badge">
                      主要圖片
                    </div>
                    
                    <!-- 操作按鈕 -->
                    <div class="image-controls">
                      <!-- 刪除按鈕 -->
                      <button 
                        @click.prevent="removeImage(index)" 
                        class="control-btn delete-btn"
                        :disabled="saving"
                        title="刪除圖片"
                      >
                        ×
                      </button>
                      
                      <!-- 排序按鈕 -->
                      <div class="sort-controls">
                        <button 
                          @click.prevent="moveImage(index, 'up')" 
                          class="control-btn sort-btn"
                          :disabled="index === 0 || saving"
                          :class="{'opacity-50 cursor-not-allowed': index === 0}"
                          title="向前移動"
                        >
                          ↑
                        </button>
                        <button 
                          @click.prevent="moveImage(index, 'down')" 
                          class="control-btn sort-btn"
                          :disabled="index === imagesArray.length - 1 || saving"
                          :class="{'opacity-50 cursor-not-allowed': index === imagesArray.length - 1}"
                          title="向後移動"
                        >
                          ↓
                        </button>
                      </div>
                    </div>
                    
                    <!-- 圖片順序顯示 -->
                    <div class="image-order">
                      {{ index + 1 }}
                    </div>
                  </div>
                </div>
                
                <div class="mt-2 text-sm text-gray-600">
                  總共 {{ imagesArray.length }} 張圖片。拖曳可調整順序，第一張為主要圖片。
                </div>
              </div>
              
              <!-- 保留舊的單一圖片輸入 (向後相容) -->
              <div v-if="!imagesArray || imagesArray.length === 0" class="mt-4">
                <label class="form-label">單一圖片網址 (舊格式)</label>
                <input
                  v-model="editData.image_url"
                  type="url"
                  class="form-input"
                  :disabled="saving"
                  placeholder="https://example.com/image.jpg"
                />
                <div v-if="editData.image_url" class="image-preview">
                  <img :src="editData.image_url" :alt="editData.name" />
                </div>
                <div class="input-hint">
                  建議使用上方的多圖片功能，此欄位僅供向後相容。
                </div>
              </div>
            </div>

            <div class="form-group">
              <label class="form-label">容量描述</label>
              <textarea
                v-model="editData.capacity_description"
                class="form-textarea"
                :disabled="saving"
                rows="3"
              ></textarea>
            </div>

            <!-- 人數設定 -->
            <div class="form-row">
              <div class="form-group">
                <label class="form-label">最少人數</label>
                <div class="number-input-group">
                  <input
                    v-model.number="editData.min_guests"
                    type="number"
                    class="form-input"
                    :disabled="saving"
                    min="1"
                    max="50"
                    placeholder="例如: 2"
                  />
                  <span class="input-suffix">人</span>
                </div>
              </div>
              
              <div class="form-group">
                <label class="form-label">最多人數</label>
                <div class="number-input-group">
                  <input
                    v-model.number="editData.max_guests"
                    type="number"
                    class="form-input"
                    :disabled="saving"
                    min="1"
                    max="50"
                    placeholder="例如: 8"
                  />
                  <span class="input-suffix">人</span>
                </div>
              </div>
            </div>
          </div>

          <!-- 價格設定 -->
          <div class="form-section">
            <h2 class="section-title">價格設定</h2>
            
            <div class="pricing-grid">
              <div class="pricing-item">
                <label class="form-label">平日房間價格</label>
                <div class="price-input-group">
                  <span class="price-prefix">NT$</span>
                  <input
                    v-model.number="editData.pricing.weekdayRoom"
                    type="number"
                    class="form-input price-input"
                    :disabled="saving"
                    placeholder="0"
                  />
                </div>
              </div>

              <div class="pricing-item">
                <label class="form-label">假日房間價格</label>
                <div class="price-input-group">
                  <span class="price-prefix">NT$</span>
                  <input
                    v-model.number="editData.pricing.weekendRoom"
                    type="number"
                    class="form-input price-input"
                    :disabled="saving"
                    placeholder="0"
                  />
                </div>
              </div>

              <div class="pricing-item">
                <label class="form-label">平日包棟價格</label>
                <div class="price-input-group">
                  <span class="price-prefix">NT$</span>
                  <input
                    v-model.number="editData.pricing.weekdayPackage"
                    type="number"
                    class="form-input price-input"
                    :disabled="saving"
                    placeholder="0"
                  />
                </div>
              </div>

              <div class="pricing-item">
                <label class="form-label">假日包棟價格</label>
                <div class="price-input-group">
                  <span class="price-prefix">NT$</span>
                  <input
                    v-model.number="editData.pricing.weekendPackage"
                    type="number"
                    class="form-input price-input"
                    :disabled="saving"
                    placeholder="0"
                  />
                </div>
              </div>
            </div>
          </div>

          <!-- 特色設定 -->
          <div class="form-section">
            <h2 class="section-title">民宿特色</h2>
            
            <div class="form-group">
              <label class="form-label">環境類型</label>
              <div class="checkbox-group">
                <label v-for="type in availableTypes" :key="type" class="checkbox-item">
                  <input
                    v-model="editData.types"
                    type="checkbox"
                    :value="type"
                    :disabled="saving"
                  />
                  <span class="checkbox-label">{{ type }}</span>
                </label>
              </div>
            </div>

            <div class="form-group">
              <label class="form-label">
                <input
                  v-model="editData.available"
                  type="checkbox"
                  :disabled="saving"
                />
                開放預訂
              </label>
            </div>
          </div>

          <!-- 提交按鈕 -->
          <div class="form-actions">
            <button
              type="submit"
              class="save-btn"
              :disabled="saving"
            >
              {{ saving ? '儲存中...' : '儲存變更' }}
            </button>
            
            <button
              type="button"
              @click="resetForm"
              class="reset-btn"
              :disabled="saving"
            >
              重置
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { navigateTo } from 'nuxt/app';

// SEO設定
useHead({
  title: '民宿管理後台',
  meta: [
    { name: 'robots', content: 'noindex, nofollow' }
  ]
});

// 狀態管理
const loading = ref(true);
const saving = ref(false);
const homestay = ref(null);
const originalData = ref(null);
const editData = ref({
  name: '',
  location: '',
  city: '',
  phone: '',
  website: '',
  image_url: '',
  images: [],
  images_string: '',
  capacity_description: '',
  min_guests: null,
  max_guests: null,
  available: true,
  types: [],
  pricing: {
    weekdayRoom: null,
    weekendRoom: null,
    weekdayPackage: null,
    weekendPackage: null
  }
});

// 計算屬性用於圖片預覽和排序
const imagesArray = computed({
  get: () => {
    return editData.value.images_string ? 
      editData.value.images_string.split(',').map(url => url.trim()).filter(url => url) : 
      [];
  },
  set: (newArray) => {
    editData.value.images_string = newArray.join(',');
    editData.value.images = newArray;
  }
});

const message = ref({
  text: '',
  type: ''
});

// 移除圖片
const removeImage = (index) => {
  const newArray = [...imagesArray.value];
  newArray.splice(index, 1);
  imagesArray.value = newArray;
  showMessage('圖片已移除', 'info');
};

// 移動圖片順序
const moveImage = (index, direction) => {
  const newArray = [...imagesArray.value];
  
  if (direction === 'up' && index > 0) {
    // 與上一個元素交換位置
    const temp = newArray[index];
    newArray[index] = newArray[index - 1];
    newArray[index - 1] = temp;
  } else if (direction === 'down' && index < newArray.length - 1) {
    // 與下一個元素交換位置
    const temp = newArray[index];
    newArray[index] = newArray[index + 1];
    newArray[index + 1] = temp;
  }
  
  imagesArray.value = newArray;
  showMessage(`圖片已${direction === 'up' ? '前移' : '後移'}`, 'info');
};

// 可選擇的環境類型
const availableTypes = [
  '自然景觀型',
  '都市便利型',
  '秘境隱居型'
];

// 檢查登入狀態
const checkAuth = async () => {
  try {
    const response = await $fetch('/api/homestay-auth');
    if (response.success) {
      homestay.value = response.homestay;
      await loadHomestayData();
    }
  } catch (error) {
    console.error('身份驗證失敗:', error);
    await navigateTo('/homestay-login');
  } finally {
    loading.value = false;
  }
};

// 載入民宿資料
const loadHomestayData = async () => {
  try {
    const response = await $fetch(`/api/fetchBnbDetail?id=${homestay.value.id}`);
    if (response.success) {
      const data = response.bnb;
      
      // 處理圖片資料 - 優先使用 images 陣列
      let images = [];
      if (data.images && Array.isArray(data.images) && data.images.length > 0) {
        images = data.images;
      } else if (data.image_urls && Array.isArray(data.image_urls) && data.image_urls.length > 0) {
        images = data.image_urls;
      } else if (data.image_url) {
        images = [data.image_url];
      }
      
      // 設定編輯資料
      editData.value = {
        name: data.name || '',
        location: data.area || '',
        city: data.address || '',
        phone: data.contact?.phone || '',
        website: data.contact?.website || '',
        image_url: images[0] || '',
        images: images,
        images_string: images.join(','),
        capacity_description: data.description || '',
        min_guests: data.min_guests || null,
        max_guests: data.max_guests || null,
        available: true,
        types: data.features?.environmentTypes || [],
        pricing: {
          weekdayRoom: extractPrice(data.prices?.weekday),
          weekendRoom: extractPrice(data.prices?.weekend),
          weekdayPackage: extractPrice(data.prices?.fullRentWeekday),
          weekendPackage: extractPrice(data.prices?.fullRentWeekend)
        }
      };
      
      // 保存原始資料
      originalData.value = JSON.parse(JSON.stringify(editData.value));
    }
  } catch (error) {
    console.error('載入民宿資料失敗:', error);
    showMessage('載入資料失敗', 'error');
  }
};

// 從格式化價格中提取數字
const extractPrice = (priceString) => {
  if (!priceString) return null;
  const match = priceString.match(/[\d,]+/);
  return match ? parseInt(match[0].replace(/,/g, '')) : null;
};

// 顯示訊息
const showMessage = (text, type = 'success') => {
  message.value = { text, type };
  setTimeout(() => {
    message.value = { text: '', type: '' };
  }, 5000);
};

// 重置表單
const resetForm = () => {
  if (originalData.value) {
    editData.value = JSON.parse(JSON.stringify(originalData.value));
    showMessage('已重置為原始資料', 'info');
  }
};

// 處理更新
const handleUpdate = async () => {
  try {
    saving.value = true;
    
    // 更新 images 陣列
    editData.value.images = imagesArray.value;
    
    const updateData = {
      ...editData.value,
      images: editData.value.images
    };

    const response = await $fetch('/api/update-homestay', {
      method: 'POST',
      body: updateData
    });

    if (response.success) {
      originalData.value = JSON.parse(JSON.stringify(editData.value));
      showMessage('民宿資料已成功更新！', 'success');
    }

  } catch (error) {
    console.error('更新失敗:', error);
    showMessage(error.data?.message || '更新失敗，請稍後再試', 'error');
  } finally {
    saving.value = false;
  }
};

// 處理登出
const handleLogout = async () => {
  if (confirm('確定要登出嗎？')) {
    try {
      await $fetch('/api/homestay-logout', { method: 'POST' });
      await navigateTo('/homestay-login');
    } catch (error) {
      console.error('登出失敗:', error);
    }
  }
};

onMounted(() => {
  checkAuth();
});
</script>

<style lang="scss" scoped>
.admin-container {
  min-height: 100vh;
  background: #f8fafc;
}

.loading-screen, .unauthorized {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
}

.loading-content, .unauthorized-content {
  text-align: center;
  
  h1 {
    font-size: 24px;
    color: #2d3748;
    margin-bottom: 8px;
  }
  
  p {
    color: #718096;
    margin-bottom: 16px;
  }
}

.login-link {
  background: #667eea;
  color: white;
  padding: 12px 24px;
  border-radius: 8px;
  text-decoration: none;
  transition: background 0.3s ease;
  
  &:hover {
    background: #5a67d8;
  }
}

.admin-header {
  background: white;
  border-bottom: 1px solid #e2e8f0;
  padding: 20px 0;
  
  .header-content {
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 20px;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  
  .admin-title {
    font-size: 24px;
    font-weight: 700;
    color: #2d3748;
    margin-bottom: 4px;
  }
  
  .admin-subtitle {
    color: #718096;
    margin: 0;
  }
  
  .logout-btn {
    background: #e53e3e;
    color: white;
    border: none;
    padding: 8px 16px;
    border-radius: 6px;
    cursor: pointer;
    transition: background 0.3s ease;
    
    &:hover {
      background: #c53030;
    }
  }
}

.message {
  max-width: 1200px;
  margin: 20px auto 0;
  padding: 12px 20px;
  border-radius: 8px;
  
  &.success {
    background: #c6f6d5;
    color: #22543d;
    border-left: 4px solid #38a169;
  }
  
  &.error {
    background: #fed7d7;
    color: #742a2a;
    border-left: 4px solid #e53e3e;
  }
  
  &.info {
    background: #bee3f8;
    color: #2a4365;
    border-left: 4px solid #3182ce;
  }
}

.admin-content {
  max-width: 1200px;
  margin: 0 auto;
  padding: 40px 20px;
}

.edit-form {
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
  overflow: hidden;
}

.form-section {
  padding: 32px;
  border-bottom: 1px solid #e2e8f0;
  
  &:last-child {
    border-bottom: none;
  }
}

.section-title {
  font-size: 20px;
  font-weight: 600;
  color: #2d3748;
  margin-bottom: 24px;
  border-bottom: 2px solid #667eea;
  padding-bottom: 8px;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
  margin-bottom: 20px;
}

.form-group {
  margin-bottom: 20px;
}

.form-label {
  display: block;
  margin-bottom: 8px;
  color: #2d3748;
  font-weight: 600;
  font-size: 14px;
}

.form-input, .form-textarea {
  width: 100%;
  padding: 12px 16px;
  border: 2px solid #e2e8f0;
  border-radius: 8px;
  font-size: 16px;
  transition: all 0.3s ease;
  
  &:focus {
    outline: none;
    border-color: #667eea;
    box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
  }
  
  &:disabled {
    background: #f7fafc;
    cursor: not-allowed;
    opacity: 0.6;
  }
}

.image-preview {
  margin-top: 12px;
  
  img {
    max-width: 200px;
    max-height: 120px;
    object-fit: cover;
    border-radius: 8px;
    border: 1px solid #e2e8f0;
  }
}

.pricing-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
}

.price-input-group {
  display: flex;
  align-items: center;
  border: 2px solid #e2e8f0;
  border-radius: 8px;
  transition: border-color 0.3s ease;
  
  &:focus-within {
    border-color: #667eea;
    box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
  }
}

.price-prefix {
  padding: 12px 16px;
  background: #f7fafc;
  color: #4a5568;
  font-weight: 600;
  border-right: 2px solid #e2e8f0;
}

.price-input {
  border: none;
  border-radius: 0 6px 6px 0;
  
  &:focus {
    box-shadow: none;
  }
}

.number-input-group {
  display: flex;
  align-items: center;
  border: 2px solid #e2e8f0;
  border-radius: 8px;
  transition: border-color 0.3s ease;
  
  &:focus-within {
    border-color: #667eea;
    box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
  }
  
  input {
    border: none;
    border-radius: 6px 0 0 6px;
    
    &:focus {
      box-shadow: none;
    }
  }
}

.input-suffix {
  padding: 12px 16px;
  background: #f7fafc;
  color: #4a5568;
  font-weight: 600;
  border-left: 2px solid #e2e8f0;
  border-radius: 0 6px 6px 0;
}

.checkbox-group {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
}

.checkbox-item {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  
  input[type="checkbox"] {
    width: 18px;
    height: 18px;
  }
  
  .checkbox-label {
    color: #4a5568;
    font-weight: 500;
  }
}

.form-actions {
  padding: 32px;
  background: #f7fafc;
  display: flex;
  gap: 16px;
  justify-content: flex-end;
}

.save-btn, .reset-btn {
  padding: 12px 24px;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
}

.save-btn {
  background: #667eea;
  color: white;
  border: none;
  
  &:hover:not(:disabled) {
    background: #5a67d8;
    transform: translateY(-1px);
  }
}

.reset-btn {
  background: #e2e8f0;
  color: #4a5568;
  border: none;
  
  &:hover:not(:disabled) {
    background: #cbd5e0;
  }
}

// 響應式設計
@media (max-width: 768px) {
  .form-row {
    grid-template-columns: 1fr;
  }
  
  .pricing-grid {
    grid-template-columns: 1fr;
  }
  
  .header-content {
    flex-direction: column;
    gap: 16px;
    text-align: center;
  }
  
  .form-actions {
    flex-direction: column;
  }
}

// 新增圖片相關樣式
.input-hint {
  font-size: 12px;
  color: #718096;
  margin-top: 6px;
  line-height: 1.4;
}

.images-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 16px;
  margin-top: 12px;
}

.image-item {
  position: relative;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  background: white;
  border: 2px solid #e2e8f0;
  transition: all 0.3s ease;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
    border-color: #667eea;
  }
}

.preview-image {
  width: 100%;
  height: 140px;
  object-fit: cover;
  display: block;
}

.main-image-badge {
  position: absolute;
  top: 8px;
  left: 8px;
  background: linear-gradient(45deg, #667eea, #764ba2);
  color: white;
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 11px;
  font-weight: 600;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
}

.image-controls {
  position: absolute;
  top: 8px;
  right: 8px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.control-btn {
  width: 28px;
  height: 28px;
  border: none;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  font-weight: 600;
  transition: all 0.3s ease;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
}

.delete-btn {
  background: #e53e3e;
  color: white;
  font-size: 16px;
  
  &:hover:not(:disabled) {
    background: #c53030;
    transform: scale(1.1);
  }
}

.sort-controls {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.sort-btn {
  background: #4a5568;
  color: white;
  font-size: 12px;
  
  &:hover:not(:disabled) {
    background: #2d3748;
    transform: scale(1.1);
  }
}

.image-order {
  position: absolute;
  bottom: 8px;
  right: 8px;
  background: rgba(0, 0, 0, 0.7);
  color: white;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 600;
}
</style> 