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
              <label class="form-label">民宿圖片網址</label>
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

            <!-- 環境類型 -->
            <div class="form-group">
              <label class="form-label">環境特色</label>
              <div class="checkbox-group">
                <label v-for="type in availableTypes" :key="type" class="checkbox-item">
                  <input
                    type="checkbox"
                    :value="type"
                    v-model="formData.types"
                    :disabled="submitting"
                  />
                  <span class="checkbox-text">{{ type }}</span>
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
          <p>我們已收到您的民宿註冊申請，管理員將在 1-3 個工作天內完成審核。</p>
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
import { ref, computed } from 'vue';
import { township } from '~/utils/category.js';

// SEO 設定
useHead({
  title: '民宿註冊申請 - 加入我們的民宿平台',
  meta: [
    { name: 'description', content: '註冊您的民宿，加入我們的優質住宿平台，讓更多旅客發現您的特色住宿。' },
    { name: 'keywords', content: '民宿註冊, 民宿申請, 加入平台, 住宿業者' }
  ]
});

// 表單狀態
const currentStep = ref(1);
const submitting = ref(false);
const showSuccess = ref(false);
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
  capacity_description: '',
  min_guests: null,
  max_guests: null,
  types: [],
  
  // 步驟 3: 聯絡資訊
  phone: '',
  website: '',
  pricing: {
    weekdayRoom: null,
    weekendRoom: null,
    weekdayPackage: null,
    weekendPackage: null
  },
  agreeTerms: false
});

// 可選擇的環境類型
const availableTypes = [
  '自然景觀型',
  '都市便利型',
  '秘境隱居型'
];

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

// 重置表單
const resetForm = () => {
  currentStep.value = 1;
  showSuccess.value = false;
  errorMessage.value = '';
  
  formData.value = {
    account: '',
    password: '',
    confirmPassword: '',
    email: '',
    name: '',
    location: '',
    city: '',
    image_url: '',
    capacity_description: '',
    min_guests: null,
    max_guests: null,
    types: [],
    phone: '',
    website: '',
    pricing: {
      weekdayRoom: null,
      weekendRoom: null,
      weekdayPackage: null,
      weekendPackage: null
    },
    agreeTerms: false
  };
};
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
</style> 