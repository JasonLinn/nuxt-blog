<template>
  <div class="yilan-activities-page">
    <div class="container">
      <!-- 美麗的頁首標題區 -->
      <div class="hero-section">
        <div class="hero-content">
          <h1>宜蘭活動總匯</h1>
          <p class="lead">探索宜蘭精彩活動，體驗在地文化之美</p>
          <NuxtLink 
            to="/yilan-activities/submit" 
            class="btn btn-primary btn-lg"
          >
            投稿活動
          </NuxtLink>
        </div>
      </div>

      <!-- 美麗的搜尋與篩選區 -->
      <div class="filter-section">
        <div class="row">
          <div class="col-12 col-md-4 mb-3">
            <input 
              v-model="searchQuery" 
              type="text" 
              placeholder="搜尋活動標題或主辦單位..." 
              class="form-control"
            />
          </div>
          <div class="col-12 col-md-4 mb-3">
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
          <div class="col-12 col-md-4 mb-3">
            <select v-model="dateFilter" class="form-select">
              <option value="">所有時間</option>
              <option value="upcoming">即將開始</option>
              <option value="thisWeek">本週</option>
              <option value="thisMonth">本月</option>
              <option value="nextMonth">下個月</option>
            </select>
          </div>
        </div>
      </div>

      <!-- 美麗的活動統計 -->
      <div class="stats-section">
        <div class="row">
          <div class="col-6 col-md-3 mb-3">
            <div class="stat-card">
              <div class="stat-number text-primary">{{ totalActivities }}</div>
              <p class="stat-label">總活動數</p>
            </div>
          </div>
          <div class="col-6 col-md-3 mb-3">
            <div class="stat-card">
              <div class="stat-number text-success">{{ upcomingCount }}</div>
              <p class="stat-label">即將開始</p>
            </div>
          </div>
          <div class="col-6 col-md-3 mb-3">
            <div class="stat-card">
              <div class="stat-number text-info">{{ thisWeekCount }}</div>
              <p class="stat-label">本週活動</p>
            </div>
          </div>
          <div class="col-6 col-md-3 mb-3">
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

const filteredActivities = computed(() => {
  let filtered = activities.value

  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    filtered = filtered.filter(activity => 
      activity.title.toLowerCase().includes(query) ||
      activity.organizer_name.toLowerCase().includes(query) ||
      (activity.description && activity.description.toLowerCase().includes(query))
    )
  }

  if (typeFilter.value) {
    filtered = filtered.filter(activity => activity.activity_type === typeFilter.value)
  }

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

watch([typeFilter, dateFilter, searchQuery], () => {
  currentPage.value = 1
})

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