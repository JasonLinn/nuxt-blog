<template>
  <div class="yp-page">
    <nav class="yp-breadcrumb" aria-label="breadcrumb">
      <NuxtLink to="/">首頁</NuxtLink><span>代訂服務</span>
    </nav>
    <header class="yp-page-head">
      <div>
        <span class="yp-page-head__eyebrow">在地特色服務</span>
        <h1 class="yp-page-head__title">宜蘭特色店家</h1>
        <p class="yp-page-head__desc">外燴、烤肉、體驗活動，一站式代訂更省心。</p>
      </div>
    </header>

    <!-- 搜尋 -->
    <form class="yp-search relative-search" role="search" @submit.prevent="submitSearch">
      <div class="yp-search__field">
        <Icon name="ri:search-line" class="yp-search__icon" />
        <input
          v-model="searchText"
          type="search"
          class="yp-search__input"
          placeholder="請輸入關鍵字"
          aria-label="搜尋特色店家"
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
      <button type="submit" class="btn btn-primary d-none d-sm-inline-block">搜尋</button>
    </form>

    <!-- 篩選列 -->
    <div class="yp-toolbar relative-toolbar">
      <div class="yp-chips" role="tablist" aria-label="服務類別">
        <button
          type="button"
          role="tab"
          class="yp-chip"
          :class="{ 'is-active': !selectedCate }"
          :aria-selected="!selectedCate"
          @click="selectCate('')"
        >
          全部
        </button>
        <button
          v-for="cate in categoryRelative"
          :key="cate.id"
          type="button"
          role="tab"
          class="yp-chip"
          :class="{ 'is-active': selectedCate === cate.id }"
          :aria-selected="selectedCate === cate.id"
          @click="selectCate(cate.id)"
        >
          {{ cate.name }}
        </button>
      </div>
      <div class="yp-toolbar__group">
        <span class="small text-secondary">熱門</span>
        <button
          v-for="tag in hotTag"
          :key="tag"
          type="button"
          class="yp-chip yp-chip--sm"
          @click="clickTag(tag)"
        >
          {{ tag }}
        </button>
      </div>
    </div>

    <!-- 載入中 -->
    <div v-if="isLoading || relativeObject?.pending" class="yp-grid yp-grid--3">
      <div v-for="n in 6" :key="`skeleton-${n}`" class="yp-card">
        <div class="yp-card__media yp-skeleton" />
        <div class="yp-card__body">
          <span class="yp-skeleton mb-2" style="width: 70%; height: 20px" />
          <span class="yp-skeleton mb-2" style="width: 30%; height: 18px" />
          <span class="yp-skeleton" style="width: 90%" />
        </div>
      </div>
    </div>

    <!-- 錯誤 -->
    <div v-else-if="relativeObject?.error" class="yp-card yp-empty yp-empty--error">
      <div class="yp-empty__icon"><Icon name="ri:wifi-off-line" /></div>
      <p class="yp-empty__title">發生了一點錯誤</p>
      <p class="yp-empty__text">請稍後再嘗試。</p>
      <button type="button" class="btn btn-primary" @click="retryFetch">重新載入</button>
    </div>

    <!-- 無資料 -->
    <div
      v-else-if="!relativeObject?.data || relativeObject?.data?.items.length === 0"
      class="yp-card yp-empty"
    >
      <div class="yp-empty__icon"><Icon name="ri:store-2-line" /></div>
      <p class="yp-empty__title">目前尚無相關店家</p>
      <p class="yp-empty__text">試試其他關鍵字，或切換服務類別。</p>
      <button type="button" class="btn btn-soft" @click="resetFilters">清除篩選</button>
    </div>

    <!-- 店家列表 -->
    <template v-else>
      <div class="yp-grid yp-grid--3 relative-grid">
        <article
          v-for="(article, cardIndex) in relativeObject?.data.items"
          :key="article.id"
          class="yp-card yp-card--hover relative-card"
        >
          <NuxtLink
            class="relative-card__link"
            :to="{
              name: 'relative_shop-id',
              params: {
                id: article.id
              }
            }"
          >
            <div class="yp-card__media relative-card__media">
              <Carousel v-if="article.cover?.length">
                <Slide v-for="(img, index) in article.cover" :key="`${article.id}-${index}`">
                  <img
                    :src="processImageSrc(img)"
                    :alt="article.title"
                    :loading="cardIndex < 3 && index === 0 ? 'eager' : 'lazy'"
                  />
                </Slide>

                <template #addons="{ slidesCount }">
                  <Pagination v-if="slidesCount > 1" />
                </template>
              </Carousel>
              <div v-else class="relative-card__placeholder">
                <Icon name="ri:image-line" />
              </div>
            </div>
            <div class="yp-card__body">
              <h2 class="yp-card__title yp-clamp-1">{{ article.title }}</h2>
              <div class="yp-tags mt-2">
                <span class="yp-tag yp-tag--primary">{{ getCategoryName(article.category) }}</span>
              </div>
              <p class="yp-card__meta yp-clamp-2">{{ formatContent(article.content, 300) }}</p>
            </div>
          </NuxtLink>
        </article>
      </div>

      <!-- 分頁 -->
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
  </div>
</template>

<script setup>
import { categoryRelative } from '~/utils/category'
import useRelativeStore from '~~/store/relative'

// SEO 優化
useSeoMeta({
  title: '特色店家 - 宜蘭旅遊通',
  ogTitle: '特色店家 - 宜蘭旅遊通',
  description: '探索宜蘭特色店家，包含魔術表演、派對策劃等精彩服務',
  ogDescription: '探索宜蘭特色店家，包含魔術表演、派對策劃等精彩服務',
  keywords: '特色店家,宜蘭,魔術,派對,服務,商家',
  canonical: 'https://yilanpass.com/relative'
})

useHead({
  link: [
    {
      rel: 'canonical',
      href: 'https://yilanpass.com/relative'
    }
  ]
})

const route = useRoute()
const router = useRouter()

// 響應式狀態
const searchText = ref('')
const selectedCate = ref('')
const isLoading = ref(false)

// 從 URL 查詢參數初始化
const currentPage = computed(() => {
  return Math.max(parseInt(route.query.page) || 1, 1)
})

// 初始化選中的分類
onMounted(() => {
  selectedCate.value = route.query.cate || ''
  searchText.value = route.query.search || ''
})

const store = useRelativeStore()

// 熱門標籤
const hotTag = ['魔術', '派對']

// 計算屬性
const relativeObject = computed(() => store.getRelativeData)

const totalPages = computed(() => {
  return relativeObject.value?.data?.pagination?.totalPages || 1
})

const pageNumbers = computed(() => {
  const total = totalPages.value
  const current = currentPage.value
  const start = Math.max(1, Math.min(current - 2, total - 4))
  const end = Math.min(total, start + 4)
  return Array.from({ length: end - start + 1 }, (_, i) => start + i)
})

// 防抖搜索
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

// 優化的函數，使用緩存
const categoryCache = new Map()
const getCategoryName = (cateId) => {
  if (!categoryCache.has(cateId)) {
    const found = categoryRelative.find((item) => String(item.id) === String(cateId))
    categoryCache.set(cateId, found ? found.name : '未分類')
  }
  return categoryCache.get(cateId)
}

// 圖片處理優化
const processImageSrc = (img) => {
  return img
}

// 統一的路由更新函數
const updateRoute = (queryUpdates) => {
  const newQuery = {
    cate: selectedCate.value || undefined,
    search: searchText.value || undefined,
    page: currentPage.value || undefined,
    ...queryUpdates
  }

  // 移除空值
  Object.keys(newQuery).forEach((key) => {
    if (newQuery[key] === undefined || newQuery[key] === null || newQuery[key] === '') {
      delete newQuery[key]
    }
  })

  router.push({ name: 'relative', query: newQuery })
}

// 分頁鏈接生成
const getPaginationLink = (page) => {
  return {
    name: 'relative',
    query: {
      ...route.query,
      page: Math.min(Math.max(page, 1), totalPages.value)
    }
  }
}

// 事件處理函數
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

const resetFilters = () => {
  searchText.value = ''
  selectedCate.value = ''
  router.push({ name: 'relative' })
}

const retryFetch = () => {
  fetchData()
}

// 數據獲取函數
const fetchData = async () => {
  isLoading.value = true
  try {
    await store.fetchAndSetRelative({
      searchText: searchText.value,
      cate: selectedCate.value,
      currentPage: currentPage.value
    })
  } finally {
    isLoading.value = false
  }
}

// 監聽路由變化
watch(
  () => route.query,
  async (newQuery) => {
    selectedCate.value = newQuery.cate || ''
    searchText.value = newQuery.search || ''

    await fetchData()
  },
  { immediate: true }
)

// 內容處理函數（移除 HTML 標籤並截取文字）
const formatContent = (content, maxLength = 300) => {
  if (!content) return ''

  const textContent = content.replace(/<[^>]*>/g, '').replace(/\n/g, ' ')
  return textContent.length > maxLength ? textContent.substring(0, maxLength) + '...' : textContent
}
</script>

<style lang="scss" scoped>
.relative-search {
  max-width: 640px;
  margin-bottom: 20px;
  box-shadow: $yp-shadow;
  border: 1px solid $yp-line;
}

.relative-toolbar {
  .yp-chips {
    flex: 1 1 auto;
    min-width: 0;
  }

  @media (max-width: #{$yp-bp-md - 1px}) {
    .yp-chips {
      width: 100%;
    }
  }
}

.relative-grid {
  @media (max-width: #{$yp-bp-sm - 1px}) {
    gap: 12px;
  }
}

.relative-card {
  &__link {
    display: block;
    color: inherit;
    text-decoration: none;
  }

  &__media {
    :deep(.carousel),
    :deep(.carousel__viewport),
    :deep(.carousel__track),
    :deep(.carousel__slide) {
      height: 100%;
    }

    :deep(.carousel__pagination) {
      position: absolute;
      left: 0;
      right: 0;
      bottom: 4px;
      margin: 0;
      padding: 0;
    }
  }

  &__placeholder {
    height: 100%;
    display: grid;
    place-items: center;
    font-size: 40px;
    color: $yp-subtle;
  }
}
</style>
