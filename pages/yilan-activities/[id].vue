<template>
  <div class="yp-page act-detail">
    <!-- 載入狀態 -->
    <div v-if="loading" aria-busy="true">
      <span class="yp-skeleton mb-3" style="width: 220px; height: 16px" />
      <span class="yp-skeleton mb-2" style="width: 70%; height: 34px" />
      <span class="yp-skeleton mb-4" style="width: 45%; height: 18px" />
      <div class="yp-detail">
        <div>
          <span class="yp-skeleton act-detail__skeleton-media" />
        </div>
        <div class="yp-card act-detail__skeleton-aside">
          <span class="yp-skeleton mb-3" style="width: 40%; height: 20px" />
          <span class="yp-skeleton mb-2" style="height: 16px" />
          <span class="yp-skeleton mb-2" style="height: 16px" />
          <span class="yp-skeleton" style="width: 70%; height: 16px" />
        </div>
      </div>
    </div>

    <!-- 找不到活動 -->
    <div v-else-if="!activity" class="yp-card yp-empty">
      <div class="yp-empty__icon"><Icon name="ri:calendar-close-line" /></div>
      <h1 class="yp-empty__title">找不到此活動</h1>
      <p class="yp-empty__text">您查看的活動可能已結束或不存在</p>
      <NuxtLink to="/yilan-activities" class="btn btn-primary">返回活動列表</NuxtLink>
    </div>

    <!-- 活動詳情 -->
    <template v-else>
      <nav class="yp-breadcrumb" aria-label="導覽">
        <NuxtLink to="/">首頁</NuxtLink>
        <NuxtLink to="/yilan-activities">宜蘭活動總匯</NuxtLink>
        <span class="act-detail__crumb-current yp-clamp-1">{{ activity.title }}</span>
      </nav>

      <header class="act-detail__head">
        <div class="yp-tags mb-2">
          <span v-if="activity.activity_type" class="yp-tag yp-tag--primary">{{
            activity.activity_type
          }}</span>
          <span v-if="activity.is_multi_day" class="yp-tag yp-tag--warning">多日活動</span>
        </div>
        <h1 class="yp-page-head__title">{{ activity.title }}</h1>
        <ul class="act-detail__summary">
          <li>
            <Icon name="ri:calendar-event-line" />
            <span>{{ formatDate(activity.event_date) }}</span>
          </li>
          <li v-if="activity.event_time">
            <Icon name="ri:time-line" />
            <span>{{ activity.event_time }}</span>
          </li>
          <li v-if="activity.location">
            <Icon name="ri:map-pin-2-line" />
            <span>{{ activity.location }}</span>
          </li>
        </ul>
      </header>

      <div class="yp-detail">
        <!-- 左：圖片 + 介紹 -->
        <div class="act-detail__main">
          <!-- 活動圖片 -->
          <div v-if="activity.images && activity.images.length > 0" class="act-gallery">
            <div class="act-gallery__stage">
              <img
                :src="activity.images[currentMainImageIndex]"
                :alt="activity.title + ' - 主圖'"
                class="act-gallery__img"
                @click="openLightbox(currentMainImageIndex)"
              />

              <button
                v-if="activity.images.length > 1"
                type="button"
                class="act-gallery__nav act-gallery__nav--prev"
                aria-label="上一張"
                @click="prevMainImage"
              >
                <Icon name="ri:arrow-left-s-line" />
              </button>
              <button
                v-if="activity.images.length > 1"
                type="button"
                class="act-gallery__nav act-gallery__nav--next"
                aria-label="下一張"
                @click="nextMainImage"
              >
                <Icon name="ri:arrow-right-s-line" />
              </button>

              <div class="act-gallery__bar">
                <span class="act-gallery__count">
                  <Icon name="ri:image-line" />
                  {{ currentMainImageIndex + 1 }} / {{ activity.images.length }}
                </span>
                <button
                  type="button"
                  class="act-gallery__zoom"
                  @click="openLightbox(currentMainImageIndex)"
                >
                  <Icon name="ri:fullscreen-line" />檢視大圖
                </button>
              </div>
            </div>

            <!-- 縮略圖列表 -->
            <div v-if="activity.images.length > 1" class="act-gallery__thumbs">
              <button
                v-for="(image, index) in activity.images.slice(0, 5)"
                :key="index"
                type="button"
                class="act-gallery__thumb"
                :class="{ 'is-active': currentMainImageIndex === index }"
                :aria-label="'顯示圖片 ' + (index + 1)"
                @click="setMainImage(index)"
              >
                <img :src="image" :alt="'活動圖片 ' + (index + 1)" />
              </button>
              <button
                v-if="activity.images.length > 5"
                type="button"
                class="act-gallery__thumb act-gallery__thumb--more"
                @click="openLightbox(5)"
              >
                +{{ activity.images.length - 5 }}
              </button>
            </div>
          </div>

          <!-- 沒有圖片的佔位符 -->
          <div v-else class="act-gallery__empty">
            <Icon name="ri:image-line" />
            <span>暫無活動圖片</span>
          </div>

          <!-- 活動描述 -->
          <section v-if="activity.description" class="yp-card act-detail__desc">
            <h2 class="yp-section-head__title mb-3">活動介紹</h2>
            <div class="yp-prose" v-html="formatDescription(activity.description)"></div>
          </section>
        </div>

        <!-- 右：資訊側欄 -->
        <aside class="yp-detail__aside act-detail__aside">
          <!-- 基本資訊 -->
          <section class="yp-card">
            <div class="yp-card__head">
              <h2 class="yp-card__head-title">基本資訊</h2>
              <span class="yp-status yp-status--approved">已審核通過</span>
            </div>
            <div class="yp-card__section">
              <ul class="yp-info-list">
                <li>
                  <span class="yp-info-list__label">活動日期</span>
                  <span class="yp-info-list__value">{{ formatDate(activity.event_date) }}</span>
                </li>
                <li v-if="activity.event_time">
                  <span class="yp-info-list__label">開始時間</span>
                  <span class="yp-info-list__value">{{ activity.event_time }}</span>
                </li>
                <li v-if="activity.end_date && activity.end_date !== activity.event_date">
                  <span class="yp-info-list__label">結束日期</span>
                  <span class="yp-info-list__value">{{ formatDate(activity.end_date) }}</span>
                </li>
                <li
                  v-if="
                    activity.end_time &&
                    (activity.end_time !== activity.event_time || activity.end_date)
                  "
                >
                  <span class="yp-info-list__label">結束時間</span>
                  <span class="yp-info-list__value">{{ activity.end_time }}</span>
                </li>
                <li v-if="activity.is_multi_day">
                  <span class="yp-info-list__label">活動類型</span>
                  <span class="yp-info-list__value"
                    ><span class="yp-tag yp-tag--warning">多日活動</span></span
                  >
                </li>
                <li v-if="activity.location">
                  <span class="yp-info-list__label">活動地點</span>
                  <span class="yp-info-list__value">{{ activity.location }}</span>
                </li>
              </ul>
            </div>
          </section>

          <!-- 主辦單位 / 來源 -->
          <section class="yp-card">
            <div class="yp-card__head">
              <h2 class="yp-card__head-title">
                {{ activity.organizer_name ? '主辦單位與來源' : '活動來源' }}
              </h2>
            </div>
            <div class="yp-card__section">
              <ul class="yp-info-list">
                <li v-if="activity.organizer_name">
                  <span class="yp-info-list__label">單位名稱</span>
                  <span class="yp-info-list__value">{{ activity.organizer_name }}</span>
                </li>
                <li
                  v-if="
                    activity.organizer_email &&
                    activity.organizer_email !== activity.submitter_email
                  "
                >
                  <span class="yp-info-list__label">聯絡信箱</span>
                  <span class="yp-info-list__value">
                    <a :href="'mailto:' + activity.organizer_email">{{
                      activity.organizer_email
                    }}</a>
                  </span>
                </li>
                <li v-if="activity.organizer_phone">
                  <span class="yp-info-list__label">聯絡電話</span>
                  <span class="yp-info-list__value">
                    <a :href="'tel:' + activity.organizer_phone">{{ activity.organizer_phone }}</a>
                  </span>
                </li>
                <li v-if="activity.source_url">
                  <span class="yp-info-list__label">資料來源</span>
                  <span class="yp-info-list__value">
                    <a :href="activity.source_url" target="_blank" rel="noopener noreferrer"
                      >{{ activity.source_name }}
                      <Icon name="ri:external-link-line" />
                    </a>
                    <small v-if="activity.last_synced_at" class="d-block text-muted"
                      >更新於
                      {{
                        formatTaipeiDate(activity.last_synced_at)
                      }}，異動以主辦單位公告為準。</small
                    >
                  </span>
                </li>
                <li v-if="activity.images?.length && activity.image_source_url">
                  <span class="yp-info-list__label">圖片來源</span>
                  <span class="yp-info-list__value">
                    <a :href="activity.image_source_url" target="_blank" rel="noopener noreferrer"
                      >{{ activity.image_source_name }}
                      <Icon name="ri:external-link-line" />
                    </a>
                  </span>
                </li>
                <li v-if="activity.contact_info">
                  <span class="yp-info-list__label">其他聯絡資訊</span>
                  <span class="yp-info-list__value">{{ activity.contact_info }}</span>
                </li>
              </ul>
              <a
                v-if="activity.source_url"
                :href="activity.source_url"
                target="_blank"
                rel="noopener noreferrer"
                class="btn btn-outline-primary btn-icon w-100 mt-3"
              >
                <Icon name="ri:external-link-line" />前往活動來源
              </a>
            </div>
          </section>

          <!-- 分享 -->
          <section class="yp-card">
            <div class="yp-card__head">
              <h2 class="yp-card__head-title">分享活動</h2>
            </div>
            <div class="yp-card__section act-detail__share">
              <button type="button" class="btn btn-line btn-icon" @click="shareOnLine">
                <Icon name="ri:line-fill" />LINE
              </button>
              <button type="button" class="btn btn-soft btn-icon btn-pill" @click="shareOnFacebook">
                <Icon name="ri:facebook-circle-fill" />Facebook
              </button>
              <button type="button" class="btn btn-ghost btn-icon btn-pill" @click="copyLink">
                <Icon name="ri:links-line" />複製連結
              </button>
            </div>
          </section>

          <NuxtLink to="/yilan-activities" class="btn btn-ghost btn-icon w-100">
            <Icon name="ri:arrow-left-line" />返回活動列表
          </NuxtLink>
        </aside>
      </div>
    </template>

    <!-- 複製連結提示 -->
    <div v-if="toastMessage" class="yp-toast" role="status">{{ toastMessage }}</div>

    <!-- 圖片燈箱 -->
    <div v-if="showLightbox" class="act-lightbox" @click="closeLightbox">
      <div class="act-lightbox__inner" @click.stop>
        <button type="button" class="act-lightbox__close" aria-label="關閉" @click="closeLightbox">
          <Icon name="ri:close-line" />
        </button>

        <!-- 主要圖片 -->
        <div class="act-lightbox__stage">
          <img
            v-if="activity?.images?.[lightboxImageIndex]"
            :src="activity.images[lightboxImageIndex]"
            :alt="activity.title + ' - 圖片 ' + (lightboxImageIndex + 1)"
            class="act-lightbox__img"
            @click.stop
          />
        </div>

        <!-- 導航按鈕 -->
        <button
          v-if="activity?.images?.length > 1"
          type="button"
          class="act-lightbox__nav act-lightbox__nav--prev"
          aria-label="上一張"
          @click="prevLightboxImage"
        >
          <Icon name="ri:arrow-left-s-line" />
        </button>
        <button
          v-if="activity?.images?.length > 1"
          type="button"
          class="act-lightbox__nav act-lightbox__nav--next"
          aria-label="下一張"
          @click="nextLightboxImage"
        >
          <Icon name="ri:arrow-right-s-line" />
        </button>

        <!-- 圖片資訊 -->
        <div class="act-lightbox__info">
          <span class="act-lightbox__counter">
            {{ lightboxImageIndex + 1 }} / {{ activity?.images?.length || 0 }}
          </span>
          <span class="act-lightbox__title yp-clamp-1">{{ activity?.title }}</span>
        </div>

        <!-- 縮略圖導航 -->
        <div v-if="activity?.images?.length > 1" class="act-lightbox__thumbs">
          <button
            v-for="(image, index) in activity.images"
            :key="index"
            type="button"
            class="act-lightbox__thumb"
            :class="{ 'is-active': index === lightboxImageIndex }"
            :aria-label="'顯示圖片 ' + (index + 1)"
            @click="lightboxImageIndex = index"
          >
            <img :src="image" :alt="'縮圖 ' + (index + 1)" />
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { sanitizeRichContent } from '~/utils/rich-content.js'
import { buildActivitySeo } from '~/utils/activity-seo.js'
import { serializeJsonLd } from '~/utils/homestay-seo.js'
import { formatTaipeiDate } from '~/utils/activity-dates.js'

const route = useRoute()
const currentMainImageIndex = ref(0)
const showLightbox = ref(false)
const lightboxImageIndex = ref(0)

// 伺服器端就載入活動，搜尋引擎才拿得到標題、內容與 SEO 標籤
const { data: activityResponse, error: fetchError } = await useFetch(
  `/api/yilan-activities/${route.params.id}`,
  { key: `yilan-activity-${route.params.id}` }
)

// 只顯示已通過審核的活動；找不到時回傳真正的 404
if (fetchError.value || activityResponse.value?.data?.status !== 'approved') {
  const notFound = !fetchError.value || [400, 404].includes(fetchError.value?.statusCode)
  throw createError({
    statusCode: notFound ? 404 : 503,
    statusMessage: notFound ? 'Activity Not Found' : 'Service Unavailable',
    fatal: true
  })
}

const activity = computed(() => activityResponse.value?.data || null)
const loading = ref(false)

const formatDate = (value) => formatTaipeiDate(value, { weekday: true })

const formatDescription = (description) => {
  if (!description) return ''
  return sanitizeRichContent(description.replace(/\n/g, '<br>'))
}

// 圖片相關函數
const prevMainImage = () => {
  if (!activity.value?.images?.length) return
  currentMainImageIndex.value =
    currentMainImageIndex.value === 0
      ? activity.value.images.length - 1
      : currentMainImageIndex.value - 1
}

const nextMainImage = () => {
  if (!activity.value?.images?.length) return
  currentMainImageIndex.value =
    currentMainImageIndex.value === activity.value.images.length - 1
      ? 0
      : currentMainImageIndex.value + 1
}

const setMainImage = (index) => {
  currentMainImageIndex.value = index
}

const openLightbox = (index) => {
  if (activity.value?.images?.length) {
    lightboxImageIndex.value = index
    showLightbox.value = true
    // 防止背景滾動
    document.body.style.overflow = 'hidden'
  }
}

const closeLightbox = () => {
  showLightbox.value = false
  // 恢復背景滾動
  document.body.style.overflow = ''
}

const prevLightboxImage = () => {
  if (!activity.value?.images?.length) return
  lightboxImageIndex.value =
    lightboxImageIndex.value === 0 ? activity.value.images.length - 1 : lightboxImageIndex.value - 1
}

const nextLightboxImage = () => {
  if (!activity.value?.images?.length) return
  lightboxImageIndex.value =
    lightboxImageIndex.value === activity.value.images.length - 1 ? 0 : lightboxImageIndex.value + 1
}

// 鍵盤事件處理
const handleKeydown = (event) => {
  if (!showLightbox.value) return

  switch (event.key) {
    case 'Escape':
      closeLightbox()
      break
    case 'ArrowLeft':
      prevLightboxImage()
      break
    case 'ArrowRight':
      nextLightboxImage()
      break
  }
}

// 分享功能
const shareOnFacebook = () => {
  const url = encodeURIComponent(window.location.href)
  const title = encodeURIComponent(activity.value.title)
  window.open(
    `https://www.facebook.com/sharer/sharer.php?u=${url}&t=${title}`,
    '_blank',
    'width=600,height=400'
  )
}

const shareOnLine = () => {
  const url = encodeURIComponent(window.location.href)
  const text = encodeURIComponent(`${activity.value.title} - 宜蘭活動總匯`)
  window.open(
    `https://social-plugins.line.me/lineit/share?url=${url}&text=${text}`,
    '_blank',
    'width=600,height=400'
  )
}

const toastMessage = ref('')
let toastTimer = null
const showToast = (message) => {
  toastMessage.value = message
  if (toastTimer) clearTimeout(toastTimer)
  toastTimer = setTimeout(() => {
    toastMessage.value = ''
  }, 2200)
}

const copyLink = async () => {
  try {
    if (process.client) {
      await navigator.clipboard.writeText(window.location.href)
      showToast('連結已複製到剪貼簿')
    }
  } catch (error) {
    console.error('Failed to copy link:', error)
    // 備用方案
    if (process.client) {
      const textArea = document.createElement('textarea')
      textArea.value = window.location.href
      document.body.appendChild(textArea)
      textArea.select()
      document.execCommand('copy')
      document.body.removeChild(textArea)
      showToast('連結已複製到剪貼簿')
    }
  }
}

onMounted(() => {
  // 添加鍵盤事件監聽
  document.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  // 清理事件監聽和樣式
  document.removeEventListener('keydown', handleKeydown)
  document.body.style.overflow = ''
  if (toastTimer) clearTimeout(toastTimer)
})

// 頁面 SEO：標題、描述、canonical 與 Event 結構化資料都來自頁面上顯示的活動資料
const seo = computed(() => buildActivitySeo(activity.value))
useSeoMeta({
  title: () => seo.value.title,
  description: () => seo.value.description,
  ogTitle: () => seo.value.title,
  ogDescription: () => seo.value.description,
  ogImage: () => seo.value.image,
  ogUrl: () => seo.value.url,
  ogType: 'article',
  twitterCard: 'summary_large_image',
  twitterTitle: () => seo.value.title,
  twitterDescription: () => seo.value.description,
  twitterImage: () => seo.value.image,
  twitterUrl: () => seo.value.url
})
useHead(() => ({
  link: [{ rel: 'canonical', href: seo.value.url }],
  script: [
    {
      key: 'activity-schema',
      type: 'application/ld+json',
      innerHTML: serializeJsonLd(seo.value.schema)
    }
  ]
}))
</script>

<style scoped lang="scss">
.act-detail {
  &__skeleton-media {
    width: 100%;
    aspect-ratio: 16 / 9;
    border-radius: $yp-radius-lg;
  }

  &__skeleton-aside {
    padding: 20px;
  }

  &__crumb-current {
    min-width: 0;
    max-width: 100%;
  }

  &__head {
    margin-bottom: 20px;
  }

  &__summary {
    list-style: none;
    margin: 10px 0 0;
    padding: 0;
    display: flex;
    flex-wrap: wrap;
    gap: 6px 20px;
    color: $yp-muted;

    li {
      display: inline-flex;
      align-items: flex-start;
      gap: 6px;
    }

    .iconify,
    svg {
      flex: none;
      margin-top: 4px;
      color: $yp-primary;
    }
  }

  &__main {
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  &__desc {
    padding: 20px;

    @media (min-width: $yp-bp-md) {
      padding: 28px;
    }
  }

  &__aside {
    display: flex;
    flex-direction: column;
    gap: 16px;
    min-width: 0;
  }

  &__share {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;

    .btn {
      flex: 1 1 auto;
    }
  }
}

// ───── 主圖 + 縮圖 ─────
.act-gallery {
  &__stage {
    position: relative;
    aspect-ratio: 16 / 10;
    border-radius: $yp-radius-lg;
    overflow: hidden;
    background: $yp-surface-2;
    box-shadow: $yp-shadow;
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
    width: 40px;
    height: 40px;
    display: grid;
    place-items: center;
    border: 0;
    border-radius: 50%;
    background: rgba(#fff, 0.92);
    color: $yp-ink;
    font-size: 24px;
    box-shadow: $yp-shadow-sm;

    &:hover {
      background: #fff;
      color: $yp-primary-ink;
    }

    &--prev {
      left: 10px;
    }

    &--next {
      right: 10px;
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
    gap: 8px;
    padding: 24px 12px 10px;
    background: linear-gradient(transparent, rgba($yp-ink, 0.55));
    color: #fff;
    font-size: 0.8125rem;
    pointer-events: none;
  }

  &__count,
  &__zoom {
    display: inline-flex;
    align-items: center;
    gap: 4px;
  }

  &__zoom {
    pointer-events: auto;
    border: 0;
    background: rgba(#fff, 0.2);
    color: #fff;
    padding: 4px 10px;
    border-radius: $yp-radius-pill;
    backdrop-filter: blur(4px);

    &:hover {
      background: rgba(#fff, 0.35);
    }
  }

  &__thumbs {
    display: flex;
    gap: 8px;
    margin-top: 10px;
    overflow-x: auto;
    padding-bottom: 2px;
  }

  &__thumb {
    flex: 0 0 72px;
    height: 54px;
    padding: 0;
    border: 2px solid transparent;
    border-radius: $yp-radius-sm;
    overflow: hidden;
    background: $yp-surface-2;
    opacity: 0.7;
    transition:
      opacity 0.15s ease,
      border-color 0.15s ease;

    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      display: block;
    }

    &:hover,
    &.is-active {
      opacity: 1;
    }

    &.is-active {
      border-color: $yp-primary;
    }

    &--more {
      font-weight: 700;
      color: $yp-muted;
      font-family: $yp-font-num;
    }
  }

  &__empty {
    aspect-ratio: 16 / 7;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 6px;
    border-radius: $yp-radius-lg;
    background: linear-gradient(135deg, $yp-primary-soft, $yp-surface-2);
    color: $yp-primary;
    font-size: 0.875rem;

    .iconify,
    svg {
      font-size: 40px;
    }
  }
}

// ───── 燈箱 ─────
.act-lightbox {
  position: fixed;
  inset: 0;
  z-index: 1100;
  background: rgba(19, 48, 58, 0.92);
  display: flex;
  align-items: center;
  justify-content: center;

  &__inner {
    position: relative;
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 56px 16px 16px;
  }

  &__close,
  &__nav {
    position: absolute;
    display: grid;
    place-items: center;
    border: 0;
    border-radius: 50%;
    background: rgba(#fff, 0.14);
    color: #fff;
    transition: background-color 0.15s ease;

    &:hover {
      background: rgba(#fff, 0.28);
    }
  }

  &__close {
    top: 12px;
    right: 12px;
    width: 44px;
    height: 44px;
    font-size: 26px;
    z-index: 2;
  }

  &__nav {
    top: 50%;
    transform: translateY(-50%);
    width: 44px;
    height: 44px;
    font-size: 28px;
    z-index: 2;

    &--prev {
      left: 12px;
    }

    &--next {
      right: 12px;
    }
  }

  &__stage {
    flex: 1;
    min-height: 0;
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  &__img {
    max-width: 100%;
    max-height: 100%;
    object-fit: contain;
    border-radius: $yp-radius-sm;
  }

  &__info {
    display: flex;
    align-items: center;
    gap: 12px;
    max-width: 100%;
    margin-top: 12px;
    color: #fff;
    font-size: 0.875rem;
  }

  &__counter {
    font-family: $yp-font-num;
    padding: 2px 10px;
    border-radius: $yp-radius-pill;
    background: rgba(#fff, 0.16);
  }

  &__title {
    min-width: 0;
    opacity: 0.85;
  }

  &__thumbs {
    display: flex;
    gap: 8px;
    max-width: 100%;
    margin-top: 12px;
    overflow-x: auto;
    padding: 2px;
  }

  &__thumb {
    flex: 0 0 56px;
    height: 42px;
    padding: 0;
    border: 2px solid transparent;
    border-radius: 6px;
    overflow: hidden;
    background: transparent;
    opacity: 0.55;

    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      display: block;
    }

    &:hover {
      opacity: 0.85;
    }

    &.is-active {
      opacity: 1;
      border-color: #fff;
    }
  }

  @media (max-width: #{$yp-bp-md - 1px}) {
    &__nav {
      width: 38px;
      height: 38px;
      font-size: 24px;

      &--prev {
        left: 6px;
      }

      &--next {
        right: 6px;
      }
    }
  }
}
</style>
