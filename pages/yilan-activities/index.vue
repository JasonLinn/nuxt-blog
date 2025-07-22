<template>
  <div class="container">
    <!-- 頁首標題區 -->
    <div class="hero-section">
      <div class="row">
        <div class="col-12 text-center py-5">
          <h1 class="display-4 fw-bold text-primary mb-3">宜蘭活動總匯</h1>
          <p class="lead text-muted mb-4">探索宜蘭精彩活動，體驗在地文化之美</p>
          <NuxtLink 
            to="/yilan-activities/submit" 
            class="btn btn-primary btn-lg"
          >
            投稿活動
          </NuxtLink>
        </div>
      </div>
    </div>

    <!-- 搜尋與篩選區 -->
    <div class="selectWrapper mb-4">
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

    <!-- 活動統計 -->
    <div class="row mb-4">
      <div class="col-6 col-md-3 mb-3">
        <div class="card text-center">
          <div class="card-body">
            <h5 class="card-title text-primary fs-2 fw-bold">{{ totalActivities }}</h5>
            <p class="card-text text-muted">總活動數</p>
          </div>
        </div>
      </div>
      <div class="col-6 col-md-3 mb-3">
        <div class="card text-center">
          <div class="card-body">
            <h5 class="card-title text-success fs-2 fw-bold">{{ upcomingCount }}</h5>
            <p class="card-text text-muted">即將開始</p>
          </div>
        </div>
      </div>
      <div class="col-6 col-md-3 mb-3">
        <div class="card text-center">
          <div class="card-body">
            <h5 class="card-title text-info fs-2 fw-bold">{{ thisWeekCount }}</h5>
            <p class="card-text text-muted">本週活動</p>
          </div>
        </div>
      </div>
      <div class="col-6 col-md-3 mb-3">
        <div class="card text-center">
          <div class="card-body">
            <h5 class="card-title text-warning fs-2 fw-bold">{{ thisMonthCount }}</h5>
            <p class="card-text text-muted">本月活動</p>
          </div>
        </div>
      </div>
    </div>

    <!-- 成功提交通知 -->
    <div v-if="showSuccessMessage" class="alert alert-success alert-dismissible fade show mb-4" role="alert">
      <strong>🎉 投稿成功！</strong> 您的活動已成功提交，正在等待審核中。我們會盡快處理您的申請。
      <button type="button" class="btn-close" @click="hideSuccessMessage" aria-label="Close"></button>
    </div>

    <!-- 載入狀態 -->
    <div v-if="loading" class="text-center py-5">
      <div class="spinner-border text-primary" role="status">
        <span class="visually-hidden">載入中...</span>
      </div>
      <p class="text-muted mt-3">載入活動中...</p>
    </div>

    <!-- 無結果 -->
    <div v-else-if="filteredActivities.length === 0" class="text-center py-5">
      <h5 class="text-muted mb-3">目前沒有符合條件的活動</h5>
      <p class="text-muted mb-3">試試調整搜尋條件或</p>
      <NuxtLink to="/yilan-activities/submit" class="btn btn-outline-primary">
        投稿您的活動
      </NuxtLink>
    </div>

    <!-- 活動列表 -->
    <div v-else class="row">
      <div 
        v-for="activity in paginatedActivities" 
        :key="activity.id"
        class="col-12 col-md-6 col-lg-4 mb-4"
      >
        <div class="card activity-card h-100" @click="viewActivity(activity.id)">
          <!-- 活動圖片 -->
          <div class="activity-image">
            <img 
              v-if="activity.images && activity.images.length" 
              :src="activity.images[0]" 
              :alt="activity.title"
              class="card-img-top"
            />
            <div v-else class="card-img-top d-flex align-items-center justify-content-center bg-light text-muted">
              <span>無圖片</span>
            </div>
            
            <!-- 活動類型標籤 -->
            <span 
              v-if="activity.activity_type" 
              class="badge bg-primary position-absolute top-0 start-0 m-2"
            >
              {{ activity.activity_type }}
            </span>

            <!-- 日期標籤 -->
            <div class="position-absolute top-0 end-0 m-2 bg-white rounded p-2 text-center date-badge">
              <div class="fw-bold text-dark">{{ formatDayMonth(activity.event_date).day }}</div>
              <div class="small text-muted">{{ formatDayMonth(activity.event_date).month }}</div>
            </div>
          </div>

          <!-- 活動資訊 -->
          <div class="card-body">
            <h5 class="card-title activity-title">{{ activity.title }}</h5>
            <p class="card-text text-muted small activity-description">{{ activity.description }}</p>
            
            <div class="activity-meta">
              <div class="d-flex align-items-center mb-2">
                <small class="text-muted">📅 {{ formatEventDate(activity.event_date, activity.event_time) }}</small>
              </div>
              <div v-if="activity.location" class="d-flex align-items-center mb-2">
                <small class="text-muted">📍 {{ activity.location }}</small>
              </div>
              <div class="d-flex align-items-center">
                <small class="text-muted">🏢 {{ activity.organizer_name }}</small>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 分頁 -->
    <div v-if="totalPages > 1" class="d-flex justify-content-center mt-4">
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
</template>

<script setup>
const route = useRoute()
const activities = ref([])
const loading = ref(true)
const searchQuery = ref('')
const typeFilter = ref('')
const dateFilter = ref('')
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
  return activities.value.filter(activity => new Date(activity.event_date) >= today).length
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

const formatEventDate = (dateString, timeString) => {
  const date = new Date(dateString)
  let formatted = date.toLocaleDateString('zh-TW')
  
  if (timeString) {
    formatted += ` ${timeString}`
  }
  
  return formatted
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

<style scoped>
.hero-section {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-radius: 0.5rem;
  margin-bottom: 2rem;
}

.activity-card {
  cursor: pointer;
  transition: all 0.3s ease;
  border: none;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  position: relative;
}

.activity-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 4px 25px rgba(0,0,0,0.15);
}

.activity-image {
  height: 200px;
  overflow: hidden;
  position: relative;
}

.activity-image .card-img-top {
  height: 100%;
  object-fit: cover;
  transition: transform 0.3s ease;
}

.activity-card:hover .card-img-top {
  transform: scale(1.05);
}

.date-badge {
  opacity: 0.95;
  min-width: 60px;
}

.activity-title {
  font-size: 1.1rem;
  font-weight: 600;
  line-height: 1.4;
  height: 2.8rem;
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.activity-description {
  height: 3rem;
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.activity-meta {
  font-size: 0.85rem;
}

.selectWrapper {
  background: white;
  padding: 1.5rem;
  border-radius: 0.5rem;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}
</style>