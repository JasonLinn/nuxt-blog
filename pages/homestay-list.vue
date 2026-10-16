<template>
  <div class="yp-page hl">
    <nav class="yp-breadcrumb" aria-label="麵包屑">
      <NuxtLink to="/">首頁</NuxtLink>
      <span>民宿</span>
    </nav>

    <header class="yp-page-head">
      <div>
        <span class="yp-page-head__eyebrow">住宿服務</span>
        <h1 class="yp-page-head__title">宜蘭民宿推薦</h1>
        <p class="yp-page-head__desc">協會認證的合法民宿，依地區、人數與主題特色找到理想住宿。</p>
      </div>
    </header>

    <!-- 搜尋列 -->
    <form class="yp-search hl-search" role="search" @submit.prevent @keydown.enter.prevent>
      <div class="yp-search__field">
        <Icon name="ri:search-line" class="yp-search__icon" />
        <input
          v-model="searchText"
          type="search"
          class="yp-search__input"
          placeholder="請輸入民宿名稱或介紹關鍵字"
          aria-label="搜尋民宿"
        />
        <button
          v-if="searchText"
          type="button"
          class="yp-search__clear"
          aria-label="清除搜尋"
          @click="cleanText"
        >
          <Icon name="ri:close-line" />
        </button>
      </div>
      <label class="hl-guests">
        <Icon name="ri:group-line" class="hl-guests__icon" />
        <input
          v-model.number="guestCount"
          type="number"
          class="hl-guests__input"
          placeholder="人數"
          min="1"
          max="50"
          aria-label="入住人數"
        />
        <span class="hl-guests__unit">人</span>
      </label>
      <button
        type="button"
        class="btn btn-primary btn-icon hl-search__filter"
        @click="openAdvancedSearch"
      >
        <Icon name="ri:equalizer-line" />
        <span class="d-none d-sm-inline">進階搜尋</span>
        <span
          v-if="selectedThemeFeatures.length + selectedServiceAmenities.length"
          class="hl-badge"
        >
          {{ selectedThemeFeatures.length + selectedServiceAmenities.length }}
        </span>
      </button>
    </form>

    <!-- 地區 chips -->
    <div class="yp-chips hl-areas" role="group" aria-label="地區">
      <button
        type="button"
        class="yp-chip"
        :class="{ 'is-active': !selectedArea }"
        @click="selectArea(null)"
      >
        全部地區
      </button>
      <button
        v-for="area in areas"
        :key="area"
        type="button"
        class="yp-chip"
        :class="{ 'is-active': selectedArea === area }"
        @click="selectArea(area)"
      >
        {{ area }}
      </button>
    </div>

    <!-- 熱門特色 -->
    <div class="hl-hot">
      <span class="hl-hot__label">熱門特色</span>
      <button
        v-for="tag in hotThemeFeatures"
        :key="tag"
        type="button"
        class="yp-chip yp-chip--sm"
        :class="{ 'is-active': searchText === tag }"
        @click="searchText === tag ? cleanText() : clickTag($event)"
      >
        {{ tag }}
      </button>
    </div>

    <!-- 已套用的進階篩選 -->
    <div v-if="hasActiveFilters" class="yp-tags hl-active">
      <span
        v-for="feature in selectedThemeFeatures"
        :key="'theme-' + feature"
        class="yp-tag yp-tag--primary hl-active__tag"
      >
        主題：{{ feature }}
        <button
          type="button"
          class="hl-active__remove"
          :aria-label="`移除 ${feature}`"
          @click="removeThemeFeature(feature)"
        >
          <Icon name="ri:close-line" />
        </button>
      </span>
      <span
        v-for="amenity in selectedServiceAmenities"
        :key="'amenity-' + amenity"
        class="yp-tag yp-tag--primary hl-active__tag"
      >
        設施：{{ amenity }}
        <button
          type="button"
          class="hl-active__remove"
          :aria-label="`移除 ${amenity}`"
          @click="removeServiceAmenity(amenity)"
        >
          <Icon name="ri:close-line" />
        </button>
      </span>
    </div>

    <!-- 進階搜尋面板（手機為底部面板、桌機為右側抽屜） -->
    <div class="hl-sheet" :class="{ active: showAdvancedSearch }" @click="closeAdvancedSearch">
      <div
        class="hl-sheet__panel"
        role="dialog"
        aria-modal="true"
        aria-label="進階搜尋"
        @click.stop
      >
        <div class="hl-sheet__head">
          <h3 class="hl-sheet__title"><Icon name="ri:equalizer-line" /> 進階搜尋</h3>
          <button
            type="button"
            class="btn btn-ghost btn-icon hl-sheet__close"
            aria-label="關閉"
            @click="closeAdvancedSearch"
          >
            <Icon name="ri:close-line" />
          </button>
        </div>

        <div class="hl-sheet__body">
          <section class="hl-sheet__group">
            <h4 class="hl-sheet__group-title">主題特色 <small>（同時符合）</small></h4>
            <div class="hl-sheet__options">
              <label
                v-for="feature in availableThemeFeatures"
                :key="feature"
                class="yp-chip yp-chip--sm hl-option"
                :class="{ 'is-active': selectedThemeFeatures.includes(feature) }"
              >
                <input
                  v-model="selectedThemeFeatures"
                  type="checkbox"
                  class="visually-hidden"
                  :value="feature"
                />
                {{ feature }}
              </label>
              <span v-if="!availableThemeFeatures.length" class="text-secondary small"
                >載入選項中…</span
              >
            </div>
          </section>

          <section class="hl-sheet__group">
            <h4 class="hl-sheet__group-title">服務設施 <small>（同時符合）</small></h4>
            <div class="hl-sheet__options">
              <label
                v-for="amenity in availableServiceAmenities"
                :key="amenity"
                class="yp-chip yp-chip--sm hl-option"
                :class="{ 'is-active': selectedServiceAmenities.includes(amenity) }"
              >
                <input
                  v-model="selectedServiceAmenities"
                  type="checkbox"
                  class="visually-hidden"
                  :value="amenity"
                />
                {{ amenity }}
              </label>
              <span v-if="!availableServiceAmenities.length" class="text-secondary small"
                >載入選項中…</span
              >
            </div>
          </section>
        </div>

        <div class="hl-sheet__foot">
          <button type="button" class="btn btn-ghost" @click="clearAdvancedFilters">
            清除篩選
          </button>
          <button type="button" class="btn btn-primary flex-fill" @click="applyAdvancedFilters">
            套用篩選（{{ filteredResultsCount }}）
          </button>
        </div>
      </div>
    </div>

    <!-- 結果標題 -->
    <div class="yp-section-head hl-head">
      <h2 class="yp-section-head__title">
        {{
          searchText
            ? `「${searchText}」的搜尋結果`
            : selectedArea
            ? `${selectedArea}民宿`
            : '全部民宿'
        }}
      </h2>
      <div class="d-flex align-items-center gap-3">
        <span v-if="!loading && !error && filteredResultsCount" class="text-secondary small">
          共 {{ filteredResultsCount }} 間
        </span>
        <button
          v-if="hasAnyFilter"
          type="button"
          class="btn btn-ghost btn-sm"
          @click="resetAllFilters"
        >
          清除全部
        </button>
      </div>
    </div>

    <!-- 載入中 -->
    <div v-if="loading" class="yp-grid hl-grid" aria-busy="true">
      <div v-for="n in 8" :key="`skeleton-${n}`" class="yp-card">
        <div class="yp-card__media yp-skeleton" />
        <div class="yp-card__body">
          <span class="yp-skeleton mb-2" style="width: 65%; height: 18px" />
          <span class="yp-skeleton mb-2" style="width: 45%; height: 20px" />
          <span class="yp-skeleton" style="width: 90%; height: 14px" />
        </div>
      </div>
    </div>

    <template v-else>
      <!-- 錯誤 -->
      <div v-if="error" class="yp-card yp-empty yp-empty--error">
        <div class="yp-empty__icon"><Icon name="ri:wifi-off-line" /></div>
        <p class="yp-empty__title">載入民宿時發生問題</p>
        <p class="yp-empty__text">
          請檢查網路連線後再試一次。<span class="d-block small text-secondary mt-1">{{
            error
          }}</span>
        </p>
        <button type="button" class="btn btn-primary" @click="fetchBnbsData">重新載入</button>
      </div>

      <!-- 無資料 -->
      <div v-else-if="!filteredBnbs || filteredBnbs.length === 0" class="yp-card yp-empty">
        <div class="yp-empty__icon"><Icon name="ri:hotel-line" /></div>
        <p class="yp-empty__title">目前沒有符合條件的民宿</p>
        <p class="yp-empty__text">試試其他關鍵字或地區，或清除篩選條件。</p>
        <button type="button" class="btn btn-soft" @click="resetAllFilters">清除篩選</button>
      </div>

      <!-- 民宿列表 -->
      <template v-else>
        <div class="yp-grid hl-grid">
          <NuxtLink
            v-for="(bnb, index) in paginatedBnbs"
            :key="bnb.id"
            :to="`/homestays/${bnb.id}`"
            class="yp-card yp-card--hover hl-card"
            @click="handleBnbClick(bnb.id)"
            @mouseenter="hoveredBnb = bnb.id"
            @mouseleave="hoveredBnb = null"
          >
            <div class="yp-card__media hl-card__media">
              <!-- 多張圖片：迷你輪播 -->
              <template v-if="bnb.image_urls && bnb.image_urls.length > 1">
                <img
                  v-for="(imageUrl, imageIndex) in bnb.image_urls.slice(0, 5)"
                  :key="imageIndex"
                  :src="imageUrl"
                  :alt="`${bnb.name} - 圖片 ${imageIndex + 1}`"
                  class="hl-card__img"
                  :class="{ active: currentImageIndex[bnb.id] === imageIndex }"
                  :loading="index < 4 && imageIndex === 0 ? 'eager' : 'lazy'"
                  @error="handleImgError"
                />
                <button
                  type="button"
                  class="hl-card__nav hl-card__nav--prev"
                  :class="{ 'is-visible': hoveredBnb === bnb.id }"
                  aria-label="上一張"
                  @click.stop.prevent="prevImage(bnb.id, bnb.image_urls.length)"
                >
                  <Icon name="ri:arrow-left-s-line" />
                </button>
                <button
                  type="button"
                  class="hl-card__nav hl-card__nav--next"
                  :class="{ 'is-visible': hoveredBnb === bnb.id }"
                  aria-label="下一張"
                  @click.stop.prevent="nextImage(bnb.id, bnb.image_urls.length)"
                >
                  <Icon name="ri:arrow-right-s-line" />
                </button>
                <div class="hl-card__dots">
                  <button
                    v-for="(imageUrl, imageIndex) in bnb.image_urls.slice(0, 5)"
                    :key="imageIndex"
                    type="button"
                    class="hl-card__dot"
                    :class="{ active: currentImageIndex[bnb.id] === imageIndex }"
                    :aria-label="`第 ${imageIndex + 1} 張`"
                    @click.stop.prevent="setCurrentImage(bnb.id, imageIndex)"
                  />
                  <span v-if="bnb.image_urls.length > 5" class="hl-card__more"
                    >+{{ bnb.image_urls.length - 5 }}</span
                  >
                </div>
              </template>

              <!-- 單張圖片 -->
              <img
                v-else
                :alt="bnb.name"
                width="366"
                height="229"
                :src="
                  bnb.image_urls && bnb.image_urls.length > 0 ? bnb.image_urls[0] : PLACEHOLDER_IMG
                "
                class="hl-card__img active"
                :loading="index < 4 ? 'eager' : 'lazy'"
                @error="handleImgError"
              />

              <span v-if="bnb.image_urls && bnb.image_urls.length" class="hl-card__count">
                <Icon name="ri:image-line" /> {{ bnb.image_urls.length }}
              </span>
            </div>

            <div class="yp-card__body hl-card__body">
              <h2 class="yp-card__title yp-clamp-1">{{ bnb.name }}</h2>

              <div class="yp-tags hl-card__tags">
                <span class="yp-tag yp-tag--primary"
                  ><Icon name="ri:map-pin-line" />{{ bnb.area }}</span
                >
                <span v-if="bnb.min_guests || bnb.max_guests" class="yp-tag">
                  <Icon name="ri:group-line" />{{ getGuestRange(bnb) }}
                </span>
                <span
                  v-for="themeFeature in (bnb.features?.themeFeatures || []).slice(0, 2)"
                  :key="themeFeature"
                  class="yp-tag"
                >
                  {{ themeFeature }}
                </span>
                <span v-if="(bnb.features?.themeFeatures || []).length > 2" class="yp-tag">
                  +{{ (bnb.features?.themeFeatures || []).length - 2 }}
                </span>
              </div>

              <p v-if="bnb.description" class="hl-card__desc yp-clamp-2">{{ bnb.description }}</p>

              <div
                v-if="
                  (bnb.prices && (bnb.prices.fullRentWeekday || bnb.prices.fullRentWeekend)) ||
                  bnb.view_count
                "
                class="yp-card__footer hl-card__footer"
              >
                <div
                  v-if="bnb.prices && (bnb.prices.fullRentWeekday || bnb.prices.fullRentWeekend)"
                  class="hl-price"
                >
                  <span v-if="bnb.prices.fullRentWeekday" class="hl-price__item">
                    <small>包棟平日</small><b class="yp-num">{{ bnb.prices.fullRentWeekday }}</b
                    ><small>起</small>
                  </span>
                  <span v-if="bnb.prices.fullRentWeekend" class="hl-price__item">
                    <small>包棟假日</small><b class="yp-num">{{ bnb.prices.fullRentWeekend }}</b
                    ><small>起</small>
                  </span>
                </div>
                <span v-else />
                <span v-if="bnb.view_count" class="hl-card__views">
                  <Icon name="ri:eye-line" /> {{ bnb.view_count }}
                </span>
              </div>
            </div>
          </NuxtLink>
        </div>

        <!-- 分頁 -->
        <nav v-if="totalPages > 1" class="yp-pager" aria-label="分頁">
          <a
            class="yp-pager__btn"
            :class="{ 'is-disabled': currentPage <= 1 }"
            :href="pageHref(currentPage - 1)"
            aria-label="上一頁"
            @click.prevent="currentPage > 1 && (currentPage = currentPage - 1)"
          >
            <Icon name="ri:arrow-left-s-line" />
          </a>
          <a
            v-for="page in pageNumbers"
            :key="page"
            class="yp-pager__btn"
            :class="{ 'is-active': page === currentPage }"
            :href="pageHref(page)"
            :aria-current="page === currentPage ? 'page' : undefined"
            @click.prevent="currentPage = page"
          >
            {{ page }}
          </a>
          <a
            class="yp-pager__btn"
            :class="{ 'is-disabled': currentPage >= totalPages }"
            :href="pageHref(currentPage + 1)"
            aria-label="下一頁"
            @click.prevent="currentPage < totalPages && (currentPage = currentPage + 1)"
          >
            <Icon name="ri:arrow-right-s-line" />
          </a>
        </nav>
      </template>
    </template>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue'
import useHomestayStore from '~/store/homestay.js'
import { parseListPage, serializeJsonLd } from '~/utils/homestay-seo.js'

const route = useRoute()
const router = useRouter()
if (parseListPage(route.query.page) === null) {
  throw createError({ statusCode: 404, statusMessage: 'Page Not Found', fatal: true })
}
// Keep filter resets synchronous; router.push updates the URL asynchronously.
const currentPage = ref(parseListPage(route.query.page))
watch(
  () => route.query.page,
  (value) => {
    const page = parseListPage(value)
    if (page === null) {
      showError({ statusCode: 404, statusMessage: 'Page Not Found' })
      return
    }
    currentPage.value = page
  }
)
const pageHref = (page) => (page > 1 ? `/homestay-list?page=${page}` : '/homestay-list')
const canonicalUrl = computed(() => `https://yilanpass.com${pageHref(currentPage.value)}`)

// SEO 設定
useSeoMeta({
  title: () =>
    `宜蘭民宿推薦${currentPage.value > 1 ? `｜第 ${currentPage.value} 頁` : ''}｜宜蘭旅遊通`,
  ogTitle: '宜蘭合法民宿推薦 | 宜蘭旅遊通-宜蘭觀光民宿行銷協會',
  description:
    '宜蘭旅遊通-宜蘭觀光民宿行銷協會提供宜蘭地區合法民宿，包含親子民宿、寵物民宿、海景民宿、包棟民宿、戲水池民宿、KTV民宿、烤肉民宿等多種主題特色民宿。透過進階搜尋功能，讓您輕鬆找到理想的住宿選擇，規劃完美的宜蘭之旅。',
  ogDescription:
    '精選宜蘭地區合法民宿，提供親子、寵物、海景、包棟、戲水池、KTV、烤肉等多種主題住宿選擇',
  keywords:
    '宜蘭民宿推薦,合法民宿,親子民宿,寵物民宿,海景民宿,包棟民宿,戲水池民宿,KTV民宿,烤肉民宿,游泳池民宿,唱歌民宿,BBQ民宿,宜蘭住宿,民宿搜尋,宜蘭旅遊',
  ogImage: 'https://yilanpass.com/logo.png',
  ogUrl: () => canonicalUrl.value,
  twitterUrl: () => canonicalUrl.value,
  twitterCard: 'summary_large_image',
  robots: 'index, follow, max-image-preview:large'
})

// Each paginated page has its own canonical URL.
useHead(() => ({
  titleTemplate: null,
  link: [
    {
      rel: 'canonical',
      href: canonicalUrl.value
    },
    {
      rel: 'llms-txt',
      href: 'https://yilanpass.com/llms.txt'
    }
  ]
}))

// 使用 homestay store
const homestayStore = useHomestayStore()

const searchText = ref('')
const selectedArea = ref(null)
const guestCount = ref(null)
const itemsPerPage = 12 // 與後端預設一致

// 日期搜尋相關
const checkInDate = ref('')
const checkOutDate = ref('')
const dateSearchMode = ref(false) // 是否啟用日期搜尋模式
const availableHomestays = ref([]) // 根據日期搜尋的可用民宿

// 進階搜尋相關變量
const showAdvancedSearch = ref(false)
const selectedThemeFeatures = ref([])
const selectedServiceAmenities = ref([])
const availableThemeFeatures = ref([])
const availableServiceAmenities = ref([])

// 圖片輪播相關狀態
const currentImageIndex = ref({})
const hoveredBnb = ref(null)

// 圖片載入失敗時的替代圖檔
const PLACEHOLDER_IMG = '/images/bnb-placeholder.svg'
const handleImgError = (event) => {
  if (event.target.src.includes(PLACEHOLDER_IMG)) return
  event.target.src = PLACEHOLDER_IMG
}

// 從store獲取資料
const bnbsData = computed(() => homestayStore.getAllHomestays)
const loading = computed(() => homestayStore.getLoading)
const error = computed(() => homestayStore.getError)
const pagination = computed(() => homestayStore.getPagination)

// 過濾民宿資料 - 增強篩選邏輯，支援日期搜尋
const filteredBnbs = computed(() => {
  // 如果啟用日期搜尋模式，使用日期搜尋結果 (Client-side filtering)
  if (dateSearchMode.value && availableHomestays.value.length >= 0) {
    // 對日期搜尋結果進行進一步篩選
    const result = availableHomestays.value.filter((bnb) => {
      const nameMatch =
        !searchText.value ||
        bnb.name.toLowerCase().includes(searchText.value.toLowerCase()) ||
        bnb.description?.toLowerCase().includes(searchText.value.toLowerCase()) ||
        (bnb.features?.themeFeatures &&
          bnb.features.themeFeatures.some((feature) =>
            feature.toLowerCase().includes(searchText.value.toLowerCase())
          ))
      const areaMatch = !selectedArea.value || bnb.area === selectedArea.value
      const themeMatch =
        selectedThemeFeatures.value.length === 0 ||
        (bnb.features?.themeFeatures &&
          selectedThemeFeatures.value.every((selected) =>
            bnb.features.themeFeatures.includes(selected)
          ))
      const amenityMatch =
        selectedServiceAmenities.value.length === 0 ||
        (bnb.features?.serviceAmenities &&
          selectedServiceAmenities.value.every((selected) =>
            bnb.features.serviceAmenities.includes(selected)
          ))
      return nameMatch && areaMatch && themeMatch && amenityMatch
    })
    return shuffleArray(result)
  }

  // 一般模式 (Server-side filtering) - 直接回傳 store 資料
  // 過濾邏輯已在後端完成
  return bnbsData.value || []
})

// 計算總頁數
const totalPages = computed(() => {
  if (dateSearchMode.value) {
    return Math.ceil(filteredBnbs.value.length / itemsPerPage)
  }
  // Server-side
  return pagination.value.totalPages
})

// 當前頁的資料
const paginatedBnbs = computed(() => {
  if (dateSearchMode.value) {
    // Client-side pagination
    const startIndex = (currentPage.value - 1) * itemsPerPage
    const endIndex = startIndex + itemsPerPage
    return filteredBnbs.value.slice(startIndex, endIndex)
  }
  // Server-side: store data is already the current page
  return filteredBnbs.value
})

// 熱門主題特色標籤
const hotThemeFeatures = ['包棟民宿', '親子民宿', '寵物民宿', '海景民宿']

// 獲取所有區域 - 使用store的getter (注意：這可能只包含當前頁面的區域，如果需要完整列表可能需要優化)
// 獲取所有區域 - 改為靜態列表以確保分頁模式下能選擇所有區域
const areas = computed(() => [
  '頭城鎮',
  '礁溪鄉',
  '宜蘭市',
  '壯圍鄉',
  '員山鄉',
  '羅東鎮',
  '五結鄉',
  '三星鄉',
  '冬山鄉',
  '蘇澳鎮',
  '南澳鄉',
  '大同鄉'
])

// 日期相關的計算屬性
const todayString = computed(() => {
  return new Date().toISOString().split('T')[0]
})

// eslint-disable-next-line no-unused-vars
const maxDateString = computed(() => {
  const maxDate = new Date()
  maxDate.setMonth(maxDate.getMonth() + 6)
  return maxDate.toISOString().split('T')[0]
})

// eslint-disable-next-line no-unused-vars
const minCheckOutDate = computed(() => {
  if (!checkInDate.value) return todayString.value
  const checkIn = new Date(checkInDate.value)
  checkIn.setDate(checkIn.getDate() + 1)
  return checkIn.toISOString().split('T')[0]
})

// 除錯用：監控篩選條件變化
const debugFilters = () => {
  console.log('篩選條件:', {
    searchText: searchText.value,
    selectedArea: selectedArea.value,
    guestCount: guestCount.value,
    themes: selectedThemeFeatures.value,
    amenities: selectedServiceAmenities.value,
    page: currentPage.value,
    totalCount: pagination.value.totalCount
  })
}

// Describe only the cards actually rendered, without invented ratings or prices.
useHead(() => ({
  script: [
    {
      key: 'homestay-list-schema',
      type: 'application/ld+json',
      innerHTML: serializeJsonLd({
        '@context': 'https://schema.org',
        '@type': 'ItemList',
        name: '宜蘭民宿推薦',
        url: canonicalUrl.value,
        numberOfItems: paginatedBnbs.value.length,
        itemListElement: paginatedBnbs.value.map((bnb, index) => ({
          '@type': 'ListItem',
          position: (currentPage.value - 1) * itemsPerPage + index + 1,
          name: bnb.name,
          url: `https://yilanpass.com/homestays/${encodeURIComponent(bnb.id)}`
        }))
      })
    }
  ]
}))

// 點擊熱門標籤
const clickTag = (e) => {
  const tagText = e.target.textContent.trim()

  // 根據標籤類型設定不同的篩選方式
  if (tagText === '包棟') {
    // 搜尋包含包棟相關的民宿
    searchText.value = '包棟'
  } else {
    // 其他環境類型標籤，直接搜尋
    searchText.value = tagText
    selectedArea.value = null
    guestCount.value = null
  }

  currentPage.value = 1
  // watch 會自動觸發 fetchFn
}

// 清除搜尋文字
const cleanText = () => {
  searchText.value = ''
  currentPage.value = 1
}

// 載入進階搜尋選項
const loadAdvancedSearchOptions = async () => {
  try {
    const response = await $fetch('/api/features-options')
    if (response.success) {
      availableThemeFeatures.value = response.data.themeFeatures || []
      availableServiceAmenities.value = response.data.serviceAmenities || []
      console.log('載入進階搜尋選項成功:', {
        themeFeatures: availableThemeFeatures.value.length,
        serviceAmenities: availableServiceAmenities.value.length
      })
    }
  } catch (error) {
    console.error('載入進階搜尋選項失敗:', error)
  }
}

// 清除進階篩選
const clearAdvancedFilters = () => {
  selectedThemeFeatures.value = []
  selectedServiceAmenities.value = []
  currentPage.value = 1
}

// 進階搜尋面板相關方法
const openAdvancedSearch = () => {
  showAdvancedSearch.value = true
  document.body.style.overflow = 'hidden'
}

const closeAdvancedSearch = () => {
  showAdvancedSearch.value = false
  document.body.style.overflow = 'auto'
}

const applyAdvancedFilters = () => {
  closeAdvancedSearch()
  currentPage.value = 1
  fetchBnbsData() // 立即觸發
}

// 移除單個主題特色
const removeThemeFeature = (feature) => {
  const index = selectedThemeFeatures.value.indexOf(feature)
  if (index > -1) {
    selectedThemeFeatures.value.splice(index, 1)
    fetchBnbsData() // 立即觸發
  }
}

// 移除單個服務設施
const removeServiceAmenity = (amenity) => {
  const index = selectedServiceAmenities.value.indexOf(amenity)
  if (index > -1) {
    selectedServiceAmenities.value.splice(index, 1)
    fetchBnbsData() // 立即觸發
  }
}

// 檢查是否有篩選條件
const hasActiveFilters = computed(() => {
  return selectedThemeFeatures.value.length > 0 || selectedServiceAmenities.value.length > 0
})

// 計算篩選結果數量 (這裡直接用當前頁數量，或者可以顯示總數)
const filteredResultsCount = computed(() => {
  return pagination.value.totalCount
})

// 根據區域過濾
const filterByArea = () => {
  currentPage.value = 1
  // watch 會自動觸發
}

// 清除日期選擇
// eslint-disable-next-line no-unused-vars
const clearDates = () => {
  checkInDate.value = ''
  checkOutDate.value = ''
  dateSearchMode.value = false
  availableHomestays.value = []
  currentPage.value = 1
}

// 根據日期搜尋可用民宿
// TODO: 未來可能需要將日期搜尋整合到後端統一篩選 API
const searchByDates = async () => {
  if (!checkInDate.value || !checkOutDate.value) {
    console.log('日期不完整，取消日期搜尋')
    dateSearchMode.value = false
    availableHomestays.value = []
    return
  }

  console.log('開始根據日期搜尋:', {
    checkInDate: checkInDate.value,
    checkOutDate: checkOutDate.value
  })

  try {
    dateSearchMode.value = true
    // 日期搜尋目前仍使用獨立 API，建議未來整合
    loading.value = true

    const response = await $fetch('/api/search-available-homestays', {
      query: {
        checkIn: checkInDate.value,
        checkOut: checkOutDate.value,
        guestCount: guestCount.value || undefined,
        area: selectedArea.value || undefined,
        limit: 100 // 獲取更多結果供前端篩選
      }
    })

    if (response.success) {
      availableHomestays.value = response.data.homestays
      console.log('日期搜尋成功，找到', availableHomestays.value.length, '個可用民宿')
      // 注意：目前日期搜尋結果是前端分頁，如果需要 Server-Side Pagination 需要後端支援
      // 這裡暫時保持原樣，或者是將 available ID 傳給 fetchBnbs
    } else {
      console.error('日期搜尋失敗:', response.error)
      availableHomestays.value = []
    }
  } catch (error) {
    console.error('日期搜尋發生錯誤:', error)
    availableHomestays.value = []
  } finally {
    // loading.value = false; // 由 store 控制
    currentPage.value = 1
  }
}

// 從 store 獲取民宿資料 (Server-Side Pagination)
const fetchBnbsData = async () => {
  console.log('=== fetchBnbsData 開始執行 ===')

  try {
    const params = {
      page: currentPage.value,
      limit: itemsPerPage,
      search: searchText.value,
      location: selectedArea.value || '',
      guest_count: guestCount.value || null,
      themes: selectedThemeFeatures.value,
      amenities: selectedServiceAmenities.value
      // 日期搜尋暫不整合到此，除非後端支援
    }

    console.log('🔄 開始從API獲取資料(分頁)...', params)

    await homestayStore.fetchHomestays(params)

    console.log('✅ 從 store 獲取民宿資料成功')
    debugFilters()

    // 確保響應式更新
    await nextTick()
  } catch (err) {
    console.error('載入民宿資料失敗:', err)
  }

  console.log('=== fetchBnbsData 執行完成 ===')
}

// 監聽一般篩選條件變化 (Debounce 處理搜尋文字)
let searchTimeout = null
watch([searchText], () => {
  if (searchTimeout) clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => {
    currentPage.value = 1
    fetchBnbsData()
  }, 500)
})
// 監聽其他立即生效的篩選條件
watch(
  [selectedArea, guestCount, selectedThemeFeatures, selectedServiceAmenities],
  () => {
    if (currentPage.value !== 1) {
      currentPage.value = 1
    } else {
      fetchBnbsData()
    }
    debugFilters()
  },
  { deep: true }
)

// 監聽頁碼變化
// 當頁碼改變時，直接觸發資料獲取
watch(currentPage, () => {
  if (parseListPage(route.query.page) !== currentPage.value) {
    router.push({
      path: '/homestay-list',
      query: currentPage.value > 1 ? { page: currentPage.value } : {}
    })
  }
  fetchBnbsData()
})

// 監聽日期變化
watch(
  [checkInDate, checkOutDate],
  () => {
    // 使用 debounce 避免過度頻繁的 API 調用
    if (searchDateTimeout) {
      clearTimeout(searchDateTimeout)
    }

    searchDateTimeout = setTimeout(() => {
      searchByDates()
    }, 500) // 500ms 延遲
  },
  { immediate: false }
)

let searchDateTimeout = null

// Fetch before SSR renders; Pinia state is included in the Nuxt payload for hydration.
const { error: initialError } = await useAsyncData(
  `homestay-list-${currentPage.value}`,
  async () => {
    await homestayStore.fetchHomestays({ page: currentPage.value, limit: itemsPerPage })
    return true
  }
)
if (initialError.value) {
  throw createError({ statusCode: 503, statusMessage: 'Service Unavailable', fatal: true })
}
if (currentPage.value > Math.max(1, pagination.value.totalPages)) {
  throw createError({ statusCode: 404, statusMessage: 'Page Not Found', fatal: true })
}
onMounted(loadAdvancedSearchOptions)

// 清理函式
onUnmounted(() => {
  document.body.style.overflow = 'auto'
  clearTimeout(searchTimeout)
  clearTimeout(searchDateTimeout)
})

// 格式化人數範圍顯示
const getGuestRange = (bnb) => {
  if (!bnb) return ''

  const min = bnb.min_guests
  const max = bnb.max_guests

  if (min && max) {
    return `${min}~${max}人`
  } else if (min) {
    return `${min}人+`
  } else if (max) {
    return `最多${max}人`
  }
  return ''
}

const handleBnbClick = (id) => {
  if (!id) return
  // NuxtLink 負責導航，這裡只需更新查看次數
  homestayStore.updateViewCount(id)
}

// 圖片輪播控制函數
const initializeImageIndex = (bnbId) => {
  if (!currentImageIndex.value[bnbId]) {
    currentImageIndex.value[bnbId] = 0
  }
}

const nextImage = (bnbId, totalImages) => {
  initializeImageIndex(bnbId)
  currentImageIndex.value[bnbId] = (currentImageIndex.value[bnbId] + 1) % Math.min(totalImages, 5)
}

const prevImage = (bnbId, totalImages) => {
  initializeImageIndex(bnbId)
  currentImageIndex.value[bnbId] =
    currentImageIndex.value[bnbId] === 0
      ? Math.min(totalImages, 5) - 1
      : currentImageIndex.value[bnbId] - 1
}

const setCurrentImage = (bnbId, imageIndex) => {
  currentImageIndex.value[bnbId] = imageIndex
}

// 監聽資料變化，初始化圖片索引
watch(
  bnbsData,
  (newData) => {
    if (newData && newData.length > 0) {
      newData.forEach((bnb) => {
        initializeImageIndex(bnb.id)
      })
    }
  },
  { immediate: true }
)

// 選擇地區 chip
const selectArea = (area) => {
  selectedArea.value = area
  filterByArea()
}

// 分頁按鈕（最多顯示 5 個頁碼）
const pageNumbers = computed(() => {
  const total = Math.max(1, totalPages.value || 1)
  const current = currentPage.value
  const start = Math.max(1, Math.min(current - 2, total - 4))
  const end = Math.min(total, start + 4)
  return Array.from({ length: end - start + 1 }, (_, i) => start + i)
})

// 是否有任何篩選條件（搜尋文字 / 地區 / 人數 / 進階篩選）
const hasAnyFilter = computed(() => {
  return !!(searchText.value || selectedArea.value || guestCount.value || hasActiveFilters.value)
})

// 清除所有篩選條件
const resetAllFilters = () => {
  searchText.value = ''
  selectedArea.value = null
  guestCount.value = null
  selectedThemeFeatures.value = []
  selectedServiceAmenities.value = []
  currentPage.value = 1
}
</script>

<style lang="scss" scoped>
.hl {
  .yp-page-head {
    margin-bottom: 20px;
  }
}

// ───── 搜尋列 ─────
.hl-search {
  margin-bottom: 16px;

  .yp-search__input {
    -webkit-appearance: none;
    appearance: none;

    &::-webkit-search-cancel-button {
      display: none;
    }
  }

  &__filter {
    position: relative;
    flex: none;
    min-height: 44px;
  }
}

.hl-badge {
  min-width: 18px;
  height: 18px;
  padding: 0 5px;
  border-radius: $yp-radius-pill;
  background: #fff;
  color: $yp-primary-ink;
  font-family: $yp-font-num;
  font-size: 0.6875rem;
  font-weight: 700;
  line-height: 18px;
  text-align: center;
}

.hl-guests {
  flex: none;
  display: flex;
  align-items: center;
  gap: 6px;
  height: 44px;
  margin: 0;
  padding: 0 10px 0 12px;
  border-left: 1px solid $yp-line;
  color: $yp-muted;
  cursor: text;

  &__input {
    width: 3.2em;
    border: 0;
    padding: 0;
    background: transparent;
    font-family: $yp-font-num;
    font-size: 1rem;
    color: $yp-ink;
    outline: none;
    -moz-appearance: textfield;
    appearance: textfield;

    &::-webkit-outer-spin-button,
    &::-webkit-inner-spin-button {
      -webkit-appearance: none;
      margin: 0;
    }

    &::placeholder {
      color: $yp-subtle;
      font-family: $yp-font-sans;
    }
  }

  @media (max-width: #{$yp-bp-sm - 1px}) {
    padding: 0 6px 0 8px;

    &__icon,
    &__unit {
      display: none;
    }

    &__input {
      width: 3em;
      text-align: center;
    }
  }
}

// ───── 篩選 chips ─────
.hl-areas {
  margin-bottom: 8px;
}

.hl-hot {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px;
  margin-bottom: 12px;

  &__label {
    font-size: 0.8125rem;
    color: $yp-muted;
    margin-right: 4px;
  }
}

.hl-active {
  margin-bottom: 12px;

  &__tag {
    padding-right: 4px;
  }

  &__remove {
    display: inline-grid;
    place-items: center;
    width: 18px;
    height: 18px;
    padding: 0;
    border: 0;
    border-radius: 50%;
    background: transparent;
    color: inherit;

    &:hover {
      background: rgba($yp-primary, 0.18);
    }
  }
}

.hl-head {
  margin-top: 20px;
}

.hl-grid {
  @media (max-width: #{$yp-bp-sm - 1px}) {
    gap: 14px;
  }
}

// ───── 民宿卡片 ─────
.hl-card {
  display: flex;
  flex-direction: column;
  height: 100%;
  color: inherit;
  text-decoration: none;

  &:hover {
    color: inherit;
  }

  &__media {
    background: $yp-surface-2;
  }

  &__img {
    position: absolute;
    inset: 0;
    opacity: 0;
    transition:
      opacity 0.3s ease,
      transform 0.4s ease;

    &.active {
      opacity: 1;
    }
  }

  &:hover &__img.active {
    transform: scale(1.04);
  }

  &__nav {
    position: absolute;
    top: 50%;
    transform: translateY(-50%);
    z-index: 2;
    display: grid;
    place-items: center;
    width: 32px;
    height: 32px;
    padding: 0;
    border: 0;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.92);
    color: $yp-ink;
    font-size: 1.125rem;
    box-shadow: $yp-shadow-sm;
    opacity: 0;
    transition: opacity 0.2s ease;

    &--prev {
      left: 8px;
    }

    &--next {
      right: 8px;
    }

    &.is-visible,
    &:focus-visible {
      opacity: 1;
    }

    // 觸控裝置沒有 hover，箭頭常駐
    @media (hover: none) {
      opacity: 1;
    }
  }

  &__dots {
    position: absolute;
    left: 0;
    right: 0;
    bottom: 8px;
    z-index: 2;
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 5px;
  }

  &__dot {
    width: 6px;
    height: 6px;
    padding: 0;
    border: 0;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.6);
    box-shadow: 0 0 0 1px rgba(19, 48, 58, 0.15);

    &.active {
      width: 16px;
      border-radius: 3px;
      background: #fff;
    }
  }

  &__more {
    font-size: 0.6875rem;
    color: #fff;
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
  }

  &__count {
    position: absolute;
    top: 8px;
    right: 8px;
    z-index: 2;
    display: inline-flex;
    align-items: center;
    gap: 3px;
    padding: 2px 8px;
    border-radius: $yp-radius-pill;
    background: rgba(19, 48, 58, 0.62);
    color: #fff;
    font-family: $yp-font-num;
    font-size: 0.75rem;
  }

  &__body {
    display: flex;
    flex: 1;
    flex-direction: column;
  }

  &__tags {
    margin: 8px 0 12px;
  }

  &__desc {
    margin: -2px 0 12px;
    font-size: 0.875rem;
    line-height: 1.5;
    color: $yp-muted;
  }

  &__footer {
    margin-top: auto;
    align-items: flex-end;
  }

  &__views {
    display: inline-flex;
    align-items: center;
    gap: 3px;
    flex: none;
    font-family: $yp-font-num;
  }
}

.hl-price {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;

  &__item {
    display: flex;
    align-items: baseline;
    gap: 4px;

    small {
      font-size: 0.75rem;
      color: $yp-muted;
    }

    b {
      font-size: 0.9375rem;
      font-weight: 600;
      color: $yp-primary-ink;
    }
  }
}

// ───── 進階搜尋面板 ─────
.hl-sheet {
  position: fixed;
  inset: 0;
  z-index: 1060;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  background: rgba(19, 48, 58, 0.45);
  visibility: hidden;
  opacity: 0;
  transition:
    opacity 0.2s ease,
    visibility 0.2s ease;

  &.active {
    visibility: visible;
    opacity: 1;
  }

  &__panel {
    display: flex;
    flex-direction: column;
    width: 100%;
    max-height: 88vh;
    max-height: 88dvh;
    background: #fff;
    border-radius: $yp-radius-xl $yp-radius-xl 0 0;
    box-shadow: $yp-shadow-lg;
    transform: translateY(24px);
    transition: transform 0.25s ease;
  }

  &.active &__panel {
    transform: none;
  }

  &__head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 14px 16px 12px 20px;
    border-bottom: 1px solid $yp-line;
  }

  &__title {
    display: flex;
    align-items: center;
    gap: 8px;
    margin: 0;
    font-size: 1.125rem;
    font-weight: 700;
  }

  &__close {
    min-width: 40px;
    min-height: 40px;
    font-size: 1.25rem;
  }

  &__body {
    flex: 1;
    overflow-y: auto;
    padding: 16px 20px;
  }

  &__group + &__group {
    margin-top: 24px;
  }

  &__group-title {
    margin: 0 0 10px;
    font-size: 0.9375rem;
    font-weight: 700;

    small {
      font-weight: 400;
      color: $yp-muted;
    }
  }

  &__options {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }

  &__foot {
    display: flex;
    gap: 8px;
    padding: 12px 16px calc(12px + env(safe-area-inset-bottom));
    border-top: 1px solid $yp-line;
  }

  @media (min-width: $yp-bp-md) {
    align-items: stretch;
    justify-content: flex-end;

    &__panel {
      width: 420px;
      max-height: none;
      border-radius: $yp-radius-xl 0 0 $yp-radius-xl;
      transform: translateX(24px);
    }
  }
}

.hl-option {
  margin: 0;
  min-height: 34px;
  user-select: none;

  &:focus-within {
    outline: 2px solid $yp-primary;
    outline-offset: 2px;
  }
}
</style>
