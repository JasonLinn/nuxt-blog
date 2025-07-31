<template>
  <div class="admin-review-container">
    <div class="admin-header">
      <h1>民宿審核管理</h1>
      <!-- TODO: 測試階段提示 - 正式上線後移除 -->
      <div class="test-notice">
        ⚠️ 測試階段：新註冊民宿會自動通過審核
      </div>
      <div class="admin-nav">
        <NuxtLink to="/admin/features" class="admin-nav-link">
          特色項目管理
        </NuxtLink>
        <NuxtLink to="/admin/yilan-activities" class="admin-nav-link">
          宜蘭活動管理
        </NuxtLink>
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
      <div class="summary">
        <p>待審核民宿: {{ pendingHomestays.length }} 個</p>
      </div>

      <div v-if="pendingHomestays.length === 0" class="no-data">
        目前沒有待審核的民宿申請
      </div>

      <div v-else class="homestays-grid">
        <div v-for="homestay in pendingHomestays" :key="homestay.id" class="homestay-card">
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
          </div>
          
          <div class="homestay-image" v-if="homestay.image_url">
            <img :src="homestay.image_url" :alt="homestay.name" />
          </div>

          <div class="action-buttons">
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

const pendingHomestays = ref([])
const loading = ref(true)
const error = ref('')
const processing = ref(false)

// 載入待審核民宿列表
const loadPendingHomestays = async () => {
  try {
    loading.value = true
    const response = await $fetch('/api/admin-pending-homestays', {
      query: { status: 'pending' }
    })
    pendingHomestays.value = response.homestays || []
  } catch (err) {
    console.error('載入待審核民宿失敗:', err)
    error.value = '載入待審核民宿失敗，請重新整理頁面'
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
    
    // 從列表中移除已審核的項目
    pendingHomestays.value = pendingHomestays.value.filter(h => h.id !== homestayId)
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
    
    // 從列表中移除已處理的項目
    pendingHomestays.value = pendingHomestays.value.filter(h => h.id !== homestayId)
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

onMounted(() => {
  loadPendingHomestays()
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
}

/* TODO: 測試階段樣式 - 正式上線後移除 */
.test-notice {
  background-color: #fff3cd;
  color: #856404;
  padding: 8px 12px;
  border-radius: 4px;
  border: 1px solid #ffeaa7;
  font-size: 14px;
  font-weight: 500;
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
}
</style> 