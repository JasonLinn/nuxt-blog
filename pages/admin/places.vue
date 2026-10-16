<template>
  <div>
    <!-- 載入中狀態 -->
    <div v-if="loading">
      <div class="yp-admin-head">
        <div class="d-grid gap-2" style="width: 220px">
          <span class="yp-skeleton" style="height: 28px; width: 60%"></span>
          <span class="yp-skeleton" style="height: 14px"></span>
        </div>
      </div>
      <div class="yp-admin-stats">
        <span
          v-for="n in 4"
          :key="n"
          class="yp-skeleton"
          style="height: 84px; border-radius: 16px"
        ></span>
      </div>
      <div class="yp-table-wrap d-grid gap-2 p-3">
        <span v-for="n in 5" :key="n" class="yp-skeleton" style="height: 64px"></span>
      </div>
    </div>

    <!-- 主要內容 -->
    <div v-else>
      <!-- 頁面標題 -->
      <header class="yp-admin-head">
        <div>
          <h1 class="yp-admin-head__title">地點管理</h1>
          <p class="yp-admin-head__desc">管理網站中的所有地點資訊</p>
        </div>

        <div class="yp-admin-head__actions">
          <button type="button" class="btn btn-soft btn-icon" @click="showBatchAddModal = true">
            <Icon name="ri:play-list-add-line" /> 批次新增
          </button>
          <button type="button" class="btn btn-primary btn-icon" @click="showAddModal = true">
            <Icon name="ri:add-line" /> 新增地點
          </button>
        </div>
      </header>

      <!-- 統計資訊 -->
      <div v-if="totalPlaces" class="yp-admin-stats">
        <div class="yp-stat-card yp-stat-card--primary">
          <p class="yp-stat-card__label">總地點數</p>
          <p class="yp-stat-card__value">{{ totalPlaces }}</p>
        </div>
        <div class="yp-stat-card yp-stat-card--success">
          <p class="yp-stat-card__label">已審核</p>
          <p class="yp-stat-card__value">{{ approvedPlaces }}</p>
        </div>
        <div class="yp-stat-card yp-stat-card--warning">
          <p class="yp-stat-card__label">待審核</p>
          <p class="yp-stat-card__value">{{ pendingPlaces }}</p>
        </div>
        <div class="yp-stat-card">
          <p class="yp-stat-card__label">精選地點</p>
          <p class="yp-stat-card__value">{{ featuredPlaces }}</p>
        </div>
      </div>

      <!-- 篩選器 -->
      <div class="yp-filter-bar">
        <div class="places-search yp-filter-bar__search">
          <Icon name="ri:search-line" class="places-search__icon" />
          <input
            v-model="filters.search"
            type="search"
            placeholder="搜尋地點名稱或地址..."
            class="form-control"
            aria-label="搜尋"
          />
        </div>
        <select v-model="filters.category" class="form-select" aria-label="分類">
          <option value="">全部分類</option>
          <option v-for="category in categories" :key="category.id" :value="category.id">
            {{ category.name }}
          </option>
        </select>
        <select v-model="filters.status" class="form-select" aria-label="狀態">
          <option value="">全部狀態</option>
          <option value="pending">待審核</option>
          <option value="approved">已審核</option>
          <option value="rejected">已拒絕</option>
        </select>
        <button type="button" class="btn btn-ghost btn-icon" @click="resetFilters">
          <Icon name="ri:refresh-line" /> 重置篩選
        </button>
      </div>

      <!-- 地點列表 -->
      <div class="yp-table-wrap">
        <div v-if="filteredPlaces.length > 0" class="table-responsive">
          <table class="table-hover yp-table-stack table align-middle">
            <thead>
              <tr>
                <th style="width: 72px"></th>
                <th>地點</th>
                <th>分類</th>
                <th>狀態</th>
                <th>瀏覽</th>
                <th>建立日期</th>
                <th class="text-end">操作</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="place in paginatedPlaces" :key="place.id">
                <td class="places-thumb-cell">
                  <img
                    :src="getPlaceImage(place)"
                    :alt="place.name"
                    class="yp-table-thumb"
                    loading="lazy"
                    @error="handleImageError"
                  />
                </td>
                <td data-label="地點">
                  <div class="places-name">
                    <div class="fw-bold">{{ place.name }}</div>
                    <div class="small text-muted yp-clamp-1">
                      {{ place.formatted_address || '地址未提供' }}
                    </div>
                    <div v-if="place.rating" class="small text-muted">
                      <Icon name="ri:star-fill" class="text-warning" />
                      {{ place.rating }} ({{ place.user_ratings_total || 0 }} 評論)
                    </div>
                  </div>
                </td>
                <td data-label="分類">
                  <span class="d-inline-flex align-items-center gap-1">
                    <Icon :name="getCategoryIcon(place.category_id)" class="text-primary" />
                    {{ getCategoryName(place.category_id) }}
                  </span>
                </td>
                <td data-label="狀態">
                  <div class="d-flex justify-content-end justify-content-md-start flex-wrap gap-1">
                    <span class="yp-status" :class="`yp-status--${place.status}`">
                      {{ getStatusText(place.status) }}
                    </span>
                    <span v-if="place.is_featured" class="yp-tag yp-tag--warning">
                      <Icon name="ri:star-fill" /> 精選
                    </span>
                    <span v-if="place.is_private" class="yp-tag">
                      <Icon name="ri:lock-line" /> 私房
                    </span>
                  </div>
                </td>
                <td data-label="瀏覽" class="yp-num">{{ place.view_count || 0 }}</td>
                <td data-label="建立日期" class="small text-muted">
                  {{ formatDate(place.created_at) }}
                </td>
                <td data-label="操作">
                  <div class="yp-row-actions places-actions">
                    <button
                      type="button"
                      class="btn btn-sm btn-soft btn-icon"
                      @click="editPlace(place)"
                    >
                      <Icon name="ri:edit-line" /> 編輯
                    </button>
                    <button
                      v-if="place.status === 'pending'"
                      type="button"
                      class="btn btn-sm btn-primary btn-icon"
                      @click="approvePlace(place.id)"
                    >
                      <Icon name="ri:check-line" /> 審核通過
                    </button>
                    <button
                      type="button"
                      class="btn btn-sm btn-icon"
                      :class="place.is_featured ? 'btn-outline-secondary' : 'btn-outline-primary'"
                      @click="toggleFeatured(place.id, !place.is_featured)"
                    >
                      <Icon :name="place.is_featured ? 'ri:star-fill' : 'ri:star-line'" />
                      {{ place.is_featured ? '取消精選' : '設為精選' }}
                    </button>
                    <button
                      type="button"
                      class="btn btn-sm btn-outline-danger btn-icon"
                      aria-label="刪除"
                      @click="deletePlace(place.id)"
                    >
                      <Icon name="ri:delete-bin-line" /> 刪除
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- 空狀態 -->
        <div v-else class="yp-empty">
          <div class="yp-empty__icon"><Icon name="ri:map-pin-line" /></div>
          <h2 class="yp-empty__title">沒有找到地點</h2>
          <p class="yp-empty__text">嘗試調整篩選條件或新增第一個地點</p>
          <div class="d-flex justify-content-center gap-2">
            <button type="button" class="btn btn-soft btn-icon" @click="showBatchAddModal = true">
              <Icon name="ri:play-list-add-line" /> 批次新增
            </button>
            <button type="button" class="btn btn-primary btn-icon" @click="showAddModal = true">
              <Icon name="ri:add-line" /> 新增地點
            </button>
          </div>
        </div>

        <div v-if="filteredPlaces.length > 0" class="yp-table-wrap__footer">
          <span>共 {{ filteredPlaces.length }} 個地點</span>

          <!-- 分頁 -->
          <div v-if="totalPages > 1" class="yp-pager places-pager">
            <button
              type="button"
              class="yp-pager__btn"
              :class="{ 'is-disabled': currentPage <= 1 }"
              :disabled="currentPage <= 1"
              aria-label="上一頁"
              @click="currentPage = currentPage - 1"
            >
              <Icon name="ri:arrow-left-s-line" />
            </button>
            <span class="px-2">{{ currentPage }} / {{ totalPages }}</span>
            <button
              type="button"
              class="yp-pager__btn"
              :class="{ 'is-disabled': currentPage >= totalPages }"
              :disabled="currentPage >= totalPages"
              aria-label="下一頁"
              @click="currentPage = currentPage + 1"
            >
              <Icon name="ri:arrow-right-s-line" />
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 新增/編輯地點模態框 -->
    <PlaceModal
      v-if="showAddModal || showEditModal"
      :place="editingPlace"
      :categories="categories"
      @close="closeModal"
      @saved="handlePlaceSaved"
    />

    <!-- 批次新增地點模態框 -->
    <div v-if="showBatchAddModal" class="yp-modal-overlay" @click.self="closeBatchModal">
      <div class="yp-modal" role="dialog" aria-modal="true">
        <div class="yp-modal__header">
          <h2 class="yp-modal__title d-flex align-items-center gap-2">
            <Icon name="ri:play-list-add-line" class="text-primary" />
            批次新增地點
          </h2>
          <button
            type="button"
            class="btn-close"
            aria-label="關閉"
            @click="closeBatchModal"
          ></button>
        </div>

        <div class="yp-modal__body d-grid gap-3">
          <div class="alert alert-info d-flex align-items-center mb-0 gap-2">
            <Icon name="ri:information-line" class="fs-5 flex-none" />
            每行輸入一個地點名稱，系統將自動搜尋並新增這些地點
          </div>

          <div>
            <label class="form-label" for="batch-names">地點列表 (每行一個地點)</label>
            <textarea
              id="batch-names"
              v-model="batchPlaceNames"
              placeholder="請輸入地點名稱，每行一個，例如：&#10;台北101&#10;西門町&#10;淡水老街"
              class="form-control"
              rows="8"
            ></textarea>
            <div class="form-text">共 {{ batchPlaceCount }} 個地點</div>
          </div>

          <div>
            <label class="form-label" for="batch-category">預設分類</label>
            <select id="batch-category" v-model="batchDefaultCategory" class="form-select">
              <option value="">請選擇分類</option>
              <option v-for="category in categories" :key="category.id" :value="category.id">
                {{ category.name }}
              </option>
            </select>
          </div>

          <!-- 處理進度 -->
          <div v-if="batchProcessing">
            <div class="d-flex justify-content-between small mb-1">
              <span>處理進度：{{ batchProcessedCount }} / {{ batchTotalCount }}</span>
              <span class="yp-num"
                >{{ Math.round((batchProcessedCount / batchTotalCount) * 100) }}%</span
              >
            </div>
            <div class="progress" role="progressbar">
              <div
                class="progress-bar"
                :style="{ width: `${(batchProcessedCount / batchTotalCount) * 100}%` }"
              ></div>
            </div>
            <div v-if="currentProcessingPlace" class="small text-muted mt-1">
              正在處理：{{ currentProcessingPlace }}
            </div>
          </div>

          <!-- 處理結果 -->
          <div v-if="batchResults.length > 0">
            <div class="fw-bold mb-2">處理結果</div>
            <ul class="batch-results">
              <li
                v-for="result in batchResults"
                :key="result.name"
                :class="result.success ? 'is-success' : 'is-error'"
              >
                <Icon
                  :name="result.success ? 'ri:checkbox-circle-fill' : 'ri:error-warning-fill'"
                  class="flex-none"
                />
                <span class="fw-bold">{{ result.name }}</span>
                <span class="text-muted">{{ result.message }}</span>
              </li>
            </ul>
          </div>
        </div>

        <div class="yp-modal__footer gap-2">
          <button type="button" class="btn btn-ghost" @click="closeBatchModal">取消</button>
          <button
            type="button"
            class="btn btn-primary btn-icon"
            :disabled="!batchPlaceNames.trim() || batchProcessing"
            @click="processBatchAdd"
          >
            <span v-if="batchProcessing" class="spinner-border spinner-border-sm"></span>
            <Icon v-else name="ri:add-line" />
            {{ batchProcessing ? '處理中...' : `新增 ${batchPlaceCount} 個地點` }}
          </button>
        </div>
      </div>
    </div>

    <!-- Toast 提示 -->
    <Transition name="toast">
      <div
        v-if="toast.show"
        class="yp-toast places-toast"
        :class="`is-${toast.type}`"
        role="status"
      >
        <Icon
          :name="toast.type === 'success' ? 'ri:checkbox-circle-fill' : 'ri:error-warning-fill'"
          class="fs-5 flex-none"
        />
        <span>{{ toast.message }}</span>
        <button type="button" class="places-toast__close" aria-label="關閉" @click="hideToast">
          <Icon name="ri:close-line" />
        </button>
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import PlaceModal from '~/components/PlaceModal.vue'

// 取得運行時配置
const config = useRuntimeConfig()

definePageMeta({
  layout: 'admin',
  middleware: ['admin-auth']
})

// SEO 設定
useHead({
  title: '地點管理 - 管理後台',
  meta: [{ name: 'robots', content: 'noindex, nofollow' }]
})

// 狀態管理
const loading = ref(true)
const places = ref([])
const categories = ref([])
const showAddModal = ref(false)
const showEditModal = ref(false)
const editingPlace = ref(null)

// 批次新增相關狀態
const showBatchAddModal = ref(false)
const batchPlaceNames = ref('')
const batchDefaultCategory = ref('')
const batchProcessing = ref(false)
const batchProcessedCount = ref(0)
const batchTotalCount = ref(0)
const currentProcessingPlace = ref('')
const batchResults = ref([])

// 篩選器
const filters = ref({
  category: '',
  status: '',
  search: ''
})

// 分頁
const currentPage = ref(1)
const itemsPerPage = 12

// Toast 提示
const toast = ref({
  show: false,
  type: 'success',
  message: ''
})

// 計算屬性
const totalPlaces = computed(() => places.value.length)
const approvedPlaces = computed(() => places.value.filter((p) => p.status === 'approved').length)
const pendingPlaces = computed(() => places.value.filter((p) => p.status === 'pending').length)
const featuredPlaces = computed(() => places.value.filter((p) => p.is_featured).length)

// 批次新增計算屬性
const batchPlaceCount = computed(() => {
  if (!batchPlaceNames.value.trim()) return 0
  return batchPlaceNames.value
    .trim()
    .split('\n')
    .filter((name) => name.trim()).length
})

const filteredPlaces = computed(() => {
  let filtered = places.value

  // 分類篩選
  if (filters.value.category) {
    filtered = filtered.filter((p) => String(p.category_id) === String(filters.value.category))
  }

  // 狀態篩選
  if (filters.value.status) {
    filtered = filtered.filter((p) => p.status === filters.value.status)
  }

  // 搜尋篩選
  if (filters.value.search) {
    const search = filters.value.search.toLowerCase()
    filtered = filtered.filter(
      (p) =>
        p.name.toLowerCase().includes(search) ||
        (p.formatted_address && p.formatted_address.toLowerCase().includes(search))
    )
  }

  return filtered
})

const totalPages = computed(() => Math.ceil(filteredPlaces.value.length / itemsPerPage))

const paginatedPlaces = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage
  const end = start + itemsPerPage
  return filteredPlaces.value.slice(start, end)
})

// 載入資料
const loadPlaces = async () => {
  try {
    console.log('Google Maps API Key:', config.public.GOOGLE_MAPS_API_KEY ? 'Set' : 'Not set')
    const response = await $fetch('/api/admin/places')
    if (response.success) {
      places.value = response.data
      console.log('Loaded places:', response.data.length)
      console.log('First place photos:', response.data[0]?.photos)
    }
  } catch (error) {
    console.error('載入地點失敗:', error)
    showToast('載入地點失敗', 'error')
  }
}

const loadCategories = async () => {
  try {
    const response = await $fetch('/api/admin/place-categories')
    if (response.success) {
      categories.value = response.data
    }
  } catch (error) {
    console.error('載入分類失敗:', error)
  }
}

// 輔助函數
const getPlaceImage = (place) => {
  console.log('getPlaceImage called with place:', {
    name: place.name,
    hasPhotos: !!(place.photos && place.photos.length > 0),
    photosLength: place.photos?.length || 0,
    firstPhoto: place.photos?.[0]
  })

  if (place.photos && place.photos.length > 0) {
    const photo = place.photos[0]

    // 新格式：直接的圖片 URL（用戶推薦時自動載入的照片）
    if (typeof photo === 'string' && photo.startsWith('http')) {
      console.log('Using direct photo URL:', photo)
      return photo
    }

    // 舊格式：包含 photo_reference 的物件（Google Places API 原始格式）
    if (photo && photo.photo_reference) {
      const apiKey = config.public.GOOGLE_MAPS_API_KEY
      if (apiKey) {
        const googleImageUrl = `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photoreference=${photo.photo_reference}&key=${apiKey}`
        console.log('Using Google photo URL with reference:', googleImageUrl)
        return googleImageUrl
      } else {
        console.warn('Google Maps API Key not found')
      }
    }

    console.warn('Invalid photo format:', photo)
  }

  // 檢查原始 photos 字串，處理可能的直接 URL 格式
  if (typeof place.photos === 'string' && place.photos.startsWith('http')) {
    // 處理多個 URL 以逗號分隔的情況
    const urls = place.photos
      .split(',')
      .map((url) => url.trim())
      .filter((url) => url.startsWith('http'))
    if (urls.length > 0) {
      console.log('Using first URL from comma-separated string:', urls[0])
      return urls[0]
    }
  }

  console.log('Using placeholder image')
  return '/images/place-placeholder.svg'
}

const handleImageError = (event) => {
  event.target.src = '/images/place-placeholder.svg'
}

const getCategoryName = (categoryId) => {
  const category = categories.value.find((c) => c.id === categoryId)
  return category ? category.name : '未分類'
}

const getCategoryIcon = (categoryId) => {
  const category = categories.value.find((c) => c.id === categoryId)
  return category ? category.icon : 'mdi:map-marker'
}

const getStatusText = (status) => {
  const statusMap = {
    pending: '待審核',
    approved: '已審核',
    rejected: '已拒絕'
  }
  return statusMap[status] || status
}

const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString('zh-TW')
}

// 操作函數
const editPlace = (place) => {
  editingPlace.value = { ...place }
  showEditModal.value = true
}

const approvePlace = async (placeId) => {
  try {
    const response = await $fetch(`/api/admin/places/${placeId}/approve`, {
      method: 'POST'
    })

    if (response.success) {
      await loadPlaces()
      showToast('地點已審核通過', 'success')
    }
  } catch (error) {
    console.error('審核失敗:', error)
    showToast('審核失敗', 'error')
  }
}

const toggleFeatured = async (placeId, featured) => {
  try {
    const response = await $fetch(`/api/admin/places/${placeId}/featured`, {
      method: 'PUT',
      body: { is_featured: featured }
    })

    if (response.success) {
      await loadPlaces()
      showToast(featured ? '已設為精選地點' : '已取消精選', 'success')
    }
  } catch (error) {
    console.error('更新精選狀態失敗:', error)
    showToast('更新失敗', 'error')
  }
}

const deletePlace = async (placeId) => {
  if (!confirm('確定要刪除這個地點嗎？此操作無法復原。')) {
    return
  }

  try {
    const response = await $fetch(`/api/admin/places/${placeId}`, {
      method: 'DELETE'
    })

    if (response.success) {
      await loadPlaces()
      showToast('地點已刪除', 'success')
    }
  } catch (error) {
    console.error('刪除失敗:', error)
    showToast('刪除失敗', 'error')
  }
}

const resetFilters = () => {
  filters.value = {
    category: '',
    status: '',
    search: ''
  }
  currentPage.value = 1
}

const closeModal = () => {
  showAddModal.value = false
  showEditModal.value = false
  editingPlace.value = null
}

const closeBatchModal = () => {
  showBatchAddModal.value = false
  batchPlaceNames.value = ''
  batchDefaultCategory.value = ''
  batchProcessing.value = false
  batchProcessedCount.value = 0
  batchTotalCount.value = 0
  currentProcessingPlace.value = ''
  batchResults.value = []
}

const processBatchAdd = async () => {
  const placeNames = batchPlaceNames.value
    .trim()
    .split('\n')
    .map((name) => name.trim())
    .filter((name) => name)

  if (placeNames.length === 0) {
    showToast('請輸入至少一個地點名稱', 'error')
    return
  }

  batchProcessing.value = true
  batchProcessedCount.value = 0
  batchTotalCount.value = placeNames.length
  batchResults.value = []

  try {
    for (let i = 0; i < placeNames.length; i++) {
      const placeName = placeNames[i]
      currentProcessingPlace.value = placeName

      try {
        // 先搜尋 Google Places
        const searchResponse = await $fetch('/api/google/places/search', {
          method: 'POST',
          body: { query: placeName }
        })

        if (searchResponse.success && searchResponse.data.length > 0) {
          const googlePlace = searchResponse.data[0]

          // 取得地點詳細資訊
          const detailsResponse = await $fetch('/api/google/places/details', {
            method: 'POST',
            body: { place_id: googlePlace.place_id }
          })

          if (detailsResponse.success) {
            const placeDetails = detailsResponse.data

            // 建立地點資料
            const placeData = {
              name: placeDetails.name || placeName,
              formatted_address: placeDetails.formatted_address || '',
              google_place_id: placeDetails.place_id || '',
              latitude: placeDetails.geometry?.location?.lat || null,
              longitude: placeDetails.geometry?.location?.lng || null,
              rating: placeDetails.rating || null,
              user_ratings_total: placeDetails.user_ratings_total || null,
              phone_number: placeDetails.formatted_phone_number || null,
              website: placeDetails.website || null,
              opening_hours: placeDetails.opening_hours?.weekday_text
                ? JSON.stringify(placeDetails.opening_hours.weekday_text)
                : null,
              photos: placeDetails.photos ? JSON.stringify(placeDetails.photos) : null,
              types: placeDetails.types ? JSON.stringify(placeDetails.types) : null,
              category_id: batchDefaultCategory.value || null,
              status: 'pending',
              is_featured: false,
              is_private: false
            }

            // 新增地點到資料庫
            const createResponse = await $fetch('/api/admin/places', {
              method: 'POST',
              body: placeData
            })

            if (createResponse.success) {
              batchResults.value.push({
                name: placeName,
                success: true,
                message: '成功新增'
              })
            } else {
              batchResults.value.push({
                name: placeName,
                success: false,
                message: createResponse.error || '新增失敗'
              })
            }
          } else {
            batchResults.value.push({
              name: placeName,
              success: false,
              message: '無法取得地點詳細資訊'
            })
          }
        } else {
          batchResults.value.push({
            name: placeName,
            success: false,
            message: '找不到該地點'
          })
        }
      } catch (error) {
        console.error(`處理地點 ${placeName} 時發生錯誤:`, error)
        batchResults.value.push({
          name: placeName,
          success: false,
          message: '處理時發生錯誤'
        })
      }

      batchProcessedCount.value++

      // 避免 API 請求過於頻繁，加入延遲
      if (i < placeNames.length - 1) {
        await new Promise((resolve) => setTimeout(resolve, 500))
      }
    }

    // 處理完成後重新載入地點列表
    await loadPlaces()

    const successCount = batchResults.value.filter((r) => r.success).length
    const failCount = batchResults.value.filter((r) => !r.success).length

    if (successCount > 0) {
      showToast(`批次新增完成！成功: ${successCount}，失敗: ${failCount}`, 'success')
    } else {
      showToast('批次新增失敗，沒有成功新增任何地點', 'error')
    }
  } catch (error) {
    console.error('批次新增過程中發生錯誤:', error)
    showToast('批次新增過程中發生錯誤', 'error')
  } finally {
    batchProcessing.value = false
    currentProcessingPlace.value = ''
  }
}

const handlePlaceSaved = () => {
  closeModal()
  loadPlaces()
  showToast('地點已儲存', 'success')
}

// Toast 函數
const showToast = (message, type = 'success') => {
  toast.value = {
    show: true,
    type,
    message
  }

  setTimeout(() => {
    hideToast()
  }, 5000)
}

const hideToast = () => {
  toast.value.show = false
}

// 監聽篩選器變化，重置分頁
watch(
  [filters],
  () => {
    currentPage.value = 1
  },
  { deep: true }
)

// 初始化
onMounted(async () => {
  try {
    await Promise.all([loadPlaces(), loadCategories()])
  } finally {
    loading.value = false
  }
})
</script>

<style scoped lang="scss">
.yp-modal-overlay {
  position: fixed;
  inset: 0;
  z-index: 1050;
  display: grid;
  place-items: center;
  padding: 16px;
  background: rgba(19, 48, 58, 0.45);
}

.yp-modal {
  width: 100%;
  max-width: 560px;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  background: $yp-surface;
  border-radius: $yp-radius-lg;
  box-shadow: $yp-shadow-lg;

  &__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    padding: 18px 20px 12px;
    border-bottom: 1px solid $yp-line;
  }

  &__title {
    font-size: 1.125rem;
    font-weight: 700;
    margin: 0;
  }

  &__body {
    padding: 16px 20px;
    overflow-y: auto;
  }

  &__footer {
    display: flex;
    justify-content: flex-end;
    padding: 12px 20px;
    border-top: 1px solid $yp-line;
  }
}

.places-search {
  position: relative;

  &__icon {
    position: absolute;
    left: 12px;
    top: 50%;
    transform: translateY(-50%);
    color: $yp-subtle;
    font-size: 1.125rem;
    pointer-events: none;
  }

  .form-control {
    width: 100%;
    padding-left: 38px;
  }
}

.places-thumb-cell {
  width: 72px;

  @media (max-width: #{$yp-bp-md - 1px}) {
    display: block !important;
    padding-bottom: 0 !important;
  }
}

.places-name {
  min-width: 200px;
  max-width: 360px;
  text-align: left;
}

.places-actions {
  flex-wrap: wrap;
}

.places-pager {
  margin-top: 0;
}

.batch-results {
  list-style: none;
  margin: 0;
  padding: 0;
  max-height: 220px;
  overflow-y: auto;
  display: grid;
  gap: 6px;

  li {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 6px 8px;
    padding: 8px 12px;
    border-radius: $yp-radius-sm;
    font-size: 0.875rem;

    &.is-success {
      background: $yp-success-soft;
      color: #15803d;
    }

    &.is-error {
      background: $yp-danger-soft;
      color: #b91c1c;
    }
  }
}

.places-toast {
  display: flex;
  align-items: center;
  gap: 10px;
  max-width: calc(100vw - 32px);

  &.is-success .icon {
    color: #4ade80;
  }

  &.is-error {
    background: #7f1d1d;
  }

  &__close {
    border: 0;
    background: transparent;
    color: inherit;
    opacity: 0.7;
    display: grid;
    place-items: center;
    padding: 0;

    &:hover {
      opacity: 1;
    }
  }
}

.toast-enter-active,
.toast-leave-active {
  transition: all 0.25s ease;
}

.toast-enter-from,
.toast-leave-to {
  opacity: 0;
  transform: translate(-50%, 12px);
}
</style>
