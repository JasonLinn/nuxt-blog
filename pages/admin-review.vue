<template>
  <div>
    <header class="yp-admin-head">
      <div>
        <h1 class="yp-admin-head__title">民宿審核</h1>
        <p class="yp-admin-head__desc">審核新民宿申請，管理已通過民宿的上架狀態</p>
      </div>
      <div class="yp-admin-head__actions">
        <button
          type="button"
          class="btn btn-soft btn-icon"
          :disabled="processing"
          @click="showEmailTest = true"
        >
          <Icon name="ri:mail-send-line" /> 測試郵件
        </button>
      </div>
    </header>

    <!-- 載入中 -->
    <div v-if="loading" class="yp-table-wrap d-grid gap-2 p-3">
      <span v-for="n in 5" :key="n" class="yp-skeleton" style="height: 56px"></span>
    </div>

    <!-- 錯誤 -->
    <div v-else-if="error" class="yp-table-wrap">
      <div class="yp-empty yp-empty--error">
        <div class="yp-empty__icon"><Icon name="ri:error-warning-line" /></div>
        <h2 class="yp-empty__title">無法載入資料</h2>
        <p class="yp-empty__text">{{ error }}</p>
        <button type="button" class="btn btn-primary" @click="loadHomestays()">重新載入</button>
      </div>
    </div>

    <template v-else>
      <!-- 狀態篩選 -->
      <div class="yp-filter-bar">
        <div class="yp-chips">
          <button
            v-for="tab in statusTabs"
            :key="tab.key"
            type="button"
            class="yp-chip"
            :class="{ 'is-active': currentTab === tab.key }"
            @click="switchTab(tab.key)"
          >
            {{ tab.label }}
            <span class="yp-chip__count">{{ getHomestayCount(tab.key) }}</span>
          </button>
        </div>
      </div>

      <div class="yp-table-wrap">
        <div v-if="filteredHomestays.length === 0" class="yp-empty">
          <div class="yp-empty__icon"><Icon name="ri:inbox-line" /></div>
          <h2 class="yp-empty__title">{{ getNoDataMessage() }}</h2>
        </div>

        <div v-else class="table-responsive">
          <table class="table-hover yp-table-stack table align-middle">
            <thead>
              <tr>
                <th>民宿名稱</th>
                <th>位置</th>
                <th>聯絡方式</th>
                <th>價格範圍</th>
                <th>狀態</th>
                <th class="text-end">操作</th>
              </tr>
            </thead>
            <tbody>
              <template v-for="homestay in filteredHomestays" :key="homestay.id">
                <tr>
                  <td data-label="民宿名稱">
                    <div class="text-md-start">
                      <div class="fw-bold">{{ homestay.name }}</div>
                      <div class="small text-muted">
                        申請時間：{{ formatDate(homestay.created_at) }}
                      </div>
                    </div>
                  </td>
                  <td data-label="位置">
                    <div class="text-md-start">
                      <div>{{ homestay.city }}</div>
                      <div class="small text-muted">{{ homestay.location }}</div>
                    </div>
                  </td>
                  <td data-label="聯絡方式">
                    <div class="text-md-start">
                      <div class="text-break">{{ homestay.email }}</div>
                      <div class="small text-muted">{{ homestay.phone }}</div>
                    </div>
                  </td>
                  <td data-label="價格範圍">
                    <div class="text-md-start">
                      <div class="yp-num">
                        ${{ homestay.min_price }} - ${{ homestay.max_price }}
                      </div>
                      <div class="small text-muted">
                        {{ homestay.min_guests }}-{{ homestay.max_guests }}人
                      </div>
                    </div>
                  </td>
                  <td data-label="狀態">
                    <div class="d-flex flex-wrap gap-1">
                      <span class="yp-status" :class="`yp-status--${homestay.status}`">
                        {{ getStatusText(homestay.status) }}
                      </span>
                      <span
                        v-if="homestay.status === 'approved'"
                        class="yp-status"
                        :class="homestay.available ? 'yp-status--active' : 'yp-status--inactive'"
                      >
                        {{ homestay.available ? '可用' : '不可用' }}
                      </span>
                    </div>
                  </td>
                  <td data-label="操作">
                    <div class="yp-row-actions review-actions">
                      <button
                        type="button"
                        class="btn btn-sm btn-ghost"
                        @click="toggleDetails(homestay.id)"
                      >
                        {{ expandedRows.includes(homestay.id) ? '收起' : '詳情' }}
                      </button>

                      <!-- 待審核狀態的按鈕 -->
                      <template v-if="homestay.status === 'pending'">
                        <button
                          type="button"
                          class="btn btn-sm btn-primary"
                          :disabled="processing"
                          @click="approveHomestay(homestay.id)"
                        >
                          通過
                        </button>
                        <button
                          type="button"
                          class="btn btn-sm btn-outline-danger"
                          :disabled="processing"
                          @click="rejectHomestay(homestay.id)"
                        >
                          拒絕
                        </button>
                      </template>

                      <!-- 已通過審核的按鈕 -->
                      <template v-else-if="homestay.status === 'approved'">
                        <button
                          type="button"
                          class="btn btn-sm btn-soft"
                          :disabled="processing"
                          @click="toggleAvailability(homestay.id, !homestay.available)"
                        >
                          {{ homestay.available ? '停用' : '啟用' }}
                        </button>
                        <button
                          type="button"
                          class="btn btn-sm btn-outline-danger"
                          :disabled="processing"
                          @click="revokeHomestay(homestay.id)"
                        >
                          撤銷
                        </button>
                      </template>

                      <!-- 已拒絕的按鈕 -->
                      <template v-else-if="homestay.status === 'rejected'">
                        <button
                          type="button"
                          class="btn btn-sm btn-primary"
                          :disabled="processing"
                          @click="approveHomestay(homestay.id)"
                        >
                          重新通過
                        </button>
                      </template>
                    </div>
                  </td>
                </tr>

                <!-- 展開的詳細資訊 -->
                <tr v-if="expandedRows.includes(homestay.id)" class="review-detail-row">
                  <td colspan="6">
                    <div class="row g-3 text-start">
                      <div :class="homestay.image_url ? 'col-md-8' : 'col-12'">
                        <div class="fw-bold mb-2">基本資訊</div>
                        <ul class="yp-info-list">
                          <li>
                            <span class="yp-info-list__label">網站</span>
                            <span class="yp-info-list__value text-break">
                              <a
                                v-if="homestay.website"
                                :href="homestay.website"
                                target="_blank"
                                rel="noopener"
                              >
                                {{ homestay.website }}
                              </a>
                              <span v-else class="text-muted">未提供</span>
                            </span>
                          </li>
                          <li>
                            <span class="yp-info-list__label">容量描述</span>
                            <span class="yp-info-list__value">{{
                              homestay.capacity_description
                            }}</span>
                          </li>
                          <li v-if="homestay.approved_at">
                            <span class="yp-info-list__label">審核時間</span>
                            <span class="yp-info-list__value">{{
                              formatDate(homestay.approved_at)
                            }}</span>
                          </li>
                          <li v-if="homestay.approved_by">
                            <span class="yp-info-list__label">審核人員</span>
                            <span class="yp-info-list__value">{{ homestay.approved_by }}</span>
                          </li>
                        </ul>
                        <div v-if="homestay.rejection_reason" class="alert alert-danger mb-0 mt-3">
                          <strong>拒絕原因：</strong>{{ homestay.rejection_reason }}
                        </div>
                      </div>
                      <div v-if="homestay.image_url" class="col-md-4">
                        <img
                          :src="homestay.image_url"
                          :alt="homestay.name"
                          class="review-detail-image"
                        />
                      </div>
                    </div>
                  </td>
                </tr>
              </template>
            </tbody>
          </table>
        </div>

        <div v-if="filteredHomestays.length" class="yp-table-wrap__footer">
          <span>{{ currentTabLabel }}：共 {{ filteredHomestays.length }} 筆</span>
        </div>
      </div>
    </template>

    <!-- 測試郵件彈出視窗 -->
    <div v-if="showEmailTest" class="yp-modal-overlay" @click="closeEmailTestModal">
      <div class="yp-modal" role="dialog" aria-modal="true" @click.stop>
        <div class="yp-modal__header">
          <h3 class="yp-modal__title d-flex align-items-center gap-2">
            <Icon name="ri:mail-send-line" class="text-primary" /> 測試郵件功能
          </h3>
          <button
            type="button"
            class="btn-close"
            aria-label="關閉"
            @click="showEmailTest = false"
          ></button>
        </div>

        <div class="yp-modal__body d-grid gap-3">
          <div class="yp-form-section yp-form-section--flat">
            <h4 class="yp-form-section__title">0. 檢查郵件設定</h4>
            <p class="yp-form-section__desc">檢查環境變數和設定是否正確</p>
            <button
              type="button"
              class="btn btn-soft"
              :disabled="emailTesting"
              @click="checkEmailConfig"
            >
              {{ emailTesting && emailTestType === 'config' ? '檢查中...' : '檢查設定' }}
            </button>

            <!-- 設定檢查結果 -->
            <div v-if="emailConfigResult" class="mt-3">
              <div class="fw-bold mb-2">設定檢查結果</div>
              <ul class="list-unstyled small mb-2">
                <li
                  v-for="rec in emailConfigResult.recommendations"
                  :key="rec"
                  :class="
                    rec.startsWith('✓')
                      ? 'text-success'
                      : rec.startsWith('❌')
                      ? 'text-danger'
                      : 'text-warning'
                  "
                >
                  {{ rec }}
                </li>
              </ul>
              <div class="small text-muted">
                <div>
                  <strong>EMAIL_USER：</strong>{{ emailConfigResult.config.emailUserValue }}
                </div>
                <div>
                  <strong>EMAIL_PASSWORD 長度：</strong
                  >{{ emailConfigResult.config.emailPasswordLength }} 字元
                </div>
              </div>
            </div>
          </div>

          <div class="yp-form-section yp-form-section--flat">
            <h4 class="yp-form-section__title">1. 測試郵件服務連接</h4>
            <p class="yp-form-section__desc">檢查 Gmail SMTP 設定是否正確</p>
            <button
              type="button"
              class="btn btn-soft"
              :disabled="emailTesting"
              @click="testEmailConnection"
            >
              {{ emailTesting && emailTestType === 'connection' ? '測試中...' : '測試連接' }}
            </button>
          </div>

          <div class="yp-form-section yp-form-section--flat">
            <h4 class="yp-form-section__title">2. 發送測試郵件</h4>
            <p class="yp-form-section__desc">發送實際的審核通過郵件到指定信箱</p>
            <label class="form-label" for="test-email">收件者信箱</label>
            <input
              id="test-email"
              v-model="testEmailAddress"
              type="email"
              placeholder="test@example.com"
              class="form-control mb-3"
            />
            <button
              type="button"
              class="btn btn-primary"
              :disabled="emailTesting || !testEmailAddress"
              @click="sendTestEmail"
            >
              {{ emailTesting && emailTestType === 'send' ? '發送中...' : '發送測試郵件' }}
            </button>
          </div>

          <div
            v-if="emailTestResult"
            class="alert mb-0"
            :class="emailTestResult.success ? 'alert-success' : 'alert-danger'"
          >
            <h4 class="h6 d-flex align-items-center gap-2">
              <Icon
                :name="emailTestResult.success ? 'ri:checkbox-circle-line' : 'ri:close-circle-line'"
              />
              {{ emailTestResult.success ? '測試成功' : '測試失敗' }}
            </h4>
            <p class="mb-0">{{ emailTestResult.message }}</p>
            <pre v-if="emailTestResult.details" class="review-pre mb-0 mt-2">{{
              emailTestResult.details
            }}</pre>
          </div>
        </div>

        <div class="yp-modal__footer">
          <button type="button" class="btn btn-ghost" @click="showEmailTest = false">關閉</button>
        </div>
      </div>
    </div>

    <!-- 拒絕/撤銷原因輸入對話框 -->
    <div v-if="showRejectModal" class="yp-modal-overlay" @click="closeRejectModal">
      <div class="yp-modal yp-modal--sm" role="dialog" aria-modal="true" @click.stop>
        <div class="yp-modal__header">
          <h3 class="yp-modal__title d-flex align-items-center gap-2">
            <Icon
              :name="currentAction === 'revoke' ? 'ri:arrow-go-back-line' : 'ri:close-circle-line'"
              class="text-danger"
            />
            {{ currentAction === 'revoke' ? '撤銷民宿' : '拒絕申請' }}
          </h3>
          <button
            type="button"
            class="btn-close"
            aria-label="關閉"
            @click="closeRejectModal"
          ></button>
        </div>

        <div class="yp-modal__body">
          <label class="form-label required" for="reject-reason">
            請輸入{{ actionText }}此民宿申請的原因
          </label>
          <textarea
            id="reject-reason"
            v-model="rejectionReason"
            class="form-control"
            :placeholder="
              currentAction === 'revoke'
                ? '例如：違反規定、收到投訴、資料造假等...'
                : '例如：資料不完整、不符合規定、圖片模糊等...'
            "
            rows="4"
            required
          ></textarea>
          <div class="form-text">* {{ actionText }}原因將會通過電子郵件發送給申請者</div>
        </div>

        <div class="yp-modal__footer gap-2">
          <button type="button" class="btn btn-ghost" @click="closeRejectModal">取消</button>
          <button
            type="button"
            class="btn btn-danger"
            :disabled="!rejectionReason?.trim() || processing"
            @click="confirmReject"
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
  layout: 'admin',
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
  const targetHomestay = allHomestays.value.find((h) => h.id === currentRejectHomestayId.value)
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
const rejectHomestay = (homestayId) => {
  // 儲存要拒絕的民宿 ID 並打開模態框
  currentRejectHomestayId.value = homestayId
  rejectionReason.value = ''
  showRejectModal.value = true
}

// 撤銷已通過的民宿
const revokeHomestay = (homestayId) => {
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

// computed 屬性
const filteredHomestays = computed(() => {
  if (currentTab.value === 'all') {
    return allHomestays.value
  }
  return allHomestays.value.filter((h) => h.status === currentTab.value)
})

const currentTabLabel = computed(() => {
  const tab = statusTabs.find((t) => t.key === currentTab.value)
  return tab ? tab.label : '未知'
})

// 獲取民宿數量
const getHomestayCount = (status) => {
  if (status === 'all') return allHomestays.value.length
  return allHomestays.value.filter((h) => h.status === status).length
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
    await $fetch('/api/admin/test-email', {
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
    await $fetch('/api/admin/test-email', {
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
  max-width: 600px;
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

.yp-modal--sm {
  max-width: 480px;
}

.yp-form-section--flat {
  margin-bottom: 0;
  box-shadow: none;
  border: 1px solid $yp-line;
  padding: 16px;
}

.review-actions {
  flex-wrap: wrap;
}

.review-detail-row > td {
  background: $yp-bg;
  padding: 16px 20px !important;
}

.review-detail-image {
  width: 100%;
  max-height: 200px;
  object-fit: cover;
  border-radius: $yp-radius;
  border: 1px solid $yp-line;
}

.review-pre {
  max-height: 160px;
  overflow: auto;
  font-size: 0.75rem;
  white-space: pre-wrap;
  word-break: break-all;
}
</style>
