<template>
  <div class="admin-review-container">
    <div class="admin-header">
      <h1>民宿審核管理</h1>
      <div class="admin-nav">
        <NuxtLink to="/admin/homestays" class="admin-nav-link">
          民宿管理系統
        </NuxtLink>
        <NuxtLink to="/admin/features" class="admin-nav-link">
          特色項目管理
        </NuxtLink>
        <NuxtLink to="/admin/yilan-activities" class="admin-nav-link">
          宜蘭活動管理
        </NuxtLink>
        <button @click="quickFix070" class="quick-fix-btn" :disabled="processing">
          🔧 修復編號070
        </button>
        <button @click="logout" class="logout-btn">登出</button>
      </div>
    </div>

    <div v-if="loading" class="loading">
      載入中...
    </div>

    <div v-else-if="error" class="error">
      {{ error }}
    </div>

    <div v-else>
      <!-- 狀態篩選標籤 -->
      <div class="status-filters">
        <button 
          v-for="tab in statusTabs" 
          :key="tab.key"
          @click="switchTab(tab.key)"
          :class="['filter-tab', { active: currentTab === tab.key }]"
        >
          {{ tab.label }}
          <span class="count-badge">{{ getHomestayCount(tab.key) }}</span>
        </button>
      </div>

      <div class="summary">
        <p>{{ currentTabLabel }}: {{ filteredHomestays.length }} 個</p>
      </div>

      <div v-if="filteredHomestays.length === 0" class="no-data">
        {{ getNoDataMessage() }}
      </div>

      <div v-else class="homestays-grid">
        <div v-for="homestay in filteredHomestays" :key="homestay.id" class="homestay-card">
          <div class="homestay-info">
            <h3>{{ homestay.name }}</h3>
            <p><strong>位置:</strong> {{ homestay.location }}</p>
            <p><strong>城市:</strong> {{ homestay.city }}</p>
            <p><strong>聯絡信箱:</strong> {{ homestay.email }}</p>
            <p><strong>電話:</strong> {{ homestay.phone }}</p>
            <p><strong>網站:</strong> {{ homestay.website }}</p>
            <p><strong>容量描述:</strong> {{ homestay.capacity_description }}</p>
            <p><strong>最少入住人數:</strong> {{ homestay.min_guests }}</p>
            <p><strong>最多入住人數:</strong> {{ homestay.max_guests }}</p>
            <p><strong>價格範圍:</strong> ${{ homestay.min_price }} - ${{ homestay.max_price }}</p>
            <p><strong>申請時間:</strong> {{ formatDate(homestay.created_at) }}</p>
            <p><strong>狀態:</strong> 
              <span :class="['status-badge', homestay.status]">
                {{ getStatusText(homestay.status) }}
              </span>
            </p>
            <p><strong>可用性:</strong> 
              <span :class="['availability-badge', { available: homestay.available }]">
                {{ homestay.available ? '可用' : '不可用' }}
              </span>
            </p>
            <p v-if="homestay.approved_at"><strong>審核時間:</strong> {{ formatDate(homestay.approved_at) }}</p>
            <p v-if="homestay.approved_by"><strong>審核人員:</strong> {{ homestay.approved_by }}</p>
            <p v-if="homestay.rejection_reason"><strong>拒絕原因:</strong> {{ homestay.rejection_reason }}</p>
          </div>
          
          <div class="homestay-image" v-if="homestay.image_url">
            <img :src="homestay.image_url" :alt="homestay.name" />
          </div>

          <div class="action-buttons">
            <!-- 待審核狀態的按鈕 -->
            <template v-if="homestay.status === 'pending'">
              <button 
                @click="approveHomestay(homestay.id)" 
                class="approve-btn"
                :disabled="processing"
              >
                通過審核
              </button>
              <button 
                @click="rejectHomestay(homestay.id)" 
                class="reject-btn"
                :disabled="processing"
              >
                拒絕申請
              </button>
            </template>
            
            <!-- 已通過審核的按鈕 -->
            <template v-else-if="homestay.status === 'approved'">
              <button 
                @click="toggleAvailability(homestay.id, !homestay.available)" 
                :class="['toggle-btn', homestay.available ? 'disable-btn' : 'enable-btn']"
                :disabled="processing"
              >
                {{ homestay.available ? '設為不可用' : '設為可用' }}
              </button>
              <button 
                @click="rejectHomestay(homestay.id)" 
                class="reject-btn"
                :disabled="processing"
              >
                撤銷審核
              </button>
            </template>
            
            <!-- 已拒絕的按鈕 -->
            <template v-else-if="homestay.status === 'rejected'">
              <button 
                @click="approveHomestay(homestay.id)" 
                class="approve-btn"
                :disabled="processing"
              >
                重新審核通過
              </button>
            </template>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'

definePageMeta({
  middleware: ['admin-auth']
})

const allHomestays = ref([])
const loading = ref(true)
const error = ref('')
const processing = ref(false)
const currentTab = ref('pending')

// 狀態標籤定義
const statusTabs = [
  { key: 'pending', label: '待審核' },
  { key: 'approved', label: '已通過' },
  { key: 'rejected', label: '已拒絕' },
  { key: 'all', label: '全部' }
]

// 載入民宿列表
const loadHomestays = async (status = 'all') => {
  try {
    loading.value = true
    const response = await $fetch('/api/admin-pending-homestays', {
      query: { status }
    })
    allHomestays.value = response.homestays || []
  } catch (err) {
    console.error('載入民宿列表失敗:', err)
    error.value = '載入民宿列表失敗，請重新整理頁面'
  } finally {
    loading.value = false
  }
}

// 通過審核
const approveHomestay = async (homestayId) => {
  if (!confirm('確定要通過這個民宿的審核嗎？')) return
  
  try {
    processing.value = true
    await $fetch('/api/admin-review-homestay', {
      method: 'POST',
      body: {
        homestayId,
        action: 'approve'
      }
    })
    
    // 從列表中移除已審核的項目或重新載入
    await loadHomestays('all')
    alert('審核通過成功！')
  } catch (err) {
    console.error('審核失敗:', err)
    alert('審核失敗，請稍候再試')
  } finally {
    processing.value = false
  }
}

// 拒絕申請
const rejectHomestay = async (homestayId) => {
  if (!confirm('確定要拒絕這個民宿申請嗎？此操作不可逆轉。')) return
  
  try {
    processing.value = true
    await $fetch('/api/admin-review-homestay', {
      method: 'POST',
      body: {
        homestayId,
        action: 'reject'
      }
    })
    
    // 從列表中移除已處理的項目或重新載入
    await loadHomestays('all')
    alert('已拒絕申請')
  } catch (err) {
    console.error('處理失敗:', err)
    alert('處理失敗，請稍候再試')
  } finally {
    processing.value = false
  }
}

// 登出
const logout = async () => {
  if (!confirm('確定要登出嗎？')) return
  
  try {
    // 清除 admin_access_token cookie
    const accessTokenCookie = useCookie('admin_access_token')
    accessTokenCookie.value = null
    
    await navigateTo('/admin-login')
  } catch (err) {
    console.error('登出失敗:', err)
    // 即使失敗也強制跳轉到登入頁
    await navigateTo('/admin-login')
  }
}

// 格式化日期
const formatDate = (dateString) => {
  if (!dateString) return ''
  return new Date(dateString).toLocaleString('zh-TW')
}

// 切換標籤
const switchTab = async (tabKey) => {
  currentTab.value = tabKey
  await loadHomestays('all') // 總是載入全部數據，然後用前端篩選
}

// 切換可用性
const toggleAvailability = async (homestayId, available) => {
  if (!confirm(`確定要將此民宿設為${available ? '可用' : '不可用'}嗎？`)) return
  
  try {
    processing.value = true
    await $fetch('/api/admin-update-availability', {
      method: 'POST',
      body: {
        homestayId,
        available
      }
    })
    
    // 更新本地數據
    const homestay = allHomestays.value.find(h => h.id === homestayId)
    if (homestay) {
      homestay.available = available
    }
    
    alert(`民宿可用性已更新！`)
  } catch (err) {
    console.error('更新可用性失敗:', err)
    alert('更新可用性失敗，請稍候再試')
  } finally {
    processing.value = false
  }
}

// computed 屬性
const filteredHomestays = computed(() => {
  if (currentTab.value === 'all') {
    return allHomestays.value
  }
  return allHomestays.value.filter(h => h.status === currentTab.value)
})

const currentTabLabel = computed(() => {
  const tab = statusTabs.find(t => t.key === currentTab.value)
  return tab ? tab.label : '未知'
})

// 獲取民宿數量
const getHomestayCount = (status) => {
  if (status === 'all') return allHomestays.value.length
  return allHomestays.value.filter(h => h.status === status).length
}

// 獲取狀態文字
const getStatusText = (status) => {
  const statusMap = {
    pending: '待審核',
    approved: '已通過',
    rejected: '已拒絕'
  }
  return statusMap[status] || status
}

// 獲取無數據提示
const getNoDataMessage = () => {
  const messages = {
    pending: '目前沒有待審核的民宿申請',
    approved: '目前沒有已通過審核的民宿',
    rejected: '目前沒有被拒絕的民宿申請',
    all: '目前沒有任何民宿資料'
  }
  return messages[currentTab.value] || '無數據'
}

// 快速修復編號 070
const quickFix070 = async () => {
  if (!confirm('確定要修復編號 070 民宿的可用狀態嗎？這將讓它在前台顯示。')) return
  
  try {
    processing.value = true
    const response = await $fetch('/api/admin-quick-fix', {
      method: 'POST',
      body: {
        action: 'fix-070'
      }
    })
    
    if (response.success) {
      alert('編號 070 民宿已修復成功！現在可以在前台顯示了。')
      // 重新載入資料
      await loadHomestays('all')
    }
  } catch (err) {
    console.error('修復失敗:', err)
    alert('修復失敗：' + (err.data?.message || err.message || '未知錯誤'))
  } finally {
    processing.value = false
  }
}

onMounted(() => {
  loadHomestays('all')
})
</script>

<style scoped>
.admin-review-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.admin-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
  padding-bottom: 20px;
  border-bottom: 2px solid #e2e8f0;
}

.admin-header h1 {
  color: #2d3748;
  font-size: 28px;
  font-weight: bold;
}

.logout-btn {
  padding: 10px 20px;
  background-color: #e53e3e;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
  transition: background-color 0.2s;
}

.logout-btn:hover {
  background-color: #c53030;
}

.admin-nav {
  display: flex;
  align-items: center;
  gap: 15px;
}

.admin-nav-link {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 8px 16px;
  border-radius: 6px;
  text-decoration: none;
  font-size: 14px;
  font-weight: 600;
  transition: all 0.3s ease;
}

.admin-nav-link:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
  color: white;
}

.quick-fix-btn {
  padding: 8px 16px;
  background: linear-gradient(135deg, #f6ad55 0%, #ed8936 100%);
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.quick-fix-btn:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(237, 137, 54, 0.4);
}

.quick-fix-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

.loading, .error, .no-data {
  text-align: center;
  padding: 40px;
  font-size: 18px;
}

.error {
  color: #e53e3e;
}

.summary {
  background-color: #f7fafc;
  padding: 15px;
  border-radius: 8px;
  margin-bottom: 25px;
}

.summary p {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #4a5568;
}

.homestays-grid {
  display: grid;
  gap: 25px;
}

.homestay-card {
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  transition: box-shadow 0.2s;
}

.homestay-card:hover {
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
}

.homestay-info {
  margin-bottom: 15px;
}

.homestay-info h3 {
  color: #2d3748;
  font-size: 20px;
  margin-bottom: 10px;
}

.homestay-info p {
  margin: 5px 0;
  color: #4a5568;
  line-height: 1.5;
}

.homestay-image {
  margin: 15px 0;
}

.homestay-image img {
  max-width: 200px;
  height: auto;
  border-radius: 8px;
}

.action-buttons {
  display: flex;
  gap: 15px;
  margin-top: 20px;
}

.approve-btn, .reject-btn {
  padding: 12px 24px;
  border: none;
  border-radius: 6px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.approve-btn {
  background-color: #48bb78;
  color: white;
}

.approve-btn:hover:not(:disabled) {
  background-color: #38a169;
}

.reject-btn {
  background-color: #e53e3e;
  color: white;
}

.reject-btn:hover:not(:disabled) {
  background-color: #c53030;
}

.approve-btn:disabled, .reject-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* 新增的樣式 */
.status-filters {
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
  border-bottom: 1px solid #e2e8f0;
  padding-bottom: 15px;
}

.filter-tab {
  padding: 10px 20px;
  border: 1px solid #e2e8f0;
  background: white;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.3s ease;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 8px;
}

.filter-tab:hover {
  background: #f7fafc;
  border-color: #cbd5e0;
}

.filter-tab.active {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-color: #667eea;
}

.count-badge {
  background: rgba(255, 255, 255, 0.2);
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 600;
}

.filter-tab.active .count-badge {
  background: rgba(255, 255, 255, 0.3);
}

.filter-tab:not(.active) .count-badge {
  background: #e2e8f0;
  color: #4a5568;
}

.status-badge {
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
}

.status-badge.pending {
  background: #fed7d7;
  color: #c53030;
}

.status-badge.approved {
  background: #c6f6d5;
  color: #22543d;
}

.status-badge.rejected {
  background: #feb2b2;
  color: #742a2a;
}

.availability-badge {
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 600;
}

.availability-badge.available {
  background: #c6f6d5;
  color: #22543d;
}

.availability-badge:not(.available) {
  background: #fed7d7;
  color: #c53030;
}

.toggle-btn {
  padding: 8px 16px;
  border: none;
  border-radius: 6px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 14px;
}

.enable-btn {
  background-color: #48bb78;
  color: white;
}

.enable-btn:hover:not(:disabled) {
  background-color: #38a169;
}

.disable-btn {
  background-color: #ed8936;
  color: white;
}

.disable-btn:hover:not(:disabled) {
  background-color: #dd6b20;
}

.toggle-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

@media (max-width: 768px) {
  .admin-header {
    flex-direction: column;
    gap: 15px;
  }

  .action-buttons {
    flex-direction: column;
  }

  .homestay-image img {
    max-width: 100%;
  }

  .status-filters {
    flex-wrap: wrap;
    gap: 8px;
  }

  .filter-tab {
    padding: 8px 12px;
    font-size: 14px;
  }
}
</style> 