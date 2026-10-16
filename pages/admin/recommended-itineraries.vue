<template>
  <div class="admin-recommended-itineraries">
    <header class="yp-admin-head">
      <div>
        <h1 class="yp-admin-head__title">推薦行程管理</h1>
        <p class="yp-admin-head__desc">建立與管理前台的推薦行程，可隨時啟用或停用。</p>
      </div>
      <div class="yp-admin-head__actions">
        <button type="button" class="btn btn-primary btn-icon" @click="handleCreateClick">
          <Icon name="ri:add-line" />
          新增推薦行程
        </button>
      </div>
    </header>

    <div v-if="!loading && itineraries.length > 0" class="yp-admin-stats">
      <div class="yp-stat-card yp-stat-card--primary">
        <p class="yp-stat-card__label">行程總數</p>
        <p class="yp-stat-card__value">{{ itineraries.length }}</p>
      </div>
      <div class="yp-stat-card yp-stat-card--success">
        <p class="yp-stat-card__label">啟用中</p>
        <p class="yp-stat-card__value">{{ activeCount }}</p>
      </div>
      <div v-if="inactiveCount > 0" class="yp-stat-card">
        <p class="yp-stat-card__label">已停用</p>
        <p class="yp-stat-card__value">{{ inactiveCount }}</p>
      </div>
    </div>

    <!-- 篩選器 -->
    <div class="yp-filter-bar">
      <div class="yp-chips">
        <button
          v-for="option in statusOptions"
          :key="option.value"
          type="button"
          :class="['yp-chip', { 'is-active': statusFilter === option.value }]"
          @click="setStatusFilter(option.value)"
        >
          {{ option.label }}
        </button>
      </div>
      <select
        v-model="daysFilter"
        class="form-select"
        aria-label="天數篩選"
        @change="loadItineraries"
      >
        <option value="">天數：全部</option>
        <option value="1">1天</option>
        <option value="2">2天</option>
        <option value="3">3天</option>
        <option value="4">4天以上</option>
      </select>
    </div>

    <!-- 推薦行程列表 -->
    <div v-if="loading" class="yp-table-wrap p-4">
      <span v-for="n in 4" :key="n" class="yp-skeleton mb-3" style="height: 48px" />
    </div>

    <div v-else-if="itineraries.length === 0" class="yp-table-wrap">
      <div class="yp-empty">
        <div class="yp-empty__icon"><Icon name="ri:route-line" /></div>
        <p class="yp-empty__title">目前沒有符合條件的推薦行程</p>
        <button type="button" class="btn btn-primary" @click="handleCreateClick">
          新增推薦行程
        </button>
      </div>
    </div>

    <div v-else class="yp-table-wrap">
      <div class="table-responsive">
        <table class="table-hover yp-table-stack table align-middle">
          <thead>
            <tr>
              <th>行程</th>
              <th>天數 / 地點</th>
              <th>難度</th>
              <th>評分</th>
              <th>狀態</th>
              <th class="text-end">操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="itinerary in itineraries" :key="itinerary.id">
              <td data-label="行程">
                <div class="itinerary-cell">
                  <img
                    :src="itinerary.image_url || '/images/place-placeholder.svg'"
                    :alt="itinerary.title"
                    class="yp-table-thumb"
                    @error="$event.target.src = '/images/place-placeholder.svg'"
                  />
                  <div class="itinerary-cell__text">
                    <div class="itinerary-cell__title">{{ itinerary.title }}</div>
                    <div v-if="itinerary.description" class="itinerary-cell__desc yp-clamp-2">
                      {{ itinerary.description }}
                    </div>
                    <div v-if="itinerary.tags && itinerary.tags.length" class="yp-tags mt-1">
                      <span
                        v-for="tag in itinerary.tags"
                        :key="tag"
                        class="yp-tag yp-tag--primary"
                        >{{ tag }}</span
                      >
                    </div>
                  </div>
                </div>
              </td>
              <td data-label="天數 / 地點">
                <span class="yp-num">{{ itinerary.days }}</span> 天 /
                <span class="yp-num">{{ itinerary.places.length }}</span> 個地點
              </td>
              <td data-label="難度">{{ getDifficultyText(itinerary.difficulty_level) }}</td>
              <td data-label="評分">
                <div class="itinerary-rating">
                  <span class="itinerary-rating__stars">
                    <Icon
                      v-for="i in 5"
                      :key="i"
                      :name="
                        i <= Math.round(itinerary.average_rating) ? 'ri:star-fill' : 'ri:star-line'
                      "
                      :class="{ filled: i <= Math.round(itinerary.average_rating) }"
                    />
                  </span>
                  <span class="itinerary-rating__text yp-num">
                    {{ itinerary.average_rating.toFixed(1) }} ({{ itinerary.rating_count }})
                  </span>
                </div>
              </td>
              <td data-label="狀態">
                <span
                  :class="[
                    'yp-status',
                    itinerary.is_active ? 'yp-status--approved' : 'yp-status--draft'
                  ]"
                >
                  {{ itinerary.is_active ? '啟用' : '停用' }}
                </span>
              </td>
              <td data-label="操作">
                <div class="yp-row-actions">
                  <button
                    type="button"
                    class="btn btn-sm btn-soft btn-icon"
                    @click="editItinerary(itinerary)"
                  >
                    <Icon name="ri:edit-line" />
                    編輯
                  </button>
                  <button
                    type="button"
                    class="btn btn-sm btn-soft btn-icon"
                    @click="toggleStatus(itinerary)"
                  >
                    <Icon :name="itinerary.is_active ? 'ri:eye-off-line' : 'ri:eye-line'" />
                    {{ itinerary.is_active ? '停用' : '啟用' }}
                  </button>
                  <button
                    type="button"
                    class="btn btn-sm btn-outline-danger btn-icon"
                    @click="deleteItinerary(itinerary)"
                  >
                    <Icon name="ri:delete-bin-line" />
                    刪除
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <div class="yp-table-wrap__footer">
        <span
          >共 <b class="yp-num">{{ itineraries.length }}</b> 筆</span
        >
      </div>
    </div>

    <!-- 建立/編輯模態框 -->
    <div v-if="showCreateModal || editingItinerary" class="ri-overlay" @click.self="closeModal">
      <div class="ri-dialog">
        <div class="ri-dialog__header">
          <h2>{{ editingItinerary ? '編輯推薦行程' : '新增推薦行程' }}</h2>
          <button type="button" class="btn btn-ghost btn-sm" aria-label="關閉" @click="closeModal">
            <Icon name="ri:close-line" />
          </button>
        </div>

        <form class="ri-dialog__form" @submit.prevent="saveItinerary">
          <div class="ri-dialog__body">
            <div class="row g-3 mb-3">
              <div class="col-md-8">
                <label class="form-label required">行程標題</label>
                <input
                  v-model="formData.title"
                  type="text"
                  class="form-control"
                  placeholder="請輸入行程標題"
                  required
                />
              </div>
              <div class="col-md-4">
                <label class="form-label required">天數</label>
                <select v-model="formData.days" class="form-select" required>
                  <option value="1">1天</option>
                  <option value="2">2天</option>
                  <option value="3">3天</option>
                  <option value="4">4天</option>
                  <option value="5">5天</option>
                </select>
              </div>
            </div>

            <div class="mb-3">
              <label class="form-label">行程描述</label>
              <textarea
                v-model="formData.description"
                class="form-control"
                placeholder="請輸入行程描述"
                rows="3"
              />
            </div>

            <div class="row g-3 mb-3">
              <div class="col-md-6">
                <label class="form-label">難度等級</label>
                <select v-model="formData.difficulty_level" class="form-select">
                  <option value="easy">簡單</option>
                  <option value="medium">中等</option>
                  <option value="hard">困難</option>
                </select>
              </div>
              <div class="col-md-6">
                <label class="form-label">價格範圍</label>
                <select v-model="formData.price_range" class="form-select">
                  <option value="budget">經濟實惠</option>
                  <option value="mid">中等價位</option>
                  <option value="luxury">豪華體驗</option>
                </select>
              </div>
            </div>

            <div class="mb-3">
              <label class="form-label">封面圖片 URL</label>
              <input
                v-model="formData.image_url"
                type="url"
                class="form-control"
                placeholder="請輸入圖片網址"
              />
            </div>

            <div class="mb-3">
              <label class="form-label">標籤</label>
              <input
                v-model="tagsInput"
                type="text"
                class="form-control"
                placeholder="請輸入標籤，以逗號分隔"
              />
              <div class="form-text">例如：經典路線,適合新手,親子友善</div>
            </div>

            <div class="mb-3">
              <label class="form-label required">行程地點</label>
              <div class="places-editor">
                <div v-for="(day, dayIndex) in formData.places" :key="dayIndex" class="day-section">
                  <h4>第 {{ dayIndex + 1 }} 天</h4>
                  <div class="day-places">
                    <div v-for="(place, placeIndex) in day" :key="placeIndex" class="place-item">
                      <div class="place-selector">
                        <input
                          v-model="place.name"
                          type="text"
                          class="form-control form-control-sm"
                          placeholder="地點名稱"
                          readonly
                        />
                        <button
                          type="button"
                          class="btn btn-sm btn-soft"
                          title="選擇景點"
                          @click="showPlaceSelector(dayIndex, placeIndex)"
                        >
                          <Icon name="ri:map-pin-line" />
                        </button>
                      </div>
                      <button
                        type="button"
                        class="btn btn-sm btn-outline-danger"
                        aria-label="移除地點"
                        @click="removePlace(dayIndex, placeIndex)"
                      >
                        <Icon name="ri:close-line" />
                      </button>
                    </div>
                    <div class="place-actions">
                      <button
                        type="button"
                        class="btn btn-sm btn-outline-primary btn-icon"
                        @click="addPlace(dayIndex)"
                      >
                        <Icon name="ri:add-line" />
                        新增地點
                      </button>
                      <button
                        type="button"
                        class="btn btn-sm btn-soft btn-icon"
                        @click="showBatchAddModal(dayIndex)"
                      >
                        <Icon name="ri:add-box-line" />
                        批次新增
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div class="form-check">
              <input
                id="itinerary-active"
                v-model="formData.is_active"
                type="checkbox"
                class="form-check-input"
              />
              <label class="form-check-label" for="itinerary-active">啟用此推薦行程</label>
            </div>
          </div>

          <div class="ri-dialog__footer">
            <button type="button" class="btn btn-soft" @click="closeModal">取消</button>
            <button type="submit" class="btn btn-primary" :disabled="saving">
              {{ saving ? '儲存中...' : '儲存' }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- 景點選擇器模態框 -->
    <div
      v-if="showPlaceSelectorModal"
      class="ri-overlay ri-overlay--top"
      @click.self="closePlaceSelectorModal"
    >
      <div class="ri-dialog ri-dialog--md">
        <div class="ri-dialog__header">
          <h2>選擇景點</h2>
          <button
            type="button"
            class="btn btn-ghost btn-sm"
            aria-label="關閉"
            @click="closePlaceSelectorModal"
          >
            <Icon name="ri:close-line" />
          </button>
        </div>

        <div class="ri-dialog__body">
          <!-- 搜尋框 -->
          <div class="ri-search">
            <Icon name="ri:search-line" class="ri-search__icon" />
            <input
              v-model="placeSearchQuery"
              type="text"
              placeholder="搜尋景點名稱..."
              class="form-control"
              @input="debouncedSearchPlaces"
            />
          </div>

          <!-- 分類篩選 -->
          <div class="yp-chips ri-categories">
            <button
              v-for="category in availableCategories"
              :key="category.id"
              type="button"
              :class="[
                'yp-chip yp-chip--sm',
                { 'is-active': selectedCategoryFilters.includes(category.id) }
              ]"
              @click="toggleCategoryFilter(category.id)"
            >
              <Icon :name="category.icon" />
              <span>{{ category.name }}</span>
            </button>
          </div>

          <!-- 景點列表 -->
          <div v-if="loadingPlaces" class="ri-loading">搜尋中...</div>

          <div v-else class="places-list">
            <div
              v-for="place in filteredPlaces"
              :key="place.id"
              class="place-option"
              @click="selectPlace(place)"
            >
              <img
                :src="place.image_url || '/images/place-placeholder.svg'"
                :alt="place.name"
                class="place-image"
                @error="$event.target.src = '/images/place-placeholder.svg'"
              />
              <div class="place-info">
                <h4>{{ place.name }}</h4>
                <p>{{ place.address }}</p>
                <div class="place-meta">
                  <span class="yp-tag yp-tag--primary">{{
                    getCategoryName(place.category_id)
                  }}</span>
                  <span v-if="place.rating" class="place-rating">
                    <Icon name="ri:star-fill" />
                    {{ place.rating }}
                  </span>
                </div>
              </div>
            </div>

            <div v-if="filteredPlaces.length === 0 && !loadingPlaces" class="ri-loading">
              沒有找到符合條件的景點
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 批次新增景點模態框 -->
    <div
      v-if="showBatchAddModalFlag"
      class="ri-overlay ri-overlay--top"
      @click.self="closeBatchAddModal"
    >
      <div class="ri-dialog ri-dialog--md">
        <div class="ri-dialog__header">
          <h2>批次新增景點 - 第 {{ currentBatchDay + 1 }} 天</h2>
          <button
            type="button"
            class="btn btn-ghost btn-sm"
            aria-label="關閉"
            @click="closeBatchAddModal"
          >
            <Icon name="ri:close-line" />
          </button>
        </div>

        <div class="ri-dialog__body">
          <!-- 搜尋和篩選 -->
          <div class="ri-search">
            <Icon name="ri:search-line" class="ri-search__icon" />
            <input
              v-model="batchPlaceSearchQuery"
              type="text"
              placeholder="搜尋景點名稱..."
              class="form-control"
              @input="debouncedSearchBatchPlaces"
            />
          </div>

          <div class="yp-chips ri-categories">
            <button
              v-for="category in availableCategories"
              :key="category.id"
              type="button"
              :class="[
                'yp-chip yp-chip--sm',
                { 'is-active': selectedBatchCategoryFilters.includes(category.id) }
              ]"
              @click="toggleBatchCategoryFilter(category.id)"
            >
              <Icon :name="category.icon" />
              <span>{{ category.name }}</span>
            </button>
          </div>

          <!-- 已選景點 -->
          <div v-if="selectedBatchPlaces.length > 0" class="selected-places">
            <h4>已選景點 ({{ selectedBatchPlaces.length }})</h4>
            <div class="yp-tags">
              <span
                v-for="place in selectedBatchPlaces"
                :key="place.id"
                class="yp-tag yp-tag--primary selected-place"
              >
                {{ place.name }}
                <button
                  type="button"
                  class="selected-place__remove"
                  aria-label="移除"
                  @click="removeBatchPlace(place)"
                >
                  <Icon name="ri:close-line" />
                </button>
              </span>
            </div>
          </div>

          <!-- 可選景點列表 -->
          <div v-if="loadingBatchPlaces" class="ri-loading">搜尋中...</div>

          <div v-else class="places-list">
            <div
              v-for="place in filteredBatchPlaces"
              :key="place.id"
              :class="['place-option', { selected: isBatchPlaceSelected(place) }]"
              @click="toggleBatchPlace(place)"
            >
              <img
                :src="place.image_url || '/images/place-placeholder.svg'"
                :alt="place.name"
                class="place-image"
                @error="$event.target.src = '/images/place-placeholder.svg'"
              />
              <div class="place-info">
                <h4>{{ place.name }}</h4>
                <p>{{ place.address }}</p>
                <div class="place-meta">
                  <span class="yp-tag yp-tag--primary">{{
                    getCategoryName(place.category_id)
                  }}</span>
                  <span v-if="place.rating" class="place-rating">
                    <Icon name="ri:star-fill" />
                    {{ place.rating }}
                  </span>
                </div>
              </div>
              <div class="selection-indicator">
                <Icon
                  :name="
                    isBatchPlaceSelected(place) ? 'ri:check-circle-fill' : 'ri:add-circle-line'
                  "
                />
              </div>
            </div>
          </div>
        </div>

        <div class="ri-dialog__footer">
          <button type="button" class="btn btn-soft" @click="closeBatchAddModal">取消</button>
          <button
            type="button"
            class="btn btn-primary"
            :disabled="selectedBatchPlaces.length === 0"
            @click="confirmBatchAdd"
          >
            確認新增 ({{ selectedBatchPlaces.length }})
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed, watch } from 'vue'

// 檢查管理員權限
definePageMeta({
  layout: 'admin',
  middleware: 'admin-auth'
})

// 設定頁面標題
useHead({
  title: '推薦行程管理 - 管理後台'
})

// 響應式資料
const loading = ref(false)
const saving = ref(false)
const itineraries = ref([])
const statusFilter = ref('')
const daysFilter = ref('')

// 模態框狀態
const showCreateModal = ref(false)
const editingItinerary = ref(null)

// 表單資料
const formData = reactive({
  title: '',
  description: '',
  days: 1,
  image_url: '',
  difficulty_level: 'easy',
  price_range: 'budget',
  tags: [],
  places: [[]],
  is_active: true
})

const tagsInput = ref('')

// 景點選擇器相關
const showPlaceSelectorModal = ref(false)
const currentPlaceIndex = ref({ day: 0, place: 0 })
const availablePlaces = ref([])
const filteredPlaces = ref([])
const loadingPlaces = ref(false)
const placeSearchQuery = ref('')
const availableCategories = ref([])
const selectedCategoryFilters = ref([])

// 批次新增相關
const showBatchAddModalFlag = ref(false)
const currentBatchDay = ref(0)
const selectedBatchPlaces = ref([])
const filteredBatchPlaces = ref([])
const loadingBatchPlaces = ref(false)
const batchPlaceSearchQuery = ref('')
const selectedBatchCategoryFilters = ref([])

const statusOptions = [
  { value: '', label: '全部' },
  { value: 'true', label: '啟用' },
  { value: 'false', label: '停用' }
]

const activeCount = computed(() => itineraries.value.filter((item) => item.is_active).length)
const inactiveCount = computed(() => itineraries.value.filter((item) => !item.is_active).length)

// 載入推薦行程
const loadItineraries = async () => {
  try {
    loading.value = true
    const query = new URLSearchParams()

    if (statusFilter.value !== '') {
      query.append('active', statusFilter.value)
    }
    if (daysFilter.value) {
      query.append('days', daysFilter.value)
    }

    const response = await $fetch(`/api/admin/recommended-itineraries?${query}`)
    if (response.success) {
      itineraries.value = response.data
    }
  } catch (error) {
    console.error('載入推薦行程失敗:', error)
    alert('載入推薦行程失敗')
  } finally {
    loading.value = false
  }
}

const setStatusFilter = (value) => {
  statusFilter.value = value
  loadItineraries()
}

// 編輯行程
const editItinerary = (itinerary) => {
  console.log('編輯行程被調用:', itinerary)

  editingItinerary.value = itinerary

  // 填入表單資料
  formData.title = itinerary.title
  formData.description = itinerary.description || ''
  formData.days = itinerary.days
  formData.image_url = itinerary.image_url || ''
  formData.difficulty_level = itinerary.difficulty_level
  formData.price_range = itinerary.price_range
  formData.tags = [...itinerary.tags]

  // 轉換地點資料結構
  // 確保 places 是正確的陣列格式
  let placesData = []

  console.log('原始 places 資料:', itinerary.places)

  if (itinerary.places) {
    if (Array.isArray(itinerary.places)) {
      // 檢查是否為巢狀格式 [{day: 1, places: [...]}, {day: 2, places: [...]}]
      if (
        itinerary.places.length > 0 &&
        Object.prototype.hasOwnProperty.call(itinerary.places[0], 'day') &&
        Object.prototype.hasOwnProperty.call(itinerary.places[0], 'places')
      ) {
        console.log('檢測到巢狀格式，進行轉換...')
        // 巢狀格式：按天數排序並提取 places
        const sortedDays = itinerary.places.sort((a, b) => a.day - b.day)
        placesData = sortedDays.map((dayData) => {
          if (Array.isArray(dayData.places)) {
            return dayData.places.map((place) => {
              if (typeof place === 'string') {
                return { id: null, name: place, place_id: null }
              } else {
                return {
                  id: place.id || null,
                  name: place.name || place,
                  place_id: place.place_id || place.id || null
                }
              }
            })
          } else {
            return []
          }
        })
      } else {
        // 已經是標準的二維陣列格式
        placesData = itinerary.places.map((day) => {
          if (Array.isArray(day)) {
            return day.map((place) => {
              if (typeof place === 'string') {
                // 舊格式：純字串
                return { id: null, name: place, place_id: null }
              } else {
                // 新格式：物件
                return {
                  id: place.id || null,
                  name: place.name || place,
                  place_id: place.place_id || place.id || null
                }
              }
            })
          } else {
            // day 不是陣列，可能是字串或物件，轉換為陣列
            return [
              typeof day === 'string'
                ? { id: null, name: day, place_id: null }
                : {
                    id: day.id || null,
                    name: day.name || day,
                    place_id: day.place_id || day.id || null
                  }
            ]
          }
        })
      }
    } else {
      // places 不是陣列，可能是其他格式，初始化為空
      console.warn('Places data is not in array format:', itinerary.places)
      placesData = [[]]
    }
  } else {
    // 沒有 places 資料
    placesData = [[]]
  }

  console.log('轉換後的 places 資料:', placesData)
  formData.places = placesData

  formData.is_active = itinerary.is_active
  tagsInput.value = itinerary.tags.join(', ')
}

// 處理新增按鈕點擊
const handleCreateClick = () => {
  showCreateModal.value = true
}

// 關閉模態框
const closeModal = () => {
  showCreateModal.value = false
  editingItinerary.value = null
  resetForm()
}

// 重設表單
const resetForm = () => {
  formData.title = ''
  formData.description = ''
  formData.days = 1
  formData.image_url = ''
  formData.difficulty_level = 'easy'
  formData.price_range = 'budget'
  formData.tags = []
  formData.places = [[]] // 第一天的空陣列
  formData.is_active = true
  tagsInput.value = ''
}

// 儲存行程
const saveItinerary = async () => {
  try {
    saving.value = true

    // 處理標籤
    formData.tags = tagsInput.value
      .split(',')
      .map((tag) => tag.trim())
      .filter((tag) => tag.length > 0)

    // 清理空的地點
    formData.places = formData.places
      .map((day) => day.filter((place) => place && place.name && place.name.trim().length > 0))
      .filter((day) => day.length > 0)

    if (formData.places.length === 0) {
      alert('請至少添加一個地點')
      return
    }

    const requestData = {
      ...formData,
      id: editingItinerary.value?.id
    }

    const response = await $fetch('/api/admin/recommended-itineraries/save', {
      method: 'POST',
      body: requestData
    })

    if (response.success) {
      alert(response.message)
      closeModal()
      await loadItineraries()
    }
  } catch (error) {
    console.error('儲存失敗:', error)
    alert('儲存失敗：' + (error.data?.message || error.message))
  } finally {
    saving.value = false
  }
}

// 切換啟用狀態
const toggleStatus = async (itinerary) => {
  try {
    const newStatus = !itinerary.is_active
    const response = await $fetch('/api/admin/recommended-itineraries/save', {
      method: 'POST',
      body: {
        ...itinerary,
        is_active: newStatus
      }
    })

    if (response.success) {
      itinerary.is_active = newStatus
      alert(`已${newStatus ? '啟用' : '停用'}行程`)
    }
  } catch (error) {
    console.error('切換狀態失敗:', error)
    alert('操作失敗')
  }
}

// 刪除行程
const deleteItinerary = async (itinerary) => {
  if (!confirm(`確定要刪除行程「${itinerary.title}」嗎？此操作無法復原。`)) {
    return
  }

  try {
    const response = await $fetch(`/api/admin/recommended-itineraries/delete?id=${itinerary.id}`, {
      method: 'DELETE'
    })

    if (response.success) {
      alert('刪除成功')
      await loadItineraries()
    }
  } catch (error) {
    console.error('刪除失敗:', error)
    alert('刪除失敗')
  }
}

// 新增地點
const addPlace = (dayIndex) => {
  // 確保該天的陣列存在
  if (!Array.isArray(formData.places[dayIndex])) {
    formData.places[dayIndex] = []
  }
  formData.places[dayIndex].push({ id: null, name: '', place_id: null })
}

// 移除地點
const removePlace = (dayIndex, placeIndex) => {
  formData.places[dayIndex].splice(placeIndex, 1)
}

// 監聽天數變化，調整地點結構
const updatePlacesStructure = () => {
  const targetDays = parseInt(formData.days)

  // 確保 formData.places 是陣列
  if (!Array.isArray(formData.places)) {
    formData.places = []
  }

  const currentDays = formData.places.length

  if (targetDays > currentDays) {
    // 新增天數，每天初始化為空陣列
    for (let i = currentDays; i < targetDays; i++) {
      formData.places.push([])
    }
  } else if (targetDays < currentDays) {
    // 減少天數
    formData.places.splice(targetDays)
  }
}

// 監聽天數變化
watch(() => formData.days, updatePlacesStructure)

// 取得難度文字
const getDifficultyText = (level) => {
  const map = {
    easy: '簡單',
    medium: '中等',
    hard: '困難'
  }
  return map[level] || '簡單'
}

// 載入景點和分類
const loadPlacesAndCategories = async () => {
  try {
    // 載入景點
    const placesResponse = await $fetch('/api/places')
    if (placesResponse.success) {
      availablePlaces.value = placesResponse.data
      filteredPlaces.value = [...placesResponse.data]
      filteredBatchPlaces.value = [...placesResponse.data]
    }

    // 載入分類
    const categoriesResponse = await $fetch('/api/categories')
    if (categoriesResponse.success) {
      availableCategories.value = categoriesResponse.data
    }
  } catch (error) {
    console.error('載入景點和分類失敗:', error)
  }
}

// 顯示景點選擇器
const showPlaceSelector = (dayIndex, placeIndex) => {
  currentPlaceIndex.value = { day: dayIndex, place: placeIndex }
  showPlaceSelectorModal.value = true
  placeSearchQuery.value = ''
  selectedCategoryFilters.value = []
  filterPlaces()
}

// 關閉景點選擇器
const closePlaceSelectorModal = () => {
  showPlaceSelectorModal.value = false
  placeSearchQuery.value = ''
  selectedCategoryFilters.value = []
}

// 選擇景點
const selectPlace = (place) => {
  const { day, place: placeIndex } = currentPlaceIndex.value
  formData.places[day][placeIndex] = {
    id: place.id,
    name: place.name,
    place_id: place.id
  }
  closePlaceSelectorModal()
}

// 篩選景點
const filterPlaces = () => {
  let places = [...availablePlaces.value]

  // 按搜尋關鍵字篩選
  if (placeSearchQuery.value.trim()) {
    const query = placeSearchQuery.value.toLowerCase()
    places = places.filter(
      (place) =>
        place.name.toLowerCase().includes(query) || place.address?.toLowerCase().includes(query)
    )
  }

  // 按分類篩選
  if (selectedCategoryFilters.value.length > 0) {
    places = places.filter((place) => selectedCategoryFilters.value.includes(place.category_id))
  }

  filteredPlaces.value = places
}

// 切換分類篩選
const toggleCategoryFilter = (categoryId) => {
  const index = selectedCategoryFilters.value.indexOf(categoryId)
  if (index > -1) {
    selectedCategoryFilters.value.splice(index, 1)
  } else {
    selectedCategoryFilters.value.push(categoryId)
  }
  filterPlaces()
}

// 搜尋景點 (防抖)
const debouncedSearchPlaces = debounce(() => {
  filterPlaces()
}, 300)

// 顯示批次新增模態框
const showBatchAddModal = (dayIndex) => {
  currentBatchDay.value = dayIndex
  showBatchAddModalFlag.value = true
  selectedBatchPlaces.value = []
  batchPlaceSearchQuery.value = ''
  selectedBatchCategoryFilters.value = []
  filterBatchPlaces()
}

// 關閉批次新增模態框
const closeBatchAddModal = () => {
  showBatchAddModalFlag.value = false
  selectedBatchPlaces.value = []
  batchPlaceSearchQuery.value = ''
  selectedBatchCategoryFilters.value = []
}

// 篩選批次新增景點
const filterBatchPlaces = () => {
  let places = [...availablePlaces.value]

  // 按搜尋關鍵字篩選
  if (batchPlaceSearchQuery.value.trim()) {
    const query = batchPlaceSearchQuery.value.toLowerCase()
    places = places.filter(
      (place) =>
        place.name.toLowerCase().includes(query) || place.address?.toLowerCase().includes(query)
    )
  }

  // 按分類篩選
  if (selectedBatchCategoryFilters.value.length > 0) {
    places = places.filter((place) =>
      selectedBatchCategoryFilters.value.includes(place.category_id)
    )
  }

  filteredBatchPlaces.value = places
}

// 切換批次分類篩選
const toggleBatchCategoryFilter = (categoryId) => {
  const index = selectedBatchCategoryFilters.value.indexOf(categoryId)
  if (index > -1) {
    selectedBatchCategoryFilters.value.splice(index, 1)
  } else {
    selectedBatchCategoryFilters.value.push(categoryId)
  }
  filterBatchPlaces()
}

// 批次搜尋 (防抖)
const debouncedSearchBatchPlaces = debounce(() => {
  filterBatchPlaces()
}, 300)

// 切換批次選擇景點
const toggleBatchPlace = (place) => {
  const index = selectedBatchPlaces.value.findIndex((p) => p.id === place.id)
  if (index > -1) {
    selectedBatchPlaces.value.splice(index, 1)
  } else {
    selectedBatchPlaces.value.push(place)
  }
}

// 移除批次選擇的景點
const removeBatchPlace = (place) => {
  const index = selectedBatchPlaces.value.findIndex((p) => p.id === place.id)
  if (index > -1) {
    selectedBatchPlaces.value.splice(index, 1)
  }
}

// 檢查景點是否已被批次選擇
const isBatchPlaceSelected = (place) => {
  return selectedBatchPlaces.value.some((p) => p.id === place.id)
}

// 確認批次新增
const confirmBatchAdd = () => {
  const dayIndex = currentBatchDay.value
  selectedBatchPlaces.value.forEach((place) => {
    formData.places[dayIndex].push({
      id: place.id,
      name: place.name,
      place_id: place.id
    })
  })
  closeBatchAddModal()
}

// 取得分類名稱
const getCategoryName = (categoryId) => {
  const category = availableCategories.value.find((c) => c.id === categoryId)
  return category ? category.name : '未分類'
}

// 防抖函數
function debounce(func, delay) {
  let timeoutId
  return function (...args) {
    clearTimeout(timeoutId)
    timeoutId = setTimeout(() => func.apply(this, args), delay)
  }
}

// 初始化
onMounted(async () => {
  await loadItineraries()
  await loadPlacesAndCategories()
})
</script>

<style lang="scss" scoped>
.itinerary-cell {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  text-align: left;
  min-width: 260px;

  &__title {
    font-weight: 700;
    line-height: 1.4;
  }

  &__desc {
    margin-top: 2px;
    color: $yp-muted;
    font-size: 0.8125rem;
  }
}

.itinerary-rating {
  display: flex;
  flex-direction: column;
  gap: 2px;

  &__stars {
    display: inline-flex;
    color: $yp-line;

    .filled {
      color: $yp-warning;
    }
  }

  &__text {
    color: $yp-muted;
    font-size: 0.75rem;
  }
}

// ───── 自製 Modal（視覺同 Bootstrap modal）─────
.ri-overlay {
  position: fixed;
  inset: 0;
  z-index: 1055;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
  background: rgba(19, 48, 58, 0.45);

  &--top {
    z-index: 1060;
  }
}

.ri-dialog {
  width: 100%;
  max-width: 820px;
  max-height: 92vh;
  display: flex;
  flex-direction: column;
  background: $yp-surface;
  border-radius: $yp-radius-lg;
  box-shadow: $yp-shadow-lg;
  overflow: hidden;

  &--md {
    max-width: 680px;
  }

  &__form {
    display: flex;
    flex-direction: column;
    min-height: 0;
    flex: 1;
  }

  &__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 16px 20px;
    border-bottom: 1px solid $yp-line;

    h2 {
      margin: 0;
      font-size: 1.125rem;
      font-weight: 700;
    }
  }

  &__body {
    flex: 1;
    min-height: 0;
    overflow-y: auto;
    padding: 20px;
  }

  &__footer {
    display: flex;
    justify-content: flex-end;
    gap: 8px;
    padding: 14px 20px;
    border-top: 1px solid $yp-line;
  }
}

// ───── 行程地點編輯 ─────
.places-editor {
  display: grid;
  gap: 12px;
}

.day-section {
  padding: 14px;
  background: $yp-surface-2;
  border-radius: $yp-radius;

  h4 {
    margin: 0 0 10px;
    font-size: 0.9375rem;
    font-weight: 700;
    color: $yp-primary-ink;
  }
}

.day-places {
  display: grid;
  gap: 8px;
}

.place-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.place-selector {
  flex: 1;
  display: flex;
  gap: 6px;
}

.place-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

// ───── 景點選擇器 ─────
.ri-search {
  position: relative;
  margin-bottom: 12px;

  &__icon {
    position: absolute;
    left: 12px;
    top: 50%;
    transform: translateY(-50%);
    color: $yp-subtle;
    pointer-events: none;
  }

  .form-control {
    padding-left: 36px;
  }
}

.ri-categories {
  margin-bottom: 14px;
  flex-wrap: wrap;
}

.ri-loading {
  padding: 32px 0;
  text-align: center;
  color: $yp-muted;
}

.selected-places {
  margin-bottom: 14px;
  padding: 12px;
  background: $yp-primary-soft;
  border-radius: $yp-radius;

  h4 {
    margin: 0 0 8px;
    font-size: 0.875rem;
    font-weight: 700;
    color: $yp-primary-ink;
  }
}

.selected-place {
  &__remove {
    display: inline-flex;
    padding: 0;
    border: 0;
    background: transparent;
    color: inherit;
    cursor: pointer;
  }
}

.places-list {
  display: grid;
  gap: 8px;
  max-height: 340px;
  overflow-y: auto;
}

.place-option {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px;
  border: 1px solid $yp-line;
  border-radius: $yp-radius;
  background: $yp-surface;
  cursor: pointer;
  transition: all 0.15s ease;

  &:hover {
    border-color: $yp-primary;
    background: $yp-primary-soft;
  }

  &.selected {
    border-color: $yp-primary;
    background: $yp-primary-soft;
  }
}

.place-image {
  width: 56px;
  height: 56px;
  border-radius: 10px;
  object-fit: cover;
  background: $yp-surface-2;
  flex: none;
}

.place-info {
  flex: 1;
  min-width: 0;

  h4 {
    margin: 0;
    font-size: 0.9375rem;
    font-weight: 700;
  }

  p {
    margin: 2px 0 4px;
    color: $yp-muted;
    font-size: 0.8125rem;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}

.place-meta {
  display: flex;
  align-items: center;
  gap: 8px;
}

.place-rating {
  display: inline-flex;
  align-items: center;
  gap: 2px;
  color: $yp-warning;
  font-size: 0.8125rem;
  font-weight: 600;
}

.selection-indicator {
  flex: none;
  font-size: 1.5rem;
  color: $yp-primary;
}
</style>
