<!-- pages/map.vue -->
<template>
  <div
    class="map-container"
    :class="{ 'hide-pin-labels': !showLabels, 'is-panel-open': isInfoPanelOpen }"
  >
    <!-- 載入狀態 -->
    <div v-if="isMapLoading" class="map-overlay" role="status" aria-live="polite">
      <div class="map-overlay__card">
        <span class="spinner-border text-primary" aria-hidden="true"></span>
        <p class="map-overlay__text">載入地圖中...</p>
      </div>
    </div>

    <!-- 錯誤狀態 -->
    <div v-else-if="mapError" class="map-overlay">
      <div class="map-overlay__card yp-empty yp-empty--error">
        <div class="yp-empty__icon"><Icon name="ri:error-warning-line" /></div>
        <h2 class="yp-empty__title">地圖載入失敗</h2>
        <p class="yp-empty__text">{{ mapError }}</p>
        <button type="button" class="btn btn-primary" @click="retryLoadMap">重試</button>
      </div>
    </div>

    <!-- 民宿資料載入狀態（不阻擋操作） -->
    <div
      v-if="isLoadingHomestay && activeCategoriesMap.housing && !isMapLoading"
      class="map-pill map-pill--loading"
      role="status"
      aria-live="polite"
    >
      <span class="spinner-border spinner-border-sm text-primary" aria-hidden="true"></span>
      載入民宿資料中...
    </div>

    <section v-show="!isMapLoading && !mapError" class="control-bar" aria-label="地圖探索工具">
      <h1 class="visually-hidden">探索宜蘭好去處</h1>

      <!-- 搜尋 -->
      <div class="yp-search map-search">
        <div class="yp-search__field">
          <Icon name="ri:search-line" class="yp-search__icon" aria-hidden="true" />
          <label class="visually-hidden" for="map-place-search">搜尋地點</label>
          <input
            id="map-place-search"
            v-model="searchQuery"
            type="text"
            placeholder="搜尋店家、景點或住宿"
            class="yp-search__input"
            autocomplete="off"
            spellcheck="false"
            :aria-expanded="searchResults.length > 0"
            aria-controls="map-search-results"
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

        <div
          v-if="searchResults && searchResults.length > 0"
          id="map-search-results"
          class="yp-card map-results"
        >
          <button
            v-for="(result, index) in searchResults"
            :key="result.id || index"
            class="map-result"
            type="button"
            @click="navigateToLocation(result)"
          >
            <span
              class="map-result__pin"
              :style="{ backgroundColor: getCategoryMeta(result.category).color }"
            >
              <Icon :name="getCategoryMeta(result.category).icon" aria-hidden="true" />
            </span>
            <span class="map-result__copy">
              <strong class="yp-clamp-1">{{ result.title }}</strong>
              <small>{{ getCategoryMeta(result.category).label }}</small>
            </span>
            <Icon name="ri:arrow-right-s-line" class="map-result__arrow" aria-hidden="true" />
          </button>
        </div>
        <div v-else-if="hasSearched && searchQuery.trim()" class="yp-card map-results">
          <p class="map-results__empty">
            <Icon name="ri:map-pin-line" aria-hidden="true" />
            找不到符合的地點，換個關鍵字試試
          </p>
        </div>
      </div>

      <!-- 類別篩選 -->
      <div class="yp-chips map-chips" role="group" aria-label="地點類別">
        <button
          v-for="(category, index) in categories"
          :key="index"
          class="yp-chip map-chip"
          :class="{ 'is-active': activeCategoriesMap[category.key] }"
          :style="{ '--chip-color': category.color }"
          :disabled="category.key === 'housing' && isLoadingHomestay"
          type="button"
          :aria-pressed="activeCategoriesMap[category.key]"
          :aria-label="`${activeCategoriesMap[category.key] ? '隱藏' : '顯示'}${category.label}`"
          @click="toggleCategory(category.key)"
        >
          <span
            v-if="category.key === 'housing' && isLoadingHomestay"
            class="spinner-border spinner-border-sm"
            aria-hidden="true"
          ></span>
          <Icon v-else :name="category.icon" class="map-chip__icon" aria-hidden="true" />
          {{ category.label }}
        </button>
        <button
          class="yp-chip map-chip map-chip--toggle"
          :class="{ 'is-active': showLabels }"
          type="button"
          role="switch"
          :aria-checked="showLabels"
          @click="toggleLabels"
        >
          <Icon name="ri:price-tag-3-line" class="map-chip__icon" aria-hidden="true" />
          顯示店名
        </button>
      </div>

      <!-- 地點數量 / 狀態 -->
      <div class="map-status" aria-live="polite">
        <template v-if="isDataLoading">
          <span class="yp-skeleton" style="width: 72px; height: 12px"></span>
          載入地點中...
        </template>
        <template v-else-if="dataError">
          <Icon name="ri:error-warning-line" class="map-status__icon--error" aria-hidden="true" />
          地點資料載入失敗
          <button type="button" class="map-status__action" @click="reloadPlaces">重新載入</button>
        </template>
        <template v-else-if="couponData.length === 0">
          <Icon name="ri:map-pin-line" aria-hidden="true" />
          此分類目前沒有地點，試試其他類別
        </template>
        <template v-else>
          <b class="yp-num">{{ couponData.length }}</b> 個地點
        </template>
      </div>
    </section>

    <div id="map" ref="mapRef"></div>

    <button
      v-show="!isMapLoading && !mapError"
      class="location-btn"
      type="button"
      aria-label="移動到我的目前位置"
      :disabled="isLocating"
      @click="getCurrentLocation"
    >
      <span v-if="isLocating" class="spinner-border spinner-border-sm" aria-hidden="true"></span>
      <Icon v-else name="ri:crosshair-2-line" class="location-icon" aria-hidden="true" />
      <span class="location-label">我的位置</span>
    </button>

    <!-- 地標資訊面板（手機為底部抽屜，位於 Tab Bar 之上） -->
    <div
      ref="infoPanelRef"
      class="map-info-panel"
      :class="{ 'map-info-panel-open': isInfoPanelOpen, 'is-empty': !selectedCoupon }"
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
        <article
          v-if="selectedCoupon.detailUrl && selectedCoupon.detailUrl.includes('/homestays/')"
          class="map-place"
        >
          <div v-if="selectedCoupon.image_url" class="yp-card__media map-place__media">
            <img :src="selectedCoupon.image_url" :alt="selectedCoupon.title" loading="lazy" />
          </div>

          <div class="map-place__body">
            <div class="yp-tags">
              <span class="yp-tag yp-tag--primary">住宿</span>
            </div>
            <h2 class="map-place__title">{{ selectedCoupon.title }}</h2>

            <ul class="yp-info-list">
              <li v-if="selectedCoupon.description">
                <span class="yp-info-list__label"><Icon name="ri:map-pin-line" /> 位置</span>
                <span class="yp-info-list__value">{{ selectedCoupon.description }}</span>
              </li>
              <li v-if="selectedCoupon.price">
                <span class="yp-info-list__label">
                  <Icon name="ri:money-dollar-circle-line" /> 價格
                </span>
                <span class="yp-info-list__value">{{ selectedCoupon.price }}</span>
              </li>
              <li v-if="selectedCoupon.min_guests || selectedCoupon.max_guests">
                <span class="yp-info-list__label"><Icon name="ri:group-line" /> 人數</span>
                <span class="yp-info-list__value">
                  {{ selectedCoupon.min_guests || 1 }} -
                  {{ selectedCoupon.max_guests || '不限' }} 人
                </span>
              </li>
              <li v-if="selectedCoupon.content">
                <span class="yp-info-list__label"><Icon name="ri:file-text-line" /> 描述</span>
                <span class="yp-info-list__value">{{ selectedCoupon.content }}</span>
              </li>
            </ul>

            <div class="map-place__actions">
              <a
                v-if="selectedCoupon.phone"
                :href="`tel:${selectedCoupon.phone}`"
                class="btn btn-soft btn-icon"
              >
                <Icon name="ri:phone-line" />{{ selectedCoupon.phone }}
              </a>
              <a
                v-if="selectedCoupon.website"
                :href="selectedCoupon.website"
                target="_blank"
                rel="noopener"
                class="btn btn-soft btn-icon"
              >
                <Icon name="ri:global-line" />官方網站
              </a>
              <nuxt-link :to="selectedCoupon.detailUrl" class="btn btn-primary map-place__cta">
                查看詳細資訊
              </nuxt-link>
            </div>
          </div>
        </article>

        <!-- 原有的優惠券資訊 -->
        <CouponInfo v-else :key="selectedCoupon.id" :coupon-id="selectedCoupon.id"></CouponInfo>
      </div>
      <div v-else-if="selectedCoupon && !selectedCoupon.id" class="map-info-wrapper">
        <div class="yp-empty yp-empty--error map-info-empty">
          <div class="yp-empty__icon"><Icon name="ri:information-line" /></div>
          <h2 class="yp-empty__title">這個地點暫無詳細資訊</h2>
          <p class="yp-empty__text">請改選地圖上的其他地點。</p>
        </div>
      </div>
      <div v-else-if="isInfoPanelOpen" class="map-info-wrapper">
        <div class="yp-empty map-info-empty">
          <div class="yp-empty__icon"><Icon name="ri:map-pin-2-line" /></div>
          <h2 class="yp-empty__title">點選地圖上的地點</h2>
          <p class="yp-empty__text">查看店家資訊與優惠內容。</p>
        </div>
      </div>
    </div>

    <!-- 輕提示 -->
    <div v-if="toastMessage" class="yp-toast" role="status">{{ toastMessage }}</div>
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
// 地點資料載入 / 錯誤狀態（給浮動狀態列使用）
const isDataLoading = computed(() => couponObject.value?.pending === true)
const dataError = computed(() => !!couponObject.value?.error)
const reloadPlaces = () => store.fetchAndSetCoupon({ pageSize: 150 })

// 輕提示（取代 alert）
const toastMessage = ref('')
let toastTimeout = null
const showToast = (message) => {
  toastMessage.value = message
  if (toastTimeout) clearTimeout(toastTimeout)
  toastTimeout = setTimeout(() => {
    toastMessage.value = ''
  }, 3500)
}
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

const hasSearched = ref(false)

const handleSearchInput = () => {
  if (searchTimeout) clearTimeout(searchTimeout)
  hasSearched.value = false

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
  hasSearched.value = false
}

const performSearch = () => {
  const query = searchQuery.value.trim()

  if (!query) {
    searchResults.value = []
    return
  }

  if (searchCache.has(query)) {
    searchResults.value = searchCache.get(query)
    hasSearched.value = true
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
  hasSearched.value = true
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
  hasSearched.value = false

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
  return String(str || '')
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
const isLocating = ref(false)

const getCurrentLocation = () => {
  if (!navigator.geolocation) {
    showToast('您的瀏覽器不支援地理位置功能。')
    return
  }

  isLocating.value = true

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

      isLocating.value = false
    },
    (error) => {
      console.error('獲取位置失敗:', error)
      showToast('無法獲取您的位置，請確保已授予位置權限。')
      isLocating.value = false
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
  if (toastTimeout) clearTimeout(toastTimeout)

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
// 地圖撐滿 Header 與（手機）Tab Bar 之間的可視區
.map-container {
  position: relative;
  width: 100%;
  overflow: hidden;
  background: $yp-surface-2;
  min-height: 420px;
  height: calc(100vh - 60px - var(--yp-tabbar-h));
  height: calc(100dvh - 60px - var(--yp-tabbar-h) - env(safe-area-inset-bottom));

  @media (min-width: $yp-bp-md) {
    min-height: 520px;
    height: calc(100vh - #{$yp-header-h});
    height: calc(100dvh - #{$yp-header-h});
  }
}

#map {
  position: absolute;
  inset: 0;
  z-index: 1;
}

// ───── 載入 / 錯誤覆蓋層 ─────
.map-overlay {
  position: absolute;
  inset: 0;
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
  background: rgba($yp-bg, 0.88);

  &__card {
    width: 100%;
    max-width: 340px;
    padding: 28px 24px;
    text-align: center;
    background: $yp-surface;
    border-radius: $yp-radius-lg;
    box-shadow: $yp-shadow-lg;
  }

  &__text {
    margin: 12px 0 0;
    color: $yp-muted;
  }
}

.map-pill {
  position: absolute;
  top: 12px;
  left: 50%;
  z-index: 30;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  border-radius: $yp-radius-pill;
  background: $yp-surface;
  box-shadow: $yp-shadow-lg;
  color: $yp-ink;
  font-size: 0.875rem;
  font-weight: 500;
  transform: translateX(-50%);
  white-space: nowrap;
}

// ───── 左上浮動控制區 ─────
.control-bar {
  position: absolute;
  top: 12px;
  left: 12px;
  right: 12px;
  z-index: 10;
  display: flex;
  flex-direction: column;
  gap: 10px;
  pointer-events: none;

  > * {
    pointer-events: auto;
  }

  @media (min-width: $yp-bp-md) {
    top: 16px;
    left: 16px;
    right: auto;
    width: 420px;
  }
}

.map-search {
  // 搜尋框本身已有陰影，結果清單浮在其下
  .yp-search__input {
    min-height: 44px;
  }
}

.map-results {
  position: absolute;
  top: calc(100% + 8px);
  left: 0;
  right: 0;
  z-index: 20;
  max-height: 280px;
  overflow-y: auto;
  padding: 6px;
  box-shadow: $yp-shadow-lg;

  &__empty {
    display: flex;
    align-items: center;
    gap: 8px;
    margin: 0;
    padding: 14px 12px;
    color: $yp-muted;
    font-size: 0.9375rem;
  }
}

.map-result {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  min-height: 52px;
  padding: 8px 10px;
  border: 0;
  border-radius: $yp-radius;
  background: transparent;
  color: $yp-ink;
  text-align: left;
  transition: background-color 0.15s ease;

  &:hover,
  &:focus-visible {
    background: $yp-primary-soft;
  }

  &__pin {
    display: grid;
    flex: none;
    width: 36px;
    height: 36px;
    place-items: center;
    border-radius: 10px;
    color: #fff;
    font-size: 18px;
  }

  &__copy {
    display: flex;
    flex: 1;
    min-width: 0;
    flex-direction: column;
    line-height: 1.35;

    strong {
      font-size: 0.9375rem;
      font-weight: 700;
    }

    small {
      color: $yp-muted;
      font-size: 0.75rem;
    }
  }

  &__arrow {
    flex: none;
    color: $yp-subtle;
    font-size: 20px;
  }
}

// 類別 chips：白底 + 陰影，浮在地圖上
.map-chips {
  padding: 2px 2px 10px;
  margin-bottom: -8px;
}

.map-chip {
  box-shadow: $yp-shadow-sm;
  border-color: transparent;
  min-height: 40px;
  padding-left: 14px;
  padding-right: 14px;

  &__icon {
    color: var(--chip-color, #{$yp-primary});
    font-size: 18px;
  }

  &--toggle &__icon {
    color: $yp-primary;
  }

  &.is-active &__icon {
    color: #fff;
  }

  &:disabled {
    opacity: 0.7;
    cursor: wait;
  }
}

.map-status {
  align-self: flex-start;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 5px 14px;
  border-radius: $yp-radius-pill;
  background: rgba(#fff, 0.95);
  box-shadow: $yp-shadow-sm;
  color: $yp-muted;
  font-size: 0.8125rem;

  b {
    color: $yp-ink;
    font-size: 0.9375rem;
  }

  &__icon--error {
    color: $yp-danger;
  }

  &__action {
    padding: 0 0 0 4px;
    border: 0;
    background: transparent;
    color: $yp-primary-ink;
    font-weight: 700;
    text-decoration: underline;
  }
}

// ───── 我的位置 ─────
.location-btn {
  position: absolute;
  right: 6px;
  bottom: 124px;
  z-index: 10;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  width: 44px;
  height: 44px;
  padding: 0;
  border: 0;
  border-radius: $yp-radius-pill;
  background: $yp-surface;
  color: $yp-ink;
  box-shadow: $yp-shadow-lg;
  font-size: 0.875rem;
  font-weight: 500;
  transition:
    color 0.15s ease,
    transform 0.15s ease;

  &:hover:not(:disabled) {
    color: $yp-primary-ink;
    transform: translateY(-1px);
  }

  &:disabled {
    opacity: 0.6;
    cursor: wait;
  }

  @media (min-width: $yp-bp-md) {
    right: 10px;
    width: auto;
    padding: 0 16px;
  }
}

.location-icon {
  color: $yp-primary;
  font-size: 22px;
}

.location-label {
  display: none;

  @media (min-width: $yp-bp-md) {
    display: inline;
  }
}

// 手機：資訊面板展開時，隱藏被遮住的定位鈕
@media (max-width: #{$yp-bp-md - 1px}) {
  .is-panel-open .location-btn {
    opacity: 0;
    pointer-events: none;
  }
}

// ───── 地點資訊面板（底部抽屜） ─────
.map-info-panel {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 20;
  display: flex;
  flex-direction: column;
  max-height: 64%;
  margin: 0 auto;
  background: $yp-surface;
  border-radius: $yp-radius-lg $yp-radius-lg 0 0;
  box-shadow: 0 -12px 32px rgba($yp-ink, 0.16);
  transform: translateY(calc(100% - 40px));
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);

  &.is-empty:not(.map-info-panel-open) {
    visibility: hidden;
    transform: translateY(100%);
  }

  @media (min-width: $yp-bp-md) {
    width: min(680px, calc(100% - 32px));
    max-height: 70%;
  }
}

.map-info-panel-open {
  transform: translateY(0);
}

.map-info-toggle {
  position: relative;
  display: flex;
  flex: none;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 40px;
  padding: 0;
  border: 0;
  border-radius: $yp-radius-lg $yp-radius-lg 0 0;
  background: transparent;
  cursor: pointer;
}

.panel-handle {
  width: 40px;
  height: 4px;
  border-radius: $yp-radius-pill;
  background: $yp-line;
}

.map-toggle {
  position: absolute;
  right: 12px;
  color: $yp-muted;
  font-size: 22px;
  transition: transform 0.3s ease;
}

.arrow-upside {
  transform: rotate(180deg);
}

.map-info-wrapper {
  flex: 1;
  min-height: 0;
  padding: 0 16px 20px;
  overflow-y: auto;
  overscroll-behavior: contain;
}

.map-info-empty {
  padding: 24px 16px;
}

// ───── 民宿資訊卡 ─────
.map-place {
  display: grid;
  gap: 14px;

  &__media {
    border-radius: $yp-radius;
    aspect-ratio: 16 / 9;
    max-height: 200px;
    width: 100%;
  }

  &__title {
    margin: 8px 0 4px;
    color: $yp-ink;
    font-size: 1.0625rem;
    font-weight: 700;
    line-height: 1.4;
  }

  &__actions {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin-top: 14px;
  }

  &__cta {
    flex: 1 1 100%;
  }

  .yp-info-list__label {
    display: inline-flex;
    align-items: flex-start;
    gap: 4px;
    flex-basis: 76px;

    :deep(svg) {
      flex: none;
      margin-top: 4px;
      color: $yp-primary;
    }
  }

  @media (min-width: $yp-bp-md) {
    grid-template-columns: 220px minmax(0, 1fr);
    gap: 20px;

    &__media {
      aspect-ratio: 4 / 3;
      max-height: none;
    }

    &__cta {
      flex: 0 0 auto;
      margin-left: auto;
    }
  }
}

// ───── Leaflet 標記與控制項 ─────
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
    border: 3px solid #fff;
    box-shadow: 0 2px 6px rgba($yp-ink, 0.35);
    transition:
      transform 0.2s ease,
      box-shadow 0.2s ease;
  }

  &:hover {
    z-index: 100;

    .pin-circle {
      transform: scale(1.35);
      box-shadow: 0 4px 12px rgba($yp-ink, 0.4);
    }

    .pin-title {
      background-color: rgba($yp-ink, 0.95);
      transform: translate(-50%, -8px) scale(1.03);
    }
  }

  &.highlighted {
    z-index: 200;

    .pin-circle {
      transform: scale(1.6);
      box-shadow: 0 0 0 5px rgba($yp-primary, 0.4);
    }

    .pin-title {
      background-color: $yp-ink;
      font-weight: 700;
      box-shadow: 0 4px 16px rgba($yp-ink, 0.5);
    }
  }

  .pin-title {
    position: absolute;
    bottom: 100%;
    left: 50%;
    transform: translate(-50%, -6px);
    background-color: rgba($yp-ink, 0.82);
    color: #fff;
    font-weight: 700;
    font-size: 12px;
    padding: 3px 8px;
    border-radius: 6px;
    text-align: center;
    min-width: 80px;
    max-width: 150px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    pointer-events: none;
    box-shadow: 0 1px 4px rgba($yp-ink, 0.3);
    transition: all 0.2s ease;
  }
}

.map-container.hide-pin-labels :deep(.pin-title) {
  display: none !important;
}

:deep(.leaflet-bar) {
  border: none !important;
  border-radius: $yp-radius !important;
  overflow: hidden;
  box-shadow: $yp-shadow-lg !important;

  a {
    width: 36px !important;
    height: 36px !important;
    line-height: 36px !important;
    font-size: 18px !important;
    background-color: $yp-surface !important;
    color: $yp-ink !important;
    border-bottom: 1px solid $yp-line !important;
    transition: all 0.15s ease;

    &:hover {
      background-color: $yp-primary-soft !important;
      color: $yp-primary-ink !important;
    }
  }
}

:deep(.leaflet-control-attribution) {
  background: rgba(#fff, 0.8) !important;
  backdrop-filter: blur(6px);
  font-size: 10px !important;
  color: $yp-muted !important;
  padding: 2px 8px !important;
  border-top-left-radius: 8px;

  a {
    color: $yp-muted !important;
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
  background-color: $yp-primary;
  border: 3px solid #fff;
  border-radius: 50%;
  box-shadow: 0 0 0 rgba($yp-primary, 0.7);
  animation: user-pulse 2s infinite;
}

@keyframes user-pulse {
  0% {
    box-shadow: 0 0 0 0 rgba($yp-primary, 0.6);
  }
  70% {
    box-shadow: 0 0 0 12px rgba($yp-primary, 0);
  }
  100% {
    box-shadow: 0 0 0 0 rgba($yp-primary, 0);
  }
}

@media (prefers-reduced-motion: reduce) {
  .location-btn,
  .map-info-panel,
  .map-toggle,
  :deep(.pin-circle) {
    transition: none;
  }

  :deep(.user-pulse-dot) {
    animation: none;
  }
}
</style>
