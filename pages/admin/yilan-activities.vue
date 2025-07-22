<template>
  <div class="container mx-auto p-6">
    <div class="mb-6">
      <h1 class="text-3xl font-bold text-gray-800 mb-2">宜蘭活動總匯管理</h1>
      <p class="text-gray-600">管理活動投稿審核、編輯與發布</p>
    </div>

    <div class="bg-white shadow-lg rounded-lg overflow-hidden">
      <div class="p-6 border-b border-gray-200">
        <div class="flex flex-wrap gap-4 items-center">
          <div class="flex-1 min-w-64">
            <input 
              v-model="searchQuery" 
              type="text" 
              placeholder="搜尋活動標題或提交人..." 
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div class="flex gap-2">
            <select v-model="statusFilter" class="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
              <option value="">所有狀態</option>
              <option value="pending">待審核</option>
              <option value="approved">已上架</option>
              <option value="rejected">已退回</option>
            </select>
            <select v-model="dateFilter" class="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
              <option value="">所有時間</option>
              <option value="today">今天</option>
              <option value="week">本週</option>
              <option value="month">本月</option>
            </select>
          </div>
        </div>
      </div>

      <div v-if="loading" class="p-8 text-center">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
        <p class="mt-4 text-gray-600">載入中...</p>
      </div>

      <div v-else-if="filteredActivities.length === 0" class="p-8 text-center text-gray-500">
        <p>目前沒有符合條件的活動投稿</p>
      </div>

      <div v-else class="overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200">
          <thead class="bg-gray-50">
            <tr>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">活動標題</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">提交人</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">活動日期</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">狀態</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">提交時間</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">操作</th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-200">
            <tr v-for="activity in paginatedActivities" :key="activity.id" class="hover:bg-gray-50">
              <td class="px-6 py-4">
                <div class="text-sm font-medium text-gray-900">{{ activity.title }}</div>
                <div class="text-sm text-gray-500 truncate max-w-xs">{{ activity.description }}</div>
              </td>
              <td class="px-6 py-4">
                <div class="text-sm text-gray-900">{{ activity.submitter_name }}</div>
                <div class="text-sm text-gray-500">{{ activity.submitter_email }}</div>
              </td>
              <td class="px-6 py-4 text-sm text-gray-900">
                {{ formatDate(activity.event_date) }}
                <div v-if="activity.event_time" class="text-xs text-gray-500">{{ activity.event_time }}</div>
              </td>
              <td class="px-6 py-4">
                <span :class="getStatusClass(activity.status)" class="px-2 py-1 text-xs font-semibold rounded-full">
                  {{ getStatusText(activity.status) }}
                </span>
              </td>
              <td class="px-6 py-4 text-sm text-gray-500">
                {{ formatDateTime(activity.created_at) }}
              </td>
              <td class="px-6 py-4 text-sm font-medium space-x-2">
                <button 
                  @click="viewActivity(activity.id)"
                  class="text-blue-600 hover:text-blue-900 transition-colors"
                >
                  查看
                </button>
                <button 
                  v-if="activity.status === 'pending'"
                  @click="approveActivity(activity.id)"
                  class="text-green-600 hover:text-green-900 transition-colors"
                >
                  通過
                </button>
                <button 
                  @click="editActivity(activity.id)"
                  class="text-yellow-600 hover:text-yellow-900 transition-colors"
                >
                  編輯
                </button>
                <button 
                  v-if="activity.status === 'pending'"
                  @click="rejectActivity(activity.id)"
                  class="text-red-600 hover:text-red-900 transition-colors"
                >
                  退回
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div v-if="totalPages > 1" class="px-6 py-4 border-t border-gray-200">
        <div class="flex items-center justify-between">
          <div class="text-sm text-gray-700">
            顯示第 {{ (currentPage - 1) * itemsPerPage + 1 }} - {{ Math.min(currentPage * itemsPerPage, filteredActivities.length) }} 項，共 {{ filteredActivities.length }} 項
          </div>
          <div class="flex space-x-2">
            <button 
              @click="currentPage--" 
              :disabled="currentPage === 1"
              class="px-3 py-1 text-sm border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              上一頁
            </button>
            <span class="px-3 py-1 text-sm">第 {{ currentPage }} / {{ totalPages }} 頁</span>
            <button 
              @click="currentPage++" 
              :disabled="currentPage === totalPages"
              class="px-3 py-1 text-sm border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              下一頁
            </button>
          </div>
        </div>
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
  navigateTo(`/admin/yilan-activities/${id}`)
}

const editActivity = (id) => {
  navigateTo(`/admin/yilan-activities/${id}/edit`)
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

watch([statusFilter, dateFilter, searchQuery], () => {
  currentPage.value = 1
})

onMounted(() => {
  fetchActivities()
})
</script>