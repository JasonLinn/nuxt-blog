<template>
  <div class="flex container">
    <div class="selectWrapper">
      <select class="category flex col-4 form-select" v-model="selectedCate" @change="clickCate">
        <!-- <option class="category-item active" value="index" defalut>
          全
        </option> -->
        <option
          v-for="cate in category" class="category-item"
          :id="cate.id"
          :value="cate.id"
        >
          {{ cate.name }}
        </option>
      </select>
      <select class="form-select col-4 category" name="township" id="township"  v-model="selectedTown" @change="clickTown">
        <option :value = null>選擇地區</option>
        <option v-for="town in township" :value="town.name">{{town.name}}</option>
      </select>
    </div>
    <div class="search">
        <input type="text" class="searchInput form-control" maximum-scale="1" placeholder="請輸入優惠券名稱" v-model="searchText" @change="inputText">
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
        <span class="hot-tag" v-for="tag in hotTag" @click="clickTag">
          {{ tag }}
        </span>
      </div>
    </div>
    <div class="my-8 flex w-full max-w-4xl flex-col">
      <div v-if="couponObject.pending">
        <Icon class="h-6 w-6 text-gray-500" name="eos-icons:loading" />
      </div>
      <template v-else>
        <div v-if="couponObject.error">
          <span class="text-gray-500">發生了一點錯誤，請稍後再嘗試</span>
          <p class="my-2 text-rose-500">{{ couponObject.error }}</p>
        </div>
        <div v-else-if="!couponObject.data || couponObject?.data?.items.length === 0">
          <span class="text-gray-500">目前尚無最新優惠券</span>
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
              >
                <Carousel>
                  <Slide v-for="(img, index) in article.cover" :key="img">
                    <img
                      :alt="article.title"
                      height="165"
                      width="366"
                      format="webp"
                      :src="img.replace('https://yilanpass.com', '.')"
                      class="cupon-img"
                      placeholder-class="card"
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
                    {{ hadleCategory(article.category) }}
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
          <!-- @@@@@分頁功能在此@@@@ -->
          <nav
            class="mt-12 flex items-center justify-between px-4 py-3 sm:px-6"
          >
            <div class="next-page flex flex-1 justify-center sm:justify">
              <NuxtLink
                v-if="currentPage > 1"
                class="flex items-center text-xl font-medium text-gray-600 hover:text-emerald-500"
                @click="currentPage = currentPage - 1"
                :to="{
                  name: 'index',
                  query: {
                    cate: selectedCate,
                    page: currentPage - 1
                  }
                }"
              >
                <Icon name="ri:arrow-left-s-line" />
                {{ currentPage -1 }}
              </NuxtLink>
              <label class="now-page">{{ currentPage }}</label>
              <NuxtLink
                v-if="couponObject?.data?.items.length == 10"
                class="flex items-center text-xl font-medium text-gray-600 hover:text-emerald-500"
                @click="currentPage = currentPage + 1"
                :to="{
                  name: 'index',
                  query: {
                    cate: selectedCate,
                    page: currentPage + 1
                  }
                }"
              >
              {{ currentPage +1 }}
                <Icon name="ri:arrow-right-s-line" />
              </NuxtLink>
            </div>
          </nav>
        </div>
      </template>
    </div>
  </div>
</template>

<script setup>
import { category, township } from '~/utils/category';
import useCouponStore from "~~/store/coupon";
// const handleLogout = store.resetUser;

const route = useRoute()
const currentCate = computed(() => route?.query?.cate)
const searchText = ref('')
let currentPage = ref(1)
const selectedTown = ref(null)
const selectedCate = ref('')
const store = useCouponStore();
store.fetchAndSetCoupon({selectedCate, selectedTown, currentPage, searchText})
const hotTag = [
  '伴手禮',
  '租車',
  '湯屋'
]

const couponObject = computed(() => store.getCouponData)


const date2LocaleString = (date) => {
  return new Date(date).toLocaleString('zh-TW')
}

const hadleCategory = (cate) => {
  const oringal = category.find((item) => item.id == cate)

  return oringal ? oringal.name : '未分類'
}

const clickTag = (e) => {
  searchText.value = e.target.textContent
}

const cleanText = () => {
  searchText.value = ''
}

const clickCate = (e) => {
  console.log(e.target, selectedCate, 'eeeee', currentCate)
  currentPage.value = 1
  // if (selectedCate.value == 'index') {
  //   return
  // }
  navigateTo({
    name: 'index',
    query: { cate: selectedCate.value }
  })
  // navigateTo({
  //   name: 'cate-id', params: { id: selectedCate.value }
  // })
}

const clickTown = (e) => {
  navigateTo({
    name: 'index',
    query: { cate: selectedCate.value }
  })
}
</script>
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
  color: #613030;
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
  padding: 3px;
  // color: rgb(117, 117, 117);
  color: #5db0be;
  background-color: rgba(100,179,244,.1);
  margin: 10px 0;
  margin-left: -2px;
  margin-right: 10px;
}
.cupon-once {
  background-color: #ffdcdc8a;
  color: #ff9246;
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