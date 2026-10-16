<template>
  <div class="admin-coupons-page">
    <header class="yp-admin-head">
      <div>
        <h1 class="yp-admin-head__title">優惠券管理</h1>
        <p class="yp-admin-head__desc">
          封存後優惠券會從前台列表、地圖、搜尋與 Line 優惠券列表隱藏。
        </p>
      </div>
      <div class="yp-admin-head__actions">
        <NuxtLink to="/articles/create" class="btn btn-primary btn-icon">
          <Icon name="ri:add-line" />
          新增優惠券
        </NuxtLink>
      </div>
    </header>

    <section class="yp-filter-bar">
      <div class="yp-chips">
        <button
          type="button"
          :class="['yp-chip', { 'is-active': selectedStatus === 'active' }]"
          @click="changeStatus('active')"
        >
          上架中
        </button>
        <button
          type="button"
          :class="['yp-chip', { 'is-active': selectedStatus === 'archived' }]"
          @click="changeStatus('archived')"
        >
          已封存
        </button>
      </div>
      <div class="yp-filter-bar__search search-field">
        <Icon name="ri:search-line" class="search-field__icon" />
        <input
          v-model="searchText"
          type="search"
          class="form-control"
          placeholder="搜尋優惠券"
          @input="handleSearchInput"
        />
      </div>
    </section>

    <section v-if="pending" class="yp-table-wrap p-4">
      <span
        v-for="n in 5"
        :key="n"
        class="yp-skeleton mb-3"
        style="height: 20px"
        :style="{ width: `${90 - n * 8}%` }"
      />
    </section>
    <section v-else-if="errorMessage" class="yp-table-wrap">
      <div class="yp-empty yp-empty--error">
        <div class="yp-empty__icon"><Icon name="ri:error-warning-line" /></div>
        <p class="yp-empty__title">{{ errorMessage }}</p>
        <button type="button" class="btn btn-outline-primary" @click="fetchCoupons">
          重新載入
        </button>
      </div>
    </section>
    <section v-else-if="!coupons.length" class="yp-table-wrap">
      <div class="yp-empty">
        <div class="yp-empty__icon"><Icon name="ri:coupon-3-line" /></div>
        <p class="yp-empty__title">
          {{ selectedStatus === 'archived' ? '目前沒有封存優惠券' : '目前沒有上架中的優惠券' }}
        </p>
      </div>
    </section>
    <section v-else class="yp-table-wrap">
      <div class="table-responsive">
        <table class="table-hover yp-table-stack table align-middle">
          <thead>
            <tr>
              <th>名稱</th>
              <th>分類</th>
              <th>地區</th>
              <th>數量</th>
              <th>{{ selectedStatus === 'archived' ? '封存時間' : '更新時間' }}</th>
              <th class="text-end">操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="coupon in coupons" :key="coupon.id">
              <td data-label="名稱">
                <div class="coupon-title">{{ coupon.title }}</div>
                <div class="coupon-id yp-num">#{{ coupon.id }}</div>
              </td>
              <td data-label="分類">{{ coupon.category || '-' }}</td>
              <td data-label="地區">{{ formatTownship(coupon.township) }}</td>
              <td data-label="數量" class="yp-num">{{ coupon.amount ?? '-' }}</td>
              <td data-label="時間" class="text-muted small">
                {{
                  formatDate(selectedStatus === 'archived' ? coupon.archived_at : coupon.updated_at)
                }}
              </td>
              <td data-label="操作">
                <div class="yp-row-actions">
                  <NuxtLink class="btn btn-sm btn-soft" :to="`/articles/${coupon.id}`"
                    >查看</NuxtLink
                  >
                  <NuxtLink
                    v-if="selectedStatus === 'active'"
                    class="btn btn-sm btn-soft"
                    :to="{ name: 'articles-edit', query: { id: coupon.id } }"
                  >
                    編輯
                  </NuxtLink>
                  <button
                    v-if="selectedStatus === 'active'"
                    type="button"
                    class="btn btn-sm btn-outline-danger"
                    :disabled="busyId === coupon.id"
                    @click="archiveCoupon(coupon)"
                  >
                    封存
                  </button>
                  <button
                    v-else
                    type="button"
                    class="btn btn-sm btn-outline-primary"
                    :disabled="busyId === coupon.id"
                    @click="restoreCoupon(coupon)"
                  >
                    恢復
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <div class="yp-table-wrap__footer">
        <span>
          共 <b class="yp-num">{{ pagination.total }}</b> 筆
          <template v-if="pagination.totalPages > 1">
            ，第 <span class="yp-num">{{ pagination.page }}</span> /
            <span class="yp-num">{{ pagination.totalPages }}</span> 頁
          </template>
        </span>
        <nav v-if="pagination.totalPages > 1" class="yp-pager" aria-label="優惠券分頁">
          <button
            type="button"
            :class="['yp-pager__btn', { 'is-disabled': !pagination.hasPrev }]"
            :disabled="!pagination.hasPrev"
            @click="changePage(pagination.page - 1)"
          >
            <Icon name="ri:arrow-left-s-line" /> 上一頁
          </button>
          <button
            type="button"
            :class="['yp-pager__btn', { 'is-disabled': !pagination.hasNext }]"
            :disabled="!pagination.hasNext"
            @click="changePage(pagination.page + 1)"
          >
            下一頁 <Icon name="ri:arrow-right-s-line" />
          </button>
        </nav>
      </div>
    </section>
  </div>
</template>

<script setup>
definePageMeta({
  layout: 'admin',
  middleware: 'admin-auth'
})

const route = useRoute()
const router = useRouter()
const parsePage = (value) => Math.max(parseInt(Array.isArray(value) ? value[0] : value) || 1, 1)

const selectedStatus = ref(route.query.status === 'archived' ? 'archived' : 'active')
const searchText = ref(route.query.search || '')
const coupons = ref([])
const pagination = ref({
  page: parsePage(route.query.page),
  pageSize: 100,
  total: 0,
  totalPages: 1,
  hasNext: false,
  hasPrev: false
})
const pending = ref(false)
const errorMessage = ref('')
const busyId = ref(null)
let searchTimeout = null

const fetchCoupons = async () => {
  pending.value = true
  errorMessage.value = ''

  try {
    const response = await $fetch('/api/admin/coupons', {
      query: {
        status: selectedStatus.value,
        searchText: searchText.value || undefined,
        page: pagination.value.page,
        pageSize: 100
      },
      headers: useRequestHeaders(['cookie'])
    })
    coupons.value = response.items || []
    pagination.value = response.pagination || {
      ...pagination.value,
      total: coupons.value.length,
      totalPages: 1,
      hasNext: false,
      hasPrev: false
    }
  } catch (error) {
    console.error('載入優惠券失敗:', error)
    errorMessage.value = '載入優惠券失敗，請稍後再試'
  } finally {
    pending.value = false
  }
}

const syncRoute = () => {
  return router.replace({
    path: '/admin/coupons',
    query: {
      status: selectedStatus.value === 'archived' ? 'archived' : undefined,
      search: searchText.value || undefined,
      page: pagination.value.page > 1 ? pagination.value.page : undefined
    }
  })
}

const changeStatus = async (status) => {
  selectedStatus.value = status
  pagination.value.page = 1
  await syncRoute()
}

const handleSearchInput = () => {
  if (searchTimeout) clearTimeout(searchTimeout)
  searchTimeout = setTimeout(async () => {
    pagination.value.page = 1
    await syncRoute()
  }, 300)
}

const changePage = async (page) => {
  const totalPages = pagination.value.totalPages || 1
  const nextPage = Math.min(Math.max(page, 1), totalPages)

  if (nextPage === pagination.value.page) return

  pagination.value.page = nextPage
  await syncRoute()
}

const archiveCoupon = async (coupon) => {
  if (!confirm(`確定要封存「${coupon.title}」嗎？封存後前台將無法看到。`)) return

  busyId.value = coupon.id
  try {
    await $fetch(`/api/admin/coupons/${coupon.id}/archive`, { method: 'POST' })
    await fetchCoupons()
  } catch (error) {
    console.error('封存優惠券失敗:', error)
    alert('封存失敗，請稍後再試')
  } finally {
    busyId.value = null
  }
}

const restoreCoupon = async (coupon) => {
  if (!confirm(`確定要恢復「${coupon.title}」嗎？恢復後前台會重新顯示。`)) return

  busyId.value = coupon.id
  try {
    await $fetch(`/api/admin/coupons/${coupon.id}/restore`, { method: 'POST' })
    await fetchCoupons()
  } catch (error) {
    console.error('恢復優惠券失敗:', error)
    alert('恢復失敗，請稍後再試')
  } finally {
    busyId.value = null
  }
}

const formatTownship = (township) => {
  if (Array.isArray(township)) return township.filter(Boolean).join(', ') || '-'
  return township || '-'
}

const formatDate = (value) => {
  if (!value) return '-'
  return new Date(value).toLocaleString('zh-TW')
}

watch(
  () => route.query,
  async (query) => {
    selectedStatus.value = query.status === 'archived' ? 'archived' : 'active'
    searchText.value = query.search || ''
    pagination.value.page = parsePage(query.page)
    await fetchCoupons()
  }
)

await fetchCoupons()
</script>

<style scoped lang="scss">
.search-field {
  position: relative;

  &__icon {
    position: absolute;
    left: 12px;
    top: 50%;
    transform: translateY(-50%);
    color: $yp-subtle;
    pointer-events: none;
  }

  .form-control {
    width: 100%;
    padding-left: 36px;
  }
}

.coupon-title {
  max-width: 420px;
  font-weight: 600;
  line-height: 1.4;
}

.coupon-id {
  margin-top: 2px;
  color: $yp-subtle;
  font-size: 0.75rem;
}

.yp-table-wrap__footer .yp-pager {
  margin-top: 0;
}
</style>
