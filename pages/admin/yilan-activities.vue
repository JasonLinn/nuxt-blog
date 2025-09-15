<template>
  <div class="admin-panel">
    <div class="container">
      <AdminHeader />

      <!-- 美麗的標題區 -->
      <div class="hero-header">
        <div class="hero-content">
          <h1 class="hero-title">宜蘭活動總匯管理</h1>
          <p class="hero-subtitle">管理活動投稿審核、編輯與發布</p>
          <div class="hero-stats">
            <div class="stat-item">
              <div class="stat-number">{{ activities.filter(a => a.status === 'pending').length }}</div>
              <div class="stat-label">待審核</div>
            </div>
            <div class="stat-item">
              <div class="stat-number">{{ activities.filter(a => a.status === 'approved').length }}</div>
              <div class="stat-label">已上架</div>
            </div>
            <div class="stat-item">
              <div class="stat-number">{{ activities.filter(a => a.status === 'rejected').length }}</div>
              <div class="stat-label">已退回</div>
            </div>
          </div>
        </div>
      </div>

      <!-- 美麗的篩選器 -->
      <div class="filter-section">
        <div class="filter-card">
          <div class="filter-header">
            <h3 class="filter-title">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 16 16">
                <path d="M6 10.5a.5.5 0 0 1 .5-.5h3a.5.5 0 0 1 0 1h-3a.5.5 0 0 1-.5-.5m-2-3a.5.5 0 0 1 .5-.5h7a.5.5 0 0 1 0 1h-7a.5.5 0 0 1-.5-.5m-2-3a.5.5 0 0 1 .5-.5h11a.5.5 0 0 1 0 1h-11a.5.5 0 0 1-.5-.5"/>
              </svg>
              篩選與搜尋
            </h3>
          </div>
          <div class="filter-body">
            <div class="row g-3">
              <div class="col-md-6">
                <div class="search-wrapper">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="currentColor" class="search-icon" viewBox="0 0 16 16">
                    <path d="M11.742 10.344a6.5 6.5 0 1 0-1.397 1.398h-.001q.044.06.098.115l3.85 3.85a1 1 0 0 0 1.415-1.414l-3.85-3.85a1 1 0 0 0-.115-.1zM12 6.5a5.5 5.5 0 1 1-11 0 5.5 5.5 0 0 1 11 0"/>
                  </svg>
                  <input 
                    v-model="searchQuery" 
                    type="text" 
                    placeholder="搜尋活動標題或提交人..." 
                    class="search-input"
                  />
                </div>
              </div>
              <div class="col-md-3">
                <select v-model="statusFilter" class="filter-select">
                  <option value="">所有狀態</option>
                  <option value="pending">待審核</option>
                  <option value="approved">已上架</option>
                  <option value="rejected">已退回</option>
                </select>
              </div>
              <div class="col-md-3">
                <select v-model="dateFilter" class="filter-select">
                  <option value="">所有時間</option>
                  <option value="today">今天</option>
                  <option value="week">本週</option>
                  <option value="month">本月</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 載入狀態 -->
      <div v-if="loading" class="loading-section">
        <div class="loading-card">
          <div class="loading-spinner"></div>
          <p class="loading-text">載入活動資料中...</p>
        </div>
      </div>

      <!-- 空狀態 -->
      <div v-else-if="filteredActivities.length === 0" class="empty-section">
        <div class="empty-card">
          <div class="empty-icon">🎨</div>
          <h3 class="empty-title">沒有找到符合條件的活動</h3>
          <p class="empty-message">試試調整搜尋條件或等待新的活動投稿</p>
        </div>
      </div>

      <!-- 活動列表 -->
      <div v-else class="activities-grid">
        <div 
          v-for="activity in paginatedActivities" 
          :key="activity.id"
          class="activity-card"
        >
          <!-- 活動狀態標籤 -->
          <div class="activity-status">
            <span :class="getStatusClass(activity.status)" class="status-badge">
              <svg v-if="activity.status === 'pending'" xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" viewBox="0 0 16 16">
                <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14m0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16"/>
                <path d="M8 4a.905.905 0 0 0-.9.995l.35 3.507a.552.552 0 0 0 1.1 0l.35-3.507A.905.905 0 0 0 8 4m.002 6a1 1 0 1 0 0 2 1 1 0 0 0 0-2"/>
              </svg>
              <svg v-else-if="activity.status === 'approved'" xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" viewBox="0 0 16 16">
                <path d="M10.067.87a2.89 2.89 0 0 0-4.134 0l-.622.638-.89-.011a2.89 2.89 0 0 0-2.924 2.924l.01.89-.636.622a2.89 2.89 0 0 0 0 4.134l.637.622-.011.89a2.89 2.89 0 0 0 2.924 2.924l.89-.01.622.636a2.89 2.89 0 0 0 4.134 0l.622-.637.89.011a2.89 2.89 0 0 0 2.924-2.924l-.01-.89.636-.622a2.89 2.89 0 0 0 0-4.134l-.637-.622.011-.89a2.89 2.89 0 0 0-2.924-2.924l-.89.01zm.287 5.984-3 3a.5.5 0 0 1-.708 0l-1.5-1.5a.5.5 0 1 1 .708-.708L7 8.793l2.646-2.647a.5.5 0 0 1 .708.708"/>
              </svg>
              <svg v-else xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" viewBox="0 0 16 16">
                <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14m0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16"/>
                <path d="M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708.708L8.707 8l2.647 2.646a.5.5 0 0 1-.708.708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708"/>
              </svg>
              {{ getStatusText(activity.status) }}
            </span>
          </div>

          <!-- 活動內容 -->
          <div class="activity-content">
            <h4 class="activity-title">{{ activity.title }}</h4>
            <p class="activity-description">{{ activity.description }}</p>
            
            <div class="activity-meta">
              <div class="meta-item">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                  <path d="M8 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6m2-3a2 2 0 1 1-4 0 2 2 0 0 1 4 0m4 8c0 1-1 1-1 1H3s-1 0-1-1 1-4 6-4 6 3 6 4m-1-.004c-.001-.246-.154-.986-.832-1.664C11.516 10.68 10.289 10 8 10s-3.516.68-4.168 1.332c-.678.678-.83 1.418-.832 1.664z"/>
                </svg>
                <span>{{ activity.submitter_name }}</span>
              </div>
              <div class="meta-item">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                  <path d="M3.5 0a.5.5 0 0 1 .5.5V1h8V.5a.5.5 0 0 1 1 0V1h1a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V3a2 2 0 0 1 2-2h1V.5a.5.5 0 0 1 .5 0M1 4v10a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V4z"/>
                </svg>
                <span>{{ formatDate(activity.event_date) }}</span>
              </div>
              <div class="meta-item">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                  <path d="M8 3.5a.5.5 0 0 0-1 0V9a.5.5 0 0 0 .252.434l3.5 2a.5.5 0 0 0 .496-.868L8 8.71z"/>
                  <path d="M8 16A8 8 0 1 0 8 0a8 8 0 0 0 0 16m7-8A7 7 0 1 1 1 8a7 7 0 0 1 14 0"/>
                </svg>
                <span>{{ formatDateTime(activity.created_at) }}</span>
              </div>
            </div>
          </div>

          <!-- 操作按鈕 -->
          <div class="activity-actions">
            <button 
              @click="viewActivity(activity.id)"
              class="action-btn view-btn"
              type="button"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                <path d="M16 8s-3-5.5-8-5.5S0 8 0 8s3 5.5 8 5.5S16 8 16 8M1.173 8a13 13 0 0 1 1.66-2.043C4.12 4.668 5.88 3.5 8 3.5s3.879 1.168 5.168 2.457A13 13 0 0 1 14.828 8q-.086.13-.195.288c-.335.48-.83 1.12-1.465 1.755C11.879 11.332 10.119 12.5 8 12.5s-3.879-1.168-5.168-2.457A13 13 0 0 1 1.172 8z"/>
                <path d="M8 5.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5M4.5 8a3.5 3.5 0 1 1 7 0 3.5 3.5 0 0 1-7 0"/>
              </svg>
              查看
            </button>
            <button 
              v-if="activity.status === 'pending'"
              @click="approveActivity(activity.id)"
              class="action-btn approve-btn"
              type="button"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                <path d="M10.067.87a2.89 2.89 0 0 0-4.134 0l-.622.638-.89-.011a2.89 2.89 0 0 0-2.924 2.924l.01.89-.636.622a2.89 2.89 0 0 0 0 4.134l.637.622-.011.89a2.89 2.89 0 0 0 2.924 2.924l.89-.01.622.636a2.89 2.89 0 0 0 4.134 0l.622-.637.89.011a2.89 2.89 0 0 0 2.924-2.924l-.01-.89.636-.622a2.89 2.89 0 0 0 0-4.134l-.637-.622.011-.89a2.89 2.89 0 0 0-2.924-2.924l-.89.01zm.287 5.984-3 3a.5.5 0 0 1-.708 0l-1.5-1.5a.5.5 0 1 1 .708-.708L7 8.793l2.646-2.647a.5.5 0 0 1 .708.708"/>
              </svg>
              通過
            </button>
            <button 
              @click="editActivity(activity.id)"
              class="action-btn edit-btn"
              type="button"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                <path d="M12.146.146a.5.5 0 0 1 .708 0l3 3a.5.5 0 0 1 0 .708L1.707 13.001 0 16l2.999-1.707L12.146.146zM4.161 13.489l-.065.065c-.096-.096-.194-.197-.289-.289a1 1 0 0 1-.289-.289l.065-.065L3.207 13 4.161 13.489z"/>
              </svg>
              編輯
            </button>
            <button 
              v-if="activity.status === 'pending'"
              @click="rejectActivity(activity.id)"
              class="action-btn reject-btn"
              type="button"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14m0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16"/>
                <path d="M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708.708L8.707 8l2.647 2.646a.5.5 0 0 1-.708.708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708"/>
              </svg>
              退回
            </button>
            <button 
              @click="deleteActivity(activity)"
              class="action-btn delete-btn"
              type="button"
              title="刪除活動"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                <path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5m2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5m3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0z"/>
                <path d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1zM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4zM2.5 3h11V2h-11z"/>
              </svg>
              刪除
            </button>
          </div>
        </div>
      </div>

      <!-- 美麗的分頁 -->
      <div v-if="totalPages > 1" class="pagination-section">
        <div class="pagination-card">
          <div class="pagination-info">
            <span class="info-text">
              顯示第 {{ (currentPage - 1) * itemsPerPage + 1 }} - {{ Math.min(currentPage * itemsPerPage, filteredActivities.length) }} 項，共 {{ filteredActivities.length }} 項
            </span>
          </div>
          <div class="pagination-controls">
            <button 
              @click="currentPage--" 
              :disabled="currentPage === 1"
              class="pagination-btn"
              :class="{ disabled: currentPage === 1 }"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                <path fill-rule="evenodd" d="M11.354 1.646a.5.5 0 0 1 0 .708L5.707 8l5.647 5.646a.5.5 0 0 1-.708.708l-6-6a.5.5 0 0 1 0-.708l6-6a.5.5 0 0 1 .708 0"/>
              </svg>
              上一頁
            </button>
            <span class="page-indicator">第 {{ currentPage }} / {{ totalPages }} 頁</span>
            <button 
              @click="currentPage++" 
              :disabled="currentPage === totalPages"
              class="pagination-btn"
              :class="{ disabled: currentPage === totalPages }"
            >
              下一頁
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                <path fill-rule="evenodd" d="M4.646 1.646a.5.5 0 0 1 .708 0l6 6a.5.5 0 0 1 0 .708l-6 6a.5.5 0 0 1-.708-.708L10.293 8 4.646 2.354a.5.5 0 0 1 0-.708"/>
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 美麗的退回對話框 -->
    <div v-if="showRejectModal" class="modal-overlay">
      <div class="reject-modal">
        <div class="modal-header">
          <h3 class="modal-title">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" viewBox="0 0 16 16">
              <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14m0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16"/>
              <path d="M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708.708L8.707 8l2.647 2.646a.5.5 0 0 1-.708.708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708"/>
            </svg>
            退回活動投稿
          </h3>
          <button class="modal-close" @click="showRejectModal = false">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 16 16">
              <path d="M2.146 2.854a.5.5 0 1 1 .708-.708L8 7.293l5.146-5.147a.5.5 0 0 1 .708.708L8.707 8l5.147 5.146a.5.5 0 0 1-.708.708L8 8.707l-5.146 5.147a.5.5 0 0 1-.708-.708L7.293 8z"/>
            </svg>
          </button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label for="rejectionReason" class="form-label">退回原因</label>
            <textarea 
              id="rejectionReason"
              v-model="rejectionReason" 
              class="reason-textarea" 
              rows="4"
              placeholder="請詳細說明退回的原因，以便提交者了解如何改進..."
            ></textarea>
          </div>
        </div>
        <div class="modal-footer">
          <button 
            class="modal-btn cancel-btn" 
            @click="showRejectModal = false"
          >
            取消
          </button>
          <button 
            class="modal-btn confirm-btn" 
            :disabled="!rejectionReason.trim()"
            @click="confirmReject"
          >
            確認退回
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
definePageMeta({
  middleware: 'admin-auth',
  layout: 'default'
})

const activities = ref([])
const loading = ref(true)
const searchQuery = ref('')
const statusFilter = ref('')
const dateFilter = ref('')
const currentPage = ref(1)
const itemsPerPage = 10
const showRejectModal = ref(false)
const rejectionReason = ref('')
const activityToReject = ref(null)

const filteredActivities = computed(() => {
  let filtered = activities.value

  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    filtered = filtered.filter(activity => 
      activity.title.toLowerCase().includes(query) ||
      activity.submitter_name.toLowerCase().includes(query) ||
      activity.submitter_email.toLowerCase().includes(query)
    )
  }

  if (statusFilter.value) {
    filtered = filtered.filter(activity => activity.status === statusFilter.value)
  }

  if (dateFilter.value) {
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    
    filtered = filtered.filter(activity => {
      const createdDate = new Date(activity.created_at)
      
      switch (dateFilter.value) {
        case 'today':
          return createdDate >= today
        case 'week':
          const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)
          return createdDate >= weekAgo
        case 'month':
          const monthAgo = new Date(today.getFullYear(), today.getMonth() - 1, today.getDate())
          return createdDate >= monthAgo
        default:
          return true
      }
    })
  }

  return filtered.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
})

const totalPages = computed(() => Math.ceil(filteredActivities.value.length / itemsPerPage))

const paginatedActivities = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage
  const end = start + itemsPerPage
  return filteredActivities.value.slice(start, end)
})

const getStatusClass = (status) => {
  switch (status) {
    case 'pending': return 'status-pending'
    case 'approved': return 'status-approved'
    case 'rejected': return 'status-rejected'
    default: return 'status-unknown'
  }
}

const getStatusText = (status) => {
  switch (status) {
    case 'pending': return '待審核'
    case 'approved': return '已上架'
    case 'rejected': return '已退回'
    default: return '未知'
  }
}

const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString('zh-TW')
}

const formatDateTime = (dateTimeString) => {
  return new Date(dateTimeString).toLocaleString('zh-TW')
}

const fetchActivities = async () => {
  try {
    loading.value = true
    const response = await $fetch('/api/yilan-activities')
    activities.value = response.data || []
  } catch (error) {
    console.error('Failed to fetch activities:', error)
    activities.value = []
  } finally {
    loading.value = false
  }
}

const viewActivity = (id) => {
  navigateTo(`/admin/activities/${id}`)
}

const editActivity = (id) => {
  navigateTo(`/admin/activities/edit/${id}`)
}

const approveActivity = async (id) => {
  if (!confirm('確定要通過這個活動投稿嗎？')) return
  
  try {
    await $fetch(`/api/yilan-activities/${id}/approve`, { method: 'POST' })
    await fetchActivities()
  } catch (error) {
    console.error('Failed to approve activity:', error)
    alert('操作失敗，請稍後再試')
  }
}

const rejectActivity = (id) => {
  activityToReject.value = id
  rejectionReason.value = ''
  showRejectModal.value = true
}

const confirmReject = async () => {
  if (!rejectionReason.value.trim()) {
    alert('請輸入退回原因')
    return
  }
  
  try {
    await $fetch(`/api/yilan-activities/${activityToReject.value}/reject`, {
      method: 'POST',
      body: { reason: rejectionReason.value }
    })
    showRejectModal.value = false
    await fetchActivities()
  } catch (error) {
    console.error('Failed to reject activity:', error)
    alert('操作失敗，請稍後再試')
  }
}

const deleteActivity = async (activity) => {
  if (!confirm(`確定要刪除活動「${activity.title}」嗎？此操作無法復原。`)) return
  
  try {
    await $fetch(`/api/yilan-activities/${activity.id}`, { method: 'DELETE' })
    await fetchActivities()
    alert('活動已成功刪除')
  } catch (error) {
    console.error('Failed to delete activity:', error)
    alert('刪除失敗，請稍後再試')
  }
}

watch([statusFilter, dateFilter, searchQuery], () => {
  currentPage.value = 1
})

onMounted(() => {
  fetchActivities()
})
</script>

<style scoped lang="scss">
@import '~/assets/scss/yilan-activities-admin.scss';
</style>