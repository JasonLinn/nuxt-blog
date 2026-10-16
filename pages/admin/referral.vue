<template>
  <div class="referral-admin">
    <header class="yp-admin-head">
      <div>
        <h1 class="yp-admin-head__title">推薦代碼管理</h1>
        <p class="yp-admin-head__desc">
          管理店家推薦代碼（Referral Codes），編輯後請按「儲存變更」才會生效。
        </p>
      </div>
      <div class="yp-admin-head__actions">
        <button type="button" class="btn btn-soft btn-icon" @click="fetchData">
          <Icon name="ri:refresh-line" />
          重新載入
        </button>
        <button type="button" class="btn btn-outline-primary btn-icon" @click="exportToExcel">
          <Icon name="ri:file-excel-2-line" />
          匯出 Excel
        </button>
        <button type="button" :disabled="saving" class="btn btn-primary btn-icon" @click="saveData">
          <span v-if="saving" class="spinner-border spinner-border-sm" />
          <Icon v-else name="ri:save-line" />
          {{ saving ? '儲存中...' : '儲存變更' }}
        </button>
      </div>
    </header>

    <div class="yp-admin-stats">
      <div class="yp-stat-card yp-stat-card--primary">
        <p class="yp-stat-card__label">推薦代碼總數</p>
        <p class="yp-stat-card__value">{{ list.length }}</p>
      </div>
      <div class="yp-stat-card">
        <p class="yp-stat-card__label">已選擇</p>
        <p class="yp-stat-card__value">{{ selectedItems.length }}</p>
      </div>
      <div v-if="pendingChangeCount > 0" class="yp-stat-card yp-stat-card--warning">
        <p class="yp-stat-card__label">尚未儲存的變更</p>
        <p class="yp-stat-card__value">{{ pendingChangeCount }}</p>
        <p class="yp-stat-card__hint">請記得按「儲存變更」</p>
      </div>
    </div>

    <!-- 搜尋和批量操作 -->
    <div class="yp-filter-bar">
      <div class="yp-filter-bar__search referral-search">
        <Icon name="ri:search-line" class="referral-search__icon" />
        <input
          v-model="searchQuery"
          type="text"
          placeholder="搜尋代碼或名稱..."
          class="form-control"
        />
      </div>
      <div class="referral-bulk">
        <button
          type="button"
          :disabled="loading || !dataLoaded || saving"
          class="btn btn-primary btn-icon"
          @click="addItem"
        >
          <Icon name="ri:add-line" />
          新增單筆
        </button>
        <button
          type="button"
          class="btn btn-outline-primary btn-icon"
          @click="showBulkAddModal = true"
        >
          <Icon name="ri:file-list-3-line" />
          批量新增
        </button>
        <button
          type="button"
          :disabled="selectedItems.length === 0"
          class="btn btn-outline-danger btn-icon"
          @click="bulkDelete"
        >
          <Icon name="ri:delete-bin-line" />
          批量刪除 ({{ selectedItems.length }})
        </button>
      </div>
    </div>

    <!-- 資料表格 -->
    <div class="yp-table-wrap">
      <div v-if="loading && !dataLoaded" class="p-4">
        <span
          v-for="n in 5"
          :key="n"
          class="yp-skeleton mb-3"
          style="height: 20px"
          :style="{ width: `${95 - n * 6}%` }"
        />
      </div>
      <div v-else class="table-responsive">
        <table class="table-hover referral-table table align-middle">
          <thead>
            <tr>
              <th class="checkbox-col">
                <input
                  type="checkbox"
                  class="form-check-input"
                  aria-label="全選"
                  :checked="isAllSelected"
                  @change="toggleSelectAll"
                />
              </th>
              <th>代碼 (Code)</th>
              <th>店家/對應名稱 (Name)</th>
              <th class="actions-col text-end">操作</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="(item, index) in filteredList"
              :key="index"
              :class="{
                'row-new': item.isNew,
                'row-edited': item.isEdited && !item.isNew,
                'row-selected': isSelected(item)
              }"
            >
              <td class="checkbox-col">
                <input
                  type="checkbox"
                  class="form-check-input"
                  :checked="isSelected(item)"
                  @change="toggleSelect(item)"
                />
              </td>
              <td>
                <input
                  v-model="item.code"
                  type="text"
                  class="form-control form-control-sm yp-num"
                  placeholder="輸入代碼"
                  @input="markEdited(item)"
                />
              </td>
              <td>
                <input
                  v-model="item.name"
                  type="text"
                  class="form-control form-control-sm"
                  placeholder="輸入店家名稱"
                  @input="markEdited(item)"
                />
              </td>
              <td class="actions-col">
                <div class="yp-row-actions">
                  <span v-if="item.isNew" class="yp-status yp-status--info">新增</span>
                  <span v-else-if="item.isEdited" class="yp-status yp-status--pending">已修改</span>
                  <button
                    type="button"
                    class="btn btn-sm btn-outline-danger"
                    @click="deleteItem(item)"
                  >
                    刪除
                  </button>
                </div>
              </td>
            </tr>
            <tr v-if="filteredList.length === 0">
              <td colspan="4">
                <div class="yp-empty">
                  <div class="yp-empty__icon"><Icon name="ri:search-line" /></div>
                  <p class="yp-empty__title">沒有找到符合的資料</p>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="yp-table-wrap__footer">
        <span
          >總計 <b class="yp-num">{{ list.length }}</b> 筆資料，已選擇
          <b class="yp-num">{{ selectedItems.length }}</b> 筆</span
        >
      </div>
    </div>

    <!-- 批量新增 Modal -->
    <div v-if="showBulkAddModal" class="bulk-modal" @click.self="showBulkAddModal = false">
      <div class="bulk-modal__dialog">
        <div class="bulk-modal__header">
          <h2>批量新增推薦代碼</h2>
          <button
            type="button"
            class="btn btn-ghost btn-sm"
            aria-label="關閉"
            @click="showBulkAddModal = false"
          >
            <Icon name="ri:close-line" />
          </button>
        </div>

        <div class="bulk-modal__body">
          <div class="bulk-help">
            <p class="mb-1"><strong>使用說明</strong></p>
            <ul class="mb-0">
              <li>左側輸入代碼列表，右側輸入對應的店家名稱</li>
              <li>每行一個代碼/名稱</li>
              <li>系統會自動按行配對</li>
              <li>如果名稱不足，對應的代碼店家名稱會是空白</li>
            </ul>
          </div>

          <div class="row g-3">
            <div class="col-md-6">
              <label class="form-label">代碼列表 (Code)</label>
              <textarea
                v-model="bulkAddCodes"
                class="form-control bulk-textarea"
                placeholder="每行一個代碼&#10;例如：&#10;2025ABC&#10;2025DEF&#10;2025GHI"
                rows="12"
              />
            </div>
            <div class="col-md-6">
              <label class="form-label">店家名稱列表 (Name)</label>
              <textarea
                v-model="bulkAddNames"
                class="form-control bulk-textarea"
                placeholder="每行一個名稱&#10;例如：&#10;測試店家A&#10;測試店家B&#10;測試店家C"
                rows="12"
              />
            </div>
          </div>

          <div v-if="bulkAddPreview.length > 0" class="bulk-preview">
            <h3>預覽（將新增 {{ bulkAddPreview.length }} 筆）</h3>
            <div class="bulk-preview__list">
              <div
                v-for="(item, idx) in bulkAddPreview.slice(0, 5)"
                :key="idx"
                class="bulk-preview__item"
              >
                <span class="yp-tag yp-tag--primary yp-num">{{ item.code }}</span>
                <Icon name="ri:arrow-right-line" class="text-muted" />
                <span>{{ item.name || '(無名稱)' }}</span>
              </div>
              <div v-if="bulkAddPreview.length > 5" class="text-muted small">
                ... 還有 {{ bulkAddPreview.length - 5 }} 筆
              </div>
            </div>
          </div>
        </div>

        <div class="bulk-modal__footer">
          <button type="button" class="btn btn-soft" @click="showBulkAddModal = false">取消</button>
          <button
            type="button"
            :disabled="bulkAddPreview.length === 0"
            class="btn btn-primary"
            @click="processBulkAdd"
          >
            確認新增 ({{ bulkAddPreview.length }})
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
definePageMeta({
  layout: 'admin',
  middleware: 'admin-auth'
})

const list = ref([])
const searchQuery = ref('')
const loading = ref(true)
const dataLoaded = ref(false)
const availableCodes = ref([])
const loadedCodes = ref([])
const revision = ref('')
const saving = ref(false)
const selectedItems = ref([])
const showBulkAddModal = ref(false)
const bulkAddCodes = ref('')
const bulkAddNames = ref('')

const filteredList = computed(() => {
  if (!searchQuery.value) return list.value
  const q = searchQuery.value.toLowerCase()
  return list.value.filter(
    (item) =>
      (item.code && item.code.toLowerCase().includes(q)) ||
      (item.name && item.name.toLowerCase().includes(q))
  )
})

const isAllSelected = computed(() => {
  return (
    filteredList.value.length > 0 &&
    filteredList.value.every((item) => selectedItems.value.includes(item))
  )
})

const bulkAddPreview = computed(() => {
  const codeLines = bulkAddCodes.value
    .split('\n')
    .filter((line) => line.trim())
    .map((line) => line.trim())
  const nameLines = bulkAddNames.value
    .split('\n')
    .filter((line) => line.trim())
    .map((line) => line.trim())

  if (codeLines.length === 0) return []

  const maxLength = Math.max(codeLines.length, nameLines.length)
  const result = []

  for (let i = 0; i < maxLength; i++) {
    const code = codeLines[i] || ''
    const name = nameLines[i] || ''

    if (code) {
      result.push({ code, name })
    }
  }

  return result
})

const pendingChangeCount = computed(
  () => list.value.filter((item) => item.isNew || item.isEdited).length
)

const isSelected = (item) => {
  return selectedItems.value.includes(item)
}

const toggleSelect = (item) => {
  const index = selectedItems.value.indexOf(item)
  if (index > -1) {
    selectedItems.value.splice(index, 1)
  } else {
    selectedItems.value.push(item)
  }
}

const toggleSelectAll = () => {
  if (isAllSelected.value) {
    selectedItems.value = selectedItems.value.filter((item) => !filteredList.value.includes(item))
  } else {
    filteredList.value.forEach((item) => {
      if (!selectedItems.value.includes(item)) {
        selectedItems.value.push(item)
      }
    })
  }
}

const fetchData = async () => {
  loading.value = true
  try {
    const res = await $fetch('/api/referral-manage')
    if (res.success) {
      list.value = res.data.map((item) => ({ ...item, isNew: false, isEdited: false }))
      selectedItems.value = []
      availableCodes.value = res.availableCodes || []
      loadedCodes.value = res.data.map((item) => item.code)
      revision.value = res.revision
      dataLoaded.value = true
    } else {
      alert('載入失敗: ' + res.message)
    }
  } catch (e) {
    console.error(e)
    alert('載入錯誤')
  } finally {
    loading.value = false
  }
}

const saveData = async () => {
  if (loading.value || !dataLoaded.value || saving.value) return
  const seen = new Set()
  for (const item of list.value) {
    const code = item.code.trim().toUpperCase()
    if (!code || seen.has(code)) {
      alert(code ? `推薦代碼重複：${item.code}，請修改後再儲存。` : '推薦代碼不可空白。')
      return
    }
    seen.add(code)
  }
  if (list.value.some((item) => item.isNew && !item.name.trim())) {
    alert('請填寫新增推薦代碼的店家名稱後再儲存。')
    return
  }
  if (!confirm('確定要儲存所有推薦代碼變更嗎？')) return

  saving.value = true
  try {
    const activeData = list.value.map(({ code, name }) => ({ code, name }))

    const res = await $fetch('/api/referral-manage', {
      method: 'POST',
      body: { items: activeData, revision: revision.value }
    })

    if (res.success) {
      alert('儲存成功！')
      await fetchData()
    } else {
      alert('儲存失敗: ' + res.message)
    }
  } catch (e) {
    console.error(e)
    alert('儲存發生錯誤')
  } finally {
    saving.value = false
  }
}

const addItem = () => {
  if (loading.value || !dataLoaded.value || saving.value) return

  const year = new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    timeZone: 'Asia/Taipei'
  }).format(new Date())
  const usedCodes = new Set(
    [...loadedCodes.value, ...list.value.map((item) => item.code)].map((code) =>
      code.trim().toUpperCase()
    )
  )
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ'
  const combinations = alphabet.length ** 3
  const start = Math.floor(Math.random() * combinations)
  let code =
    availableCodes.value.find(
      (candidate) => candidate.startsWith(year) && !usedCodes.has(candidate.toUpperCase())
    ) || ''

  // Scan from a random starting point so collisions cannot cause an endless retry.
  for (let offset = 0; !code && offset < combinations; offset++) {
    let value = (start + offset) % combinations
    let suffix = ''
    for (let digit = 0; digit < 3; digit++) {
      suffix = alphabet[value % alphabet.length] + suffix
      value = Math.floor(value / alphabet.length)
    }
    const candidate = `${year}${suffix}`
    if (!usedCodes.has(candidate)) {
      code = candidate
      break
    }
  }

  if (!code) {
    alert('本年度的三碼推薦代碼已用完，請使用批量新增輸入自訂代碼。')
    return
  }

  searchQuery.value = ''
  list.value.unshift({
    code,
    name: '',
    isNew: true,
    isEdited: true
  })
}

const deleteItem = (itemToDelete) => {
  if (!confirm('確定要刪除這筆資料嗎?')) return
  const index = list.value.indexOf(itemToDelete)
  if (index > -1) {
    list.value.splice(index, 1)
    const selectedIndex = selectedItems.value.indexOf(itemToDelete)
    if (selectedIndex > -1) {
      selectedItems.value.splice(selectedIndex, 1)
    }
  }
}

const bulkDelete = () => {
  if (selectedItems.value.length === 0) return

  if (!confirm(`確定要刪除選中的 ${selectedItems.value.length} 筆資料嗎？`)) return

  selectedItems.value.forEach((item) => {
    const index = list.value.indexOf(item)
    if (index > -1) {
      list.value.splice(index, 1)
    }
  })

  selectedItems.value = []
}

const markEdited = (item) => {
  item.isEdited = true
}

const processBulkAdd = () => {
  if (bulkAddPreview.value.length === 0) return

  const newItems = bulkAddPreview.value.map((item) => ({
    code: item.code,
    name: item.name,
    isNew: true,
    isEdited: true
  }))

  list.value.unshift(...newItems)

  showBulkAddModal.value = false
  bulkAddCodes.value = ''
  bulkAddNames.value = ''

  alert(`成功新增 ${newItems.length} 筆資料！請記得點擊「儲存變更」以保存。`)
}

const exportToExcel = async () => {
  try {
    // 動態導入 xlsx
    const XLSX = await import('xlsx')

    // 準備資料
    const exportData = list.value.map((item, index) => ({
      序號: index + 1,
      代碼: item.code || '',
      店家名稱: item.name || ''
    }))

    // 建立工作表
    const ws = XLSX.utils.json_to_sheet(exportData)

    // 設定欄位寬度
    ws['!cols'] = [
      { wch: 8 }, // 序號
      { wch: 15 }, // 代碼
      { wch: 30 } // 店家名稱
    ]

    // 建立工作簿
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, '推薦代碼')

    // 匯出檔案
    const date = new Date().toISOString().split('T')[0]
    XLSX.writeFile(wb, `推薦代碼_${date}.xlsx`)
  } catch (error) {
    console.error('匯出失敗:', error)
    alert('匯出 Excel 失敗，請確認已安裝 xlsx 套件')
  }
}

onMounted(() => {
  fetchData()
})
</script>

<style scoped lang="scss">
.referral-search {
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

.referral-bulk {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.referral-table {
  .checkbox-col {
    width: 48px;
    text-align: center;
  }

  .actions-col {
    width: 190px;
  }

  .form-control {
    min-width: 140px;
  }

  .row-new > td {
    background: $yp-success-soft;
  }

  .row-edited > td {
    background: $yp-warning-soft;
  }

  .row-selected > td {
    background: $yp-primary-soft;
  }

  .yp-empty {
    padding: 32px 20px;
  }
}

.bulk-modal {
  position: fixed;
  inset: 0;
  z-index: 1055;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
  background: rgba(19, 48, 58, 0.45);

  &__dialog {
    width: 100%;
    max-width: 800px;
    max-height: 90vh;
    display: flex;
    flex-direction: column;
    background: $yp-surface;
    border-radius: $yp-radius-lg;
    box-shadow: $yp-shadow-lg;
    overflow: hidden;
  }

  &__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 16px 20px;
    border-bottom: 1px solid $yp-line;

    h2 {
      margin: 0;
      font-size: 1.125rem;
      font-weight: 700;
    }
  }

  &__body {
    flex: 1;
    overflow-y: auto;
    padding: 20px;
  }

  &__footer {
    display: flex;
    justify-content: flex-end;
    gap: 8px;
    padding: 14px 20px;
    border-top: 1px solid $yp-line;
  }
}

.bulk-help {
  margin-bottom: 16px;
  padding: 12px 16px;
  background: $yp-primary-soft;
  color: $yp-primary-ink;
  border-radius: $yp-radius;
  font-size: 0.875rem;

  ul {
    padding-left: 1.25rem;
  }
}

.bulk-textarea {
  font-family: $yp-font-num;
  font-size: 0.875rem;
  resize: vertical;
}

.bulk-preview {
  margin-top: 16px;
  padding: 14px 16px;
  background: $yp-surface-2;
  border-radius: $yp-radius;

  h3 {
    margin: 0 0 8px;
    font-size: 0.9375rem;
    font-weight: 700;
  }

  &__list {
    display: grid;
    gap: 6px;
  }

  &__item {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 0.875rem;
  }
}
</style>
