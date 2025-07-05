<template>
  <div class="flex container">
    <div class="selectWrapper">
      <select class="category flex col-4 form-select" v-model="selectedCate" @change="clickCate">
        <!-- <option class="category-item active" value="index" defalut>
          全
        </option> -->
        <option
          v-for="cate in category"
          class="category-item"
          :key="cate.id"
          :id="cate.id"
          :value="cate.id"
        >
          {{ cate.name }}
        </option>
      </select>
      <select class="form-select col-4 category" name="township" id="township" v-model="selectedTown" @change="clickTown">
        <option :value="null">選擇地區</option>
        <option v-for="town in township" :key="town.name" :value="town.name">{{ town.name }}</option>
      </select>
    </div>
    <div class="search">
        <input type="text" class="searchInput form-control" maximum-scale="1" placeholder="請輸入優惠券名稱" v-model="searchText" @input="handleSearchInput">
        <svg
          v-if="searchText"
          @click="cleanText"
          xmlns="http://www.w3.org/2000/svg" width="25" height="25" fill="currentColor" class="bi bi-x cancel-icon" viewBox="0 0 16 16">
          <path d="M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708.708L8.707 8l2.647 2.646a.5.5 0 0 1-.708.708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708"/>
        </svg>
        <svg v-else xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="currentColor" class="bi bi-search search-icon" viewBox="0 0 16 16">
          <path d="M11.742 10.344a6.5 6.5 0 1 0-1.397 1.398h-.001q.044.06.098.115l3.85 3.85a1 1 0 0 0 1.415-1.414l-3.85-3.85a1 1 0 0 0-.115-.1zM12 6.5a5.5 5.5 0 1 1-11 0 5.5 5.5 0 0 1 11 0"/>
        </svg>
      </div>
    <div class="col-12">
      <div class="tag-list">
        <h2 class="tag-title">
          熱門:
        </h2>
        <span class="hot-tag" v-for="tag in hotTag" :key="tag" @click="clickTag(tag)">
          {{ tag }}
        </span>
      </div>
    </div>
    <div class="my-8 flex w-full max-w-4xl flex-col">
      <div v-if="couponObject.pending" class="loading-container">
        <Icon class="h-8 w-8 text-gray-500 animate-spin" name="eos-icons:loading" />
        <span class="ml-2 text-gray-500">載入中...</span>
      </div>
      <div v-else-if="couponObject.error" class="error-container">
        <span class="text-gray-500">發生了一點錯誤，請稍後再嘗試</span>
        <p class="my-2 text-rose-500">{{ couponObject.error }}</p>
        <button @click="retryFetch" class="retry-btn">重試</button>
      </div>
      <div v-else-if="!couponObject.data || couponObject?.data?.items.length === 0" class="no-data-container">
        <span class="text-gray-500">目前尚無相關優惠券</span>
      </div>
      <div v-else class="md:border-l md:border-gray-100">
        <div class="row">
          <article
            v-for="article in couponObject.data.items"
            :key="article.id"
            class="cupon col-md-3"
          >
            <div class="cupon-wrapper">
              <NuxtLink
                class=""
                :to="{
                  name: 'articles-id',
                  params: {
                    id: article.id
                  }
                }"
                @click="trackCouponView(article.id)"
              >
                <Carousel>
                  <Slide v-for="(img, index) in article.cover" :key="`${article.id}-${index}`">
                    <img
                      :alt="article.title"
                      height="165"
                      width="366"
                      format="webp"
                      :src="processImageSrc(img)"
                      class="cupon-img"
                      placeholder-class="card"
                      loading="lazy"
                    />
                  </Slide>

                  <template #addons="{ slidesCount }">
                    <Pagination v-if="slidesCount > 1" />
                  </template>
                </Carousel>
                <!-- <div class="cupon-img-wrapper">
                </div> -->
                <div class="cupon-info">
                  <h2 class="cupon-title">
                    <span class="">{{ article.title }}</span>
                  </h2>
                  <span class="cupon-category">
                    {{ getCategoryName(article.category) }}
                  </span>
                  <span class="cupon-category">
                    {{ article.township[0] }}
                  </span>
                  <span class="cupon-category" :class="{'cupon-once': article.isonce}">
                    {{ article.isonce ? '限量' : '免費' }}
                  </span>
                  <!-- <time class="order-first mb-3 flex items-center text-sm text-gray-400 md:hidden">
                    {{ date2LocaleString(article.updated_at) }}
                  </time> -->
                  <p class="index-cupon-text">
                    {{ truncateContent(article.content) }}
                  </p>
                </div>
                <!-- <span
                  aria-hidden="true"
                  class="mt-4 flex items-center text-sm font-medium text-emerald-500"
                >
                  看更多
                  <Icon name="ri:arrow-right-s-line" />
                </span> -->
              </NuxtLink>
            </div>
              <!-- <time class="order-first mb-3 mt-1 hidden items-center text-sm text-gray-400 md:flex">
                {{ date2LocaleString(article.updated_at) }}
              </time> -->
          </article>
        </div>
        <nav
          class="mt-12 flex items-center justify-between px-4 py-3 sm:px-6"
          v-if="totalPages > 1"
        >
          <div class="next-page flex flex-1 justify-center sm:justify">
            <NuxtLink
              v-if="currentPage > 1"
              class="flex items-center text-xl font-medium text-gray-600 hover:text-emerald-500"
              :to="getPaginationLink(currentPage - 1)"
            >
              <Icon name="ri:arrow-left-s-line" />
              {{ currentPage -1 }}
            </NuxtLink>
            <label class="now-page">{{ currentPage }}</label>
            <NuxtLink
              v-if="currentPage < totalPages"
              class="flex items-center text-xl font-medium text-gray-600 hover:text-emerald-500"
              :to="getPaginationLink(currentPage + 1)"
            >
              {{ currentPage +1 }}
              <Icon name="ri:arrow-right-s-line" />
            </NuxtLink>
          </div>

        </nav>
      </div>
    </div>
  </div>
</template>

<script setup>
import { category, township } from '~/utils/category'
import useCouponStore from "~~/store/coupon"

// SEO 優化
useSeoMeta({
  title: '優惠券列表 - 探索最新優惠',
  ogTitle: '優惠券列表 - 探索最新優惠',
  description: '探索宜蘭最新的優惠券和特價活動，包含伴手禮、租車、湯屋等各類優惠',
  ogDescription: '探索宜蘭最新的優惠券和特價活動，包含伴手禮、租車、湯屋等各類優惠',
  keywords: '優惠券,宜蘭,伴手禮,租車,湯屋,特價,活動'
})

const route = useRoute()
const router = useRouter()

const searchText = ref('')
const selectedTown = ref(null)
const selectedCate = ref('')

const currentPage = computed(() => {
  return Math.max(parseInt(route.query.page) || 1, 1)
})

onMounted(() => {
  selectedCate.value = route.query.cate || ''
  selectedTown.value = route.query.town || null
  searchText.value = route.query.search || ''

  // 獲取熱門標籤
  fetchHotTags()
})

const store = useCouponStore()

// 熱門標籤
const hotTag = ref(['伴手禮', '租車', '湯屋'])

// 從 API 獲取熱門標籤
const fetchHotTags = async () => {
  try {
    const response = await $fetch('/api/hot-tags', {
      query: { limit: 3 }
    })
    if (response?.hotTags?.length) {
      hotTag.value = response.hotTags
    }
  } catch (error) {
    console.error('獲取熱門標籤失敗:', error)
    // 保持預設值
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

let searchTimeout = null
const handleSearchInput = () => {
  if (searchTimeout) clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => {
    updateRoute({ search: searchText.value, page: 1 })
  }, 500)
}

const categoryCache = new Map()
const getCategoryName = (cateId) => {
  if (!categoryCache.has(cateId)) {
    const found = category.find((item) => item.id == cateId)
    categoryCache.set(cateId, found ? found.name : '未分類')
  }
  return categoryCache.get(cateId)
}

const processImageSrc = (img) => {
  return img.replace('https://yilanpass.com', '.')
}

const truncateContent = (content) => {
  return content.replace(/\n/g, ' ').substring(0, 300)
}

const updateRoute = (queryUpdates) => {
  const newQuery = {
    cate: selectedCate.value || undefined,
    town: selectedTown.value || undefined,
    search: searchText.value || undefined,
    page: currentPage.value || undefined,
    ...queryUpdates
  }
  
  Object.keys(newQuery).forEach(key => {
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
      page: page
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

const clickCate = () => {
  updateRoute({ cate: selectedCate.value, page: 1 })
}

const clickTown = () => {
  updateRoute({ town: selectedTown.value, page: 1 })
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
      searchText: searchText.value
    })
  } catch (error) {
    console.error('載入優惠券失敗:', error)
  }
}

watch(() => route.query, async (newQuery) => {
  selectedCate.value = newQuery.cate || ''
  selectedTown.value = newQuery.town || null
  searchText.value = newQuery.search || ''
  
  await fetchData()
}, { immediate: true })

const date2LocaleString = (date) => {
  return new Date(date).toLocaleString('zh-TW')
}
</script>
<style lang="scss" scoped>
.active {
  background-color: #ffefd2;
}
.selectWrapper {
  display: flex;
  gap: 10px;
  margin-bottom: 15px;
}
.category {
  display: flex;
  flex-direction: row;
  font-size: 16px;
  margin: 10px 0;
  background-color: #fff;
  width: fit-content;
  min-width: 150px;
}
.category-item {
  padding: 10px;
}
.loading-container {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px;
}
.error-container {
  text-align: center;
  padding: 40px;
}
.retry-btn {
  margin-top: 10px;
  padding: 8px 16px;
  background-color: #3b82f6;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}
.retry-btn:hover {
  background-color: #2563eb;
}
.no-data-container {
  text-align: center;
  padding: 40px;
}
.next-page {
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 16px;
}
.now-page {
  padding: 8px 12px;
  margin: 0 10px;
  background-color: #f1f1f1;
  border-radius: 4px;
  font-weight: bold;
}

.cupon {
}
.cupon-wrapper {
  overflow: hidden;
  margin-bottom: 20px;
}
.cupon-title {
  font-size: 16px;
  font-weight: 800;
  color: #613030;
  line-height: 1.4;
}
.cupon-info {
  padding: 13px 8px 15px 8px;
  background-color: #fff;
}
.cupon-info:hover {
  box-shadow: #000;
}
.cupon-img-wrapper {
  overflow: hidden;
}
.cupon-img {
  display: inline-block;
  object-fit: cover;
  border-radius: 10px;
}
.cupon-category {
  display: inline-block;
  font-size: 14px;
  padding: 4px 8px;
  color: #5db0be;
  background-color: rgba(100,179,244,.1);
  margin: 10px 5px 10px 0;
  border-radius: 4px;
}
.cupon-once {
  background-color: #ffdcdc8a;
  color: #ff9246;
}
.index-cupon-text {
  color: #272727;
  font-size: 14px;
  line-height: 1.5;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.search {
  position: relative;
  margin-bottom: 15px;
}
.searchInput {
  font-size: 16px;
  width: 100%;
  padding-right: 35px;
}
.cancel-icon, .search-icon {
  position: absolute;
  right: 8px;
  top: 50%;
  transform: translateY(-50%);
  cursor: pointer;
}
.tag-title {
  display: inline-block;
  font-size: 14px;
  font-weight: bold;
  margin-right: 10px;
}
.tag-list {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  margin-bottom: 20px;
}
.hot-tag {
  background-color: #ffe9ac69;
  border-radius: 6px;
  padding: 6px 10px;
  margin: 5px 5px 5px 0;
  font-size: 12px;
  display: inline-block;
  color: #222222;
  cursor: pointer;
  transition: all 0.2s ease;
}
.hot-tag:hover {
  background-color: #ffe9ac;
  transform: translateY(-1px);
}

// 響應式設計優化
@media (max-width: 768px) {
  .selectWrapper {
    flex-direction: column;
  }
  
  .category {
    width: 100%;
    margin: 5px 0 -5px 0;
  }
  
  .pagination-info {
    display: none;
  }
  
  .cupon {
    margin-bottom: 15px;
  }
  
  .next-page {
    font-size: 14px;
  }
}

// 移除不必要的 will-change 屬性

// 提升點擊體驗
.hot-tag, .retry-btn {
  user-select: none;
  -webkit-tap-highlight-color: transparent;
}
.carousel__slide {
  height: 165px;
}
</style>
<style>
.carousel__pagination {
    position: absolute;
    right: 0;
    left: 0;
    bottom: 10px;
}
</style>