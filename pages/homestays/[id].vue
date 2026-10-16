<template>
  <div class="yp-page hd">
    <!-- 載入狀態 -->
    <div v-if="loading" aria-busy="true">
      <span class="yp-skeleton mb-3" style="width: 40%; height: 16px" />
      <span class="yp-skeleton mb-4" style="width: 60%; height: 36px" />
      <div class="yp-skeleton hd-skeleton-media" />
    </div>

    <!-- 錯誤狀態 -->
    <div v-else-if="fetchError" class="yp-card yp-empty yp-empty--error">
      <div class="yp-empty__icon"><Icon name="ri:error-warning-line" /></div>
      <p class="yp-empty__title">載入失敗</p>
      <p class="yp-empty__text">
        {{ fetchError.statusMessage || fetchError.message || '請稍後再試一次。' }}
      </p>
      <button type="button" class="btn btn-primary" @click="refresh">重新載入</button>
    </div>

    <!-- 找不到民宿 -->
    <div v-else-if="!bnb" class="yp-card yp-empty">
      <div class="yp-empty__icon"><Icon name="ri:hotel-line" /></div>
      <p class="yp-empty__title">找不到民宿</p>
      <p class="yp-empty__text">您查看的民宿可能已下架或不存在</p>
      <NuxtLink to="/homestay-list" class="btn btn-primary">回到列表</NuxtLink>
    </div>

    <!-- 民宿詳情 -->
    <template v-else>
      <nav class="yp-breadcrumb" aria-label="麵包屑">
        <NuxtLink to="/">首頁</NuxtLink>
        <NuxtLink to="/homestay-list">民宿</NuxtLink>
        <span>{{ bnb.name }}</span>
      </nav>

      <header class="hd-head">
        <span v-if="bnb.area" class="yp-page-head__eyebrow">{{ bnb.area }}</span>
        <h1 class="yp-page-head__title">{{ bnb.name }}</h1>
        <p v-if="bnb.address" class="hd-head__addr">
          <Icon name="ri:map-pin-line" />{{ bnb.area }}{{ bnb.area ? ' - ' : '' }}{{ bnb.address }}
        </p>
      </header>

      <div class="yp-detail">
        <!-- 左側主內容 -->
        <div class="hd-main">
          <!-- 圖片 -->
          <section
            v-if="bnb.image_urls && bnb.image_urls.length > 0"
            class="hd-gallery"
            aria-label="民宿圖片"
          >
            <div class="hd-gallery__main">
              <img
                :src="bnb.image_urls[currentMainImageIndex]"
                :alt="`${bnb.name} - 主圖`"
                class="hd-gallery__img"
                fetchpriority="high"
                decoding="async"
                @click="openLightbox(currentMainImageIndex)"
                @error="handleImgError"
              />

              <button
                v-if="bnb.image_urls.length > 1"
                type="button"
                class="hd-gallery__nav hd-gallery__nav--prev"
                aria-label="上一張"
                @click="prevMainImage"
              >
                <Icon name="ri:arrow-left-s-line" />
              </button>
              <button
                v-if="bnb.image_urls.length > 1"
                type="button"
                class="hd-gallery__nav hd-gallery__nav--next"
                aria-label="下一張"
                @click="nextMainImage"
              >
                <Icon name="ri:arrow-right-s-line" />
              </button>

              <div class="hd-gallery__bar">
                <span class="hd-gallery__count yp-num">
                  <Icon name="ri:image-line" />{{ currentMainImageIndex + 1 }} /
                  {{ bnb.image_urls.length }}
                </span>
                <button
                  type="button"
                  class="hd-gallery__zoom"
                  @click="openLightbox(currentMainImageIndex)"
                >
                  <Icon name="ri:fullscreen-line" />檢視大圖
                </button>
              </div>
            </div>

            <div v-if="bnb.image_urls.length > 1" class="hd-thumbs">
              <button
                v-if="showThumbnailNav.prev"
                type="button"
                class="hd-thumbs__nav"
                aria-label="往前"
                @click="scrollThumbnails('prev')"
              >
                <Icon name="ri:arrow-left-s-line" />
              </button>
              <div class="hd-thumbs__list">
                <button
                  v-for="(imageUrl, index) in bnb.image_urls"
                  :key="index"
                  type="button"
                  class="hd-thumbs__item"
                  :class="{ 'is-active': index === currentMainImageIndex }"
                  :aria-label="`檢視第 ${index + 1} 張`"
                  :aria-current="index === currentMainImageIndex ? 'true' : undefined"
                  @click="setMainImage(index)"
                >
                  <img
                    :src="imageUrl"
                    :alt="`${bnb.name} - 縮圖 ${index + 1}`"
                    loading="lazy"
                    decoding="async"
                    @error="handleImgError"
                  />
                </button>
              </div>
              <button
                v-if="showThumbnailNav.next"
                type="button"
                class="hd-thumbs__nav"
                aria-label="往後"
                @click="scrollThumbnails('next')"
              >
                <Icon name="ri:arrow-right-s-line" />
              </button>
            </div>
          </section>

          <!-- 沒有圖片 -->
          <div v-else class="hd-noimage">
            <Icon name="ri:image-line" />
            <p>暫無圖片</p>
          </div>

          <!-- 民宿介紹 -->
          <section v-if="bnb.description" class="yp-card hd-section">
            <div class="yp-card__head">
              <h2 class="yp-card__head-title">民宿介紹</h2>
            </div>
            <div class="yp-card__section">
              <p class="yp-prose hd-desc">{{ bnb.description }}</p>
            </div>
          </section>

          <!-- 主題特色 -->
          <section class="yp-card hd-section">
            <div class="yp-card__head">
              <h2 class="yp-card__head-title">主題特色</h2>
            </div>
            <div class="yp-card__section">
              <div
                v-if="
                  bnb.features &&
                  bnb.features.themeFeatures &&
                  bnb.features.themeFeatures.length > 0
                "
                class="yp-tags hd-tags"
              >
                <span
                  v-for="(feature, index) in bnb.features.themeFeatures"
                  :key="index"
                  class="yp-tag yp-tag--primary"
                >
                  {{ feature }}
                </span>
              </div>
              <p v-else class="hd-nodata">暫無主題特色資訊</p>
            </div>
          </section>

          <!-- 服務設施 -->
          <section class="yp-card hd-section">
            <div class="yp-card__head">
              <h2 class="yp-card__head-title">服務設施</h2>
            </div>
            <div class="yp-card__section">
              <div
                v-if="
                  bnb.features &&
                  bnb.features.serviceAmenities &&
                  bnb.features.serviceAmenities.length > 0
                "
                class="yp-tags hd-tags"
              >
                <span
                  v-for="(service, index) in bnb.features.serviceAmenities"
                  :key="index"
                  class="yp-tag"
                >
                  {{ service }}
                </span>
              </div>
              <p v-else class="hd-nodata">暫無服務設施資訊</p>
            </div>
          </section>

          <!-- 位置資訊 -->
          <section class="yp-card hd-section">
            <div class="yp-card__head">
              <h2 class="yp-card__head-title">位置資訊</h2>
            </div>
            <div class="yp-card__section">
              <ul class="yp-info-list">
                <li>
                  <span class="yp-info-list__label">地址</span>
                  <span class="yp-info-list__value">
                    <template v-if="bnb.area && bnb.address"
                      >{{ bnb.area }} - {{ bnb.address }}</template
                    >
                    <template v-else-if="bnb.area">{{ bnb.area }}</template>
                    <template v-else-if="bnb.address">{{ bnb.address }}</template>
                    <template v-else>暫無地址資訊</template>
                  </span>
                </li>
              </ul>
              <a
                v-if="bnb.name || bnb.address"
                :href="getGoogleMapsUrl(bnb.name, bnb.address)"
                target="_blank"
                rel="noopener"
                class="btn btn-soft btn-icon mt-3"
              >
                <Icon name="ri:map-pin-2-line" />開啟 Google 地圖
              </a>
            </div>
          </section>
        </div>

        <!-- 右側欄：價格 / 人數 / 聯絡 -->
        <aside class="yp-detail__aside hd-aside">
          <div class="yp-card">
            <div class="yp-card__head">
              <h2 class="yp-card__head-title">價格資訊</h2>
            </div>
            <div class="yp-card__section">
              <ul
                v-if="
                  bnb.prices &&
                  (bnb.prices.weekday ||
                    bnb.prices.weekend ||
                    bnb.prices.fullRentWeekday ||
                    bnb.prices.fullRentWeekend)
                "
                class="yp-info-list hd-prices"
              >
                <li v-if="bnb.prices.weekday">
                  <span class="yp-info-list__label">平日價格</span>
                  <span class="yp-info-list__value hd-price"
                    >{{ bnb.prices.weekday }}<small>起</small></span
                  >
                </li>
                <li v-if="bnb.prices.weekend">
                  <span class="yp-info-list__label">假日價格</span>
                  <span class="yp-info-list__value hd-price"
                    >{{ bnb.prices.weekend }}<small>起</small></span
                  >
                </li>
                <li v-if="bnb.prices.fullRentWeekday">
                  <span class="yp-info-list__label">平日包棟</span>
                  <span class="yp-info-list__value hd-price"
                    >{{ bnb.prices.fullRentWeekday }}<small>起</small></span
                  >
                </li>
                <li v-if="bnb.prices.fullRentWeekend">
                  <span class="yp-info-list__label">假日包棟</span>
                  <span class="yp-info-list__value hd-price"
                    >{{ bnb.prices.fullRentWeekend }}<small>起</small></span
                  >
                </li>
              </ul>
              <p v-else class="hd-nodata">暫無價格資訊</p>

              <div class="hd-capacity">
                <Icon name="ri:group-line" class="hd-capacity__icon" />
                <div v-if="bnb.min_guests || bnb.max_guests">
                  <span class="hd-capacity__value yp-num">
                    <template v-if="bnb.min_guests && bnb.max_guests"
                      >{{ bnb.min_guests }} - {{ bnb.max_guests }} 人</template
                    >
                    <template v-else-if="bnb.max_guests">最多 {{ bnb.max_guests }} 人</template>
                    <template v-else-if="bnb.min_guests">最少 {{ bnb.min_guests }} 人</template>
                  </span>
                  <span class="hd-capacity__hint">適合的住宿人數範圍</span>
                </div>
                <span v-else class="hd-nodata">暫無人數資訊</span>
              </div>
            </div>
          </div>

          <div class="yp-card hd-contact">
            <div class="yp-card__head">
              <h2 class="yp-card__head-title">聯絡資訊</h2>
            </div>
            <div class="yp-card__section">
              <div
                v-if="
                  bnb.contact &&
                  (bnb.contact.phone ||
                    bnb.contact.line ||
                    bnb.contact.website ||
                    bnb.contact.instagram ||
                    bnb.contact.facebook)
                "
                class="hd-contact__list"
              >
                <a
                  v-if="bnb.contact.phone"
                  :href="`tel:${bnb.contact.phone}`"
                  class="btn btn-primary btn-icon"
                >
                  <Icon name="ri:phone-line" />撥打 {{ bnb.contact.phone }}
                </a>
                <a
                  v-if="bnb.contact.line"
                  :href="bnb.contact.line"
                  target="_blank"
                  rel="noopener"
                  class="btn btn-line btn-icon"
                >
                  <Icon name="ri:line-fill" />LINE 詢問
                </a>
                <a
                  v-if="bnb.contact.website"
                  :href="bnb.contact.website"
                  target="_blank"
                  rel="noopener"
                  class="btn btn-outline-primary btn-icon"
                >
                  <Icon name="ri:global-line" />前往官網
                </a>
                <div
                  v-if="bnb.contact.instagram || bnb.contact.facebook"
                  class="hd-contact__social"
                >
                  <a
                    v-if="bnb.contact.instagram"
                    :href="bnb.contact.instagram"
                    target="_blank"
                    rel="noopener"
                    class="btn btn-soft btn-icon"
                  >
                    <Icon name="ri:instagram-line" />Instagram
                  </a>
                  <a
                    v-if="bnb.contact.facebook"
                    :href="bnb.contact.facebook"
                    target="_blank"
                    rel="noopener"
                    class="btn btn-soft btn-icon"
                  >
                    <Icon name="ri:facebook-circle-line" />Facebook
                  </a>
                </div>
              </div>
              <p v-else class="hd-nodata">暫無聯絡資訊</p>
            </div>
          </div>
        </aside>
      </div>

      <!-- 業者登入 -->
      <div class="hd-owner">
        <span class="hd-owner__text">{{ bnb.name }} 的業者？</span>
        <NuxtLink to="/homestay-login" class="btn btn-ghost btn-icon">
          <Icon name="ri:store-2-line" />業者登入
        </NuxtLink>
      </div>

      <!-- 手機版底部行動列（位於 Tab Bar 上方） -->
      <div v-if="bnb.contact && (bnb.contact.phone || bnb.contact.line)" class="hd-cta d-lg-none">
        <div class="hd-cta__price">
          <template v-if="bnb.prices && (bnb.prices.weekday || bnb.prices.fullRentWeekday)">
            <small>{{ bnb.prices.weekday ? '平日' : '平日包棟' }}</small>
            <b class="yp-num">{{ bnb.prices.weekday || bnb.prices.fullRentWeekday }}</b>
            <small>起</small>
          </template>
          <small v-else>歡迎來電或 LINE 詢問</small>
        </div>
        <a
          v-if="bnb.contact.line"
          :href="bnb.contact.line"
          target="_blank"
          rel="noopener"
          class="btn btn-line btn-icon"
        >
          <Icon name="ri:line-fill" />LINE
        </a>
        <a
          v-if="bnb.contact.phone"
          :href="`tel:${bnb.contact.phone}`"
          class="btn btn-primary btn-pill btn-icon"
        >
          <Icon name="ri:phone-line" />電話
        </a>
      </div>
    </template>

    <!-- EasyLightbox 組件 -->
    <VueEasyLightbox
      v-if="lightboxVisible"
      :imgs="lightboxImages"
      :index="lightboxIndex"
      :visible="lightboxVisible"
      @hide="lightboxVisible = false"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRoute, useFetch, createError, useSeoMeta, useHead } from 'nuxt/app'

import { buildHomestaySeo, serializeJsonLd } from '~/utils/homestay-seo.js'

// Recreate page state and metadata when navigating between homestays.
definePageMeta({ key: (route) => route.params.id })

// 直接從URL獲取ID參數
const route = useRoute()
const bnbId = route.params.id

// 使用 useFetch 進行 SSR 資料獲取
const {
  data: bnbData,
  error: fetchError,
  refresh
} = await useFetch('/api/fetchBnbDetail', {
  query: { id: bnbId }
})

// 處理錯誤
if (fetchError.value || !bnbData.value?.bnb) {
  throw createError({
    statusCode: fetchError.value?.statusCode === 404 ? 404 : 503,
    statusMessage: fetchError.value?.statusCode === 404 ? 'Page Not Found' : 'Service Unavailable',
    fatal: true
  })
}

// 綁定資料
const bnb = computed(() => bnbData.value?.bnb)
const loading = ref(false) // SSR 完成後就不需要 loading 狀態了，或者可以保留給切換圖片等操作

// Metadata and structured data use the same public fields rendered on this page.
const seo = computed(() => buildHomestaySeo(bnb.value))
useSeoMeta({
  title: () => seo.value.title,
  description: () => seo.value.description,
  ogTitle: () => seo.value.title,
  ogDescription: () => seo.value.description,
  ogImage: () => seo.value.image,
  ogUrl: () => seo.value.url,
  ogType: 'website',
  twitterCard: 'summary_large_image',
  twitterTitle: () => seo.value.title,
  twitterDescription: () => seo.value.description,
  twitterImage: () => seo.value.image,
  twitterUrl: () => seo.value.url,
  robots: 'index, follow, max-image-preview:large'
})
useHead(() => ({
  titleTemplate: null,
  link: [
    { rel: 'canonical', href: seo.value.url },
    { rel: 'llms-txt', href: `${seo.value.url}/llms.txt` }
  ],
  script: [
    {
      key: 'homestay-schema',
      type: 'application/ld+json',
      innerHTML: serializeJsonLd(seo.value.schema)
    }
  ]
}))

// 圖片畫廊相關狀態
const currentMainImageIndex = ref(0)
const lightboxVisible = ref(false)
const lightboxIndex = ref(0)

// 圖片載入失敗時的替代圖檔
const PLACEHOLDER_IMG = '/images/bnb-placeholder.svg'
const handleImgError = (event) => {
  if (event.target.src.includes(PLACEHOLDER_IMG)) return
  event.target.src = PLACEHOLDER_IMG
}

// 縮圖導航狀態
const showThumbnailNav = ref({
  prev: false,
  next: false
})

// 計算 lightbox 圖片陣列
const lightboxImages = computed(() => {
  if (!bnb.value?.image_urls) return []
  return bnb.value.image_urls.map((url) => ({ src: url }))
})

// 圖片導航函數
const nextMainImage = () => {
  if (bnb.value?.image_urls && bnb.value.image_urls.length > 1) {
    currentMainImageIndex.value = (currentMainImageIndex.value + 1) % bnb.value.image_urls.length
  }
}

const prevMainImage = () => {
  if (bnb.value?.image_urls && bnb.value.image_urls.length > 1) {
    currentMainImageIndex.value =
      currentMainImageIndex.value === 0
        ? bnb.value.image_urls.length - 1
        : currentMainImageIndex.value - 1
  }
}

const setMainImage = (index) => {
  currentMainImageIndex.value = index
}

// Lightbox 控制函數
const openLightbox = (index) => {
  lightboxIndex.value = index
  lightboxVisible.value = true
}

// 縮圖滾動控制
const scrollThumbnails = (direction) => {
  // 這裡可以實現縮圖滾動邏輯
  // 暫時保持簡單實現
  if (direction === 'next') {
    nextMainImage()
  } else {
    prevMainImage()
  }
}

// 鍵盤導航支援
const handleKeydown = (event) => {
  if (!bnb.value?.image_urls) return

  if (event.key === 'ArrowLeft') {
    prevMainImage()
  } else if (event.key === 'ArrowRight') {
    nextMainImage()
  } else if (event.key === 'Escape') {
    lightboxVisible.value = false
  }
}

onMounted(() => {
  // 添加鍵盤事件監聽器
  window.addEventListener('keydown', handleKeydown)
})

// 組件卸載時清理事件監聽器
onUnmounted(() => {
  window.removeEventListener('keydown', handleKeydown)
})

// Google Maps URL 生成函數
const getGoogleMapsUrl = (name, address) => {
  const query = [name, address].filter(Boolean).join(' ')
  return `https://www.google.com/maps/?q=${encodeURIComponent(query)}`
}

// 調試信息
console.log('路由參數:', route.params)
console.log('民宿ID:', bnbId)
</script>

<style lang="scss" scoped>
.hd {
  // 手機：為底部行動列預留空間（Tab Bar 的留白由 body.has-tabbar 處理）
  @media (max-width: #{$yp-bp-lg - 1px}) {
    padding-bottom: 96px;
  }
}

.hd-skeleton-media {
  aspect-ratio: 16 / 9;
  border-radius: $yp-radius-lg;
}

.hd-head {
  margin-bottom: 20px;

  &__addr {
    display: flex;
    align-items: center;
    gap: 4px;
    margin: 8px 0 0;
    color: $yp-muted;
  }
}

.hd-main {
  display: flex;
  flex-direction: column;
  gap: 16px;
  min-width: 0;
}

// ───── 圖片 ─────
.hd-gallery {
  display: flex;
  flex-direction: column;
  gap: 10px;

  &__main {
    position: relative;
    aspect-ratio: 4 / 3;
    border-radius: $yp-radius-lg;
    overflow: hidden;
    background: $yp-surface-2;
    box-shadow: $yp-shadow;

    @media (min-width: $yp-bp-md) {
      aspect-ratio: 16 / 9;
    }
  }

  &__img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
    cursor: zoom-in;
  }

  &__nav {
    position: absolute;
    top: 50%;
    transform: translateY(-50%);
    display: grid;
    place-items: center;
    width: 40px;
    height: 40px;
    padding: 0;
    border: 0;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.92);
    color: $yp-ink;
    font-size: 1.5rem;
    box-shadow: $yp-shadow-sm;

    &:hover {
      background: #fff;
    }

    &--prev {
      left: 12px;
    }

    &--next {
      right: 12px;
    }
  }

  &__bar {
    position: absolute;
    left: 0;
    right: 0;
    bottom: 0;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 28px 12px 12px;
    background: linear-gradient(transparent, rgba(19, 48, 58, 0.6));
    color: #fff;
    pointer-events: none;
  }

  &__count,
  &__zoom {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    font-size: 0.8125rem;
  }

  &__zoom {
    pointer-events: auto;
    border: 0;
    padding: 6px 12px;
    border-radius: $yp-radius-pill;
    background: rgba(255, 255, 255, 0.22);
    color: #fff;
    backdrop-filter: blur(4px);

    &:hover {
      background: rgba(255, 255, 255, 0.35);
    }
  }
}

.hd-thumbs {
  display: flex;
  align-items: center;
  gap: 6px;

  &__list {
    display: flex;
    flex: 1;
    gap: 8px;
    min-width: 0;
    padding: 3px;
    overflow-x: auto;
    scrollbar-width: thin;
  }

  &__item {
    flex: 0 0 76px;
    height: 56px;
    padding: 0;
    border: 2px solid transparent;
    border-radius: $yp-radius-sm;
    overflow: hidden;
    background: $yp-surface-2;
    opacity: 0.75;
    transition:
      opacity 0.15s ease,
      border-color 0.15s ease;

    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      display: block;
    }

    &:hover {
      opacity: 1;
    }

    &.is-active {
      border-color: $yp-primary;
      opacity: 1;
    }
  }

  &__nav {
    display: grid;
    place-items: center;
    flex: none;
    width: 32px;
    height: 32px;
    padding: 0;
    border: 1px solid $yp-line;
    border-radius: 50%;
    background: #fff;
    color: $yp-ink;
  }
}

.hd-noimage {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  aspect-ratio: 16 / 9;
  border-radius: $yp-radius-lg;
  background: $yp-surface-2;
  color: $yp-subtle;
  font-size: 2.5rem;

  p {
    margin: 0;
    font-size: 0.9375rem;
  }
}

// ───── 內容區 ─────
.hd-desc {
  margin: 0;
  white-space: pre-line;
}

.hd-tags {
  gap: 8px;

  .yp-tag {
    padding: 5px 12px;
    font-size: 0.8125rem;
  }
}

.hd-nodata {
  margin: 0;
  color: $yp-subtle;
  font-size: 0.9375rem;
}

// ───── 側欄 ─────
.hd-aside {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.hd-prices li {
  align-items: baseline;
}

.hd-price {
  font-family: $yp-font-num;
  font-size: 1.0625rem;
  font-weight: 600;
  color: $yp-primary-ink;
  text-align: right;

  small {
    margin-left: 3px;
    font-family: $yp-font-sans;
    font-size: 0.75rem;
    font-weight: 400;
    color: $yp-muted;
  }
}

.hd-capacity {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: 14px;
  padding: 12px 14px;
  border-radius: $yp-radius;
  background: $yp-primary-soft;

  &__icon {
    flex: none;
    font-size: 1.5rem;
    color: $yp-primary-ink;
  }

  &__value {
    display: block;
    font-size: 1.0625rem;
    font-weight: 600;
    color: $yp-primary-ink;
  }

  &__hint {
    display: block;
    font-size: 0.75rem;
    color: $yp-muted;
  }
}

.hd-contact {
  &__list {
    display: flex;
    flex-direction: column;
    gap: 8px;

    .btn {
      width: 100%;
      min-height: 44px;
    }
  }

  &__social {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
    gap: 8px;
  }
}

// ───── 業者登入 ─────
.hd-owner {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: center;
  gap: 4px 8px;
  margin-top: 32px;
  padding: 16px;
  border-radius: $yp-radius-lg;
  background: $yp-surface-2;

  &__text {
    font-size: 0.875rem;
    color: $yp-muted;
  }
}

// ───── 手機底部行動列 ─────
.hd-cta {
  position: fixed;
  left: 0;
  right: 0;
  bottom: calc(var(--yp-tabbar-h) + env(safe-area-inset-bottom));
  z-index: 1005;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  background: rgba(255, 255, 255, 0.96);
  backdrop-filter: blur(8px);
  border-top: 1px solid $yp-line;
  box-shadow: 0 -6px 16px -10px rgba(19, 48, 58, 0.25);

  &__price {
    flex: 1;
    min-width: 0;
    line-height: 1.3;

    small {
      font-size: 0.75rem;
      color: $yp-muted;
    }

    b {
      margin: 0 3px;
      font-size: 1.0625rem;
      font-weight: 600;
      color: $yp-primary-ink;
    }
  }

  .btn {
    flex: none;
    min-height: 42px;
  }
}
</style>
