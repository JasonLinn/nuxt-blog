<template>
  <div class="yp-page cate-page">
    <nav class="yp-breadcrumb" aria-label="目前位置">
      <NuxtLink to="/">首頁</NuxtLink>
      <span>{{ cateTitle }}</span>
    </nav>

    <header class="yp-page-head">
      <div>
        <span class="yp-page-head__eyebrow">優惠分類</span>
        <h1 class="yp-page-head__title">{{ cateTitle }}</h1>
        <p class="yp-page-head__desc">宜蘭在地店家的免費電子優惠券，手機出示就能用。</p>
      </div>
    </header>

    <!-- 搜尋 -->
    <form class="yp-search cate-search" role="search" @submit.prevent>
      <div class="yp-search__field">
        <Icon name="ri:search-line" class="yp-search__icon" />
        <input
          v-model="searchText"
          type="search"
          class="yp-search__input"
          maximum-scale="1"
          placeholder="請輸入優惠券名稱"
          aria-label="搜尋優惠券"
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
        id="township"
        v-model="selectedTown"
        class="form-select yp-search__select"
        name="township"
        aria-label="選擇地區"
      >
        <option :value="null">全部地區</option>
        <option v-for="town in township" :key="town.name" :value="town.name">
          {{ town.name }}
        </option>
      </select>
    </form>

    <div class="cate-hot">
      <span class="cate-hot__label">熱門搜尋</span>
      <button
        v-for="tag in hotTag"
        :key="tag"
        type="button"
        class="yp-chip yp-chip--sm"
        @click="clickTag"
      >
        {{ tag }}
      </button>
    </div>

    <!-- 類別篩選 -->
    <div class="yp-toolbar cate-toolbar">
      <div class="yp-chips" role="tablist" aria-label="優惠類別">
        <button
          v-for="cate in category"
          :key="cate.id"
          type="button"
          role="tab"
          class="yp-chip"
          :class="{ 'is-active': cate.id === currentCate }"
          :aria-selected="cate.id === currentCate"
          @click="selectCate(cate.id)"
        >
          {{ cate.id === '' ? '全部' : cate.name }}
        </button>
      </div>
      <span v-if="totalCount" class="text-secondary small ms-auto">共 {{ totalCount }} 張</span>
    </div>

    <!-- 載入中 -->
    <div v-if="couponObject.pending" class="yp-grid cate-grid" aria-busy="true">
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
      <button type="button" class="btn btn-primary" @click="fetchList">重新載入</button>
    </div>

    <!-- 無資料 -->
    <div
      v-else-if="!couponObject.data || couponObject?.data?.items.length === 0"
      class="yp-card yp-empty"
    >
      <div class="yp-empty__icon"><Icon name="ri:coupon-3-line" /></div>
      <p class="yp-empty__title">目前尚無最新優惠券</p>
      <p class="yp-empty__text">試試其他關鍵字或地區，或回首頁看看全部優惠。</p>
      <NuxtLink to="/" class="btn btn-soft">回首頁</NuxtLink>
    </div>

    <!-- 優惠券列表 -->
    <template v-else>
      <div class="yp-grid cate-grid">
        <NuxtLink
          v-for="(article, index) in couponObject.data.items"
          :key="article.id"
          :to="{ name: 'articles-id', params: { id: article.id } }"
          class="yp-coupon"
        >
          <div class="yp-coupon__media">
            <img
              v-if="article.cover?.length"
              :src="processImageSrc(article.cover[0])"
              :alt="article.title"
              width="366"
              height="183"
              :loading="index < 4 ? 'eager' : 'lazy'"
            />
            <span v-if="dealOf(article)" class="yp-coupon__deal">{{ dealOf(article).label }}</span>
          </div>
          <div class="yp-coupon__body">
            <h3 class="yp-coupon__title yp-clamp-1">{{ article.title }}</h3>
            <p class="yp-coupon__meta">
              {{ hadleCategory(article.category) }}・{{ article.township?.[0] || '宜蘭' }}
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
              <span class="yp-coupon__cta">領取</span>
            </div>
          </div>
        </NuxtLink>
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
import { category, township } from '~/utils/category'
import { extractDeal, summarizeOffer } from '~/utils/coupon-deal'
import useCouponStore from '~~/store/coupon'

const route = useRoute()
const currentPage = computed(() => parseInt(route?.query?.page) || 1)
const currentCate = computed(() => route?.params?.id)
const searchText = ref('')
const selectedTown = ref(null)
const selectedCate = ref(route?.params?.id)

const store = useCouponStore()

const hotTag = ['伴手禮', '租車', '湯屋']

const couponObject = computed(() => store.getCouponData)

const totalPages = computed(() => couponObject.value?.data?.pagination?.totalPages || 1)
const totalCount = computed(() => couponObject.value?.data?.pagination?.total || 0)
const pageNumbers = computed(() => {
  const total = totalPages.value
  const current = currentPage.value
  const start = Math.max(1, Math.min(current - 2, total - 4))
  const end = Math.min(total, start + 4)
  return Array.from({ length: end - start + 1 }, (_, i) => start + i)
})

const cateTitles = { eat: '美食優惠', play: '玩樂優惠', live: '住宿優惠', traffic: '交通優惠' }
const cateTitle = computed(() => {
  const id = currentCate.value
  if (cateTitles[id]) return cateTitles[id]
  const found = category.find((c) => c.id === id)
  return found ? `${found.name}類優惠` : '優惠券'
})

const fetchList = () =>
  store.fetchAndSetCoupon({
    selectedCate: selectedCate.value,
    selectedTown: selectedTown.value,
    currentPage: currentPage.value,
    searchText: searchText.value
  })

fetchList()

// 搜尋 / 地區 / 頁碼 / 類別改變時重新取得資料
watch([searchText, selectedTown, currentPage], () => {
  fetchList()
})
watch(currentCate, (id) => {
  selectedCate.value = id
  fetchList()
})

const hadleCategory = (cate) => {
  const oringal = category.find((item) => String(item.id) === String(cate))

  return oringal ? oringal.name : '未分類'
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

const processImageSrc = (img) => img.replace('https://yilanpass.com', '.')

const getPaginationLink = (page) => ({
  name: 'cate-id',
  params: { id: currentCate.value },
  query: {
    ...route.query,
    page: Math.min(Math.max(page, 1), totalPages.value)
  }
})

const clickTag = (e) => {
  searchText.value = e.target.textContent.trim()
}

const cleanText = () => {
  searchText.value = ''
}

const selectCate = (id) => {
  if (id === '') {
    navigateTo({ name: 'index' })
    return
  }
  if (id === currentCate.value) return
  selectedCate.value = id
  navigateTo({ name: 'cate-id', params: { id } })
}
</script>

<style lang="scss" scoped>
.cate-search {
  max-width: 640px;
}

.cate-hot {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px;
  margin: 14px 0 20px;

  &__label {
    font-size: 0.8125rem;
    color: $yp-muted;
    margin-right: 4px;
  }
}

.cate-toolbar {
  .yp-chips {
    max-width: 100%;
  }
}

.cate-grid {
  @media (max-width: #{$yp-bp-sm - 1px}) {
    gap: 12px;
  }
}
</style>
