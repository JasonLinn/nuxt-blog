<template>
  <div class="admin-review-container">
    <AdminHeader />
    
    <!-- 頁面標題 -->
    <div class="page-header">
      <h1>民宿審核管理</h1>
      <div class="header-actions">
        <button @click="showEmailTest = true" class="email-test-btn" :disabled="processing">
          📧 測試郵件
        </button>
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

      <div v-else class="homestays-table">
        <div class="table-header">
          <div class="col-name">民宿名稱</div>
          <div class="col-location">位置</div>
          <div class="col-contact">聯絡方式</div>
          <div class="col-price">價格範圍</div>
          <div class="col-status">狀態</div>
          <div class="col-actions">操作</div>
        </div>
        
        <div v-for="homestay in filteredHomestays" :key="homestay.id" class="homestay-row">
          <div class="homestay-summary">
            <div class="col-name">
              <div class="name-content">
                <h4>{{ homestay.name }}</h4>
                <small class="text-muted">申請時間: {{ formatDate(homestay.created_at) }}</small>
              </div>
            </div>
            <div class="col-location">
              <div>{{ homestay.city }}</div>
              <small class="text-muted">{{ homestay.location }}</small>
            </div>
            <div class="col-contact">
              <div>{{ homestay.email }}</div>
              <small class="text-muted">{{ homestay.phone }}</small>
            </div>
            <div class="col-price">
              <div>${{ homestay.min_price }} - ${{ homestay.max_price }}</div>
              <small class="text-muted">{{ homestay.min_guests }}-{{ homestay.max_guests }}人</small>
            </div>
            <div class="col-status">
              <span :class="['status-badge', homestay.status]">
                {{ getStatusText(homestay.status) }}
              </span>
              <div v-if="homestay.status === 'approved'">
                <span :class="['availability-badge', { available: homestay.available }]">
                  {{ homestay.available ? '可用' : '不可用' }}
                </span>
              </div>
            </div>
            <div class="col-actions">
              <button 
                @click="toggleDetails(homestay.id)" 
                class="btn btn-sm btn-outline-secondary me-2"
              >
                {{ expandedRows.includes(homestay.id) ? '收起' : '詳情' }}
              </button>
              
              <!-- 待審核狀態的按鈕 -->
              <template v-if="homestay.status === 'pending'">
                <button 
                  @click="approveHomestay(homestay.id)" 
                  class="btn btn-sm btn-success me-1"
                  :disabled="processing"
                >
                  通過
                </button>
                <button 
                  @click="rejectHomestay(homestay.id)" 
                  class="btn btn-sm btn-danger"
                  :disabled="processing"
                >
                  拒絕
                </button>
              </template>
              
              <!-- 已通過審核的按鈕 -->
              <template v-else-if="homestay.status === 'approved'">
                <button 
                  @click="toggleAvailability(homestay.id, !homestay.available)" 
                  :class="['btn', 'btn-sm', 'me-1', homestay.available ? 'btn-warning' : 'btn-info']"
                  :disabled="processing"
                >
                  {{ homestay.available ? '停用' : '啟用' }}
                </button>
                <button 
                  @click="revokeHomestay(homestay.id)" 
                  class="btn btn-sm btn-outline-danger"
                  :disabled="processing"
                >
                  撤銷
                </button>
              </template>
              
              <!-- 已拒絕的按鈕 -->
              <template v-else-if="homestay.status === 'rejected'">
                <button 
                  @click="approveHomestay(homestay.id)" 
                  class="btn btn-sm btn-success"
                  :disabled="processing"
                >
                  重新通過
                </button>
              </template>
            </div>
          </div>
          
          <!-- 展開的詳細資訊 -->
          <div v-if="expandedRows.includes(homestay.id)" class="homestay-details">
            <div class="row">
              <div class="col-md-8">
                <div class="detail-section">
                  <h6>基本資訊</h6>
                  <div class="row">
                    <div class="col-sm-6">
                      <p><strong>網站:</strong> 
                        <a v-if="homestay.website" :href="homestay.website" target="_blank" class="text-primary">{{ homestay.website }}</a>
                        <span v-else class="text-muted">未提供</span>
                      </p>
                      <p><strong>容量描述:</strong> {{ homestay.capacity_description }}</p>
                    </div>
                    <div class="col-sm-6">
                      <p v-if="homestay.approved_at"><strong>審核時間:</strong> {{ formatDate(homestay.approved_at) }}</p>
                      <p v-if="homestay.approved_by"><strong>審核人員:</strong> {{ homestay.approved_by }}</p>
                      <p v-if="homestay.rejection_reason" class="text-danger"><strong>拒絕原因:</strong> {{ homestay.rejection_reason }}</p>
                    </div>
                  </div>
                </div>
              </div>
              <div class="col-md-4" v-if="homestay.image_url">
                <div class="detail-image">
                  <img :src="homestay.image_url" :alt="homestay.name" class="img-thumbnail" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 測試郵件彈出視窗 -->
    <div v-if="showEmailTest" class="modal-overlay" @click="closeEmailTestModal">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3>📧 測試郵件功能</h3>
          <button @click="showEmailTest = false" class="close-btn">&times;</button>
        </div>
        
        <div class="modal-body">
          <div class="test-section">
            <h4>0. 檢查郵件設定</h4>
            <p>檢查環境變數和設定是否正確</p>
            <button 
              @click="checkEmailConfig" 
              class="check-config-btn"
              :disabled="emailTesting"
            >
              {{ emailTesting && emailTestType === 'config' ? '檢查中...' : '檢查設定' }}
            </button>
            
            <!-- 設定檢查結果 -->
            <div v-if="emailConfigResult" class="config-result">
              <h5>設定檢查結果：</h5>
              <ul>
                <li v-for="rec in emailConfigResult.recommendations" :key="rec" 
                    :class="rec.startsWith('✓') ? 'success' : rec.startsWith('❌') ? 'error' : 'warning'">
                  {{ rec }}
                </li>
              </ul>
              <div class="config-details">
                <p><strong>EMAIL_USER:</strong> {{ emailConfigResult.config.emailUserValue }}</p>
                <p><strong>EMAIL_PASSWORD長度:</strong> {{ emailConfigResult.config.emailPasswordLength }} 字元</p>
              </div>
            </div>
          </div>

          <div class="test-section">
            <h4>1. 測試郵件服務連接</h4>
            <p>檢查 Gmail SMTP 設定是否正確</p>
            <button 
              @click="testEmailConnection" 
              class="test-connection-btn"
              :disabled="emailTesting"
            >
              {{ emailTesting && emailTestType === 'connection' ? '測試中...' : '測試連接' }}
            </button>
          </div>

          <div class="test-section">
            <h4>2. 發送測試郵件</h4>
            <p>發送實際的審核通過郵件到指定信箱</p>
            <div class="input-group">
              <label>收件者信箱：</label>
              <input 
                v-model="testEmailAddress" 
                type="email" 
                placeholder="test@example.com"
                class="email-input"
              />
            </div>
            <button 
              @click="sendTestEmail" 
              class="send-test-btn"
              :disabled="emailTesting || !testEmailAddress"
            >
              {{ emailTesting && emailTestType === 'send' ? '發送中...' : '發送測試郵件' }}
            </button>
          </div>

          <div v-if="emailTestResult" class="test-result" :class="emailTestResult.success ? 'success' : 'error'">
            <h4>{{ emailTestResult.success ? '✅ 測試成功' : '❌ 測試失敗' }}</h4>
            <p>{{ emailTestResult.message }}</p>
            <div v-if="emailTestResult.details" class="details">
              <pre>{{ emailTestResult.details }}</pre>
            </div>
          </div>
        </div>

        <div class="modal-footer">
          <button @click="showEmailTest = false" class="cancel-btn">關閉</button>
        </div>
      </div>
    </div>

    <!-- 拒絕/撤銷原因輸入對話框 -->
    <div v-if="showRejectModal" class="modal-overlay" @click="closeRejectModal">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3>{{ currentAction === 'revoke' ? '🔄 撤銷民宿' : '❌ 拒絕申請' }}</h3>
          <button @click="closeRejectModal" class="close-btn">&times;</button>
        </div>
        
        <div class="modal-body">
          <p class="mb-3">請輸入{{ actionText }}此民宿申請的原因：</p>
          <textarea 
            v-model="rejectionReason" 
            class="rejection-textarea"
            :placeholder="currentAction === 'revoke' ? '例如：違反規定、收到投訴、資料造假等...' : '例如：資料不完整、不符合規定、圖片模糊等...'"
            rows="4"
            required
          ></textarea>
          <p class="text-muted mt-2">
            <small>* {{ actionText }}原因將會通過電子郵件發送給申請者</small>
          </p>
        </div>
        
        <div class="modal-footer">
          <button @click="closeRejectModal" class="cancel-btn">取消</button>
          <button 
            @click="confirmReject" 
            class="reject-confirm-btn"
            :disabled="!rejectionReason?.trim() || processing"
          >
            {{ processing ? '處理中...' : `確認${actionText}` }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'

definePageMeta({
  middleware: ['admin-auth']
})

const allHomestays = ref([])
const loading = ref(true)
const error = ref('')
const processing = ref(false)
const currentTab = ref('pending')
const expandedRows = ref([])

// 測試郵件相關狀態
const showEmailTest = ref(false)
const emailTesting = ref(false)
const emailTestType = ref('')

// 拒絕模態框相關狀態
const showRejectModal = ref(false)
const rejectionReason = ref('')
const currentRejectHomestayId = ref(null)

// 計算當前操作類型
const currentAction = computed(() => {
  if (!currentRejectHomestayId.value) return null
  const targetHomestay = allHomestays.value.find(h => h.id === currentRejectHomestayId.value)
  return targetHomestay?.status === 'approved' ? 'revoke' : 'reject'
})

const actionText = computed(() => {
  return currentAction.value === 'revoke' ? '撤銷' : '拒絕'
})
const testEmailAddress = ref('')
const emailTestResult = ref(null)
const emailConfigResult = ref(null)

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
  // 儲存要拒絕的民宿 ID 並打開模態框
  currentRejectHomestayId.value = homestayId
  rejectionReason.value = ''
  showRejectModal.value = true
}

// 撤銷已通過的民宿
const revokeHomestay = async (homestayId) => {
  // 儲存要撤銷的民宿 ID 並打開模態框
  currentRejectHomestayId.value = homestayId
  rejectionReason.value = ''
  showRejectModal.value = true
}

// 關閉拒絕模態框
const closeRejectModal = () => {
  showRejectModal.value = false
  rejectionReason.value = ''
  currentRejectHomestayId.value = null
}

// 確認拒絕/撤銷申請
const confirmReject = async () => {
  if (!rejectionReason.value?.trim()) {
    alert('請輸入拒絕原因')
    return
  }
  
  if (!confirm(`確定要${actionText.value}這個民宿申請嗎？此操作不可逆轉。`)) return
  
  try {
    processing.value = true
    await $fetch('/api/admin-review-homestay', {
      method: 'POST',
      body: {
        homestayId: currentRejectHomestayId.value,
        action: currentAction.value,
        rejectionReason: rejectionReason.value.trim()
      }
    })
    
    // 關閉模態框並重新載入資料
    closeRejectModal()
    await loadHomestays('all')
    alert(`已${actionText.value}申請`)
  } catch (err) {
    console.error('處理失敗:', err)
    alert('處理失敗，請稍候再試')
  } finally {
    processing.value = false
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


// 檢查郵件設定
const checkEmailConfig = async () => {
  emailTesting.value = true
  emailTestType.value = 'config'
  emailConfigResult.value = null
  
  try {
    const response = await $fetch('/api/admin/debug-email-config')
    emailConfigResult.value = response
  } catch (err) {
    console.error('檢查郵件設定失敗:', err)
    emailConfigResult.value = {
      recommendations: ['❌ 無法檢查設定: ' + (err.data?.message || err.message || '未知錯誤')]
    }
  } finally {
    emailTesting.value = false
    emailTestType.value = ''
  }
}

// 測試郵件連接
const testEmailConnection = async () => {
  emailTesting.value = true
  emailTestType.value = 'connection'
  emailTestResult.value = null
  
  try {
    const response = await $fetch('/api/admin/test-email', {
      method: 'POST',
      body: {
        testType: 'connection'
      }
    })
    
    emailTestResult.value = {
      success: true,
      message: '郵件服務連接成功！SMTP 設定正確。'
    }
  } catch (err) {
    console.error('測試郵件連接失敗:', err)
    emailTestResult.value = {
      success: false,
      message: '郵件服務連接失敗',
      details: err.data?.message || err.message || '未知錯誤'
    }
  } finally {
    emailTesting.value = false
    emailTestType.value = ''
  }
}

// 發送測試郵件
const sendTestEmail = async () => {
  if (!testEmailAddress.value) {
    alert('請輸入收件者信箱')
    return
  }
  
  emailTesting.value = true
  emailTestType.value = 'send'
  emailTestResult.value = null
  
  try {
    const response = await $fetch('/api/admin/test-email', {
      method: 'POST',
      body: {
        testType: 'send',
        testEmail: testEmailAddress.value
      }
    })
    
    emailTestResult.value = {
      success: true,
      message: `測試郵件已成功發送至 ${testEmailAddress.value}`
    }
  } catch (err) {
    console.error('發送測試郵件失敗:', err)
    emailTestResult.value = {
      success: false,
      message: '測試郵件發送失敗',
      details: err.data?.message || err.message || '未知錯誤'
    }
  } finally {
    emailTesting.value = false
    emailTestType.value = ''
  }
}

// 切換詳細資訊顯示
const toggleDetails = (homestayId) => {
  const index = expandedRows.value.indexOf(homestayId)
  if (index > -1) {
    expandedRows.value.splice(index, 1)
  } else {
    expandedRows.value.push(homestayId)
  }
}

// 關閉測試郵件視窗
const closeEmailTestModal = () => {
  showEmailTest.value = false
  emailTestResult.value = null
  emailConfigResult.value = null
  testEmailAddress.value = ''
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

/* 表格式佈局 */
.homestays-table {
  background: white;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.table-header {
  display: grid;
  grid-template-columns: 2fr 1.5fr 2fr 1fr 1fr 2fr;
  gap: 15px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 15px 20px;
  font-weight: 600;
  font-size: 14px;
}

.homestay-row {
  border-bottom: 1px solid #e2e8f0;
  transition: background-color 0.2s;
}

.homestay-row:hover {
  background-color: #f8f9fa;
}

.homestay-row:last-child {
  border-bottom: none;
}

.homestay-summary {
  display: grid;
  grid-template-columns: 2fr 1.5fr 2fr 1fr 1fr 2fr;
  gap: 15px;
  padding: 15px 20px;
  align-items: center;
}

.col-name h4 {
  margin: 0 0 2px 0;
  font-size: 16px;
  color: #2d3748;
  font-weight: 600;
}

.col-name small,
.col-location small,
.col-contact small,
.col-price small {
  color: #6c757d;
  font-size: 12px;
}

.col-location,
.col-contact,
.col-price {
  font-size: 14px;
  color: #4a5568;
}

.col-actions {
  display: flex;
  gap: 5px;
  flex-wrap: wrap;
}

/* 詳細資訊區域 */
.homestay-details {
  background: #f8f9fa;
  padding: 20px;
  border-top: 1px solid #e2e8f0;
}

.detail-section {
  margin-bottom: 15px;
}

.detail-section h6 {
  color: #495057;
  font-weight: 600;
  margin-bottom: 10px;
  padding-bottom: 5px;
  border-bottom: 1px solid #dee2e6;
}

.detail-section p {
  margin: 8px 0;
  font-size: 14px;
  color: #6c757d;
}

.detail-image img {
  max-width: 100%;
  height: auto;
  border-radius: 8px;
}

/* 移除舊的按鈕樣式，使用 Bootstrap 按鈕 */

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

/* 測試郵件功能樣式 */
.email-test-btn {
  padding: 8px 16px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.email-test-btn:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

.email-test-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

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
  width: 90%;
  max-width: 600px;
  max-height: 80vh;
  overflow-y: auto;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 25px;
  border-bottom: 1px solid #e2e8f0;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-radius: 12px 12px 0 0;
}

.modal-header h3 {
  margin: 0;
  font-size: 20px;
}

.close-btn {
  background: none;
  border: none;
  color: white;
  font-size: 24px;
  cursor: pointer;
  padding: 0;
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: background-color 0.2s;
}

.close-btn:hover {
  background: rgba(255, 255, 255, 0.2);
}

.modal-body {
  padding: 25px;
}

.modal-footer {
  padding: 20px 25px;
  border-top: 1px solid #e2e8f0;
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

/* 拒絕模態框特定樣式 */
.rejection-textarea {
  width: 100%;
  padding: 12px;
  border: 2px solid #e2e8f0;
  border-radius: 8px;
  font-family: inherit;
  font-size: 14px;
  line-height: 1.5;
  resize: vertical;
  min-height: 100px;
  transition: border-color 0.2s ease;
}

.rejection-textarea:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.rejection-textarea::placeholder {
  color: #9ca3af;
}

.reject-confirm-btn {
  background: linear-gradient(135deg, #dc3545 0%, #c82333 100%);
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  min-width: 120px;
}

.reject-confirm-btn:hover:not(:disabled) {
  background: linear-gradient(135deg, #c82333 0%, #a71e2a 100%);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(220, 53, 69, 0.3);
}

.reject-confirm-btn:disabled {
  background: #6c757d;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

.test-section {
  margin-bottom: 30px;
  padding: 20px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  background: #f8f9fa;
}

.test-section h4 {
  margin: 0 0 10px 0;
  color: #2d3748;
  font-size: 16px;
}

.test-section p {
  margin: 0 0 15px 0;
  color: #4a5568;
  font-size: 14px;
}

.input-group {
  margin-bottom: 15px;
}

.input-group label {
  display: block;
  margin-bottom: 5px;
  color: #4a5568;
  font-weight: 500;
}

.email-input {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #cbd5e0;
  border-radius: 6px;
  font-size: 14px;
  transition: border-color 0.2s;
}

.email-input:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.check-config-btn, .test-connection-btn, .send-test-btn {
  padding: 10px 20px;
  border: none;
  border-radius: 6px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 14px;
}

.check-config-btn {
  background-color: #4299e1;
  color: white;
}

.check-config-btn:hover:not(:disabled) {
  background-color: #3182ce;
}

.test-connection-btn {
  background-color: #48bb78;
  color: white;
}

.test-connection-btn:hover:not(:disabled) {
  background-color: #38a169;
}

.send-test-btn {
  background-color: #667eea;
  color: white;
}

.send-test-btn:hover:not(:disabled) {
  background-color: #5a67d8;
}

.check-config-btn:disabled, .test-connection-btn:disabled, .send-test-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.config-result {
  margin-top: 15px;
  padding: 15px;
  background: #f7fafc;
  border-radius: 6px;
  border: 1px solid #e2e8f0;
}

.config-result h5 {
  margin: 0 0 10px 0;
  color: #2d3748;
  font-size: 14px;
  font-weight: 600;
}

.config-result ul {
  margin: 0 0 15px 0;
  padding: 0;
  list-style: none;
}

.config-result li {
  padding: 5px 0;
  font-size: 14px;
}

.config-result li.success {
  color: #22543d;
}

.config-result li.error {
  color: #742a2a;
}

.config-result li.warning {
  color: #d69e2e;
}

.config-details {
  background: white;
  padding: 10px;
  border-radius: 4px;
  border: 1px solid #e2e8f0;
}

.config-details p {
  margin: 5px 0;
  font-size: 12px;
  color: #4a5568;
}

.test-result {
  margin-top: 20px;
  padding: 15px;
  border-radius: 8px;
  border-left: 4px solid;
}

.test-result.success {
  background: #f0fff4;
  border-color: #48bb78;
}

.test-result.error {
  background: #fff5f5;
  border-color: #e53e3e;
}

.test-result h4 {
  margin: 0 0 10px 0;
  font-size: 16px;
}

.test-result.success h4 {
  color: #22543d;
}

.test-result.error h4 {
  color: #742a2a;
}

.test-result p {
  margin: 0 0 10px 0;
  color: #4a5568;
}

.test-result .details {
  background: #edf2f7;
  padding: 10px;
  border-radius: 4px;
  margin-top: 10px;
}

.test-result .details pre {
  margin: 0;
  font-size: 12px;
  color: #2d3748;
  white-space: pre-wrap;
  word-break: break-word;
}

.cancel-btn {
  padding: 10px 20px;
  background-color: #a0aec0;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
  transition: background-color 0.2s;
}

.cancel-btn:hover {
  background-color: #718096;
}

@media (max-width: 768px) {
  .admin-header {
    flex-direction: column;
    gap: 15px;
  }

  .status-filters {
    flex-wrap: wrap;
    gap: 8px;
  }

  .filter-tab {
    padding: 8px 12px;
    font-size: 14px;
  }

  /* 手機版改為卡片式佈局 */
  .table-header {
    display: none;
  }

  .homestay-summary {
    grid-template-columns: 1fr;
    gap: 10px;
    padding: 15px;
  }

  .homestay-row {
    margin-bottom: 15px;
    border-radius: 8px;
    border: 1px solid #e2e8f0;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  }

  .col-name, .col-location, .col-contact, .col-price, .col-status {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 8px 0;
    border-bottom: 1px solid #f1f3f4;
  }

  .col-name::before { content: "名稱: "; font-weight: 600; }
  .col-location::before { content: "位置: "; font-weight: 600; }
  .col-contact::before { content: "聯絡: "; font-weight: 600; }
  .col-price::before { content: "價格: "; font-weight: 600; }
  .col-status::before { content: "狀態: "; font-weight: 600; }

  .col-actions {
    padding-top: 10px;
    justify-content: center;
    gap: 8px;
  }

  .homestay-details {
    padding: 15px;
  }

  .detail-section .row {
    margin: 0;
  }

  .detail-section .col-sm-6 {
    padding: 0;
    margin-bottom: 10px;
  }
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
  padding: 0 20px;
  
  h1 {
    color: #2d3748;
    font-size: 28px;
    font-weight: bold;
    margin: 0;
  }
  
  .header-actions {
    display: flex;
    gap: 12px;
  }
  
  .email-test-btn {
    padding: 8px 16px;
    background: linear-gradient(135deg, #10b981 0%, #059669 100%);
    color: white;
    border: none;
    border-radius: 6px;
    cursor: pointer;
    font-weight: 500;
    font-size: 14px;
    transition: all 0.3s ease;
    
    &:hover {
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(16, 185, 129, 0.4);
    }
    
    &:disabled {
      opacity: 0.6;
      cursor: not-allowed;
      transform: none;
      box-shadow: none;
    }
  }
}
</style> 