<template>
  <div class="yilan-activities-page">
    <div class="container">
      <!-- 美麗的頁首標題區 -->
      <div class="hero-section">
        <div class="hero-content">
          <div class="hero-text">
            <h1>宜蘭活動總匯</h1>
            <p class="lead">探索宜蘭精彩活動，體驗在地文化之美</p>
          </div>
          <div class="hero-action">
            <NuxtLink 
              to="/yilan-activities/submit" 
              class="btn btn-primary btn-lg"
            >
              投稿活動
            </NuxtLink>
          </div>
        </div>
      </div>

      <!-- 美麗的搜尋與篩選區 -->
      <div class="filter-section">
        <div class="row g-2 g-md-3">
          <div class="col-12 col-md-5">
            <input 
              v-model="searchQuery" 
              type="text" 
              placeholder="搜尋活動標題或主辦單位..." 
              class="form-control"
            />
          </div>
          <div class="col-12 col-md-3">
            <select v-model="typeFilter" class="form-select">
              <option value="">所有類型</option>
              <option value="文化藝術">文化藝術</option>
              <option value="觀光旅遊">觀光旅遊</option>
              <option value="美食餐飲">美食餐飲</option>
              <option value="戶外運動">戶外運動</option>
              <option value="親子活動">親子活動</option>
              <option value="節慶慶典">節慶慶典</option>
              <option value="教育講座">教育講座</option>
              <option value="其他">其他</option>
            </select>
          </div>
          <div class="col-12 col-md-2">
            <select v-model="dateFilter" class="form-select">
              <option value="">所有時間</option>
              <option value="upcoming">即將開始</option>
              <option value="thisWeek">本週</option>
              <option value="thisMonth">本月</option>
              <option value="nextMonth">下個月</option>
            </select>
          </div>
          <div class="col-12 col-md-2 d-flex gap-1 gap-md-2">
            <button 
              @click="openAdvancedSearch" 
              class="btn btn-outline-primary flex-fill btn-sm-compact"
              title="進階搜尋"
            >
              <i class="bi bi-sliders"></i> 
              <span class="d-none d-sm-inline">進階</span>
            </button>
            <button 
              @click="clearAllFilters" 
              class="btn btn-outline-secondary btn-sm-compact"
              title="清除篩選"
            >
              <i class="bi bi-x-circle"></i>
            </button>
          </div>
        </div>
        
        <!-- 已選擇的篩選條件標籤 -->
        <div v-if="hasActiveFilters" class="active-filters mt-2">
          <div class="d-flex flex-wrap gap-2">
            <span v-if="searchQuery" class="filter-tag">
              關鍵字: {{ searchQuery }}
              <button @click="searchQuery = ''" class="tag-close">×</button>
            </span>
            <span v-if="typeFilter" class="filter-tag">
              類型: {{ typeFilter }}
              <button @click="typeFilter = ''" class="tag-close">×</button>
            </span>
            <span v-if="dateFilter" class="filter-tag">
              時間: {{ getDateFilterText(dateFilter) }}
              <button @click="dateFilter = ''" class="tag-close">×</button>
            </span>
            <span v-if="advancedFilters.location" class="filter-tag">
              地點: {{ advancedFilters.location }}
              <button @click="advancedFilters.location = ''" class="tag-close">×</button>
            </span>
            <span v-if="advancedFilters.organizer" class="filter-tag">
              主辦: {{ advancedFilters.organizer }}
              <button @click="advancedFilters.organizer = ''" class="tag-close">×</button>
            </span>
            <span v-if="advancedFilters.priceRange" class="filter-tag">
              價格: {{ getPriceRangeText(advancedFilters.priceRange) }}
              <button @click="advancedFilters.priceRange = ''" class="tag-close">×</button>
            </span>
          </div>
        </div>
      </div>

      <!-- 進階搜尋側邊面板 -->
      <div class="advanced-search-overlay" :class="{ active: showAdvancedSearch }" @click="closeAdvancedSearch">
        <div class="advanced-search-panel" @click.stop>
          <div class="panel-header">
            <h5 class="panel-title">
              <i class="bi bi-sliders me-2"></i>進階搜尋
            </h5>
            <button @click="closeAdvancedSearch" class="btn-close"></button>
          </div>
          
          <div class="panel-body">
            <!-- 地點篩選 -->
            <div class="filter-group">
              <label class="filter-label">
                <i class="bi bi-geo-alt me-2"></i>活動地點
              </label>
              <input 
                v-model="advancedFilters.location" 
                type="text" 
                placeholder="輸入地點關鍵字..." 
                class="form-control"
              />
            </div>

            <!-- 主辦單位篩選 -->
            <div class="filter-group">
              <label class="filter-label">
                <i class="bi bi-building me-2"></i>主辦單位
              </label>
              <input 
                v-model="advancedFilters.organizer" 
                type="text" 
                placeholder="輸入主辦單位..." 
                class="form-control"
              />
            </div>

            <!-- 價格範圍 -->
            <div class="filter-group">
              <label class="filter-label">
                <i class="bi bi-currency-dollar me-2"></i>價格範圍
              </label>
              <select v-model="advancedFilters.priceRange" class="form-select">
                <option value="">不限價格</option>
                <option value="free">免費活動</option>
                <option value="under100">100元以下</option>
                <option value="100to500">100-500元</option>
                <option value="500to1000">500-1000元</option>
                <option value="over1000">1000元以上</option>
              </select>
            </div>

            <!-- 活動狀態 -->
            <div class="filter-group">
              <label class="filter-label">
                <i class="bi bi-clock me-2"></i>活動狀態
              </label>
              <div class="form-check">
                <input 
                  v-model="advancedFilters.onlyUpcoming" 
                  type="checkbox" 
                  class="form-check-input" 
                  id="onlyUpcoming"
                />
                <label class="form-check-label" for="onlyUpcoming">
                  只顯示未開始的活動
                </label>
              </div>
              <div class="form-check">
                <input 
                  v-model="advancedFilters.hasImages" 
                  type="checkbox" 
                  class="form-check-input" 
                  id="hasImages"
                />
                <label class="form-check-label" for="hasImages">
                  只顯示有圖片的活動
                </label>
              </div>
            </div>

            <!-- 自定義日期範圍 -->
            <div class="filter-group">
              <label class="filter-label">
                <i class="bi bi-calendar-range me-2"></i>自定義日期範圍
              </label>
              <div class="row">
                <div class="col-6">
                  <input 
                    v-model="advancedFilters.startDate" 
                    type="date" 
                    class="form-control"
                    placeholder="開始日期"
                  />
                </div>
                <div class="col-6">
                  <input 
                    v-model="advancedFilters.endDate" 
                    type="date" 
                    class="form-control"
                    placeholder="結束日期"
                  />
                </div>
              </div>
            </div>
          </div>
          
          <div class="panel-footer">
            <div class="row">
              <div class="col-6">
                <button @click="clearAdvancedFilters" class="btn btn-outline-secondary w-100">
                  <i class="bi bi-arrow-clockwise me-2"></i>重置
                </button>
              </div>
              <div class="col-6">
                <button @click="applyAdvancedFilters" class="btn btn-primary w-100">
                  <i class="bi bi-check-lg me-2"></i>套用篩選
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 美麗的活動統計 -->
      <div class="stats-section">
        <div class="row g-1 g-md-3">
          <div class="col-3 col-md-3">
            <div class="stat-card">
              <div class="stat-number text-primary">{{ totalActivities }}</div>
              <p class="stat-label">總活動數</p>
            </div>
          </div>
          <div class="col-3 col-md-3">
            <div class="stat-card">
              <div class="stat-number text-success">{{ upcomingCount }}</div>
              <p class="stat-label">即將開始</p>
            </div>
          </div>
          <div class="col-3 col-md-3">
            <div class="stat-card">
              <div class="stat-number text-info">{{ thisWeekCount }}</div>
              <p class="stat-label">本週活動</p>
            </div>
          </div>
          <div class="col-3 col-md-3">
            <div class="stat-card">
              <div class="stat-number text-warning">{{ thisMonthCount }}</div>
              <p class="stat-label">本月活動</p>
            </div>
          </div>
        </div>
      </div>

      <!-- 美麗的成功提交通知 -->
      <div v-if="showSuccessMessage" class="alert success-alert alert-dismissible fade show" role="alert">
        <strong>🎉 投稿成功！</strong> 您的活動已成功提交，正在等待審核中。我們會盡快處理您的申請。
        <button type="button" class="btn-close" @click="hideSuccessMessage" aria-label="Close"></button>
      </div>

      <!-- 美麗的載入狀態 -->
      <div v-if="loading" class="loading-section">
        <div class="loading-card">
          <div class="spinner-border text-primary" role="status">
            <span class="visually-hidden">載入中...</span>
          </div>
          <p class="loading-text">載入活動中...</p>
        </div>
      </div>

      <!-- 美麗的空狀態 -->
      <div v-else-if="filteredActivities.length === 0" class="empty-section">
        <div class="empty-card">
          <div class="empty-icon">🎨</div>
          <h5 class="empty-title">目前沒有符合條件的活動</h5>
          <p class="empty-message">試試調整搜尋條件或投稿您的精彩活動</p>
          <NuxtLink to="/yilan-activities/submit" class="btn btn-outline-primary">
            投稿您的活動
          </NuxtLink>
        </div>
      </div>

      <!-- 美麗的活動列表 -->
      <div v-else class="activities-grid">
        <div class="row">
          <div 
            v-for="activity in paginatedActivities" 
            :key="activity.id"
            class="col-12 col-md-6 col-lg-4 mb-4"
          >
            <div class="activity-card" @click="viewActivity(activity.id)">
              <!-- 活動圖片 -->
              <div class="activity-image">
                <img 
                  v-if="activity.images && activity.images.length > 0" 
                  :src="activity.images[0]" 
                  :alt="activity.title"
                  class="card-img-top"
                  @error="handleImageError"
                />
                <div v-else class="no-image-placeholder">
                  <div class="placeholder-content">
                    <i class="bi bi-image placeholder-icon"></i>
                    <span class="placeholder-text">{{ getActivityTypeIcon(activity.activity_type) }}</span>
                    <small class="placeholder-subtitle">{{ activity.activity_type || '活動圖片' }}</small>
                  </div>
                </div>
                
                <!-- 活動類型標籤 -->
                <span 
                  v-if="activity.activity_type" 
                  class="activity-type-badge"
                >
                  {{ activity.activity_type }}
                </span>

                <!-- 日期標籤 -->
                <div class="date-badge">
                  <div class="day">{{ formatDayMonth(activity.event_date).day }}</div>
                  <div class="month">{{ formatDayMonth(activity.event_date).month }}</div>
                </div>
              </div>

              <!-- 活動資訊 -->
              <div class="card-body">
                <h5 class="activity-title">{{ activity.title }}</h5>
                <p class="activity-description">{{ activity.description }}</p>
                
                <div class="activity-meta">
                  <div class="meta-item">
                    <span class="meta-icon">📅</span>
                    <span>{{ formatEventDate(activity.event_date, activity.event_time, activity.end_date, activity.end_time, activity.is_multi_day) }}</span>
                  </div>
                  <div v-if="activity.location" class="meta-item">
                    <span class="meta-icon">📍</span>
                    <span>{{ activity.location }}</span>
                  </div>
                  <div class="meta-item">
                    <span class="meta-icon">🏢</span>
                    <span>{{ activity.organizer_name }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 美麗的分頁 -->
      <div v-if="totalPages > 1" class="pagination-section">
        <div class="pagination-card">
          <nav>
            <ul class="pagination">
              <li class="page-item" :class="{ disabled: currentPage === 1 }">
                <button 
                  class="page-link" 
                  @click="currentPage--" 
                  :disabled="currentPage === 1"
                >
                  上一頁
                </button>
              </li>
              <li class="page-item active">
                <span class="page-link">{{ currentPage }} / {{ totalPages }}</span>
              </li>
              <li class="page-item" :class="{ disabled: currentPage === totalPages }">
                <button 
                  class="page-link" 
                  @click="currentPage++" 
                  :disabled="currentPage === totalPages"
                >
                  下一頁
                </button>
              </li>
            </ul>
          </nav>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
const route = useRoute()
const activities = ref([])
const loading = ref(true)
const searchQuery = ref('')
const typeFilter = ref('')
const dateFilter = ref('upcoming') // 預設顯示即將開始的活動
const currentPage = ref(1)
const itemsPerPage = 12
const showSuccessMessage = ref(false)

// 進階搜尋相關
const showAdvancedSearch = ref(false)
const advancedFilters = ref({
  location: '',
  organizer: '',
  priceRange: '',
  onlyUpcoming: false,
  hasImages: false,
  startDate: '',
  endDate: ''
})

const filteredActivities = computed(() => {
  let filtered = activities.value

  // 基本關鍵字搜尋 (交集邏輯)
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    filtered = filtered.filter(activity => 
      activity.title.toLowerCase().includes(query) ||
      activity.organizer_name.toLowerCase().includes(query) ||
      (activity.description && activity.description.toLowerCase().includes(query))
    )
  }

  // 活動類型篩選 (交集)
  if (typeFilter.value) {
    filtered = filtered.filter(activity => activity.activity_type === typeFilter.value)
  }

  // 時間範圍篩選 (交集)
  if (dateFilter.value) {
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    
    filtered = filtered.filter(activity => {
      const eventDate = new Date(activity.event_date)
      
      switch (dateFilter.value) {
        case 'upcoming':
          return eventDate >= today
        case 'thisWeek':
          const weekEnd = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000)
          return eventDate >= today && eventDate <= weekEnd
        case 'thisMonth':
          return eventDate.getMonth() === now.getMonth() && eventDate.getFullYear() === now.getFullYear()
        case 'nextMonth':
          const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1)
          return eventDate.getMonth() === nextMonth.getMonth() && eventDate.getFullYear() === nextMonth.getFullYear()
        default:
          return true
      }
    })
  }

  // 進階搜尋篩選 (所有條件都是交集)
  
  // 地點篩選 (交集)
  if (advancedFilters.value.location) {
    const locationQuery = advancedFilters.value.location.toLowerCase()
    filtered = filtered.filter(activity => 
      activity.location && activity.location.toLowerCase().includes(locationQuery)
    )
  }

  // 主辦單位篩選 (交集)
  if (advancedFilters.value.organizer) {
    const organizerQuery = advancedFilters.value.organizer.toLowerCase()
    filtered = filtered.filter(activity => 
      activity.organizer_name.toLowerCase().includes(organizerQuery)
    )
  }

  // 價格範圍篩選 (交集)
  if (advancedFilters.value.priceRange) {
    filtered = filtered.filter(activity => {
      const price = parseFloat(activity.price || 0)
      
      switch (advancedFilters.value.priceRange) {
        case 'free':
          return price === 0 || !activity.price
        case 'under100':
          return price > 0 && price < 100
        case '100to500':
          return price >= 100 && price <= 500
        case '500to1000':
          return price >= 500 && price <= 1000
        case 'over1000':
          return price > 1000
        default:
          return true
      }
    })
  }

  // 只顯示未開始活動 (交集)
  if (advancedFilters.value.onlyUpcoming) {
    const today = new Date()
    filtered = filtered.filter(activity => {
      const endDateToCheck = activity.end_date ? new Date(activity.end_date) : new Date(activity.event_date)
      return endDateToCheck >= today
    })
  }

  // 只顯示有圖片的活動 (交集)
  if (advancedFilters.value.hasImages) {
    filtered = filtered.filter(activity => 
      activity.images && activity.images.length > 0
    )
  }

  // 自定義日期範圍 (交集)
  if (advancedFilters.value.startDate || advancedFilters.value.endDate) {
    filtered = filtered.filter(activity => {
      const eventDate = new Date(activity.event_date)
      
      let withinRange = true
      
      if (advancedFilters.value.startDate) {
        const startDate = new Date(advancedFilters.value.startDate)
        withinRange = withinRange && eventDate >= startDate
      }
      
      if (advancedFilters.value.endDate) {
        const endDate = new Date(advancedFilters.value.endDate)
        withinRange = withinRange && eventDate <= endDate
      }
      
      return withinRange
    })
  }

  return filtered.sort((a, b) => new Date(a.event_date) - new Date(b.event_date))
})

const totalPages = computed(() => Math.ceil(filteredActivities.value.length / itemsPerPage))

const paginatedActivities = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage
  const end = start + itemsPerPage
  return filteredActivities.value.slice(start, end)
})

const totalActivities = computed(() => activities.value.length)

const upcomingCount = computed(() => {
  const today = new Date()
  return activities.value.filter(activity => {
    const endDateToCheck = activity.end_date ? new Date(activity.end_date) : new Date(activity.event_date)
    return endDateToCheck >= today
  }).length
})

const thisWeekCount = computed(() => {
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const weekEnd = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000)
  
  return activities.value.filter(activity => {
    const eventDate = new Date(activity.event_date)
    return eventDate >= today && eventDate <= weekEnd
  }).length
})

const thisMonthCount = computed(() => {
  const now = new Date()
  return activities.value.filter(activity => {
    const eventDate = new Date(activity.event_date)
    return eventDate.getMonth() === now.getMonth() && eventDate.getFullYear() === now.getFullYear()
  }).length
})

// 檢查是否有任何篩選條件
const hasActiveFilters = computed(() => {
  return searchQuery.value || 
         typeFilter.value || 
         dateFilter.value || 
         advancedFilters.value.location ||
         advancedFilters.value.organizer ||
         advancedFilters.value.priceRange ||
         advancedFilters.value.onlyUpcoming ||
         advancedFilters.value.hasImages ||
         advancedFilters.value.startDate ||
         advancedFilters.value.endDate
})

// 進階搜尋相關函式
const openAdvancedSearch = () => {
  showAdvancedSearch.value = true
  document.body.style.overflow = 'hidden'
}

const closeAdvancedSearch = () => {
  showAdvancedSearch.value = false
  document.body.style.overflow = 'auto'
}

const clearAllFilters = () => {
  searchQuery.value = ''
  typeFilter.value = ''
  dateFilter.value = ''
  clearAdvancedFilters()
}

const clearAdvancedFilters = () => {
  advancedFilters.value = {
    location: '',
    organizer: '',
    priceRange: '',
    onlyUpcoming: false,
    hasImages: false,
    startDate: '',
    endDate: ''
  }
}

const applyAdvancedFilters = () => {
  closeAdvancedSearch()
  currentPage.value = 1
}

const getDateFilterText = (value) => {
  const dateTexts = {
    'upcoming': '即將開始',
    'thisWeek': '本週',
    'thisMonth': '本月',
    'nextMonth': '下個月'
  }
  return dateTexts[value] || value
}

const getPriceRangeText = (value) => {
  const priceTexts = {
    'free': '免費',
    'under100': '100元以下',
    '100to500': '100-500元',
    '500to1000': '500-1000元',
    'over1000': '1000元以上'
  }
  return priceTexts[value] || value
}

const formatDayMonth = (dateString) => {
  const date = new Date(dateString)
  return {
    day: date.getDate().toString().padStart(2, '0'),
    month: date.toLocaleDateString('zh-TW', { month: 'short' })
  }
}

const formatEventDate = (eventDate, eventTime, endDate, endTime, isMultiDay) => {
  const startDate = new Date(eventDate)
  let formatted = startDate.toLocaleDateString('zh-TW')
  
  if (eventTime) {
    formatted += ` ${eventTime}`
  }
  
  // 如果有結束日期且不同於開始日期，或者標記為多日活動
  if (endDate && (endDate !== eventDate || isMultiDay)) {
    const endDateObj = new Date(endDate)
    formatted += ` ~ ${endDateObj.toLocaleDateString('zh-TW')}`
    
    if (endTime) {
      formatted += ` ${endTime}`
    }
  } else if (endTime && endTime !== eventTime) {
    // 同一天但有不同的結束時間
    formatted += ` ~ ${endTime}`
  }
  
  return formatted
}

const getActivityTypeIcon = (activityType) => {
  const typeIcons = {
    '文化藝術': '🎨',
    '觀光旅遊': '🗺️',
    '美食餐飲': '🍽️',
    '戶外運動': '🏃‍♂️',
    '親子活動': '👨‍👩‍👧‍👦',
    '節慶慶典': '🎉',
    '教育講座': '📚',
    '商業促銷': '🛍️',
    '其他': '📅'
  }
  return typeIcons[activityType] || '📅'
}

const handleImageError = (event) => {
  console.log('圖片載入失敗:', event.target.src)
  // 可以在這裡設置備用圖片或其他處理
}

const fetchActivities = async () => {
  try {
    loading.value = true
    const response = await $fetch('/api/yilan-activities', {
      query: { status: 'approved' }
    })
    activities.value = response.data || []
  } catch (error) {
    console.error('Failed to fetch activities:', error)
    activities.value = []
  } finally {
    loading.value = false
  }
}

const viewActivity = (id) => {
  navigateTo(`/yilan-activities/${id}`)
}

watch([typeFilter, dateFilter, searchQuery, advancedFilters], () => {
  currentPage.value = 1
}, { deep: true })

const hideSuccessMessage = () => {
  showSuccessMessage.value = false
}

onMounted(() => {
  // 檢查是否有成功提交的查詢參數
  if (route.query.success === 'submitted') {
    showSuccessMessage.value = true
    
    // 自動隱藏成功訊息
    setTimeout(() => {
      showSuccessMessage.value = false
    }, 8000)
  }
  
  fetchActivities()
})

// 清理函式 - 確保離開頁面時恢復 body 的 overflow
onUnmounted(() => {
  document.body.style.overflow = 'auto'
})

// 設定頁面 SEO
useHead({
  title: '宜蘭活動總匯 | 探索精彩在地活動',
  meta: [
    { name: 'description', content: '宜蘭活動總匯 - 探索宜蘭各種精彩活動，包含文化藝術、觀光旅遊、美食餐飲等豐富內容' },
    { property: 'og:title', content: '宜蘭活動總匯' },
    { property: 'og:description', content: '探索宜蘭精彩活動，體驗在地文化之美' }
  ]
})
</script>

<style scoped lang="scss">
@import '~/assets/scss/yilan-activities-index.scss';
</style>