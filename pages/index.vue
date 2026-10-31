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
            <select
              v-model="selectedTown"
              class="form-select yp-search__select d-none d-sm-block"
              aria-label="選擇鄉鎮"
              @change="clickTown"
            >
              <option :value="null">全部鄉鎮</option>
              <option v-for="town in township" :key="town.name" :value="town.name">
                {{ town.name }}
              </option>
            </select>
            <button type="submit" class="btn btn-primary d-none d-sm-inline-block">搜尋優惠</button>
          </form>

          <div class="home-hot" :aria-busy="hotTagsLoading">
            <span class="home-hot__label">熱門搜尋</span>
            <!-- Keep five equal-sized slots even when the API returns fewer tags. -->
            <button
              v-for="n in 5"
              :key="n"
              type="button"
              class="yp-chip yp-chip--sm home-hot__tag"
              :class="{
                'yp-skeleton': hotTagsLoading,
                invisible: !hotTagsLoading && !hotTag[n - 1]
              }"
              :disabled="hotTagsLoading || !hotTag[n - 1]"
              :aria-hidden="hotTagsLoading || !hotTag[n - 1] ? true : undefined"
              @click="clickTag(hotTag[n - 1])"
            >
              <span :class="{ invisible: hotTagsLoading }">{{ hotTag[n - 1] || '\u00a0' }}</span>
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
      <!-- 篩選列 -->
      <div class="yp-toolbar home-toolbar">
        <div class="yp-chips" role="tablist" aria-label="優惠類別">
          <button
            v-for="cate in couponCategories"
            :key="cate.id"
            type="button"
            role="tab"
            class="yp-chip"
            :class="{ 'is-active': selectedCate === cate.id }"
            :aria-selected="selectedCate === cate.id"
            @click="selectCate(cate.id)"
          >
            {{ cate.id === '' ? '全部' : cate.name }}
          </button>
        </div>
        <div class="d-flex align-items-center ms-auto gap-2">
          <select
            v-model="selectedTown"
            class="form-select form-select-sm d-sm-none home-toolbar__town"
            aria-label="選擇鄉鎮"
            @change="clickTown"
          >
            <option :value="null">全部鄉鎮</option>
            <option v-for="town in township" :key="town.name" :value="town.name">
              {{ town.name }}
            </option>
          </select>
          <div class="yp-seg" role="group" aria-label="排序">
            <button
              v-for="opt in sortOptions"
              :key="opt.value"
              type="button"
              class="yp-seg__btn"
              :class="{ 'is-active': selectedSort === opt.value }"
              @click="selectSort(opt.value)"
            >
              {{ opt.label }}
            </button>
          </div>
        </div>
      </div>

      <div class="yp-section-head">
        <h2 class="yp-section-head__title">{{ listTitle }}</h2>
        <span v-if="totalCount" class="text-secondary small">共 {{ totalCount }} 張</span>
      </div>

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

const sortOptions = [
  { value: 'popular', label: '熱門' },
  { value: 'newest', label: '最新' },
  { value: 'random', label: '隨機' }
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
    sort: selectedSort.value === 'random' ? undefined : selectedSort.value,
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

const selectSort = (value) => {
  selectedSort.value = value
  updateRoute({ sort: value, page: 1 })
}

const clickTown = () => {
  updateRoute({ town: selectedTown.value, page: 1 })
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
  flex-wrap: wrap;
  align-items: center;
  gap: 6px;
  margin-top: 14px;

  &__label {
    font-size: 0.8125rem;
    color: $yp-muted;
    margin-right: 4px;
  }

  &__tag {
    // API keywords are at most three characters; match the chip's padding and border.
    width: calc(3em + 26px);
    height: calc(1.4em + 10px);
    justify-content: center;
    border-radius: $yp-radius-pill;
  }
}

.home-list {
  padding-top: 20px;

  @media (min-width: $yp-bp-md) {
    // Share the Hero and site shell's content width, including page padding.
    max-width: calc(var(--yp-content-width, #{$yp-container}) + 48px);
  }
}

.home-toolbar {
  &__town {
    width: auto;
    max-width: 120px;
  }

  @media (max-width: #{$yp-bp-md - 1px}) {
    .yp-chips {
      width: 100%;
    }
  }
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
