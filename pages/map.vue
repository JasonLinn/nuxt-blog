<!-- pages/map.vue -->
<template>
  <div class="map-container" :class="{ 'hide-pin-labels': !showLabels }">
    <!-- 載入狀態 -->
    <div v-if="isMapLoading" class="loading-overlay">
      <div class="loading-content">
        <Icon class="h-8 w-8 animate-spin text-blue-500" name="eos-icons:loading" />
        <span class="ml-2 text-gray-600">載入地圖中...</span>
      </div>
    </div>

    <!-- 民宿資料載入狀態 -->
    <div
      v-else-if="isLoadingHomestay && activeCategoriesMap.housing"
      class="loading-overlay-partial"
    >
      <div class="loading-content">
        <Icon class="h-6 w-6 animate-spin text-green-500" name="eos-icons:loading" />
        <span class="ml-2 text-gray-600">載入民宿資料中...</span>
      </div>
    </div>

    <!-- 錯誤狀態 -->
    <div v-else-if="mapError" class="error-overlay">
      <div class="error-content">
        <span class="text-red-600">地圖載入失敗</span>
        <p class="mt-2 text-gray-600">{{ mapError }}</p>
        <button class="retry-btn" @click="retryLoadMap">重試</button>
      </div>
    </div>

    <section v-show="!isMapLoading && !mapError" class="control-bar" aria-label="地圖探索工具">
      <div class="control-heading">
        <div>
          <p class="control-eyebrow">YILAN DISCOVERY</p>
          <h1 class="control-title">探索宜蘭好去處</h1>
        </div>
        <span class="place-count" aria-live="polite">
          {{ isMapLoading ? '載入中' : `${couponData.length} 個地點` }}
        </span>
      </div>

      <div class="control-buttons">
        <button
          v-for="(category, index) in categories"
          :key="index"
          :class="{
            active: activeCategoriesMap[category.key],
            loading: category.key === 'housing' && isLoadingHomestay
          }"
          :disabled="category.key === 'housing' && isLoadingHomestay"
          class="category-btn"
          type="button"
          :aria-pressed="activeCategoriesMap[category.key]"
          :aria-label="`${activeCategoriesMap[category.key] ? '隱藏' : '顯示'}${category.label}`"
          @click="toggleCategory(category.key)"
        >
          <span v-if="category.key === 'housing' && isLoadingHomestay" class="loading-spinner">
            <Icon name="eos-icons:loading" />
          </span>
          <Icon v-else :name="category.icon" class="category-icon" aria-hidden="true" />
          <span class="category-copy">
            <strong>{{ category.name }}</strong>
            <small>{{ category.label }}</small>
          </span>
        </button>
      </div>

      <div class="search-container">
        <Icon name="ri:search-line" class="search-icon" aria-hidden="true" />
        <label class="visually-hidden" for="map-place-search">搜尋地點</label>
        <input
          id="map-place-search"
          v-model="searchQuery"
          type="text"
          placeholder="搜尋店家、景點或住宿"
          class="search-input"
          autocomplete="off"
          spellcheck="false"
          :aria-expanded="searchResults.length > 0"
          aria-controls="map-search-results"
          @input="handleSearchInput"
        />
        <button
          v-if="searchQuery"
          type="button"
          class="search-clear"
          aria-label="清除搜尋"
          @click="clearSearch"
        >
          <Icon name="ri:close-line" />
        </button>
        <div
          v-if="searchResults && searchResults.length > 0"
          id="map-search-results"
          class="search-results"
        >
          <button
            v-for="(result, index) in searchResults"
            :key="result.id || index"
            class="search-result-item"
            type="button"
            @click="navigateToLocation(result)"
          >
            <span
              class="result-pin"
              :style="{ backgroundColor: getCategoryMeta(result.category).color }"
            >
              <Icon :name="getCategoryMeta(result.category).icon" aria-hidden="true" />
            </span>
            <span class="result-copy">
              <strong>{{ result.title }}</strong>
              <small>{{ getCategoryMeta(result.category).label }}</small>
            </span>
            <Icon name="ri:arrow-right-s-line" class="result-arrow" aria-hidden="true" />
          </button>
        </div>
      </div>

      <div class="control-options">
        <span class="option-copy">
          <Icon name="ri:price-tag-3-line" aria-hidden="true" />
          顯示地點名稱
        </span>
        <button
          :class="{ active: showLabels }"
          class="option-btn"
          type="button"
          role="switch"
          :aria-checked="showLabels"
          @click="toggleLabels"
        >
          <span class="switch-knob"></span>
          <span class="visually-hidden">{{ showLabels ? '隱藏店名' : '顯示店名' }}</span>
        </button>
      </div>
    </section>
    <div id="map" ref="mapRef"></div>
    <button
      v-show="!isMapLoading && !mapError"
      class="location-btn"
      type="button"
      aria-label="移動到我的目前位置"
      @click="getCurrentLocation"
    >
      <Icon name="ri:crosshair-2-line" class="location-icon" />
      <span class="location-label">我的位置</span>
    </button>

    <!-- 地標資訊面板 -->
    <div
      ref="infoPanelRef"
      class="map-info-panel"
      :class="{ 'map-info-panel-open': isInfoPanelOpen }"
    >
      <button
        class="map-info-toggle"
        type="button"
        :aria-expanded="isInfoPanelOpen"
        aria-label="切換地點資訊面板"
        @click="isInfoPanelOpen = !isInfoPanelOpen"
      >
        <span class="panel-handle"></span>
        <Icon
          name="ri:arrow-up-s-line"
          class="map-toggle"
          :class="{ 'arrow-upside': isInfoPanelOpen }"
        />
      </button>
      <div v-if="selectedCoupon && selectedCoupon.id" class="map-info-wrapper">
        <!-- 民宿資訊顯示 -->
        <div
          v-if="selectedCoupon.detailUrl && selectedCoupon.detailUrl.includes('/homestays/')"
          class="homestay-info"
        >
          <div class="homestay-header">
            <h3 class="homestay-title">{{ selectedCoupon.title }}</h3>
          </div>

          <div v-if="selectedCoupon.image_url" class="homestay-image">
            <img :src="selectedCoupon.image_url" :alt="selectedCoupon.title" />
          </div>

          <div class="homestay-details">
            <div v-if="selectedCoupon.description" class="detail-item">
              <span class="detail-label"><Icon name="ri:map-pin-line" />位置：</span>
              <span class="detail-value">{{ selectedCoupon.description }}</span>
            </div>

            <div v-if="selectedCoupon.price" class="detail-item">
              <span class="detail-label"><Icon name="ri:money-dollar-circle-line" />價格：</span>
              <span class="detail-value">{{ selectedCoupon.price }}</span>
            </div>

            <div v-if="selectedCoupon.min_guests || selectedCoupon.max_guests" class="detail-item">
              <span class="detail-label"><Icon name="ri:group-line" />人數：</span>
              <span class="detail-value">
                {{ selectedCoupon.min_guests || 1 }} - {{ selectedCoupon.max_guests || '不限' }} 人
              </span>
            </div>

            <div v-if="selectedCoupon.content" class="detail-item">
              <span class="detail-label"><Icon name="ri:file-text-line" />描述：</span>
              <span class="detail-value">{{ selectedCoupon.content }}</span>
            </div>

            <div v-if="selectedCoupon.phone || selectedCoupon.website" class="homestay-contact">
              <div v-if="selectedCoupon.phone" class="contact-item">
                <a :href="`tel:${selectedCoupon.phone}`" class="contact-link">
                  <Icon name="ri:phone-line" />{{ selectedCoupon.phone }}
                </a>
              </div>
              <div v-if="selectedCoupon.website" class="contact-item">
                <a :href="selectedCoupon.website" target="_blank" class="contact-link">
                  <Icon name="ri:global-line" />官方網站
                </a>
              </div>
            </div>

            <div class="homestay-actions">
              <nuxt-link :to="selectedCoupon.detailUrl" class="view-detail-btn">
                查看詳細資訊
              </nuxt-link>
            </div>
          </div>
        </div>

        <!-- 原有的優惠券資訊 -->
        <CouponInfo v-else :key="selectedCoupon.id" :coupon-id="selectedCoupon.id"></CouponInfo>
      </div>
      <div v-else-if="selectedCoupon && !selectedCoupon.id" class="map-info-wrapper">
        <div class="debug-info">
          <h3>除錯資訊</h3>
          <p>選中的優惠券沒有 ID</p>
          <pre>{{ JSON.stringify(selectedCoupon, null, 2) }}</pre>
        </div>
      </div>
      <div v-else-if="isInfoPanelOpen" class="map-info-wrapper">
        <div class="debug-info">
          <p>面板已開啟但沒有選中的優惠券</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, reactive, computed, watch, onUnmounted, nextTick } from 'vue'
import useCouponMapStore from '~~/store/couponMap'

// SEO 優化
useSeoMeta({
  title: '優惠券地圖 - 探索周邊優惠',
  ogTitle: '優惠券地圖 - 探索周邊優惠',
  description: '在地圖上探索宜蘭各地的優惠券和特色商家位置',
  ogDescription: '在地圖上探索宜蘭各地的優惠券和特色商家位置',
  keywords: '優惠券,地圖,宜蘭,位置,商家,導航,開源地圖',
  canonical: 'https://yilanpass.com/map'
})

// 額外設定 head link (雙重保險)
useHead({
  link: [
    {
      rel: 'canonical',
      href: 'https://yilanpass.com/map'
    }
  ]
})

const store = useCouponMapStore()
const couponObject = computed(() => store.getCouponData)
// 民宿資料狀態
const homestayData = ref([])
const isLoadingHomestay = ref(false)

// 活躍類別狀態 - 預設只顯示「食」類別
const activeCategoriesMap = reactive({
  eat: true,
  play: false,
  housing: false,
  traffic: false
})

// 效能優化：使用快取的計算屬性
const couponDataCache = new Map()

// 整合資料來源
const mapData = computed(() => {
  if (process.server) return []

  const isHousingOnly =
    activeCategoriesMap.housing &&
    !activeCategoriesMap.eat &&
    !activeCategoriesMap.play &&
    !activeCategoriesMap.traffic

  if (isHousingOnly) {
    return homestayData.value || []
  }

  const couponItems = couponObject.value?.data?.items || []
  const filteredItems = couponItems.filter((item) => item.category !== 'housing')

  if (activeCategoriesMap.housing) {
    return [...filteredItems, ...(homestayData.value || [])]
  }

  return filteredItems
})

const couponData = computed(() => {
  if (!mapData.value || !Array.isArray(mapData.value)) return []

  const cacheKey = `${Object.entries(activeCategoriesMap)
    .filter(([k, v]) => v)
    .map(([k]) => k)
    .join('_')}_${mapData.value?.length || 0}`

  if (couponDataCache.has(cacheKey)) {
    return couponDataCache.get(cacheKey)
  }

  const result = mapData.value.filter((item) => {
    const categoryKey = item.category || ''
    return activeCategoriesMap[categoryKey]
  })

  couponDataCache.set(cacheKey, result)

  if (couponDataCache.size > 10) {
    const firstKey = couponDataCache.keys().next().value
    couponDataCache.delete(firstKey)
  }

  return result
})

// 載入狀態管理
const isMapLoading = ref(true)
const mapError = ref(null)

// 初始化數據
if (!couponData.value?.length) {
  store.fetchAndSetCoupon({ pageSize: 150 })
}

// 民宿資料獲取函數
const fetchHomestayData = async () => {
  if (isLoadingHomestay.value) return

  try {
    isLoadingHomestay.value = true
    console.log('獲取民宿地圖資料...')

    const response = await fetch('/api/homestay-map-data')
    const data = await response.json()

    if (data.success && data.data?.items) {
      homestayData.value = data.data.items
      console.log('民宿資料載入成功，數量:', data.data.items.length)
    } else {
      console.error('民宿資料載入失敗:', data.error)
      homestayData.value = []
    }
  } catch (error) {
    console.error('民宿資料獲取錯誤:', error)
    homestayData.value = []
  } finally {
    isLoadingHomestay.value = false
  }
}

// 地標資訊面板控制
const isInfoPanelOpen = ref(false)
const selectedCoupon = ref(null)
const infoPanelRef = ref(null)

// 地圖容器引用與 Leaflet 實例
const mapRef = ref(null)
let L = null
let map = null
let markersLayer = null
let markers = []
let userLocationMarker = null

// 預設顯示地點名稱
const showLabels = ref(true)

// 搜尋功能
const searchQuery = ref('')
const searchResults = ref([])
let searchTimeout = null
const searchCache = new Map()

const handleSearchInput = () => {
  if (searchTimeout) clearTimeout(searchTimeout)

  if (!searchQuery.value.trim()) {
    searchResults.value = []
    return
  }

  searchTimeout = setTimeout(() => {
    performSearch()
  }, 300)
}

const clearSearch = () => {
  searchQuery.value = ''
  searchResults.value = []
}

const performSearch = () => {
  const query = searchQuery.value.trim()

  if (!query) {
    searchResults.value = []
    return
  }

  if (searchCache.has(query)) {
    searchResults.value = searchCache.get(query)
    return
  }

  if (!mapData.value || !Array.isArray(mapData.value)) {
    return
  }

  const queryLower = query.toLowerCase()
  const results = mapData.value
    .filter((item) => {
      const titleMatch = item.title && item.title.toLowerCase().includes(queryLower)
      if (titleMatch) return true

      const contentMatch = item.content && item.content.toLowerCase().includes(queryLower)
      if (contentMatch) return true

      const descriptionMatch =
        item.description && item.description.toLowerCase().includes(queryLower)
      return descriptionMatch
    })
    .slice(0, 5)

  searchCache.set(query, results)

  if (searchCache.size > 20) {
    const firstKey = searchCache.keys().next().value
    searchCache.delete(firstKey)
  }

  searchResults.value = results
}

// 導航到選擇的位置
const navigateToLocation = (location) => {
  console.log('點擊搜尋結果:', location)

  if (!map || !location.position) {
    console.error('地圖或位置無效:', { map: !!map, position: location.position })
    return
  }

  const lat = parseFloat(location.position.lat)
  const lng = parseFloat(location.position.lng)

  if (isNaN(lat) || isNaN(lng)) {
    console.error('無效的位置座標:', location)
    return
  }

  // 平滑移動地圖到選擇的位置
  map.setView([lat, lng], 16, { animate: true })

  searchQuery.value = ''
  searchResults.value = []

  highlightMarker(location)

  setTimeout(() => {
    showCouponInfo(location)
  }, 300)
}

// 顯示地標資訊
const showCouponInfo = (coupon) => {
  selectedCoupon.value = coupon
  isInfoPanelOpen.value = true

  nextTick(() => {
    const panel = document.querySelector('.map-info-panel')
    if (panel) {
      panel.scrollIntoView({ behavior: 'smooth', block: 'end' })
    }
  })
}

// 高亮標記動畫
const highlightMarker = (location) => {
  const targetLat = parseFloat(location.position.lat)
  const targetLng = parseFloat(location.position.lng)

  markers.forEach((marker) => {
    const pos = marker.getLatLng()
    if (Math.abs(pos.lat - targetLat) < 0.0001 && Math.abs(pos.lng - targetLng) < 0.0001) {
      const el = marker.getElement()
      if (el) {
        const pin = el.querySelector('.custom-map-pin')
        if (pin) {
          pin.classList.add('highlighted')
          setTimeout(() => {
            pin.classList.remove('highlighted')
          }, 2000)
        }
      }
    }
  })
}

// 切換標籤顯示/隱藏 (由 container class .hide-pin-labels 處理)
const toggleLabels = () => {
  showLabels.value = !showLabels.value
}

// 地標類別定義 (高對比度原版配色)
const categories = [
  { key: 'eat', name: '食', label: '美食', icon: 'ri:restaurant-line', color: '#E76F51' },
  { key: 'play', name: '樂', label: '景點', icon: 'ri:landscape-line', color: '#2A9D8F' },
  { key: 'housing', name: '住', label: '住宿', icon: 'ri:hotel-bed-line', color: '#52796F' },
  { key: 'traffic', name: '行', label: '交通', icon: 'ri:car-line', color: '#E9A23B' }
]

const getCategoryMeta = (categoryKey) => {
  return (
    categories.find((category) => category.key === categoryKey) || {
      label: '地點',
      icon: 'ri:map-pin-line',
      color: '#667085'
    }
  )
}

// 切換類別顯示/隱藏
const toggleCategory = async (category) => {
  if (category === 'housing' && !activeCategoriesMap[category] && homestayData.value.length === 0) {
    await fetchHomestayData()
  }

  activeCategoriesMap[category] = !activeCategoriesMap[category]
  nextTick(() => {
    updateMarkers()
  })
}

// HTML 特殊字元轉義輔助函式
const escapeHtml = (str) => {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

// 建立自定義 Marker DivIcon
const createCustomPinIcon = (landmark, categoryObj) => {
  return L.divIcon({
    className: 'custom-map-pin-wrapper',
    html: `
      <div class="custom-map-pin">
        <div class="pin-title">${escapeHtml(landmark.title || '')}</div>
        <div class="pin-circle" style="background-color: ${categoryObj.color}"></div>
      </div>
    `,
    iconSize: [20, 20],
    iconAnchor: [10, 10]
  })
}

// 更新地圖標記
const updateMarkers = () => {
  if (!map || !markersLayer || !L) return

  markersLayer.clearLayers()
  markers = []

  if (couponData.value && Array.isArray(couponData.value)) {
    couponData.value.forEach((landmark) => {
      if (
        !landmark.position ||
        typeof landmark.position.lat !== 'number' ||
        typeof landmark.position.lng !== 'number'
      ) {
        return
      }

      const categoryKey = landmark.category || ''
      const categoryObj = categories.find((cat) => cat.key === categoryKey)

      if (categoryObj && activeCategoriesMap[categoryObj.key]) {
        const lat = parseFloat(landmark.position.lat)
        const lng = parseFloat(landmark.position.lng)

        const icon = createCustomPinIcon(landmark, categoryObj)
        const marker = L.marker([lat, lng], { icon })

        marker.on('click', (e) => {
          if (e && e.originalEvent) {
            e.originalEvent.stopPropagation()
          }
          window.isMarkerClick = true
          showCouponInfo(landmark)
          highlightMarker(landmark)
        })

        marker.addTo(markersLayer)
        markers.push(marker)
      }
    })
  }
}

// 取得當前位置
const getCurrentLocation = () => {
  if (!navigator.geolocation) {
    alert('您的瀏覽器不支援地理位置功能。')
    return
  }

  const locationBtn = document.querySelector('.location-btn')
  if (locationBtn) {
    locationBtn.style.opacity = '0.6'
    locationBtn.style.pointerEvents = 'none'
  }

  navigator.geolocation.getCurrentPosition(
    (position) => {
      const userLat = position.coords.latitude
      const userLng = position.coords.longitude

      if (map) {
        map.setView([userLat, userLng], 16, { animate: true })

        if (userLocationMarker) {
          userLocationMarker.setLatLng([userLat, userLng])
        } else if (L) {
          const userIcon = L.divIcon({
            className: 'user-loc-wrapper',
            html: '<div class="user-pulse-dot"></div>',
            iconSize: [16, 16],
            iconAnchor: [8, 8]
          })
          userLocationMarker = L.marker([userLat, userLng], {
            icon: userIcon,
            zIndexOffset: 1000
          }).addTo(map)
        }
      }

      if (locationBtn) {
        locationBtn.style.opacity = '1'
        locationBtn.style.pointerEvents = 'auto'
      }
    },
    (error) => {
      console.error('獲取位置失敗:', error)
      alert('無法獲取您的位置，請確保已授予位置權限。')

      if (locationBtn) {
        locationBtn.style.opacity = '1'
        locationBtn.style.pointerEvents = 'auto'
      }
    },
    {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 300000
    }
  )
}

// 重試載入地圖
const retryLoadMap = async () => {
  mapError.value = null
  isMapLoading.value = true
  try {
    await initMap()
  } catch (error) {
    console.error('重試載入失敗:', error)
    mapError.value = error.message || '地圖載入失敗'
  } finally {
    isMapLoading.value = false
  }
}

// 初始化開源地圖 (Leaflet + OpenStreetMap 標準高對比圖資)
const initMap = async () => {
  if (process.server || !mapRef.value) return

  if (!L) {
    L = await import('leaflet')
  }

  const center = [24.677407, 121.75371]

  map = L.map(mapRef.value, {
    center,
    zoom: 12,
    zoomControl: false
  })

  // 縮放按鈕置於右下角，避免遮蔽左上角控制欄
  L.control.zoom({ position: 'bottomright' }).addTo(map)

  // OpenStreetMap 標準圖資 (完全開源、高對比、免 API Key)
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    maxZoom: 19
  }).addTo(map)

  markersLayer = L.layerGroup().addTo(map)
  updateMarkers()
}

// couponData 監聽器
let updateTimeout = null
watch(
  () => couponData.value,
  (newValue) => {
    if (newValue && Array.isArray(newValue) && map && markersLayer) {
      if (updateTimeout) clearTimeout(updateTimeout)
      updateTimeout = setTimeout(() => {
        updateMarkers()
      }, 100)
    }
  },
  { deep: false }
)

// 點擊外部關閉資訊面板
const handleClickOutside = (event) => {
  if (!isInfoPanelOpen.value || !infoPanelRef.value) return

  if (infoPanelRef.value.contains(event.target)) return

  const controlBar = document.querySelector('.control-bar')
  const locationBtn = document.querySelector('.location-btn')

  if (
    (controlBar && controlBar.contains(event.target)) ||
    (locationBtn && locationBtn.contains(event.target))
  ) {
    return
  }

  if (window.isMarkerClick) {
    window.isMarkerClick = false
    return
  }

  isInfoPanelOpen.value = false
}

// 清理資源
const cleanup = () => {
  if (searchTimeout) clearTimeout(searchTimeout)
  if (updateTimeout) clearTimeout(updateTimeout)

  if (map) {
    map.remove()
    map = null
  }
  markersLayer = null
  markers = []
  userLocationMarker = null

  couponDataCache.clear()
  searchCache.clear()

  document.removeEventListener('click', handleClickOutside)
}

onMounted(async () => {
  try {
    window.isMarkerClick = false
    await initMap()
    document.addEventListener('click', handleClickOutside, { passive: true })
  } catch (error) {
    console.error('地圖初始化失敗:', error)
    mapError.value = error.message || '地圖載入失敗'
  } finally {
    isMapLoading.value = false
  }
})

onUnmounted(() => {
  cleanup()
})
</script>

<style scoped lang="scss">
.map-container {
  position: relative;
  width: 100%;
  height: calc(100vh - 70px);
}

.loading-overlay,
.error-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(255, 255, 255, 0.9);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.loading-content,
.error-content {
  text-align: center;
  padding: 20px;
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

.retry-btn {
  margin-top: 12px;
  padding: 8px 16px;
  background-color: #4285f4;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.retry-btn:hover {
  background-color: #3367d6;
}

#map {
  width: 100%;
  height: 100%;
  z-index: 1;
}

.control-bar {
  position: absolute;
  top: 10px;
  left: 10px;
  width: 60%;
  max-width: 400px;
  z-index: 10;
  background-color: rgba(255, 255, 255, 0.95);
  padding: 10px;
  border-radius: 5px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);
  backdrop-filter: blur(5px);
}

.control-title {
  font-weight: bold;
  margin-bottom: 8px;
  text-align: center;
}

.control-buttons {
  display: flex;
  gap: 8px;
  margin-bottom: 8px;
}

.search-container {
  position: relative;
  margin: 10px 0;
  width: 100%;
}

.search-input {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 16px;
  box-sizing: border-box;
  transition: border-color 0.2s;
}

.search-input:focus {
  outline: none;
  border-color: #4285f4;
}

.search-results {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background-color: white;
  border: 1px solid #ddd;
  border-radius: 0 0 4px 4px;
  max-height: 200px;
  overflow-y: auto;
  z-index: 20;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
}

.search-result-item {
  padding: 8px 12px;
  cursor: pointer;
  border-bottom: 1px solid #eee;
  font-size: 14px;
  transition: background-color 0.2s;
}

.search-result-item:last-child {
  border-bottom: none;
}

.search-result-item:hover {
  background-color: #f5f5f5;
}

.control-options {
  display: flex;
  justify-content: center;
  margin-top: 8px;
  border-top: 1px solid #eee;
  padding-top: 8px;
}

.category-btn,
.option-btn {
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  background-color: white;
  cursor: pointer;
  transition: all 0.2s;
}

.option-btn {
  width: 100%;
  font-size: 12px;
}

.category-btn.active,
.option-btn.active {
  background-color: #4285f4;
  color: white;
  border-color: #4285f4;
}

.category-btn:hover:not(.active),
.option-btn:hover:not(.active) {
  background-color: #f1f1f1;
}

.category-btn.active:hover,
.option-btn.active:hover {
  background-color: #3367d6;
}

.location-btn {
  position: absolute;
  bottom: 160px;
  right: 6px;
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background-color: white;
  border: none;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10;
  transition: all 0.2s;
}

.location-btn:hover {
  background-color: #f1f1f1;
  transform: scale(1.05);
}

.location-btn:active {
  transform: scale(0.95);
}

.location-icon {
  font-size: 24px;
}

.map-info-panel {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background-color: white;
  border-radius: 12px 12px 0 0;
  box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.15);
  transform: translateY(calc(100% - 30px));
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  z-index: 20;
  max-height: 60vh;
  overflow: hidden;
}

.map-info-panel-open {
  transform: translateY(0);
}

.map-info-toggle {
  height: 30px;
  display: flex;
  justify-content: center;
  align-items: center;
  cursor: pointer;
  background-color: rgba(249, 249, 249, 0.8);
  border-radius: 12px 12px 0 0;
  backdrop-filter: blur(5px);
}

.map-toggle {
  font-size: 24px;
  color: #666;
  transition: transform 0.3s ease;
}

.arrow-upside {
  transform: rotate(180deg);
}

.map-info-wrapper {
  padding: 15px;
  overflow-y: auto;
  max-height: calc(60vh - 30px);
}

/* 響應式設計 */
@media (max-width: 768px) {
  .control-bar {
    top: 5px;
    left: 5px;
    right: 5px;
    padding: 8px;
  }

  .control-buttons {
    flex-wrap: wrap;
    gap: 4px;
  }

  .category-btn {
    flex: 1;
    min-width: calc(25% - 3px);
    font-size: 12px;
    padding: 6px 8px;
  }

  .location-btn {
    bottom: 120px;
    right: 10px;
    width: 44px;
    height: 44px;
  }

  .location-icon {
    font-size: 20px;
  }
}

/* 滾動條樣式優化 */
.search-results::-webkit-scrollbar,
.map-info-wrapper::-webkit-scrollbar {
  width: 4px;
}

.search-results::-webkit-scrollbar-track,
.map-info-wrapper::-webkit-scrollbar-track {
  background: #f1f1f1;
}

.search-results::-webkit-scrollbar-thumb,
.map-info-wrapper::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 2px;
}

.search-results::-webkit-scrollbar-thumb:hover,
.map-info-wrapper::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}

/* 除錯資訊樣式 */
.debug-info {
  padding: 20px;
  background-color: #f8f9fa;
  border-radius: 8px;
  margin: 10px;
}

.debug-info h3 {
  color: #dc3545;
  margin-bottom: 10px;
}

.debug-info p {
  color: #6c757d;
  margin-bottom: 10px;
}

.debug-info pre {
  background-color: #e9ecef;
  padding: 10px;
  border-radius: 4px;
  font-size: 12px;
  overflow-x: auto;
}

/* 民宿資訊樣式 */
.homestay-info {
  padding: 15px;
}

.homestay-header {
  margin-bottom: 15px;
}

.homestay-title {
  font-size: 18px;
  font-weight: bold;
  color: #333;
  margin-bottom: 8px;
}

.homestay-image {
  margin-bottom: 15px;
  border-radius: 8px;
  overflow: hidden;
}

.homestay-image img {
  width: 100%;
  height: 200px;
  object-fit: cover;
}

.homestay-details {
  margin-bottom: 15px;
}

.detail-item {
  display: flex;
  margin-bottom: 8px;
  font-size: 14px;
}

.detail-label {
  font-weight: bold;
  color: #555;
  min-width: 60px;
  flex-shrink: 0;
}

.detail-value {
  color: #666;
  flex: 1;
}

.homestay-contact {
  margin-bottom: 15px;
  padding: 10px;
  background-color: #f8f9fa;
  border-radius: 6px;
}

.contact-item {
  margin-bottom: 5px;
}

.contact-item:last-child {
  margin-bottom: 0;
}

.contact-link {
  color: #007bff;
  text-decoration: none;
  font-size: 14px;
  display: inline-block;
  transition: color 0.2s;
}

.contact-link:hover {
  color: #0056b3;
  text-decoration: underline;
}

.homestay-actions {
  text-align: center;
}

.view-detail-btn {
  display: inline-block;
  padding: 10px 20px;
  background-color: #4caf50;
  color: white;
  text-decoration: none;
  border-radius: 6px;
  font-weight: bold;
  transition: background-color 0.2s;
}

.view-detail-btn:hover {
  background-color: #45a049;
}

/* 載入狀態樣式 */
.loading-overlay-partial {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  z-index: 9999;
  color: white;
  font-size: 18px;
  font-weight: 500;
}

.loading-spinner {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.loading-spinner svg {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

/* 按鈕載入狀態 */
.category-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  pointer-events: none;
}

.category-btn:disabled .loading-spinner {
  color: #666;
}

/* 2026 map experience refresh */
.map-container {
  --map-ink: #173b36;
  --map-muted: #667085;
  --map-accent: #168c7b;
  --map-accent-dark: #0e6b5e;
  --map-surface: rgba(255, 255, 255, 0.94);
  height: calc(100dvh - 84px);
  min-height: 560px;
  overflow: hidden;
  background: #dce9e5;
}

.control-bar {
  top: 18px;
  left: 18px;
  width: min(420px, calc(100% - 36px));
  max-width: none;
  padding: 18px;
  border: 1px solid rgba(255, 255, 255, 0.72);
  border-radius: 20px;
  background: var(--map-surface);
  box-shadow:
    0 18px 44px rgba(23, 59, 54, 0.16),
    0 2px 8px rgba(23, 59, 54, 0.08);
  backdrop-filter: blur(16px) saturate(1.15);
  -webkit-backdrop-filter: blur(16px) saturate(1.15);
  z-index: 10;
}

.control-heading {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 14px;
}

.control-eyebrow {
  margin: 0 0 2px;
  color: var(--map-accent);
  font-size: 10px;
  font-weight: 800;
  letter-spacing: 0.14em;
}

.control-title {
  margin: 0;
  color: var(--map-ink);
  font-size: 20px;
  font-weight: 800;
  line-height: 1.3;
  text-align: left;
}

.place-count {
  flex: 0 0 auto;
  margin-top: 4px;
  padding: 5px 9px;
  border-radius: 999px;
  color: var(--map-accent-dark);
  background: #e6f5f1;
  font-size: 12px;
  font-weight: 700;
}

.control-buttons {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 8px;
  margin: 0 0 12px;
}

.category-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  min-width: 0;
  min-height: 52px;
  padding: 7px 6px;
  border: 1px solid #e2e8e6;
  border-radius: 13px;
  color: #52615f;
  background: #f8faf9;
  box-shadow: none;
  transition:
    transform 160ms ease,
    border-color 160ms ease,
    background-color 160ms ease,
    box-shadow 160ms ease;
}

.category-btn:hover:not(.active) {
  border-color: #b9d7d1;
  background: #f0f7f5;
  transform: translateY(-1px);
}

.category-btn.active,
.category-btn.active:hover {
  border-color: var(--map-accent);
  color: white;
  background: linear-gradient(145deg, #1a9b88, #117466);
  box-shadow: 0 7px 16px rgba(22, 140, 123, 0.22);
}

.category-btn:focus-visible,
.option-btn:focus-visible,
.location-btn:focus-visible,
.search-result-item:focus-visible,
.search-clear:focus-visible,
.map-info-toggle:focus-visible {
  outline: 3px solid rgba(22, 140, 123, 0.28);
  outline-offset: 2px;
}

.category-icon {
  font-size: 18px;
  line-height: 1;
}

.category-copy {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  line-height: 1.05;
}

.category-copy strong {
  font-size: 14px;
}

.category-copy small {
  margin-top: 3px;
  font-size: 10px;
  font-weight: 500;
  opacity: 0.78;
}

.search-container {
  margin: 0;
}

.search-icon {
  position: absolute;
  top: 50%;
  left: 14px;
  z-index: 1;
  color: #6f7f7c;
  font-size: 19px;
  transform: translateY(-50%);
  pointer-events: none;
}

.search-input {
  height: 46px;
  padding: 10px 42px;
  border: 1px solid #dce5e2;
  border-radius: 13px;
  color: var(--map-ink);
  background: #fff;
  font-size: 14px;
  box-shadow: inset 0 1px 2px rgba(23, 59, 54, 0.03);
}

.search-input::placeholder {
  color: #98a3a1;
}

.search-input:focus {
  border-color: var(--map-accent);
  box-shadow: 0 0 0 4px rgba(22, 140, 123, 0.1);
}

.search-clear {
  position: absolute;
  top: 7px;
  right: 7px;
  display: grid;
  width: 32px;
  height: 32px;
  padding: 0;
  place-items: center;
  border: 0;
  border-radius: 9px;
  color: #667085;
  background: #eef3f1;
}

.search-results {
  top: calc(100% + 8px);
  padding: 6px;
  border: 1px solid #e2e9e7;
  border-radius: 14px;
  box-shadow: 0 18px 40px rgba(23, 59, 54, 0.18);
}

.search-result-item {
  display: flex;
  align-items: center;
  width: 100%;
  gap: 10px;
  padding: 9px;
  border: 0;
  border-bottom: 1px solid #edf1f0;
  border-radius: 9px;
  color: var(--map-ink);
  background: transparent;
  text-align: left;
}

.search-result-item:hover {
  background: #f0f7f5;
}

.result-pin {
  display: grid;
  flex: 0 0 auto;
  width: 34px;
  height: 34px;
  place-items: center;
  border-radius: 10px;
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.45);
  color: #fff;
  font-size: 17px;
}

.result-copy {
  display: flex;
  min-width: 0;
  flex: 1;
  flex-direction: column;
}

.result-copy strong {
  overflow: hidden;
  font-size: 13px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.result-copy small {
  color: var(--map-muted);
  font-size: 11px;
}

.result-arrow {
  color: #98a3a1;
  font-size: 20px;
}

.control-options {
  align-items: center;
  justify-content: space-between;
  margin-top: 12px;
  padding: 11px 2px 0;
  border-top-color: #e7eceb;
}

.option-copy {
  display: flex;
  align-items: center;
  gap: 7px;
  color: #4f625f;
  font-size: 13px;
  font-weight: 650;
}

.option-copy svg {
  color: var(--map-accent);
  font-size: 17px;
}

.option-btn {
  position: relative;
  width: 42px;
  height: 24px;
  padding: 0;
  border: 0;
  border-radius: 999px;
  background: #cbd5d2;
}

.option-btn:hover:not(.active) {
  background: #b8c5c2;
}

.option-btn.active,
.option-btn.active:hover {
  background: var(--map-accent);
}

.switch-knob {
  position: absolute;
  top: 3px;
  left: 3px;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: #fff;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.18);
  transition: transform 180ms ease;
}

.option-btn.active .switch-knob {
  transform: translateX(18px);
}


.location-btn {
  right: 18px;
  bottom: 44px;
  width: auto;
  height: 46px;
  gap: 7px;
  padding: 0 15px;
  border: 1px solid rgba(23, 59, 54, 0.12);
  border-radius: 14px;
  color: var(--map-ink);
  background: rgba(255, 255, 255, 0.96);
  box-shadow: 0 9px 24px rgba(23, 59, 54, 0.18);
  font-weight: 700;
  z-index: 10;
}

.location-btn:hover {
  color: var(--map-accent-dark);
  background: #fff;
  transform: translateY(-2px);
}

.location-icon {
  color: var(--map-accent);
  font-size: 22px;
}

.location-label {
  font-size: 13px;
}

.detail-label,
.contact-link {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.detail-label svg,
.contact-link svg {
  flex: 0 0 auto;
  color: var(--map-accent);
  font-size: 17px;
}

.map-info-panel {
  left: 50%;
  right: auto;
  width: min(680px, calc(100% - 32px));
  border: 1px solid rgba(23, 59, 54, 0.09);
  border-bottom: 0;
  border-radius: 22px 22px 0 0;
  box-shadow: 0 -16px 40px rgba(23, 59, 54, 0.16);
  transform: translate(-50%, calc(100% - 24px));
}

.map-info-panel-open {
  transform: translate(-50%, 0);
}

.map-info-toggle {
  position: relative;
  width: 100%;
  height: 32px;
  padding: 0;
  border: 0;
  border-radius: 22px 22px 0 0;
  background: rgba(255, 255, 255, 0.96);
}

.panel-handle {
  width: 42px;
  height: 4px;
  border-radius: 999px;
  background: #c8d4d1;
}

.map-toggle {
  position: absolute;
  right: 16px;
  font-size: 20px;
}

.loading-content,
.error-content {
  max-width: min(360px, calc(100% - 32px));
  padding: 24px;
  border: 1px solid #e4ebe9;
  border-radius: 18px;
  box-shadow: 0 18px 44px rgba(23, 59, 54, 0.14);
}

.retry-btn,
.view-detail-btn {
  border-radius: 10px;
  background: var(--map-accent);
}

.retry-btn:hover,
.view-detail-btn:hover {
  background: var(--map-accent-dark);
}

/* 自訂 Leaflet 標記與動畫樣式 - 簡約清新風格 */
:deep(.custom-map-pin-wrapper) {
  background: transparent;
  border: none;
}

:deep(.custom-map-pin) {
  position: relative;
  width: 20px;
  height: 20px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;

  .pin-circle {
    width: 18px;
    height: 18px;
    border-radius: 50%;
    border: 3px solid #ffffff;
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.35);
    transition: transform 0.2s ease, box-shadow 0.2s ease;
  }

  &:hover {
    z-index: 100;
    .pin-circle {
      transform: scale(1.35);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
    }
    .pin-title {
      background-color: rgba(0, 0, 0, 0.9);
      transform: translate(-50%, -8px) scale(1.03);
    }
  }

  &.highlighted {
    z-index: 200;
    .pin-circle {
      transform: scale(1.6);
      box-shadow: 0 0 0 5px rgba(231, 111, 81, 0.4);
    }
    .pin-title {
      background-color: rgba(0, 0, 0, 0.95);
      font-weight: 700;
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.5);
    }
  }

  .pin-title {
    position: absolute;
    bottom: 100%;
    left: 50%;
    transform: translate(-50%, -6px);
    background-color: rgba(0, 0, 0, 0.75);
    color: #ffffff;
    font-weight: 700;
    font-size: 12px;
    padding: 3px 8px;
    border-radius: 4px;
    text-align: center;
    min-width: 80px;
    max-width: 150px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    pointer-events: none;
    box-shadow: 0 1px 4px rgba(0, 0, 0, 0.3);
    transition: all 0.2s ease;
  }
}

.map-container.hide-pin-labels :deep(.pin-title) {
  display: none !important;
}

:deep(.leaflet-bar) {
  border: none !important;
  border-radius: 12px !important;
  overflow: hidden;
  box-shadow: 0 4px 16px rgba(23, 59, 54, 0.14) !important;
  a {
    background-color: rgba(255, 255, 255, 0.96) !important;
    color: #334155 !important;
    border-bottom: 1px solid #f1f5f9 !important;
    width: 36px !important;
    height: 36px !important;
    line-height: 36px !important;
    font-size: 18px !important;
    transition: all 0.15s ease;
    &:hover {
      background-color: #ffffff !important;
      color: var(--map-accent) !important;
    }
  }
}

:deep(.leaflet-control-attribution) {
  background: rgba(255, 255, 255, 0.78) !important;
  backdrop-filter: blur(6px);
  font-size: 10px !important;
  color: #94a3b8 !important;
  padding: 2px 8px !important;
  border-top-left-radius: 8px;
  a {
    color: #64748b !important;
    text-decoration: none;
    &:hover {
      text-decoration: underline;
    }
  }
}

:deep(.user-loc-wrapper) {
  background: transparent;
  border: none;
}

:deep(.user-pulse-dot) {
  width: 16px;
  height: 16px;
  background-color: #4285f4;
  border: 3px solid #ffffff;
  border-radius: 50%;
  box-shadow: 0 0 0 rgba(66, 133, 244, 0.7);
  animation: user-pulse 2s infinite;
}

@keyframes user-pulse {
  0% {
    box-shadow: 0 0 0 0 rgba(66, 133, 244, 0.7);
  }
  70% {
    box-shadow: 0 0 0 12px rgba(66, 133, 244, 0);
  }
  100% {
    box-shadow: 0 0 0 0 rgba(66, 133, 244, 0);
  }
}

@media (max-width: 768px) {
  .map-container {
    height: calc(100dvh - 64px);
  }

  .control-bar {
    top: 10px;
    left: 10px;
    right: 10px;
    width: auto;
    padding: 13px;
    border-radius: 17px;
  }

  .control-heading {
    align-items: center;
    margin-bottom: 10px;
  }

  .control-eyebrow {
    display: none;
  }

  .control-title {
    font-size: 16px;
  }

  .place-count {
    margin-top: 0;
    font-size: 11px;
  }

  .control-buttons {
    display: flex;
    flex-wrap: nowrap;
    gap: 6px;
  }

  .category-btn {
    min-width: 0;
    min-height: 42px;
    padding: 5px;
  }

  .category-icon {
    font-size: 16px;
  }

  .category-copy strong {
    font-size: 12px;
  }

  .category-copy small {
    display: none;
  }

  .search-input {
    height: 42px;
    font-size: 13px;
  }

  .search-clear {
    top: 5px;
  }

  .control-options {
    margin-top: 9px;
    padding-top: 8px;
  }

  .location-btn {
    right: 12px;
    bottom: 38px;
    width: 46px;
    height: 46px;
    padding: 0;
    border-radius: 50%;
  }

  .location-label {
    display: none;
  }

  .map-info-panel {
    width: 100%;
    border-right: 0;
    border-left: 0;
    border-radius: 20px 20px 0 0;
  }

  .map-info-wrapper {
    padding: 10px;
  }
}

@media (max-width: 380px) {
  .control-bar {
    padding: 11px;
  }

  .category-btn {
    gap: 3px;
  }

  .category-icon {
    display: none;
  }
}

@media (prefers-reduced-motion: reduce) {
  .category-btn,
  .location-btn,
  .switch-knob,
  .map-info-panel,
  .map-toggle {
    transition: none;
  }
}
</style>
