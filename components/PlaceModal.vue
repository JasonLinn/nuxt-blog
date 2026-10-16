<template>
  <div class="pm-overlay" @click.self="$emit('close')">
    <div class="pm-dialog" role="dialog" aria-modal="true" aria-labelledby="place-modal-title">
      <!-- 模態框標題 -->
      <div class="pm-header">
        <h2 id="place-modal-title" class="pm-title">
          <span class="pm-title__icon">
            <Icon :name="isEditing ? 'ri:edit-line' : 'ri:add-line'" />
          </span>
          {{ isEditing ? '編輯地點' : '新增地點' }}
        </h2>
        <button
          type="button"
          class="btn btn-ghost btn-icon pm-close"
          aria-label="關閉"
          @click="$emit('close')"
        >
          <Icon name="ri:close-line" />
        </button>
      </div>

      <form class="pm-form" @submit.prevent="handleSubmit">
        <!-- 模態框內容 -->
        <div class="pm-body">
          <!-- Google Maps 搜尋 -->
          <section class="pm-section">
            <h3 class="pm-section__title">
              <Icon name="ri:map-pin-line" />
              Google Maps 搜尋
            </h3>

            <div class="yp-search pm-search">
              <div class="yp-search__field">
                <Icon name="ri:search-line" class="yp-search__icon" aria-hidden="true" />
                <input
                  ref="googleSearchInput"
                  v-model="searchQuery"
                  type="text"
                  placeholder="搜尋地點名稱或地址..."
                  class="yp-search__input"
                  aria-label="搜尋 Google 地點"
                  @input="handleSearchInput"
                />
                <button
                  v-if="searchQuery"
                  type="button"
                  class="yp-search__clear"
                  aria-label="清除搜尋"
                  @click="clearSearch"
                >
                  <Icon name="ri:close-line" />
                </button>
              </div>
            </div>

            <!-- 搜尋結果 -->
            <div v-if="searchResults.length > 0" class="pm-results">
              <button
                v-for="result in searchResults"
                :key="result.place_id"
                type="button"
                class="pm-result"
                @click="selectGooglePlace(result)"
              >
                <span class="pm-result__content">
                  <span class="pm-result__name">{{ result.name }}</span>
                  <span class="pm-result__address">{{ result.formatted_address }}</span>
                  <span class="pm-result__meta">
                    <span v-if="result.rating" class="pm-result__rating">
                      <Icon name="ri:star-fill" />
                      {{ result.rating }}
                    </span>
                    <span v-if="result.types" class="pm-result__types">
                      {{ result.types.slice(0, 2).join(', ') }}
                    </span>
                  </span>
                </span>
                <Icon name="ri:arrow-right-s-line" class="pm-result__arrow" />
              </button>
            </div>

            <!-- 載入中 -->
            <div v-if="searching" class="pm-search-state" role="status">
              <span class="spinner-border spinner-border-sm text-primary" aria-hidden="true"></span>
              <span>搜尋中...</span>
            </div>

            <!-- 無結果 -->
            <div
              v-if="searchQuery && !searching && searchResults.length === 0"
              class="pm-search-state"
            >
              <Icon name="ri:map-pin-line" />
              <span>找不到相關地點</span>
            </div>
          </section>

          <!-- 基本資訊 -->
          <section class="pm-section">
            <h3 class="pm-section__title">基本資訊</h3>

            <div class="row g-3">
              <div class="col-md-6">
                <label class="form-label required" for="pm-name">地點名稱</label>
                <input
                  id="pm-name"
                  v-model="formData.name"
                  type="text"
                  class="form-control"
                  required
                  placeholder="請輸入地點名稱"
                />
              </div>

              <div class="col-md-6">
                <label class="form-label required" for="pm-category">分類</label>
                <select
                  id="pm-category"
                  v-model="formData.category_id"
                  class="form-select"
                  required
                >
                  <option value="">請選擇分類</option>
                  <option v-for="category in categories" :key="category.id" :value="category.id">
                    {{ category.name }}
                  </option>
                </select>
              </div>

              <div class="col-12">
                <label class="form-label" for="pm-description">地點描述</label>
                <textarea
                  id="pm-description"
                  v-model="formData.description"
                  class="form-control"
                  rows="3"
                  placeholder="請描述這個地點的特色、介紹等..."
                ></textarea>
              </div>
            </div>
          </section>

          <!-- 地址資訊 -->
          <section class="pm-section">
            <h3 class="pm-section__title">地址資訊</h3>

            <div class="row g-3">
              <div class="col-12">
                <label class="form-label" for="pm-address">完整地址</label>
                <input
                  id="pm-address"
                  v-model="formData.formatted_address"
                  type="text"
                  class="form-control"
                  placeholder="完整地址"
                  readonly
                />
              </div>

              <div class="col-md-6">
                <label class="form-label required" for="pm-lat">緯度</label>
                <input
                  id="pm-lat"
                  v-model.number="formData.latitude"
                  type="number"
                  step="any"
                  class="form-control"
                  required
                  placeholder="例如: 24.8021"
                />
              </div>

              <div class="col-md-6">
                <label class="form-label required" for="pm-lng">經度</label>
                <input
                  id="pm-lng"
                  v-model.number="formData.longitude"
                  type="number"
                  step="any"
                  class="form-control"
                  required
                  placeholder="例如: 121.5654"
                />
              </div>

              <div class="col-md-6">
                <label class="form-label" for="pm-locality">城市</label>
                <input
                  id="pm-locality"
                  v-model="formData.locality"
                  type="text"
                  class="form-control"
                  placeholder="城市"
                />
              </div>

              <div class="col-md-6">
                <label class="form-label" for="pm-admin-area">縣市</label>
                <input
                  id="pm-admin-area"
                  v-model="formData.administrative_area_level_1"
                  type="text"
                  class="form-control"
                  placeholder="縣市"
                />
              </div>
            </div>
          </section>

          <!-- 聯絡資訊 -->
          <section class="pm-section">
            <h3 class="pm-section__title">聯絡資訊</h3>

            <div class="row g-3">
              <div class="col-md-6">
                <label class="form-label" for="pm-phone">電話號碼</label>
                <input
                  id="pm-phone"
                  v-model="formData.phone_number"
                  type="tel"
                  class="form-control"
                  placeholder="例如: 03-1234567"
                />
              </div>

              <div class="col-md-6">
                <label class="form-label" for="pm-website">網站</label>
                <input
                  id="pm-website"
                  v-model="formData.website"
                  type="url"
                  class="form-control"
                  placeholder="https://example.com"
                />
              </div>
            </div>
          </section>

          <!-- 額外資訊 -->
          <section class="pm-section">
            <h3 class="pm-section__title">額外資訊</h3>

            <div class="row g-3">
              <div class="col-md-6">
                <label class="form-label" for="pm-rating">評分</label>
                <input
                  id="pm-rating"
                  v-model.number="formData.rating"
                  type="number"
                  step="0.1"
                  min="0"
                  max="5"
                  class="form-control"
                  placeholder="0.0 - 5.0"
                />
              </div>

              <div class="col-md-6">
                <label class="form-label" for="pm-price">價格等級</label>
                <select id="pm-price" v-model="formData.price_level" class="form-select">
                  <option value="">請選擇</option>
                  <option value="0">免費</option>
                  <option value="1">便宜 ($)</option>
                  <option value="2">中等 ($$)</option>
                  <option value="3">昂貴 ($$$)</option>
                  <option value="4">非常昂貴 ($$$$)</option>
                </select>
              </div>

              <div class="col-12">
                <label class="form-label" for="pm-duration">建議停留時間（分鐘）</label>
                <input
                  id="pm-duration"
                  v-model.number="formData.recommended_duration"
                  type="number"
                  min="15"
                  step="15"
                  class="form-control"
                  placeholder="例如: 60"
                />
              </div>

              <div class="col-12">
                <label class="form-label" for="pm-tips">遊玩小貼士</label>
                <textarea
                  id="pm-tips"
                  v-model="formData.tips"
                  class="form-control"
                  rows="3"
                  placeholder="分享一些遊玩建議或注意事項..."
                ></textarea>
              </div>
            </div>
          </section>

          <!-- 圖片上傳 -->
          <section class="pm-section">
            <h3 class="pm-section__title">地點圖片</h3>
            <p class="pm-section__desc">
              選擇 Google 地點後會自動載入前三張圖片，您也可以上傳自己的圖片
            </p>

            <!-- 檔案上傳 -->
            <div
              class="yp-upload"
              role="button"
              tabindex="0"
              @click="triggerFileInput"
              @keydown.enter.prevent="triggerFileInput"
              @keydown.space.prevent="triggerFileInput"
            >
              <Icon name="ri:upload-cloud-2-line" class="pm-upload__icon" />
              <p class="pm-upload__title">點擊上傳圖片</p>
              <span class="pm-upload__hint">支援 JPG、PNG 格式，最大 5MB</span>
              <input
                ref="fileInput"
                type="file"
                accept="image/*"
                multiple
                class="d-none"
                @change="handleFileUpload"
              />
            </div>

            <!-- 圖片預覽 -->
            <div v-if="formData.images && formData.images.length > 0" class="pm-previews">
              <div v-for="(image, index) in formData.images" :key="index" class="pm-preview">
                <img :src="image" :alt="`圖片 ${index + 1}`" />

                <!-- Google 圖片標識 -->
                <span v-if="isGoogleImage(image)" class="pm-preview__badge">
                  <Icon name="ri:map-pin-line" />
                  Google
                </span>

                <button
                  type="button"
                  class="pm-preview__remove"
                  :aria-label="`移除圖片 ${index + 1}`"
                  @click="removeImage(index)"
                >
                  <Icon name="ri:close-line" />
                </button>
              </div>
            </div>
          </section>

          <!-- 設定選項 -->
          <section class="pm-section">
            <h3 class="pm-section__title">設定選項</h3>

            <div class="form-check mb-2">
              <input
                id="pm-featured"
                v-model="formData.is_featured"
                type="checkbox"
                class="form-check-input"
              />
              <label class="form-check-label" for="pm-featured">
                <Icon name="ri:star-line" class="pm-check__icon" />
                設為精選地點
              </label>
            </div>

            <div class="form-check mb-3">
              <input
                id="pm-private"
                v-model="formData.is_private"
                type="checkbox"
                class="form-check-input"
              />
              <label class="form-check-label" for="pm-private">
                <Icon name="ri:lock-line" class="pm-check__icon" />
                私房景點
              </label>
            </div>

            <label class="form-label" for="pm-status">狀態</label>
            <select id="pm-status" v-model="formData.status" class="form-select">
              <option value="pending">待審核</option>
              <option value="approved">已審核</option>
              <option value="rejected">已拒絕</option>
            </select>
          </section>
        </div>

        <!-- 表單操作 -->
        <div class="pm-footer">
          <button type="button" class="btn btn-outline-secondary" @click="$emit('close')">
            取消
          </button>
          <button type="submit" :disabled="saving" class="btn btn-primary btn-icon">
            <span v-if="saving" class="spinner-border spinner-border-sm" aria-hidden="true"></span>
            <Icon v-else :name="isEditing ? 'ri:save-line' : 'ri:add-line'" />
            {{ saving ? '儲存中...' : isEditing ? '更新地點' : '新增地點' }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, nextTick } from 'vue'

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
})

const emit = defineEmits(['close', 'saved'])

// 計算屬性
const isEditing = computed(() => !!props.place)

// 狀態管理
const saving = ref(false)
const searching = ref(false)
const searchQuery = ref('')
const searchResults = ref([])
const searchTimeout = ref(null)

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
})

// 引用
const fileInput = ref(null)
const googleSearchInput = ref(null)

// Google Maps 相關函數
const handleSearchInput = () => {
  if (searchTimeout.value) {
    clearTimeout(searchTimeout.value)
  }

  searchTimeout.value = setTimeout(() => {
    if (searchQuery.value.trim().length >= 2) {
      searchGooglePlaces()
    } else {
      searchResults.value = []
    }
  }, 500)
}

const searchGooglePlaces = async () => {
  try {
    searching.value = true
    searchResults.value = []

    const response = await $fetch('/api/google/places/search', {
      method: 'POST',
      body: {
        query: searchQuery.value,
        location: '24.8021,121.5654', // 預設台北座標
        radius: 50000 // 50km 範圍
      }
    })

    if (response.success) {
      searchResults.value = response.data
    }
  } catch (error) {
    console.error('搜尋地點失敗:', error)
  } finally {
    searching.value = false
  }
}

const selectGooglePlace = async (place) => {
  try {
    // 獲取詳細資訊
    const response = await $fetch('/api/google/places/details', {
      method: 'POST',
      body: {
        place_id: place.place_id
      }
    })

    if (response.success) {
      const details = response.data

      // 填充表單資料
      formData.name = details.name || ''
      formData.formatted_address = details.formatted_address || ''
      formData.latitude = details.geometry?.location?.lat || null
      formData.longitude = details.geometry?.location?.lng || null
      formData.phone_number = details.formatted_phone_number || ''
      formData.website = details.website || ''
      formData.rating = details.rating || null
      formData.price_level = details.price_level ?? ''
      formData.google_place_id = details.place_id
      formData.photos = details.photos || []

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
              })

              if (photoResponse.success && photoResponse.url) {
                return photoResponse.url
              }
            } catch (error) {
              console.error('獲取照片失敗:', error)
            }
            return null
          })
        )

        // 過濾掉失敗的請求，只保留成功的圖片 URL
        const validPhotoUrls = photoUrls.filter((url) => url !== null)

        // 將 Google 圖片 URL 添加到現有的圖片陣列中（如果有的話）
        formData.images = [...(formData.images || []), ...validPhotoUrls]

        console.log(`已自動載入 ${validPhotoUrls.length} 張 Google 圖片`)
      }

      // 解析地址組件
      if (details.address_components) {
        details.address_components.forEach((component) => {
          const types = component.types
          if (types.includes('locality')) {
            formData.locality = component.long_name
          }
          if (types.includes('administrative_area_level_1')) {
            formData.administrative_area_level_1 = component.long_name
          }
        })
      }

      // 清除搜尋
      clearSearch()
    }
  } catch (error) {
    console.error('獲取地點詳情失敗:', error)
  }
}

const clearSearch = () => {
  searchQuery.value = ''
  searchResults.value = []
}

// 圖片處理函數
const triggerFileInput = () => {
  if (fileInput.value) {
    fileInput.value.click()
  }
}

const handleFileUpload = async (event) => {
  const files = event.target.files
  if (!files.length) return

  for (const file of files) {
    try {
      // 驗證檔案
      if (!file.type.startsWith('image/')) {
        alert('請選擇圖片檔案')
        continue
      }

      if (file.size > 5 * 1024 * 1024) {
        alert('圖片檔案不能超過 5MB')
        continue
      }

      // 上傳檔案
      const uploadBody = new FormData()
      uploadBody.append('file', file)

      const response = await $fetch('/api/upload', {
        method: 'POST',
        body: uploadBody
      })

      if (response.success) {
        formData.images.push(response.url)
      }
    } catch (error) {
      console.error('上傳圖片失敗:', error)
      alert('上傳圖片失敗，請重試')
    }
  }

  // 清空檔案輸入
  event.target.value = ''
}

// 判斷圖片是否來自 Google Places
const isGoogleImage = (imageUrl) => {
  return imageUrl && imageUrl.includes('maps.googleapis.com')
}

const removeImage = (index) => {
  formData.images.splice(index, 1)
}

// 表單提交
const handleSubmit = async () => {
  try {
    saving.value = true

    const url = isEditing.value ? `/api/admin/places/${props.place.id}` : '/api/admin/places'

    const method = isEditing.value ? 'PUT' : 'POST'

    const response = await $fetch(url, {
      method,
      body: { ...formData }
    })

    if (response.success) {
      emit('saved')
    }
  } catch (error) {
    console.error('儲存地點失敗:', error)
    alert('儲存失敗，請重試')
  } finally {
    saving.value = false
  }
}

// 初始化表單資料
const initializeForm = () => {
  if (props.place) {
    Object.keys(formData).forEach((key) => {
      if (props.place[key] !== undefined) {
        formData[key] = props.place[key]
      }
    })

    // 確保陣列欄位的正確格式
    formData.images = props.place.images || []
    formData.photos = props.place.photos || []
  }
}

// 組件掛載
onMounted(() => {
  initializeForm()

  // 聚焦到搜尋框
  nextTick(() => {
    if (googleSearchInput.value) {
      googleSearchInput.value.focus()
    }
  })
})
</script>

<style lang="scss" scoped>
// 自製 modal：視覺與 Bootstrap modal 一致（白底、16px 圓角、陰影、遮罩 rgba(19,48,58,.45)）
.pm-overlay {
  position: fixed;
  inset: 0;
  z-index: 1090;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  background: rgba(19, 48, 58, 0.45);

  @media (max-width: #{$yp-bp-md - 1px}) {
    padding: 12px;
  }
}

.pm-dialog {
  display: flex;
  flex-direction: column;
  width: 100%;
  max-width: 800px;
  max-height: 100%;
  overflow: hidden;
  background: $yp-surface;
  border-radius: $yp-radius-lg;
  box-shadow: $yp-shadow-lg;
}

.pm-header {
  display: flex;
  flex: none;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 16px 20px;
  border-bottom: 1px solid $yp-line;

  @media (min-width: $yp-bp-md) {
    padding: 20px 24px;
  }
}

.pm-title {
  display: flex;
  align-items: center;
  gap: 12px;
  margin: 0;
  color: $yp-ink;
  font-size: 1.25rem;
  font-weight: 700;

  &__icon {
    display: grid;
    width: 36px;
    height: 36px;
    place-items: center;
    border-radius: $yp-radius-sm;
    background: $yp-primary-soft;
    color: $yp-primary-ink;
    font-size: 20px;
  }
}

.pm-close {
  width: 40px;
  height: 40px;
  padding: 0;
  font-size: 22px;
}

.pm-form {
  display: flex;
  flex: 1;
  flex-direction: column;
  min-height: 0;
}

.pm-body {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
}

.pm-section {
  padding: 20px;
  border-bottom: 1px solid $yp-line;

  @media (min-width: $yp-bp-md) {
    padding: 24px;
  }

  &__title {
    display: flex;
    align-items: center;
    gap: 8px;
    margin: 0 0 16px;
    color: $yp-ink;
    font-size: 1.0625rem;
    font-weight: 700;

    :deep(svg) {
      color: $yp-primary;
      font-size: 20px;
    }
  }

  &__desc {
    margin: -8px 0 16px;
    color: $yp-muted;
    font-size: 0.875rem;
  }
}

.form-label {
  font-size: 0.875rem;
  font-weight: 700;
  color: $yp-ink;
}

.form-control[readonly] {
  background: $yp-surface-2;
  color: $yp-muted;
}

.form-check-label {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-weight: 500;
}

.pm-check__icon {
  color: $yp-muted;
  font-size: 16px;
}

// ───── Google 搜尋 ─────
.pm-search {
  box-shadow: none;
  border: 1px solid $yp-line;
  border-radius: $yp-radius;

  &:focus-within {
    border-color: $yp-primary;
    box-shadow: 0 0 0 3px rgba($yp-primary, 0.15);
  }
}

.pm-results {
  max-height: 300px;
  margin-top: 10px;
  overflow-y: auto;
  border: 1px solid $yp-line;
  border-radius: $yp-radius;
  background: $yp-surface;
}

.pm-result {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  padding: 12px 16px;
  border: 0;
  border-bottom: 1px solid $yp-line;
  background: transparent;
  color: $yp-ink;
  text-align: left;
  transition: background-color 0.15s ease;

  &:last-child {
    border-bottom: 0;
  }

  &:hover,
  &:focus-visible {
    background: $yp-primary-soft;
  }

  &__content {
    display: flex;
    flex: 1;
    min-width: 0;
    flex-direction: column;
    gap: 2px;
  }

  &__name {
    font-weight: 700;
  }

  &__address {
    color: $yp-muted;
    font-size: 0.875rem;
  }

  &__meta {
    display: flex;
    gap: 12px;
    font-size: 0.75rem;
  }

  &__rating {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    color: $yp-warning;
  }

  &__types {
    color: $yp-subtle;
  }

  &__arrow {
    flex: none;
    color: $yp-subtle;
    font-size: 20px;
  }
}

.pm-search-state {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  margin-top: 10px;
  padding: 18px;
  border: 1px dashed $yp-line;
  border-radius: $yp-radius;
  color: $yp-muted;
  font-size: 0.875rem;
}

// ───── 圖片上傳 ─────
.pm-upload {
  &__icon {
    margin-bottom: 8px;
    color: $yp-primary;
    font-size: 40px;
  }

  &__title {
    margin: 0 0 2px;
    color: $yp-ink;
    font-weight: 700;
  }

  &__hint {
    font-size: 0.875rem;
  }
}

.pm-previews {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(112px, 1fr));
  gap: 12px;
  margin-top: 16px;
}

.pm-preview {
  position: relative;
  aspect-ratio: 1;
  overflow: hidden;
  border-radius: $yp-radius-sm;
  background: $yp-surface-2;

  img {
    display: block;
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  &__remove {
    position: absolute;
    top: 6px;
    right: 6px;
    display: grid;
    width: 28px;
    height: 28px;
    place-items: center;
    padding: 0;
    border: 0;
    border-radius: 50%;
    background: rgba($yp-ink, 0.72);
    color: #fff;
    font-size: 16px;

    &:hover {
      background: $yp-danger;
    }
  }

  &__badge {
    position: absolute;
    bottom: 6px;
    left: 6px;
    display: inline-flex;
    align-items: center;
    gap: 2px;
    padding: 2px 8px;
    border-radius: $yp-radius-pill;
    background: rgba($yp-ink, 0.72);
    color: #fff;
    font-size: 0.6875rem;
    font-weight: 500;
  }
}

// ───── 底部操作列 ─────
.pm-footer {
  display: flex;
  flex: none;
  justify-content: flex-end;
  gap: 8px;
  padding: 14px 20px;
  border-top: 1px solid $yp-line;
  background: $yp-bg;

  @media (min-width: $yp-bp-md) {
    padding: 16px 24px;
  }

  @media (max-width: #{$yp-bp-md - 1px}) {
    .btn {
      flex: 1;
    }
  }
}
</style>
