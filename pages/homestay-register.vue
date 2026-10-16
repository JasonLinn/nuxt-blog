<template>
  <div class="yp-page yp-page--form register-page">
    <nav class="yp-breadcrumb" aria-label="breadcrumb">
      <NuxtLink to="/">首頁</NuxtLink>
      <NuxtLink to="/homestay-list">民宿</NuxtLink>
      <span>註冊申請</span>
    </nav>

    <header class="yp-page-head">
      <div>
        <span class="yp-page-head__eyebrow">民宿業者</span>
        <h1 class="yp-page-head__title">民宿註冊申請</h1>
        <p class="yp-page-head__desc">加入我們的民宿平台，讓更多旅客發現您的優質住宿</p>
      </div>
    </header>

    <!-- 成功訊息 -->
    <div v-if="showSuccess" class="yp-form-section">
      <div class="yp-empty">
        <div class="yp-empty__icon register-success-icon">
          <Icon name="ri:checkbox-circle-line" />
        </div>
        <h2 class="yp-empty__title">申請已成功提交！</h2>
        <p class="yp-empty__text">
          {{ successMessage || '我們已收到您的民宿註冊申請，管理員將在 1-3 個工作天內完成審核。'
          }}<br />
          審核結果將發送至您的信箱：<strong>{{ formData.email }}</strong>
        </p>
        <div class="d-flex flex-column flex-sm-row justify-content-center gap-2">
          <button type="button" class="btn btn-primary" @click="resetForm">申請其他民宿</button>
          <NuxtLink to="/homestay-list" class="btn btn-outline-primary">瀏覽民宿列表</NuxtLink>
        </div>
      </div>
    </div>

    <SubmissionLoginGate
      v-else-if="loginRequired"
      :login-url="loginUrl"
      title="請先登入再申請民宿註冊"
    />
    <template v-else>
      <!-- 進度指示器 -->
      <ol class="register-steps" aria-label="申請步驟">
        <li
          class="register-step"
          :class="{ 'is-active': currentStep >= 1, 'is-done': currentStep > 1 }"
        >
          <span class="register-step__num">
            <Icon v-if="currentStep > 1" name="ri:check-line" />
            <template v-else>1</template>
          </span>
          <span class="register-step__title">基本帳號</span>
        </li>
        <li
          class="register-step"
          :class="{ 'is-active': currentStep >= 2, 'is-done': currentStep > 2 }"
        >
          <span class="register-step__num">
            <Icon v-if="currentStep > 2" name="ri:check-line" />
            <template v-else>2</template>
          </span>
          <span class="register-step__title">民宿資訊</span>
        </li>
        <li class="register-step" :class="{ 'is-active': currentStep >= 3 }">
          <span class="register-step__num">3</span>
          <span class="register-step__title">聯絡資訊</span>
        </li>
      </ol>

      <!-- 錯誤訊息 -->
      <div
        v-if="errorMessage"
        class="alert alert-danger d-flex align-items-start gap-2"
        role="alert"
      >
        <Icon name="ri:error-warning-line" class="mt-1 flex-shrink-0" />
        <div class="flex-grow-1">
          <strong class="d-block">申請失敗</strong>
          {{ errorMessage }}
        </div>
        <button type="button" class="btn btn-sm btn-outline-danger" @click="errorMessage = ''">
          重試
        </button>
      </div>

      <form class="register-form" @submit.prevent="handleSubmit">
        <!-- 步驟 1: 基本帳號 -->
        <section v-if="currentStep === 1" class="yp-form-section">
          <h2 class="yp-form-section__title">設定帳號資訊</h2>
          <p class="yp-form-section__desc">此帳號將用於登入民宿管理後台</p>

          <div class="mb-3">
            <label class="form-label required">民宿編號（帳號）</label>
            <input
              v-model="formData.account"
              type="text"
              class="form-control"
              placeholder="請輸入您的民宿編號，例如：2591"
              required
              :disabled="submitting"
              pattern="[0-9]+"
              title="只能輸入數字"
            />
            <div class="form-text">此編號將作為您的登入帳號，請確保準確無誤</div>
          </div>

          <div class="mb-3">
            <label class="form-label required">登入密碼</label>
            <input
              v-model="formData.password"
              type="password"
              class="form-control"
              placeholder="請設定您的登入密碼"
              required
              :disabled="submitting"
              minlength="6"
            />
            <div class="form-text">密碼至少6個字元，建議包含英文和數字</div>
          </div>

          <div class="mb-3">
            <label class="form-label required">確認密碼</label>
            <input
              v-model="formData.confirmPassword"
              type="password"
              class="form-control"
              :class="{ 'is-invalid': passwordMismatch }"
              placeholder="請再次輸入密碼"
              required
              :disabled="submitting"
            />
            <div v-if="passwordMismatch" class="invalid-feedback d-block">
              密碼不一致，請重新確認
            </div>
          </div>

          <div class="mb-0">
            <label class="form-label required">電子信箱</label>
            <input
              v-model="formData.email"
              type="email"
              class="form-control"
              placeholder="example@email.com"
              required
              :disabled="submitting"
            />
            <div class="form-text">用於接收審核結果和重要通知</div>
          </div>
        </section>

        <!-- 步驟 2: 民宿資訊 -->
        <template v-if="currentStep === 2">
          <section class="yp-form-section">
            <h2 class="yp-form-section__title">民宿基本資訊</h2>
            <p class="yp-form-section__desc">名稱與地址會顯示在民宿列表與詳情頁</p>

            <div class="mb-3">
              <label class="form-label required">民宿名稱</label>
              <input
                v-model="formData.name"
                type="text"
                class="form-control"
                placeholder="請輸入民宿名稱"
                required
                :disabled="submitting"
              />
            </div>

            <div class="row g-3 mb-3">
              <div class="col-12 col-md-5">
                <label class="form-label required">所在鄉鎮市</label>
                <select
                  v-model="formData.location"
                  class="form-select"
                  required
                  :disabled="submitting"
                >
                  <option value="">請選擇鄉鎮市</option>
                  <option
                    v-for="township in townships"
                    :key="township.zipcode"
                    :value="township.name"
                  >
                    {{ township.name }}
                  </option>
                </select>
              </div>

              <div class="col-12 col-md-7">
                <label class="form-label required">詳細地址</label>
                <input
                  v-model="formData.city"
                  type="text"
                  class="form-control"
                  placeholder="請輸入詳細地址"
                  required
                  :disabled="submitting"
                />
              </div>
            </div>

            <div class="mb-3">
              <label class="form-label">民宿介紹</label>
              <textarea
                v-model="formData.capacity_description"
                class="form-control"
                placeholder="請描述您的民宿特色、設施、環境等..."
                :disabled="submitting"
                rows="4"
              ></textarea>
            </div>

            <div class="row g-3">
              <div class="col-6">
                <label class="form-label">最少入住人數</label>
                <div class="input-group">
                  <input
                    v-model.number="formData.min_guests"
                    type="number"
                    class="form-control"
                    :disabled="submitting"
                    min="1"
                    max="50"
                    placeholder="例如: 2"
                  />
                  <span class="input-group-text">人</span>
                </div>
              </div>

              <div class="col-6">
                <label class="form-label">最多入住人數</label>
                <div class="input-group">
                  <input
                    v-model.number="formData.max_guests"
                    type="number"
                    class="form-control"
                    :disabled="submitting"
                    min="1"
                    max="50"
                    placeholder="例如: 8"
                  />
                  <span class="input-group-text">人</span>
                </div>
              </div>
            </div>
          </section>

          <section class="yp-form-section">
            <h2 class="yp-form-section__title">民宿圖片</h2>
            <p class="yp-form-section__desc">第一張圖片將作為主要圖片，可上傳檔案或貼上圖片網址</p>

            <!-- 檔案上傳 -->
            <label class="yp-upload d-block mb-3" :class="{ 'opacity-50': submitting }">
              <input
                type="file"
                class="visually-hidden"
                accept="image/*"
                multiple
                :disabled="submitting"
                @change="handleFileUpload"
              />
              <Icon name="ri:image-add-line" class="register-upload-icon" />
              <div class="fw-bold">點擊選擇圖片</div>
              <div class="small">支援 JPG、PNG、GIF 格式，單檔最大 5MB</div>
            </label>

            <!-- 手動輸入圖片 URL -->
            <div class="input-group">
              <input
                v-model="coverUrl"
                type="url"
                class="form-control"
                placeholder="或輸入圖片網址"
                :disabled="submitting"
                @keyup.enter="addCoverUrl"
              />
              <button
                type="button"
                class="btn btn-soft"
                :disabled="!coverUrl || submitting"
                @click.prevent="addCoverUrl"
              >
                添加圖片
              </button>
            </div>

            <!-- 圖片預覽 -->
            <div v-if="formData.images && formData.images.length > 0" class="register-gallery">
              <div
                v-for="(url, index) in formData.images"
                :key="index"
                class="register-gallery__item"
              >
                <img :src="url" :alt="'民宿圖片 ' + (index + 1)" />
                <span v-if="index === 0" class="register-gallery__badge">主要圖片</span>
                <button
                  type="button"
                  class="register-gallery__remove"
                  :disabled="submitting"
                  aria-label="移除圖片"
                  @click.prevent="removeImage(index)"
                >
                  <Icon name="ri:close-line" />
                </button>
              </div>
            </div>

            <!-- 保留原有的單一圖片URL欄位作為向後相容 -->
            <div v-if="!formData.images || formData.images.length === 0" class="mt-3">
              <label class="form-label">主要圖片網址（選填）</label>
              <input
                v-model="formData.image_url"
                type="url"
                class="form-control"
                placeholder="https://example.com/image.jpg"
                :disabled="submitting"
              />
              <div v-if="formData.image_url" class="register-preview">
                <img :src="formData.image_url" :alt="formData.name" />
              </div>
            </div>
          </section>

          <section class="yp-form-section">
            <h2 class="yp-form-section__title">民宿特色</h2>
            <p class="yp-form-section__desc">可複選，協助旅客快速找到適合的住宿</p>

            <!-- 主題特色 -->
            <div class="mb-4">
              <label class="form-label">主題特色</label>
              <div v-if="featuresLoading" class="register-chips-loading">
                <span
                  v-for="n in 6"
                  :key="n"
                  class="yp-skeleton register-chips-loading__item"
                ></span>
              </div>
              <div v-else class="register-checks">
                <label
                  v-for="feature in themeFeatures"
                  :key="feature"
                  class="form-check register-check"
                >
                  <input
                    v-model="formData.theme_features"
                    type="checkbox"
                    class="form-check-input"
                    :value="feature"
                    :disabled="submitting"
                  />
                  <span class="form-check-label">{{ feature }}</span>
                </label>
              </div>
            </div>

            <!-- 服務內容 -->
            <div>
              <label class="form-label">服務內容</label>
              <div v-if="featuresLoading" class="register-chips-loading">
                <span
                  v-for="n in 6"
                  :key="n"
                  class="yp-skeleton register-chips-loading__item"
                ></span>
              </div>
              <div v-else class="register-checks">
                <label
                  v-for="service in serviceAmenities"
                  :key="service"
                  class="form-check register-check"
                >
                  <input
                    v-model="formData.service_amenities"
                    type="checkbox"
                    class="form-check-input"
                    :value="service"
                    :disabled="submitting"
                  />
                  <span class="form-check-label">{{ service }}</span>
                </label>
              </div>
            </div>
          </section>
        </template>

        <!-- 步驟 3: 聯絡資訊 -->
        <template v-if="currentStep === 3">
          <section class="yp-form-section">
            <h2 class="yp-form-section__title">聯絡資訊</h2>
            <p class="yp-form-section__desc">旅客可透過這些管道與您聯繫</p>

            <div class="row g-3 mb-3">
              <div class="col-12 col-md-6">
                <label class="form-label">聯絡電話</label>
                <input
                  v-model="formData.phone"
                  type="tel"
                  class="form-control"
                  placeholder="請輸入聯絡電話"
                  :disabled="submitting"
                />
              </div>

              <div class="col-12 col-md-6">
                <label class="form-label">官方網站</label>
                <input
                  v-model="formData.website"
                  type="url"
                  class="form-control"
                  placeholder="https://your-website.com"
                  :disabled="submitting"
                />
              </div>
            </div>

            <h3 class="register-subtitle">社群媒體（選填）</h3>
            <div class="row g-3">
              <div class="col-12 col-md-6">
                <label class="form-label">LINE 連結</label>
                <input
                  v-model="formData.social.line"
                  type="url"
                  class="form-control"
                  placeholder="https://line.me/ti/p/YOUR_LINE_ID"
                  :disabled="submitting"
                />
                <div class="form-text">請提供 LINE 官方帳號或個人 LINE 連結</div>
              </div>

              <div class="col-12 col-md-6">
                <label class="form-label">Instagram</label>
                <input
                  v-model="formData.social.instagram"
                  type="url"
                  class="form-control"
                  placeholder="https://instagram.com/YOUR_ACCOUNT"
                  :disabled="submitting"
                />
                <div class="form-text">請提供 Instagram 帳號連結</div>
              </div>

              <div class="col-12">
                <label class="form-label">Facebook</label>
                <input
                  v-model="formData.social.facebook"
                  type="url"
                  class="form-control"
                  placeholder="https://facebook.com/YOUR_PAGE"
                  :disabled="submitting"
                />
                <div class="form-text">請提供 Facebook 粉絲專頁或個人頁面連結</div>
              </div>
            </div>
          </section>

          <section class="yp-form-section">
            <h2 class="yp-form-section__title">價格設定（選填）</h2>
            <p class="yp-form-section__desc">顯示為「起」的參考價格，之後可在管理後台修改</p>

            <div class="row g-3">
              <div class="col-6">
                <label class="form-label">平日住宿</label>
                <div class="input-group">
                  <span class="input-group-text">NT$</span>
                  <input
                    v-model.number="formData.pricing.weekdayRoom"
                    type="number"
                    class="form-control"
                    placeholder="2000"
                    :disabled="submitting"
                    min="0"
                  />
                  <span class="input-group-text">起</span>
                </div>
              </div>

              <div class="col-6">
                <label class="form-label">假日住宿</label>
                <div class="input-group">
                  <span class="input-group-text">NT$</span>
                  <input
                    v-model.number="formData.pricing.weekendRoom"
                    type="number"
                    class="form-control"
                    placeholder="2500"
                    :disabled="submitting"
                    min="0"
                  />
                  <span class="input-group-text">起</span>
                </div>
              </div>

              <div class="col-6">
                <label class="form-label">平日包棟</label>
                <div class="input-group">
                  <span class="input-group-text">NT$</span>
                  <input
                    v-model.number="formData.pricing.weekdayPackage"
                    type="number"
                    class="form-control"
                    placeholder="8000"
                    :disabled="submitting"
                    min="0"
                  />
                  <span class="input-group-text">起</span>
                </div>
              </div>

              <div class="col-6">
                <label class="form-label">假日包棟</label>
                <div class="input-group">
                  <span class="input-group-text">NT$</span>
                  <input
                    v-model.number="formData.pricing.weekendPackage"
                    type="number"
                    class="form-control"
                    placeholder="10000"
                    :disabled="submitting"
                    min="0"
                  />
                  <span class="input-group-text">起</span>
                </div>
              </div>
            </div>
          </section>

          <!-- 同意條款 -->
          <section class="yp-form-section">
            <label class="form-check register-agree mb-0">
              <input
                v-model="formData.agreeTerms"
                type="checkbox"
                class="form-check-input"
                required
                :disabled="submitting"
              />
              <span class="form-check-label">
                我已閱讀並同意服務條款和隱私政策，提供真實準確的民宿資訊
              </span>
            </label>
          </section>
        </template>

        <!-- 表單按鈕 -->
        <div class="yp-form-actions">
          <button
            v-if="currentStep > 1"
            type="button"
            class="btn btn-outline-primary"
            :disabled="submitting"
            @click="currentStep--"
          >
            上一步
          </button>

          <button
            v-if="currentStep < 3"
            type="button"
            class="btn btn-primary"
            :disabled="!canNextStep"
            @click="nextStep"
          >
            下一步
          </button>

          <button
            v-if="currentStep === 3"
            type="submit"
            class="btn btn-primary"
            :disabled="!canSubmit || submitting"
          >
            <span
              v-if="submitting"
              class="spinner-border spinner-border-sm me-2"
              aria-hidden="true"
            ></span>
            {{ submitting ? '申請中...' : '提交申請' }}
          </button>
        </div>
      </form>
    </template>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { township } from '~/utils/category.js'
const { loginRequired, loginUrl } = useSubmissionLogin()

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
})

// 表單狀態
const currentStep = ref(1)
const submitting = ref(false)
const showSuccess = ref(false)
const successMessage = ref('')
const errorMessage = ref('')

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
})

// 圖片上傳相關
const coverUrl = ref('')

// 動態載入的特色選項
const themeFeatures = ref([])
const serviceAmenities = ref([])
const featuresLoading = ref(true)

// 鄉鎮市資料
const townships = township

// 驗證邏輯
const canNextStep = computed(() => {
  if (currentStep.value === 1) {
    return (
      formData.value.account &&
      formData.value.password &&
      formData.value.confirmPassword &&
      formData.value.email &&
      formData.value.password === formData.value.confirmPassword &&
      formData.value.password.length >= 6
    )
  }
  if (currentStep.value === 2) {
    return formData.value.name && formData.value.location && formData.value.city
  }
  return true
})

const passwordMismatch = computed(() => {
  return !!(
    formData.value.password &&
    formData.value.confirmPassword &&
    formData.value.password !== formData.value.confirmPassword
  )
})

const canSubmit = computed(() => {
  return formData.value.agreeTerms && canNextStep.value
})

// 下一步
const nextStep = () => {
  if (canNextStep.value && currentStep.value < 3) {
    currentStep.value++
  }
}

// 處理檔案上傳
const handleFileUpload = async (event) => {
  const files = event.target.files
  if (!files.length) return

  for (const file of files) {
    try {
      console.log('開始上傳文件:', file.name)

      // 驗證文件類型
      const allowedTypes = ['image/jpeg', 'image/png', 'image/gif']
      if (!allowedTypes.includes(file.type)) {
        throw new Error('只允許上傳 JPEG、PNG 和 GIF 格式的圖片')
      }

      // 驗證文件大小 (5MB)
      const maxSize = 5 * 1024 * 1024
      if (file.size > maxSize) {
        throw new Error('文件太大，最大允許 5MB')
      }

      // 創建 FormData
      const uploadFormData = new FormData()
      uploadFormData.append('file', file)

      // 上傳到後端 API
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: uploadFormData
      })

      const data = await response.json()

      if (!data.success) {
        throw new Error(data.error || '上傳失敗')
      }

      console.log('上傳成功:', data.url)

      // 添加到 formData.images 陣列
      if (!formData.value.images) formData.value.images = []
      formData.value.images.push(data.url)
    } catch (error) {
      console.error('上傳錯誤:', error)
      alert(`上傳失敗：${error.message}`)
    }
  }
}

// 添加手動輸入的圖片URL
const addCoverUrl = () => {
  if (coverUrl.value.trim()) {
    try {
      // eslint-disable-next-line no-new
      new URL(coverUrl.value)
      if (!formData.value.images) {
        formData.value.images = []
      }
      formData.value.images.push(coverUrl.value.trim())
      coverUrl.value = ''
    } catch (e) {
      alert('請輸入有效的圖片 URL')
    }
  }
}

// 移除圖片
const removeImage = (index) => {
  if (formData.value.images && formData.value.images.length > index) {
    formData.value.images.splice(index, 1)
  }
}

// 提交表單
const handleSubmit = async () => {
  if (!canSubmit.value) return

  submitting.value = true
  errorMessage.value = ''

  try {
    const response = await $fetch('/api/homestay-register', {
      method: 'POST',
      body: formData.value
    })

    if (response.success) {
      successMessage.value =
        response.message || '我們已收到您的民宿註冊申請，管理員將在 1-3 個工作天內完成審核。'
      showSuccess.value = true
    } else {
      errorMessage.value = response.message || '申請失敗，請重試'
    }
  } catch (error) {
    console.error('註冊錯誤:', error)
    errorMessage.value = error.data?.message || '系統錯誤，請稍後重試'
  } finally {
    submitting.value = false
  }
}

// 載入特色選項
const loadFeatureOptions = async () => {
  try {
    featuresLoading.value = true
    const response = await $fetch('/api/features-options')

    if (response.success) {
      themeFeatures.value = response.data.themeFeatures || []
      serviceAmenities.value = response.data.serviceAmenities || []
      console.log('特色選項載入成功:', {
        themeFeatures: themeFeatures.value.length,
        serviceAmenities: serviceAmenities.value.length
      })
    } else {
      console.error('載入特色選項失敗:', response.error)
      // 使用備用選項
      setFallbackOptions()
    }
  } catch (error) {
    console.error('載入特色選項錯誤:', error)
    // 使用備用選項
    setFallbackOptions()
  } finally {
    featuresLoading.value = false
  }
}

// 設置備用選項
const setFallbackOptions = () => {
  themeFeatures.value = [
    '包棟民宿',
    '電梯/一樓孝親房民宿',
    '獨棟、莊園民宿',
    '親子民宿',
    '寵物民宿',
    '海景民宿',
    '市區民宿',
    '夜市民宿',
    '車站周邊住宿'
  ]
  serviceAmenities.value = [
    '美味早餐',
    '方便停車',
    '有停車位(場)',
    '可停遊覽車',
    '有陽台房型',
    '有浴缸房型',
    '有公用客廳',
    '一樓孝親房',
    '戶外戲水池',
    '有烤肉場地',
    '歌唱設備',
    '可借用廚房',
    '可打麻將',
    '可帶寵物入住',
    '可刷國旅卡',
    '電動麻將桌',
    '充電樁'
  ]
}

// 重置表單
const resetForm = () => {
  currentStep.value = 1
  showSuccess.value = false
  successMessage.value = ''
  errorMessage.value = ''
  coverUrl.value = ''

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
  }

  // 重新載入特色選項
  loadFeatureOptions()
}

// 頁面載入時初始化
onMounted(() => {
  loadFeatureOptions()
})
</script>

<style scoped lang="scss">
// 進度指示器
.register-steps {
  list-style: none;
  display: flex;
  margin: 0 0 24px;
  padding: 0;
}

.register-step {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  position: relative;
  color: $yp-subtle;
  font-size: 0.8125rem;

  // 步驟間連接線
  &:not(:first-child)::before {
    content: '';
    position: absolute;
    top: 17px;
    right: 50%;
    width: 100%;
    height: 2px;
    background: $yp-line;
  }

  &.is-active:not(:first-child)::before {
    background: $yp-primary;
  }

  &__num {
    position: relative;
    z-index: 1;
    width: 36px;
    height: 36px;
    border-radius: 50%;
    background: $yp-surface-2;
    color: $yp-muted;
    display: grid;
    place-items: center;
    font-family: $yp-font-num;
    font-weight: 700;
    border: 2px solid $yp-surface-2;
    transition: all 0.2s ease;
  }

  &.is-active {
    color: $yp-ink;
    font-weight: 700;

    .register-step__num {
      background: $yp-surface;
      border-color: $yp-primary;
      color: $yp-primary-ink;
    }
  }

  &.is-done .register-step__num {
    background: $yp-primary;
    border-color: $yp-primary;
    color: #fff;
  }
}

.register-subtitle {
  font-size: 0.9375rem;
  font-weight: 700;
  color: $yp-ink;
  margin: 8px 0 12px;
}

.register-success-icon {
  background: $yp-success-soft;
  color: $yp-success;
}

.register-upload-icon {
  font-size: 28px;
  color: $yp-primary;
  margin-bottom: 6px;
}

.yp-upload:focus-within {
  border-color: $yp-primary;
  background: $yp-primary-soft;
}

// 圖片預覽
.register-gallery {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: 12px;
  margin-top: 16px;

  &__item {
    position: relative;
    aspect-ratio: 4 / 3;
    border-radius: $yp-radius-sm;
    overflow: hidden;
    background: $yp-surface-2;

    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      display: block;
    }
  }

  &__badge {
    position: absolute;
    left: 6px;
    bottom: 6px;
    background: $yp-ink;
    color: #fff;
    font-size: 0.6875rem;
    font-weight: 700;
    padding: 2px 8px;
    border-radius: $yp-radius-pill;
  }

  &__remove {
    position: absolute;
    top: 6px;
    right: 6px;
    width: 28px;
    height: 28px;
    border: 0;
    border-radius: 50%;
    background: rgba($yp-ink, 0.7);
    color: #fff;
    display: grid;
    place-items: center;

    &:hover:not(:disabled) {
      background: $yp-danger;
    }
  }
}

.register-preview {
  margin-top: 10px;

  img {
    max-width: 200px;
    max-height: 150px;
    border-radius: $yp-radius-sm;
    object-fit: cover;
    border: 1px solid $yp-line;
  }
}

// 特色複選
.register-chips-loading {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;

  &__item {
    width: 96px;
    height: 34px;
    border-radius: $yp-radius-pill;
  }
}

.register-checks {
  display: grid;
  grid-template-columns: 1fr;
  gap: 4px 16px;

  @media (min-width: $yp-bp-sm) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  @media (min-width: $yp-bp-md) {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

.register-check {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0;
  padding: 6px 0;
  min-height: 40px;
  cursor: pointer;

  .form-check-input {
    float: none;
    margin: 0;
    flex: none;
  }

  .form-check-label {
    cursor: pointer;
    font-size: 0.9375rem;
  }
}

.register-agree {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding-left: 0;
  cursor: pointer;

  .form-check-input {
    float: none;
    margin: 4px 0 0;
    flex: none;
  }

  .form-check-label {
    line-height: 1.6;
  }
}
</style>
