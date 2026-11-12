<template>
  <div>
    <header class="yp-admin-head">
      <div>
        <h1 class="yp-admin-head__title">協會會員同步預覽</h1>
        <p class="yp-admin-head__desc">比對協會名單與旅遊通會員，先找出重複與需確認的資料。</p>
      </div>
      <div class="yp-admin-head__actions">
        <button
          class="btn btn-primary"
          :disabled="loading || !status?.source_configured"
          @click="loadPreview"
        >
          {{ loading ? '正在比對…' : preview ? '重新預覽' : '產生同步預覽' }}
        </button>
        <button v-if="preview && !loading" class="btn btn-outline-primary" @click="downloadPreview">
          下載比對結果
        </button>
      </div>
    </header>

    <div class="alert alert-info" role="status">
      <strong>目前僅供預覽，正式匯入尚未開放。</strong>
      等確認官網的開通條件後，再處理配對與刊登。本頁不會新增、修改或下架會員。
    </div>
    <div v-if="status && !status.source_configured" class="alert alert-warning">
      尚未完成協會資料連線設定，請由網站管理者設定後再預覽。
    </div>
    <div v-if="error" class="yp-empty yp-empty--error" role="alert">
      <h2 class="yp-empty__title">無法產生預覽</h2>
      <p class="yp-empty__text">{{ error }}</p>
      <button class="btn btn-outline-primary" :disabled="loading" @click="retry">重新嘗試</button>
    </div>
    <div v-if="loading" class="yp-card p-4" aria-live="polite" aria-busy="true">
      <p>正在讀取協會名單並比對既有會員…</p>
      <span class="yp-skeleton d-block" style="height: 80px"></span>
    </div>

    <template v-if="preview && !loading">
      <div class="yp-admin-stats mt-3">
        <div v-for="entry in summaryCards" :key="entry.key" class="yp-stat-card">
          <p class="yp-stat-card__label">{{ entry.label }}</p>
          <p class="yp-stat-card__value">{{ entry.value }}</p>
        </div>
      </div>
      <p class="text-muted small">
        協會名單：{{ formatTime(preview.generated_at) }} · 比對時間：{{
          formatTime(preview.previewed_at)
        }}（台灣時間）
      </p>
      <p class="text-muted">
        高可信候選仍需確認；未找到候選的資料也尚未核准新增。下載結果是本次快照，不能直接匯入。
      </p>
      <ul v-if="preview.warnings.length" class="small text-muted">
        <li v-for="warning in preview.warnings" :key="warning">{{ warning }}</li>
      </ul>

      <div class="yp-filter-bar">
        <label class="visually-hidden" for="association-search">搜尋名稱或識別碼</label>
        <input
          id="association-search"
          v-model="search"
          class="form-control yp-filter-bar__search"
          type="search"
          placeholder="搜尋名稱或識別碼"
        />
        <label class="visually-hidden" for="association-category">比對分類</label>
        <select id="association-category" v-model="category" class="form-select">
          <option value="">全部分類</option>
          <option v-for="(label, key) in categoryLabels" :key="key" :value="key">
            {{ label }}（{{ preview.summary[key] }}）
          </option>
        </select>
      </div>

      <div v-if="!filteredItems.length" class="yp-empty">
        <h2 class="yp-empty__title">沒有符合條件的資料</h2>
        <p class="yp-empty__text">可調整搜尋或分類。空名單不會造成任何會員下架。</p>
      </div>
      <div v-else class="yp-table-wrap">
        <div class="table-responsive">
          <table class="table-hover yp-table-stack table align-middle">
            <thead>
              <tr>
                <th>協會會員</th>
                <th>比對結果</th>
                <th>既有會員候選與差異</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="item in pageItems" :key="item.external_id">
                <td data-label="協會會員">
                  <strong>{{ item.name || '名稱待補' }}</strong>
                  <div class="small text-muted">{{ item.area }}</div>
                  <div class="small text-muted association-id">{{ item.external_id }}</div>
                  <a
                    v-if="item.website"
                    :href="item.website"
                    target="_blank"
                    rel="noopener noreferrer"
                    >查看官網</a
                  >
                  <div class="small mt-1">
                    {{ item.phone || '無公開電話' }} · {{ item.photos.length }} 張照片
                  </div>
                </td>
                <td data-label="比對結果">
                  <span class="yp-tag" :class="tagClass(item.category)">{{
                    categoryLabels[item.category]
                  }}</span>
                  <ul class="small mb-0 mt-2 ps-3">
                    <li v-for="reason in [...item.reasons, ...item.warnings]" :key="reason">
                      {{ reason }}
                    </li>
                  </ul>
                  <details v-if="item.source_duplicates.length" class="small mt-2">
                    <summary>來源內重複候選（{{ item.source_duplicates.length }}）</summary>
                    <ul class="ps-3">
                      <li v-for="duplicate in item.source_duplicates" :key="duplicate.external_id">
                        {{ duplicate.name }}：{{
                          duplicate.signals.map((signal) => fieldLabels[signal]).join('、')
                        }}相同
                      </li>
                    </ul>
                  </details>
                </td>
                <td data-label="既有會員候選與差異">
                  <span v-if="!item.candidates.length" class="text-muted">未找到既有候選</span>
                  <div
                    v-for="candidate in item.candidates"
                    :key="candidate.id"
                    class="association-candidate"
                  >
                    <strong>{{ candidate.name }}</strong>
                    <span class="small">#{{ candidate.id }}</span>
                    <p class="small mb-1">
                      {{ candidate.area }} · {{ localStatus(candidate) }}<br />
                      相符：{{
                        candidate.signals.map((signal) => fieldLabels[signal]).join('、')
                      }}；區域{{ candidate.area_matches ? '一致' : '不同' }}
                    </p>
                    <details>
                      <summary class="small">
                        {{
                          candidate.differences.length
                            ? `檢視 ${candidate.differences.length} 項資料差異`
                            : '資料一致'
                        }}
                      </summary>
                      <dl class="small mb-0 mt-2">
                        <template
                          v-for="difference in candidate.differences"
                          :key="difference.field"
                        >
                          <dt>{{ fieldLabels[difference.field] }}</dt>
                          <dd class="association-difference">
                            <div>目前：{{ displayValue(difference.before) }}</div>
                            <div>協會：{{ displayValue(difference.after) }}</div>
                            <span v-if="difference.requires_confirmation" class="text-warning"
                              >空值是否清除舊資料，需另行確認</span
                            >
                          </dd>
                        </template>
                      </dl>
                    </details>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <div
          class="yp-table-wrap__footer d-flex align-items-center justify-content-between flex-wrap gap-2"
        >
          <span>共 {{ filteredItems.length }} 筆 · 第 {{ page }} / {{ pageCount }} 頁</span>
          <div class="d-flex gap-2">
            <button class="btn btn-outline-primary" :disabled="page <= 1" @click="page--">
              上一頁
            </button>
            <button class="btn btn-outline-primary" :disabled="page >= pageCount" @click="page++">
              下一頁
            </button>
          </div>
        </div>
      </div>
      <details class="yp-card mt-3 p-3">
        <summary>
          未找到來源候選的既有會員（{{ preview.local_without_candidates.length }} 筆）
        </summary>
        <p class="text-muted mt-2">僅供核對，不代表已取消刊登，不會自動下架。</p>
        <ul class="mb-0">
          <li v-for="local in preview.local_without_candidates" :key="local.id">
            {{ local.name }}（#{{ local.id }}，{{ local.area }}）
          </li>
        </ul>
      </details>
    </template>
    <div v-else-if="!loading && !error && status?.source_configured" class="yp-empty">
      <h2 class="yp-empty__title">先預覽，再確認配對</h2>
      <p class="yp-empty__text">按「產生同步預覽」讀取最新資料；所有既有會員都會納入比對。</p>
    </div>
  </div>
</template>

<script setup>
definePageMeta({ layout: 'admin', middleware: 'admin-auth' })
useHead({ title: '協會會員同步預覽', meta: [{ name: 'robots', content: 'noindex, nofollow' }] })

const status = ref(null)
const preview = ref(null)
const loading = ref(false)
const error = ref('')
const search = ref('')
const category = ref('')
const page = ref(1)
const categoryLabels = {
  new: '待新增確認',
  match: '高可信配對候選',
  review: '疑似重複待確認',
  blocked: '既有審核限制',
  invalid: '資料異常'
}
const fieldLabels = {
  name: '名稱',
  area: '區域',
  website: '官網',
  phone: '電話',
  line_url: 'LINE',
  photos: '照片'
}
const summaryCards = computed(() =>
  preview.value
    ? [
        { key: 'source', label: '協會名單', value: preview.value.summary.source_count },
        { key: 'local', label: '既有會員（含未公開）', value: preview.value.summary.local_count },
        ...Object.entries(categoryLabels)
          .filter(([key]) => preview.value.summary[key] > 0)
          .map(([key, label]) => ({ key, label, value: preview.value.summary[key] }))
      ]
    : []
)
const filteredItems = computed(() =>
  (preview.value?.items || []).filter(
    (item) =>
      (!category.value || item.category === category.value) &&
      `${item.name} ${item.external_id} ${item.candidates
        .map((candidate) => `${candidate.name} ${candidate.id}`)
        .join(' ')}`
        .toLowerCase()
        .includes(search.value.trim().toLowerCase())
  )
)
const pageCount = computed(() => Math.max(1, Math.ceil(filteredItems.value.length / 10)))
const pageItems = computed(() => filteredItems.value.slice((page.value - 1) * 10, page.value * 10))
watch([search, category], () => {
  page.value = 1
})
const formatTime = (value) =>
  new Intl.DateTimeFormat('zh-TW', {
    timeZone: 'Asia/Taipei',
    dateStyle: 'short',
    timeStyle: 'short'
  }).format(new Date(value))
const displayValue = (value) =>
  Array.isArray(value) ? (value.length ? value.join('、') : '無') : value || '無'
const localStatus = (row) =>
  row.status !== 'approved'
    ? { pending: '待審核', rejected: '已拒絕' }[row.status] || '未通過審核'
    : row.available
    ? '已公開'
    : '已停用'
const tagClass = (value) =>
  ({
    match: 'yp-tag--success',
    review: 'yp-tag--warning',
    blocked: 'yp-tag--danger',
    invalid: 'yp-tag--danger',
    new: 'yp-tag--primary'
  })[value]

async function loadStatus() {
  error.value = ''
  try {
    status.value = await $fetch('/api/admin/association-sync/status')
  } catch {
    error.value = '無法讀取連線狀態，請確認管理員登入後重試。'
  }
}
async function loadPreview() {
  loading.value = true
  error.value = ''
  preview.value = null
  try {
    preview.value = await $fetch('/api/admin/association-sync/preview', {
      method: 'POST',
      retry: 0
    })
    page.value = 1
  } catch (err) {
    error.value = err.data?.data?.message || '無法完成預覽，請確認登入或稍後重試。'
  } finally {
    loading.value = false
  }
}
async function retry() {
  await loadStatus()
  if (status.value?.source_configured) await loadPreview()
}
function downloadPreview() {
  const blob = new Blob([JSON.stringify(preview.value, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `association-preview-${preview.value.previewed_at.slice(0, 10)}.json`
  link.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
onMounted(loadStatus)
</script>

<style scoped lang="scss">
.association-id,
.association-difference {
  overflow-wrap: anywhere;
}
.association-candidate + .association-candidate {
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid $yp-line;
}
td {
  vertical-align: top;
}
summary {
  cursor: pointer;
  min-height: 40px;
  padding-top: 0.4rem;
}
@media (min-width: 768px) {
  th:first-child {
    width: 23%;
  }
  th:nth-child(2) {
    width: 32%;
  }
}
</style>
