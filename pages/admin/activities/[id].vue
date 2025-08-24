<template>
  <div class="activity-detail-admin">
    <div class="container">
      <!-- 簡潔導航 -->
      <div class="mb-4">
        <button @click="$router.back()" class="btn btn-outline-primary mb-3">
          <i class="bi bi-arrow-left me-2"></i>返回列表
        </button>
        <h1 class="h3 mb-0">活動詳情</h1>
      </div>

      <!-- 載入狀態 -->
      <div v-if="loading" class="text-center py-5">
        <div class="spinner-border text-primary"></div>
        <p class="mt-3">載入中...</p>
      </div>

      <!-- 找不到活動 -->
      <div v-else-if="!activity" class="text-center py-5">
        <i class="bi bi-exclamation-triangle display-4 text-warning"></i>
        <p class="mt-3">找不到此活動</p>
      </div>

      <!-- 活動內容 -->
      <div v-else class="row">
        <!-- 主要內容 -->
        <div class="col-lg-8">
          <!-- 標題和狀態 -->
          <div class="d-flex justify-content-between align-items-center mb-3">
            <h2>{{ activity.title }}</h2>
            <span :class="getStatusBadgeClass(activity.status)">
              <i :class="getStatusIcon(activity.status)" class="me-1"></i>
              {{ getStatusText(activity.status) }}
            </span>
          </div>
          
          <!-- 活動資訊 -->
          <div class="mb-4">
            <p v-if="activity.description" class="text-muted">{{ activity.description }}</p>
            
            <!-- 基本資訊表格 -->
            <table class="table table-borderless">
              <tbody>
                <tr>
                  <td class="fw-bold">活動日期</td>
                  <td>{{ formatDate(activity.event_date) }}</td>
                </tr>
                <tr v-if="activity.event_time">
                  <td class="fw-bold">活動時間</td>
                  <td>{{ activity.event_time }}</td>
                </tr>
                <tr v-if="activity.location">
                  <td class="fw-bold">活動地點</td>
                  <td>{{ activity.location }}</td>
                </tr>
                <tr v-if="activity.activity_type">
                  <td class="fw-bold">活動類型</td>
                  <td>{{ activity.activity_type }}</td>
                </tr>
                <tr>
                  <td class="fw-bold">主辦單位</td>
                  <td>{{ activity.organizer_name }}</td>
                </tr>
                <tr>
                  <td class="fw-bold">聯絡信箱</td>
                  <td>{{ activity.organizer_email }}</td>
                </tr>
                <tr v-if="activity.organizer_phone">
                  <td class="fw-bold">聯絡電話</td>
                  <td>{{ activity.organizer_phone }}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- 活動圖片 -->
          <div v-if="activity.images && activity.images.length" class="mb-4">
            <h5>活動圖片</h5>
            <div class="row g-2">
              <div v-for="(image, index) in activity.images" :key="index" class="col-md-6">
                <img 
                  :src="image" 
                  :alt="`活動圖片 ${index + 1}`"
                  class="img-fluid rounded"
                  style="cursor: pointer;"
                  @click="openImageModal(image)"
                />
              </div>
            </div>
          </div>

          <!-- 其他資訊 -->
          <div v-if="activity.contact_info" class="mb-4">
            <h6>其他聯絡資訊</h6>
            <p class="text-muted">{{ activity.contact_info }}</p>
          </div>

          <!-- 退回原因 -->
          <div v-if="activity.status === 'rejected' && activity.rejection_reason" class="alert alert-danger">
            <h6>退回原因</h6>
            <p class="mb-0">{{ activity.rejection_reason }}</p>
          </div>

          <!-- 管理員備註 -->
          <div v-if="activity.admin_notes" class="alert alert-info">
            <h6>管理員備註</h6>
            <p class="mb-0">{{ activity.admin_notes }}</p>
          </div>
        </div>

        <!-- 側邊操作區 -->
        <div class="col-lg-4">
          <!-- 操作按鈕 -->
          <div class="mb-4">
            <h5>管理操作</h5>
            <div class="d-grid gap-2">
              <button 
                v-if="activity.status === 'pending'"
                @click="approveActivity"
                class="btn btn-success"
              >
                <i class="bi bi-check-circle me-2"></i>通過審核
              </button>
              
              <button @click="editActivity" class="btn btn-warning">
                <i class="bi bi-pencil me-2"></i>編輯活動
              </button>
              
              <button 
                v-if="activity.status === 'pending'"
                @click="showRejectModal = true"
                class="btn btn-danger"
              >
                <i class="bi bi-x-circle me-2"></i>退回投稿
              </button>
            </div>
          </div>

          <!-- 提交資訊 -->
          <div class="border rounded p-3">
            <h6>提交資訊</h6>
            <small class="text-muted d-block">提交人：{{ activity.submitter_name }}</small>
            <small class="text-muted d-block">信箱：{{ activity.submitter_email }}</small>
            <small class="text-muted d-block">提交時間：{{ formatDateTime(activity.created_at) }}</small>
            <small v-if="activity.updated_at !== activity.created_at" class="text-muted d-block">
              更新時間：{{ formatDateTime(activity.updated_at) }}
            </small>
            <small v-if="activity.approved_at" class="text-muted d-block">
              通過時間：{{ formatDateTime(activity.approved_at) }}
            </small>
            <small v-if="activity.approved_by" class="text-muted d-block">
              審核人員：{{ activity.approved_by }}
            </small>
          </div>
        </div>
      </div>
    </div>

    <!-- 圖片放大模態框 -->
    <div v-if="selectedImage" class="modal fade show d-block" tabindex="-1" style="background-color: rgba(0,0,0,0.8);" @click="selectedImage = null">
      <div class="modal-dialog modal-xl modal-dialog-centered">
        <div class="modal-content bg-transparent border-0">
          <div class="modal-body p-0 text-center">
            <img :src="selectedImage" class="img-fluid rounded" style="max-height: 90vh;" />
            <button 
              @click="selectedImage = null"
              class="btn btn-light position-absolute top-0 end-0 m-3 rounded-circle"
              style="width: 40px; height: 40px;"
            >
              <i class="bi bi-x"></i>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 退回原因輸入對話框 -->
    <div v-if="showRejectModal" class="modal fade show d-block" tabindex="-1" style="background-color: rgba(0,0,0,0.5);">
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">退回活動投稿</h5>
            <button type="button" class="btn-close" @click="showRejectModal = false"></button>
          </div>
          <div class="modal-body">
            <div class="mb-3">
              <label for="rejectionReason" class="form-label">退回原因</label>
              <textarea 
                id="rejectionReason"
                v-model="rejectionReason" 
                class="form-control" 
                rows="4"
                placeholder="請輸入退回原因..."
              ></textarea>
            </div>
          </div>
          <div class="modal-footer">
            <button 
              type="button" 
              class="btn btn-secondary" 
              @click="showRejectModal = false"
            >
              取消
            </button>
            <button 
              type="button" 
              class="btn btn-danger" 
              @click="confirmReject"
              :disabled="!rejectionReason.trim()"
            >
              確認退回
            </button>
          </div>
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

const route = useRoute()
const router = useRouter()

const activity = ref(null)
const loading = ref(true)
const selectedImage = ref(null)
const showRejectModal = ref(false)
const rejectionReason = ref('')

const getStatusClass = (status) => {
  switch (status) {
    case 'pending': return 'bg-warning text-dark'
    case 'approved': return 'bg-success text-white'
    case 'rejected': return 'bg-danger text-white'
    default: return 'bg-secondary text-white'
  }
}

const getStatusBadgeClass = (status) => {
  switch (status) {
    case 'pending': return 'badge bg-warning text-dark'
    case 'approved': return 'badge bg-success'
    case 'rejected': return 'badge bg-danger'
    default: return 'badge bg-secondary'
  }
}

const getStatusIcon = (status) => {
  switch (status) {
    case 'pending': return 'bi bi-clock'
    case 'approved': return 'bi bi-check-circle'
    case 'rejected': return 'bi bi-x-circle'
    default: return 'bi bi-question-circle'
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

const openImageModal = (imageUrl) => {
  selectedImage.value = imageUrl
}

const fetchActivity = async () => {
  try {
    loading.value = true
    const response = await $fetch(`/api/activities/${route.params.id}`)
    activity.value = response.data
  } catch (error) {
    console.error('Failed to fetch activity:', error)
    activity.value = null
  } finally {
    loading.value = false
  }
}

const approveActivity = async () => {
  if (!confirm('確定要通過這個活動投稿嗎？')) return
  
  try {
    await $fetch(`/api/activities/${route.params.id}/approve`, { method: 'POST' })
    await fetchActivity()
  } catch (error) {
    console.error('Failed to approve activity:', error)
    alert('操作失敗，請稍後再試')
  }
}

const editActivity = () => {
  router.push(`/admin/activities/edit/${route.params.id}`)
}

const confirmReject = async () => {
  if (!rejectionReason.value.trim()) {
    alert('請輸入退回原因')
    return
  }
  
  try {
    await $fetch(`/api/activities/${route.params.id}/reject`, {
      method: 'POST',
      body: { reason: rejectionReason.value }
    })
    showRejectModal.value = false
    await fetchActivity()
  } catch (error) {
    console.error('Failed to reject activity:', error)
    alert('操作失敗，請稍後再試')
  }
}

onMounted(() => {
  fetchActivity()
})
</script>

<style scoped lang="scss">
// 注意：這是 SCSS/Bootstrap 專案，請勿使用 Tailwind CSS 類別

.activity-detail-admin {
  background-color: #f8f9fa;
  min-height: 100vh;
  padding: 2rem 0;

  .table {
    td:first-child {
      width: 120px;
      color: #6c757d;
    }
  }

  .badge {
    font-size: 0.875rem;
    padding: 0.5rem 0.75rem;
  }

  .btn {
    border-radius: 6px;

    i {
      font-size: 1rem;
    }
  }

  .border {
    border-color: #dee2e6 !important;
  }

  .spinner-border {
    width: 2rem;
    height: 2rem;
  }

  img {
    border-radius: 8px;
    transition: opacity 0.2s ease;

    &:hover {
      opacity: 0.8;
    }
  }
}

// Modal 樣式保持簡潔
.modal {
  .modal-content {
    border-radius: 8px;
    border: none;
  }

  .modal-header {
    background-color: #f8f9fa;
    border-bottom: 1px solid #dee2e6;
  }
}
</style>
