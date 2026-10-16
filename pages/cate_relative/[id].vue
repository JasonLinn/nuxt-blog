<template>
  <div class="yp-page">
    <nav class="yp-breadcrumb" aria-label="breadcrumb">
      <NuxtLink to="/">首頁</NuxtLink>
      <NuxtLink :to="{ name: 'relative' }">代訂服務</NuxtLink>
      <span>{{ currentCateName }}</span>
    </nav>
    <header class="yp-page-head">
      <div>
        <span class="yp-page-head__eyebrow">代訂服務</span>
        <h1 class="yp-page-head__title">{{ currentCateName }}</h1>
        <p class="yp-page-head__desc">宜蘭在地特色店家，一站式代訂更省心。</p>
      </div>
    </header>

    <!-- 搜尋 -->
    <div class="yp-search cate-search" role="search">
      <div class="yp-search__field">
        <Icon name="ri:search-line" class="yp-search__icon" />
        <input
          v-model="searchText"
          type="search"
          class="yp-search__input"
          placeholder="請輸入關鍵字"
          aria-label="搜尋特色店家"
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
    </div>

    <!-- 篩選列 -->
    <div class="yp-toolbar">
      <div class="yp-chips" aria-label="服務類別">
        <NuxtLink :to="{ name: 'relative' }" class="yp-chip" :class="{ 'is-active': !currentCate }">
          全部
        </NuxtLink>
        <NuxtLink
          v-for="cate in categoryRelative"
          :key="cate.id"
          :to="{ name: 'cate_relative-id', params: { id: cate.id } }"
          class="yp-chip"
          :class="{ 'is-active': currentCate === cate.id }"
        >
          {{ cate.name }}
        </NuxtLink>
      </div>
      <div class="yp-toolbar__group">
        <span class="small text-secondary">熱門</span>
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
    </div>

    <!-- 載入中 -->
    <div v-if="relativeObject.pending" class="yp-grid yp-grid--3">
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
    <div v-else-if="relativeObject.error" class="yp-card yp-empty yp-empty--error">
      <div class="yp-empty__icon"><Icon name="ri:wifi-off-line" /></div>
      <p class="yp-empty__title">發生了一點錯誤</p>
      <p class="yp-empty__text">請稍後再嘗試。</p>
      <NuxtLink :to="{ name: 'relative' }" class="btn btn-primary">回代訂服務</NuxtLink>
    </div>

    <!-- 無資料 -->
    <div v-else-if="filteredItems.length === 0" class="yp-card yp-empty">
      <div class="yp-empty__icon"><Icon name="ri:store-2-line" /></div>
      <p class="yp-empty__title">目前尚無相關店家</p>
      <p class="yp-empty__text">試試其他關鍵字，或切換服務類別。</p>
      <button v-if="searchText" type="button" class="btn btn-soft" @click="cleanText">
        清除搜尋
      </button>
    </div>

    <!-- 店家列表 -->
    <div v-else class="yp-grid yp-grid--3 cate-grid">
      <article
        v-for="article in filteredItems"
        :key="article.id"
        class="yp-card yp-card--hover cate-card"
      >
        <NuxtLink
          class="cate-card__link"
          :to="{
            name: 'relative_shop-id',
            params: {
              id: article.id
            }
          }"
        >
          <div class="yp-card__media cate-card__media">
            <Carousel v-if="article.cover?.length">
              <Slide v-for="img in article.cover" :key="img">
                <img :src="img" :alt="article.title" loading="lazy" />
              </Slide>
              <template #addons="{ slidesCount }">
                <Pagination v-if="slidesCount > 1" />
              </template>
            </Carousel>
            <div v-else class="cate-card__placeholder">
              <Icon name="ri:image-line" />
            </div>
          </div>
          <div class="yp-card__body">
            <h2 class="yp-card__title yp-clamp-1">{{ article.title }}</h2>
            <div class="yp-tags mt-2">
              <span class="yp-tag yp-tag--primary">{{ hadleCategory(article.category) }}</span>
            </div>
            <p class="yp-card__meta yp-clamp-2">
              {{ (article.content || '').replace(/\n/g, ' ').substring(0, 300) }}
            </p>
          </div>
        </NuxtLink>
      </article>
    </div>
  </div>
</template>

<script setup>
import { categoryRelative } from '~/utils/category'
import useRelativeStore from '~~/store/relative'

const route = useRoute()
const currentCate = computed(() => route?.params?.id)
const currentCateName = computed(() => {
  const found = categoryRelative.find((item) => item.id === currentCate.value)
  return found ? found.name : '特色店家'
})
const searchText = ref('')

const store = useRelativeStore()
store.fetchAndSetRelative(route.params.id)

const hotTag = ['魔術', '派對']

const relativeObject = computed(() => store.getRelativeData)

const filteredItems = computed(() => {
  const items = relativeObject.value?.data?.items || []
  if (!searchText.value) return items
  return items.filter(
    (article) =>
      article.title?.includes(searchText.value) || article.content?.includes(searchText.value)
  )
})

const hadleCategory = (cate) => {
  const oringal = categoryRelative.find((item) => String(item.id) === String(cate))
  return oringal ? oringal.name : '未分類'
}

const clickTag = (e) => {
  searchText.value = e.target.textContent.trim()
}

const cleanText = () => {
  searchText.value = ''
}
</script>

<style lang="scss" scoped>
.cate-search {
  max-width: 640px;
  margin-bottom: 20px;
  box-shadow: $yp-shadow;
  border: 1px solid $yp-line;
}

.cate-grid {
  @media (max-width: #{$yp-bp-sm - 1px}) {
    gap: 12px;
  }
}

.cate-card {
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
