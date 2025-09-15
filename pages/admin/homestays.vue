<template>
  <div class="admin-homestays-container">
    <AdminHeader />
    
    <!-- 頁面標題 -->
    <div class="page-header">
      <h1>🏠 民宿管理系統</h1>
    </div>

    <!-- 統計面板 -->
    <div class="stats-panel">
      <div class="stat-card">
        <div class="stat-icon pending">📋</div>
        <div class="stat-info">
          <div class="stat-number">{{ stats.pending }}</div>
          <div class="stat-label">待審核</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon approved">✅</div>
        <div class="stat-info">
          <div class="stat-number">{{ stats.approved }}</div>
          <div class="stat-label">已通過</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon available">🟢</div>
        <div class="stat-info">
          <div class="stat-number">{{ stats.available }}</div>
          <div class="stat-label">前台可見</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon rejected">❌</div>
        <div class="stat-info">
          <div class="stat-number">{{ stats.rejected }}</div>
          <div class="stat-label">已拒絕</div>
        </div>
      </div>
    </div>

    <!-- 搜尋和篩選 -->
    <div class="search-filters">
      <div class="search-group">
        <input
          v-model="searchText"
          type="text"
          placeholder="搜尋民宿名稱、編號或聯絡信箱..."
          class="search-input"
        />
        <button @click="searchHomestays" class="search-btn">搜尋</button>
      </div>
      
      <div class="filter-group">
        <select v-model="filterStatus" @change="filterHomestays" class="filter-select">
          <option value="">所有狀態</option>
          <option value="pending">待審核</option>
          <option value="approved">已通過</option>
          <option value="rejected">已拒絕</option>
        </select>
        
        <select v-model="filterAvailability" @change="filterHomestays" class="filter-select">
          <option value="">所有可用性</option>
          <option value="true">可用</option>
          <option value="false">不可用</option>
        </select>
        
        <select v-model="filterLocation" @change="filterHomestays" class="filter-select">
          <option value="">所有地區</option>
          <option v-for="location in locations" :key="location" :value="location">
            {{ location }}
          </option>
        </select>
      </div>
    </div>

    <div v-if="loading" class="loading">
      載入中...
    </div>

    <div v-else-if="error" class="error">
      {{ error }}
    </div>

    <div v-else>
      <!-- 民宿列表表格 -->
      <div class="table-container">
        <table class="homestays-table">
          <thead>
            <tr>
              <th>編號</th>
              <th>民宿名稱</th>
              <th>地點</th>
              <th>聯絡信箱</th>
              <th>狀態</th>
              <th>可用性</th>
              <th>申請時間</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="homestay in filteredHomestays" :key="homestay.id">
              <td>
                <strong>{{ homestay.id }}</strong>
              </td>
              <td>
                <div class="homestay-name">
                  {{ homestay.name }}
                  <div class="homestay-location-detail">{{ homestay.city }}</div>
                </div>
              </td>
              <td>{{ homestay.location }}</td>  
              <td>{{ homestay.email }}</td>
              <td>
                <span :class="['status-badge', homestay.status]">
                  {{ getStatusText(homestay.status) }}
                </span>
              </td>
              <td>
                <button
                  @click="toggleAvailability(homestay.id, !homestay.available)"
                  :class="['availability-toggle', { available: homestay.available }]"
                  :disabled="processing"
                >
                  {{ homestay.available ? '可用' : '不可用' }}
                </button>
              </td>
              <td>{{ formatDate(homestay.created_at) }}</td>
              <td>
                <div class="action-buttons">
                  <button
                    v-if="homestay.status === 'pending'"
                    @click="quickApprove(homestay.id)"
                    class="quick-approve-btn"
                    :disabled="processing"
                  >
                    快速通過
                  </button>
                  <button
                    @click="viewDetails(homestay.id)"
                    class="view-btn"
                  >
                    查看詳情
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div v-if="filteredHomestays.length === 0" class="no-data">
        沒有找到符合條件的民宿
      </div>
    </div>

    <!-- 民宿詳情模態框 -->
    <div v-if="showModal" class="modal-overlay" @click="closeModal">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3>民宿詳情 - {{ selectedHomestay?.name }}</h3>
          <button @click="closeModal" class="close-btn">×</button>
        </div>
        <div class="modal-body" v-if="selectedHomestay">
          <div class="detail-grid">
            <div class="detail-item">
              <label>編號:</label>
              <span>{{ selectedHomestay.id }}</span>
            </div>
            <div class="detail-item">
              <label>名稱:</label>
              <span>{{ selectedHomestay.name }}</span>
            </div>
            <div class="detail-item">
              <label>地區:</label>
              <span>{{ selectedHomestay.location }}</span>
            </div>
            <div class="detail-item">
              <label>詳細地址:</label>
              <span>{{ selectedHomestay.city }}</span>
            </div>
            <div class="detail-item">
              <label>聯絡信箱:</label>
              <span>{{ selectedHomestay.email }}</span>
            </div>
            <div class="detail-item">
              <label>電話:</label>
              <span>{{ selectedHomestay.phone || '未提供' }}</span>
            </div>
            <div class="detail-item">
              <label>網站:</label>
              <span>{{ selectedHomestay.website || '未提供' }}</span>
            </div>
            <div class="detail-item">
              <label>入住人數:</label>
              <span>{{ selectedHomestay.min_guests || '不限' }} - {{ selectedHomestay.max_guests || '不限' }} 人</span>
            </div>
            <div class="detail-item full-width">
              <label>民宿介紹:</label>
              <p>{{ selectedHomestay.capacity_description || '暫無介紹' }}</p>
            </div>
            <div class="detail-item">
              <label>狀態:</label>
              <span :class="['status-badge', selectedHomestay.status]">
                {{ getStatusText(selectedHomestay.status) }}
              </span>
            </div>
            <div class="detail-item">
              <label>可用性:</label>
              <span :class="['availability-badge', { available: selectedHomestay.available }]">
                {{ selectedHomestay.available ? '可用' : '不可用' }}
              </span>
            </div>
            <div class="detail-item">
              <label>申請時間:</label>
              <span>{{ formatDate(selectedHomestay.created_at) }}</span>
            </div>
            <div v-if="selectedHomestay.approved_at" class="detail-item">
              <label>審核時間:</label>
              <span>{{ formatDate(selectedHomestay.approved_at) }}</span>
            </div>
            <div v-if="selectedHomestay.approved_by" class="detail-item">
              <label>審核人員:</label>
              <span>{{ selectedHomestay.approved_by }}</span>
            </div>
            <div v-if="selectedHomestay.rejection_reason" class="detail-item full-width">
              <label>拒絕原因:</label>
              <p>{{ selectedHomestay.rejection_reason }}</p>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button @click="closeModal" class="modal-close-btn">關閉</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'

definePageMeta({
  middleware: ['admin-auth']
})

// 響應式數據
const allHomestays = ref([])
const loading = ref(true)
const error = ref('')
const processing = ref(false)
const searchText = ref('')
const filterStatus = ref('')
const filterAvailability = ref('')
const filterLocation = ref('')
const showModal = ref(false)
const selectedHomestay = ref(null)

// 統計數據
const stats = computed(() => {
  const pending = allHomestays.value.filter(h => h.status === 'pending').length
  const approved = allHomestays.value.filter(h => h.status === 'approved').length
  const available = allHomestays.value.filter(h => h.status === 'approved' && h.available).length
  const rejected = allHomestays.value.filter(h => h.status === 'rejected').length
  
  return { pending, approved, available, rejected }
})

// 所有地區選項
const locations = computed(() => {
  const locationSet = new Set()
  allHomestays.value.forEach(homestay => {
    if (homestay.location) locationSet.add(homestay.location)
  })
  return Array.from(locationSet).sort()
})

// 篩選後的民宿列表
const filteredHomestays = computed(() => {
  let filtered = allHomestays.value

  // 文字搜尋
  if (searchText.value.trim()) {
    const searchTerm = searchText.value.toLowerCase()
    filtered = filtered.filter(h => 
      h.name.toLowerCase().includes(searchTerm) ||
      h.id.toLowerCase().includes(searchTerm) ||
      h.email.toLowerCase().includes(searchTerm)
    )
  }

  // 狀態篩選
  if (filterStatus.value) {
    filtered = filtered.filter(h => h.status === filterStatus.value)
  }

  // 可用性篩選
  if (filterAvailability.value !== '') {
    const isAvailable = filterAvailability.value === 'true'
    filtered = filtered.filter(h => h.available === isAvailable)
  }

  // 地區篩選
  if (filterLocation.value) {
    filtered = filtered.filter(h => h.location === filterLocation.value)
  }

  return filtered
})

// 載入民宿資料
const loadHomestays = async () => {
  try {
    loading.value = true
    const response = await $fetch('/api/admin-pending-homestays', {
      query: { status: 'all', limit: 200 }
    })
    allHomestays.value = response.homestays || []
  } catch (err) {
    console.error('載入民宿資料失敗:', err)
    error.value = '載入民宿資料失敗，請重新整理頁面'
  } finally {
    loading.value = false
  }
}

// 搜尋民宿
const searchHomestays = () => {
  // 觸發 computed 重新計算
  // 實際搜尋邏輯在 filteredHomestays computed 中處理
}

// 篩選民宿
const filterHomestays = () => {
  // 觸發 computed 重新計算
  // 實際篩選邏輯在 filteredHomestays computed 中處理
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
    
    // 更新本地資料
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

// 快速通過審核
const quickApprove = async (homestayId) => {
  if (!confirm('確定要快速通過這個民宿的審核嗎？')) return
  
  try {
    processing.value = true
    await $fetch('/api/admin-review-homestay', {
      method: 'POST',
      body: {
        homestayId,
        action: 'approve'
      }
    })
    
    // 重新載入資料
    await loadHomestays()
    alert('審核通過成功！')
  } catch (err) {
    console.error('快速審核失敗:', err)
    alert('快速審核失敗，請稍候再試')
  } finally {
    processing.value = false
  }
}

// 查看詳情
const viewDetails = (homestayId) => {
  selectedHomestay.value = allHomestays.value.find(h => h.id === homestayId)
  showModal.value = true
}

// 關閉模態框
const closeModal = () => {
  showModal.value = false
  selectedHomestay.value = null
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

// 格式化日期
const formatDate = (dateString) => {
  if (!dateString) return ''
  return new Date(dateString).toLocaleString('zh-TW')
}

onMounted(() => {
  loadHomestays()
})
</script>

<style scoped>
.admin-homestays-container {
  max-width: 1400px;
  margin: 0 auto;
  padding: 20px;
}

.page-header {
  margin-bottom: 30px;
  padding-bottom: 20px;
  border-bottom: 2px solid #e2e8f0;
  
  h1 {
    color: #2d3748;
    font-size: 28px;
    font-weight: bold;
    margin: 0;
  }
}

/* 統計面板 */
.stats-panel {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
  margin-bottom: 30px;
}

.stat-card {
  background: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  display: flex;
  align-items: center;
  gap: 15px;
}

.stat-icon {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
}

.stat-icon.pending {
  background: #fed7d7;
}

.stat-icon.approved {
  background: #c6f6d5;
}

.stat-icon.available {
  background: #bee3f8;
}

.stat-icon.rejected {
  background: #feb2b2;
}

.stat-info {
  flex: 1;
}

.stat-number {
  font-size: 28px;
  font-weight: bold;
  color: #2d3748;
  line-height: 1;
}

.stat-label {
  font-size: 14px;
  color: #718096;
  margin-top: 4px;
}

/* 搜尋和篩選 */
.search-filters {
  background: white;
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 30px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.search-group {
  display: flex;
  gap: 10px;
  margin-bottom: 15px;
}

.search-input {
  flex: 1;
  padding: 12px 16px;
  border: 2px solid #e2e8f0;
  border-radius: 8px;
  font-size: 16px;
}

.search-input:focus {
  outline: none;
  border-color: #667eea;
}

.search-btn {
  padding: 12px 24px;
  background: #667eea;
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s;
}

.search-btn:hover {
  background: #5a6fd8;
}

.filter-group {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 15px;
}

.filter-select {
  padding: 10px 12px;
  border: 2px solid #e2e8f0;
  border-radius: 8px;
  font-size: 14px;
}

.filter-select:focus {
  outline: none;
  border-color: #667eea;
}

/* 表格樣式 */
.table-container {
  background: white;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.homestays-table {
  width: 100%;
  border-collapse: collapse;
}

.homestays-table th {
  background: #f7fafc;
  padding: 15px 12px;
  text-align: left;
  font-weight: 600;
  color: #4a5568;
  border-bottom: 2px solid #e2e8f0;
}

.homestays-table td {
  padding: 15px 12px;
  border-bottom: 1px solid #e2e8f0;
  vertical-align: top;
}

.homestays-table tr:hover {
  background: #f9fafb;
}

.homestay-name {
  font-weight: 600;
  color: #2d3748;
}

.homestay-location-detail {
  font-size: 12px;
  color: #718096;
  margin-top: 4px;
}

.status-badge {
  padding: 4px 12px;
  border-radius: 20px;
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

.availability-toggle {
  padding: 6px 12px;
  border: none;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.availability-toggle.available {
  background: #c6f6d5;
  color: #22543d;
}

.availability-toggle:not(.available) {
  background: #fed7d7;
  color: #c53030;
}

.availability-toggle:hover {
  opacity: 0.8;
}

.availability-toggle:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.action-buttons {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.quick-approve-btn,
.view-btn {
  padding: 6px 12px;
  border: none;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.quick-approve-btn {
  background: #48bb78;
  color: white;
}

.quick-approve-btn:hover:not(:disabled) {
  background: #38a169;
}

.view-btn {
  background: #667eea;
  color: white;
}

.view-btn:hover {
  background: #5a6fd8;
}

.quick-approve-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* 模態框樣式 */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  border-radius: 12px;
  max-width: 600px;
  width: 90%;
  max-height: 80vh;
  overflow-y: auto;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid #e2e8f0;
}

.modal-header h3 {
  margin: 0;
  color: #2d3748;
}

.close-btn {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: #718096;
}

.close-btn:hover {
  color: #4a5568;
}

.modal-body {
  padding: 20px;
}

.detail-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 15px;
}

.detail-item {
  display: grid;
  gap: 5px;
}

.detail-item.full-width {
  grid-column: 1 / -1;
}

.detail-item label {
  font-weight: 600;
  color: #4a5568;
  font-size: 14px;
}

.detail-item span,
.detail-item p {
  color: #2d3748;
  margin: 0;
}

.availability-badge {
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
  display: inline-block;
}

.availability-badge.available {
  background: #c6f6d5;
  color: #22543d;
}

.availability-badge:not(.available) {
  background: #fed7d7;
  color: #c53030;
}

.modal-footer {
  padding: 20px;
  border-top: 1px solid #e2e8f0;
  text-align: right;
}

.modal-close-btn {
  padding: 10px 20px;
  background: #718096;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
}

.modal-close-btn:hover {
  background: #4a5568;
}

/* 通用樣式 */
.loading,
.error,
.no-data {
  text-align: center;
  padding: 40px;
  font-size: 18px;
}

.error {
  color: #e53e3e;
}

.no-data {
  color: #718096;
}

/* 響應式設計 */
@media (max-width: 768px) {
  .admin-header {
    flex-direction: column;
    gap: 15px;
  }

  .admin-nav {
    flex-wrap: wrap;
  }

  .stats-panel {
    grid-template-columns: 1fr;
  }

  .search-group {
    flex-direction: column;
  }

  .filter-group {
    grid-template-columns: 1fr;
  }

  .table-container {
    overflow-x: auto;
  }

  .homestays-table {
    min-width: 800px;
  }

  .action-buttons {
    flex-direction: column;
  }

  .detail-grid {
    grid-template-columns: 1fr;
  }

  .modal-content {
    margin: 20px;
    width: auto;
  }
}
</style>