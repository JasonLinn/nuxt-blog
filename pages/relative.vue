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
          <input type="text" class="searchInput form-control" maximum-scale="1" placeholder="請輸入關鍵字" v-model="searchText" @keyup.enter="inputText">
          <svg
            v-if="searchText"
            @click="cleanText"
            xmlns="http://www.w3.org/2000/svg" width="25" height="25" fill="currentColor" class="bi bi-x cancel-icon" viewBox="0 0 16 16">
            <path d="M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708.708L8.707 8l2.647 2.646a.5.5 0 0 1-.708.708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708"/>
          </svg>
          <svg v-else xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="currentColor" class="bi bi-search search-icon" viewBox="0 0 16 16" @click="inputText">
            <path d="M11.742 10.344a6.5 6.5 0 1 0-1.397 1.398h-.001q.044.06.098.115l3.85 3.85a1 1 0 0 0 1.415-1.414l-3.85-3.85a1 1 0 0 0-.115-.1zM12 6.5a5.5 5.5 0 1 1-11 0 5.5 5.5 0 0 1 11 0"/>
          </svg>
        </div>
        <div class="tag-list">
          <h2 class="tag-title">
            熱門:
          </h2>
          <span class="hot-tag" v-for="tag in hotTag" @click="clickTag">
            {{ tag }}
          </span>
        </div>
      </div>
      <div class="my-8 flex w-full max-w-4xl flex-col">
        <div v-if="relativeObject?.pending">
          <Icon class="h-6 w-6 text-gray-500" name="eos-icons:loading" />
        </div>
        <template v-else>
          <div v-if="relativeObject?.error">
            <span class="text-gray-500">發生了一點錯誤，請稍後再嘗試</span>
            <p class="my-2 text-rose-500">{{ relativeObject?.error }}</p>
          </div>
          <div v-else-if="!relativeObject?.data || relativeObject?.data?.items.length === 0">
            <span class="text-gray-500">目前尚無最新優惠券</span>
          </div>
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
                    <Slide v-for="img in article.cover" :key="img">
                      <img :src="img" class="cupon-img" height="165" />
                    </Slide>

                    <template #addons="{ slidesCount }">
                      <!-- <Navigation v-if="slidesCount > 1" /> -->
                      <Pagination v-if="slidesCount > 1" />
                    </template>
                </Carousel>
                  <div class="cupon-info">
                    <h2 class="cupon-title">
                      <span class="">{{ article.title }}</span>
                    </h2>
                    <span class="cupon-category">
                      {{ hadleCategory(article.category) }}
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
        </template>
  
        <!-- @@@@@分頁功能在此@@@@ -->
        <nav
          v-if="relativeObject?.data"
          class="mt-12 flex items-center justify-between px-4 py-3 sm:px-6"
        >
          <div class="next-page flex flex-1 justify-center sm:justify">
            <NuxtLink
              v-if="currentPage > 1"
              class="flex items-center text-xl font-medium text-gray-600 hover:text-emerald-500"
              @click="handlePageChange(currentPage - 1)"
              :to="{
                name: 'relative',
                query: {
                  cate: selectedCate,
                  page: currentPage - 1
                }
              }"
            >
              <Icon name="ri:arrow-left-s-line" />
              {{ currentPage - 1 }}
            </NuxtLink>
            <label class="now-page">{{ currentPage }}</label>
            <NuxtLink
              v-if="relativeObject?.data?.items.length == 10"
              class="flex items-center text-xl font-medium text-gray-600 hover:text-emerald-500"
              @click="handlePageChange(currentPage + 1)"
              :to="{
                name: 'relative',
                query: {
                  cate: selectedCate,
                  page: currentPage + 1
                }
              }"
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
  }
  .category {
    display: flex;
    flex-direction: row;
    font-size: 16px;
    margin: 10px 10px 10px 0;
    background-color: #fff;
    width: fit-content;
  }
  .category-item {
    padding: 10px;
  }
  .next-page {
    display: flex;
    justify-content: center;
    align-items: center;
    font-size: 16px;
  }
  .now-page {
    padding: 5px;
    margin: 0 10px;
    background-color: #f1f1f1;
    border-radius: 50%;
  }
  .cupon {
  }
  .cupon-wrapper {
    overflow: hidden;
    margin-bottom: 20px;
  }
  .cupon-wrapper:hover {
    // box-shadow: rgba(100, 100, 111, 0.2) 0px 7px 29px 0px;
  }
  .cupon-title {
    font-size: 16px;
    font-weight: 800;
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
  }
  .searchInput {
    font-size: 16px;
    width: 100%;
  }
  .cancel-icon {
    position: absolute;
    right: 3px;
    top: 6px;
  }
  .search-icon {
    position: absolute;
    right: 8px;
    top: 8px;
    cursor: pointer;
  }
  .tag-title {
    display: inline-block;
    font-size: 14px;
    font-weight: bold;
  }
  .tag-list {
    display: flex;
    align-items: center;
  }
  .hot-tag {
    background-color: #ffe9ac69;
    border-radius: 6px;
    padding: 5px;
    margin: 10px 3px;
    font-size: 12px;
    display: inline-block;
    color: #222222;
  }
  .carousel__slide {
    height: 190px;
  }
  </style>
  
  <script setup>
  import { categoryRelative } from '~/utils/category';
  import useRelativeStore from "~~/store/relative";
  import { watch } from 'vue';
  // const handleLogout = store.resetUser;
  
  const route = useRoute()
  const currentPage = ref(parseInt(route?.query?.page) || 1)
  const currentCate = computed(() => route?.query?.cate)
  const searchText = ref('')
  const selectedCate = ref(route.query.cate || '')
  const store = useRelativeStore();
  store.fetchAndSetRelative({searchText, cate: selectedCate.value, currentPage: currentPage.value})
  const hotTag = [
    '魔術',
    '派對'
  ]
  
  
  // const {
  //   pending,
  //   data,
  //   error
  // } = computed(() => JSON.parse(JSON.stringify(store.getRelativeData)));
  
  
  const relativeObject = computed(() => store.getRelativeData)

  // 監聽路由變化，當頁碼變化時重新獲取數據
  watch(() => route.query.page, (newPage) => {
    if (newPage) {
      currentPage.value = parseInt(newPage)
      store.fetchAndSetRelative({
        searchText: searchText.value, 
        cate: selectedCate.value, 
        currentPage: currentPage.value
      })
    }
  })
  
  const date2LocaleString = (date) => {
    return new Date(date).toLocaleString('zh-TW')
  }
  
  const hadleCategory = (cate) => {
    const oringal = categoryRelative.find((item) => item.id == cate)
  
    return oringal ? oringal.name : '未分類'
  }
  
  const clickTag = (e) => {
    searchText.value = e.target.textContent
    store.fetchAndSetRelative({searchText: searchText.value, cate: selectedCate.value, currentPage: currentPage.value})
  }
  
  const inputText = () => {
    currentPage.value = 1
    store.fetchAndSetRelative({searchText: searchText.value, cate: selectedCate.value, currentPage: currentPage.value})
  }
  
  const cleanText = () => {
    searchText.value = ''
    store.fetchAndSetRelative({searchText: '', cate: selectedCate.value, currentPage: currentPage.value})
  }
  
  const clickCate = () => {
    currentPage.value = 1
    navigateTo({
      name: 'relative',
      query: { cate: selectedCate.value }
    })
    store.fetchAndSetRelative({searchText: searchText.value, cate: selectedCate.value, currentPage: currentPage.value})
  }
  
  const handlePageChange = (newPage) => {
    currentPage.value = newPage
    store.fetchAndSetRelative({
      searchText: searchText.value,
      cate: selectedCate.value,
      currentPage: currentPage.value
    })
  }
  
  const formatContent = (content, maxLength) => {
    // 確保只在客戶端執行DOM操作
    if (process.client) {
      // 创建临时 DOM 元素来解析 HTML
      const tempElement = document.createElement('div');
      tempElement.innerHTML = content;
      
      // 获取纯文本内容
      const textContent = tempElement.textContent || tempElement.innerText;
      
      // 如果纯文本长度小于限制，直接返回原始 HTML
      if (textContent.length <= maxLength) {
        return content;
      }
      
      // 否则，返回截断的 HTML，但注意不要截断HTML标签
      return content.substring(0, maxLength) + '...';
    }
    
    // 在服务器端简单地截断
    return content.substring(0, maxLength) + '...';
  }
  </script>
  