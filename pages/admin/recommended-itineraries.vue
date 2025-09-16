<template>
  <div class="admin-recommended-itineraries">
    <div class="admin-header">
      <h1>推薦行程管理</h1>
      <button @click="handleCreateClick" class="btn-create">
        <Icon name="mdi:plus" />
        新增推薦行程
      </button>
    </div>

    <!-- 篩選器 -->
    <div class="filters">
      <div class="filter-group">
        <label>狀態：</label>
        <select v-model="statusFilter" @change="loadItineraries">
          <option value="">全部</option>
          <option value="true">啟用</option>
          <option value="false">停用</option>
        </select>
      </div>
      
      <div class="filter-group">
        <label>天數：</label>
        <select v-model="daysFilter" @change="loadItineraries">
          <option value="">全部</option>
          <option value="1">1天</option>
          <option value="2">2天</option>
          <option value="3">3天</option>
          <option value="4">4天以上</option>
        </select>
      </div>
    </div>

    <!-- 推薦行程列表 -->
    <div v-if="loading" class="loading">載入中...</div>
    
    <div v-else class="itineraries-grid">
      <div 
        v-for="itinerary in itineraries" 
        :key="itinerary.id"
        class="itinerary-card"
      >
        <!-- 行程資訊 -->
        <div class="card-header">
          <img 
            :src="itinerary.image_url || '/placeholder-place.jpg'" 
            :alt="itinerary.title"
            class="card-image"
            @error="$event.target.src = '/placeholder-place.jpg'"
          />
          <div class="card-info">
            <h3 class="title">{{ itinerary.title }}</h3>
            <p class="description">{{ itinerary.description }}</p>
            
            <div class="meta">
              <span class="days">{{ itinerary.days }}天行程</span>
              <span class="places">{{ itinerary.places.length }} 個地點</span>
              <span class="difficulty">{{ getDifficultyText(itinerary.difficulty_level) }}</span>
              <span :class="['status', itinerary.is_active ? 'active' : 'inactive']">
                {{ itinerary.is_active ? '啟用' : '停用' }}
              </span>
            </div>
            
            <!-- 評分統計 -->
            <div class="rating-stats">
              <div class="stars">
                <Icon 
                  v-for="i in 5" 
                  :key="i"
                  :name="i <= Math.round(itinerary.average_rating) ? 'ri:star-fill' : 'ri:star-line'"
                  :class="{ filled: i <= Math.round(itinerary.average_rating) }"
                />
              </div>
              <span class="rating-text">
                {{ itinerary.average_rating.toFixed(1) }} ({{ itinerary.rating_count }} 人評價)
              </span>
            </div>
          </div>
        </div>

        <!-- 標籤 -->
        <div class="tags">
          <span 
            v-for="tag in itinerary.tags" 
            :key="tag"
            class="tag"
          >
            {{ tag }}
          </span>
        </div>

        <!-- 操作按鈕 -->
        <div class="card-actions">
          <button 
            @click="editItinerary(itinerary)"
            class="btn-edit"
          >
            <Icon name="mdi:pencil" />
            編輯
          </button>
          
          <button 
            @click="toggleStatus(itinerary)"
            :class="['btn-toggle', itinerary.is_active ? 'btn-disable' : 'btn-enable']"
          >
            <Icon :name="itinerary.is_active ? 'mdi:eye-off' : 'mdi:eye'" />
            {{ itinerary.is_active ? '停用' : '啟用' }}
          </button>
          
          <button 
            @click="deleteItinerary(itinerary)"
            class="btn-delete"
          >
            <Icon name="mdi:delete" />
            刪除
          </button>
        </div>
      </div>
    </div>


    <!-- 建立/編輯模態框 -->
    <div v-if="showCreateModal || editingItinerary" class="modal-overlay" @click.self="closeModal">
      <div class="modal">
        <div class="modal-header">
          <h2>{{ editingItinerary ? '編輯推薦行程' : '新增推薦行程' }}</h2>
          <button @click="closeModal" class="btn-close">
            <Icon name="mdi:close" />
          </button>
        </div>

        <form @submit.prevent="saveItinerary" class="modal-form">
          <div class="form-row">
            <div class="form-group">
              <label>行程標題 *</label>
              <input 
                v-model="formData.title" 
                type="text" 
                placeholder="請輸入行程標題"
                required 
              />
            </div>
            
            <div class="form-group">
              <label>天數 *</label>
              <select v-model="formData.days" required>
                <option value="1">1天</option>
                <option value="2">2天</option>
                <option value="3">3天</option>
                <option value="4">4天</option>
                <option value="5">5天</option>
              </select>
            </div>
          </div>

          <div class="form-group">
            <label>行程描述</label>
            <textarea 
              v-model="formData.description" 
              placeholder="請輸入行程描述"
              rows="3"
            ></textarea>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label>難度等級</label>
              <select v-model="formData.difficulty_level">
                <option value="easy">簡單</option>
                <option value="medium">中等</option>
                <option value="hard">困難</option>
              </select>
            </div>
            
            <div class="form-group">
              <label>價格範圍</label>
              <select v-model="formData.price_range">
                <option value="budget">經濟實惠</option>
                <option value="mid">中等價位</option>
                <option value="luxury">豪華體驗</option>
              </select>
            </div>
          </div>

          <div class="form-group">
            <label>封面圖片 URL</label>
            <input 
              v-model="formData.image_url" 
              type="url" 
              placeholder="請輸入圖片網址"
            />
          </div>

          <div class="form-group">
            <label>標籤</label>
            <input 
              v-model="tagsInput" 
              type="text" 
              placeholder="請輸入標籤，以逗號分隔"
            />
            <small>例如：經典路線,適合新手,親子友善</small>
          </div>

          <div class="form-group">
            <label>行程地點 *</label>
            <div class="places-editor">
              <div
                v-for="(day, dayIndex) in formData.places"
                :key="dayIndex"
                class="day-section"
              >
                <h4>第 {{ dayIndex + 1 }} 天</h4>
                <div class="day-places">
                  <div
                    v-for="(place, placeIndex) in day"
                    :key="placeIndex"
                    class="place-item"
                  >
                    <div class="place-selector">
                      <input
                        v-model="place.name"
                        type="text"
                        placeholder="地點名稱"
                        readonly
                      />
                      <button
                        @click="showPlaceSelector(dayIndex, placeIndex)"
                        type="button"
                        class="btn-select-place"
                        title="選擇景點"
                      >
                        <Icon name="mdi:map-search" />
                      </button>
                    </div>
                    <button
                      @click="removePlace(dayIndex, placeIndex)"
                      type="button"
                      class="btn-remove-place"
                    >
                      <Icon name="mdi:close" />
                    </button>
                  </div>
                  <div class="place-actions">
                    <button
                      @click="addPlace(dayIndex)"
                      type="button"
                      class="btn-add-place"
                    >
                      <Icon name="mdi:plus" />
                      新增地點
                    </button>

                    <button
                      @click="showBatchAddModal(dayIndex)"
                      type="button"
                      class="btn-batch-add"
                    >
                      <Icon name="ri:add-box-line" />
                      批次新增
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div class="form-group">
            <label class="checkbox-label">
              <input 
                v-model="formData.is_active" 
                type="checkbox"
              />
              <span>啟用此推薦行程</span>
            </label>
          </div>

          <div class="modal-actions">
            <button type="button" @click="closeModal" class="btn-cancel">
              取消
            </button>
            <button type="submit" class="btn-save" :disabled="saving">
              {{ saving ? '儲存中...' : '儲存' }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- 景點選擇器模態框 -->
    <div v-if="showPlaceSelectorModal" class="modal-overlay place-selector-overlay" @click.self="closePlaceSelectorModal">
      <div class="modal place-selector-modal">
        <div class="modal-header">
          <h2>選擇景點</h2>
          <button @click="closePlaceSelectorModal" class="btn-close">
            <Icon name="mdi:close" />
          </button>
        </div>

        <div class="place-selector-content">
          <!-- 搜尋框 -->
          <div class="search-section">
            <div class="search-input-group">
              <Icon name="mdi:magnify" class="search-icon" />
              <input
                v-model="placeSearchQuery"
                type="text"
                placeholder="搜尋景點名稱..."
                class="search-input"
                @input="debouncedSearchPlaces"
              />
            </div>
          </div>

          <!-- 分類篩選 -->
          <div class="category-filters">
            <button
              v-for="category in availableCategories"
              :key="category.id"
              @click="toggleCategoryFilter(category.id)"
              :class="['category-btn', { active: selectedCategoryFilters.includes(category.id) }]"
            >
              <Icon :name="category.icon" />
              <span>{{ category.name }}</span>
            </button>
          </div>

          <!-- 景點列表 -->
          <div v-if="loadingPlaces" class="loading">搜尋中...</div>

          <div v-else class="places-list">
            <div
              v-for="place in filteredPlaces"
              :key="place.id"
              @click="selectPlace(place)"
              class="place-option"
            >
              <img
                :src="place.image_url || '/placeholder-place.jpg'"
                :alt="place.name"
                class="place-image"
                @error="$event.target.src = '/placeholder-place.jpg'"
              />
              <div class="place-info">
                <h4>{{ place.name }}</h4>
                <p>{{ place.address }}</p>
                <div class="place-meta">
                  <span class="category">{{ getCategoryName(place.category_id) }}</span>
                  <span v-if="place.rating" class="rating">
                    <Icon name="ri:star-fill" />
                    {{ place.rating }}
                  </span>
                </div>
              </div>
            </div>

            <div v-if="filteredPlaces.length === 0 && !loadingPlaces" class="no-results">
              沒有找到符合條件的景點
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 批次新增景點模態框 -->
    <div v-if="showBatchAddModalFlag" class="modal-overlay batch-add-overlay" @click.self="closeBatchAddModal">
      <div class="modal batch-add-modal">
        <div class="modal-header">
          <h2>批次新增景點 - 第 {{ currentBatchDay + 1 }} 天</h2>
          <button @click="closeBatchAddModal" class="btn-close">
            <Icon name="mdi:close" />
          </button>
        </div>

        <div class="batch-add-content">
          <!-- 搜尋和篩選 -->
          <div class="search-section">
            <div class="search-input-group">
              <Icon name="mdi:magnify" class="search-icon" />
              <input
                v-model="batchPlaceSearchQuery"
                type="text"
                placeholder="搜尋景點名稱..."
                class="search-input"
                @input="debouncedSearchBatchPlaces"
              />
            </div>
          </div>

          <div class="category-filters">
            <button
              v-for="category in availableCategories"
              :key="category.id"
              @click="toggleBatchCategoryFilter(category.id)"
              :class="['category-btn', { active: selectedBatchCategoryFilters.includes(category.id) }]"
            >
              <Icon :name="category.icon" />
              <span>{{ category.name }}</span>
            </button>
          </div>

          <!-- 已選景點 -->
          <div v-if="selectedBatchPlaces.length > 0" class="selected-places">
            <h4>已選景點 ({{ selectedBatchPlaces.length }})</h4>
            <div class="selected-list">
              <div
                v-for="place in selectedBatchPlaces"
                :key="place.id"
                class="selected-place"
              >
                <span>{{ place.name }}</span>
                <button @click="removeBatchPlace(place)" class="btn-remove">
                  <Icon name="mdi:close" />
                </button>
              </div>
            </div>
          </div>

          <!-- 可選景點列表 -->
          <div v-if="loadingBatchPlaces" class="loading">搜尋中...</div>

          <div v-else class="places-list">
            <div
              v-for="place in filteredBatchPlaces"
              :key="place.id"
              @click="toggleBatchPlace(place)"
              :class="['place-option', { selected: isBatchPlaceSelected(place) }]"
            >
              <img
                :src="place.image_url || '/placeholder-place.jpg'"
                :alt="place.name"
                class="place-image"
                @error="$event.target.src = '/placeholder-place.jpg'"
              />
              <div class="place-info">
                <h4>{{ place.name }}</h4>
                <p>{{ place.address }}</p>
                <div class="place-meta">
                  <span class="category">{{ getCategoryName(place.category_id) }}</span>
                  <span v-if="place.rating" class="rating">
                    <Icon name="ri:star-fill" />
                    {{ place.rating }}
                  </span>
                </div>
              </div>
              <div class="selection-indicator">
                <Icon :name="isBatchPlaceSelected(place) ? 'ri:check-circle-fill' : 'ri:add-circle-line'" />
              </div>
            </div>
          </div>

          <div class="batch-add-actions">
            <button @click="closeBatchAddModal" type="button" class="btn-cancel">
              取消
            </button>
            <button
              @click="confirmBatchAdd"
              type="button"
              class="btn-confirm"
              :disabled="selectedBatchPlaces.length === 0"
            >
              確認新增 ({{ selectedBatchPlaces.length }})
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed, watch } from 'vue'

// 檢查管理員權限
definePageMeta({
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
      if (itinerary.places.length > 0 && itinerary.places[0].hasOwnProperty('day') && itinerary.places[0].hasOwnProperty('places')) {
        console.log('檢測到巢狀格式，進行轉換...')
        // 巢狀格式：按天數排序並提取 places
        const sortedDays = itinerary.places.sort((a, b) => a.day - b.day)
        placesData = sortedDays.map(dayData => {
          if (Array.isArray(dayData.places)) {
            return dayData.places.map(place => {
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
        placesData = itinerary.places.map(day => {
          if (Array.isArray(day)) {
            return day.map(place => {
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
            return [typeof day === 'string' ? { id: null, name: day, place_id: null } : {
              id: day.id || null,
              name: day.name || day,
              place_id: day.place_id || day.id || null
            }]
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
  formData.places = [[]]  // 第一天的空陣列
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
      .map(tag => tag.trim())
      .filter(tag => tag.length > 0)
    
    // 清理空的地點
    formData.places = formData.places.map(day =>
      day.filter(place => place && place.name && place.name.trim().length > 0)
    ).filter(day => day.length > 0)
    
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
    'easy': '簡單',
    'medium': '中等',
    'hard': '困難'
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
    places = places.filter(place =>
      place.name.toLowerCase().includes(query) ||
      place.address?.toLowerCase().includes(query)
    )
  }

  // 按分類篩選
  if (selectedCategoryFilters.value.length > 0) {
    places = places.filter(place =>
      selectedCategoryFilters.value.includes(place.category_id)
    )
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
    places = places.filter(place =>
      place.name.toLowerCase().includes(query) ||
      place.address?.toLowerCase().includes(query)
    )
  }

  // 按分類篩選
  if (selectedBatchCategoryFilters.value.length > 0) {
    places = places.filter(place =>
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
  const index = selectedBatchPlaces.value.findIndex(p => p.id === place.id)
  if (index > -1) {
    selectedBatchPlaces.value.splice(index, 1)
  } else {
    selectedBatchPlaces.value.push(place)
  }
}

// 移除批次選擇的景點
const removeBatchPlace = (place) => {
  const index = selectedBatchPlaces.value.findIndex(p => p.id === place.id)
  if (index > -1) {
    selectedBatchPlaces.value.splice(index, 1)
  }
}

// 檢查景點是否已被批次選擇
const isBatchPlaceSelected = (place) => {
  return selectedBatchPlaces.value.some(p => p.id === place.id)
}

// 確認批次新增
const confirmBatchAdd = () => {
  const dayIndex = currentBatchDay.value
  selectedBatchPlaces.value.forEach(place => {
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
  const category = availableCategories.value.find(c => c.id === categoryId)
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
.modal {
  display: block;
}
.admin-recommended-itineraries {
  padding: 24px;
  max-width: 1400px;
  margin: 0 auto;
}

.admin-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  
  h1 {
    margin: 0;
    color: #1f2937;
    font-size: 28px;
    font-weight: 700;
  }
  
  .btn-create {
    background: #3b82f6;
    color: white;
    border: none;
    padding: 12px 20px;
    border-radius: 8px;
    font-weight: 500;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 8px;
    transition: background 0.2s ease;
    
    &:hover {
      background: #2563eb;
    }
  }
}

.filters {
  display: flex;
  gap: 16px;
  margin-bottom: 24px;
  padding: 16px;
  background: white;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
  
  .filter-group {
    display: flex;
    align-items: center;
    gap: 8px;
    
    label {
      font-weight: 500;
      color: #374151;
    }
    
    select {
      padding: 6px 12px;
      border: 1px solid #d1d5db;
      border-radius: 6px;
      font-size: 14px;
      
      &:focus {
        outline: none;
        border-color: #3b82f6;
        box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
      }
    }
  }
}

.loading {
  text-align: center;
  padding: 40px;
  color: #6b7280;
}

.itineraries-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
  gap: 20px;
}

.itinerary-card {
  background: white;
  border-radius: 12px;
  border: 1px solid #e5e7eb;
  overflow: hidden;
  transition: all 0.2s ease;
  
  &:hover {
    border-color: #3b82f6;
    box-shadow: 0 4px 12px rgba(59, 130, 246, 0.15);
  }
  
  .card-header {
    display: flex;
    gap: 16px;
    padding: 16px;
    
    .card-image {
      width: 80px;
      height: 80px;
      border-radius: 8px;
      object-fit: cover;
      flex-shrink: 0;
    }
    
    .card-info {
      flex: 1;
      
      .title {
        margin: 0 0 8px 0;
        font-size: 18px;
        font-weight: 600;
        color: #1f2937;
      }
      
      .description {
        margin: 0 0 12px 0;
        font-size: 14px;
        color: #6b7280;
        line-height: 1.4;
        display: -webkit-box;
        -webkit-line-clamp: 2;
        line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;
      }
      
      .meta {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        margin-bottom: 8px;
        
        span {
          padding: 2px 6px;
          border-radius: 4px;
          font-size: 12px;
          font-weight: 500;
          
          &.days {
            background: #eff6ff;
            color: #3b82f6;
          }
          
          &.places {
            background: #f0fdf4;
            color: #16a34a;
          }
          
          &.difficulty {
            background: #fef3c7;
            color: #d97706;
          }
          
          &.status {
            &.active {
              background: #dcfce7;
              color: #16a34a;
            }
            
            &.inactive {
              background: #fee2e2;
              color: #dc2626;
            }
          }
        }
      }
      
      .rating-stats {
        display: flex;
        align-items: center;
        gap: 8px;
        
        .stars {
          display: flex;
          gap: 2px;
          
          svg {
            width: 14px;
            height: 14px;
            color: #d1d5db;
            
            &.filled {
              color: #fbbf24;
            }
          }
        }
        
        .rating-text {
          font-size: 12px;
          color: #6b7280;
        }
      }
    }
  }
  
  .tags {
    padding: 0 16px 12px;
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
    
    .tag {
      background: #f3f4f6;
      color: #374151;
      padding: 2px 6px;
      border-radius: 4px;
      font-size: 11px;
      font-weight: 500;
    }
  }
  
  .card-actions {
    padding: 16px;
    border-top: 1px solid #f3f4f6;
    display: flex;
    gap: 8px;
    
    button {
      flex: 1;
      padding: 8px 12px;
      border: none;
      border-radius: 6px;
      font-size: 14px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s ease;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 4px;
      
      svg {
        width: 16px;
        height: 16px;
      }
    }
    
    .btn-edit {
      background: #f3f4f6;
      color: #374151;
      
      &:hover {
        background: #e5e7eb;
      }
    }
    
    .btn-enable {
      background: #dcfce7;
      color: #16a34a;
      
      &:hover {
        background: #bbf7d0;
      }
    }
    
    .btn-disable {
      background: #fef3c7;
      color: #d97706;
      
      &:hover {
        background: #fde68a;
      }
    }
    
    .btn-delete {
      background: #fee2e2;
      color: #dc2626;
      
      &:hover {
        background: #fecaca;
      }
    }
  }
}

// 模態框樣式
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex !important;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
}

.modal {
  background: white;
  border-radius: 12px;
  width: 100%;
  max-width: 800px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
  position: relative;
  z-index: 1001;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid #e5e7eb;
  
  h2 {
    margin: 0;
    color: #1f2937;
    font-size: 20px;
    font-weight: 600;
  }
  
  .btn-close {
    background: none;
    border: none;
    color: #6b7280;
    cursor: pointer;
    padding: 4px;
    border-radius: 4px;
    
    &:hover {
      background: #f3f4f6;
    }
    
    svg {
      width: 20px;
      height: 20px;
    }
  }
}

.modal-form {
  padding: 24px;
  
  .form-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 16px;
    
    @media (max-width: 600px) {
      grid-template-columns: 1fr;
    }
  }
  
  .form-group {
    margin-bottom: 16px;
    
    label {
      display: block;
      margin-bottom: 6px;
      font-weight: 500;
      color: #374151;
    }
    
    input,
    textarea,
    select {
      width: 100%;
      padding: 10px 12px;
      border: 1px solid #d1d5db;
      border-radius: 6px;
      font-size: 14px;
      
      &:focus {
        outline: none;
        border-color: #3b82f6;
        box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
      }
    }
    
    small {
      display: block;
      margin-top: 4px;
      color: #6b7280;
      font-size: 12px;
    }
    
    &.checkbox-label {
      display: flex;
      align-items: center;
      gap: 8px;
      
      input[type="checkbox"] {
        width: auto;
      }
    }
  }
  
  .places-editor {
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    padding: 16px;
    background: #f9fafb;
    
    .day-section {
      margin-bottom: 16px;
      
      &:last-child {
        margin-bottom: 0;
      }
      
      h4 {
        margin: 0 0 12px 0;
        color: #374151;
        font-size: 16px;
        font-weight: 600;
      }
      
      .day-places {
        .place-item {
          display: flex;
          gap: 8px;
          margin-bottom: 8px;

          .place-selector {
            flex: 1;
            display: flex;
            gap: 4px;

            input {
              flex: 1;
              cursor: pointer;
            }

            .btn-select-place {
              background: #eff6ff;
              color: #3b82f6;
              border: 1px solid #3b82f6;
              padding: 8px;
              border-radius: 4px;
              cursor: pointer;
              display: flex;
              align-items: center;
              justify-content: center;

              &:hover {
                background: #dbeafe;
              }

              svg {
                width: 14px;
                height: 14px;
              }
            }
          }

          .btn-remove-place {
            background: #fee2e2;
            color: #dc2626;
            border: none;
            padding: 8px;
            border-radius: 4px;
            cursor: pointer;

            &:hover {
              background: #fecaca;
            }

            svg {
              width: 14px;
              height: 14px;
            }
          }
        }
        
        .btn-add-place {
          background: #eff6ff;
          color: #3b82f6;
          border: 1px dashed #3b82f6;
          padding: 8px 12px;
          border-radius: 6px;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 4px;
          font-size: 14px;

          &:hover {
            background: #dbeafe;
          }

          svg {
            width: 14px;
            height: 14px;
          }
        }

        .btn-batch-add {
          background: #f0fdf4;
          color: #16a34a;
          border: 1px dashed #16a34a;
          padding: 8px 12px;
          border-radius: 6px;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 4px;
          font-size: 14px;

          &:hover {
            background: #dcfce7;
          }

          svg {
            width: 14px;
            height: 14px;
          }
        }
      }
    }
  }
}

.modal-actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  margin-top: 24px;
  padding-top: 16px;
  border-top: 1px solid #e5e7eb;
  
  .btn-cancel,
  .btn-save {
    padding: 10px 20px;
    border: none;
    border-radius: 6px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;
  }
  
  .btn-cancel {
    background: #f3f4f6;
    color: #374151;
    
    &:hover {
      background: #e5e7eb;
    }
  }
  
  .btn-save {
    background: #3b82f6;
    color: white;
    
    &:hover:not(:disabled) {
      background: #2563eb;
    }
    
    &:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
  }
}

// 景點選擇器模態框樣式
.place-selector-overlay {
  z-index: 1100;
  display: flex !important;
}

.place-selector-modal {
  max-width: 900px;

  .place-selector-content {
    padding: 24px;
    max-height: 70vh;
    overflow-y: auto;

    .search-section {
      margin-bottom: 20px;

      .search-input-group {
        position: relative;
        display: flex;
        align-items: center;

        .search-icon {
          position: absolute;
          left: 12px;
          color: #9ca3af;
          width: 16px;
          height: 16px;
          z-index: 1;
        }

        .search-input {
          width: 100%;
          padding: 10px 12px 10px 40px;
          border: 1px solid #d1d5db;
          border-radius: 6px;
          font-size: 14px;

          &:focus {
            outline: none;
            border-color: #3b82f6;
            box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
          }
        }
      }
    }

    .category-filters {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      margin-bottom: 20px;

      .category-btn {
        display: flex;
        align-items: center;
        gap: 4px;
        padding: 6px 12px;
        border: 1px solid #e5e7eb;
        border-radius: 6px;
        background: white;
        color: #374151;
        cursor: pointer;
        font-size: 13px;
        transition: all 0.2s ease;

        &:hover {
          border-color: #3b82f6;
          color: #3b82f6;
        }

        &.active {
          background: #3b82f6;
          color: white;
          border-color: #3b82f6;
        }

        svg {
          width: 14px;
          height: 14px;
        }
      }
    }

    .places-list {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
      gap: 12px;

      .place-option {
        display: flex;
        gap: 12px;
        padding: 12px;
        border: 1px solid #e5e7eb;
        border-radius: 8px;
        cursor: pointer;
        transition: all 0.2s ease;
        position: relative;

        &:hover {
          border-color: #3b82f6;
          background: #f8fafc;
        }

        &.selected {
          border-color: #10b981;
          background: #f0fdf4;
        }

        .place-image {
          width: 60px;
          height: 60px;
          border-radius: 6px;
          object-fit: cover;
          flex-shrink: 0;
        }

        .place-info {
          flex: 1;
          min-width: 0;

          h4 {
            margin: 0 0 4px 0;
            font-size: 14px;
            font-weight: 600;
            color: #1f2937;
            line-height: 1.3;
          }

          p {
            margin: 0 0 8px 0;
            font-size: 12px;
            color: #6b7280;
            line-height: 1.4;
          }

          .place-meta {
            display: flex;
            gap: 8px;
            font-size: 11px;

            .category {
              background: #f3f4f6;
              color: #374151;
              padding: 2px 6px;
              border-radius: 4px;
            }

            .rating {
              display: flex;
              align-items: center;
              gap: 2px;
              color: #f59e0b;

              svg {
                width: 12px;
                height: 12px;
              }
            }
          }
        }

        .selection-indicator {
          position: absolute;
          top: 8px;
          right: 8px;
          color: #10b981;

          svg {
            width: 20px;
            height: 20px;
          }
        }
      }
    }

    .no-results {
      text-align: center;
      color: #6b7280;
      padding: 40px;
      font-size: 14px;
    }

    .loading {
      text-align: center;
      color: #6b7280;
      padding: 40px;
      font-size: 14px;
    }
  }
}

// 批次新增模態框樣式
.batch-add-modal {
  max-width: 1000px;

  .modal-overlay {
    z-index: 1200;
  }

  .batch-add-content {
    padding: 24px;
    max-height: 80vh;
    overflow-y: auto;

    .selected-places {
      margin-bottom: 20px;
      padding: 16px;
      background: #f8fafc;
      border-radius: 8px;
      border: 1px solid #e5e7eb;

      h4 {
        margin: 0 0 12px 0;
        color: #374151;
        font-size: 14px;
        font-weight: 600;
      }

      .selected-list {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;

        .selected-place {
          display: flex;
          align-items: center;
          gap: 6px;
          background: #10b981;
          color: white;
          padding: 4px 8px;
          border-radius: 6px;
          font-size: 12px;

          .btn-remove {
            background: none;
            border: none;
            color: white;
            cursor: pointer;
            padding: 2px;
            border-radius: 2px;

            &:hover {
              background: rgba(255, 255, 255, 0.2);
            }

            svg {
              width: 12px;
              height: 12px;
            }
          }
        }
      }
    }

    .batch-add-actions {
      display: flex;
      gap: 12px;
      justify-content: flex-end;
      margin-top: 24px;
      padding-top: 16px;
      border-top: 1px solid #e5e7eb;

      .btn-cancel,
      .btn-confirm {
        padding: 10px 20px;
        border: none;
        border-radius: 6px;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.2s ease;
      }

      .btn-cancel {
        background: #f3f4f6;
        color: #374151;

        &:hover {
          background: #e5e7eb;
        }
      }

      .btn-confirm {
        background: #10b981;
        color: white;

        &:hover:not(:disabled) {
          background: #059669;
        }

        &:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
      }
    }
  }
}
</style>
