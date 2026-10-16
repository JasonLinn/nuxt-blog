<template>
  <div class="yilan-admin">
    <header class="yp-admin-head">
      <div>
        <h1 class="yp-admin-head__title">宜蘭活動總匯管理</h1>
        <p class="yp-admin-head__desc">管理活動投稿審核、編輯與發布</p>
      </div>
      <div class="yp-admin-head__actions">
        <NuxtLink to="/yilan-activities" target="_blank" class="btn btn-soft btn-icon">
          <Icon name="ri:external-link-line" /> 前台活動頁
        </NuxtLink>
      </div>
    </header>

    <div class="yp-admin-stats">
      <div class="yp-stat-card yp-stat-card--warning">
        <p class="yp-stat-card__label">待審核</p>
        <p class="yp-stat-card__value">{{ statusCounts.pending }}</p>
        <p class="yp-stat-card__hint">等待你處理</p>
      </div>
      <div class="yp-stat-card yp-stat-card--success">
        <p class="yp-stat-card__label">已上架</p>
        <p class="yp-stat-card__value">{{ statusCounts.approved }}</p>
        <p class="yp-stat-card__hint">前台可見</p>
      </div>
      <div class="yp-stat-card yp-stat-card--danger">
        <p class="yp-stat-card__label">已退回</p>
        <p class="yp-stat-card__value">{{ statusCounts.rejected }}</p>
        <p class="yp-stat-card__hint">需投稿者修改</p>
      </div>
      <div class="yp-stat-card">
        <p class="yp-stat-card__label">活動總數</p>
        <p class="yp-stat-card__value">{{ activities.length }}</p>
        <p class="yp-stat-card__hint">含所有狀態</p>
      </div>
    </div>

    <ActivityImportPanel @updated="fetchActivities" />

    <!-- 狀態篩選 -->
    <div class="yp-chips mb-3" role="group" aria-label="活動狀態">
      <button
        v-for="chip in statusChips"
        :key="chip.value"
        type="button"
        class="yp-chip"
        :class="{ 'is-active': statusFilter === chip.value }"
        @click="statusFilter = chip.value"
      >
        {{ chip.label }}
        <span class="yp-chip__count">{{ chip.count }}</span>
      </button>
    </div>

    <div class="yp-filter-bar">
      <input
        v-model="searchQuery"
        type="search"
        class="form-control yp-filter-bar__search"
        placeholder="搜尋活動標題或提交人..."
        aria-label="搜尋活動"
      />
      <select v-model="dateFilter" class="form-select" aria-label="提交時間">
        <option value="">所有時間</option>
        <option value="today">今天</option>
        <option value="week">本週</option>
        <option value="month">本月</option>
      </select>
    </div>

    <!-- 載入狀態 -->
    <div v-if="loading" class="yp-table-wrap">
      <div v-for="n in 5" :key="n" class="yilan-admin__skeleton-row">
        <span class="yp-skeleton" style="width: 40%; height: 16px"></span>
        <span class="yp-skeleton" style="width: 70%; height: 12px"></span>
      </div>
    </div>

    <!-- 錯誤狀態 -->
    <div v-else-if="loadError" class="yp-table-wrap">
      <div class="yp-empty yp-empty--error">
        <div class="yp-empty__icon"><Icon name="ri:error-warning-line" /></div>
        <h3 class="yp-empty__title">活動資料載入失敗</h3>
        <p class="yp-empty__text">請檢查網路連線後再試一次</p>
        <button type="button" class="btn btn-primary" @click="fetchActivities">重新載入</button>
      </div>
    </div>

    <!-- 空狀態 -->
    <div v-else-if="filteredActivities.length === 0" class="yp-table-wrap">
      <div class="yp-empty">
        <div class="yp-empty__icon"><Icon name="ri:calendar-event-line" /></div>
        <h3 class="yp-empty__title">沒有找到符合條件的活動</h3>
        <p class="yp-empty__text">試試調整搜尋條件或等待新的活動投稿</p>
      </div>
    </div>

    <!-- 活動列表 -->
    <div v-else class="yp-table-wrap">
      <div class="table-responsive">
        <table class="table-hover yp-table-stack table">
          <thead>
            <tr>
              <th>活動</th>
              <th>狀態</th>
              <th>活動日期</th>
              <th>提交人</th>
              <th>提交時間</th>
              <th class="text-end">操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="activity in paginatedActivities" :key="activity.id">
              <td class="yilan-admin__title-cell">
                <a href="#" class="yilan-admin__title" @click.prevent="viewActivity(activity.id)">{{
                  activity.title
                }}</a>
                <p v-if="activity.description" class="yilan-admin__desc yp-clamp-2">
                  {{ activity.description }}
                </p>
              </td>
              <td data-label="狀態">
                <span class="yp-status" :class="getStatusClass(activity.status)">{{
                  getStatusText(activity.status)
                }}</span>
              </td>
              <td data-label="活動日期" class="yp-num">{{ formatDate(activity.event_date) }}</td>
              <td data-label="提交人">{{ activity.submitter_name || '—' }}</td>
              <td data-label="提交時間" class="yp-num">
                {{ formatDateTime(activity.created_at) }}
              </td>
              <td>
                <div class="yp-row-actions yilan-admin__actions">
                  <button
                    type="button"
                    class="btn btn-sm btn-soft"
                    @click="viewActivity(activity.id)"
                  >
                    <Icon name="ri:eye-line" /> 查看
                  </button>
                  <button
                    v-if="activity.status === 'pending'"
                    type="button"
                    class="btn btn-sm btn-primary"
                    @click="approveActivity(activity.id)"
                  >
                    <Icon name="ri:checkbox-circle-line" /> 通過
                  </button>
                  <button
                    v-if="activity.status === 'pending'"
                    type="button"
                    class="btn btn-sm btn-outline-danger"
                    @click="rejectActivity(activity.id)"
                  >
                    <Icon name="ri:close-circle-line" /> 退回
                  </button>
                  <button
                    type="button"
                    class="btn btn-sm btn-soft"
                    @click="editActivity(activity.id)"
                  >
                    <Icon name="ri:edit-line" /> 編輯
                  </button>
                  <button
                    type="button"
                    class="btn btn-sm btn-outline-danger"
                    title="刪除活動"
                    aria-label="刪除活動"
                    @click="deleteActivity(activity)"
                  >
                    <Icon name="ri:delete-bin-line" />
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="yp-table-wrap__footer">
        <span>
          第 {{ (currentPage - 1) * itemsPerPage + 1 }} -
          {{ Math.min(currentPage * itemsPerPage, filteredActivities.length) }} 項，共
          {{ filteredActivities.length }} 項
        </span>
        <div v-if="totalPages > 1" class="yp-pager yilan-admin__pager">
          <button
            type="button"
            class="yp-pager__btn"
            :class="{ 'is-disabled': currentPage === 1 }"
            :disabled="currentPage === 1"
            aria-label="上一頁"
            @click="currentPage--"
          >
            <Icon name="ri:arrow-left-s-line" />
          </button>
          <span class="yp-num">{{ currentPage }} / {{ totalPages }}</span>
          <button
            type="button"
            class="yp-pager__btn"
            :class="{ 'is-disabled': currentPage === totalPages }"
            :disabled="currentPage === totalPages"
            aria-label="下一頁"
            @click="currentPage++"
          >
            <Icon name="ri:arrow-right-s-line" />
          </button>
        </div>
      </div>
    </div>

    <!-- 退回對話框 -->
    <div
      v-if="showRejectModal"
      class="modal fade show d-block yilan-admin__backdrop"
      tabindex="-1"
      role="dialog"
      aria-modal="true"
    >
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">退回活動投稿</h5>
            <button
              type="button"
              class="btn-close"
              aria-label="關閉"
              @click="showRejectModal = false"
            ></button>
          </div>
          <div class="modal-body">
            <label for="rejectionReason" class="form-label required">退回原因</label>
            <textarea
              id="rejectionReason"
              v-model="rejectionReason"
              class="form-control"
              rows="4"
              placeholder="請詳細說明退回的原因，以便提交者了解如何改進..."
            ></textarea>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-soft" @click="showRejectModal = false">
              取消
            </button>
            <button
              type="button"
              class="btn btn-danger"
              :disabled="!rejectionReason.trim()"
              @click="confirmReject"
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
  layout: 'admin'
})

const activities = ref([])
const loading = ref(true)
const loadError = ref(false)
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
    filtered = filtered.filter(
      (activity) =>
        (activity.title || '').toLowerCase().includes(query) ||
        (activity.submitter_name || '').toLowerCase().includes(query) ||
        (activity.submitter_email || '').toLowerCase().includes(query)
    )
  }

  if (statusFilter.value) {
    filtered = filtered.filter((activity) => activity.status === statusFilter.value)
  }

  if (dateFilter.value) {
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())

    filtered = filtered.filter((activity) => {
      const createdDate = new Date(activity.created_at)

      switch (dateFilter.value) {
        case 'today':
          return createdDate >= today
        case 'week': {
          const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)
          return createdDate >= weekAgo
        }
        case 'month': {
          const monthAgo = new Date(today.getFullYear(), today.getMonth() - 1, today.getDate())
          return createdDate >= monthAgo
        }
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

const statusCounts = computed(() => ({
  pending: activities.value.filter((a) => a.status === 'pending').length,
  approved: activities.value.filter((a) => a.status === 'approved').length,
  rejected: activities.value.filter((a) => a.status === 'rejected').length
}))

const statusChips = computed(() => [
  { value: '', label: '全部', count: activities.value.length },
  { value: 'pending', label: '待審核', count: statusCounts.value.pending },
  { value: 'approved', label: '已上架', count: statusCounts.value.approved },
  { value: 'rejected', label: '已退回', count: statusCounts.value.rejected }
])

const getStatusClass = (status) => {
  switch (status) {
    case 'pending':
      return 'yp-status--pending'
    case 'approved':
      return 'yp-status--approved'
    case 'rejected':
      return 'yp-status--rejected'
    default:
      return 'yp-status--draft'
  }
}

const getStatusText = (status) => {
  switch (status) {
    case 'pending':
      return '待審核'
    case 'approved':
      return '已上架'
    case 'rejected':
      return '已退回'
    default:
      return '未知'
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
    loadError.value = false
    const response = await $fetch('/api/yilan-activities', { query: { dateFilter: 'all' } })
    activities.value = response.data || []
  } catch (error) {
    console.error('Failed to fetch activities:', error)
    activities.value = []
    loadError.value = true
  } finally {
    loading.value = false
  }
}

const viewActivity = (id) => {
  navigateTo(`/admin/yilan-activities/${id}`)
}

const editActivity = (id) => {
  navigateTo(`/admin/yilan-activities/edit/${id}`)
}

const approveActivity = async (id) => {
  if (!confirm('確定要通過這個活動投稿嗎？')) return

  try {
    const response = await $fetch(`/api/yilan-activities/${id}/approve`, { method: 'POST' })

    // 根據郵件發送狀態顯示不同的訊息
    if (response.emailSent) {
      alert('活動已通過審核，通知郵件已發送給提交者')
    } else {
      alert('活動已通過審核，但無法發送通知郵件（提交者未提供郵件地址）')
    }

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
.yilan-admin {
  &__title {
    font-weight: 700;
    color: $yp-ink;

    &:hover {
      color: $yp-primary-ink;
    }
  }

  &__title-cell {
    min-width: 240px;
    max-width: 420px;
  }

  &__desc {
    margin: 2px 0 0;
    font-size: 0.8125rem;
    color: $yp-muted;
  }

  &__actions {
    flex-wrap: wrap;
    min-width: 200px;

    .btn {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      white-space: nowrap;
    }
  }

  &__skeleton-row {
    display: grid;
    gap: 8px;
    padding: 16px;
    border-bottom: 1px solid $yp-line;
  }

  &__pager {
    margin-top: 0;
  }

  &__backdrop {
    background: rgba(19, 48, 58, 0.45);
  }
}

@media (max-width: #{$yp-bp-md - 1px}) {
  .yilan-admin {
    &__title-cell {
      max-width: none;
      padding-bottom: 8px !important;
    }

    &__actions {
      justify-content: flex-start;
      min-width: 0;
      padding-top: 8px;
    }
  }
}
</style>
