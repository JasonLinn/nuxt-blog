<template>
  <div class="referral-admin-container">
    <AdminHeader />
    
    <div class="referral-content">
      <div class="page-header">
        <h1>推薦代碼管理 (Referral Codes)</h1>
        <div class="header-actions">
          <button @click="fetchData" class="btn-reload">
            重新載入
          </button>
          <button @click="exportToExcel" class="btn-export">
            📊 匯出 Excel
          </button>
          <button 
            @click="saveData" 
            :disabled="saving"
            class="btn-save"
          >
            <span v-if="saving">儲存中...</span>
            <span v-else>儲存變更</span>
          </button>
        </div>
      </div>

      <div class="data-panel">
        <!-- 搜尋和批量操作 -->
        <div class="toolbar">
          <div class="search-box">
            <input 
              v-model="searchQuery" 
              type="text" 
              placeholder="搜尋代碼或名稱..." 
              class="search-input"
            >
          </div>
          <div class="bulk-actions">
            <button @click="addItem" class="btn-add">
              + 新增單筆
            </button>
            <button @click="showBulkAddModal = true" class="btn-bulk-add">
              📋 批量新增
            </button>
            <button 
              @click="bulkDelete" 
              :disabled="selectedItems.length === 0"
              class="btn-bulk-delete"
            >
              批量刪除 ({{ selectedItems.length }})
            </button>
          </div>
        </div>

        <!-- 資料表格 -->
        <div class="table-wrapper">
          <table class="data-table">
            <thead>
              <tr>
                <th class="checkbox-col">
                  <input 
                    type="checkbox" 
                    :checked="isAllSelected"
                    @change="toggleSelectAll"
                  >
                </th>
                <th>代碼 (Code)</th>
                <th>店家/對應名稱 (Name)</th>
                <th class="actions-col">操作</th>
              </tr>
            </thead>
            <tbody>
              <tr 
                v-for="(item, index) in filteredList" 
                :key="index" 
                :class="{
                  'row-new': item.isNew, 
                  'row-edited': item.isEdited,
                  'row-selected': isSelected(item)
                }"
              >
                <td class="checkbox-col">
                  <input 
                    type="checkbox" 
                    :checked="isSelected(item)"
                    @change="toggleSelect(item)"
                  >
                </td>
                <td>
                  <input 
                    v-model="item.code" 
                    @input="markEdited(item)"
                    type="text" 
                    class="table-input"
                    placeholder="輸入代碼"
                  >
                </td>
                <td>
                  <input 
                    v-model="item.name" 
                    @input="markEdited(item)"
                    type="text" 
                    class="table-input"
                    placeholder="輸入店家名稱"
                  >
                </td>
                <td class="actions-col">
                  <button @click="deleteItem(item)" class="btn-delete">
                    刪除
                  </button>
                </td>
              </tr>
              <tr v-if="filteredList.length === 0">
                <td colspan="4" class="empty-state">
                  沒有找到符合的資料
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        
        <div class="table-footer">
          總計: {{ list.length }} 筆資料 | 已選擇: {{ selectedItems.length }} 筆
        </div>
      </div>
    </div>

    <!-- 批量新增 Modal -->
    <div v-if="showBulkAddModal" class="modal-overlay" @click.self="showBulkAddModal = false">
      <div class="modal-content">
        <div class="modal-header">
          <h2>批量新增推薦代碼</h2>
          <button @click="showBulkAddModal = false" class="modal-close">×</button>
        </div>
        
        <div class="modal-body">
          <div class="help-text">
            <p><strong>使用說明：</strong></p>
            <ul>
              <li>左側輸入代碼列表，右側輸入對應的店家名稱</li>
              <li>每行一個代碼/名稱</li>
              <li>系統會自動按行配對</li>
              <li>如果名稱不足，對應的代碼店家名稱會是空白</li>
            </ul>
          </div>
          
          <div class="dual-input-container">
            <div class="input-column">
              <label class="input-label">代碼列表 (Code)</label>
              <textarea 
                v-model="bulkAddCodes"
                class="bulk-textarea"
                placeholder="每行一個代碼&#10;例如：&#10;2025ABC&#10;2025DEF&#10;2025GHI"
                rows="12"
              ></textarea>
            </div>
            
            <div class="input-separator">
              <div class="arrow-icon">→</div>
            </div>
            
            <div class="input-column">
              <label class="input-label">店家名稱列表 (Name)</label>
              <textarea 
                v-model="bulkAddNames"
                class="bulk-textarea"
                placeholder="每行一個名稱&#10;例如：&#10;測試店家A&#10;測試店家B&#10;測試店家C"
                rows="12"
              ></textarea>
            </div>
          </div>
          
          <div v-if="bulkAddPreview.length > 0" class="preview-section">
            <h3>預覽（將新增 {{ bulkAddPreview.length }} 筆）：</h3>
            <div class="preview-list">
              <div v-for="(item, idx) in bulkAddPreview.slice(0, 5)" :key="idx" class="preview-item">
                <span class="preview-code">{{ item.code }}</span>
                <span class="preview-arrow">→</span>
                <span class="preview-name">{{ item.name || '(無名稱)' }}</span>
              </div>
              <div v-if="bulkAddPreview.length > 5" class="preview-more">
                ... 還有 {{ bulkAddPreview.length - 5 }} 筆
              </div>
            </div>
          </div>
        </div>
        
        <div class="modal-footer">
          <button @click="showBulkAddModal = false" class="btn-cancel">取消</button>
          <button 
            @click="processBulkAdd" 
            :disabled="bulkAddPreview.length === 0"
            class="btn-confirm"
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
  middleware: 'admin-auth'
})

const list = ref([])
const searchQuery = ref('')
const loading = ref(false)
const saving = ref(false)
const selectedItems = ref([])
const showBulkAddModal = ref(false)
const bulkAddCodes = ref('')
const bulkAddNames = ref('')

const filteredList = computed(() => {
  if (!searchQuery.value) return list.value
  const q = searchQuery.value.toLowerCase()
  return list.value.filter(item => 
    (item.code && item.code.toLowerCase().includes(q)) || 
    (item.name && item.name.toLowerCase().includes(q))
  )
})

const isAllSelected = computed(() => {
  return filteredList.value.length > 0 && 
         filteredList.value.every(item => selectedItems.value.includes(item))
})

const bulkAddPreview = computed(() => {
  const codeLines = bulkAddCodes.value.split('\n').filter(line => line.trim()).map(line => line.trim())
  const nameLines = bulkAddNames.value.split('\n').filter(line => line.trim()).map(line => line.trim())
  
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
    selectedItems.value = selectedItems.value.filter(
      item => !filteredList.value.includes(item)
    )
  } else {
    filteredList.value.forEach(item => {
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
      list.value = res.data.map(item => ({...item, isNew: false, isEdited: false}))
      selectedItems.value = []
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
  if (!confirm('確定要儲存所有變更嗎？這將會覆寫伺服器上的檔案。')) return

  saving.value = true
  try {
    const activeData = list.value.map(({ code, name }) => ({ code, name }))
    
    const res = await $fetch('/api/referral-manage', {
      method: 'POST',
      body: activeData
    })
    
    if (res.success) {
      alert('儲存成功！')
      fetchData()
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
  list.value.unshift({
    code: '',
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
  
  selectedItems.value.forEach(item => {
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
  
  const newItems = bulkAddPreview.value.map(item => ({
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
      '序號': index + 1,
      '代碼': item.code || '',
      '店家名稱': item.name || ''
    }))
    
    // 建立工作表
    const ws = XLSX.utils.json_to_sheet(exportData)
    
    // 設定欄位寬度
    ws['!cols'] = [
      { wch: 8 },  // 序號
      { wch: 15 }, // 代碼
      { wch: 30 }  // 店家名稱
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

<style scoped>
.referral-admin-container {
  min-height: 100vh;
  background-color: #f7fafc;
  padding-bottom: 40px;
}

.referral-content {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}export {
  padding: 10px 20px;
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.3s ease;
}

.btn-export:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.4);
}

.btn-

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
}

.page-header h1 {
  color: #2d3748;
  font-size: 28px;
  font-weight: bold;
  margin: 0;
}

.header-actions {
  display: flex;
  gap: 12px;
}

.btn-reload {
  padding: 10px 20px;
  background-color: #e2e8f0;
  color: #4a5568;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.3s ease;
}

.btn-reload:hover {
  background-color: #cbd5e0;
}

.btn-save {
  padding: 10px 20px;
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.3s ease;
}

.btn-save:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4);
}

.btn-save:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
}

.data-panel {
  background: white;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  padding: 24px;
}

.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  gap: 16px;
  flex-wrap: wrap;
}

.search-box {
  flex: 1;
  min-width: 250px;
  max-width: 400px;
}

.search-input {
  width: 100%;
  padding: 10px 16px;
  border: 1px solid #cbd5e0;
  border-radius: 6px;
  font-size: 14px;
}

.search-input:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.bulk-actions {
  display: flex;
  gap: 12px;
}

.btn-add {
  padding: 10px 20px;
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.3s ease;
}

.btn-add:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.4);
}

.btn-bulk-add {
  padding: 10px 20px;
  background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.3s ease;
}

.btn-bulk-add:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(139, 92, 246, 0.4);
}

.btn-bulk-delete {
  padding: 10px 20px;
  background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.3s ease;
}

.btn-bulk-delete:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(239, 68, 68, 0.4);
}

.btn-bulk-delete:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.table-wrapper {
  overflow-x: auto;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
}

.data-table thead {
  background-color: #f7fafc;
}

.data-table th {
  padding: 14px 16px;
  text-align: left;
  font-size: 12px;
  font-weight: 600;
  color: #4a5568;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  border-bottom: 2px solid #e2e8f0;
}

.data-table td {
  padding: 12px 16px;
  border-bottom: 1px solid #e2e8f0;
}

.data-table tbody tr {
  transition: background-color 0.2s;
}

.data-table tbody tr:hover {
  background-color: #f7fafc;
}

.row-new {
  background-color: #dbeafe !important;
}

.row-edited {
  background-color: #fef3c7 !important;
}

.row-selected {
  background-color: #e0e7ff !important;
}

.checkbox-col {
  width: 50px;
  text-align: center;
}

.checkbox-col input[type="checkbox"] {
  width: 18px;
  height: 18px;
  cursor: pointer;
}

.actions-col {
  width: 100px;
  text-align: right;
}

.table-input {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #cbd5e0;
  border-radius: 4px;
  font-size: 14px;
}

.table-input:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.btn-delete {
  padding: 6px 12px;
  background-color: #fee2e2;
  color: #dc2626;
  border: 1px solid #fecaca;
  border-radius: 4px;
  cursor: pointer;
  font-size: 13px;
  font-weight: 500;
  transition: all 0.2s;
}

.btn-delete:hover {
  background-color: #dc2626;
  color: white;
}

.empty-state {
  text-align: center;
  padding: 40px;
  color: #9ca3af;
}

.table-footer {
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid #e2e8f0;
  font-size: 14px;
  color: #6b7280;
  text-align: right;
}

/* Modal 樣式 */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  border-radius: 12px;
  width: 90%;
  max-width: 900px;
  max-height: 85vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid #e2e8f0;
}

.modal-header h2 {
  margin: 0;
  font-size: 20px;
  font-weight: 600;
  color: #2d3748;
}

.modal-close {
  background: none;
  border: none;
  font-size: 32px;
  color: #9ca3af;
  cursor: pointer;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  transition: all 0.2s;
}

.modal-close:hover {
  background-color: #f3f4f6;
  color: #4b5563;
}

.modal-body {
  padding: 24px;
  overflow-y: auto;
  flex: 1;
}

.help-text {
  background-color: #f0f9ff;
  border-left: 4px solid #3b82f6;
  padding: 16px;
  margin-bottom: 20px;
  border-radius: 4px;
  font-size: 14px;
}

.help-text p {
  margin: 0 0 8px 0;
  color: #1e40af;
}

.help-text ul {
  margin: 8px 0;
  padding-left: 20px;
  color: #374151;
}

.help-text li {
  margin: 4px 0;
}

.dual-input-container {
  display: flex;
  gap: 16px;
  margin-bottom: 20px;
}

.input-column {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.input-label {
  font-weight: 600;
  color: #374151;
  margin-bottom: 8px;
  font-size: 14px;
}

.input-separator {
  display: flex;
  align-items: center;
  justify-content: center;
  padding-top: 32px;
}

.arrow-icon {
  font-size: 24px;
  color: #9ca3af;
  font-weight: bold;
}

.bulk-textarea {
  width: 100%;
  padding: 12px;
  border: 2px solid #cbd5e0;
  border-radius: 6px;
  font-family: 'Courier New', monospace;
  font-size: 14px;
  resize: vertical;
  min-height: 200px;
}

.bulk-textarea:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.preview-section {
  margin-top: 20px;
  padding: 16px;
  background-color: #f9fafb;
  border-radius: 6px;
  border: 1px solid #e5e7eb;
}

.preview-section h3 {
  margin: 0 0 12px 0;
  font-size: 15px;
  font-weight: 600;
  color: #374151;
}

.preview-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.preview-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 12px;
  background-color: white;
  border-radius: 4px;
  border: 1px solid #e5e7eb;
  font-size: 14px;
}

.preview-code {
  font-family: 'Courier New', monospace;
  font-weight: 600;
  color: #3b82f6;
  min-width: 120px;
}

.preview-arrow {
  color: #9ca3af;
}

.preview-name {
  color: #374151;
  flex: 1;
}

.preview-more {
  padding: 8px 12px;
  text-align: center;
  color: #6b7280;
  font-size: 13px;
  font-style: italic;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 20px 24px;
  border-top: 1px solid #e2e8f0;
  background-color: #f9fafb;
}

.btn-cancel {
  padding: 10px 20px;
  background-color: white;
  color: #4b5563;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.2s;
}

.btn-cancel:hover {
  background-color: #f3f4f6;
}

.btn-confirm {
  padding: 10px 20px;
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.3s ease;
}

.btn-confirm:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4);
}

.btn-confirm:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

@media (max-width: 768px) {
  .toolbar {
    flex-direction: column;
    align-items: stretch;
  }
  
  .search-box {
    max-width: 100%;
  }
  
  .bulk-actions {
    flex-wrap: wrap;
  }
  
  .table-wrapper {
    overflow-x: scroll;
  }
  
  .modal-content {
    width: 95%;
    max-height: 90vh;
  }
  
  .dual-input-container {
    flex-direction: column;
  }
  
  .input-separator {
    padding: 8px 0;
  }
  
  .arrow-icon {
    transform: rotate(90deg);
  }
  
  .preview-item {
    flex-wrap: wrap;
  }
  
  .preview-code {
    min-width: auto;
  }
}
</style>
