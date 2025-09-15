<template>
  <div class="admin-recommended-itineraries">
    <div class="admin-header">
      <h1>推薦行程管理</h1>
      <button @click="showCreateModal = true" class="btn-create">
        <Icon name="mdi:plus" />
        新增推薦行程
      </button>
    </div>

    <!-- 篩選器 -->
    <div class="filters">
      <div class="filter-group">
        <label>狀態：</label>
        <select v-model="statusFilter" @change="loadItineraries">
          <option value="">全部</option>
          <option value="true">啟用</option>
          <option value="false">停用</option>
        </select>
      </div>
      
      <div class="filter-group">
        <label>天數：</label>
        <select v-model="daysFilter" @change="loadItineraries">
          <option value="">全部</option>
          <option value="1">1天</option>
          <option value="2">2天</option>
          <option value="3">3天</option>
          <option value="4">4天以上</option>
        </select>
      </div>
    </div>

    <!-- 推薦行程列表 -->
    <div v-if="loading" class="loading">載入中...</div>
    
    <div v-else class="itineraries-grid">
      <div 
        v-for="itinerary in itineraries" 
        :key="itinerary.id"
        class="itinerary-card"
      >
        <!-- 行程資訊 -->
        <div class="card-header">
          <img 
            :src="itinerary.image_url || '/placeholder-place.jpg'" 
            :alt="itinerary.title"
            class="card-image"
            @error="$event.target.src = '/placeholder-place.jpg'"
          />
          <div class="card-info">
            <h3 class="title">{{ itinerary.title }}</h3>
            <p class="description">{{ itinerary.description }}</p>
            
            <div class="meta">
              <span class="days">{{ itinerary.days }}天行程</span>
              <span class="places">{{ itinerary.places.length }} 個地點</span>
              <span class="difficulty">{{ getDifficultyText(itinerary.difficulty_level) }}</span>
              <span :class="['status', itinerary.is_active ? 'active' : 'inactive']">
                {{ itinerary.is_active ? '啟用' : '停用' }}
              </span>
            </div>
            
            <!-- 評分統計 -->
            <div class="rating-stats">
              <div class="stars">
                <Icon 
                  v-for="i in 5" 
                  :key="i"
                  :name="i <= Math.round(itinerary.average_rating) ? 'mdi:star' : 'mdi:star-outline'"
                  :class="{ filled: i <= Math.round(itinerary.average_rating) }"
                />
              </div>
              <span class="rating-text">
                {{ itinerary.average_rating.toFixed(1) }} ({{ itinerary.rating_count }} 人評價)
              </span>
            </div>
          </div>
        </div>

        <!-- 標籤 -->
        <div class="tags">
          <span 
            v-for="tag in itinerary.tags" 
            :key="tag"
            class="tag"
          >
            {{ tag }}
          </span>
        </div>

        <!-- 操作按鈕 -->
        <div class="card-actions">
          <button 
            @click="editItinerary(itinerary)"
            class="btn-edit"
          >
            <Icon name="mdi:pencil" />
            編輯
          </button>
          
          <button 
            @click="toggleStatus(itinerary)"
            :class="['btn-toggle', itinerary.is_active ? 'btn-disable' : 'btn-enable']"
          >
            <Icon :name="itinerary.is_active ? 'mdi:eye-off' : 'mdi:eye'" />
            {{ itinerary.is_active ? '停用' : '啟用' }}
          </button>
          
          <button 
            @click="deleteItinerary(itinerary)"
            class="btn-delete"
          >
            <Icon name="mdi:delete" />
            刪除
          </button>
        </div>
      </div>
    </div>

    <!-- 建立/編輯模態框 -->
    <div v-if="showCreateModal || editingItinerary" class="modal-overlay" @click.self="closeModal">
      <div class="modal">
        <div class="modal-header">
          <h2>{{ editingItinerary ? '編輯推薦行程' : '新增推薦行程' }}</h2>
          <button @click="closeModal" class="btn-close">
            <Icon name="mdi:close" />
          </button>
        </div>

        <form @submit.prevent="saveItinerary" class="modal-form">
          <div class="form-row">
            <div class="form-group">
              <label>行程標題 *</label>
              <input 
                v-model="formData.title" 
                type="text" 
                placeholder="請輸入行程標題"
                required 
              />
            </div>
            
            <div class="form-group">
              <label>天數 *</label>
              <select v-model="formData.days" required>
                <option value="1">1天</option>
                <option value="2">2天</option>
                <option value="3">3天</option>
                <option value="4">4天</option>
                <option value="5">5天</option>
              </select>
            </div>
          </div>

          <div class="form-group">
            <label>行程描述</label>
            <textarea 
              v-model="formData.description" 
              placeholder="請輸入行程描述"
              rows="3"
            ></textarea>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label>難度等級</label>
              <select v-model="formData.difficulty_level">
                <option value="easy">簡單</option>
                <option value="medium">中等</option>
                <option value="hard">困難</option>
              </select>
            </div>
            
            <div class="form-group">
              <label>價格範圍</label>
              <select v-model="formData.price_range">
                <option value="budget">經濟實惠</option>
                <option value="mid">中等價位</option>
                <option value="luxury">豪華體驗</option>
              </select>
            </div>
          </div>

          <div class="form-group">
            <label>封面圖片 URL</label>
            <input 
              v-model="formData.image_url" 
              type="url" 
              placeholder="請輸入圖片網址"
            />
          </div>

          <div class="form-group">
            <label>標籤</label>
            <input 
              v-model="tagsInput" 
              type="text" 
              placeholder="請輸入標籤，以逗號分隔"
            />
            <small>例如：經典路線,適合新手,親子友善</small>
          </div>

          <div class="form-group">
            <label>行程地點 *</label>
            <div class="places-editor">
              <div 
                v-for="(day, dayIndex) in formData.places" 
                :key="dayIndex"
                class="day-section"
              >
                <h4>第 {{ dayIndex + 1 }} 天</h4>
                <div class="day-places">
                  <div 
                    v-for="(place, placeIndex) in day" 
                    :key="placeIndex"
                    class="place-item"
                  >
                    <input 
                      v-model="day[placeIndex]" 
                      type="text" 
                      placeholder="地點名稱"
                    />
                    <button 
                      @click="removePlace(dayIndex, placeIndex)"
                      type="button"
                      class="btn-remove-place"
                    >
                      <Icon name="mdi:close" />
                    </button>
                  </div>
                  <button 
                    @click="addPlace(dayIndex)"
                    type="button"
                    class="btn-add-place"
                  >
                    <Icon name="mdi:plus" />
                    新增地點
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div class="form-group">
            <label class="checkbox-label">
              <input 
                v-model="formData.is_active" 
                type="checkbox"
              />
              <span>啟用此推薦行程</span>
            </label>
          </div>

          <div class="modal-actions">
            <button type="button" @click="closeModal" class="btn-cancel">
              取消
            </button>
            <button type="submit" class="btn-save" :disabled="saving">
              {{ saving ? '儲存中...' : '儲存' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed, watch } from 'vue'

// 檢查管理員權限
definePageMeta({
  middleware: 'admin-auth'
})

// 設定頁面標題
useHead({
  title: '推薦行程管理 - 管理後台'
})

// 響應式資料
const loading = ref(false)
const saving = ref(false)
const itineraries = ref([])
const statusFilter = ref('')
const daysFilter = ref('')

// 模態框狀態
const showCreateModal = ref(false)
const editingItinerary = ref(null)

// 表單資料
const formData = reactive({
  title: '',
  description: '',
  days: 1,
  image_url: '',
  difficulty_level: 'easy',
  price_range: 'budget',
  tags: [],
  places: [[]],
  is_active: true
})

const tagsInput = ref('')

// 載入推薦行程
const loadItineraries = async () => {
  try {
    loading.value = true
    const query = new URLSearchParams()
    
    if (statusFilter.value !== '') {
      query.append('active', statusFilter.value)
    }
    if (daysFilter.value) {
      query.append('days', daysFilter.value)
    }
    
    const response = await $fetch(`/api/admin/recommended-itineraries?${query}`)
    if (response.success) {
      itineraries.value = response.data
    }
  } catch (error) {
    console.error('載入推薦行程失敗:', error)
    alert('載入推薦行程失敗')
  } finally {
    loading.value = false
  }
}

// 編輯行程
const editItinerary = (itinerary) => {
  editingItinerary.value = itinerary
  
  // 填入表單資料
  formData.title = itinerary.title
  formData.description = itinerary.description || ''
  formData.days = itinerary.days
  formData.image_url = itinerary.image_url || ''
  formData.difficulty_level = itinerary.difficulty_level
  formData.price_range = itinerary.price_range
  formData.tags = [...itinerary.tags]
  formData.places = JSON.parse(JSON.stringify(itinerary.places))
  formData.is_active = itinerary.is_active
  
  tagsInput.value = itinerary.tags.join(', ')
}

// 關閉模態框
const closeModal = () => {
  showCreateModal.value = false
  editingItinerary.value = null
  resetForm()
}

// 重設表單
const resetForm = () => {
  formData.title = ''
  formData.description = ''
  formData.days = 1
  formData.image_url = ''
  formData.difficulty_level = 'easy'
  formData.price_range = 'budget'
  formData.tags = []
  formData.places = [[]]
  formData.is_active = true
  tagsInput.value = ''
}

// 儲存行程
const saveItinerary = async () => {
  try {
    saving.value = true
    
    // 處理標籤
    formData.tags = tagsInput.value
      .split(',')
      .map(tag => tag.trim())
      .filter(tag => tag.length > 0)
    
    // 清理空的地點
    formData.places = formData.places.map(day => 
      day.filter(place => place && place.trim().length > 0)
    ).filter(day => day.length > 0)
    
    if (formData.places.length === 0) {
      alert('請至少添加一個地點')
      return
    }
    
    const requestData = {
      ...formData,
      id: editingItinerary.value?.id
    }
    
    const response = await $fetch('/api/admin/recommended-itineraries/save', {
      method: 'POST',
      body: requestData
    })
    
    if (response.success) {
      alert(response.message)
      closeModal()
      await loadItineraries()
    }
  } catch (error) {
    console.error('儲存失敗:', error)
    alert('儲存失敗：' + (error.data?.message || error.message))
  } finally {
    saving.value = false
  }
}

// 切換啟用狀態
const toggleStatus = async (itinerary) => {
  try {
    const newStatus = !itinerary.is_active
    const response = await $fetch('/api/admin/recommended-itineraries/save', {
      method: 'POST',
      body: {
        ...itinerary,
        is_active: newStatus
      }
    })
    
    if (response.success) {
      itinerary.is_active = newStatus
      alert(`已${newStatus ? '啟用' : '停用'}行程`)
    }
  } catch (error) {
    console.error('切換狀態失敗:', error)
    alert('操作失敗')
  }
}

// 刪除行程
const deleteItinerary = async (itinerary) => {
  if (!confirm(`確定要刪除行程「${itinerary.title}」嗎？此操作無法復原。`)) {
    return
  }
  
  try {
    const response = await $fetch(`/api/admin/recommended-itineraries/delete?id=${itinerary.id}`, {
      method: 'DELETE'
    })
    
    if (response.success) {
      alert('刪除成功')
      await loadItineraries()
    }
  } catch (error) {
    console.error('刪除失敗:', error)
    alert('刪除失敗')
  }
}

// 新增地點
const addPlace = (dayIndex) => {
  formData.places[dayIndex].push('')
}

// 移除地點
const removePlace = (dayIndex, placeIndex) => {
  formData.places[dayIndex].splice(placeIndex, 1)
}

// 監聽天數變化，調整地點結構
const updatePlacesStructure = () => {
  const targetDays = parseInt(formData.days)
  const currentDays = formData.places.length
  
  if (targetDays > currentDays) {
    // 新增天數
    for (let i = currentDays; i < targetDays; i++) {
      formData.places.push([])
    }
  } else if (targetDays < currentDays) {
    // 減少天數
    formData.places.splice(targetDays)
  }
}

// 監聽天數變化
watch(() => formData.days, updatePlacesStructure)

// 取得難度文字
const getDifficultyText = (level) => {
  const map = {
    'easy': '簡單',
    'medium': '中等', 
    'hard': '困難'
  }
  return map[level] || '簡單'
}

// 初始化
onMounted(async () => {
  await loadItineraries()
})
</script>

<style lang="scss" scoped>
.admin-recommended-itineraries {
  padding: 24px;
  max-width: 1400px;
  margin: 0 auto;
}

.admin-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  
  h1 {
    margin: 0;
    color: #1f2937;
    font-size: 28px;
    font-weight: 700;
  }
  
  .btn-create {
    background: #3b82f6;
    color: white;
    border: none;
    padding: 12px 20px;
    border-radius: 8px;
    font-weight: 500;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 8px;
    transition: background 0.2s ease;
    
    &:hover {
      background: #2563eb;
    }
  }
}

.filters {
  display: flex;
  gap: 16px;
  margin-bottom: 24px;
  padding: 16px;
  background: white;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
  
  .filter-group {
    display: flex;
    align-items: center;
    gap: 8px;
    
    label {
      font-weight: 500;
      color: #374151;
    }
    
    select {
      padding: 6px 12px;
      border: 1px solid #d1d5db;
      border-radius: 6px;
      font-size: 14px;
      
      &:focus {
        outline: none;
        border-color: #3b82f6;
        box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
      }
    }
  }
}

.loading {
  text-align: center;
  padding: 40px;
  color: #6b7280;
}

.itineraries-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
  gap: 20px;
}

.itinerary-card {
  background: white;
  border-radius: 12px;
  border: 1px solid #e5e7eb;
  overflow: hidden;
  transition: all 0.2s ease;
  
  &:hover {
    border-color: #3b82f6;
    box-shadow: 0 4px 12px rgba(59, 130, 246, 0.15);
  }
  
  .card-header {
    display: flex;
    gap: 16px;
    padding: 16px;
    
    .card-image {
      width: 80px;
      height: 80px;
      border-radius: 8px;
      object-fit: cover;
      flex-shrink: 0;
    }
    
    .card-info {
      flex: 1;
      
      .title {
        margin: 0 0 8px 0;
        font-size: 18px;
        font-weight: 600;
        color: #1f2937;
      }
      
      .description {
        margin: 0 0 12px 0;
        font-size: 14px;
        color: #6b7280;
        line-height: 1.4;
        display: -webkit-box;
        -webkit-line-clamp: 2;
        line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;
      }
      
      .meta {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        margin-bottom: 8px;
        
        span {
          padding: 2px 6px;
          border-radius: 4px;
          font-size: 12px;
          font-weight: 500;
          
          &.days {
            background: #eff6ff;
            color: #3b82f6;
          }
          
          &.places {
            background: #f0fdf4;
            color: #16a34a;
          }
          
          &.difficulty {
            background: #fef3c7;
            color: #d97706;
          }
          
          &.status {
            &.active {
              background: #dcfce7;
              color: #16a34a;
            }
            
            &.inactive {
              background: #fee2e2;
              color: #dc2626;
            }
          }
        }
      }
      
      .rating-stats {
        display: flex;
        align-items: center;
        gap: 8px;
        
        .stars {
          display: flex;
          gap: 2px;
          
          svg {
            width: 14px;
            height: 14px;
            color: #d1d5db;
            
            &.filled {
              color: #fbbf24;
            }
          }
        }
        
        .rating-text {
          font-size: 12px;
          color: #6b7280;
        }
      }
    }
  }
  
  .tags {
    padding: 0 16px 12px;
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
    
    .tag {
      background: #f3f4f6;
      color: #374151;
      padding: 2px 6px;
      border-radius: 4px;
      font-size: 11px;
      font-weight: 500;
    }
  }
  
  .card-actions {
    padding: 16px;
    border-top: 1px solid #f3f4f6;
    display: flex;
    gap: 8px;
    
    button {
      flex: 1;
      padding: 8px 12px;
      border: none;
      border-radius: 6px;
      font-size: 14px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s ease;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 4px;
      
      svg {
        width: 16px;
        height: 16px;
      }
    }
    
    .btn-edit {
      background: #f3f4f6;
      color: #374151;
      
      &:hover {
        background: #e5e7eb;
      }
    }
    
    .btn-enable {
      background: #dcfce7;
      color: #16a34a;
      
      &:hover {
        background: #bbf7d0;
      }
    }
    
    .btn-disable {
      background: #fef3c7;
      color: #d97706;
      
      &:hover {
        background: #fde68a;
      }
    }
    
    .btn-delete {
      background: #fee2e2;
      color: #dc2626;
      
      &:hover {
        background: #fecaca;
      }
    }
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
  padding: 20px;
}

.modal {
  background: white;
  border-radius: 12px;
  width: 100%;
  max-width: 800px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid #e5e7eb;
  
  h2 {
    margin: 0;
    color: #1f2937;
    font-size: 20px;
    font-weight: 600;
  }
  
  .btn-close {
    background: none;
    border: none;
    color: #6b7280;
    cursor: pointer;
    padding: 4px;
    border-radius: 4px;
    
    &:hover {
      background: #f3f4f6;
    }
    
    svg {
      width: 20px;
      height: 20px;
    }
  }
}

.modal-form {
  padding: 24px;
  
  .form-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 16px;
    
    @media (max-width: 600px) {
      grid-template-columns: 1fr;
    }
  }
  
  .form-group {
    margin-bottom: 16px;
    
    label {
      display: block;
      margin-bottom: 6px;
      font-weight: 500;
      color: #374151;
    }
    
    input,
    textarea,
    select {
      width: 100%;
      padding: 10px 12px;
      border: 1px solid #d1d5db;
      border-radius: 6px;
      font-size: 14px;
      
      &:focus {
        outline: none;
        border-color: #3b82f6;
        box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
      }
    }
    
    small {
      display: block;
      margin-top: 4px;
      color: #6b7280;
      font-size: 12px;
    }
    
    &.checkbox-label {
      display: flex;
      align-items: center;
      gap: 8px;
      
      input[type="checkbox"] {
        width: auto;
      }
    }
  }
  
  .places-editor {
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    padding: 16px;
    background: #f9fafb;
    
    .day-section {
      margin-bottom: 16px;
      
      &:last-child {
        margin-bottom: 0;
      }
      
      h4 {
        margin: 0 0 12px 0;
        color: #374151;
        font-size: 16px;
        font-weight: 600;
      }
      
      .day-places {
        .place-item {
          display: flex;
          gap: 8px;
          margin-bottom: 8px;
          
          input {
            flex: 1;
          }
          
          .btn-remove-place {
            background: #fee2e2;
            color: #dc2626;
            border: none;
            padding: 8px;
            border-radius: 4px;
            cursor: pointer;
            
            &:hover {
              background: #fecaca;
            }
            
            svg {
              width: 14px;
              height: 14px;
            }
          }
        }
        
        .btn-add-place {
          background: #eff6ff;
          color: #3b82f6;
          border: 1px dashed #3b82f6;
          padding: 8px 12px;
          border-radius: 6px;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 4px;
          font-size: 14px;
          
          &:hover {
            background: #dbeafe;
          }
          
          svg {
            width: 14px;
            height: 14px;
          }
        }
      }
    }
  }
}

.modal-actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  margin-top: 24px;
  padding-top: 16px;
  border-top: 1px solid #e5e7eb;
  
  .btn-cancel,
  .btn-save {
    padding: 10px 20px;
    border: none;
    border-radius: 6px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;
  }
  
  .btn-cancel {
    background: #f3f4f6;
    color: #374151;
    
    &:hover {
      background: #e5e7eb;
    }
  }
  
  .btn-save {
    background: #3b82f6;
    color: white;
    
    &:hover:not(:disabled) {
      background: #2563eb;
    }
    
    &:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
  }
}
</style>
