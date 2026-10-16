<template>
  <div class="activity-detail">
    <nav class="yp-breadcrumb" aria-label="麵包屑">
      <NuxtLink to="/admin/yilan-activities">宜蘭活動管理</NuxtLink>
      <span>活動詳情</span>
    </nav>

    <!-- 載入狀態 -->
    <div v-if="loading" class="yp-detail">
      <div class="yp-card yp-card__section">
        <span class="yp-skeleton mb-3" style="width: 55%; height: 28px"></span>
        <span class="yp-skeleton mb-2" style="width: 100%; height: 14px"></span>
        <span class="yp-skeleton mb-2" style="width: 90%; height: 14px"></span>
        <span class="yp-skeleton" style="width: 70%; height: 14px"></span>
      </div>
      <div class="yp-card yp-card__section">
        <span class="yp-skeleton mb-2" style="width: 40%; height: 18px"></span>
        <span class="yp-skeleton" style="width: 100%; height: 40px"></span>
      </div>
    </div>

    <!-- 找不到活動 -->
    <div v-else-if="!activity" class="yp-card">
      <div class="yp-empty yp-empty--error">
        <div class="yp-empty__icon"><Icon name="ri:error-warning-line" /></div>
        <h3 class="yp-empty__title">找不到此活動</h3>
        <p class="yp-empty__text">活動可能已被刪除，或網址有誤</p>
        <NuxtLink to="/admin/yilan-activities" class="btn btn-primary">返回活動列表</NuxtLink>
      </div>
    </div>

    <template v-else>
      <header class="yp-admin-head">
        <div>
          <h1 class="yp-admin-head__title">{{ activity.title }}</h1>
          <p class="yp-admin-head__desc">活動詳情與審核狀態</p>
        </div>
        <div class="yp-admin-head__actions">
          <span class="yp-status" :class="getStatusClass(activity.status)">{{
            getStatusText(activity.status)
          }}</span>
        </div>
      </header>

      <div class="yp-detail">
        <!-- 左側內容區 -->
        <div class="activity-detail__main">
          <section class="yp-card">
            <div class="yp-card__head">
              <h2 class="yp-card__head-title">活動資訊</h2>
            </div>
            <div class="yp-card__section">
              <ul class="yp-info-list">
                <li>
                  <span class="yp-info-list__label">活動日期</span>
                  <span class="yp-info-list__value">{{ formatDate(activity.event_date) }}</span>
                </li>
                <li v-if="activity.event_time">
                  <span class="yp-info-list__label">活動時間</span>
                  <span class="yp-info-list__value">{{ activity.event_time }}</span>
                </li>
                <li v-if="activity.location">
                  <span class="yp-info-list__label">活動地點</span>
                  <span class="yp-info-list__value">{{ activity.location }}</span>
                </li>
                <li v-if="activity.activity_type">
                  <span class="yp-info-list__label">活動類型</span>
                  <span class="yp-info-list__value">{{ activity.activity_type }}</span>
                </li>
                <li>
                  <span class="yp-info-list__label">主辦單位</span>
                  <span class="yp-info-list__value">{{ activity.organizer_name || '—' }}</span>
                </li>
                <li>
                  <span class="yp-info-list__label">聯絡信箱</span>
                  <span class="yp-info-list__value">{{ activity.organizer_email || '—' }}</span>
                </li>
                <li v-if="activity.organizer_phone">
                  <span class="yp-info-list__label">聯絡電話</span>
                  <span class="yp-info-list__value">{{ activity.organizer_phone }}</span>
                </li>
              </ul>
            </div>
          </section>

          <section v-if="activity.description" class="yp-card">
            <div class="yp-card__head">
              <h2 class="yp-card__head-title">活動簡介</h2>
            </div>
            <div class="yp-card__section">
              <div class="yp-prose activity-detail__pre">{{ activity.description }}</div>
            </div>
          </section>

          <section v-if="activity.images && activity.images.length" class="yp-card">
            <div class="yp-card__head">
              <h2 class="yp-card__head-title">活動圖片</h2>
              <span class="yp-tag">{{ activity.images.length }} 張</span>
            </div>
            <div class="yp-card__section">
              <div class="activity-detail__images">
                <button
                  v-for="(image, index) in activity.images"
                  :key="index"
                  type="button"
                  class="activity-detail__image"
                  :aria-label="`放大活動圖片 ${index + 1}`"
                  @click="openImageModal(image)"
                >
                  <img :src="image" :alt="`活動圖片 ${index + 1}`" loading="lazy" />
                </button>
              </div>
            </div>
          </section>

          <section v-if="activity.organizer_phone || activity.contact_info" class="yp-card">
            <div class="yp-card__head">
              <h2 class="yp-card__head-title">聯絡資訊</h2>
            </div>
            <div class="yp-card__section">
              <ul class="yp-info-list">
                <li v-if="activity.organizer_phone">
                  <span class="yp-info-list__label">電話</span>
                  <span class="yp-info-list__value">{{ activity.organizer_phone }}</span>
                </li>
                <li v-if="activity.contact_info">
                  <span class="yp-info-list__label">其他方式</span>
                  <span class="yp-info-list__value activity-detail__pre">{{
                    activity.contact_info
                  }}</span>
                </li>
              </ul>
            </div>
          </section>

          <div
            v-if="activity.status === 'rejected' && activity.rejection_reason"
            class="alert alert-danger mb-0"
          >
            <h3 class="h6 fw-bold">退回原因</h3>
            <p class="activity-detail__pre mb-0">{{ activity.rejection_reason }}</p>
          </div>

          <div v-if="activity.admin_notes" class="alert alert-info mb-0">
            <h3 class="h6 fw-bold">管理員備註</h3>
            <p class="activity-detail__pre mb-0">{{ activity.admin_notes }}</p>
          </div>
        </div>

        <!-- 右側操作區 -->
        <aside class="yp-detail__aside activity-detail__aside">
          <section class="yp-card">
            <div class="yp-card__head">
              <h2 class="yp-card__head-title">管理員操作</h2>
            </div>
            <div class="yp-card__section d-grid gap-2">
              <button
                v-if="activity.status === 'pending'"
                type="button"
                class="btn btn-primary btn-icon"
                @click="approveActivity"
              >
                <Icon name="ri:checkbox-circle-line" /> 通過審核
              </button>

              <button type="button" class="btn btn-soft btn-icon" @click="editActivity">
                <Icon name="ri:edit-line" /> 編輯活動
              </button>

              <button
                v-if="activity.status === 'pending'"
                type="button"
                class="btn btn-outline-danger btn-icon"
                @click="showRejectModal = true"
              >
                <Icon name="ri:close-circle-line" /> 退回投稿
              </button>
            </div>
          </section>

          <section class="yp-card">
            <div class="yp-card__head">
              <h2 class="yp-card__head-title">提交人資訊</h2>
            </div>
            <div class="yp-card__section">
              <ul class="yp-info-list">
                <li>
                  <span class="yp-info-list__label">姓名</span>
                  <span class="yp-info-list__value">{{ activity.submitter_name || '—' }}</span>
                </li>
                <li>
                  <span class="yp-info-list__label">信箱</span>
                  <span class="yp-info-list__value">{{ activity.submitter_email || '—' }}</span>
                </li>
                <li>
                  <span class="yp-info-list__label">提交時間</span>
                  <span class="yp-info-list__value">{{ formatDateTime(activity.created_at) }}</span>
                </li>
                <li v-if="activity.updated_at !== activity.created_at">
                  <span class="yp-info-list__label">最後更新</span>
                  <span class="yp-info-list__value">{{ formatDateTime(activity.updated_at) }}</span>
                </li>
                <li v-if="activity.approved_at">
                  <span class="yp-info-list__label">通過時間</span>
                  <span class="yp-info-list__value">{{
                    formatDateTime(activity.approved_at)
                  }}</span>
                </li>
                <li v-if="activity.approved_by">
                  <span class="yp-info-list__label">審核人員</span>
                  <span class="yp-info-list__value">{{ activity.approved_by }}</span>
                </li>
              </ul>
            </div>
          </section>
        </aside>
      </div>
    </template>

    <!-- 圖片放大模態框 -->
    <div v-if="selectedImage" class="activity-detail__lightbox" @click="selectedImage = null">
      <img :src="selectedImage" alt="活動圖片放大" @click.stop />
      <button
        type="button"
        class="activity-detail__lightbox-close"
        aria-label="關閉圖片"
        @click="selectedImage = null"
      >
        <Icon name="ri:close-line" />
      </button>
    </div>

    <!-- 退回原因輸入對話框 -->
    <div
      v-if="showRejectModal"
      class="modal fade show d-block activity-detail__backdrop"
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
              placeholder="請輸入退回原因..."
              class="form-control"
              rows="4"
            ></textarea>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-soft" @click="showRejectModal = false">
              取消
            </button>
            <button type="button" class="btn btn-danger" @click="confirmReject">確認退回</button>
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

const route = useRoute()
const router = useRouter()

const activity = ref(null)
const loading = ref(true)
const selectedImage = ref(null)
const showRejectModal = ref(false)
const rejectionReason = ref('')

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
.activity-detail {
  &__main,
  &__aside {
    display: grid;
    gap: 16px;
    min-width: 0;
  }

  &__pre {
    white-space: pre-wrap;
  }

  &__images {
    display: grid;
    gap: 12px;
    grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  }

  &__image {
    padding: 0;
    border: 0;
    border-radius: $yp-radius;
    overflow: hidden;
    background: $yp-surface-2;
    aspect-ratio: 16 / 10;
    cursor: zoom-in;

    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      display: block;
      transition: transform 0.2s ease;
    }

    &:hover img {
      transform: scale(1.04);
    }
  }

  &__lightbox {
    position: fixed;
    inset: 0;
    z-index: 1080;
    display: grid;
    place-items: center;
    padding: 24px;
    background: rgba(19, 48, 58, 0.8);

    img {
      max-width: 100%;
      max-height: 90vh;
      object-fit: contain;
      border-radius: $yp-radius;
    }
  }

  &__lightbox-close {
    position: absolute;
    top: 16px;
    right: 16px;
    width: 44px;
    height: 44px;
    display: grid;
    place-items: center;
    border: 0;
    border-radius: 50%;
    background: $yp-surface;
    color: $yp-ink;
    font-size: 1.25rem;
  }

  &__backdrop {
    background: rgba(19, 48, 58, 0.45);
  }
}
</style>
