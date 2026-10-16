<template>
  <div class="yp-page">
    <nav class="yp-breadcrumb" aria-label="breadcrumb">
      <NuxtLink to="/">首頁</NuxtLink><span>優惠券／代訂服務</span>
    </nav>
    <header class="yp-page-head">
      <div>
        <span class="yp-page-head__eyebrow">LINE 服務入口</span>
        <h1 class="yp-page-head__title">優惠券／代訂服務列表</h1>
        <p class="yp-page-head__desc">多樣化的優惠券與代訂服務，讓您的宜蘭之旅更加豐富與便利。</p>
      </div>
    </header>

    <section v-for="section in sections" :key="section.key" class="services-section">
      <div class="yp-section-head">
        <h2 class="yp-section-head__title">
          <Icon :name="section.icon" class="services-section__icon" />{{ section.title }}
        </h2>
        <a :href="section.liff" class="btn btn-line btn-sm btn-icon" target="_blank" rel="noopener">
          前往 LINE 服務<Icon name="ri:external-link-line" />
        </a>
      </div>

      <!-- 載入中 -->
      <div v-if="section.loading" class="yp-grid yp-grid--3">
        <div v-for="n in 3" :key="`${section.key}-skeleton-${n}`" class="yp-card">
          <div class="yp-card__media yp-skeleton" />
          <div class="yp-card__body">
            <span class="yp-skeleton mb-2" style="width: 70%; height: 20px" />
            <span class="yp-skeleton" style="width: 90%" />
          </div>
        </div>
      </div>

      <!-- 錯誤 -->
      <div v-else-if="section.error" class="yp-card yp-empty yp-empty--error">
        <div class="yp-empty__icon"><Icon name="ri:wifi-off-line" /></div>
        <p class="yp-empty__title">發生錯誤，請稍後再試</p>
        <p class="yp-empty__text">重新整理頁面，或稍後再回來看看。</p>
      </div>

      <!-- 列表 -->
      <div v-else-if="section.items && section.items.length > 0" class="yp-grid yp-grid--3">
        <NuxtLink
          v-for="item in section.items"
          :key="item.id"
          :to="`/articles/${item.id}`"
          class="yp-card yp-card--hover services-card"
        >
          <div class="yp-card__media">
            <img v-if="item.cover?.[0]" :src="item.cover[0]" :alt="section.imgAlt" loading="lazy" />
          </div>
          <div class="yp-card__body">
            <h3 class="yp-card__title yp-clamp-1">{{ item.title }}</h3>
            <p class="yp-card__meta yp-clamp-2">{{ truncateText(item.content, 50) }}</p>
            <div v-if="item.adress?.[0]" class="yp-tags mt-2">
              <span class="yp-tag"><Icon name="ri:map-pin-2-line" />{{ item.adress[0] }}</span>
            </div>
          </div>
        </NuxtLink>
      </div>

      <!-- 無資料 -->
      <div v-else class="yp-card yp-empty">
        <div class="yp-empty__icon"><Icon :name="section.icon" /></div>
        <p class="yp-empty__title">{{ section.emptyText }}</p>
        <p class="yp-empty__text">請透過 LINE 服務查看最新資訊。</p>
        <a :href="section.liff" class="btn btn-soft" target="_blank" rel="noopener"
          >前往 LINE 服務</a
        >
      </div>
    </section>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import useCouponStore from '~/store/coupon'

useSeoMeta({
  title: '優惠券/代訂服務列表 - 宜蘭旅遊通',
  description: '宜蘭旅遊通提供多樣化的優惠券與代訂服務，讓您的宜蘭之旅更加豐富與便利。',
  canonical: 'https://yilanpass.com/coupon-services'
})

useHead({
  link: [
    {
      rel: 'canonical',
      href: 'https://yilanpass.com/coupon-services'
    }
  ]
})

const couponStore = useCouponStore()

// 數據狀態
const couponData = ref([])
const bookingData = ref([])
const loading = ref(true)
const loadingBooking = ref(true)
const error = ref(null)
const errorBooking = ref(null)

// LIFF 連結
const liffUrls = {
  coupon: 'https://liff.line.me/2005661804-zld9QenV',
  booking: 'https://liff.line.me/2005661804-9KNJXMpB'
}

// 區塊設定（模板用）
const sections = computed(() => [
  {
    key: 'coupon',
    title: '優惠券服務',
    icon: 'ri:coupon-3-line',
    liff: liffUrls.coupon,
    loading: loading.value,
    error: error.value,
    items: couponData.value,
    imgAlt: '優惠券圖片',
    emptyText: '目前沒有可用的優惠券'
  },
  {
    key: 'booking',
    title: '代訂服務',
    icon: 'ri:calendar-check-line',
    liff: liffUrls.booking,
    loading: loadingBooking.value,
    error: errorBooking.value,
    items: bookingData.value,
    imgAlt: '代訂服務圖片',
    emptyText: '目前沒有可用的代訂服務'
  }
])

// 獲取優惠券數據
const fetchCouponData = async () => {
  loading.value = true
  try {
    // 以回傳值為準（共用 store 會被另一個請求覆蓋）
    const result = await couponStore.fetchAndSetCoupon({
      selectedCate: '優惠券',
      pageSize: 10
    })

    if (result?.error) {
      error.value = result.error.message || '獲取優惠券數據時發生錯誤'
    } else {
      couponData.value = result?.data?.items || []
    }
  } catch (err) {
    error.value = err.message || '獲取優惠券數據時發生錯誤'
  } finally {
    loading.value = false
  }
}

// 獲取代訂服務數據
const fetchBookingData = async () => {
  loadingBooking.value = true
  try {
    // 使用臨時 store 實例來獲取代訂服務數據，避免覆蓋優惠券數據
    const tempStore = useCouponStore()
    const result = await tempStore.fetchAndSetCoupon({
      selectedCate: '代訂服務',
      pageSize: 10
    })

    if (result?.error) {
      errorBooking.value = result.error.message || '獲取代訂服務數據時發生錯誤'
    } else {
      bookingData.value = result?.data?.items || []
    }
  } catch (err) {
    errorBooking.value = err.message || '獲取代訂服務數據時發生錯誤'
  } finally {
    loadingBooking.value = false
  }
}

// 截斷文本
const truncateText = (text, maxLength) => {
  if (!text) return ''
  return text.length > maxLength ? text.substring(0, maxLength) + '...' : text
}

// 頁面加載時獲取數據
onMounted(() => {
  fetchCouponData()
  fetchBookingData()
})
</script>

<style scoped lang="scss">
.services-section {
  margin-bottom: 40px;

  &__icon {
    color: $yp-primary;
    margin-right: 6px;
    vertical-align: -3px;
  }
}

.services-card {
  display: block;
  color: inherit;
  text-decoration: none;
}
</style>
