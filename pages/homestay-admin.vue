<template>
  <div class="yp-page owner-page">
    <!-- 載入中狀態 -->
    <div v-if="loading" class="owner-loading" aria-busy="true" aria-live="polite">
      <span class="yp-skeleton" style="width: 40%; height: 32px"></span>
      <span class="yp-skeleton" style="width: 60%; height: 16px; margin-top: 12px"></span>
      <div class="yp-admin-stats owner-loading__stats">
        <span
          v-for="n in 4"
          :key="n"
          class="yp-skeleton"
          style="height: 88px; border-radius: 16px"
        ></span>
      </div>
      <span class="yp-skeleton" style="height: 320px; border-radius: 16px"></span>
    </div>

    <!-- 未登入狀態 -->
    <div v-else-if="!homestay" class="yp-empty yp-empty--error">
      <div class="yp-empty__icon"><Icon name="ri:lock-line" /></div>
      <h1 class="yp-empty__title">請先登入</h1>
      <p class="yp-empty__text">您需要登入才能訪問民宿管理後台</p>
      <NuxtLink to="/homestay-login" class="btn btn-primary">前往登入</NuxtLink>
    </div>

    <!-- 管理後台主介面 -->
    <template v-else>
      <!-- 頁首 -->
      <header class="yp-page-head">
        <div>
          <span class="yp-page-head__eyebrow">民宿業者後台</span>
          <h1 class="yp-page-head__title">{{ homestay.name }}</h1>
          <p class="yp-page-head__desc">編輯您的民宿資訊，儲存後立即更新到前台頁面</p>
        </div>
        <div class="yp-page-head__actions">
          <NuxtLink to="/homestay-list" class="btn btn-outline-primary btn-icon">
            <Icon name="ri:arrow-left-line" />
            回到民宿列表
          </NuxtLink>
          <button type="button" class="btn btn-outline-danger btn-icon" @click="handleLogout">
            <Icon name="ri:logout-box-r-line" />
            登出
          </button>
        </div>
      </header>

      <!-- Toast 提示訊息 -->
      <Transition name="toast" appear>
        <div
          v-if="message.text"
          class="yp-toast owner-toast"
          :class="`owner-toast--${message.type}`"
          role="status"
        >
          <Icon
            v-if="message.type === 'success'"
            name="ri:checkbox-circle-fill"
            class="owner-toast__icon"
          />
          <Icon
            v-else-if="message.type === 'error'"
            name="ri:error-warning-fill"
            class="owner-toast__icon"
          />
          <Icon v-else name="ri:information-fill" class="owner-toast__icon" />
          <span class="owner-toast__text">{{ message.text }}</span>
          <button
            type="button"
            class="owner-toast__close"
            aria-label="關閉提示"
            @click="closeToast"
          >
            <Icon name="ri:close-line" />
          </button>
        </div>
      </Transition>

      <!-- 重點數字 -->
      <div class="yp-admin-stats">
        <div
          class="yp-stat-card"
          :class="editData.available ? 'yp-stat-card--success' : 'yp-stat-card--warning'"
        >
          <p class="yp-stat-card__label">預訂狀態</p>
          <p class="yp-stat-card__value owner-stat-text">
            {{ editData.available ? '開放預訂' : '暫停預訂' }}
          </p>
        </div>
        <div class="yp-stat-card yp-stat-card--primary">
          <p class="yp-stat-card__label">民宿圖片</p>
          <p class="yp-stat-card__value">{{ imagesArray.length }}</p>
          <p class="yp-stat-card__hint">
            {{ imagesArray.length ? '第一張為主要圖片' : '尚未上傳圖片' }}
          </p>
        </div>
        <div class="yp-stat-card">
          <p class="yp-stat-card__label">可住人數</p>
          <p class="yp-stat-card__value">{{ guestRangeText }}</p>
        </div>
        <div class="yp-stat-card">
          <p class="yp-stat-card__label">最低價格</p>
          <p class="yp-stat-card__value">
            {{ lowestPrice ? `NT$ ${lowestPrice.toLocaleString()}` : '—' }}
          </p>
          <p class="yp-stat-card__hint">{{ lowestPrice ? '房間 / 包棟最低價' : '尚未設定價格' }}</p>
        </div>
      </div>

      <!-- 區塊導覽 -->
      <nav class="yp-chips owner-nav" aria-label="編輯區塊">
        <a
          v-for="item in sectionNav"
          :key="item.id"
          :href="`#${item.id}`"
          class="yp-chip yp-chip--sm"
        >
          {{ item.label }}
        </a>
      </nav>

      <!-- 編輯表單 -->
      <form class="owner-form" @submit.prevent="handleUpdate">
        <!-- 基本資訊 -->
        <section id="owner-basic" class="yp-form-section">
          <h2 class="yp-form-section__title">基本資訊</h2>
          <p class="yp-form-section__desc">民宿名稱、位置與聯絡方式</p>

          <div class="row g-3 mb-3">
            <div class="col-12 col-md-6">
              <label class="form-label required">民宿名稱</label>
              <input
                v-model="editData.name"
                type="text"
                class="form-control"
                :disabled="saving"
                required
              />
            </div>

            <div class="col-12 col-md-6">
              <label class="form-label required">所在位置</label>
              <input
                v-model="editData.location"
                type="text"
                class="form-control"
                :disabled="saving"
                required
              />
            </div>

            <div class="col-12 col-md-6">
              <label class="form-label">城市</label>
              <input v-model="editData.city" type="text" class="form-control" :disabled="saving" />
            </div>

            <div class="col-12 col-md-6">
              <label class="form-label">電話</label>
              <input v-model="editData.phone" type="tel" class="form-control" :disabled="saving" />
            </div>

            <div class="col-12">
              <label class="form-label">網站</label>
              <input
                v-model="editData.website"
                type="url"
                class="form-control"
                :disabled="saving"
              />
            </div>
          </div>

          <!-- 社群媒體資訊 -->
          <h3 class="owner-subtitle">社群媒體連結</h3>

          <div class="row g-3 mb-3">
            <div class="col-12 col-md-6">
              <label class="form-label">LINE 連結</label>
              <input
                v-model="editData.social.line"
                type="url"
                class="form-control"
                placeholder="https://line.me/ti/p/YOUR_LINE_ID"
                :disabled="saving"
              />
            </div>

            <div class="col-12 col-md-6">
              <label class="form-label">Instagram</label>
              <input
                v-model="editData.social.instagram"
                type="url"
                class="form-control"
                placeholder="https://instagram.com/YOUR_ACCOUNT"
                :disabled="saving"
              />
            </div>

            <div class="col-12">
              <label class="form-label">Facebook</label>
              <input
                v-model="editData.social.facebook"
                type="url"
                class="form-control"
                placeholder="https://facebook.com/YOUR_PAGE"
                :disabled="saving"
              />
            </div>
          </div>

          <div class="mb-3">
            <label class="form-label">民宿介紹</label>
            <textarea
              v-model="editData.capacity_description"
              class="form-control"
              :disabled="saving"
              rows="4"
              placeholder="請描述您的民宿特色、環境介紹、設施等..."
            ></textarea>
          </div>

          <!-- 人數設定 -->
          <div class="row g-3">
            <div class="col-6">
              <label class="form-label">最少人數</label>
              <div class="input-group">
                <input
                  v-model.number="editData.min_guests"
                  type="number"
                  class="form-control"
                  :disabled="saving"
                  min="1"
                  max="50"
                  placeholder="例如: 2"
                />
                <span class="input-group-text">人</span>
              </div>
            </div>

            <div class="col-6">
              <label class="form-label">最多人數</label>
              <div class="input-group">
                <input
                  v-model.number="editData.max_guests"
                  type="number"
                  class="form-control"
                  :disabled="saving"
                  min="1"
                  max="50"
                  placeholder="例如: 8"
                />
                <span class="input-group-text">人</span>
              </div>
            </div>
          </div>
        </section>

        <!-- 圖片管理 -->
        <section id="owner-images" class="yp-form-section">
          <h2 class="yp-form-section__title">民宿圖片</h2>
          <p class="yp-form-section__desc">
            第一張圖片將作為主要圖片顯示，可上傳檔案或貼上圖片網址
          </p>

          <!-- 檔案上傳區塊 -->
          <label class="yp-upload d-block mb-3" :class="{ 'opacity-50': saving }">
            <input
              type="file"
              class="visually-hidden"
              accept="image/*"
              multiple
              :disabled="saving"
              @change="handleFileUpload"
            />
            <Icon name="ri:image-add-line" class="owner-upload-icon" />
            <div class="fw-bold">點擊上傳圖片檔案</div>
            <div class="small">支援 JPG、PNG、GIF 格式，單檔最大 5MB，可一次選擇多張圖片</div>
          </label>

          <!-- 手動添加圖片URL -->
          <label class="form-label" for="owner-image-url">或手動添加圖片網址</label>
          <div class="input-group mb-4">
            <input
              id="owner-image-url"
              v-model="newImageUrl"
              type="url"
              class="form-control"
              placeholder="例如：https://example.com/image.jpg"
              :disabled="saving"
              @keyup.enter="addImageUrl"
            />
            <button
              type="button"
              class="btn btn-soft"
              :disabled="!newImageUrl || saving"
              @click.prevent="addImageUrl"
            >
              添加圖片
            </button>
          </div>

          <!-- 圖片預覽與排序功能 -->
          <div v-if="imagesArray && imagesArray.length > 0">
            <div class="d-flex align-items-center justify-content-between mb-2">
              <span class="form-label mb-0">圖片預覽與管理</span>
              <span class="small text-muted">共 {{ imagesArray.length }} 張圖片</span>
            </div>

            <div class="owner-images">
              <div v-for="(url, index) in imagesArray" :key="index" class="owner-images__item">
                <img :src="url" :alt="'民宿圖片 ' + (index + 1)" />

                <span v-if="index === 0" class="owner-images__badge">主要圖片</span>
                <span class="owner-images__order">{{ index + 1 }}</span>

                <div class="owner-images__controls">
                  <button
                    type="button"
                    class="owner-images__btn"
                    :disabled="index === 0 || saving"
                    title="向前移動"
                    aria-label="向前移動"
                    @click.prevent="moveImage(index, 'up')"
                  >
                    <Icon name="ri:arrow-left-s-line" />
                  </button>
                  <button
                    type="button"
                    class="owner-images__btn"
                    :disabled="index === imagesArray.length - 1 || saving"
                    title="向後移動"
                    aria-label="向後移動"
                    @click.prevent="moveImage(index, 'down')"
                  >
                    <Icon name="ri:arrow-right-s-line" />
                  </button>
                  <button
                    type="button"
                    class="owner-images__btn owner-images__btn--danger"
                    :disabled="saving"
                    title="刪除圖片"
                    aria-label="刪除圖片"
                    @click.prevent="removeImage(index)"
                  >
                    <Icon name="ri:delete-bin-line" />
                  </button>
                </div>
              </div>

              <!-- 添加新圖片的佔位符 -->
              <button
                type="button"
                class="owner-images__add"
                :disabled="saving"
                @click="triggerFileInput"
              >
                <Icon name="ri:add-line" />
                <span>點擊上傳</span>
              </button>
            </div>

            <p class="form-text mb-0 mt-2">使用箭頭按鈕調整圖片順序，第一張為主要圖片。</p>
          </div>

          <!-- 空狀態 -->
          <div v-else class="yp-empty owner-images-empty">
            <div class="yp-empty__icon"><Icon name="ri:image-add-line" /></div>
            <h3 class="yp-empty__title">尚未添加圖片</h3>
            <p class="yp-empty__text">上傳圖片或輸入圖片網址，讓旅客更了解您的民宿</p>
            <button type="button" class="btn btn-soft" :disabled="saving" @click="triggerFileInput">
              選擇圖片
            </button>
          </div>

          <!-- 隱藏的檔案輸入框 -->
          <input
            ref="fileInputRef"
            type="file"
            class="d-none"
            accept="image/*"
            multiple
            :disabled="saving"
            @change="handleFileUpload"
          />
        </section>

        <!-- 價格設定 -->
        <section id="owner-pricing" class="yp-form-section">
          <h2 class="yp-form-section__title">價格設定</h2>
          <p class="yp-form-section__desc">前台將顯示為「NT$ xxx 起」的參考價格</p>

          <div class="row g-3">
            <div class="col-12 col-sm-6">
              <label class="form-label">平日房間價格</label>
              <div class="input-group">
                <span class="input-group-text">NT$</span>
                <input
                  v-model.number="editData.pricing.weekdayRoom"
                  type="number"
                  step="1"
                  min="0"
                  class="form-control"
                  :disabled="saving"
                  placeholder="0"
                />
              </div>
            </div>

            <div class="col-12 col-sm-6">
              <label class="form-label">假日房間價格</label>
              <div class="input-group">
                <span class="input-group-text">NT$</span>
                <input
                  v-model.number="editData.pricing.weekendRoom"
                  type="number"
                  step="1"
                  min="0"
                  class="form-control"
                  :disabled="saving"
                  placeholder="0"
                />
              </div>
            </div>

            <div class="col-12 col-sm-6">
              <label class="form-label">平日包棟最低價</label>
              <div class="input-group">
                <span class="input-group-text">NT$</span>
                <input
                  v-model.number="editData.pricing.weekdayPackage"
                  type="number"
                  step="1"
                  min="0"
                  class="form-control"
                  :disabled="saving"
                  placeholder="0"
                />
              </div>
            </div>

            <div class="col-12 col-sm-6">
              <label class="form-label">假日包棟最低價</label>
              <div class="input-group">
                <span class="input-group-text">NT$</span>
                <input
                  v-model.number="editData.pricing.weekendPackage"
                  type="number"
                  step="1"
                  min="0"
                  class="form-control"
                  :disabled="saving"
                  placeholder="0"
                />
              </div>
            </div>
          </div>
        </section>

        <!-- 特色設定 -->
        <section id="owner-features" class="yp-form-section">
          <h2 class="yp-form-section__title">民宿特色</h2>
          <p class="yp-form-section__desc">可複選，協助旅客快速找到適合的住宿</p>

          <!-- 主題特色 -->
          <div class="mb-4">
            <label class="form-label">主題特色</label>
            <div class="owner-checks">
              <label
                v-for="feature in activeThemeFeatures"
                :key="feature.id || feature"
                class="form-check owner-check"
              >
                <input
                  v-model="editData.theme_features"
                  type="checkbox"
                  class="form-check-input"
                  :value="typeof feature === 'object' ? feature.name : feature"
                  :disabled="saving"
                />
                <span class="form-check-label">{{
                  typeof feature === 'object' ? feature.name : feature
                }}</span>
              </label>
            </div>
          </div>

          <!-- 服務內容 -->
          <div class="mb-4">
            <label class="form-label">服務內容</label>
            <div class="owner-checks">
              <label
                v-for="service in activeServiceAmenities"
                :key="service.id || service"
                class="form-check owner-check"
              >
                <input
                  v-model="editData.service_amenities"
                  type="checkbox"
                  class="form-check-input"
                  :value="typeof service === 'object' ? service.name : service"
                  :disabled="saving"
                />
                <span class="form-check-label">{{
                  typeof service === 'object' ? service.name : service
                }}</span>
              </label>
            </div>
          </div>

          <div class="owner-available">
            <div class="form-check form-switch mb-0">
              <input
                id="owner-available"
                v-model="editData.available"
                type="checkbox"
                role="switch"
                class="form-check-input"
                :disabled="saving"
              />
              <label class="form-check-label fw-bold" for="owner-available">開放預訂</label>
            </div>
            <p class="form-text mb-0">關閉後，前台會顯示為暫不接受預訂。</p>
          </div>
        </section>

        <!-- 空房狀態管理 -->
        <!-- <section id="owner-availability" class="yp-form-section">
          <h2 class="yp-form-section__title">空房狀態管理</h2>
          <p class="yp-form-section__desc">管理您的民宿每日空房狀況，點擊日期可切換可用/不可用狀態</p>

          <AdminAvailabilityCalendar
            v-if="homestay"
            :homestay-id="homestay.id"
            @status-changed="handleAvailabilityChange"
          />
        </section> -->

        <!-- 提交按鈕 -->
        <div class="yp-form-actions">
          <button type="button" class="btn btn-ghost" :disabled="saving" @click="resetForm">
            重置
          </button>

          <button type="submit" class="btn btn-primary" :disabled="saving">
            <span
              v-if="saving"
              class="spinner-border spinner-border-sm me-2"
              aria-hidden="true"
            ></span>
            {{ saving ? '儲存中...' : '儲存變更' }}
          </button>
        </div>
      </form>
    </template>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { navigateTo } from 'nuxt/app'

// SEO設定
useHead({
  title: '民宿管理後台',
  meta: [{ name: 'robots', content: 'noindex, nofollow' }]
})

// 狀態管理
const loading = ref(true)
const saving = ref(false)
const homestay = ref(null)
const originalData = ref(null)
const newImageUrl = ref('') // 新增圖片URL輸入
const fileInputRef = ref(null) // 檔案輸入框引用
const featuresData = ref({
  themeFeatures: [],
  serviceAmenities: []
})
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
})

// 計算屬性用於圖片預覽和排序
const imagesArray = computed({
  get: () => {
    return editData.value.images || []
  },
  set: (newArray) => {
    editData.value.images = newArray
  }
})

// 區塊導覽
const sectionNav = [
  { id: 'owner-basic', label: '基本資訊' },
  { id: 'owner-images', label: '圖片' },
  { id: 'owner-pricing', label: '價格' },
  { id: 'owner-features', label: '特色與預訂' }
]

// 重點數字（僅用於顯示）
const guestRangeText = computed(() => {
  const { min_guests: min, max_guests: max } = editData.value
  if (min && max) return min === max ? `${max} 人` : `${min}–${max} 人`
  if (max) return `最多 ${max} 人`
  if (min) return `${min} 人起`
  return '—'
})

const lowestPrice = computed(() => {
  const prices = Object.values(editData.value.pricing || {}).filter((v) => Number(v) > 0)
  return prices.length ? Math.min(...prices.map(Number)) : null
})

const message = ref({
  text: '',
  type: ''
})

// 觸發檔案選擇
const triggerFileInput = () => {
  if (!saving.value && fileInputRef.value) {
    fileInputRef.value.click()
  }
}

// 處理檔案上傳
const handleFileUpload = async (event) => {
  const files = event.target.files
  if (!files.length) return

  saving.value = true
  showMessage('正在上傳圖片...', 'info')

  try {
    for (const file of files) {
      console.log('開始上傳文件:', file.name)

      // 驗證文件類型
      const allowedTypes = ['image/jpeg', 'image/png', 'image/gif']
      if (!allowedTypes.includes(file.type)) {
        throw new Error(`檔案 ${file.name} 格式不支援，只允許 JPEG、PNG 和 GIF 格式`)
      }

      // 驗證文件大小 (5MB)
      const maxSize = 5 * 1024 * 1024
      if (file.size > maxSize) {
        throw new Error(`檔案 ${file.name} 太大，最大允許 5MB`)
      }

      // 創建 FormData
      const formData = new FormData()
      formData.append('file', file)

      // 首先嘗試 GitHub 上傳，如果失敗則使用本地上傳
      let response
      try {
        response = await fetch('/api/upload', {
          method: 'POST',
          body: formData
        })
      } catch (error) {
        console.warn('GitHub 上傳失敗，嘗試本地上傳:', error)
        // 使用本地上傳作為備用
        response = await fetch('/api/upload-local', {
          method: 'POST',
          body: formData
        })
      }

      const data = await response.json()

      if (!data.success) {
        throw new Error(data.error || `上傳 ${file.name} 失敗`)
      }

      console.log('上傳成功:', data.url)

      // 添加到圖片陣列
      const currentImages = imagesArray.value
      currentImages.push(data.url)
      imagesArray.value = currentImages
    }

    showMessage(`成功上傳 ${files.length} 張圖片！`, 'success')
  } catch (error) {
    console.error('上傳錯誤:', error)
    showMessage(`上傳失敗：${error.message}`, 'error')
  } finally {
    saving.value = false
    // 清空檔案輸入
    if (event.target) {
      event.target.value = ''
    }
  }
}

// 添加手動輸入的圖片URL
const addImageUrl = () => {
  if (newImageUrl.value.trim()) {
    try {
      // eslint-disable-next-line no-new
      new URL(newImageUrl.value)
      const currentImages = imagesArray.value
      currentImages.push(newImageUrl.value.trim())
      imagesArray.value = currentImages
      newImageUrl.value = ''
      showMessage('圖片已添加', 'success')
    } catch (e) {
      showMessage('請輸入有效的圖片 URL', 'error')
    }
  }
}

// 移除圖片
const removeImage = (index) => {
  const newArray = [...imagesArray.value]
  newArray.splice(index, 1)
  imagesArray.value = newArray
  showMessage('圖片已移除', 'info')
}

// 移動圖片順序
const moveImage = (index, direction) => {
  const newArray = [...imagesArray.value]

  if (direction === 'up' && index > 0) {
    // 與上一個元素交換位置
    const temp = newArray[index]
    newArray[index] = newArray[index - 1]
    newArray[index - 1] = temp
  } else if (direction === 'down' && index < newArray.length - 1) {
    // 與下一個元素交換位置
    const temp = newArray[index]
    newArray[index] = newArray[index + 1]
    newArray[index + 1] = temp
  }

  imagesArray.value = newArray
  showMessage(`圖片已${direction === 'up' ? '前移' : '後移'}`, 'info')
}

// 計算屬性：獲取啟用的主題特色
const activeThemeFeatures = computed(() => {
  return featuresData.value.themeFeatures.filter((feature) => feature.is_active)
})

// 計算屬性：獲取啟用的服務設施（作為備用選項，如果需要的話）
const activeServiceAmenities = computed(() => {
  return featuresData.value.serviceAmenities.filter((feature) => feature.is_active)
})

// 載入特色項目
const loadFeatures = async () => {
  try {
    const response = await $fetch('/api/features-options')
    if (response.success) {
      featuresData.value = {
        themeFeatures: response.data.themeFeatures.map((name) => ({ name, is_active: true })),
        serviceAmenities: response.data.serviceAmenities.map((name) => ({ name, is_active: true }))
      }
    } else {
      console.error('載入特色項目失敗:', response.error)
      // 如果API失敗，使用備用的硬編碼列表
      setFallbackFeatures()
    }
  } catch (error) {
    console.error('載入特色項目錯誤:', error)
    // 如果API失敗，使用備用的硬編碼列表
    setFallbackFeatures()
  }
}

// 設置備用的特色項目
const setFallbackFeatures = () => {
  featuresData.value.themeFeatures = [
    { name: '包棟民宿', is_active: true },
    { name: '電梯/一樓孝親房民宿', is_active: true },
    { name: '獨棟、莊園民宿', is_active: true },
    { name: '親子民宿', is_active: true },
    { name: '寵物民宿', is_active: true },
    { name: '海景民宿', is_active: true },
    { name: '市區民宿', is_active: true },
    { name: '夜市民宿', is_active: true },
    { name: '車站周邊住宿', is_active: true }
  ]

  featuresData.value.serviceAmenities = [
    { name: '美味早餐', is_active: true },
    { name: '方便停車', is_active: true },
    { name: '有停車位(場)', is_active: true },
    { name: '可停遊覽車', is_active: true },
    { name: '有陽台房型', is_active: true },
    { name: '有浴缸房型', is_active: true },
    { name: '有公用客廳', is_active: true },
    { name: '一樓孝親房', is_active: true },
    { name: '戶外戲水池', is_active: true },
    { name: '有烤肉場地', is_active: true },
    { name: '歡唱設備', is_active: true },
    { name: '可借用廚房', is_active: true },
    { name: '可打麻將', is_active: true },
    { name: '可帶寵物入住', is_active: true },
    { name: '可刷國旅卡', is_active: true },
    { name: '電動麻將桌', is_active: true },
    { name: '充電樁', is_active: true }
  ]
}

// 檢查登入狀態
const checkAuth = async () => {
  try {
    const response = await $fetch('/api/homestay-auth')

    if (response.success && response.homestay) {
      homestay.value = response.homestay

      // 直接從 auth API 回應設定編輯資料
      setupEditDataFromAuth(response.homestay)
    } else {
      console.error('身份驗證失敗或無民宿資料')
      await navigateTo('/homestay-login')
    }
  } catch (error) {
    console.error('身份驗證失敗:', error)
    await navigateTo('/homestay-login')
  } finally {
    loading.value = false
  }
}

// 從身份驗證回應直接設定編輯資料
const setupEditDataFromAuth = (homestayData) => {
  try {
    // 處理圖片資料
    let images = []
    if (
      homestayData.images &&
      Array.isArray(homestayData.images) &&
      homestayData.images.length > 0
    ) {
      images = homestayData.images.filter((url) => url && url.trim())
    } else if (homestayData.image_url) {
      images = [homestayData.image_url]
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
      images,
      capacity_description: homestayData.capacity_description || '',
      min_guests: homestayData.min_guests || null,
      max_guests: homestayData.max_guests || null,
      available: homestayData.available || true,

      theme_features: homestayData.theme_features || [],
      service_amenities: homestayData.service_amenities || [],
      pricing: {
        weekdayRoom: homestayData.pricing?.weekdayRoom || null,
        weekendRoom: homestayData.pricing?.weekendRoom || null,
        weekdayPackage: homestayData.pricing?.weekdayPackage || null,
        weekendPackage: homestayData.pricing?.weekendPackage || null
      }
    }

    // 保存原始資料
    originalData.value = JSON.parse(JSON.stringify(editData.value))
  } catch (error) {
    console.error('設定編輯資料失敗:', error)
    showMessage(`設定資料失敗: ${error.message}`, 'error')
  }
}

// 顯示訊息
const showMessage = (text, type = 'success') => {
  message.value = { text, type }
  // 延長顯示時間到8秒，讓使用者有足夠時間看到
  setTimeout(() => {
    message.value = { text: '', type: '' }
  }, 8000)
}

// 手動關閉 Toast
const closeToast = () => {
  message.value = { text: '', type: '' }
}

// 重置表單
const resetForm = () => {
  if (originalData.value) {
    editData.value = JSON.parse(JSON.stringify(originalData.value))
    newImageUrl.value = '' // 重置新圖片URL輸入
    showMessage('已重置為原始資料', 'info')
  }
}

// 處理空房狀態變更（空房日曆啟用時使用）
// eslint-disable-next-line no-unused-vars
const handleAvailabilityChange = (result) => {
  if (result.success) {
    showMessage(`成功更新 ${result.changes} 筆空房狀態`, 'success')
  } else {
    showMessage(`更新空房狀態失敗: ${result.error}`, 'error')
    console.error('空房狀態更新失敗:', result.error)
  }
}

// 處理更新
const handleUpdate = async () => {
  try {
    saving.value = true

    // 更新 images 陣列
    editData.value.images = imagesArray.value

    const updateData = {
      ...editData.value,
      images: editData.value.images
    }

    const response = await $fetch('/api/update-homestay', {
      method: 'POST',
      body: updateData
    })

    if (response.success) {
      originalData.value = JSON.parse(JSON.stringify(editData.value))
      showMessage('民宿資料已成功更新！', 'success')
    }
  } catch (error) {
    console.error('更新失敗:', error)
    showMessage(error.data?.message || '更新失敗，請稍後再試', 'error')
  } finally {
    saving.value = false
  }
}

// 處理登出
const handleLogout = async () => {
  if (confirm('確定要登出嗎？')) {
    try {
      await $fetch('/api/homestay-logout', { method: 'POST' })
      await navigateTo('/homestay-login')
    } catch (error) {
      console.error('登出失敗:', error)
    }
  }
}

onMounted(async () => {
  await Promise.all([checkAuth(), loadFeatures()])
})
</script>

<style lang="scss" scoped>
.owner-page {
  max-width: 960px;
}

.owner-loading {
  &__stats {
    margin-top: 24px;
  }
}

.owner-stat-text {
  font-family: $yp-font-sans;
  font-size: 1.25rem;
  line-height: 1.8;
}

// 區塊導覽（黏在前台 Header 下方）
.owner-nav {
  position: sticky;
  top: 60px;
  z-index: 10;
  margin: 0 -16px 16px;
  padding: 8px 16px;
  background: rgba($yp-bg, 0.94);
  backdrop-filter: blur(8px);

  @media (min-width: $yp-bp-md) {
    top: $yp-header-h;
    margin: 0 0 16px;
    padding: 8px 2px;
  }

  .yp-chip {
    text-decoration: none;
  }
}

.owner-form section[id] {
  scroll-margin-top: 130px;
}

.owner-subtitle {
  font-size: 0.9375rem;
  font-weight: 700;
  color: $yp-ink;
  margin: 8px 0 12px;
}

.owner-upload-icon {
  font-size: 28px;
  color: $yp-primary;
  margin-bottom: 6px;
}

.yp-upload:focus-within {
  border-color: $yp-primary;
  background: $yp-primary-soft;
}

// 圖片管理
.owner-images {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;

  @media (min-width: $yp-bp-sm) {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }

  @media (min-width: $yp-bp-md) {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }

  &__item {
    position: relative;
    aspect-ratio: 4 / 3;
    border-radius: $yp-radius;
    overflow: hidden;
    background: $yp-surface-2;
    box-shadow: $yp-shadow-sm;

    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      display: block;
    }
  }

  &__badge {
    position: absolute;
    left: 8px;
    top: 8px;
    background: $yp-primary;
    color: #fff;
    font-size: 0.6875rem;
    font-weight: 700;
    padding: 2px 8px;
    border-radius: $yp-radius-pill;
  }

  &__order {
    position: absolute;
    right: 8px;
    top: 8px;
    min-width: 22px;
    height: 22px;
    padding: 0 6px;
    border-radius: $yp-radius-pill;
    background: rgba($yp-ink, 0.7);
    color: #fff;
    font-family: $yp-font-num;
    font-size: 0.75rem;
    font-weight: 600;
    display: grid;
    place-items: center;
  }

  &__controls {
    position: absolute;
    left: 0;
    right: 0;
    bottom: 0;
    display: flex;
    justify-content: center;
    gap: 6px;
    padding: 8px;
    background: linear-gradient(to top, rgba($yp-ink, 0.6), transparent);
  }

  &__btn {
    width: 32px;
    height: 32px;
    border: 0;
    border-radius: 50%;
    background: rgba(#fff, 0.92);
    color: $yp-ink;
    display: grid;
    place-items: center;
    font-size: 1.125rem;

    &:hover:not(:disabled) {
      background: $yp-primary-soft;
      color: $yp-primary-ink;
    }

    &:disabled {
      opacity: 0.45;
      cursor: not-allowed;
    }

    &--danger:hover:not(:disabled) {
      background: $yp-danger-soft;
      color: $yp-danger;
    }
  }

  &__add {
    aspect-ratio: 4 / 3;
    border: 2px dashed $yp-line;
    border-radius: $yp-radius;
    background: $yp-bg;
    color: $yp-muted;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 4px;
    font-size: 0.875rem;
    transition:
      border-color 0.15s ease,
      background-color 0.15s ease;

    :deep(.icon),
    svg {
      font-size: 24px;
    }

    &:hover:not(:disabled) {
      border-color: $yp-primary;
      background: $yp-primary-soft;
      color: $yp-primary-ink;
    }

    &:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
  }
}

.owner-images-empty {
  padding: 24px 16px;
  border: 1px dashed $yp-line;
  border-radius: $yp-radius;
  background: $yp-bg;

  .yp-empty__text {
    margin-bottom: 14px;
  }
}

// 特色複選
.owner-checks {
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

.owner-check {
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

.owner-available {
  padding: 14px 16px;
  border-radius: $yp-radius;
  background: $yp-surface-2;

  .form-check {
    min-height: 32px;
    display: flex;
    align-items: center;
    gap: 10px;
    padding-left: 0;
  }

  .form-check-input {
    float: none;
    margin: 0;
    flex: none;
    width: 2.5em;
    height: 1.4em;
  }
}

// Toast
.owner-toast {
  display: flex;
  align-items: center;
  gap: 10px;
  max-width: calc(100vw - 32px);
  padding: 10px 12px 10px 16px;
  border-left: 4px solid $yp-primary;

  &--success {
    border-left-color: $yp-success;
  }

  &--error {
    border-left-color: $yp-danger;
  }

  &__icon {
    flex: none;
    font-size: 1.25rem;
    color: $yp-primary;
  }

  &--success &__icon {
    color: $yp-success;
  }

  &--error &__icon {
    color: $yp-danger;
  }

  &__text {
    min-width: 0;
    overflow-wrap: anywhere;
  }

  &__close {
    flex: none;
    border: 0;
    background: transparent;
    color: rgba(#fff, 0.7);
    display: grid;
    place-items: center;
    padding: 4px;
    border-radius: 50%;

    &:hover {
      color: #fff;
      background: rgba(#fff, 0.15);
    }
  }
}

.toast-enter-active,
.toast-leave-active {
  transition:
    opacity 0.25s ease,
    transform 0.25s ease;
}

.toast-enter-from,
.toast-leave-to {
  opacity: 0;
  transform: translateX(-50%) translateY(12px);
}
</style>
