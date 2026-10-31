<template>
  <div class="home">
    <!-- Hero：價值主張 + 搜尋 -->
    <section class="yp-hero">
      <div class="yp-hero__inner home-hero">
        <div class="home-hero__copy">
          <h1 class="yp-hero__title">
            宜蘭吃喝玩樂，<br class="d-none d-md-inline" /><em>先領券</em>再出發
          </h1>
          <p class="yp-hero__desc">
            在地店家的免費電子優惠券，搭配合法民宿推薦，輕鬆規劃宜蘭旅程。
          </p>

          <form class="yp-search home-search" role="search" @submit.prevent="submitSearch">
            <div class="yp-search__field">
              <Icon name="ri:search-line" class="yp-search__icon" />
              <input
                v-model="searchText"
                type="search"
                class="yp-search__input"
                placeholder="搜尋店家、景點或優惠…"
                aria-label="搜尋優惠券"
                @input="handleSearchInput"
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
            <button type="submit" class="btn btn-primary d-none d-sm-inline-block">搜尋優惠</button>
          </form>

          <div class="home-hot" :aria-busy="hotTagsLoading">
            <span class="home-hot__label">熱門：</span>
            <!-- Reserve three text-link slots during loading. -->
            <button
              v-for="n in 3"
              :key="n"
              type="button"
              class="home-hot__tag"
              :class="{ 'yp-skeleton': hotTagsLoading }"
              :disabled="hotTagsLoading"
              :aria-hidden="hotTagsLoading ? true : undefined"
              @click="clickTag(hotSearchTags[n - 1])"
            >
              <span :class="{ invisible: hotTagsLoading }">{{ hotSearchTags[n - 1] }}</span>
            </button>
          </div>

          <!-- Reserve the same layout during SSR, loading, and the count-up animation. -->
          <div class="yp-stats home-hero__stats d-none d-md-flex">
            <span :class="{ invisible: displayVisitorCount === '0' }"
              ><b class="home-hero__visitor-count">{{ displayVisitorCount }}</b
              >人次造訪</span
            >
            <span :class="{ invisible: !partnerStores }"
              ><b>{{ partnerStores }}</b
              >家店家優惠</span
            >
            <span :class="{ invisible: !partnerHotels }"
              ><b>{{ partnerHotels }}</b
              >間合作旅宿</span
            >
          </div>
        </div>
      </div>
    </section>

    <div class="yp-page home-list">
      <div class="yp-section-head home-results-head">
        <div class="home-results-head__title">
          <h2 class="yp-section-head__title">{{ listTitle }}</h2>
          <span v-if="totalCount" class="text-secondary small">{{ totalCount }} 張</span>
        </div>
        <button
          type="button"
          class="btn btn-outline-primary home-filter-trigger"
          aria-haspopup="dialog"
          aria-controls="home-filter-dialog"
          @click="openFilters"
        >
          <Icon name="ri:equalizer-line" />
          篩選<span v-if="activeFilterCount" class="home-filter-trigger__count">{{
            activeFilterCount
          }}</span>
        </button>
      </div>

      <div class="home-categories" role="group" aria-label="優惠類別">
        <button
          v-for="cate in couponCategories"
          :key="cate.id"
          type="button"
          class="home-categories__item"
          :class="{ 'is-active': selectedCate === cate.id }"
          :aria-pressed="selectedCate === cate.id"
          @click="selectCate(cate.id)"
        >
          {{ categoryLabels[cate.id] }}
        </button>
      </div>

      <dialog
        id="home-filter-dialog"
        ref="filterDialog"
        class="home-filter"
        aria-labelledby="home-filter-title"
        @click="closeFilterBackdrop"
      >
        <form class="home-filter__form" @submit.prevent="applyFilters">
          <div class="home-filter__head">
            <h2 id="home-filter-title">篩選優惠</h2>
            <button
              type="button"
              class="btn btn-ghost btn-icon"
              aria-label="關閉篩選"
              @click="filterDialog.close()"
            >
              <Icon name="ri:close-line" />
            </button>
          </div>
          <div class="mb-4">
            <label for="home-filter-town" class="form-label">鄉鎮</label>
            <select id="home-filter-town" v-model="draftTown" class="form-select">
              <option :value="null">全部鄉鎮</option>
              <option v-for="town in township" :key="town.name" :value="town.name">
                {{ town.name }}
              </option>
            </select>
          </div>
          <div class="mb-4">
            <label for="home-filter-sort" class="form-label">排序方式</label>
            <select id="home-filter-sort" v-model="draftSort" class="form-select">
              <option v-for="opt in sortOptions" :key="opt.value" :value="opt.value">
                {{ opt.label }}
              </option>
            </select>
          </div>
          <div class="home-filter__actions">
            <button type="button" class="btn btn-soft" @click="resetDraftFilters">重設</button>
            <button type="submit" class="btn btn-primary">套用篩選</button>
          </div>
        </form>
      </dialog>

      <!-- 載入中 -->
      <div v-if="couponObject.pending" class="yp-grid home-grid">
        <div v-for="n in 8" :key="`skeleton-${n}`" class="yp-coupon">
          <div class="yp-coupon__media yp-skeleton" />
          <div class="yp-coupon__body">
            <span class="yp-skeleton mb-2" style="width: 70%; height: 18px" />
            <span class="yp-skeleton mb-2" style="width: 45%" />
            <span class="yp-skeleton" style="width: 85%" />
          </div>
        </div>
      </div>

      <!-- 錯誤 -->
      <div v-else-if="couponObject.error" class="yp-card yp-empty yp-empty--error">
        <div class="yp-empty__icon"><Icon name="ri:wifi-off-line" /></div>
        <p class="yp-empty__title">載入優惠券時發生問題</p>
        <p class="yp-empty__text">請檢查網路連線後再試一次。</p>
        <button type="button" class="btn btn-primary" @click="retryFetch">重新載入</button>
      </div>

      <!-- 無資料 -->
      <div
        v-else-if="!couponObject.data || couponObject?.data?.items.length === 0"
        class="yp-card yp-empty"
      >
        <div class="yp-empty__icon"><Icon name="ri:coupon-3-line" /></div>
        <p class="yp-empty__title">找不到符合條件的優惠券</p>
        <p class="yp-empty__text">試試其他關鍵字，或清除篩選條件。</p>
        <button type="button" class="btn btn-soft" @click="resetFilters">清除篩選</button>
      </div>

      <!-- 優惠券列表 -->
      <template v-else>
        <div class="yp-grid home-grid">
          <NuxtLink
            v-for="(article, index) in couponObject.data.items"
            :key="article.id"
            :to="{ name: 'articles-id', params: { id: article.id } }"
            class="yp-coupon"
            @click="trackCouponView(article.id)"
          >
            <div class="yp-coupon__media">
              <img
                v-if="article.cover?.length"
                :src="processImageSrc(article.cover[0])"
                :alt="article.title"
                width="366"
                height="183"
                :loading="index < 4 ? 'eager' : 'lazy'"
                :fetchpriority="index === 0 ? 'high' : undefined"
              />
              <span
                v-if="showRanking && index < 3"
                class="yp-coupon__rank"
                :class="{ 'yp-coupon__rank--1': index === 0 }"
              >
                <Icon v-if="index === 0" name="ph:crown-fill" />TOP {{ index + 1 }}
              </span>
              <span v-if="dealOf(article)" class="yp-coupon__deal">{{
                dealOf(article).label
              }}</span>
            </div>
            <div class="yp-coupon__body">
              <h3 class="yp-coupon__title yp-clamp-1">{{ article.title }}</h3>
              <p class="yp-coupon__meta">
                {{ getCategoryName(article.category) }}・{{ article.township?.[0] || '宜蘭' }}
                <span v-if="article.isonce" class="yp-tag yp-tag--deal ms-1">限量</span>
              </p>
              <p
                class="yp-clamp-2 mb-0"
                :class="dealOf(article) ? 'yp-coupon__offer' : 'yp-coupon__desc'"
              >
                {{ offerOf(article) }}
              </p>
              <div class="yp-coupon__footer">
                <span v-if="article.view_count"
                  ><Icon name="ri:eye-line" /> {{ formatCount(article.view_count) }}</span
                >
                <span v-else />
                <span class="yp-coupon__cta">
                  領取優惠<Icon name="ri:arrow-right-s-line" aria-hidden="true" />
                </span>
              </div>
            </div>
          </NuxtLink>
        </div>

        <nav v-if="totalPages > 1" class="yp-pager" aria-label="分頁">
          <NuxtLink
            :to="getPaginationLink(currentPage - 1)"
            class="yp-pager__btn"
            :class="{ 'is-disabled': currentPage <= 1 }"
            aria-label="上一頁"
          >
            <Icon name="ri:arrow-left-s-line" />
          </NuxtLink>
          <NuxtLink
            v-for="page in pageNumbers"
            :key="page"
            :to="getPaginationLink(page)"
            class="yp-pager__btn"
            :class="{ 'is-active': page === currentPage }"
            :aria-current="page === currentPage ? 'page' : undefined"
          >
            {{ page }}
          </NuxtLink>
          <NuxtLink
            :to="getPaginationLink(currentPage + 1)"
            class="yp-pager__btn"
            :class="{ 'is-disabled': currentPage >= totalPages }"
            aria-label="下一頁"
          >
            <Icon name="ri:arrow-right-s-line" />
          </NuxtLink>
        </nav>
      </template>

      <!-- 店家招募 -->
      <section class="home-cta">
        <div>
          <h2 class="home-cta__title">你是宜蘭在地店家嗎？</h2>
          <p class="home-cta__desc">免費刊登優惠券，讓入住合法民宿的旅客找到你。</p>
        </div>
        <NuxtLink to="/coupons/submit" class="btn btn-primary btn-pill">免費刊登優惠</NuxtLink>
      </section>
    </div>
  </div>
</template>

<script setup>
import { category, township } from '~/utils/category'
import { extractDeal, summarizeOffer } from '~/utils/coupon-deal'
import useCouponStore from '~~/store/coupon'

definePageMeta({ middleware: ['lodging-recommendation'] })
const couponCategories = category.filter((cate) => cate.id !== 'live')
const categoryLabels = { '': '全部', eat: '美食', play: '玩樂', traffic: '交通' }

// SEO 優化
const HOME_TITLE = '宜蘭旅遊通｜宜蘭優惠券、合法民宿與在地活動'
const HOME_DESCRIPTION =
  '宜蘭旅遊通由宜蘭觀光民宿行銷協會發起，免費領取宜蘭在地店家電子優惠券（伴手禮、美食、租車、湯屋），查詢合法民宿推薦與宜蘭活動，輕鬆規劃宜蘭旅程。'
useSeoMeta({
  title: HOME_TITLE,
  ogTitle: HOME_TITLE,
  twitterTitle: HOME_TITLE,
  description: HOME_DESCRIPTION,
  ogDescription: HOME_DESCRIPTION,
  twitterDescription: HOME_DESCRIPTION,
  keywords: '宜蘭優惠券,宜蘭旅遊,宜蘭民宿,合法民宿,伴手禮,租車,湯屋,宜蘭活動'
})

useHead({
  link: [
    {
      rel: 'canonical',
      href: 'https://yilanpass.com'
    },
    {
      rel: 'llms-txt',
      href: 'https://yilanpass.com/llms.txt'
    }
  ],
  script: [
    {
      key: 'home-schema',
      type: 'application/ld+json',
      innerHTML: JSON.stringify({
        '@context': 'https://schema.org',
        '@graph': [
          {
            '@type': 'Organization',
            '@id': 'https://yilanpass.com/#organization',
            name: '宜蘭旅遊通',
            founder: { '@type': 'Organization', name: '宜蘭觀光民宿行銷協會' },
            url: 'https://yilanpass.com',
            logo: 'https://yilanpass.com/logo.png',
            sameAs: ['https://lin.ee/6ymvmWV'],
            areaServed: { '@type': 'AdministrativeArea', name: '宜蘭縣' }
          },
          {
            '@type': 'WebSite',
            '@id': 'https://yilanpass.com/#website',
            name: '宜蘭旅遊通',
            url: 'https://yilanpass.com',
            inLanguage: 'zh-TW',
            publisher: { '@id': 'https://yilanpass.com/#organization' }
          }
        ]
      })
    }
  ]
})

const route = useRoute()
const router = useRouter()

const PAGE_SIZE = 12

const searchText = ref('')
const selectedTown = ref(null)
const selectedCate = ref('')
const selectedSort = ref('popular')
const filterDialog = ref(null)
const draftTown = ref(null)
const draftSort = ref('popular')
const activeFilterCount = computed(
  () => Number(Boolean(selectedTown.value)) + Number(selectedSort.value !== 'popular')
)

const sortOptions = [
  { value: 'popular', label: '熱門優先' },
  { value: 'newest', label: '最新上架' },
  { value: 'random', label: '隨機探索' }
]

const { partnerStores, partnerHotels, displayVisitorCount } = useSiteStats()

const currentPage = computed(() => {
  return Math.max(parseInt(route.query.page) || 1, 1)
})

onMounted(() => {
  // 獲取熱門標籤
  fetchHotTags()
})

const store = useCouponStore()

// 熱門標籤
const hotTag = ref(['伴手禮', '租車', '湯屋'])
const hotTagsLoading = ref(true)
// Prefer useful search topics over broad promotional words already implied by this page.
const hotSearchTags = computed(() =>
  [
    ...new Set([
      ...hotTag.value.filter((tag) => !['優惠', '活動', '特價', '免費', '限時'].includes(tag)),
      '伴手禮',
      '租車',
      '湯屋'
    ])
  ].slice(0, 3)
)

// 從 API 獲取熱門標籤
const fetchHotTags = async () => {
  try {
    const response = await $fetch('/api/hot-tags', {
      query: { limit: 5 }
    })
    if (response?.hotTags?.length) {
      hotTag.value = response.hotTags
    }
  } catch (error) {
    console.error('獲取熱門標籤失敗:', error)
    // 保持預設值
  } finally {
    hotTagsLoading.value = false
  }
}

// 記錄優惠券點擊（瀏覽量）
const trackCouponView = async (couponId) => {
  try {
    await $fetch(`/api/articles/view/${couponId}`, {
      method: 'POST'
    })
  } catch (error) {
    console.error('記錄瀏覽量失敗:', error)
    // 不影響使用者體驗，靜默失敗
  }
}

const couponObject = computed(() => store.getCouponData)

const totalPages = computed(() => {
  return couponObject.value?.data?.pagination?.totalPages || 1
})

const totalCount = computed(() => couponObject.value?.data?.pagination?.total || 0)

const pageNumbers = computed(() => {
  const total = totalPages.value
  const current = currentPage.value
  const start = Math.max(1, Math.min(current - 2, total - 4))
  const end = Math.min(total, start + 4)
  return Array.from({ length: end - start + 1 }, (_, i) => start + i)
})

const showRanking = computed(
  () => selectedSort.value === 'popular' && currentPage.value === 1 && !searchText.value
)

const listTitle = computed(() => {
  if (searchText.value) return `「${searchText.value}」的搜尋結果`
  const cate = category.find((c) => c.id === selectedCate.value)
  const prefix = selectedTown.value ? `${selectedTown.value}・` : ''
  const cateName = cate && cate.id ? `${cate.name}類` : ''
  if (selectedSort.value === 'newest') return `${prefix}${cateName}最新上架`
  return `${prefix}${cateName}${selectedSort.value === 'popular' ? '熱門優惠' : '優惠券'}`
})

let searchTimeout = null
const handleSearchInput = () => {
  if (searchTimeout) clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => {
    updateRoute({ search: searchText.value, page: 1 })
  }, 500)
}

const submitSearch = () => {
  if (searchTimeout) clearTimeout(searchTimeout)
  updateRoute({ search: searchText.value, page: 1 })
}

const categoryCache = new Map()
const getCategoryName = (cateId) => {
  if (!categoryCache.has(cateId)) {
    const found = category.find((item) => String(item.id) === String(cateId))
    categoryCache.set(cateId, found ? found.name : '未分類')
  }
  return categoryCache.get(cateId)
}

const dealCache = new Map()
const dealOf = (article) => {
  if (!dealCache.has(article.id)) {
    dealCache.set(article.id, extractDeal(article.title, article.content))
  }
  return dealCache.get(article.id)
}

const offerOf = (article) =>
  summarizeOffer(article.content, 44) || (article.isonce ? '限量優惠' : '免費領取')

const formatCount = (n) =>
  n >= 10000 ? `${(n / 10000).toFixed(1)} 萬` : Number(n).toLocaleString('zh-TW')

const processImageSrc = (img) => {
  return img.replace('https://yilanpass.com', '.')
}

const updateRoute = (queryUpdates) => {
  const newQuery = {
    cate: selectedCate.value || undefined,
    town: selectedTown.value || undefined,
    search: searchText.value || undefined,
    sort: selectedSort.value === 'popular' ? undefined : selectedSort.value,
    page: currentPage.value || undefined,
    ...queryUpdates
  }

  Object.keys(newQuery).forEach((key) => {
    if (newQuery[key] === undefined || newQuery[key] === null || newQuery[key] === '') {
      delete newQuery[key]
    }
  })

  router.push({ name: 'index', query: newQuery })
}

const getPaginationLink = (page) => {
  return {
    name: 'index',
    query: {
      ...route.query,
      page: Math.min(Math.max(page, 1), totalPages.value)
    }
  }
}

const clickTag = (tag) => {
  searchText.value = tag
  updateRoute({ search: tag, page: 1 })
}

const cleanText = () => {
  searchText.value = ''
  updateRoute({ search: undefined, page: 1 })
}

const selectCate = (id) => {
  selectedCate.value = id
  updateRoute({ cate: id, page: 1 })
}

const openFilters = () => {
  draftTown.value = selectedTown.value
  draftSort.value = selectedSort.value
  filterDialog.value?.showModal()
}

const closeFilterBackdrop = (event) => {
  if (event.target === filterDialog.value) filterDialog.value.close()
}

const resetDraftFilters = () => {
  draftTown.value = null
  draftSort.value = 'popular'
}

const applyFilters = () => {
  selectedTown.value = draftTown.value
  selectedSort.value = draftSort.value
  updateRoute({ town: selectedTown.value, sort: selectedSort.value, page: 1 })
  filterDialog.value.close()
}

const resetFilters = () => {
  searchText.value = ''
  selectedTown.value = null
  selectedCate.value = ''
  router.push({ name: 'index' })
}

const retryFetch = () => {
  fetchData()
}

const fetchData = async () => {
  try {
    await store.fetchAndSetCoupon({
      selectedCate: selectedCate.value,
      selectedTown: selectedTown.value,
      currentPage: currentPage.value,
      searchText: searchText.value,
      sort: selectedSort.value,
      pageSize: PAGE_SIZE
    })
  } catch (error) {
    console.error('載入優惠券失敗:', error)
  }
}

const syncFiltersFromQuery = (query) => {
  selectedCate.value = query.cate || ''
  selectedTown.value = query.town || null
  searchText.value = query.search || ''
  selectedSort.value = query.sort || 'popular'
}

// 第一次載入在伺服器端完成，搜尋引擎拿到的 HTML 就有優惠券清單與內頁連結
syncFiltersFromQuery(route.query)
await useAsyncData('home-coupons', async () => {
  await fetchData()
  return true
})

watch(
  () => route.query,
  async (newQuery) => {
    syncFiltersFromQuery(newQuery)
    await fetchData()
  }
)
</script>

<style lang="scss" scoped>
.home-hero {
  max-width: var(--yp-content-width, #{$yp-container});

  &__stats {
    margin-top: 18px;

    > span {
      white-space: nowrap;
    }

    b {
      display: inline-block;
      min-width: 2rem;
      font-variant-numeric: tabular-nums;
    }

    .home-hero__visitor-count {
      min-width: 4.5rem;
    }
  }
}

.home-search {
  margin-top: 20px;
  max-width: 640px;

  // Keep the labelled clear button instead of showing the browser's second X.
  .yp-search__input::-webkit-search-cancel-button {
    -webkit-appearance: none;
    display: none;
  }
}

.home-hot {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 8px;

  &__label {
    flex-shrink: 0;
    font-size: 0.8125rem;
    color: $yp-muted;
  }

  &__tag {
    flex: none;
    width: 3.5rem;
    height: 40px;
    padding: 0;
    border: 0;
    border-radius: $yp-radius-sm;
    background: transparent;
    color: $yp-primary-ink;
    font-size: 0.875rem;
    white-space: nowrap;

    &:hover:not(:disabled) {
      text-decoration: underline;
      text-underline-offset: 4px;
    }
  }
}

.home-list {
  padding-top: 20px;

  @media (min-width: $yp-bp-md) {
    // Share the Hero and site shell's content width, including page padding.
    max-width: calc(var(--yp-content-width, #{$yp-container}) + 48px);
  }
}

.home-results-head {
  gap: 16px;
  margin-bottom: 12px;

  &__title {
    display: flex;
    flex-wrap: wrap;
    align-items: baseline;
    gap: 8px;
    min-width: 0;
  }
}

.home-filter-trigger {
  display: inline-flex;
  align-items: center;
  flex-shrink: 0;
  gap: 6px;
  min-height: 40px;

  &__count {
    font-family: $yp-font-num;
    font-weight: 600;
  }
}

.home-categories {
  display: flex;
  gap: 24px;
  margin-bottom: 20px;
  border-bottom: 1px solid $yp-line;

  &__item {
    position: relative;
    min-height: 44px;
    padding: 8px 4px 12px;
    border: 0;
    background: transparent;
    color: $yp-muted;
    font-size: 1rem;
    font-weight: 500;

    &:hover {
      color: $yp-primary-ink;
    }

    &.is-active {
      color: $yp-ink;
      font-weight: 700;

      &::after {
        position: absolute;
        right: 0;
        bottom: -1px;
        left: 0;
        height: 3px;
        border-radius: $yp-radius-pill;
        background: $yp-primary;
        content: '';
      }
    }
  }

  @media (max-width: #{$yp-bp-md - 1px}) {
    justify-content: space-between;
    gap: 12px;
  }
}

.home-filter {
  width: calc(100% - 32px);
  max-width: 440px;
  max-height: 85dvh;
  margin: auto;
  padding: 0;
  border: 0;
  border-radius: $yp-radius-lg;
  background: $yp-surface;
  color: $yp-ink;
  box-shadow: $yp-shadow-lg;

  &::backdrop {
    background: rgba($yp-ink, 0.45);
  }

  &__form {
    padding: 24px;
  }

  &__head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    margin-bottom: 20px;

    h2 {
      margin: 0;
      font-size: 1.25rem;
      font-weight: 700;
    }
  }

  &__actions {
    display: flex;
    justify-content: space-between;
    gap: 12px;
  }

  @media (max-width: #{$yp-bp-md - 1px}) {
    width: 100%;
    max-width: none;
    margin: auto 0 0;
    border-radius: $yp-radius-lg $yp-radius-lg 0 0;

    &__form {
      padding-bottom: max(24px, env(safe-area-inset-bottom));
    }
  }
}

:global(body:has(.home-filter[open])) {
  overflow: hidden;
}

.home-grid {
  @media (min-width: 1600px) {
    grid-template-columns: repeat(5, minmax(0, 1fr));
  }

  .yp-coupon__cta {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 4px;
    min-height: 40px;
    padding: 0 12px;
    border: 0;
    border-radius: $yp-radius-sm;
    background: $yp-surface-2;
    font-weight: 500;
    transition: background-color 0.2s ease;
  }

  .yp-coupon:hover .yp-coupon__cta,
  .yp-coupon:focus-visible .yp-coupon__cta {
    background: $yp-primary-soft;
  }

  .yp-coupon:focus-visible {
    outline: 2px solid $yp-primary-ink;
    outline-offset: 3px;
  }

  .yp-coupon__offer {
    color: $yp-ink;
    font-weight: 400;
  }

  .yp-coupon__deal {
    background: $yp-deal-soft;
    color: $yp-deal-ink;
    font-weight: 600;
  }

  @media (max-width: #{$yp-bp-sm - 1px}) {
    gap: 12px;
  }
}

.home-cta {
  margin-top: 48px;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 24px;
  border-radius: $yp-radius-lg;
  background: linear-gradient(120deg, $yp-primary-soft, #fff1ec);

  &__title {
    font-size: 1.25rem;
    font-weight: 700;
    margin: 0 0 4px;
  }

  &__desc {
    color: $yp-muted;
    margin: 0;
  }
}
</style>
