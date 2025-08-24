<template>
  <div class="container mx-auto p-6">
    <div class="mb-6">
      <div class="flex items-center gap-4 mb-4">
        <button 
          @click="$router.back()" 
          class="flex items-center text-gray-600 hover:text-gray-800 transition-colors"
        >
          <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path>
          </svg>
          返回列表
        </button>
        <div class="h-6 border-l border-gray-300"></div>
        <h1 class="text-2xl font-bold text-gray-800">活動詳情</h1>
      </div>
    </div>

    <div v-if="loading" class="flex justify-center py-12">
      <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
    </div>

    <div v-else-if="!activity" class="text-center py-12">
      <p class="text-gray-500">找不到此活動</p>
    </div>

    <div v-else class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <!-- 左側內容區 -->
      <div class="lg:col-span-2 space-y-6">
        <!-- 基本資訊卡片 -->
        <div class="bg-white shadow-lg rounded-lg overflow-hidden">
          <div class="p-6">
            <div class="flex items-start justify-between mb-4">
              <h2 class="text-2xl font-bold text-gray-900">{{ activity.title }}</h2>
              <span :class="getStatusClass(activity.status)" class="px-3 py-1 text-sm font-semibold rounded-full">
                {{ getStatusText(activity.status) }}
              </span>
            </div>
            
            <div v-if="activity.description" class="mb-6">
              <h3 class="text-lg font-semibold text-gray-800 mb-2">活動簡介</h3>
              <div class="text-gray-700 whitespace-pre-wrap">{{ activity.description }}</div>
            </div>

            <!-- 活動圖片 -->
            <div v-if="activity.images && activity.images.length" class="mb-6">
              <h3 class="text-lg font-semibold text-gray-800 mb-3">活動圖片</h3>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div 
                  v-for="(image, index) in activity.images" 
                  :key="index"
                  class="relative aspect-video bg-gray-100 rounded-lg overflow-hidden"
                >
                  <img 
                    :src="image" 
                    :alt="`活動圖片 ${index + 1}`"
                    class="w-full h-full object-cover hover:scale-105 transition-transform cursor-pointer"
                    @click="openImageModal(image)"
                  />
                </div>
              </div>
            </div>

            <!-- 活動詳情 -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div class="space-y-4">
                <div>
                  <h4 class="font-semibold text-gray-800">活動日期</h4>
                  <p class="text-gray-700">{{ formatDate(activity.event_date) }}</p>
                </div>
                <div v-if="activity.event_time">
                  <h4 class="font-semibold text-gray-800">活動時間</h4>
                  <p class="text-gray-700">{{ activity.event_time }}</p>
                </div>
                <div v-if="activity.location">
                  <h4 class="font-semibold text-gray-800">活動地點</h4>
                  <p class="text-gray-700">{{ activity.location }}</p>
                </div>
              </div>
              <div class="space-y-4">
                <div v-if="activity.activity_type">
                  <h4 class="font-semibold text-gray-800">活動類型</h4>
                  <p class="text-gray-700">{{ activity.activity_type }}</p>
                </div>
                <div>
                  <h4 class="font-semibold text-gray-800">主辦單位</h4>
                  <p class="text-gray-700">{{ activity.organizer_name }}</p>
                </div>
                <div>
                  <h4 class="font-semibold text-gray-800">聯絡信箱</h4>
                  <p class="text-gray-700">{{ activity.organizer_email }}</p>
                </div>
              </div>
            </div>

            <!-- 其他聯絡資訊 -->
            <div v-if="activity.organizer_phone || activity.contact_info" class="mb-6">
              <h3 class="text-lg font-semibold text-gray-800 mb-3">聯絡資訊</h3>
              <div class="space-y-2">
                <div v-if="activity.organizer_phone">
                  <span class="font-medium">電話：</span>{{ activity.organizer_phone }}
                </div>
                <div v-if="activity.contact_info" class="whitespace-pre-wrap">
                  <span class="font-medium">其他聯絡方式：</span><br>{{ activity.contact_info }}
                </div>
              </div>
            </div>

            <!-- 退回原因 -->
            <div v-if="activity.status === 'rejected' && activity.rejection_reason" class="mb-6">
              <h3 class="text-lg font-semibold text-red-700 mb-2">退回原因</h3>
              <div class="bg-red-50 border border-red-200 rounded-lg p-4">
                <p class="text-red-800 whitespace-pre-wrap">{{ activity.rejection_reason }}</p>
              </div>
            </div>

            <!-- 管理員備註 -->
            <div v-if="activity.admin_notes" class="mb-6">
              <h3 class="text-lg font-semibold text-gray-800 mb-2">管理員備註</h3>
              <div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p class="text-blue-800 whitespace-pre-wrap">{{ activity.admin_notes }}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 右側操作區 -->
      <div class="space-y-6">
        <!-- 操作按鈕 -->
        <div class="bg-white shadow-lg rounded-lg p-6">
          <h3 class="text-lg font-semibold text-gray-800 mb-4">管理員操作</h3>
          <div class="space-y-3">
            <button 
              v-if="activity.status === 'pending'"
              @click="approveActivity"
              class="w-full bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center"
            >
              <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
              </svg>
              ✅ 通過審核
            </button>
            
            <button 
              @click="editActivity"
              class="w-full bg-yellow-600 text-white py-3 px-4 rounded-lg hover:bg-yellow-700 transition-colors flex items-center justify-center"
            >
              <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
              </svg>
              ✏️ 編輯活動
            </button>
            
            <button 
              v-if="activity.status === 'pending'"
              @click="showRejectModal = true"
              class="w-full bg-red-600 text-white py-3 px-4 rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center"
            >
              <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
              ❌ 退回投稿
            </button>
          </div>
        </div>

        <!-- 提交人資訊 -->
        <div class="bg-white shadow-lg rounded-lg p-6">
          <h3 class="text-lg font-semibold text-gray-800 mb-4">提交人資訊</h3>
          <div class="space-y-3">
            <div>
              <span class="font-medium text-gray-700">姓名：</span>
              <span class="text-gray-900">{{ activity.submitter_name }}</span>
            </div>
            <div>
              <span class="font-medium text-gray-700">信箱：</span>
              <span class="text-gray-900">{{ activity.submitter_email }}</span>
            </div>
            <div>
              <span class="font-medium text-gray-700">提交時間：</span>
              <span class="text-gray-900">{{ formatDateTime(activity.created_at) }}</span>
            </div>
            <div v-if="activity.updated_at !== activity.created_at">
              <span class="font-medium text-gray-700">最後更新：</span>
              <span class="text-gray-900">{{ formatDateTime(activity.updated_at) }}</span>
            </div>
            <div v-if="activity.approved_at">
              <span class="font-medium text-gray-700">通過時間：</span>
              <span class="text-gray-900">{{ formatDateTime(activity.approved_at) }}</span>
            </div>
            <div v-if="activity.approved_by">
              <span class="font-medium text-gray-700">審核人員：</span>
              <span class="text-gray-900">{{ activity.approved_by }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 圖片放大模態框 -->
    <div v-if="selectedImage" class="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50" @click="selectedImage = null">
      <div class="max-w-4xl max-h-[90vh] relative">
        <img :src="selectedImage" class="max-w-full max-h-full object-contain" />
        <button 
          @click="selectedImage = null"
          class="absolute top-4 right-4 text-white bg-black bg-opacity-50 rounded-full p-2 hover:bg-opacity-75"
        >
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
          </svg>
        </button>
      </div>
    </div>

    <!-- 退回原因輸入對話框 -->
    <div v-if="showRejectModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div class="bg-white rounded-lg p-6 w-full max-w-md">
        <h3 class="text-lg font-semibold mb-4">退回活動投稿</h3>
        <textarea 
          v-model="rejectionReason" 
          placeholder="請輸入退回原因..." 
          class="w-full p-3 border border-gray-300 rounded-lg resize-none h-32 focus:ring-2 focus:ring-red-500"
        ></textarea>
        <div class="flex justify-end gap-3 mt-4">
          <button 
            @click="showRejectModal = false" 
            class="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            取消
          </button>
          <button 
            @click="confirmReject" 
            class="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
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

const route = useRoute()
const router = useRouter()

const activity = ref(null)
const loading = ref(true)
const selectedImage = ref(null)
const showRejectModal = ref(false)
const rejectionReason = ref('')

const getStatusClass = (status) => {
  switch (status) {
    case 'pending': return 'bg-yellow-100 text-yellow-800'
    case 'approved': return 'bg-green-100 text-green-800'
    case 'rejected': return 'bg-red-100 text-red-800'
    default: return 'bg-gray-100 text-gray-800'
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
    const response = await $fetch(`/api/yilan-activities/${route.params.id}`)
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
    await $fetch(`/api/yilan-activities/${route.params.id}/approve`, { method: 'POST' })
    await fetchActivity()
  } catch (error) {
    console.error('Failed to approve activity:', error)
    alert('操作失敗，請稍後再試')
  }
}

const editActivity = () => {
  router.push(`/admin/yilan-activities/edit/${route.params.id}`)
}

const confirmReject = async () => {
  if (!rejectionReason.value.trim()) {
    alert('請輸入退回原因')
    return
  }
  
  try {
    await $fetch(`/api/yilan-activities/${route.params.id}/reject`, {
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