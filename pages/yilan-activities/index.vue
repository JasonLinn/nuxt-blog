<template>
  <div class="act-index">
    <!-- 頁首 -->
    <section class="yp-hero act-banner" :class="{ 'act-banner--photo': heroActivity }">
      <div
        v-if="heroActivity"
        class="act-banner__bg"
        :style="{ backgroundImage: `url('${heroActivity.images[0]}')` }"
        aria-hidden="true"
      />
      <div class="yp-hero__inner act-hero">
        <div class="act-hero__copy">
          <span class="yp-hero__eyebrow">在地活動・展覽・節慶</span>
          <h1 class="yp-hero__title">宜蘭<em>活動</em>總匯</h1>
          <p class="yp-hero__desc">探索宜蘭精彩活動，體驗在地文化之美</p>

          <NuxtLink
            v-if="heroActivity"
            :to="`/yilan-activities/${heroActivity.id}`"
            class="act-banner__latest"
          >
            <span class="act-banner__latest-tag">最新活動</span>
            <span class="act-banner__latest-title">{{ heroActivity.title }}</span>
            <Icon name="ri:arrow-right-s-line" />
          </NuxtLink>

          <div v-if="statItems.length" class="yp-stats act-hero__stats">
            <span v-for="item in statItems" :key="item.label">
              <b>{{ item.value }}</b
              >{{ item.label }}
            </span>
          </div>
        </div>
        <NuxtLink
          to="/yilan-activities/submit"
          class="btn btn-primary btn-pill btn-icon act-hero__cta"
        >
          <Icon name="ri:edit-2-line" />投稿活動
        </NuxtLink>
      </div>
    </section>

    <div ref="listTop" class="yp-page act-list">
      <!-- 投稿成功通知 -->
      <div
        v-if="showSuccessMessage"
        class="alert alert-success alert-dismissible fade show d-flex align-items-start gap-2"
        role="alert"
      >
        <Icon name="ri:checkbox-circle-fill" class="act-alert-icon" />
        <div>
          <strong>投稿成功！</strong>
          您的活動已成功提交，正在等待審核中。我們會盡快處理您的申請。
        </div>
        <button
          type="button"
          class="btn-close"
          aria-label="關閉"
          @click="hideSuccessMessage"
        ></button>
      </div>

      <!-- 搜尋 -->
      <div class="yp-search act-search" role="search">
        <div class="yp-search__field">
          <Icon name="ri:search-line" class="yp-search__icon" />
          <input
            v-model="searchQuery"
            type="search"
            class="yp-search__input"
            placeholder="搜尋活動標題或主辦單位..."
            aria-label="搜尋活動"
          />
          <button
            v-if="searchQuery"
            type="button"
            class="yp-search__clear"
            aria-label="清除搜尋"
            @click="searchQuery = ''"
          >
            <Icon name="ri:close-line" />
          </button>
        </div>
        <button
          type="button"
          class="btn btn-soft btn-icon"
          title="進階搜尋"
          aria-label="進階搜尋"
          @click="openAdvancedSearch"
        >
          <Icon name="ri:equalizer-line" />
          <span class="d-none d-sm-inline">進階</span>
        </button>
      </div>

      <!-- 類型 + 時間篩選 -->
      <div class="yp-toolbar act-toolbar">
        <div class="yp-chips act-toolbar__types" role="group" aria-label="活動類型">
          <button
            type="button"
            class="yp-chip"
            :class="{ 'is-active': typeFilter === '' }"
            :aria-pressed="typeFilter === ''"
            @click="typeFilter = ''"
          >
            全部
          </button>
          <button
            v-for="type in typeOptions"
            :key="type"
            type="button"
            class="yp-chip"
            :class="{ 'is-active': typeFilter === type }"
            :aria-pressed="typeFilter === type"
            @click="typeFilter = type"
          >
            {{ type }}
          </button>
        </div>
        <div class="act-toolbar__time">
          <div class="yp-seg" role="group" aria-label="活動時間">
            <button
              v-for="opt in dateOptions"
              :key="opt.value"
              type="button"
              class="yp-seg__btn"
              :class="{ 'is-active': dateFilter === opt.value }"
              :title="opt.title"
              @click="dateFilter = opt.value"
            >
              {{ opt.label }}
            </button>
          </div>
        </div>
      </div>

      <!-- 已選擇的篩選條件 -->
      <div v-if="hasActiveFilters" class="act-active">
        <span class="act-active__label">已套用</span>
        <button
          v-if="searchQuery"
          type="button"
          class="yp-chip yp-chip--sm is-active"
          @click="searchQuery = ''"
        >
          關鍵字：{{ searchQuery }}<Icon name="ri:close-line" />
        </button>
        <button
          v-if="typeFilter"
          type="button"
          class="yp-chip yp-chip--sm is-active"
          @click="typeFilter = ''"
        >
          類型：{{ typeFilter }}<Icon name="ri:close-line" />
        </button>
        <button
          v-if="dateFilter"
          type="button"
          class="yp-chip yp-chip--sm is-active"
          @click="dateFilter = ''"
        >
          時間：{{ getDateFilterText(dateFilter) }}<Icon name="ri:close-line" />
        </button>
        <button
          v-if="advancedFilters.location"
          type="button"
          class="yp-chip yp-chip--sm is-active"
          @click="advancedFilters.location = ''"
        >
          地點：{{ advancedFilters.location }}<Icon name="ri:close-line" />
        </button>
        <button
          v-if="advancedFilters.organizer"
          type="button"
          class="yp-chip yp-chip--sm is-active"
          @click="advancedFilters.organizer = ''"
        >
          主辦：{{ advancedFilters.organizer }}<Icon name="ri:close-line" />
        </button>
        <button
          v-if="advancedFilters.priceRange"
          type="button"
          class="yp-chip yp-chip--sm is-active"
          @click="advancedFilters.priceRange = ''"
        >
          價格：{{ getPriceRangeText(advancedFilters.priceRange) }}<Icon name="ri:close-line" />
        </button>
        <button type="button" class="btn btn-ghost btn-sm" @click="clearAllFilters">
          清除全部
        </button>
      </div>

      <!-- 進階搜尋側邊面板 -->
      <div
        class="act-drawer"
        :class="{ 'is-open': showAdvancedSearch }"
        :aria-hidden="!showAdvancedSearch"
        @click="closeAdvancedSearch"
      >
        <aside class="act-drawer__panel" role="dialog" aria-label="進階搜尋" @click.stop>
          <div class="act-drawer__head">
            <h2 class="act-drawer__title"><Icon name="ri:equalizer-line" />進階搜尋</h2>
            <button
              type="button"
              class="btn btn-ghost btn-icon"
              aria-label="關閉"
              @click="closeAdvancedSearch"
            >
              <Icon name="ri:close-line" />
            </button>
          </div>

          <div class="act-drawer__body">
            <!-- 地點篩選 -->
            <div class="mb-4">
              <label class="form-label" for="adv-location">
                <Icon name="ri:map-pin-2-line" class="me-1" />活動地點
              </label>
              <input
                id="adv-location"
                v-model="advancedFilters.location"
                type="text"
                placeholder="輸入地點關鍵字..."
                class="form-control"
              />
            </div>

            <!-- 主辦單位篩選 -->
            <div class="mb-4">
              <label class="form-label" for="adv-organizer">
                <Icon name="ri:building-line" class="me-1" />主辦單位
              </label>
              <input
                id="adv-organizer"
                v-model="advancedFilters.organizer"
                type="text"
                placeholder="輸入主辦單位..."
                class="form-control"
              />
            </div>

            <!-- 價格範圍 -->
            <div class="mb-4">
              <label class="form-label" for="adv-price">
                <Icon name="ri:money-dollar-circle-line" class="me-1" />價格範圍
              </label>
              <select id="adv-price" v-model="advancedFilters.priceRange" class="form-select">
                <option value="">不限價格</option>
                <option value="free">免費活動</option>
                <option value="under100">100元以下</option>
                <option value="100to500">100-500元</option>
                <option value="500to1000">500-1000元</option>
                <option value="over1000">1000元以上</option>
              </select>
            </div>

            <!-- 活動狀態 -->
            <div class="mb-4">
              <div class="form-label"><Icon name="ri:time-line" class="me-1" />活動狀態</div>
              <div class="form-check mb-2">
                <input
                  id="onlyUpcoming"
                  v-model="advancedFilters.onlyUpcoming"
                  type="checkbox"
                  class="form-check-input"
                />
                <label class="form-check-label" for="onlyUpcoming">
                  只顯示進行中與即將開始的活動
                </label>
              </div>
              <div class="form-check">
                <input
                  id="hasImages"
                  v-model="advancedFilters.hasImages"
                  type="checkbox"
                  class="form-check-input"
                />
                <label class="form-check-label" for="hasImages">只顯示有圖片的活動</label>
              </div>
            </div>

            <!-- 自定義日期範圍 -->
            <div class="mb-2">
              <div class="form-label">
                <Icon name="ri:calendar-event-line" class="me-1" />自定義日期範圍
              </div>
              <div class="row g-2">
                <div class="col-6">
                  <input
                    v-model="advancedFilters.startDate"
                    type="date"
                    class="form-control"
                    aria-label="開始日期"
                  />
                </div>
                <div class="col-6">
                  <input
                    v-model="advancedFilters.endDate"
                    type="date"
                    class="form-control"
                    aria-label="結束日期"
                  />
                </div>
              </div>
            </div>
          </div>

          <div class="act-drawer__foot">
            <button type="button" class="btn btn-outline-secondary" @click="clearAdvancedFilters">
              重置
            </button>
            <button type="button" class="btn btn-primary" @click="applyAdvancedFilters">
              套用篩選
            </button>
          </div>
        </aside>
      </div>

      <div class="yp-section-head act-count">
        <h2 class="yp-section-head__title">{{ hasActiveFilters ? '搜尋結果' : '所有活動' }}</h2>
        <span
          v-if="!loading && !fetchError && filteredActivities.length"
          class="text-secondary small"
        >
          共 {{ filteredActivities.length }} 場
        </span>
      </div>

      <!-- 載入中 -->
      <div v-if="loading" class="yp-grid act-grid" aria-busy="true">
        <div v-for="n in 6" :key="`skeleton-${n}`" class="yp-card act-card act-card--skeleton">
          <div class="yp-card__media yp-skeleton" />
          <div class="yp-card__body">
            <span class="yp-skeleton mb-2" style="width: 80%; height: 20px" />
            <span class="yp-skeleton mb-2" style="width: 55%; height: 14px" />
            <span class="yp-skeleton" style="width: 35%; height: 20px" />
          </div>
        </div>
      </div>

      <!-- 錯誤 -->
      <div v-else-if="fetchError" class="yp-card yp-empty yp-empty--error">
        <div class="yp-empty__icon"><Icon name="ri:wifi-off-line" /></div>
        <p class="yp-empty__title">載入活動時發生問題</p>
        <p class="yp-empty__text">請檢查網路連線後再試一次。</p>
        <button type="button" class="btn btn-primary" @click="fetchActivities">重新載入</button>
      </div>

      <!-- 空狀態 -->
      <div v-else-if="filteredActivities.length === 0" class="yp-card yp-empty">
        <div class="yp-empty__icon"><Icon name="ri:calendar-event-line" /></div>
        <p class="yp-empty__title">目前沒有符合條件的活動</p>
        <p class="yp-empty__text">試試調整搜尋條件，或投稿您的精彩活動。</p>
        <div class="d-flex justify-content-center flex-wrap gap-2">
          <button
            v-if="hasActiveFilters"
            type="button"
            class="btn btn-soft"
            @click="clearAllFilters"
          >
            清除篩選
          </button>
          <NuxtLink to="/yilan-activities/submit" class="btn btn-primary">投稿您的活動</NuxtLink>
        </div>
      </div>

      <!-- 活動列表 -->
      <div v-else class="yp-grid act-grid">
        <NuxtLink
          v-for="(activity, index) in paginatedActivities"
          :key="activity.id"
          :to="`/yilan-activities/${activity.id}`"
          class="yp-card yp-card--hover act-card"
        >
          <!-- 活動圖片 -->
          <div class="yp-card__media">
            <img
              v-if="activity.images && activity.images.length > 0"
              :src="activity.images[0]"
              :alt="activity.title"
              :loading="index < 3 ? 'eager' : 'lazy'"
              @error="handleImageError"
            />
            <div v-else class="act-card__placeholder">
              <Icon :name="getActivityTypeIcon(activity.activity_type)" />
            </div>

            <!-- 日期標籤 -->
            <div class="act-date">
              <span class="act-date__day">{{ formatDayMonth(activity.event_date).day }}</span>
              <span class="act-date__month">{{ formatDayMonth(activity.event_date).month }}</span>
            </div>
          </div>

          <!-- 活動資訊 -->
          <div class="yp-card__body act-card__body">
            <h3 class="yp-card__title yp-clamp-2">{{ activity.title }}</h3>
            <p v-if="activity.description" class="act-card__desc yp-clamp-2">
              {{ activity.description }}
            </p>

            <ul class="act-card__meta">
              <li>
                <Icon name="ri:calendar-event-line" />
                <span>{{
                  formatEventDate(
                    activity.event_date,
                    activity.event_time,
                    activity.end_date,
                    activity.end_time,
                    activity.is_multi_day
                  )
                }}</span>
              </li>
              <li v-if="activity.organizer_name">
                <Icon name="ri:building-line" />
                <span class="yp-clamp-1">{{ activity.organizer_name }}</span>
              </li>
            </ul>

            <div v-if="activity.activity_type || activity.location" class="yp-tags act-card__tags">
              <span v-if="activity.activity_type" class="yp-tag yp-tag--primary">{{
                activity.activity_type
              }}</span>
              <span v-if="activity.location" class="yp-tag act-card__location">
                <Icon name="ri:map-pin-2-line" /><span class="yp-clamp-1">{{
                  activity.location
                }}</span>
              </span>
            </div>
          </div>
        </NuxtLink>
      </div>

      <!-- 分頁 -->
      <nav v-if="!loading && totalPages > 1" class="yp-pager" aria-label="分頁">
        <button
          type="button"
          class="yp-pager__btn"
          :class="{ 'is-disabled': currentPage === 1 }"
          :disabled="currentPage === 1"
          aria-label="上一頁"
          @click="currentPage--"
        >
          <Icon name="ri:arrow-left-s-line" />
        </button>
        <button
          v-for="page in pageNumbers"
          :key="page"
          type="button"
          class="yp-pager__btn"
          :class="{ 'is-active': page === currentPage }"
          :aria-current="page === currentPage ? 'page' : undefined"
          @click="currentPage = page"
        >
          {{ page }}
        </button>
        <button
          type="button"
          class="yp-pager__btn"
          :class="{ 'is-disabled': currentPage === totalPages }"
          :disabled="currentPage === totalPages"
          aria-label="下一頁"
          @click="currentPage++"
        >
          <Icon name="ri:arrow-right-s-line" />
        </button>
      </nav>
    </div>
  </div>
</template>

<script setup>
import { activityWindow, overlapsActivity, taipeiToday } from '~/utils/activity-dates.js'
// SEO 設定
useSeoMeta({
  title: '宜蘭活動總匯 | 探索宜蘭精彩活動',
  ogTitle: '宜蘭活動總匯 | 探索宜蘭精彩活動',
  description:
    '探索宜蘭最新的活動資訊，包含文化藝術、觀光旅遊、美食餐飲、戶外運動、親子活動等各類精彩活動',
  ogDescription:
    '探索宜蘭最新的活動資訊，包含文化藝術、觀光旅遊、美食餐飲、戶外運動、親子活動等各類精彩活動',
  keywords: '宜蘭活動,宜蘭旅遊,宜蘭景點,親子活動,戶外運動,文化藝術,美食餐飲',
  ogUrl: 'https://yilanpass.com/yilan-activities',
  canonical: 'https://yilanpass.com/yilan-activities'
})

// 額外設定 head link (雙重保險)
useHead({
  link: [
    {
      rel: 'canonical',
      href: 'https://yilanpass.com/yilan-activities'
    }
  ]
})

const route = useRoute()
const activities = ref([])
const loading = ref(true)
const searchQuery = ref('')
const typeFilter = ref('')
const dateFilter = ref('') // 不預設篩選條件，顯示所有活動
const currentPage = ref(1)
const itemsPerPage = 12
const showSuccessMessage = ref(false)
const fetchError = ref(false)
const listTop = ref(null)

// 篩選選項（僅用於呈現）
const typeOptions = [
  '文化藝術',
  '觀光旅遊',
  '美食餐飲',
  '戶外運動',
  '親子活動',
  '節慶慶典',
  '教育講座',
  '其他'
]

const dateOptions = [
  { value: '', label: '全部', title: '顯示所有活動' },
  { value: 'upcoming', label: '近期', title: '進行中與即將開始' },
  { value: 'thisWeek', label: '七天內', title: '未來七天' },
  { value: 'thisMonth', label: '本月', title: '本月' },
  { value: 'nextMonth', label: '下個月', title: '下個月' }
]

// 進階搜尋相關
const showAdvancedSearch = ref(false)
const advancedFilters = ref({
  location: '',
  organizer: '',
  priceRange: '',
  onlyUpcoming: false,
  hasImages: false,
  startDate: '',
  endDate: ''
})

const filteredActivities = computed(() => {
  let filtered = activities.value

  // 基本關鍵字搜尋 (交集邏輯)
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    filtered = filtered.filter(
      (activity) =>
        activity.title.toLowerCase().includes(query) ||
        (activity.organizer_name || '').toLowerCase().includes(query) ||
        (activity.description && activity.description.toLowerCase().includes(query))
    )
  }

  // 活動類型篩選 (交集)
  if (typeFilter.value) {
    filtered = filtered.filter((activity) => activity.activity_type === typeFilter.value)
  }

  // Use the same Taiwan date boundaries as the API, including ongoing events.
  if (dateFilter.value) {
    const [start, end] = activityWindow(dateFilter.value)
    filtered = filtered.filter((activity) => overlapsActivity(activity, start, end))
  }

  // 進階搜尋篩選 (所有條件都是交集)

  // 地點篩選 (交集)
  if (advancedFilters.value.location) {
    const locationQuery = advancedFilters.value.location.toLowerCase()
    filtered = filtered.filter(
      (activity) => activity.location && activity.location.toLowerCase().includes(locationQuery)
    )
  }

  // 主辦單位篩選 (交集)
  if (advancedFilters.value.organizer) {
    const organizerQuery = advancedFilters.value.organizer.toLowerCase()
    filtered = filtered.filter((activity) =>
      (activity.organizer_name || '').toLowerCase().includes(organizerQuery)
    )
  }

  // 價格範圍篩選 (交集)
  if (advancedFilters.value.priceRange) {
    filtered = filtered.filter((activity) => {
      const price = parseFloat(activity.price || 0)

      switch (advancedFilters.value.priceRange) {
        case 'free':
          return price === 0 || !activity.price
        case 'under100':
          return price > 0 && price < 100
        case '100to500':
          return price >= 100 && price <= 500
        case '500to1000':
          return price >= 500 && price <= 1000
        case 'over1000':
          return price > 1000
        default:
          return true
      }
    })
  }

  if (advancedFilters.value.onlyUpcoming) {
    filtered = filtered.filter((activity) => overlapsActivity(activity, taipeiToday(), null))
  }

  // 只顯示有圖片的活動 (交集)
  if (advancedFilters.value.hasImages) {
    filtered = filtered.filter((activity) => activity.images && activity.images.length > 0)
  }

  if (advancedFilters.value.startDate || advancedFilters.value.endDate) {
    filtered = filtered.filter((activity) =>
      overlapsActivity(activity, advancedFilters.value.startDate, advancedFilters.value.endDate)
    )
  }

  return filtered.sort((a, b) => new Date(a.event_date) - new Date(b.event_date))
})

const totalPages = computed(() => Math.ceil(filteredActivities.value.length / itemsPerPage))

const paginatedActivities = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage
  const end = start + itemsPerPage
  return filteredActivities.value.slice(start, end)
})

const totalActivities = computed(() => activities.value.length)

const ongoingCount = computed(
  () =>
    activities.value.filter((activity) => overlapsActivity(activity, taipeiToday(), taipeiToday()))
      .length
)
const thisWeekCount = computed(() => {
  const [start, end] = activityWindow('thisWeek')
  return activities.value.filter((activity) => overlapsActivity(activity, start, end)).length
})

const thisMonthCount = computed(() => {
  const [start, end] = activityWindow('thisMonth')
  return activities.value.filter((activity) => overlapsActivity(activity, start, end)).length
})

// 統計列：只顯示大於 0 的項目
// Banner 背景：最新上架且有照片的活動
const heroActivity = computed(() => {
  const withImage = activities.value.filter((a) => Array.isArray(a.images) && a.images.length > 0)
  if (!withImage.length) return null
  const time = (a) => new Date(a.approved_at || a.created_at || 0).getTime()
  return [...withImage].sort((a, b) => time(b) - time(a) || Number(b.id) - Number(a.id))[0]
})

const statItems = computed(() =>
  [
    { label: '場活動', value: totalActivities.value },
    { label: '場進行中', value: ongoingCount.value },
    { label: '場未來七天', value: thisWeekCount.value },
    { label: '場本月', value: thisMonthCount.value }
  ].filter((item) => item.value > 0)
)

const pageNumbers = computed(() => {
  const total = totalPages.value
  const current = currentPage.value
  const start = Math.max(1, Math.min(current - 2, total - 4))
  const end = Math.min(total, start + 4)
  return Array.from({ length: end - start + 1 }, (_, i) => start + i)
})

// 檢查是否有任何篩選條件
const hasActiveFilters = computed(() => {
  return (
    searchQuery.value ||
    typeFilter.value ||
    dateFilter.value ||
    advancedFilters.value.location ||
    advancedFilters.value.organizer ||
    advancedFilters.value.priceRange ||
    advancedFilters.value.onlyUpcoming ||
    advancedFilters.value.hasImages ||
    advancedFilters.value.startDate ||
    advancedFilters.value.endDate
  )
})

// 進階搜尋相關函式
const openAdvancedSearch = () => {
  showAdvancedSearch.value = true
  document.body.style.overflow = 'hidden'
}

const closeAdvancedSearch = () => {
  showAdvancedSearch.value = false
  document.body.style.overflow = 'auto'
}

const clearAllFilters = () => {
  searchQuery.value = ''
  typeFilter.value = ''
  dateFilter.value = ''
  clearAdvancedFilters()
}

const clearAdvancedFilters = () => {
  advancedFilters.value = {
    location: '',
    organizer: '',
    priceRange: '',
    onlyUpcoming: false,
    hasImages: false,
    startDate: '',
    endDate: ''
  }
}

const applyAdvancedFilters = () => {
  closeAdvancedSearch()
  currentPage.value = 1
}

const getDateFilterText = (value) => {
  const dateTexts = {
    upcoming: '進行中與即將開始',
    thisWeek: '未來七天',
    thisMonth: '本月',
    nextMonth: '下個月'
  }
  return dateTexts[value] || value
}

const getPriceRangeText = (value) => {
  const priceTexts = {
    free: '免費',
    under100: '100元以下',
    '100to500': '100-500元',
    '500to1000': '500-1000元',
    over1000: '1000元以上'
  }
  return priceTexts[value] || value
}

const formatDayMonth = (dateString) => {
  const date = new Date(dateString)
  return {
    day: date.getDate().toString().padStart(2, '0'),
    month: date.toLocaleDateString('zh-TW', { month: 'short' })
  }
}

const formatEventDate = (eventDate, eventTime, endDate, endTime, isMultiDay) => {
  const startDate = new Date(eventDate)
  let formatted = startDate.toLocaleDateString('zh-TW')

  if (eventTime) {
    formatted += ` ${eventTime}`
  }

  // 如果有結束日期且不同於開始日期，或者標記為多日活動
  if (endDate && (endDate !== eventDate || isMultiDay)) {
    const endDateObj = new Date(endDate)
    formatted += ` ~ ${endDateObj.toLocaleDateString('zh-TW')}`

    if (endTime) {
      formatted += ` ${endTime}`
    }
  } else if (endTime && endTime !== eventTime) {
    // 同一天但有不同的結束時間
    formatted += ` ~ ${endTime}`
  }

  return formatted
}

const getActivityTypeIcon = (activityType) => {
  const typeIcons = {
    文化藝術: 'ri:palette-line',
    觀光旅遊: 'ri:map-2-line',
    美食餐飲: 'ri:restaurant-line',
    戶外運動: 'ri:run-line',
    親子活動: 'ri:parent-line',
    節慶慶典: 'ri:cake-3-line',
    教育講座: 'ri:book-open-line',
    商業促銷: 'ri:shopping-bag-line',
    其他: 'ri:calendar-event-line'
  }
  return typeIcons[activityType] || 'ri:calendar-event-line'
}

const handleImageError = (event) => {
  console.log('圖片載入失敗:', event.target.src)
  // 可以在這裡設置備用圖片或其他處理
}

const fetchActivities = async () => {
  try {
    loading.value = true
    fetchError.value = false
    const response = await $fetch('/api/yilan-activities', {
      query: { status: 'approved' }
    })
    activities.value = response.data || []
  } catch (error) {
    console.error('Failed to fetch activities:', error)
    activities.value = []
    fetchError.value = true
  } finally {
    loading.value = false
  }
}

watch(
  [typeFilter, dateFilter, searchQuery, advancedFilters],
  () => {
    currentPage.value = 1
  },
  { deep: true }
)

// 換頁後回到列表頂端
watch(currentPage, () => {
  listTop.value?.scrollIntoView({ behavior: 'smooth', block: 'start' })
})

const hideSuccessMessage = () => {
  showSuccessMessage.value = false
}

onMounted(() => {
  // 檢查是否有成功提交的查詢參數
  if (route.query.success === 'submitted') {
    showSuccessMessage.value = true

    // 自動隱藏成功訊息
    setTimeout(() => {
      showSuccessMessage.value = false
    }, 8000)
  }

  fetchActivities()
})

// 清理函式 - 確保離開頁面時恢復 body 的 overflow
onUnmounted(() => {
  document.body.style.overflow = 'auto'
})

// 設定頁面 SEO
useHead({
  title: '宜蘭活動總匯 | 探索精彩在地活動',
  meta: [
    {
      name: 'description',
      content: '宜蘭活動總匯 - 探索宜蘭各種精彩活動，包含文化藝術、觀光旅遊、美食餐飲等豐富內容'
    },
    { property: 'og:title', content: '宜蘭活動總匯' },
    { property: 'og:description', content: '探索宜蘭精彩活動，體驗在地文化之美' }
  ]
})
</script>

<style scoped lang="scss">
@import '~/assets/scss/yilan-activities-index.scss';
</style>
