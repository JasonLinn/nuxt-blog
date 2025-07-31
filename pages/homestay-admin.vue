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
            <NuxtLink to="/homestay-list" class="back-to-list-btn">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                <path fill-rule="evenodd" d="M15 8a.5.5 0 0 0-.5-.5H2.707l3.147-3.146a.5.5 0 1 0-.708-.708l-4 4a.5.5 0 0 0 0 .708l4 4a.5.5 0 0 0 .708-.708L2.707 8.5H14.5A.5.5 0 0 0 15 8"/>
              </svg>
              回到民宿列表
            </NuxtLink>
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

            <!-- 社群媒體資訊 -->
            <h3 class="section-title">社群媒體連結</h3>
            
            <div class="form-row">
            <div class="form-group">
                <label class="form-label">LINE 連結</label>
              <input
                  v-model="editData.social.line"
                type="url"
                class="form-input"
                  placeholder="https://line.me/ti/p/YOUR_LINE_ID"
                :disabled="saving"
              />
              </div>
              
              <div class="form-group">
                <label class="form-label">Instagram</label>
                <input
                  v-model="editData.social.instagram"
                  type="url"
                  class="form-input"
                  placeholder="https://instagram.com/YOUR_ACCOUNT"
                  :disabled="saving"
                />
              </div>
            </div>

            <div class="form-group">
              <label class="form-label">Facebook</label>
              <input
                v-model="editData.social.facebook"
                type="url"
                class="form-input"
                placeholder="https://facebook.com/YOUR_PAGE"
                :disabled="saving"
              />
            </div>

            <!-- 更新圖片編輯區塊 -->
            <div class="form-group">
              <label class="form-label">民宿圖片</label>
              
              <!-- 檔案上傳區塊 -->
              <div class="upload-section">
                <label class="upload-label">上傳圖片檔案</label>
                <input 
                  type="file" 
                  @change="handleFileUpload" 
                  accept="image/*" 
                  multiple 
                  :disabled="saving"
                  class="file-input"
                />
                <div class="upload-hint">
                  支援 JPG、PNG、GIF 格式，單檔最大 5MB，可一次選擇多張圖片
                </div>
              </div>
              
              <!-- 手動添加圖片URL -->
              <div class="url-input-section">
                <label class="upload-label">或手動添加圖片網址</label>
                <div class="url-input-group">
                  <input
                    v-model="newImageUrl"
                    type="url"
                    class="form-input"
                    placeholder="請輸入圖片網址，例如：https://example.com/image.jpg"
                    :disabled="saving"
                    @keyup.enter="addImageUrl"
                  />
                  <button 
                    @click.prevent="addImageUrl" 
                    class="add-url-btn"
                    :disabled="!newImageUrl || saving"
                  >
                    添加圖片
                  </button>
                </div>
              </div>
              

              
              <!-- 圖片預覽與排序功能 -->
              <div v-if="imagesArray && imagesArray.length > 0" class="mt-4">
                <div class="preview-header">
                  <label class="block text-sm font-medium text-gray-700">圖片預覽與管理</label>
                  <div class="preview-stats">
                    共 {{ imagesArray.length }} 張圖片
                  </div>
                </div>
                
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
                  
                  <!-- 添加新圖片的佔位符 -->
                  <div class="add-image-placeholder" @click="triggerFileInput">
                    <div class="placeholder-content">
                      <Icon name="mdi:plus" class="placeholder-icon" />
                      <span>點擊上傳</span>
                    </div>
                  </div>
                </div>
                
                <div class="image-tips">
                  <Icon name="mdi:information-outline" class="tip-icon" />
                  <span>第一張圖片將作為主要圖片顯示。可拖曳調整順序，或使用上下箭頭按鈕。</span>
                </div>
              </div>
              
              <!-- 空狀態 -->
              <div v-else class="empty-state">
                <div class="empty-content" @click="triggerFileInput">
                  <Icon name="mdi:image-plus" class="empty-icon" />
                  <h3>尚未添加圖片</h3>
                  <p>點擊上傳圖片或輸入圖片網址</p>
                </div>
              </div>
              
              <!-- 隱藏的檔案輸入框 -->
              <input 
                ref="fileInputRef"
                type="file" 
                @change="handleFileUpload" 
                accept="image/*" 
                multiple 
                :disabled="saving"
                style="display: none;"
              />
            </div>

            <div class="form-group">
              <label class="form-label">民宿介紹</label>
              <textarea
                v-model="editData.capacity_description"
                class="form-textarea"
                :disabled="saving"
                rows="3"
                placeholder="請描述您的民宿特色、環境介紹、設施等..."
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
            


            <!-- 主題特色 -->
            <div class="form-group">
              <label class="form-label">🏠 主題特色</label>
              <div class="checkbox-group">
                <label v-for="feature in themeFeatures" :key="feature" class="checkbox-item">
                  <input
                    v-model="editData.theme_features"
                    type="checkbox"
                    :value="feature"
                    :disabled="saving"
                  />
                  <span class="checkbox-label">{{ feature }}</span>
                </label>
              </div>
            </div>



            <!-- 服務內容 -->
            <div class="form-group">
              <label class="form-label">🎯 服務內容</label>
              <div class="checkbox-group">
                <label v-for="service in serviceAmenities" :key="service" class="checkbox-item">
                  <input
                    v-model="editData.service_amenities"
                    type="checkbox"
                    :value="service"
                    :disabled="saving"
                  />
                  <span class="checkbox-label">{{ service }}</span>
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
const newImageUrl = ref(''); // 新增圖片URL輸入
const fileInputRef = ref(null); // 檔案輸入框引用
const editData = ref({
  name: '',
  location: '',
  city: '',
  phone: '',
  website: '',
  social: {
    line: '',
    instagram: '',
    facebook: ''
  },
  image_url: '',
  images: [], // 新增 images 陣列
  capacity_description: '',
  min_guests: null,
  max_guests: null,
  available: true,

  theme_features: [],
  service_amenities: [],
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
    return editData.value.images || [];
  },
  set: (newArray) => {
    editData.value.images = newArray;
  }
});

const message = ref({
  text: '',
  type: ''
});

// 觸發檔案選擇
const triggerFileInput = () => {
  if (!saving.value && fileInputRef.value) {
    fileInputRef.value.click();
  }
};

// 處理檔案上傳
const handleFileUpload = async (event) => {
  const files = event.target.files;
  if (!files.length) return;

  saving.value = true;
  showMessage('正在上傳圖片...', 'info');

  try {
    for (let file of files) {
      console.log('開始上傳文件:', file.name);
      
      // 驗證文件類型
      const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
      if (!allowedTypes.includes(file.type)) {
        throw new Error(`檔案 ${file.name} 格式不支援，只允許 JPEG、PNG 和 GIF 格式`);
      }

      // 驗證文件大小 (5MB)
      const maxSize = 5 * 1024 * 1024;
      if (file.size > maxSize) {
        throw new Error(`檔案 ${file.name} 太大，最大允許 5MB`);
      }

      // 創建 FormData
      const formData = new FormData();
      formData.append('file', file);

      // 首先嘗試 GitHub 上傳，如果失敗則使用本地上傳
      let response;
      try {
        response = await fetch('/api/upload', {
          method: 'POST',
          body: formData
        });
      } catch (error) {
        console.warn('GitHub 上傳失敗，嘗試本地上傳:', error);
        // 使用本地上傳作為備用
        response = await fetch('/api/upload-local', {
          method: 'POST',
          body: formData
        });
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || `上傳 ${file.name} 失敗`);
      }

      console.log('上傳成功:', data.url);
      
      // 添加到圖片陣列
      const currentImages = imagesArray.value;
      currentImages.push(data.url);
      imagesArray.value = currentImages;
    }

    showMessage(`成功上傳 ${files.length} 張圖片！`, 'success');

  } catch (error) {
    console.error('上傳錯誤:', error);
    showMessage(`上傳失敗：${error.message}`, 'error');
  } finally {
    saving.value = false;
    // 清空檔案輸入
    if (event.target) {
      event.target.value = '';
    }
  }
};

// 添加手動輸入的圖片URL
const addImageUrl = () => {
  if (newImageUrl.value.trim()) {
    try {
      new URL(newImageUrl.value);
      const currentImages = imagesArray.value;
      currentImages.push(newImageUrl.value.trim());
      imagesArray.value = currentImages;
      newImageUrl.value = '';
      showMessage('圖片已添加', 'success');
    } catch (e) {
      showMessage('請輸入有效的圖片 URL', 'error');
    }
  }
};

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


// 主題特色選項
const themeFeatures = [
  '包棟民宿',
  '電梯/一樓孝親房民宿',
  '獨棟、莊園民宿',
  '親子民宿',
  '寵物民宿',
  '海景民宿',
  '市區民宿',
  '夜市民宿',
  '車站周邊住宿'
];



// 服務內容選項
const serviceAmenities = [
  '美味早餐', '方便停車', '有停車位(場)', '可停遊覽車',
  '有陽台房型', '有浴缸房型', '有公用客廳', '一樓孝親房',
  '戶外戲水池', '有烤肉場地', '歡唱設備', '可借用廚房',
  '可打麻將', '可帶寵物入住', '可刷國旅卡', '電動麻將桌', '充電樁'
];

// 檢查登入狀態
const checkAuth = async () => {
  try {
    const response = await $fetch('/api/homestay-auth');
    
    if (response.success && response.homestay) {
      homestay.value = response.homestay;
      
      // 直接從 auth API 回應設定編輯資料
      setupEditDataFromAuth(response.homestay);
    } else {
      console.error('身份驗證失敗或無民宿資料');
      await navigateTo('/homestay-login');
    }
  } catch (error) {
    console.error('身份驗證失敗:', error);
    await navigateTo('/homestay-login');
  } finally {
    loading.value = false;
  }
};

// 從身份驗證回應直接設定編輯資料
const setupEditDataFromAuth = (homestayData) => {
  try {
    // 處理圖片資料
    let images = [];
    if (homestayData.images && Array.isArray(homestayData.images) && homestayData.images.length > 0) {
      images = homestayData.images.filter(url => url && url.trim());
    } else if (homestayData.image_url) {
      images = [homestayData.image_url];
    }
      
      // 設定編輯資料
      editData.value = {
      name: homestayData.name || '',
      location: homestayData.location || '',
      city: homestayData.city || '',
      phone: homestayData.phone || '',
      website: homestayData.website || '',
      social: {
        line: homestayData.social_line || '',
        instagram: homestayData.social_instagram || '',
        facebook: homestayData.social_facebook || ''
      },
      image_url: images[0] || '',
      images: images,
      capacity_description: homestayData.capacity_description || '',
      min_guests: homestayData.min_guests || null,
      max_guests: homestayData.max_guests || null,
      available: homestayData.available || true,
  
      theme_features: homestayData.theme_features || [],
      service_amenities: homestayData.service_amenities || [],
        pricing: {
        weekdayRoom: null,
        weekendRoom: null,
        weekdayPackage: null,
        weekendPackage: null
        }
      };
      
      // 保存原始資料
      originalData.value = JSON.parse(JSON.stringify(editData.value));
    
  } catch (error) {
    console.error('設定編輯資料失敗:', error);
    showMessage(`設定資料失敗: ${error.message}`, 'error');
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
    newImageUrl.value = ''; // 重置新圖片URL輸入
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
  
  .header-right {
    display: flex;
    align-items: center;
    gap: 12px;
  }
  
  .back-to-list-btn {
    display: flex;
    align-items: center;
    gap: 6px;
    background: #667eea;
    color: white;
    border: none;
    padding: 8px 16px;
    border-radius: 6px;
    text-decoration: none;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.3s ease;
    
    &:hover {
      background: #5a67d8;
      transform: translateY(-1px);
    }
    
    svg {
      transition: transform 0.3s ease;
    }
    
    &:hover svg {
      transform: translateX(-2px);
    }
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
  
  .header-right {
    flex-direction: column;
    gap: 8px;
    width: 100%;
  }
  
  .back-to-list-btn, .logout-btn {
    width: 100%;
    justify-content: center;
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

// 新增上傳相關樣式
.upload-section, .url-input-section, .batch-input-section {
  margin-bottom: 20px;
  padding: 16px;
  background: #f8fafc;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
}

.upload-label {
  display: block;
  margin-bottom: 8px;
  color: #2d3748;
  font-weight: 600;
  font-size: 14px;
}

.file-input {
  width: 100%;
  padding: 12px;
  border: 2px dashed #cbd5e0;
  border-radius: 8px;
  background: white;
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 14px;
  color: #4a5568;
  
  &:hover:not(:disabled) {
    border-color: #667eea;
    background: #f0f4ff;
  }
  
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
}

.url-input-group {
  display: flex;
  gap: 12px;
  align-items: center;
  
  .form-input {
    flex: 1;
    margin-bottom: 0;
  }
}

.add-url-btn {
  padding: 12px 20px;
  background: #667eea;
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  white-space: nowrap;
  
  &:hover:not(:disabled) {
    background: #5a67d8;
    transform: translateY(-1px);
  }
  
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
}

.preview-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.preview-stats {
  font-size: 14px;
  color: #718096;
  background: #edf2f7;
  padding: 4px 12px;
  border-radius: 12px;
  font-weight: 500;
}

.add-image-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 140px;
  border: 2px dashed #cbd5e0;
  border-radius: 12px;
  background: #f7fafc;
  cursor: pointer;
  transition: all 0.3s ease;
  
  &:hover {
    border-color: #667eea;
    background: #f0f4ff;
    transform: translateY(-2px);
  }
}

.placeholder-content {
  text-align: center;
  color: #718096;
  
  .placeholder-icon {
    font-size: 24px;
    margin-bottom: 8px;
    display: block;
  }
  
  span {
    font-size: 14px;
    font-weight: 500;
  }
}

.empty-state {
  text-align: center;
  padding: 40px 20px;
  border: 2px dashed #cbd5e0;
  border-radius: 12px;
  background: #f7fafc;
  cursor: pointer;
  transition: all 0.3s ease;
  
  &:hover {
    border-color: #667eea;
    background: #f0f4ff;
  }
}

.empty-content {
  .empty-icon {
    font-size: 48px;
    color: #cbd5e0;
    margin-bottom: 16px;
  }
  
  h3 {
    font-size: 18px;
    color: #4a5568;
    margin-bottom: 8px;
    font-weight: 600;
  }
  
  p {
    color: #718096;
    font-size: 14px;
  }
}

.image-tips {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 12px;
  padding: 12px;
  background: #ebf8ff;
  border-radius: 8px;
  border-left: 4px solid #3182ce;
  font-size: 14px;
  color: #2c5282;
  
  .tip-icon {
    flex-shrink: 0;
    font-size: 16px;
  }
}
</style> 