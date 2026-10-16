<template>
  <div class="coupon-review">
    <header class="yp-admin-head">
      <div>
        <h1 class="yp-admin-head__title">優惠券審核管理</h1>
        <p class="yp-admin-head__desc">審核商家投稿的優惠券，核准後會顯示於前台。</p>
      </div>
    </header>

    <div v-if="!loading && statusCounts.all > 0" class="yp-admin-stats">
      <div class="yp-stat-card yp-stat-card--warning">
        <p class="yp-stat-card__label">待審核</p>
        <p class="yp-stat-card__value">{{ statusCounts.pending }}</p>
      </div>
      <div class="yp-stat-card yp-stat-card--success">
        <p class="yp-stat-card__label">已核准</p>
        <p class="yp-stat-card__value">{{ statusCounts.approved }}</p>
      </div>
      <div v-if="statusCounts.rejected > 0" class="yp-stat-card yp-stat-card--danger">
        <p class="yp-stat-card__label">已拒絕</p>
        <p class="yp-stat-card__value">{{ statusCounts.rejected }}</p>
      </div>
    </div>

    <div class="yp-filter-bar">
      <div class="yp-chips">
        <button
          v-for="option in statusOptions"
          :key="option.value"
          type="button"
          :class="['yp-chip', { 'is-active': statusFilter === option.value }]"
          @click="filterByStatus(option.value)"
        >
          {{ option.label }}
          <span class="yp-chip__count">{{ statusCounts[option.value] }}</span>
        </button>
      </div>
    </div>

    <!-- 載入狀態 -->
    <div v-if="loading" class="review-grid">
      <div v-for="n in 3" :key="n" class="yp-card">
        <span class="yp-skeleton" style="height: 160px; border-radius: 0" />
        <div class="yp-card__body">
          <span class="yp-skeleton mb-2" style="width: 70%; height: 18px" />
          <span class="yp-skeleton mb-2" style="width: 40%; height: 14px" />
          <span class="yp-skeleton" style="width: 90%; height: 14px" />
        </div>
      </div>
    </div>

    <!-- 無資料狀態 -->
    <div v-else-if="filteredCoupons.length === 0" class="yp-table-wrap">
      <div class="yp-empty">
        <div class="yp-empty__icon"><Icon name="ri:inbox-line" /></div>
        <p class="yp-empty__title">目前沒有需要審核的優惠券</p>
      </div>
    </div>

    <!-- 優惠券列表 -->
    <div v-else class="review-grid">
      <article v-for="coupon in filteredCoupons" :key="coupon.id" class="yp-card review-card">
        <div class="review-card__media">
          <img
            v-if="coupon.cover && coupon.cover.length > 0"
            :src="coupon.cover[0]"
            :alt="coupon.title"
          />
          <img v-else-if="coupon.cover_image" :src="coupon.cover_image" :alt="coupon.title" />
          <div v-else class="review-card__placeholder">
            <Icon name="ri:image-line" />
          </div>
          <span class="yp-status review-card__status" :class="getStatusBadgeClass(coupon.status)">
            {{ getStatusText(coupon.status) }}
          </span>
        </div>

        <div class="yp-card__body review-card__body">
          <h3 class="yp-card__title yp-clamp-2">{{ coupon.title }}</h3>
          <p class="review-card__business">
            <Icon name="ri:store-2-line" /> {{ coupon.business_name }}
          </p>
          <p class="review-card__desc">{{ truncateText(coupon.content, 80) }}</p>

          <div class="review-card__deal">
            <span class="yp-tag yp-tag--deal">
              {{
                coupon.discount_type === 'percentage'
                  ? `${coupon.discount_value}% 折扣`
                  : `NT$${coupon.discount_value} 折扣`
              }}
            </span>
            <span class="review-card__date yp-num">{{ formatDate(coupon.created_at) }}</span>
          </div>

          <ul class="review-card__contact">
            <li><Icon name="ri:user-line" /> {{ coupon.submitter_name }}</li>
            <li><Icon name="ri:phone-line" /> {{ coupon.submitter_phone }}</li>
            <li v-if="coupon.submitter_email">
              <Icon name="ri:mail-line" /> {{ coupon.submitter_email }}
            </li>
          </ul>

          <!-- 操作按鈕 -->
          <div v-if="coupon.status === 'pending'" class="review-card__actions">
            <button
              type="button"
              class="btn btn-primary"
              :disabled="reviewingIds.includes(coupon.id)"
              @click="reviewCoupon(coupon.id, 'approved')"
            >
              <span
                v-if="reviewingIds.includes(coupon.id)"
                class="spinner-border spinner-border-sm me-1"
              />
              核准
            </button>
            <button
              type="button"
              class="btn btn-outline-danger"
              :disabled="reviewingIds.includes(coupon.id)"
              @click="reviewCoupon(coupon.id, 'rejected')"
            >
              拒絕
            </button>
            <button type="button" class="btn btn-soft" @click="viewDetails(coupon)">詳細</button>
          </div>

          <div v-else class="review-card__actions">
            <button type="button" class="btn btn-soft w-100" @click="viewDetails(coupon)">
              查看詳細
            </button>
          </div>
        </div>
      </article>
    </div>

    <!-- 詳細資訊模態框 -->
    <div v-show="showModal" class="review-modal" @click="closeModal">
      <div class="review-modal__dialog" @click.stop>
        <div class="review-modal__header">
          <h3>優惠券詳細資訊</h3>
          <button type="button" class="btn btn-ghost btn-sm" aria-label="關閉" @click="closeModal">
            <Icon name="ri:close-line" />
          </button>
        </div>
        <div v-if="selectedCoupon" class="review-modal__body">
          <div class="row g-4">
            <div class="col-md-5">
              <div class="review-modal__image">
                <img
                  v-if="selectedCoupon.cover && selectedCoupon.cover.length > 0"
                  :src="selectedCoupon.cover[0]"
                  :alt="selectedCoupon.title"
                />
                <img
                  v-else-if="selectedCoupon.cover_image"
                  :src="selectedCoupon.cover_image"
                  :alt="selectedCoupon.title"
                />
                <div v-else class="review-card__placeholder"><Icon name="ri:image-line" /></div>
              </div>
            </div>
            <div class="col-md-7">
              <h4 class="review-modal__title">{{ selectedCoupon.title }}</h4>
              <p class="review-card__business">{{ selectedCoupon.business_name }}</p>

              <div class="review-modal__section">
                <strong>優惠內容</strong>
                <p>{{ selectedCoupon.content }}</p>
              </div>

              <div class="review-modal__section d-flex flex-wrap gap-4">
                <div>
                  <strong>優惠類型</strong>
                  <div>
                    <span class="yp-tag yp-tag--deal">
                      {{
                        selectedCoupon.discount_type === 'percentage'
                          ? '百分比折扣'
                          : '固定金額折扣'
                      }}
                    </span>
                  </div>
                </div>
                <div>
                  <strong>優惠值</strong>
                  <div class="yp-num">
                    {{
                      selectedCoupon.discount_type === 'percentage'
                        ? `${selectedCoupon.discount_value}%`
                        : `NT$${selectedCoupon.discount_value}`
                    }}
                  </div>
                </div>
              </div>

              <div class="review-modal__section">
                <strong>商家資訊</strong>
                <ul class="yp-info-list">
                  <li v-if="selectedCoupon.category">
                    <span class="yp-info-list__label">類別</span>
                    <span class="yp-info-list__value">{{ selectedCoupon.category }}</span>
                  </li>
                  <li v-if="selectedCoupon.township">
                    <span class="yp-info-list__label">鄉鎮</span>
                    <span class="yp-info-list__value">
                      {{
                        Array.isArray(selectedCoupon.township)
                          ? selectedCoupon.township.join(', ')
                          : selectedCoupon.township
                      }}
                    </span>
                  </li>
                  <li v-if="selectedCoupon.adress">
                    <span class="yp-info-list__label">地址</span>
                    <span class="yp-info-list__value">
                      {{
                        Array.isArray(selectedCoupon.adress)
                          ? selectedCoupon.adress.join(', ')
                          : selectedCoupon.adress || selectedCoupon.address
                      }}
                    </span>
                  </li>
                  <li v-else-if="selectedCoupon.address">
                    <span class="yp-info-list__label">地址</span>
                    <span class="yp-info-list__value">{{ selectedCoupon.address }}</span>
                  </li>
                  <li v-if="selectedCoupon.phone">
                    <span class="yp-info-list__label">電話</span>
                    <span class="yp-info-list__value">{{ selectedCoupon.phone }}</span>
                  </li>
                  <li v-if="selectedCoupon.website">
                    <span class="yp-info-list__label">網站</span>
                    <span class="yp-info-list__value"
                      ><a :href="selectedCoupon.website" target="_blank">{{
                        selectedCoupon.website
                      }}</a></span
                    >
                  </li>
                </ul>
              </div>

              <div class="review-modal__section">
                <strong>提交者資訊</strong>
                <ul class="yp-info-list">
                  <li>
                    <span class="yp-info-list__label">姓名</span>
                    <span class="yp-info-list__value">{{ selectedCoupon.submitter_name }}</span>
                  </li>
                  <li>
                    <span class="yp-info-list__label">電話</span>
                    <span class="yp-info-list__value">{{ selectedCoupon.submitter_phone }}</span>
                  </li>
                  <li v-if="selectedCoupon.submitter_email">
                    <span class="yp-info-list__label">Email</span>
                    <span class="yp-info-list__value">{{ selectedCoupon.submitter_email }}</span>
                  </li>
                </ul>
              </div>

              <div class="review-modal__section text-muted small">
                <div>提交時間：{{ formatDate(selectedCoupon.created_at) }}</div>
                <div v-if="selectedCoupon.updated_at !== selectedCoupon.created_at">
                  更新時間：{{ formatDate(selectedCoupon.updated_at) }}
                </div>
              </div>
            </div>
          </div>

          <div v-if="selectedCoupon.usage_notes" class="review-modal__notes">
            <strong>使用說明</strong>
            <p>{{ selectedCoupon.usage_notes }}</p>
          </div>
        </div>
        <div
          v-if="selectedCoupon && selectedCoupon.status === 'pending'"
          class="review-modal__footer"
        >
          <button
            type="button"
            class="btn btn-primary"
            :disabled="reviewingIds.includes(selectedCoupon.id)"
            @click="reviewCoupon(selectedCoupon.id, 'approved')"
          >
            <span
              v-if="reviewingIds.includes(selectedCoupon.id)"
              class="spinner-border spinner-border-sm me-1"
            />
            核准此優惠券
          </button>
          <button
            type="button"
            class="btn btn-outline-danger"
            :disabled="reviewingIds.includes(selectedCoupon.id)"
            @click="reviewCoupon(selectedCoupon.id, 'rejected')"
          >
            拒絕此優惠券
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'

// 響應式資料
const loading = ref(true)
const coupons = ref([])
const selectedCoupon = ref(null)
const statusFilter = ref('all')
const reviewingIds = ref([])
const showModal = ref(false)
const dropdownOpen = ref(false)

// 計算屬性
const statusOptions = [
  { value: 'all', label: '全部' },
  { value: 'pending', label: '待審核' },
  { value: 'approved', label: '已核准' },
  { value: 'rejected', label: '已拒絕' }
]

const statusCounts = computed(() => ({
  all: coupons.value.length,
  pending: coupons.value.filter((coupon) => coupon.status === 'pending').length,
  approved: coupons.value.filter((coupon) => coupon.status === 'approved').length,
  rejected: coupons.value.filter((coupon) => coupon.status === 'rejected').length
}))

const filteredCoupons = computed(() => {
  if (statusFilter.value === 'all') {
    return coupons.value
  }
  return coupons.value.filter((coupon) => coupon.status === statusFilter.value)
})

// 方法
const loadCoupons = async () => {
  try {
    loading.value = true
    const { data } = await $fetch('/api/coupons/review')
    coupons.value = data || []
  } catch (error) {
    console.error('載入優惠券失敗:', error)
    alert('載入優惠券失敗')
  } finally {
    loading.value = false
  }
}

const reviewCoupon = async (couponId, status) => {
  try {
    reviewingIds.value.push(couponId)

    await $fetch('/api/coupons/review', {
      method: 'POST',
      body: { id: couponId, status }
    })

    // 更新本地資料
    const couponIndex = coupons.value.findIndex((c) => c.id === couponId)
    if (couponIndex !== -1) {
      coupons.value[couponIndex].status = status
      coupons.value[couponIndex].updated_at = new Date().toISOString()
    }

    // 關閉模態框
    closeModal()

    const statusText = status === 'approved' ? '核准' : '拒絕'
    alert(`優惠券${statusText}成功`)
  } catch (error) {
    console.error('審核失敗:', error)
    alert('審核失敗，請稍後再試')
  } finally {
    reviewingIds.value = reviewingIds.value.filter((id) => id !== couponId)
  }
}

const viewDetails = (coupon) => {
  selectedCoupon.value = coupon
  showModal.value = true
  dropdownOpen.value = false
}

const closeModal = () => {
  showModal.value = false
  selectedCoupon.value = null
}

const filterByStatus = (status) => {
  statusFilter.value = status
  dropdownOpen.value = false
}

const getStatusBadgeClass = (status) => {
  const classes = {
    pending: 'yp-status--pending',
    approved: 'yp-status--approved',
    rejected: 'yp-status--rejected'
  }
  return classes[status] || 'yp-status--draft'
}

const getStatusText = (status) => {
  const texts = {
    pending: '待審核',
    approved: '已核准',
    rejected: '已拒絕'
  }
  return texts[status] || status
}

const truncateText = (text, maxLength) => {
  if (!text) return ''
  return text.length > maxLength ? text.substring(0, maxLength) + '...' : text
}

const formatDate = (dateString) => {
  if (!dateString) return ''
  return new Date(dateString).toLocaleDateString('zh-TW', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

// 關閉下拉選單當點擊外部
const handleClickOutside = (event) => {
  if (!event.target.closest('.filter-dropdown')) {
    dropdownOpen.value = false
  }
}

// 生命週期
onMounted(() => {
  loadCoupons()
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})

// SEO
definePageMeta({
  layout: 'admin',
  middleware: 'admin-auth'
})

useHead({
  title: '優惠券審核管理 - 管理後台'
})
</script>

<style lang="scss" scoped>
.review-grid {
  display: grid;
  gap: 16px;
  grid-template-columns: 1fr;

  @media (min-width: $yp-bp-md) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  @media (min-width: $yp-bp-xl) {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

.review-card {
  display: flex;
  flex-direction: column;
  overflow: hidden;

  &__media {
    position: relative;
    aspect-ratio: 16 / 9;
    background: $yp-surface-2;

    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
  }

  &__placeholder {
    width: 100%;
    height: 100%;
    display: grid;
    place-items: center;
    font-size: 2.5rem;
    color: $yp-subtle;
    background: $yp-surface-2;
  }

  &__status {
    position: absolute;
    top: 12px;
    right: 12px;
    box-shadow: $yp-shadow-sm;
  }

  &__body {
    display: flex;
    flex: 1;
    flex-direction: column;
    gap: 8px;
  }

  &__business {
    margin: 0;
    color: $yp-muted;
    font-size: 0.875rem;
  }

  &__desc {
    margin: 0;
    font-size: 0.875rem;
    line-height: 1.6;
  }

  &__deal {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
  }

  &__date {
    color: $yp-subtle;
    font-size: 0.75rem;
  }

  &__contact {
    list-style: none;
    margin: 0;
    padding: 10px 12px;
    background: $yp-surface-2;
    border-radius: $yp-radius-sm;
    font-size: 0.8125rem;
    color: $yp-muted;
    display: grid;
    gap: 2px;
    word-break: break-all;
  }

  &__actions {
    display: flex;
    gap: 8px;
    margin-top: auto;
    padding-top: 8px;

    .btn:not(.w-100) {
      flex: 1;
    }
  }
}

.review-modal {
  position: fixed;
  inset: 0;
  z-index: 1055;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
  background: rgba(19, 48, 58, 0.45);

  &__dialog {
    width: 100%;
    max-width: 880px;
    max-height: 90vh;
    display: flex;
    flex-direction: column;
    background: $yp-surface;
    border-radius: $yp-radius-lg;
    box-shadow: $yp-shadow-lg;
    overflow: hidden;
  }

  &__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 16px 20px;
    border-bottom: 1px solid $yp-line;

    h3 {
      margin: 0;
      font-size: 1.125rem;
      font-weight: 700;
    }
  }

  &__body {
    flex: 1;
    overflow-y: auto;
    padding: 20px;
  }

  &__image {
    border-radius: $yp-radius;
    overflow: hidden;
    background: $yp-surface-2;
    aspect-ratio: 4 / 3;

    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
  }

  &__title {
    font-size: 1.25rem;
    font-weight: 600;
    margin: 0 0 4px;
  }

  &__section {
    margin-top: 16px;
    font-size: 0.9375rem;

    strong {
      display: block;
      margin-bottom: 4px;
      font-size: 0.8125rem;
      color: $yp-muted;
    }

    p {
      margin: 0;
      white-space: pre-wrap;
    }
  }

  &__notes {
    margin-top: 20px;
    padding: 14px 16px;
    background: $yp-primary-soft;
    border-radius: $yp-radius;
    font-size: 0.9375rem;

    strong {
      color: $yp-primary-ink;
    }

    p {
      margin: 4px 0 0;
      white-space: pre-wrap;
    }
  }

  &__footer {
    display: flex;
    flex-wrap: wrap;
    justify-content: flex-end;
    gap: 8px;
    padding: 14px 20px;
    border-top: 1px solid $yp-line;
  }
}
</style>
