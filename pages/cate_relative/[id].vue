<template>
    <div class="flex container">
      <ul class="category flex w-full max-w-4xl">
        <li class="category-item" :class="[!currentCate ? 'active' : '']">
          <NuxtLink
          :to="{
            name: 'relative'
          }">全</NuxtLink>
        </li>
        <li
          v-for="cate in categoryRelative" class="category-item"
          :class="[currentCate == cate.id ? 'active' : '']"
        >
          <NuxtLink
            :to="{
              name: 'cate_relative-id', params: { id: cate.id }
            }"
          >{{ cate.name }}</NuxtLink>
        </li>
      </ul>
      <div class="col-12">
        <div class="tag-list">
          <h2 class="tag-title">
            熱門:
          </h2>
          <span class="hot-tag" v-for="tag in hotTag" @click="clickTag">
            {{ tag }}
          </span>
        </div>
        <div class="search">
          <input type="text" class="searchInput" maximum-scale="1" placeholder="請輸入關鍵字" v-model="searchText">
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
      </div>
      <div class="my-8 flex w-full max-w-4xl flex-col">
        <div v-if="relativeObject.pending">
          <Icon class="h-6 w-6 text-gray-500" name="eos-icons:loading" />
        </div>
        <template v-else>
          <div v-if="relativeObject.error">
            <span class="text-gray-500">發生了一點錯誤，請稍後再嘗試</span>
            <p class="my-2 text-rose-500">{{ relativeObject.error }}</p>
          </div>
          <div v-else-if="!relativeObject.data || relativeObject?.data?.items.length === 0">
            <span class="text-gray-500">目前尚無最新優惠券</span>
          </div>
          <div v-else class="md:border-l md:border-gray-100">
            <div class="row">
              <article
                v-for="article in relativeObject.data.items"
                :key="article.id"
                class="cupon col-md-3"
              >
              <div class="cupon-wrapper" v-if="!searchText || article.title.includes(searchText) || article.content.includes(searchText)">
                <NuxtLink
                  class=""
                  :to="{
                    name: 'articles-id',
                    params: {
                      id: article.id
                    }
                  }"
                >
                  <Carousel>
                    <Slide v-for="(img, index) in article.cover" :key="img">
                      <img :src="img" class="cupon-img" />
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
                      {{ hadleCategory(article.category) }}
                    </span>
                    <!-- <time class="order-first mb-3 flex items-center text-sm text-gray-400 md:hidden">
                      {{ date2LocaleString(article.updated_at) }}
                    </time> -->
                    <p class="index-cupon-text">
                      {{ article.content.replace(/\n/g, ' ').substring(0, 300) }}
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
          </div>
        </template>
  
        <!-- @@@@@分頁功能在此@@@@ -->
        <!-- <nav
          v-if="articlesResponse"
          class="mt-12 flex items-center justify-between px-4 py-3 sm:px-6"
        >
          <div class="next-page flex flex-1 justify-center sm:justify">
            <NuxtLink
              v-if="currentPage > 1"
              class="flex items-center text-xl font-medium text-gray-600 hover:text-emerald-500"
              :to="{
                name: 'index',
                query: {
                  page: currentPage - 1
                }
              }"
            >
              <Icon name="ri:arrow-left-s-line" />
            </NuxtLink>
            <label class="mx-2 text-sm text-gray-600">第 {{ articlesResponse.page }} 頁</label>
            <NuxtLink
              class="flex items-center text-xl font-medium text-gray-600 hover:text-emerald-500"
              :to="{
                name: 'index',
                query: {
                  page: currentPage + 1
                }
              }"
            >
              <Icon name="ri:arrow-right-s-line" />
            </NuxtLink>
          </div>
        </nav> -->
      </div>
    </div>
  </template>
  
  <style lang="scss" scoped>
  .active {
    background-color: #ffefd2;
  }
  .category {
    display: flex;
    flex-direction: row;
    font-size: 22px;
    margin: 10px 0 5px 0;
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
    height: 165px;
    overflow: hidden;
  }
  .cupon-img {
    display: inline-block;
    width: 100%;
    height: 100%;
    object-fit: cover;
    border-radius: 10px;
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
    white-space: nowrap;
    text-overflow: ellipsis;
  }
  .search {
    position: relative;
  }
  .searchInput {
    margin-bottom: 20px;
    font-size: 16px;
    padding: 5px;
    width: 100%;
  }
  .cancel-icon {
    position: absolute;
    right: 3px;
    top: 4px;
  }
  .search-icon {
    position: absolute;
    right: 8px;
    top: 8px;
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

  <script setup>
  import { categoryRelative } from '~/utils/category';
  import useRelativeStore from "~~/store/relative";
  // const handleLogout = store.resetUser;

  const route = useRoute()
  const currentCate = computed(() => route?.params?.id)
  const searchText = ref('')
  const store = useRelativeStore();
  store.fetchAndSetRelative(route.params.id)
  const hotTag = [
    '魔術',
    '派對'
  ]

  console.log(route.params.id, 'rrrrr')
  // const {
  //   pending,
  //   data,
  //   error
  // } = computed(() => JSON.parse(JSON.stringify(store.getCouponData)));

  
  const relativeObject = computed(() => store.getRelativeData)
  
  console.log(relativeObject, 'eeeeeeefffff')
  
  
  const date2LocaleString = (date) => {
    return new Date(date).toLocaleString('zh-TW')
  }
  
  const hadleCategory = (cate) => {
    const oringal = categoryRelative.find((item) => item.id == cate)
  
    return oringal ? oringal.name : '未分類'
  }
  
  const clickTag = (e) => {
    searchText.value = e.target.textContent
  }
  
  const cleanText = () => {
    searchText.value = ''
  }
  </script>
  