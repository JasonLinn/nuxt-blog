<template>
    <div class="flex container">
      <div class="selectWrapper">
        <select class="category flex col-4 form-select" v-model="selectedCate" @change="clickCate">
          <option value="">全</option>
          <option
            v-for="cate in categoryRelative" class="category-item"
            :id="cate.id"
            :value="cate.id"
          >
            {{ cate.name }}
          </option>
        </select>
      </div>
      <div class="col-12">
        <div class="search">
          <input 
            type="text" 
            class="searchInput form-control" 
            maximum-scale="1" 
            placeholder="請輸入關鍵字" 
            v-model="searchText" 
            @input="handleSearchInput"
            @keyup.enter="updateRoute({ search: searchText, page: 1 })"
          >
          <svg
            v-if="searchText"
            @click="cleanText"
            xmlns="http://www.w3.org/2000/svg" 
            width="25" 
            height="25" 
            fill="currentColor" 
            class="bi bi-x cancel-icon" 
            viewBox="0 0 16 16"
          >
            <path d="M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708.708L8.707 8l2.647 2.646a.5.5 0 0 1-.708.708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708"/>
          </svg>
          <svg 
            v-else 
            xmlns="http://www.w3.org/2000/svg" 
            width="18" 
            height="18" 
            fill="currentColor" 
            class="bi bi-search search-icon" 
            viewBox="0 0 16 16" 
            @click="updateRoute({ search: searchText, page: 1 })"
          >
            <path d="M11.742 10.344a6.5 6.5 0 1 0-1.397 1.398h-.001q.044.06.098.115l3.85 3.85a1 1 0 0 0 1.415-1.414l-3.85-3.85a1 1 0 0 0-.115-.1zM12 6.5a5.5 5.5 0 1 1-11 0 5.5 5.5 0 0 1 11 0"/>
          </svg>
        </div>
        <div class="tag-list">
          <h2 class="tag-title">熱門:</h2>
          <span 
            class="hot-tag" 
            v-for="tag in hotTag" 
            :key="tag"
            @click="clickTag(tag)"
          >
            {{ tag }}
          </span>
        </div>
      </div>
      <div class="my-8 flex w-full max-w-4xl flex-col">
        <!-- Loading 狀態 -->
        <div v-if="isLoading || relativeObject?.pending" class="loading-container">
          <Icon class="h-8 w-8 text-gray-500 animate-spin" name="eos-icons:loading" />
          <span class="ml-2 text-gray-500">載入中...</span>
        </div>
        
        <!-- 錯誤狀態 -->
        <div v-else-if="relativeObject?.error" class="error-container">
          <span class="text-gray-500">發生了一點錯誤，請稍後再嘗試</span>
          <p class="my-2 text-rose-500">{{ relativeObject?.error }}</p>
          <button @click="retryFetch" class="retry-btn">重試</button>
        </div>
        
        <!-- 無數據狀態 -->
        <div v-else-if="!relativeObject?.data || relativeObject?.data?.items.length === 0" class="no-data-container">
          <span class="text-gray-500">目前尚無相關店家</span>
        </div>
        
        <!-- 數據展示 -->
        <div v-else class="md:border-l md:border-gray-100">
            <div class="row">
              <article
                v-for="article in relativeObject?.data.items"
                :key="article.id"
                class="cupon col-md-3"
              >
              <div class="cupon-wrapper">
                <NuxtLink
                  class=""
                  :to="{
                    name: 'relative_shop-id',
                    params: {
                      id: article.id
                    }
                  }"
                >
                <Carousel>
                    <Slide v-for="(img, index) in article.cover" :key="`${article.id}-${index}`">
                      <img 
                        :src="processImageSrc(img)" 
                        class="cupon-img" 
                        height="165" 
                        :alt="article.title"
                        loading="lazy"
                      />
                    </Slide>

                    <template #addons="{ slidesCount }">
                      <Pagination v-if="slidesCount > 1" />
                    </template>
                </Carousel>
                  <div class="cupon-info">
                    <h2 class="cupon-title">
                      <span>{{ article.title }}</span>
                    </h2>
                    <span class="cupon-category">
                      {{ getCategoryName(article.category) }}
                    </span>
                    <!-- <time class="order-first mb-3 flex items-center text-sm text-gray-400 md:hidden">
                      {{ date2LocaleString(article.updated_at) }}
                    </time> -->
                    <div class="index-cupon-text" v-html="formatContent(article.content, 300)">
                    </div>
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
        </div>
  
        <!-- 優化的分頁功能 -->
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
              {{ currentPage - 1 }}
            </NuxtLink>
            
            <label class="now-page">{{ currentPage }}</label>
            
            <NuxtLink
              v-if="currentPage < totalPages"
              class="flex items-center text-xl font-medium text-gray-600 hover:text-emerald-500"
              :to="getPaginationLink(currentPage + 1)"
            >
              {{ currentPage + 1 }}
              <Icon name="ri:arrow-right-s-line" />
            </NuxtLink>
          </div>
        </nav>
      </div>
    </div>
  </template>
  
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
    line-height: 1.4;
  }
  .cupon-info {
    padding: 13px 8px 15px 8px;
    background-color: #fff;
  }
  .cupon-img-wrapper {
    overflow: hidden;
  }
  .cupon-img {
    display: inline-block;
    width: 100%;
    object-fit: cover;
    border-radius: 10px;
    height: auto;
  }
  .cupon-category {
    display: inline-block;
    font-size: 14px;
    padding: 3px;
    // color: rgb(117, 117, 117);
    color: #36a1fa;
    background-color: rgba(100,179,244,.1);
    margin: 10px 0;
    margin-left: -2px;
    margin-right: 10px;
  }
  .index-cupon-text {
    color: #272727;
    font-size: 14px;
    overflow: hidden;
    height: 1.2em; /* 約三行文字高度 */
    position: relative;
    display: -webkit-box;
    -webkit-line-clamp: 1; /* 顯示三行 */
    -webkit-box-orient: vertical;
    text-overflow: ellipsis;
    white-space: nowrap;
        align-content: flex-end;
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
      margin: 5px 0;
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
    height: 190px;
  }
  </style>
  
  <script setup>
import { categoryRelative } from '~/utils/category'
import useRelativeStore from "~~/store/relative"

// SEO 優化
useSeoMeta({
  title: '特色店家 - 探索精選商家',
  ogTitle: '特色店家 - 探索精選商家',
  description: '探索宜蘭特色店家，包含魔術表演、派對策劃等精彩服務',
  ogDescription: '探索宜蘭特色店家，包含魔術表演、派對策劃等精彩服務',
  keywords: '特色店家,宜蘭,魔術,派對,服務,商家'
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

  // 防抖搜索
  let searchTimeout = null
  const handleSearchInput = () => {
    if (searchTimeout) clearTimeout(searchTimeout)
    searchTimeout = setTimeout(() => {
      updateRoute({ search: searchText.value, page: 1 })
    }, 500)
  }
  
  // 優化的函數，使用緩存
  const categoryCache = new Map()
  const getCategoryName = (cateId) => {
    if (!categoryCache.has(cateId)) {
      const found = categoryRelative.find((item) => item.id == cateId)
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
    Object.keys(newQuery).forEach(key => {
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
        page: page
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
  
  const clickCate = () => {
    updateRoute({ cate: selectedCate.value, page: 1 })
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
  watch(() => route.query, async (newQuery) => {
    selectedCate.value = newQuery.cate || ''
    searchText.value = newQuery.search || ''
    
    await fetchData()
  }, { immediate: true })
  
  // 日期格式化函數
  const date2LocaleString = (date) => {
    return new Date(date).toLocaleString('zh-TW')
  }
  
  // 優化的內容處理函數
  const formatContent = (content, maxLength = 300) => {
    if (!content) return ''
    
    // 移除HTML標籤並截取文本
    const textContent = content.replace(/<[^>]*>/g, '').replace(/\n/g, ' ')
    return textContent.length > maxLength 
      ? textContent.substring(0, maxLength) + '...'
      : textContent
  }
  </script>
  