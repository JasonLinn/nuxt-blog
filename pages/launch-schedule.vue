<template>
  <div class="yp-page yp-page--narrow">
    <header class="yp-page-head">
      <div>
        <span class="yp-page-head__eyebrow">更新時間表</span>
        <h1 class="yp-page-head__title">優惠券列表</h1>
        <p class="yp-page-head__desc">瀏覽所有優惠券和代訂服務</p>
      </div>
    </header>

    <!-- 載入中 -->
    <div v-if="loading" class="yp-card schedule-card" aria-busy="true">
      <div v-for="n in 8" :key="`skeleton-${n}`" class="schedule-skeleton">
        <span class="yp-skeleton" style="width: 55%; height: 18px" />
        <span class="yp-skeleton" style="width: 90px" />
      </div>
    </div>

    <!-- 錯誤訊息 -->
    <div v-else-if="error" class="yp-card yp-empty yp-empty--error">
      <div class="yp-empty__icon"><Icon name="ri:error-warning-line" /></div>
      <p class="yp-empty__title">載入失敗</p>
      <p class="yp-empty__text">{{ error }}</p>
      <button type="button" class="btn btn-primary" @click="fetchData">重試</button>
    </div>

    <!-- 資料列表 -->
    <template v-else-if="data.items && data.items.length > 0">
      <div class="yp-toolbar">
        <div class="yp-seg" role="tablist" aria-label="類型">
          <button
            v-for="tab in filterTabs"
            :key="tab.value"
            type="button"
            role="tab"
            class="yp-seg__btn"
            :class="{ 'is-active': activeFilter === tab.value }"
            :aria-selected="activeFilter === tab.value"
            @click="activeFilter = tab.value"
          >
            {{ tab.label }}<span class="schedule-count yp-num">{{ tab.count }}</span>
          </button>
        </div>
        <span class="text-secondary small">共 {{ filteredItems.length }} 筆</span>
      </div>

      <div class="yp-card schedule-card">
        <section v-for="group in groups" :key="group.label" class="timeline-group">
          <h2 class="timeline-group__label">
            {{ group.label }}<span class="yp-num">{{ group.items.length }}</span>
          </h2>
          <ul class="timeline-list">
            <li v-for="item in group.items" :key="`${item.source || 'coupon'}-${item.id}`">
              <NuxtLink :to="itemPath(item)" class="timeline-item">
                <div class="timeline-item__main">
                  <span class="timeline-item__title yp-clamp-1">{{ item.title }}</span>
                  <span v-if="item.source === 'relative' || item.isonce" class="yp-tags">
                    <span v-if="item.source === 'relative'" class="yp-tag yp-tag--primary"
                      >代訂</span
                    >
                    <span v-if="item.isonce" class="yp-tag yp-tag--warning">限一次</span>
                  </span>
                </div>
                <time class="timeline-item__time yp-num" :datetime="item.updated_at">
                  {{ formatTime(item.updated_at) }}
                </time>
                <Icon name="ri:arrow-right-s-line" class="timeline-item__arrow" />
              </NuxtLink>
            </li>
          </ul>
        </section>

        <p v-if="!filteredItems.length" class="schedule-none">這個類型目前沒有項目。</p>
      </div>
    </template>

    <!-- 空狀態 -->
    <div v-else class="yp-card yp-empty">
      <div class="yp-empty__icon"><Icon name="ri:coupon-3-line" /></div>
      <p class="yp-empty__title">沒有優惠券</p>
      <p class="yp-empty__text">目前沒有任何優惠券或代訂服務</p>
      <NuxtLink to="/" class="btn btn-soft">回首頁</NuxtLink>
    </div>
  </div>
</template>

<script setup>
import { $fetch } from 'ofetch'
import { ref, computed, onMounted } from 'vue'

// 響應式資料
const loading = ref(false)
const error = ref(null)
const data = ref({
  items: []
})

// 用戶資訊
const userInfo = ref(null)

// 方法
const fetchData = async () => {
  loading.value = true
  error.value = null

  try {
    const response = await $fetch('/api/articles/launch-schedule')
    data.value = response
  } catch (err) {
    console.error('Fetch data error:', err)
    error.value = err.message || '載入資料失敗'
  } finally {
    loading.value = false
  }
}

const itemPath = (item) =>
  item.source === 'relative' ? `/relative_shop/${item.id}` : `/articles/${item.id}`

const formatDate = (dateString) => {
  if (!dateString) return '未知時間'

  try {
    const date = new Date(dateString)
    if (isNaN(date.getTime())) return '無效時間'

    const now = new Date()
    const diffTime = Math.abs(now - date)
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    if (diffDays === 1) {
      return '今天'
    } else if (diffDays === 2) {
      return '昨天'
    } else if (diffDays <= 7) {
      return `${diffDays - 1} 天前`
    } else {
      return date.toLocaleDateString('zh-TW', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      })
    }
  } catch (error) {
    console.error('Date formatting error:', error)
    return '時間錯誤'
  }
}

const formatTime = (dateString) => {
  const date = new Date(dateString)
  if (!dateString || isNaN(date.getTime())) return ''
  return date.toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit', hour12: false })
}

// 類型篩選：全部 / 優惠券 / 代訂
const activeFilter = ref('all')
const items = computed(() => data.value?.items || [])
const isRelative = (item) => item.source === 'relative'
const filterTabs = computed(() => {
  const relativeCount = items.value.filter(isRelative).length
  const tabs = [{ value: 'all', label: '全部', count: items.value.length }]
  if (relativeCount) {
    tabs.push(
      { value: 'coupon', label: '優惠券', count: items.value.length - relativeCount },
      { value: 'relative', label: '代訂', count: relativeCount }
    )
  }
  return tabs
})
const filteredItems = computed(() => {
  if (activeFilter.value === 'relative') return items.value.filter(isRelative)
  if (activeFilter.value === 'coupon') return items.value.filter((item) => !isRelative(item))
  return items.value
})

// 依日期分組（維持 API 回傳的排序）
const groups = computed(() => {
  const result = []
  filteredItems.value.forEach((item) => {
    const label = formatDate(item.updated_at)
    let group = result[result.length - 1]
    if (!group || group.label !== label) {
      group = { label, items: [] }
      result.push(group)
    }
    group.items.push(item)
  })
  return result
})

// 獲取用戶資訊
const fetchUserInfo = async () => {
  try {
    const user = await $fetch('/api/whoami')
    userInfo.value = user
  } catch (err) {
    console.log('User not logged in or error:', err)
  }
}

// 生命週期
onMounted(() => {
  fetchUserInfo()
  fetchData()
})

// 頁面元資料
definePageMeta({
  title: '優惠券更新時間列表',
  description: '查看所有優惠券和代訂服務的更新時間'
})
</script>

<style scoped lang="scss">
.schedule-card {
  padding: 4px 0;
}

.schedule-count {
  margin-left: 6px;
  font-size: 0.75rem;
  opacity: 0.7;
}

.schedule-skeleton {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 16px 20px;
  border-bottom: 1px solid $yp-line;

  &:last-child {
    border-bottom: 0;
  }
}

.schedule-none {
  margin: 0;
  padding: 32px 20px;
  text-align: center;
  color: $yp-muted;
}

// 時間軸
.timeline-group {
  position: relative;

  &__label {
    display: flex;
    align-items: center;
    gap: 8px;
    margin: 0;
    padding: 14px 20px 8px;
    font-size: 0.875rem;
    font-weight: 700;
    color: $yp-primary-ink;

    &::before {
      content: '';
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: $yp-primary;
      box-shadow: 0 0 0 4px $yp-primary-soft;
    }

    span {
      padding: 0 8px;
      border-radius: $yp-radius-pill;
      background: $yp-surface-2;
      color: $yp-muted;
      font-size: 0.75rem;
      font-weight: 500;
    }
  }
}

.timeline-list {
  list-style: none;
  margin: 0 0 4px 24px;
  padding: 0;
  border-left: 2px solid $yp-line;

  li {
    margin-left: -2px;
  }
}

.timeline-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 20px 12px 18px;
  min-height: 52px;
  color: $yp-ink;
  border-left: 2px solid transparent;
  transition:
    background-color 0.15s ease,
    border-color 0.15s ease;

  &:hover {
    color: $yp-ink;
    background: $yp-primary-soft;
    border-left-color: $yp-primary;
  }

  &__main {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 4px 10px;
  }

  &__title {
    font-weight: 700;
    min-width: 0;
    max-width: 100%;
  }

  &__time {
    flex: none;
    font-size: 0.8125rem;
    color: $yp-muted;
  }

  &__arrow {
    flex: none;
    font-size: 20px;
    color: $yp-subtle;
  }
}
</style>
