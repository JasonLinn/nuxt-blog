<template>
  <div class="admin-coupons-page">
    <AdminHeader />

    <main class="admin-coupons-content">
      <header class="page-header">
        <div>
          <h1>優惠券管理</h1>
          <p>封存後優惠券會從前台列表、地圖、搜尋與 Line 優惠券列表隱藏。</p>
        </div>
        <NuxtLink to="/articles/create" class="create-link">
          <Icon name="ri:add-line" />
          新增優惠券
        </NuxtLink>
      </header>

      <section class="toolbar-panel">
        <div class="tabs">
          <button
            :class="['tab-button', { active: selectedStatus === 'active' }]"
            @click="changeStatus('active')"
          >
            上架中
          </button>
          <button
            :class="['tab-button', { active: selectedStatus === 'archived' }]"
            @click="changeStatus('archived')"
          >
            已封存
          </button>
        </div>
        <div class="search-box">
          <Icon name="ri:search-line" />
          <input v-model="searchText" type="search" placeholder="搜尋優惠券" @input="handleSearchInput">
        </div>
      </section>

      <section v-if="pending" class="state-message">載入中...</section>
      <section v-else-if="errorMessage" class="state-message error">{{ errorMessage }}</section>
      <section v-else-if="!coupons.length" class="state-message">
        {{ selectedStatus === 'archived' ? '目前沒有封存優惠券' : '目前沒有上架中的優惠券' }}
      </section>
      <section v-else class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>名稱</th>
              <th>分類</th>
              <th>地區</th>
              <th>數量</th>
              <th>{{ selectedStatus === 'archived' ? '封存時間' : '更新時間' }}</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="coupon in coupons" :key="coupon.id">
              <td>
                <div class="coupon-title">{{ coupon.title }}</div>
                <div class="coupon-id">#{{ coupon.id }}</div>
              </td>
              <td>{{ coupon.category || '-' }}</td>
              <td>{{ formatTownship(coupon.township) }}</td>
              <td>{{ coupon.amount ?? '-' }}</td>
              <td>{{ formatDate(selectedStatus === 'archived' ? coupon.archived_at : coupon.updated_at) }}</td>
              <td>
                <div class="actions">
                  <NuxtLink class="action-link" :to="`/articles/${coupon.id}`">查看</NuxtLink>
                  <NuxtLink v-if="selectedStatus === 'active'" class="action-link" :to="{ name: 'articles-edit', query: { id: coupon.id } }">編輯</NuxtLink>
                  <button
                    v-if="selectedStatus === 'active'"
                    class="archive-button"
                    :disabled="busyId === coupon.id"
                    @click="archiveCoupon(coupon)"
                  >
                    封存
                  </button>
                  <button
                    v-else
                    class="restore-button"
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
      </section>

      <nav
        v-if="!pending && !errorMessage && pagination.totalPages > 1"
        class="pagination-bar"
        aria-label="優惠券分頁"
      >
        <button
          class="pagination-button"
          :disabled="!pagination.hasPrev"
          @click="changePage(pagination.page - 1)"
        >
          上一頁
        </button>
        <span class="pagination-summary">
          第 {{ pagination.page }} / {{ pagination.totalPages }} 頁，共 {{ pagination.total }} 筆
        </span>
        <button
          class="pagination-button"
          :disabled="!pagination.hasNext"
          @click="changePage(pagination.page + 1)"
        >
          下一頁
        </button>
      </nav>
    </main>
  </div>
</template>

<script setup>
definePageMeta({
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

watch(() => route.query, async (query) => {
  selectedStatus.value = query.status === 'archived' ? 'archived' : 'active'
  searchText.value = query.search || ''
  pagination.value.page = parsePage(query.page)
  await fetchCoupons()
})

await fetchCoupons()
</script>

<style scoped>
.admin-coupons-page {
  min-height: 100vh;
  background: #f8fafc;
}

.admin-coupons-content {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 24px 48px;
}

.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 20px;
}

.page-header h1 {
  margin: 0 0 6px;
  color: #111827;
  font-size: 28px;
  font-weight: 700;
}

.page-header p {
  margin: 0;
  color: #64748b;
  font-size: 14px;
}

.create-link,
.action-link,
.archive-button,
.restore-button,
.tab-button {
  border-radius: 6px;
  font-size: 14px;
  font-weight: 600;
  text-decoration: none;
  border: 1px solid transparent;
  cursor: pointer;
}

.create-link {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 10px 14px;
  background: #2563eb;
  color: white;
}

.toolbar-panel {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 14px;
  margin-bottom: 16px;
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
}

.tabs {
  display: inline-flex;
  gap: 6px;
}

.tab-button {
  padding: 8px 14px;
  background: #f8fafc;
  color: #475569;
  border-color: #e2e8f0;
}

.tab-button.active {
  background: #eff6ff;
  color: #1d4ed8;
  border-color: #bfdbfe;
}

.search-box {
  display: flex;
  align-items: center;
  gap: 8px;
  width: min(320px, 100%);
  padding: 8px 12px;
  border: 1px solid #cbd5e1;
  border-radius: 6px;
  background: white;
}

.search-box input {
  width: 100%;
  border: none;
  outline: none;
  font-size: 14px;
}

.state-message {
  padding: 28px;
  text-align: center;
  color: #64748b;
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
}

.state-message.error {
  color: #b91c1c;
  background: #fef2f2;
  border-color: #fecaca;
}

.table-wrap {
  overflow-x: auto;
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
}

table {
  width: 100%;
  border-collapse: collapse;
}

th,
td {
  padding: 14px 16px;
  border-bottom: 1px solid #e2e8f0;
  text-align: left;
  vertical-align: middle;
}

th {
  color: #475569;
  background: #f8fafc;
  font-size: 13px;
  font-weight: 700;
}

td {
  color: #334155;
  font-size: 14px;
}

tbody tr:last-child td {
  border-bottom: none;
}

.coupon-title {
  max-width: 420px;
  color: #0f172a;
  font-weight: 600;
  line-height: 1.4;
}

.coupon-id {
  margin-top: 4px;
  color: #94a3b8;
  font-size: 12px;
}

.actions {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.action-link {
  padding: 7px 10px;
  color: #1d4ed8;
  background: #eff6ff;
  border-color: #bfdbfe;
}

.archive-button {
  padding: 7px 10px;
  color: #92400e;
  background: #fffbeb;
  border-color: #fde68a;
}

.restore-button {
  padding: 7px 10px;
  color: #166534;
  background: #f0fdf4;
  border-color: #bbf7d0;
}

.pagination-bar {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  margin-top: 16px;
  padding: 14px;
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
}

.pagination-button {
  min-width: 86px;
  padding: 8px 12px;
  color: #1d4ed8;
  background: #eff6ff;
  border: 1px solid #bfdbfe;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
}

.pagination-summary {
  color: #475569;
  font-size: 14px;
}

button:disabled {
  cursor: not-allowed;
  opacity: 0.6;
}

@media (max-width: 768px) {
  .admin-coupons-content {
    padding: 0 12px 32px;
  }

  .page-header,
  .toolbar-panel,
  .pagination-bar {
    align-items: stretch;
    flex-direction: column;
  }

  .create-link {
    justify-content: center;
  }
}
</style>
