<template>
  <div class="place-modal-overlay" @click.self="$emit('close')">
    <div class="place-modal">
      <!-- 模態框標題 -->
      <div class="modal-header">
        <h2 class="modal-title">
          <Icon :name="isEditing ? 'mdi:pencil' : 'mdi:plus'" />
          {{ isEditing ? '編輯地點' : '新增地點' }}
        </h2>
        <button @click="$emit('close')" class="modal-close">
          <Icon name="mdi:close" />
        </button>
      </div>

      <!-- 模態框內容 -->
      <div class="modal-content">
        <form @submit.prevent="handleSubmit" class="place-form">
          <!-- Google Maps 搜尋 -->
          <div class="form-section">
            <h3 class="section-title">
              <Icon name="mdi:google-maps" />
              Google Maps 搜尋
            </h3>
            
            <div class="google-search-container">
              <div class="search-input-group">
                <Icon name="mdi:magnify" class="search-icon" />
                <input
                  ref="googleSearchInput"
                  v-model="searchQuery"
                  type="text"
                  placeholder="搜尋地點名稱或地址..."
                  class="google-search-input"
                  @input="handleSearchInput"
                />
                <button 
                  v-if="searchQuery" 
                  @click="clearSearch" 
                  type="button"
                  class="clear-search"
                >
                  <Icon name="mdi:close" />
                </button>
              </div>
              
              <!-- 搜尋結果 -->
              <div v-if="searchResults.length > 0" class="search-results">
                <div 
                  v-for="result in searchResults" 
                  :key="result.place_id"
                  @click="selectGooglePlace(result)"
                  class="search-result-item"
                >
                  <div class="result-content">
                    <div class="result-name">{{ result.name }}</div>
                    <div class="result-address">{{ result.formatted_address }}</div>
                    <div class="result-meta">
                      <span v-if="result.rating" class="result-rating">
                        <Icon name="mdi:star" />
                        {{ result.rating }}
                      </span>
                      <span v-if="result.types" class="result-types">
                        {{ result.types.slice(0, 2).join(', ') }}
                      </span>
                    </div>
                  </div>
                  <Icon name="mdi:chevron-right" class="result-arrow" />
                </div>
              </div>
              
              <!-- 載入中 -->
              <div v-if="searching" class="search-loading">
                <Icon name="eos-icons:loading" />
                <span>搜尋中...</span>
              </div>
              
              <!-- 無結果 -->
              <div v-if="searchQuery && !searching && searchResults.length === 0" class="search-no-results">
                <Icon name="mdi:map-marker-off" />
                <span>找不到相關地點</span>
              </div>
            </div>
          </div>

          <!-- 基本資訊 -->
          <div class="form-section">
            <h3 class="section-title">基本資訊</h3>
            
            <div class="form-row">
              <div class="form-group">
                <label class="form-label required">地點名稱</label>
                <input
                  v-model="formData.name"
                  type="text"
                  class="form-input"
                  required
                  placeholder="請輸入地點名稱"
                />
              </div>
              
              <div class="form-group">
                <label class="form-label required">分類</label>
                <select v-model="formData.category_id" class="form-select" required>
                  <option value="">請選擇分類</option>
                  <option v-for="category in categories" :key="category.id" :value="category.id">
                    {{ category.name }}
                  </option>
                </select>
              </div>
            </div>

            <div class="form-group">
              <label class="form-label">地點描述</label>
              <textarea
                v-model="formData.description"
                class="form-textarea"
                rows="3"
                placeholder="請描述這個地點的特色、介紹等..."
              ></textarea>
            </div>
          </div>

          <!-- 地址資訊 -->
          <div class="form-section">
            <h3 class="section-title">地址資訊</h3>
            
            <div class="form-group">
              <label class="form-label">完整地址</label>
              <input
                v-model="formData.formatted_address"
                type="text"
                class="form-input"
                placeholder="完整地址"
                readonly
              />
            </div>
            
            <div class="form-row">
              <div class="form-group">
                <label class="form-label required">緯度</label>
                <input
                  v-model.number="formData.latitude"
                  type="number"
                  step="any"
                  class="form-input"
                  required
                  placeholder="例如: 24.8021"
                />
              </div>
              
              <div class="form-group">
                <label class="form-label required">經度</label>
                <input
                  v-model.number="formData.longitude"
                  type="number"
                  step="any"
                  class="form-input"
                  required
                  placeholder="例如: 121.5654"
                />
              </div>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label class="form-label">城市</label>
                <input
                  v-model="formData.locality"
                  type="text"
                  class="form-input"
                  placeholder="城市"
                />
              </div>
              
              <div class="form-group">
                <label class="form-label">縣市</label>
                <input
                  v-model="formData.administrative_area_level_1"
                  type="text"
                  class="form-input"
                  placeholder="縣市"
                />
              </div>
            </div>
          </div>

          <!-- 聯絡資訊 -->
          <div class="form-section">
            <h3 class="section-title">聯絡資訊</h3>
            
            <div class="form-row">
              <div class="form-group">
                <label class="form-label">電話號碼</label>
                <input
                  v-model="formData.phone_number"
                  type="tel"
                  class="form-input"
                  placeholder="例如: 03-1234567"
                />
              </div>
              
              <div class="form-group">
                <label class="form-label">網站</label>
                <input
                  v-model="formData.website"
                  type="url"
                  class="form-input"
                  placeholder="https://example.com"
                />
              </div>
            </div>
          </div>

          <!-- 額外資訊 -->
          <div class="form-section">
            <h3 class="section-title">額外資訊</h3>
            
            <div class="form-row">
              <div class="form-group">
                <label class="form-label">評分</label>
                <input
                  v-model.number="formData.rating"
                  type="number"
                  step="0.1"
                  min="0"
                  max="5"
                  class="form-input"
                  placeholder="0.0 - 5.0"
                />
              </div>
              
              <div class="form-group">
                <label class="form-label">價格等級</label>
                <select v-model="formData.price_level" class="form-select">
                  <option value="">請選擇</option>
                  <option value="0">免費</option>
                  <option value="1">便宜 ($)</option>
                  <option value="2">中等 ($$)</option>
                  <option value="3">昂貴 ($$$)</option>
                  <option value="4">非常昂貴 ($$$$)</option>
                </select>
              </div>
            </div>

            <div class="form-group">
              <label class="form-label">建議停留時間（分鐘）</label>
              <input
                v-model.number="formData.recommended_duration"
                type="number"
                min="15"
                step="15"
                class="form-input"
                placeholder="例如: 60"
              />
            </div>

            <div class="form-group">
              <label class="form-label">遊玩小貼士</label>
              <textarea
                v-model="formData.tips"
                class="form-textarea"
                rows="3"
                placeholder="分享一些遊玩建議或注意事項..."
              ></textarea>
            </div>
          </div>

          <!-- 圖片上傳 -->
          <div class="form-section">
            <h3 class="section-title">地點圖片</h3>
            <p class="section-description">
              選擇 Google 地點後會自動載入前三張圖片，您也可以上傳自己的圖片
            </p>
            
            <div class="image-upload-container">
              <!-- 檔案上傳 -->
              <div class="upload-area" @click="triggerFileInput">
                <Icon name="mdi:cloud-upload" class="upload-icon" />
                <div class="upload-text">
                  <p>點擊上傳圖片</p>
                  <span>支援 JPG、PNG 格式，最大 5MB</span>
                </div>
                <input
                  ref="fileInput"
                  type="file"
                  accept="image/*"
                  multiple
                  @change="handleFileUpload"
                  style="display: none;"
                />
              </div>
              
              <!-- 圖片預覽 -->
              <div v-if="formData.images && formData.images.length > 0" class="image-preview-grid">
                <div v-for="(image, index) in formData.images" :key="index" class="image-preview-item">
                  <img :src="image" :alt="`圖片 ${index + 1}`" />
                  
                  <!-- Google 圖片標識 -->
                  <div v-if="isGoogleImage(image)" class="google-image-badge">
                    <Icon name="mdi:google-maps" />
                    <span>Google</span>
                  </div>
                  
                  <button @click="removeImage(index)" type="button" class="remove-image">
                    <Icon name="mdi:close" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- 設定選項 -->
          <div class="form-section">
            <h3 class="section-title">設定選項</h3>
            
            <div class="checkbox-group">
              <label class="checkbox-item">
                <input v-model="formData.is_featured" type="checkbox" />
                <span class="checkbox-label">
                  <Icon name="mdi:star" />
                  設為精選地點
                </span>
              </label>
              
              <label class="checkbox-item">
                <input v-model="formData.is_private" type="checkbox" />
                <span class="checkbox-label">
                  <Icon name="mdi:lock" />
                  私房景點
                </span>
              </label>
            </div>
            
            <div class="form-group">
              <label class="form-label">狀態</label>
              <select v-model="formData.status" class="form-select">
                <option value="pending">待審核</option>
                <option value="approved">已審核</option>
                <option value="rejected">已拒絕</option>
              </select>
            </div>
          </div>

          <!-- 表單操作 -->
          <div class="form-actions">
            <button type="button" @click="$emit('close')" class="btn-cancel">
              取消
            </button>
            <button type="submit" :disabled="saving" class="btn-save">
              <Icon v-if="saving" name="eos-icons:loading" />
              <Icon v-else :name="isEditing ? 'mdi:content-save' : 'mdi:plus'" />
              {{ saving ? '儲存中...' : (isEditing ? '更新地點' : '新增地點') }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, nextTick } from 'vue';

// Props 和 Emits
const props = defineProps({
  place: {
    type: Object,
    default: null
  },
  categories: {
    type: Array,
    default: () => []
  }
});

const emit = defineEmits(['close', 'saved']);

// 計算屬性
const isEditing = computed(() => !!props.place);

// 狀態管理
const saving = ref(false);
const searching = ref(false);
const searchQuery = ref('');
const searchResults = ref([]);
const searchTimeout = ref(null);

// 表單資料
const formData = reactive({
  name: '',
  category_id: '',
  description: '',
  formatted_address: '',
  latitude: null,
  longitude: null,
  locality: '',
  administrative_area_level_1: '',
  phone_number: '',
  website: '',
  rating: null,
  price_level: '',
  recommended_duration: null,
  tips: '',
  images: [],
  is_featured: false,
  is_private: false,
  status: 'approved',
  google_place_id: null,
  photos: []
});

// 引用
const fileInput = ref(null);
const googleSearchInput = ref(null);

// Google Maps 相關函數
const handleSearchInput = () => {
  if (searchTimeout.value) {
    clearTimeout(searchTimeout.value);
  }
  
  searchTimeout.value = setTimeout(() => {
    if (searchQuery.value.trim().length >= 2) {
      searchGooglePlaces();
    } else {
      searchResults.value = [];
    }
  }, 500);
};

const searchGooglePlaces = async () => {
  try {
    searching.value = true;
    searchResults.value = [];
    
    const response = await $fetch('/api/google/places/search', {
      method: 'POST',
      body: {
        query: searchQuery.value,
        location: '24.8021,121.5654', // 預設台北座標
        radius: 50000 // 50km 範圍
      }
    });
    
    if (response.success) {
      searchResults.value = response.data;
    }
  } catch (error) {
    console.error('搜尋地點失敗:', error);
  } finally {
    searching.value = false;
  }
};

const selectGooglePlace = async (place) => {
  try {
    // 獲取詳細資訊
    const response = await $fetch('/api/google/places/details', {
      method: 'POST',
      body: {
        place_id: place.place_id
      }
    });
    
    if (response.success) {
      const details = response.data;
      
      // 填充表單資料
      formData.name = details.name || '';
      formData.formatted_address = details.formatted_address || '';
      formData.latitude = details.geometry?.location?.lat || null;
      formData.longitude = details.geometry?.location?.lng || null;
      formData.phone_number = details.formatted_phone_number || '';
      formData.website = details.website || '';
      formData.rating = details.rating || null;
      formData.price_level = details.price_level ?? '';
      formData.google_place_id = details.place_id;
      formData.photos = details.photos || [];
      
      // 處理 Google Photos - 取前三張圖片並轉換為實際 URL
      if (details.photos && details.photos.length > 0) {
        const photoUrls = await Promise.all(
          details.photos.slice(0, 3).map(async (photo) => {
            try {
              // 使用 Google Places Photo API 取得圖片 URL
              const photoResponse = await $fetch('/api/google/places/photo', {
                method: 'POST',
                body: {
                  photo_reference: photo.photo_reference,
                  maxwidth: 800 // 設定適中的圖片寬度
                }
              });
              
              if (photoResponse.success && photoResponse.url) {
                return photoResponse.url;
              }
            } catch (error) {
              console.error('獲取照片失敗:', error);
            }
            return null;
          })
        );
        
        // 過濾掉失敗的請求，只保留成功的圖片 URL
        const validPhotoUrls = photoUrls.filter(url => url !== null);
        
        // 將 Google 圖片 URL 添加到現有的圖片陣列中（如果有的話）
        formData.images = [...(formData.images || []), ...validPhotoUrls];
        
        console.log(`已自動載入 ${validPhotoUrls.length} 張 Google 圖片`);
      }
      
      // 解析地址組件
      if (details.address_components) {
        details.address_components.forEach(component => {
          const types = component.types;
          if (types.includes('locality')) {
            formData.locality = component.long_name;
          }
          if (types.includes('administrative_area_level_1')) {
            formData.administrative_area_level_1 = component.long_name;
          }
        });
      }
      
      // 清除搜尋
      clearSearch();
    }
  } catch (error) {
    console.error('獲取地點詳情失敗:', error);
  }
};

const clearSearch = () => {
  searchQuery.value = '';
  searchResults.value = [];
};

// 圖片處理函數
const triggerFileInput = () => {
  if (fileInput.value) {
    fileInput.value.click();
  }
};

const handleFileUpload = async (event) => {
  const files = event.target.files;
  if (!files.length) return;
  
  for (let file of files) {
    try {
      // 驗證檔案
      if (!file.type.startsWith('image/')) {
        alert('請選擇圖片檔案');
        continue;
      }
      
      if (file.size > 5 * 1024 * 1024) {
        alert('圖片檔案不能超過 5MB');
        continue;
      }
      
      // 上傳檔案
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await $fetch('/api/upload', {
        method: 'POST',
        body: formData
      });
      
      if (response.success) {
        formData.images.push(response.url);
      }
    } catch (error) {
      console.error('上傳圖片失敗:', error);
      alert('上傳圖片失敗，請重試');
    }
  }
  
  // 清空檔案輸入
  event.target.value = '';
};

// 判斷圖片是否來自 Google Places
const isGoogleImage = (imageUrl) => {
  return imageUrl && imageUrl.includes('maps.googleapis.com');
};

const removeImage = (index) => {
  formData.images.splice(index, 1);
};

// 表單提交
const handleSubmit = async () => {
  try {
    saving.value = true;
    
    const url = isEditing.value 
      ? `/api/admin/places/${props.place.id}`
      : '/api/admin/places';
    
    const method = isEditing.value ? 'PUT' : 'POST';
    
    const response = await $fetch(url, {
      method,
      body: { ...formData }
    });
    
    if (response.success) {
      emit('saved');
    }
  } catch (error) {
    console.error('儲存地點失敗:', error);
    alert('儲存失敗，請重試');
  } finally {
    saving.value = false;
  }
};

// 初始化表單資料
const initializeForm = () => {
  if (props.place) {
    Object.keys(formData).forEach(key => {
      if (props.place[key] !== undefined) {
        formData[key] = props.place[key];
      }
    });
    
    // 確保陣列欄位的正確格式
    formData.images = props.place.images || [];
    formData.photos = props.place.photos || [];
  }
};

// 組件掛載
onMounted(() => {
  initializeForm();
  
  // 聚焦到搜尋框
  nextTick(() => {
    if (googleSearchInput.value) {
      googleSearchInput.value.focus();
    }
  });
});
</script>

<style lang="scss" scoped>
.place-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  padding: 20px;
}

.place-modal {
  background: white;
  border-radius: 12px;
  width: 100%;
  max-width: 800px;
  max-height: 90vh;
  overflow: hidden;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 24px;
  border-bottom: 1px solid #e5e7eb;
  
  .modal-title {
    display: flex;
    align-items: center;
    gap: 12px;
    font-size: 24px;
    font-weight: 700;
    color: #1f2937;
    margin: 0;
    
    svg {
      font-size: 28px;
      color: #3b82f6;
    }
  }
  
  .modal-close {
    background: #f3f4f6;
    border: none;
    border-radius: 8px;
    width: 40px;
    height: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.3s ease;
    
    &:hover {
      background: #e5e7eb;
    }
    
    svg {
      font-size: 20px;
      color: #6b7280;
    }
  }
}

.modal-content {
  max-height: calc(90vh - 120px);
  overflow-y: auto;
  padding: 0;
}

.place-form {
  .form-section {
    padding: 24px;
    border-bottom: 1px solid #f3f4f6;
    
    &:last-child {
      border-bottom: none;
    }
    
    .section-title {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 18px;
      font-weight: 600;
      color: #1f2937;
      margin-bottom: 20px;
      
      svg {
        font-size: 20px;
        color: #3b82f6;
      }
    }
    
    .section-description {
      font-size: 14px;
      color: #6b7280;
      margin-top: -12px;
      margin-bottom: 16px;
      line-height: 1.4;
    }
  }
  
  .form-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 20px;
    margin-bottom: 20px;
  }
  
  .form-group {
    margin-bottom: 20px;
    
    .form-label {
      display: block;
      margin-bottom: 8px;
      font-weight: 600;
      color: #374151;
      font-size: 14px;
      
      &.required::after {
        content: ' *';
        color: #ef4444;
      }
    }
    
    .form-input,
    .form-select,
    .form-textarea {
      width: 100%;
      padding: 12px 16px;
      border: 2px solid #e5e7eb;
      border-radius: 8px;
      font-size: 14px;
      transition: border-color 0.3s ease;
      
      &:focus {
        outline: none;
        border-color: #3b82f6;
      }
      
      &:read-only {
        background: #f9fafb;
        color: #6b7280;
      }
    }
    
    .form-textarea {
      resize: vertical;
      min-height: 80px;
    }
  }
}

// Google 搜尋樣式
.google-search-container {
  .search-input-group {
    position: relative;
    margin-bottom: 12px;
    
    .search-icon {
      position: absolute;
      left: 16px;
      top: 50%;
      transform: translateY(-50%);
      color: #9ca3af;
      font-size: 18px;
    }
    
    .google-search-input {
      width: 100%;
      padding: 16px 20px 16px 52px;
      border: 2px solid #e5e7eb;
      border-radius: 12px;
      font-size: 16px;
      transition: all 0.3s ease;
      
      &:focus {
        outline: none;
        border-color: #3b82f6;
        box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
      }
    }
    
    .clear-search {
      position: absolute;
      right: 16px;
      top: 50%;
      transform: translateY(-50%);
      background: #f3f4f6;
      border: none;
      border-radius: 50%;
      width: 24px;
      height: 24px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      
      &:hover {
        background: #e5e7eb;
      }
    }
  }
  
  .search-results {
    background: white;
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    max-height: 300px;
    overflow-y: auto;
    
    .search-result-item {
      display: flex;
      align-items: center;
      padding: 16px;
      border-bottom: 1px solid #f3f4f6;
      cursor: pointer;
      transition: background-color 0.3s ease;
      
      &:hover {
        background: #f8fafc;
      }
      
      &:last-child {
        border-bottom: none;
      }
      
      .result-content {
        flex: 1;
        
        .result-name {
          font-weight: 600;
          color: #1f2937;
          margin-bottom: 4px;
        }
        
        .result-address {
          color: #6b7280;
          font-size: 14px;
          margin-bottom: 6px;
        }
        
        .result-meta {
          display: flex;
          gap: 12px;
          font-size: 12px;
          
          .result-rating {
            display: flex;
            align-items: center;
            gap: 4px;
            color: #f59e0b;
          }
          
          .result-types {
            color: #9ca3af;
          }
        }
      }
      
      .result-arrow {
        color: #9ca3af;
        font-size: 18px;
      }
    }
  }
  
  .search-loading,
  .search-no-results {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    padding: 20px;
    color: #6b7280;
    font-size: 14px;
    text-align: center;
    border: 1px solid #e5e7eb;
    border-radius: 8px;
  }
}

// 圖片上傳樣式
.image-upload-container {
  .upload-area {
    border: 2px dashed #d1d5db;
    border-radius: 12px;
    padding: 40px 20px;
    text-align: center;
    cursor: pointer;
    transition: all 0.3s ease;
    
    &:hover {
      border-color: #3b82f6;
      background: #f8fafc;
    }
    
    .upload-icon {
      font-size: 48px;
      color: #9ca3af;
      margin-bottom: 16px;
    }
    
    .upload-text {
      p {
        font-size: 16px;
        font-weight: 600;
        color: #374151;
        margin-bottom: 4px;
      }
      
      span {
        font-size: 14px;
        color: #6b7280;
      }
    }
  }
  
  .image-preview-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
    gap: 12px;
    margin-top: 16px;
    
    .image-preview-item {
      position: relative;
      aspect-ratio: 1;
      border-radius: 8px;
      overflow: hidden;
      
      img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }
      
      .remove-image {
        position: absolute;
        top: 6px;
        right: 6px;
        background: rgba(239, 68, 68, 0.9);
        color: white;
        border: none;
        border-radius: 50%;
        width: 24px;
        height: 24px;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        font-size: 12px;
        
        &:hover {
          background: #dc2626;
        }
      }
      
      .google-image-badge {
        position: absolute;
        bottom: 6px;
        left: 6px;
        background: rgba(66, 133, 244, 0.9);
        color: white;
        border-radius: 12px;
        padding: 2px 6px;
        font-size: 10px;
        display: flex;
        align-items: center;
        gap: 2px;
        
        svg {
          width: 12px;
          height: 12px;
        }
        
        span {
          font-weight: 500;
        }
      }
    }
  }
}

// 複選框樣式
.checkbox-group {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 20px;
  
  .checkbox-item {
    display: flex;
    align-items: center;
    gap: 12px;
    cursor: pointer;
    
    input[type="checkbox"] {
      width: 18px;
      height: 18px;
    }
    
    .checkbox-label {
      display: flex;
      align-items: center;
      gap: 8px;
      font-weight: 500;
      color: #374151;
      
      svg {
        font-size: 16px;
        color: #6b7280;
      }
    }
  }
}

// 表單操作按鈕
.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 24px;
  background: #f9fafb;
  border-top: 1px solid #e5e7eb;
  
  button {
    display: flex;
    align-items: center;
    gap: 8px;
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
  
  .btn-cancel {
    background: #f3f4f6;
    color: #374151;
    border: 2px solid #e5e7eb;
    
    &:hover:not(:disabled) {
      background: #e5e7eb;
    }
  }
  
  .btn-save {
    background: #3b82f6;
    color: white;
    border: 2px solid #3b82f6;
    
    &:hover:not(:disabled) {
      background: #2563eb;
      border-color: #2563eb;
    }
  }
}

// 響應式設計
@media (max-width: 768px) {
  .place-modal-overlay {
    padding: 10px;
  }
  
  .place-modal {
    max-height: 95vh;
  }
  
  .modal-header {
    padding: 16px;
    
    .modal-title {
      font-size: 20px;
    }
  }
  
  .form-section {
    padding: 16px !important;
  }
  
  .form-row {
    grid-template-columns: 1fr;
    gap: 16px;
  }
  
  .form-actions {
    padding: 16px;
    flex-direction: column;
    
    button {
      width: 100%;
      justify-content: center;
    }
  }
}
</style>
