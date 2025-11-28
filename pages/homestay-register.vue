<template>
  <div class="register-page">
    <div class="register-header">
      <h1>🏠 民宿註冊申請</h1>
      <p class="subtitle">加入我們的民宿平台，讓更多旅客發現您的優質住宿</p>
    </div>

    <div class="register-container">
      <div class="register-card">
        <!-- 進度指示器 -->
        <div class="progress-steps">
          <div class="step" :class="{ active: currentStep >= 1, completed: currentStep > 1 }">
            <div class="step-number">1</div>
            <div class="step-title">基本帳號</div>
          </div>
          <div class="step" :class="{ active: currentStep >= 2, completed: currentStep > 2 }">
            <div class="step-number">2</div>
            <div class="step-title">民宿資訊</div>
          </div>
          <div class="step" :class="{ active: currentStep >= 3 }">
            <div class="step-number">3</div>
            <div class="step-title">聯絡資訊</div>
          </div>
        </div>

        <form @submit.prevent="handleSubmit" class="register-form">
          <!-- 步驟 1: 基本帳號 -->
          <div v-if="currentStep === 1" class="form-step">
            <h3 class="step-header">🔐 設定帳號資訊</h3>
            
            <div class="form-group">
              <label class="form-label required">民宿編號（帳號）</label>
              <input
                v-model="formData.account"
                type="text"
                class="form-input"
                placeholder="請輸入您的民宿編號，例如：2591"
                required
                :disabled="submitting"
                pattern="[0-9]+"
                title="只能輸入數字"
              />
              <div class="input-hint">
                此編號將作為您的登入帳號，請確保準確無誤
              </div>
            </div>

            <div class="form-group">
              <label class="form-label required">登入密碼</label>
              <input
                v-model="formData.password"
                type="password"
                class="form-input"
                placeholder="請設定您的登入密碼"
                required
                :disabled="submitting"
                minlength="6"
              />
              <div class="input-hint">
                密碼至少6個字元，建議包含英文和數字
              </div>
            </div>

            <div class="form-group">
              <label class="form-label required">確認密碼</label>
              <input
                v-model="formData.confirmPassword"
                type="password"
                class="form-input"
                placeholder="請再次輸入密碼"
                required
                :disabled="submitting"
              />
              <div v-if="formData.password && formData.confirmPassword && formData.password !== formData.confirmPassword" class="error-hint">
                密碼不一致，請重新確認
              </div>
            </div>

            <div class="form-group">
              <label class="form-label required">電子信箱</label>
              <input
                v-model="formData.email"
                type="email"
                class="form-input"
                placeholder="example@email.com"
                required
                :disabled="submitting"
              />
              <div class="input-hint">
                用於接收審核結果和重要通知
              </div>
            </div>
          </div>

          <!-- 步驟 2: 民宿資訊 -->
          <div v-if="currentStep === 2" class="form-step">
            <h3 class="step-header">🏠 民宿基本資訊</h3>
            
            <div class="form-group">
              <label class="form-label required">民宿名稱</label>
              <input
                v-model="formData.name"
                type="text"
                class="form-input"
                placeholder="請輸入民宿名稱"
                required
                :disabled="submitting"
              />
            </div>

            <div class="form-row">
              <div class="form-group">
                <label class="form-label required">所在鄉鎮市</label>
                <select
                  v-model="formData.location"
                  class="form-select"
                  required
                  :disabled="submitting"
                >
                  <option value="">請選擇鄉鎮市</option>
                  <option v-for="township in townships" :key="township.zipcode" :value="township.name">
                    {{ township.name }}
                  </option>
                </select>
              </div>
              
              <div class="form-group">
                <label class="form-label required">詳細地址</label>
                <input
                  v-model="formData.city"
                  type="text"
                  class="form-input"
                  placeholder="請輸入詳細地址"
                  required
                  :disabled="submitting"
                />
              </div>
            </div>

            <div class="form-group">
              <label class="form-label">民宿圖片</label>
              
              <!-- 手動輸入圖片 URL -->
              <div class="input-group">
                <input
                  v-model="coverUrl"
                  type="url"
                  class="form-input"
                  placeholder="請輸入圖片 URL"
                  :disabled="submitting"
                  @keyup.enter="addCoverUrl"
                />
                <button 
                  @click.prevent="addCoverUrl" 
                  class="add-url-btn"
                  :disabled="!coverUrl || submitting"
                >
                  添加圖片 URL
                </button>
              </div>
              
              <!-- 檔案上傳 -->
              <div class="file-upload-section">
                <input 
                  type="file" 
                  @change="handleFileUpload" 
                  accept="image/*" 
                  multiple 
                  :disabled="submitting"
                  class="file-input"
                />
                <div class="upload-hint">支援 JPG、PNG、GIF 格式，單檔最大 5MB</div>
              </div>
              
              <!-- 圖片預覽 -->
              <div v-if="formData.images && formData.images.length > 0" class="image-gallery">
                <div v-for="(url, index) in formData.images" :key="index" class="image-item">
                  <img :src="url" :alt="'民宿圖片 ' + (index + 1)" class="preview-image" />
                  <button 
                    @click.prevent="removeImage(index)" 
                    class="remove-btn"
                    :disabled="submitting"
                  >
                    ×
                  </button>
                </div>
              </div>
            </div>

            <!-- 保留原有的單一圖片URL欄位作為向後相容 -->
            <div class="form-group" v-if="!formData.images || formData.images.length === 0">
              <label class="form-label">主要圖片網址 (選填)</label>
              <input
                v-model="formData.image_url"
                type="url"
                class="form-input"
                placeholder="https://example.com/image.jpg"
                :disabled="submitting"
              />
              <div v-if="formData.image_url" class="image-preview">
                <img :src="formData.image_url" :alt="formData.name" />
              </div>
            </div>

            <div class="form-group">
              <label class="form-label">民宿介紹</label>
              <textarea
                v-model="formData.capacity_description"
                class="form-textarea"
                placeholder="請描述您的民宿特色、設施、環境等..."
                :disabled="submitting"
                rows="4"
              ></textarea>
            </div>

            <!-- 人數設定 -->
            <div class="form-row">
              <div class="form-group">
                <label class="form-label">最少入住人數</label>
                <div class="number-input-group">
                  <input
                    v-model.number="formData.min_guests"
                    type="number"
                    class="form-input"
                    :disabled="submitting"
                    min="1"
                    max="50"
                    placeholder="例如: 2"
                  />
                  <span class="input-suffix">人</span>
                </div>
              </div>
              
              <div class="form-group">
                <label class="form-label">最多入住人數</label>
                <div class="number-input-group">
                  <input
                    v-model.number="formData.max_guests"
                    type="number"
                    class="form-input"
                    :disabled="submitting"
                    min="1"
                    max="50"
                    placeholder="例如: 8"
                  />
                  <span class="input-suffix">人</span>
                </div>
              </div>
            </div>



            <!-- 主題特色 -->
            <div class="form-group">
              <label class="form-label">🏠 主題特色（可多選）</label>
              <div v-if="featuresLoading" class="loading-hint">
                載入特色選項中...
              </div>
              <div v-else class="checkbox-group">
                <label v-for="feature in themeFeatures" :key="feature" class="checkbox-item">
                  <input
                    type="checkbox"
                    :value="feature"
                    v-model="formData.theme_features"
                    :disabled="submitting"
                  />
                  <span class="checkbox-text">{{ feature }}</span>
                </label>
              </div>
            </div>



            <!-- 服務內容 -->
            <div class="form-group">
              <label class="form-label">🎯 服務內容（可多選）</label>
              <div v-if="featuresLoading" class="loading-hint">
                載入服務選項中...
              </div>
              <div v-else class="checkbox-group">
                <label v-for="service in serviceAmenities" :key="service" class="checkbox-item">
                  <input
                    type="checkbox"
                    :value="service"
                    v-model="formData.service_amenities"
                    :disabled="submitting"
                  />
                  <span class="checkbox-text">{{ service }}</span>
                </label>
              </div>
            </div>
          </div>

          <!-- 步驟 3: 聯絡資訊 -->
          <div v-if="currentStep === 3" class="form-step">
            <h3 class="step-header">📞 聯絡與價格資訊</h3>
            
            <div class="form-row">
              <div class="form-group">
                <label class="form-label">聯絡電話</label>
                <input
                  v-model="formData.phone"
                  type="tel"
                  class="form-input"
                  placeholder="請輸入聯絡電話"
                  :disabled="submitting"
                />
              </div>
              
              <div class="form-group">
                <label class="form-label">官方網站</label>
                <input
                  v-model="formData.website"
                  type="url"
                  class="form-input"
                  placeholder="https://your-website.com"
                  :disabled="submitting"
                />
              </div>
            </div>

            <!-- 社群媒體資訊 -->
            <h4 class="subsection-title">📱 社群媒體（選填）</h4>
            <div class="form-row">
              <div class="form-group">
                <label class="form-label">LINE 連結</label>
                <input
                  v-model="formData.social.line"
                  type="url"
                  class="form-input"
                  placeholder="https://line.me/ti/p/YOUR_LINE_ID"
                  :disabled="submitting"
                />
                <div class="input-hint">
                  請提供 LINE 官方帳號或個人 LINE 連結
                </div>
              </div>
              
              <div class="form-group">
                <label class="form-label">Instagram</label>
                <input
                  v-model="formData.social.instagram"
                  type="url"
                  class="form-input"
                  placeholder="https://instagram.com/YOUR_ACCOUNT"
                  :disabled="submitting"
                />
                <div class="input-hint">
                  請提供 Instagram 帳號連結
                </div>
              </div>
            </div>

            <div class="form-group">
              <label class="form-label">Facebook</label>
              <input
                v-model="formData.social.facebook"
                type="url"
                class="form-input"
                placeholder="https://facebook.com/YOUR_PAGE"
                :disabled="submitting"
              />
              <div class="input-hint">
                請提供 Facebook 粉絲專頁或個人頁面連結
              </div>
            </div>

            <!-- 價格設定 -->
            <h4 class="subsection-title">💰 價格設定（選填）</h4>
            <div class="form-row">
              <div class="form-group">
                <label class="form-label">平日住宿</label>
                <div class="price-input-group">
                  <span class="currency-prefix">NT$</span>
                  <input
                    v-model.number="formData.pricing.weekdayRoom"
                    type="number"
                    class="form-input"
                    placeholder="2000"
                    :disabled="submitting"
                    min="0"
                  />
                  <span class="input-suffix">起</span>
                </div>
              </div>
              
              <div class="form-group">
                <label class="form-label">假日住宿</label>
                <div class="price-input-group">
                  <span class="currency-prefix">NT$</span>
                  <input
                    v-model.number="formData.pricing.weekendRoom"
                    type="number"
                    class="form-input"
                    placeholder="2500"
                    :disabled="submitting"
                    min="0"
                  />
                  <span class="input-suffix">起</span>
                </div>
              </div>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label class="form-label">平日包棟</label>
                <div class="price-input-group">
                  <span class="currency-prefix">NT$</span>
                  <input
                    v-model.number="formData.pricing.weekdayPackage"
                    type="number"
                    class="form-input"
                    placeholder="8000"
                    :disabled="submitting"
                    min="0"
                  />
                  <span class="input-suffix">起</span>
                </div>
              </div>
              
              <div class="form-group">
                <label class="form-label">假日包棟</label>
                <div class="price-input-group">
                  <span class="currency-prefix">NT$</span>
                  <input
                    v-model.number="formData.pricing.weekendPackage"
                    type="number"
                    class="form-input"
                    placeholder="10000"
                    :disabled="submitting"
                    min="0"
                  />
                  <span class="input-suffix">起</span>
                </div>
              </div>
            </div>

            <!-- 同意條款 -->
            <div class="form-group">
              <label class="checkbox-item agreement">
                <input
                  type="checkbox"
                  v-model="formData.agreeTerms"
                  required
                  :disabled="submitting"
                />
                <span class="checkbox-text">
                  我已閱讀並同意服務條款和隱私政策，提供真實準確的民宿資訊
                </span>
              </label>
            </div>
          </div>

          <!-- 表單按鈕 -->
          <div class="form-actions">
            <button
              v-if="currentStep > 1"
              type="button"
              @click="currentStep--"
              class="prev-btn"
              :disabled="submitting"
            >
              上一步
            </button>
            
            <button
              v-if="currentStep < 3"
              type="button"
              @click="nextStep"
              class="next-btn"
              :disabled="!canNextStep"
            >
              下一步
            </button>
            
            <button
              v-if="currentStep === 3"
              type="submit"
              class="submit-btn"
              :disabled="!canSubmit || submitting"
            >
              {{ submitting ? '申請中...' : '提交申請' }}
            </button>
          </div>
        </form>

        <!-- 成功訊息 -->
        <div v-if="showSuccess" class="success-message">
          <div class="success-icon">✅</div>
          <h3>申請已成功提交！</h3>
          <p>{{ successMessage || '我們已收到您的民宿註冊申請，管理員將在 1-3 個工作天內完成審核。' }}</p>
          <p>審核結果將發送至您的信箱：<strong>{{ formData.email }}</strong></p>
          <div class="success-actions">
            <button @click="resetForm" class="btn-primary">申請其他民宿</button>
            <nuxt-link to="/homestay-list" class="btn-secondary">瀏覽民宿列表</nuxt-link>
          </div>
        </div>

        <!-- 錯誤訊息 -->
        <div v-if="errorMessage" class="error-message">
          <div class="error-icon">❌</div>
          <h3>申請失敗</h3>
          <p>{{ errorMessage }}</p>
          <button @click="errorMessage = ''" class="btn-secondary">重試</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { township } from '~/utils/category.js';

// SEO 設定
useSeoMeta({
  title: '民宿註冊申請 - 宜蘭旅遊通',
  description: '註冊您的民宿，加入我們的優質住宿平台，讓更多旅客發現您的特色住宿。',
  keywords: '民宿註冊, 民宿申請, 加入平台, 住宿業者',
  canonical: 'https://yilanpass.com/homestay-register'
})

useHead({
  link: [
    {
      rel: 'canonical',
      href: 'https://yilanpass.com/homestay-register'
    }
  ]
});

// 表單狀態
const currentStep = ref(1);
const submitting = ref(false);
const showSuccess = ref(false);
const successMessage = ref('');
const errorMessage = ref('');

// 表單資料
const formData = ref({
  // 步驟 1: 帳號資訊
  account: '',
  password: '',
  confirmPassword: '',
  email: '',
  
  // 步驟 2: 民宿資訊
  name: '',
  location: '',
  city: '',
  image_url: '',
  images: [], // 新增多圖片陣列
  capacity_description: '',
  min_guests: null,
  max_guests: null,
  types: [],
  theme_features: [],
  service_amenities: [],
  
  // 步驟 3: 聯絡資訊
  phone: '',
  website: '',
  social: {
    line: '',
    instagram: '',
    facebook: ''
  },
  pricing: {
    weekdayRoom: null,
    weekendRoom: null,
    weekdayPackage: null,
    weekendPackage: null
  },
  agreeTerms: false
});

// 圖片上傳相關
const coverUrl = ref('');



// 動態載入的特色選項
const themeFeatures = ref([]);
const serviceAmenities = ref([]);
const featuresLoading = ref(true);

// 鄉鎮市資料
const townships = township;

// 驗證邏輯
const canNextStep = computed(() => {
  if (currentStep.value === 1) {
    return formData.value.account && 
           formData.value.password && 
           formData.value.confirmPassword && 
           formData.value.email &&
           formData.value.password === formData.value.confirmPassword &&
           formData.value.password.length >= 6;
  }
  if (currentStep.value === 2) {
    return formData.value.name && formData.value.location && formData.value.city;
  }
  return true;
});

const canSubmit = computed(() => {
  return formData.value.agreeTerms && canNextStep.value;
});

// 下一步
const nextStep = () => {
  if (canNextStep.value && currentStep.value < 3) {
    currentStep.value++;
  }
};

// 處理檔案上傳
const handleFileUpload = async (event) => {
  const files = event.target.files;
  if (!files.length) return;

  for (let file of files) {
    try {
      console.log('開始上傳文件:', file.name);
      
      // 驗證文件類型
      const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
      if (!allowedTypes.includes(file.type)) {
        throw new Error('只允許上傳 JPEG、PNG 和 GIF 格式的圖片');
      }

      // 驗證文件大小 (5MB)
      const maxSize = 5 * 1024 * 1024;
      if (file.size > maxSize) {
        throw new Error('文件太大，最大允許 5MB');
      }

      // 創建 FormData
      const uploadFormData = new FormData();
      uploadFormData.append('file', file);

      // 上傳到後端 API
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: uploadFormData
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || '上傳失敗');
      }

      console.log('上傳成功:', data.url);
      
      // 添加到 formData.images 陣列
      if (!formData.value.images) formData.value.images = [];
      formData.value.images.push(data.url);

    } catch (error) {
      console.error('上傳錯誤:', error);
      alert(`上傳失敗：${error.message}`);
    }
  }
};

// 添加手動輸入的圖片URL
const addCoverUrl = () => {
  if (coverUrl.value.trim()) {
    try {
      new URL(coverUrl.value);
      if (!formData.value.images) {
        formData.value.images = [];
      }
      formData.value.images.push(coverUrl.value.trim());
      coverUrl.value = '';
    } catch (e) {
      alert('請輸入有效的圖片 URL');
    }
  }
};

// 移除圖片
const removeImage = (index) => {
  if (formData.value.images && formData.value.images.length > index) {
    formData.value.images.splice(index, 1);
  }
};

// 提交表單
const handleSubmit = async () => {
  if (!canSubmit.value) return;
  
  submitting.value = true;
  errorMessage.value = '';
  
  try {
    const response = await $fetch('/api/homestay-register', {
      method: 'POST',
      body: formData.value
    });
    
    if (response.success) {
      successMessage.value = response.message || '我們已收到您的民宿註冊申請，管理員將在 1-3 個工作天內完成審核。';
      showSuccess.value = true;
    } else {
      errorMessage.value = response.message || '申請失敗，請重試';
    }
  } catch (error) {
    console.error('註冊錯誤:', error);
    errorMessage.value = error.data?.message || '系統錯誤，請稍後重試';
  } finally {
    submitting.value = false;
  }
};

// 載入特色選項
const loadFeatureOptions = async () => {
  try {
    featuresLoading.value = true;
    const response = await $fetch('/api/features-options');
    
    if (response.success) {
      themeFeatures.value = response.data.themeFeatures || [];
      serviceAmenities.value = response.data.serviceAmenities || [];
      console.log('特色選項載入成功:', {
        themeFeatures: themeFeatures.value.length,
        serviceAmenities: serviceAmenities.value.length
      });
    } else {
      console.error('載入特色選項失敗:', response.error);
      // 使用備用選項
      setFallbackOptions();
    }
  } catch (error) {
    console.error('載入特色選項錯誤:', error);
    // 使用備用選項
    setFallbackOptions();
  } finally {
    featuresLoading.value = false;
  }
};

// 設置備用選項
const setFallbackOptions = () => {
  themeFeatures.value = [
    '包棟民宿', '電梯/一樓孝親房民宿', '獨棟、莊園民宿', '親子民宿',
    '寵物民宿', '海景民宿', '市區民宿', '夜市民宿', '車站周邊住宿'
  ];
  serviceAmenities.value = [
    '美味早餐', '方便停車', '有停車位(場)', '可停遊覽車',
    '有陽台房型', '有浴缸房型', '有公用客廳', '一樓孝親房',
    '戶外戲水池', '有烤肉場地', '歌唱設備', '可借用廚房',
    '可打麻將', '可帶寵物入住', '可刷國旅卡', '電動麻將桌', '充電樁'
  ];
};

// 重置表單
const resetForm = () => {
  currentStep.value = 1;
  showSuccess.value = false;
  successMessage.value = '';
  errorMessage.value = '';
  coverUrl.value = '';
  
  formData.value = {
    account: '',
    password: '',
    confirmPassword: '',
    email: '',
    name: '',
    location: '',
    city: '',
    image_url: '',
    images: [], // 重置圖片陣列
    capacity_description: '',
    min_guests: null,
    max_guests: null,

    theme_features: [],
    service_amenities: [],
    phone: '',
    website: '',
    social: {
      line: '',
      instagram: '',
      facebook: ''
    },
    pricing: {
      weekdayRoom: null,
      weekendRoom: null,
      weekdayPackage: null,
      weekendPackage: null
    },
    agreeTerms: false
  };
  
  // 重新載入特色選項
  loadFeatureOptions();
};

// 頁面載入時初始化
onMounted(() => {
  loadFeatureOptions();
});
</script>

<style scoped lang="scss">
.register-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 20px;
}

.register-header {
  text-align: center;
  margin-bottom: 30px;
  color: white;
  
  h1 {
    font-size: 2.5rem;
    margin-bottom: 10px;
    font-weight: 700;
  }
  
  .subtitle {
    font-size: 1.1rem;
    opacity: 0.9;
    max-width: 600px;
    margin: 0 auto;
  }
}

.register-container {
  max-width: 800px;
  margin: 0 auto;
}

.register-card {
  background: white;
  border-radius: 20px;
  padding: 40px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.1);
  position: relative;
}

// 進度指示器
.progress-steps {
  display: flex;
  justify-content: center;
  margin-bottom: 40px;
  position: relative;
  
  &::before {
    content: '';
    position: absolute;
    top: 20px;
    left: 25%;
    right: 25%;
    height: 2px;
    background: #e1e5e9;
    z-index: 1;
  }
  
  .step {
    display: flex;
    flex-direction: column;
    align-items: center;
    flex: 1;
    position: relative;
    z-index: 2;
    
    .step-number {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      background: #e1e5e9;
      color: #6c757d;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 600;
      margin-bottom: 8px;
      transition: all 0.3s ease;
    }
    
    .step-title {
      font-size: 0.9rem;
      color: #6c757d;
      text-align: center;
    }
    
    &.active .step-number {
      background: #667eea;
      color: white;
    }
    
    &.completed .step-number {
      background: #28a745;
      color: white;
    }
    
    &.active .step-title,
    &.completed .step-title {
      color: #333;
      font-weight: 600;
    }
  }
}

// 表單樣式
.form-step {
  min-height: 400px;
}

.step-header {
  font-size: 1.4rem;
  color: #333;
  margin-bottom: 25px;
  font-weight: 600;
}

.subsection-title {
  font-size: 1.1rem;
  color: #666;
  margin: 25px 0 15px 0;
  font-weight: 600;
}

.form-group {
  margin-bottom: 20px;
}

.form-label {
  display: block;
  margin-bottom: 8px;
  font-weight: 600;
  color: #333;
  
  &.required::after {
    content: ' *';
    color: #dc3545;
  }
}

.form-input, .form-select, .form-textarea {
  width: 100%;
  padding: 12px 16px;
  border: 2px solid #e1e5e9;
  border-radius: 10px;
  font-size: 1rem;
  transition: all 0.3s ease;
  
  &:focus {
    outline: none;
    border-color: #667eea;
    box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
  }
  
  &:disabled {
    background-color: #f8f9fa;
    cursor: not-allowed;
  }
}

.form-textarea {
  resize: vertical;
  min-height: 100px;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
}

// 輸入組件樣式
.number-input-group, .price-input-group {
  position: relative;
  display: flex;
  align-items: center;
  
  .form-input {
    padding-right: 50px;
  }
  
  .input-suffix {
    position: absolute;
    right: 16px;
    color: #6c757d;
    font-weight: 500;
    pointer-events: none;
  }
  
  .currency-prefix {
    position: absolute;
    left: 16px;
    color: #6c757d;
    font-weight: 500;
    pointer-events: none;
    z-index: 1;
  }
}

.price-input-group .form-input {
  padding-left: 50px;
}

// 提示文字
.input-hint {
  font-size: 0.875rem;
  color: #6c757d;
  margin-top: 5px;
}

.error-hint {
  font-size: 0.875rem;
  color: #dc3545;
  margin-top: 5px;
}

// 圖片預覽
.image-preview {
  margin-top: 10px;
  
  img {
    max-width: 200px;
    max-height: 150px;
    border-radius: 8px;
    object-fit: cover;
    border: 2px solid #e1e5e9;
  }
}

// 複選框組
.checkbox-group {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 10px;
  margin-top: 10px;
}

.checkbox-item {
  display: flex;
  align-items: center;
  cursor: pointer;
  
  input[type="checkbox"] {
    width: 18px;
    height: 18px;
    margin-right: 8px;
    accent-color: #667eea;
  }
  
  .checkbox-text {
    font-size: 0.95rem;
    color: #333;
  }
  
  &.agreement {
    margin-top: 20px;
    padding: 15px;
    background: #f8f9fa;
    border-radius: 8px;
    
    .checkbox-text {
      line-height: 1.5;
    }
  }
}

// 按鈕樣式
.form-actions {
  display: flex;
  gap: 15px;
  justify-content: flex-end;
  margin-top: 30px;
  padding-top: 20px;
  border-top: 1px solid #e1e5e9;
}

.prev-btn, .next-btn, .submit-btn {
  padding: 12px 30px;
  border: none;
  border-radius: 10px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
}

.prev-btn {
  background: #6c757d;
  color: white;
  
  &:hover:not(:disabled) {
    background: #5a6268;
  }
}

.next-btn, .submit-btn {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  
  &:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 10px 30px rgba(102, 126, 234, 0.3);
  }
}

// 訊息樣式
.success-message, .error-message {
  text-align: center;
  padding: 30px;
  margin-top: 20px;
  border-radius: 15px;
}

.success-message {
  background: linear-gradient(135deg, #d4edda 0%, #c3e6cb 100%);
  border: 1px solid #c3e6cb;
  
  .success-icon {
    font-size: 3rem;
    margin-bottom: 15px;
  }
  
  h3 {
    color: #155724;
    margin-bottom: 15px;
  }
  
  p {
    color: #155724;
    margin-bottom: 10px;
    line-height: 1.6;
  }
}

.error-message {
  background: linear-gradient(135deg, #f8d7da 0%, #f5c6cb 100%);
  border: 1px solid #f5c6cb;
  
  .error-icon {
    font-size: 3rem;
    margin-bottom: 15px;
  }
  
  h3 {
    color: #721c24;
    margin-bottom: 15px;
  }
  
  p {
    color: #721c24;
    margin-bottom: 15px;
  }
}

.success-actions {
  display: flex;
  gap: 15px;
  justify-content: center;
  margin-top: 20px;
}

.btn-primary, .btn-secondary {
  padding: 10px 20px;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  text-decoration: none;
  cursor: pointer;
  transition: all 0.3s ease;
  display: inline-block;
}

.btn-primary {
  background: #667eea;
  color: white;
  
  &:hover {
    background: #5a6fd8;
  }
}

.btn-secondary {
  background: #6c757d;
  color: white;
  
  &:hover {
    background: #5a6268;
  }
}

// 響應式設計
@media (max-width: 768px) {
  .register-header h1 {
    font-size: 2rem;
  }
  
  .register-card {
    padding: 25px;
  }
  
  .form-row {
    grid-template-columns: 1fr;
  }
  
  .form-actions {
    flex-direction: column;
  }
  
  .success-actions {
    flex-direction: column;
  }
  
  .progress-steps {
    .step-title {
      font-size: 0.8rem;
    }
  }
}

@media (max-width: 480px) {
  .register-page {
    padding: 10px;
  }
  
  .register-card {
    padding: 20px;
  }
  
  .checkbox-group {
    grid-template-columns: 1fr;
  }
}

// 載入中提示樣式
.loading-hint {
  padding: 20px;
  text-align: center;
  color: #6c757d;
  font-style: italic;
  background: #f8f9fa;
  border-radius: 8px;
  border: 1px dashed #dee2e6;
}

// 新增圖片上傳樣式
.input-group {
  display: flex;
  gap: 10px;
  margin-bottom: 15px;
  
  .form-input {
    flex: 1;
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
      background: #5a6fd8;
    }
    
    &:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }
  }
}

.file-upload-section {
  margin-bottom: 15px;
  
  .file-input {
    width: 100%;
    padding: 12px;
    border: 2px dashed #e1e5e9;
    border-radius: 8px;
    background: #f8f9fa;
    cursor: pointer;
    transition: all 0.3s ease;
    
    &:hover:not(:disabled) {
      border-color: #667eea;
      background: #f0f4ff;
    }
    
    &:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }
  }
  
  .upload-hint {
    font-size: 0.875rem;
    color: #6c757d;
    margin-top: 5px;
  }
}

.image-gallery {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 15px;
  margin-top: 15px;
  
  .image-item {
    position: relative;
    border-radius: 8px;
    overflow: hidden;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    
    .preview-image {
      width: 100%;
      height: 120px;
      object-fit: cover;
      display: block;
    }
    
    .remove-btn {
      position: absolute;
      top: 8px;
      right: 8px;
      width: 24px;
      height: 24px;
      background: rgba(220, 53, 69, 0.9);
      color: white;
      border: none;
      border-radius: 50%;
      cursor: pointer;
      font-size: 16px;
      line-height: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.3s ease;
      
      &:hover:not(:disabled) {
        background: #dc3545;
        transform: scale(1.1);
      }
      
      &:disabled {
        opacity: 0.6;
        cursor: not-allowed;
      }
    }
  }
}
</style> 