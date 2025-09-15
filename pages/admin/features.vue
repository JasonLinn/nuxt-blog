<template>
  <div class="admin-features-container">
    <AdminHeader />
    
    <!-- 頁面標題 -->
    <div class="page-header">
      <h1>特色項目管理</h1>
    </div>

    <div class="features-section">
      <!-- 主題特色管理 -->
      <div class="feature-category">
        <div class="category-header">
          <h2>🏠 主題特色管理</h2>
          <button @click="showAddModal('theme')" class="add-btn">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
              <path d="M8 4a.5.5 0 0 1 .5.5v3h3a.5.5 0 0 1 0 1h-3v3a.5.5 0 0 1-1 0v-3h-3a.5.5 0 0 1 0-1h3v-3A.5.5 0 0 1 8 4"/>
            </svg>
            新增主題特色
          </button>
        </div>
        
        <div class="features-grid">
          <div 
            v-for="feature in themeFeatures" 
            :key="feature.id" 
            class="feature-item"
            :class="{ disabled: !feature.is_active }"
          >
            <div class="feature-content">
              <span class="feature-name">{{ feature.name }}</span>
              <span class="feature-status" :class="feature.is_active ? 'active' : 'inactive'">
                {{ feature.is_active ? '啟用' : '停用' }}
              </span>
            </div>
            <div class="feature-actions">
              <button 
                @click="editFeature(feature)" 
                class="edit-btn"
                title="編輯"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" viewBox="0 0 16 16">
                  <path d="M12.146.146a.5.5 0 0 1 .708 0l3 3a.5.5 0 0 1 0 .708L8.5 11.207l-3 1.5a.5.5 0 0 1-.64-.64l1.5-3L13.708.854a.5.5 0 0 1 .708 0z"/>
                </svg>
              </button>
              <button 
                @click="toggleFeatureStatus(feature)" 
                class="toggle-btn"
                :class="feature.is_active ? 'disable' : 'enable'"
                :title="feature.is_active ? '停用' : '啟用'"
              >
                <svg v-if="feature.is_active" xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" viewBox="0 0 16 16">
                  <path d="M1.5 8a6.5 6.5 0 1 1 13 0 6.5 6.5 0 0 1-13 0zM8 0a8 8 0 1 0 0 16A8 8 0 0 0 8 0m2 5a1 1 0 1 1-2 0 1 1 0 0 1 2 0"/>
                </svg>
                <svg v-else xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" viewBox="0 0 16 16">
                  <path d="M8 1a7 7 0 1 0 0 14A7 7 0 0 0 8 1M0 8a8 8 0 1 1 16 0A8 8 0 0 1 0 8"/>
                </svg>
              </button>
              <button 
                @click="deleteFeature(feature)" 
                class="delete-btn"
                title="刪除"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" viewBox="0 0 16 16">
                  <path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5m2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5m3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0z"/>
                  <path d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1z"/>
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- 服務設施管理 -->
      <div class="feature-category">
        <div class="category-header">
          <h2>🎯 服務設施管理</h2>
          <button @click="showAddModal('service')" class="add-btn">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
              <path d="M8 4a.5.5 0 0 1 .5.5v3h3a.5.5 0 0 1 0 1h-3v3a.5.5 0 0 1-1 0v-3h-3a.5.5 0 0 1 0-1h3v-3A.5.5 0 0 1 8 4"/>
            </svg>
            新增服務設施
          </button>
        </div>
        
        <div class="features-grid">
          <div 
            v-for="feature in serviceAmenities" 
            :key="feature.id" 
            class="feature-item"
            :class="{ disabled: !feature.is_active }"
          >
            <div class="feature-content">
              <span class="feature-name">{{ feature.name }}</span>
              <span class="feature-status" :class="feature.is_active ? 'active' : 'inactive'">
                {{ feature.is_active ? '啟用' : '停用' }}
              </span>
            </div>
            <div class="feature-actions">
              <button 
                @click="editFeature(feature)" 
                class="edit-btn"
                title="編輯"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" viewBox="0 0 16 16">
                  <path d="M12.146.146a.5.5 0 0 1 .708 0l3 3a.5.5 0 0 1 0 .708L8.5 11.207l-3 1.5a.5.5 0 0 1-.64-.64l1.5-3L13.708.854a.5.5 0 0 1 .708 0z"/>
                </svg>
              </button>
              <button 
                @click="toggleFeatureStatus(feature)" 
                class="toggle-btn"
                :class="feature.is_active ? 'disable' : 'enable'"
                :title="feature.is_active ? '停用' : '啟用'"
              >
                <svg v-if="feature.is_active" xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" viewBox="0 0 16 16">
                  <path d="M1.5 8a6.5 6.5 0 1 1 13 0 6.5 6.5 0 0 1-13 0zM8 0a8 8 0 1 0 0 16A8 8 0 0 0 8 0m2 5a1 1 0 1 1-2 0 1 1 0 0 1 2 0"/>
                </svg>
                <svg v-else xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" viewBox="0 0 16 16">
                  <path d="M8 1a7 7 0 1 0 0 14A7 7 0 0 0 8 1M0 8a8 8 0 1 1 16 0A8 8 0 0 1 0 8"/>
                </svg>
              </button>
              <button 
                @click="deleteFeature(feature)" 
                class="delete-btn"
                title="刪除"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" viewBox="0 0 16 16">
                  <path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5m2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5m3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0z"/>
                  <path d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1z"/>
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 新增/編輯模態框 -->
    <div v-if="showModal" class="modal-overlay" @click="closeModal">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3>{{ editingFeature ? '編輯' : '新增' }}{{ modalType === 'theme' ? '主題特色' : '服務設施' }}</h3>
          <button @click="closeModal" class="close-btn">×</button>
        </div>
        
        <form @submit.prevent="saveFeature" class="modal-form">
          <div class="form-group">
            <label class="form-label">名稱</label>
            <input
              v-model="featureForm.name"
              type="text"
              class="form-input"
              placeholder="請輸入特色名稱"
              required
            />
          </div>
          
          <div class="form-group">
            <label class="checkbox-item">
              <input
                v-model="featureForm.is_active"
                type="checkbox"
              />
              <span class="checkbox-text">啟用此項目</span>
            </label>
          </div>
          
          <div class="modal-actions">
            <button type="button" @click="closeModal" class="cancel-btn">取消</button>
            <button type="submit" class="save-btn" :disabled="processing">
              {{ processing ? '儲存中...' : '儲存' }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- 載入中遮罩 -->
    <div v-if="loading" class="loading-overlay">
      <div class="loading-spinner"></div>
      <p>載入中...</p>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'

definePageMeta({
  middleware: ['admin-auth']
})

// 狀態管理
const themeFeatures = ref([])
const serviceAmenities = ref([])
const loading = ref(true)
const processing = ref(false)
const showModal = ref(false)
const modalType = ref('theme') // 'theme' or 'service'
const editingFeature = ref(null)

// 表單資料
const featureForm = ref({
  name: '',
  is_active: true
})

// 載入特色項目
const loadFeatures = async () => {
  try {
    loading.value = true
    const response = await $fetch('/api/admin/features')
    if (response.success) {
      themeFeatures.value = response.data.themeFeatures || []
      serviceAmenities.value = response.data.serviceAmenities || []
    }
  } catch (error) {
    console.error('載入特色項目失敗:', error)
    alert('載入特色項目失敗，請重新整理頁面')
  } finally {
    loading.value = false
  }
}

// 顯示新增模態框
const showAddModal = (type) => {
  modalType.value = type
  editingFeature.value = null
  featureForm.value = {
    name: '',
    is_active: true
  }
  showModal.value = true
}

// 編輯特色項目
const editFeature = (feature) => {
  modalType.value = feature.type
  editingFeature.value = feature
  featureForm.value = {
    name: feature.name,
    is_active: feature.is_active
  }
  showModal.value = true
}

// 儲存特色項目
const saveFeature = async () => {
  try {
    processing.value = true
    
    const url = editingFeature.value 
      ? `/api/admin/features/${editingFeature.value.id}`
      : '/api/admin/features'
    
    const method = editingFeature.value ? 'PUT' : 'POST'
    
    const response = await $fetch(url, {
      method,
      body: {
        ...featureForm.value,
        type: modalType.value
      }
    })
    
    if (response.success) {
      await loadFeatures()
      closeModal()
      alert(editingFeature.value ? '更新成功！' : '新增成功！')
    }
  } catch (error) {
    console.error('儲存失敗:', error)
    alert('儲存失敗，請稍後再試')
  } finally {
    processing.value = false
  }
}

// 切換項目狀態
const toggleFeatureStatus = async (feature) => {
  try {
    const response = await $fetch(`/api/admin/features/${feature.id}`, {
      method: 'PUT',
      body: {
        ...feature,
        is_active: !feature.is_active
      }
    })
    
    if (response.success) {
      await loadFeatures()
    }
  } catch (error) {
    console.error('更新狀態失敗:', error)
    alert('更新狀態失敗')
  }
}

// 刪除特色項目
const deleteFeature = async (feature) => {
  if (!confirm(`確定要刪除「${feature.name}」嗎？此操作不可復原。`)) return
  
  try {
    const response = await $fetch(`/api/admin/features/${feature.id}`, {
      method: 'DELETE'
    })
    
    if (response.success) {
      await loadFeatures()
      alert('刪除成功！')
    }
  } catch (error) {
    console.error('刪除失敗:', error)
    alert('刪除失敗，請稍後再試')
  }
}

// 關閉模態框
const closeModal = () => {
  showModal.value = false
  editingFeature.value = null
  featureForm.value = { name: '', is_active: true }
}

onMounted(() => {
  loadFeatures()
})
</script>

<style scoped lang="scss">
.admin-features-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
  padding-bottom: 20px;
  border-bottom: 2px solid #e2e8f0;

  h1 {
    color: #2d3748;
    font-size: 28px;
    font-weight: bold;
    margin: 0;
  }
}

.features-section {
  display: flex;
  flex-direction: column;
  gap: 40px;
}

.feature-category {
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.category-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;

  h2 {
    color: #2d3748;
    font-size: 20px;
    font-weight: 600;
    margin: 0;
  }
}

.add-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  background: linear-gradient(135deg, #48bb78 0%, #38a169 100%);
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(72, 187, 120, 0.3);
  }
}

.features-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 16px;
}

.feature-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  border: 2px solid #e2e8f0;
  border-radius: 8px;
  transition: all 0.3s ease;

  &:hover {
    border-color: #cbd5e0;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  }

  &.disabled {
    opacity: 0.6;
    background: #f7fafc;
  }
}

.feature-content {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.feature-name {
  font-weight: 600;
  color: #2d3748;
  font-size: 16px;
}

.feature-status {
  font-size: 12px;
  padding: 2px 8px;
  border-radius: 12px;
  font-weight: 500;

  &.active {
    background: #c6f6d5;
    color: #22543d;
  }

  &.inactive {
    background: #fed7d7;
    color: #742a2a;
  }
}

.feature-actions {
  display: flex;
  gap: 8px;
}

.edit-btn, .toggle-btn, .delete-btn {
  padding: 8px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;

  &:hover {
    transform: scale(1.1);
  }
}

.edit-btn {
  background: #4299e1;
  color: white;

  &:hover {
    background: #3182ce;
  }
}

.toggle-btn {
  &.enable {
    background: #48bb78;
    color: white;

    &:hover {
      background: #38a169;
    }
  }

  &.disable {
    background: #ed8936;
    color: white;

    &:hover {
      background: #dd6b20;
    }
  }
}

.delete-btn {
  background: #e53e3e;
  color: white;

  &:hover {
    background: #c53030;
  }
}

// 模態框樣式
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  border-radius: 12px;
  width: 90%;
  max-width: 500px;
  max-height: 90vh;
  overflow-y: auto;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid #e2e8f0;

  h3 {
    margin: 0;
    color: #2d3748;
    font-size: 18px;
    font-weight: 600;
  }
}

.close-btn {
  background: none;
  border: none;
  font-size: 24px;
  color: #a0aec0;
  cursor: pointer;
  line-height: 1;

  &:hover {
    color: #2d3748;
  }
}

.modal-form {
  padding: 24px;
}

.form-group {
  margin-bottom: 20px;
}

.form-label {
  display: block;
  margin-bottom: 8px;
  font-weight: 600;
  color: #2d3748;
}

.form-input {
  width: 100%;
  padding: 12px;
  border: 2px solid #e2e8f0;
  border-radius: 8px;
  font-size: 16px;
  transition: border-color 0.3s ease;

  &:focus {
    outline: none;
    border-color: #667eea;
  }
}

.checkbox-item {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;

  input[type="checkbox"] {
    width: 18px;
    height: 18px;
    accent-color: #667eea;
  }

  .checkbox-text {
    font-size: 16px;
    color: #2d3748;
  }
}

.modal-actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  margin-top: 24px;
}

.cancel-btn, .save-btn {
  padding: 12px 24px;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.cancel-btn {
  background: #e2e8f0;
  color: #4a5568;

  &:hover {
    background: #cbd5e0;
  }
}

.save-btn {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;

  &:hover:not(:disabled) {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
}

// 載入中樣式
.loading-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255, 255, 255, 0.9);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  z-index: 999;

  p {
    margin-top: 16px;
    color: #4a5568;
    font-size: 16px;
  }
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 3px solid #e2e8f0;
  border-top: 3px solid #667eea;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

// 響應式設計
@media (max-width: 768px) {
  .admin-header {
    flex-direction: column;
    gap: 15px;
  }

  .category-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 15px;
  }

  .features-grid {
    grid-template-columns: 1fr;
  }

  .feature-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }

  .feature-actions {
    align-self: flex-end;
  }
}
</style>