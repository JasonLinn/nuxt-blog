<template>
  <div>
    <header class="yp-admin-head">
      <div>
        <h1 class="yp-admin-head__title">民宿管理</h1>
        <p class="yp-admin-head__desc">檢視所有民宿申請、調整前台可見狀態</p>
      </div>
      <div class="yp-admin-head__actions">
        <NuxtLink to="/admin-review" class="btn btn-soft btn-icon">
          <Icon name="ri:file-list-3-line" /> 前往審核
        </NuxtLink>
      </div>
    </header>

    <!-- 統計面板 -->
    <div v-if="allHomestays.length" class="yp-admin-stats">
      <div class="yp-stat-card yp-stat-card--warning">
        <p class="yp-stat-card__label">待審核</p>
        <p class="yp-stat-card__value">{{ stats.pending }}</p>
      </div>
      <div class="yp-stat-card yp-stat-card--success">
        <p class="yp-stat-card__label">已通過</p>
        <p class="yp-stat-card__value">{{ stats.approved }}</p>
      </div>
      <div class="yp-stat-card yp-stat-card--primary">
        <p class="yp-stat-card__label">前台可見</p>
        <p class="yp-stat-card__value">{{ stats.available }}</p>
      </div>
      <div class="yp-stat-card yp-stat-card--danger">
        <p class="yp-stat-card__label">已拒絕</p>
        <p class="yp-stat-card__value">{{ stats.rejected }}</p>
      </div>
    </div>

    <!-- 搜尋和篩選 -->
    <div class="yp-filter-bar">
      <input
        v-model="searchText"
        type="search"
        placeholder="搜尋民宿名稱、編號或聯絡信箱..."
        class="form-control yp-filter-bar__search"
        @keyup.enter="searchHomestays"
      />
      <select v-model="filterStatus" class="form-select" @change="filterHomestays">
        <option value="">所有狀態</option>
        <option value="pending">待審核</option>
        <option value="approved">已通過</option>
        <option value="rejected">已拒絕</option>
      </select>
      <select v-model="filterAvailability" class="form-select" @change="filterHomestays">
        <option value="">所有可用性</option>
        <option value="true">可用</option>
        <option value="false">不可用</option>
      </select>
      <select v-model="filterLocation" class="form-select" @change="filterHomestays">
        <option value="">所有地區</option>
        <option v-for="location in locations" :key="location" :value="location">
          {{ location }}
        </option>
      </select>
      <button type="button" class="btn btn-primary btn-icon" @click="searchHomestays">
        <Icon name="ri:search-line" /> 搜尋
      </button>
    </div>

    <!-- 載入中 -->
    <div v-if="loading" class="yp-table-wrap d-grid gap-2 p-3">
      <span v-for="n in 5" :key="n" class="yp-skeleton" style="height: 44px"></span>
    </div>

    <!-- 錯誤 -->
    <div v-else-if="error" class="yp-table-wrap">
      <div class="yp-empty yp-empty--error">
        <div class="yp-empty__icon"><Icon name="ri:error-warning-line" /></div>
        <h2 class="yp-empty__title">無法載入資料</h2>
        <p class="yp-empty__text">{{ error }}</p>
        <button type="button" class="btn btn-primary" @click="loadHomestays">重新載入</button>
      </div>
    </div>

    <!-- 民宿列表 -->
    <div v-else class="yp-table-wrap">
      <div v-if="filteredHomestays.length" class="table-responsive">
        <table class="table-hover yp-table-stack table align-middle">
          <thead>
            <tr>
              <th>編號</th>
              <th>民宿名稱</th>
              <th>地點</th>
              <th>聯絡信箱</th>
              <th>狀態</th>
              <th>可用性</th>
              <th>申請時間</th>
              <th class="text-end">操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="homestay in filteredHomestays" :key="homestay.id">
              <td data-label="編號" class="yp-num fw-bold">{{ homestay.id }}</td>
              <td data-label="民宿名稱">
                <div class="fw-bold">{{ homestay.name }}</div>
                <div class="small text-muted">{{ homestay.city }}</div>
              </td>
              <td data-label="地點">{{ homestay.location }}</td>
              <td data-label="聯絡信箱" class="text-break">{{ homestay.email }}</td>
              <td data-label="狀態">
                <span class="yp-status" :class="`yp-status--${homestay.status}`">
                  {{ getStatusText(homestay.status) }}
                </span>
              </td>
              <td data-label="可用性">
                <button
                  type="button"
                  class="btn btn-sm"
                  :class="homestay.available ? 'btn-soft' : 'btn-outline-secondary'"
                  :disabled="processing"
                  @click="toggleAvailability(homestay.id, !homestay.available)"
                >
                  {{ homestay.available ? '可用' : '不可用' }}
                </button>
              </td>
              <td data-label="申請時間" class="small text-muted">
                {{ formatDate(homestay.created_at) }}
              </td>
              <td data-label="操作">
                <div class="yp-row-actions">
                  <button
                    v-if="homestay.status === 'pending'"
                    type="button"
                    class="btn btn-sm btn-primary"
                    :disabled="processing"
                    @click="quickApprove(homestay.id)"
                  >
                    快速通過
                  </button>
                  <button
                    type="button"
                    class="btn btn-sm btn-soft"
                    @click="viewDetails(homestay.id)"
                  >
                    查看詳情
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div v-else class="yp-empty">
        <div class="yp-empty__icon"><Icon name="ri:home-heart-line" /></div>
        <h2 class="yp-empty__title">沒有找到符合條件的民宿</h2>
        <p class="yp-empty__text">請調整搜尋或篩選條件。</p>
      </div>

      <div v-if="filteredHomestays.length" class="yp-table-wrap__footer">
        <span>共 {{ filteredHomestays.length }} 筆</span>
      </div>
    </div>

    <!-- 民宿詳情模態框 -->
    <div v-if="showModal" class="yp-modal-overlay" @click="closeModal">
      <div class="yp-modal" role="dialog" aria-modal="true" @click.stop>
        <div class="yp-modal__header">
          <h3 class="yp-modal__title">民宿詳情 - {{ selectedHomestay?.name }}</h3>
          <button type="button" class="btn-close" aria-label="關閉" @click="closeModal"></button>
        </div>
        <div v-if="selectedHomestay" class="yp-modal__body">
          <ul class="yp-info-list">
            <li>
              <span class="yp-info-list__label">編號</span>
              <span class="yp-info-list__value">{{ selectedHomestay.id }}</span>
            </li>
            <li>
              <span class="yp-info-list__label">名稱</span>
              <span class="yp-info-list__value">{{ selectedHomestay.name }}</span>
            </li>
            <li>
              <span class="yp-info-list__label">地區</span>
              <span class="yp-info-list__value">{{ selectedHomestay.location }}</span>
            </li>
            <li>
              <span class="yp-info-list__label">詳細地址</span>
              <span class="yp-info-list__value">{{ selectedHomestay.city }}</span>
            </li>
            <li>
              <span class="yp-info-list__label">聯絡信箱</span>
              <span class="yp-info-list__value text-break">{{ selectedHomestay.email }}</span>
            </li>
            <li>
              <span class="yp-info-list__label">電話</span>
              <span class="yp-info-list__value">{{ selectedHomestay.phone || '未提供' }}</span>
            </li>
            <li>
              <span class="yp-info-list__label">網站</span>
              <span class="yp-info-list__value text-break">{{
                selectedHomestay.website || '未提供'
              }}</span>
            </li>
            <li>
              <span class="yp-info-list__label">入住人數</span>
              <span class="yp-info-list__value">
                {{ selectedHomestay.min_guests || '不限' }} -
                {{ selectedHomestay.max_guests || '不限' }} 人
              </span>
            </li>
            <li>
              <span class="yp-info-list__label">狀態</span>
              <span class="yp-info-list__value">
                <span class="yp-status" :class="`yp-status--${selectedHomestay.status}`">
                  {{ getStatusText(selectedHomestay.status) }}
                </span>
              </span>
            </li>
            <li>
              <span class="yp-info-list__label">可用性</span>
              <span class="yp-info-list__value">
                <span
                  class="yp-status"
                  :class="selectedHomestay.available ? 'yp-status--active' : 'yp-status--inactive'"
                >
                  {{ selectedHomestay.available ? '可用' : '不可用' }}
                </span>
              </span>
            </li>
            <li>
              <span class="yp-info-list__label">申請時間</span>
              <span class="yp-info-list__value">{{ formatDate(selectedHomestay.created_at) }}</span>
            </li>
            <li v-if="selectedHomestay.approved_at">
              <span class="yp-info-list__label">審核時間</span>
              <span class="yp-info-list__value">{{
                formatDate(selectedHomestay.approved_at)
              }}</span>
            </li>
            <li v-if="selectedHomestay.approved_by">
              <span class="yp-info-list__label">審核人員</span>
              <span class="yp-info-list__value">{{ selectedHomestay.approved_by }}</span>
            </li>
          </ul>

          <div class="mt-3">
            <div class="form-label mb-1">民宿介紹</div>
            <p class="text-muted mb-0" style="white-space: pre-wrap">
              {{ selectedHomestay.capacity_description || '暫無介紹' }}
            </p>
          </div>

          <div v-if="selectedHomestay.rejection_reason" class="alert alert-danger mb-0 mt-3">
            <strong>拒絕原因：</strong>{{ selectedHomestay.rejection_reason }}
          </div>
        </div>
        <div class="yp-modal__footer">
          <button type="button" class="btn btn-ghost" @click="closeModal">關閉</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'

definePageMeta({
  layout: 'admin',
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
  const pending = allHomestays.value.filter((h) => h.status === 'pending').length
  const approved = allHomestays.value.filter((h) => h.status === 'approved').length
  const available = allHomestays.value.filter((h) => h.status === 'approved' && h.available).length
  const rejected = allHomestays.value.filter((h) => h.status === 'rejected').length

  return { pending, approved, available, rejected }
})

// 所有地區選項
const locations = computed(() => {
  const locationSet = new Set()
  allHomestays.value.forEach((homestay) => {
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
    filtered = filtered.filter(
      (h) =>
        h.name.toLowerCase().includes(searchTerm) ||
        h.id.toLowerCase().includes(searchTerm) ||
        h.email.toLowerCase().includes(searchTerm)
    )
  }

  // 狀態篩選
  if (filterStatus.value) {
    filtered = filtered.filter((h) => h.status === filterStatus.value)
  }

  // 可用性篩選
  if (filterAvailability.value !== '') {
    const isAvailable = filterAvailability.value === 'true'
    filtered = filtered.filter((h) => h.available === isAvailable)
  }

  // 地區篩選
  if (filterLocation.value) {
    filtered = filtered.filter((h) => h.location === filterLocation.value)
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
    const homestay = allHomestays.value.find((h) => h.id === homestayId)
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
  selectedHomestay.value = allHomestays.value.find((h) => h.id === homestayId)
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

<style scoped lang="scss">
.yp-modal-overlay {
  position: fixed;
  inset: 0;
  z-index: 1050;
  display: grid;
  place-items: center;
  padding: 16px;
  background: rgba(19, 48, 58, 0.45);
}

.yp-modal {
  width: 100%;
  max-width: 560px;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  background: $yp-surface;
  border-radius: $yp-radius-lg;
  box-shadow: $yp-shadow-lg;

  &__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    padding: 18px 20px 12px;
    border-bottom: 1px solid $yp-line;
  }

  &__title {
    font-size: 1.125rem;
    font-weight: 700;
    margin: 0;
  }

  &__body {
    padding: 16px 20px;
    overflow-y: auto;
  }

  &__footer {
    display: flex;
    justify-content: flex-end;
    padding: 12px 20px;
    border-top: 1px solid $yp-line;
  }
}
</style>
