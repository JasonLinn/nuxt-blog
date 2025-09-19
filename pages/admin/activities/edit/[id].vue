<template>
  <div class="activity-edit-admin">
    <div class="container">
      <!-- 簡潔導航 -->
      <div class="mb-4">
        <button @click="$router.back()" class="btn btn-outline-primary mb-3">
          <i class="bi bi-arrow-left me-2"></i>返回詳情
        </button>
        <h1 class="h3 mb-0">編輯活動</h1>
      </div>

      <!-- 載入狀態 -->
      <div v-if="loading" class="text-center py-5">
        <div class="spinner-border text-primary"></div>
        <p class="mt-3">載入中...</p>
      </div>

      <!-- 找不到活動 -->
      <div v-else-if="!activity" class="text-center py-5">
        <p class="text-muted">找不到此活動</p>
      </div>

      <!-- 編輯表單 -->
      <form v-else @submit.prevent="updateActivity">
        <!-- 基本資訊 -->
        <div class="card mb-4">
          <div class="card-header">
            <h5 class="card-title mb-0">基本資訊</h5>
          </div>
          <div class="card-body">
            <div class="mb-3">
              <label class="form-label">活動標題 <span class="text-danger">*</span></label>
              <input 
                v-model="form.title" 
                type="text" 
                required 
                class="form-control"
                placeholder="請輸入活動標題"
              />
            </div>
            
            <div class="mb-3">
              <label class="form-label">活動簡介 <span class="text-danger">*</span></label>
              <textarea 
                v-model="form.description" 
                required 
                rows="6"
                class="form-control"
                placeholder="請輸入活動簡介"
              ></textarea>
              <div class="form-text">{{ form.description?.length || 0 }}/1000 字</div>
            </div>
          </div>
        </div>

        <!-- 活動詳情 -->
        <div class="card mb-4">
          <div class="card-header">
            <h5 class="card-title mb-0">活動詳情</h5>
          </div>
          <div class="card-body">
            <div class="row">
              <div class="col-md-6 mb-3">
                <label class="form-label">活動日期 <span class="text-danger">*</span></label>
                <input 
                  v-model="form.event_date" 
                  type="date" 
                  required 
                  class="form-control"
                />
              </div>
              
              <div class="col-md-6 mb-3">
                <label class="form-label">活動時間</label>
                <input 
                  v-model="form.event_time" 
                  type="time" 
                  class="form-control"
                />
              </div>
              
              <div class="col-md-6 mb-3">
                <label class="form-label">活動地點</label>
                <input 
                  v-model="form.location" 
                  type="text" 
                  class="form-control"
                  placeholder="請輸入活動地點"
                />
              </div>
              
              <div class="col-md-6 mb-3">
                <label class="form-label">活動類型</label>
                <select v-model="form.activity_type" class="form-select">
                  <option value="">請選擇活動類型</option>
                  <option value="文化藝術">文化藝術</option>
                  <option value="體育運動">體育運動</option>
                  <option value="教育學習">教育學習</option>
                  <option value="美食饗宴">美食饗宴</option>
                  <option value="節慶活動">節慶活動</option>
                  <option value="其他">其他</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        <!-- 主辦單位資訊 -->
        <div class="card mb-4">
          <div class="card-header">
            <h5 class="card-title mb-0">主辦單位資訊</h5>
          </div>
          <div class="card-body">
            <div class="row">
              <div class="col-md-6 mb-3">
                <label class="form-label">主辦單位名稱 <span class="text-danger">*</span></label>
                <input 
                  v-model="form.organizer_name" 
                  type="text" 
                  required 
                  class="form-control"
                  placeholder="請輸入主辦單位名稱"
                />
              </div>
              
              <div class="col-md-6 mb-3">
                <label class="form-label">主辦單位信箱</label>
                <input 
                  v-model="form.organizer_email" 
                  type="email" 
                  class="form-control"
                  placeholder="請輸入主辦單位信箱"
                />
                <div class="form-text">選填，用於活動相關聯繫</div>
              </div>
              
              <div class="col-md-6 mb-3">
                <label class="form-label">聯絡電話</label>
                <input 
                  v-model="form.organizer_phone" 
                  type="tel" 
                  class="form-control"
                  placeholder="請輸入聯絡電話"
                />
              </div>
            </div>
            
            <div class="mb-0">
              <label class="form-label">其他聯絡資訊</label>
              <textarea 
                v-model="form.contact_info" 
                rows="3"
                class="form-control"
                placeholder="其他聯絡方式，如 LINE ID、Facebook 等"
              ></textarea>
            </div>
          </div>
        </div>

        <!-- 提交者資訊 -->
        <div class="card mb-4">
          <div class="card-header">
            <h5 class="card-title mb-0">提交者資訊</h5>
          </div>
          <div class="card-body">
            <div class="row">
              <div class="col-md-6 mb-3">
                <label class="form-label">提交者姓名 <span class="text-danger">*</span></label>
                <input 
                  v-model="form.submitter_name" 
                  type="text" 
                  required 
                  class="form-control"
                  placeholder="提交者姓名"
                />
              </div>
              
              <div class="col-md-6 mb-3">
                <label class="form-label">提交者信箱 <span class="text-danger">*</span></label>
                <input 
                  v-model="form.submitter_email" 
                  type="email" 
                  required 
                  class="form-control"
                  placeholder="提交者信箱"
                />
                <div class="form-text">用於接收審核結果通知</div>
              </div>
            </div>
          </div>
        </div>

        <!-- 圖片管理 -->
        <div class="card mb-4">
          <div class="card-header">
            <h5 class="card-title mb-0">活動圖片</h5>
          </div>
          <div class="card-body">
            <!-- 現有圖片 -->
            <div v-if="form.images && form.images.length" class="mb-3">
              <h6>現有圖片</h6>
              <div class="row g-3">
                <div v-for="(image, index) in form.images" :key="index" class="col-md-4">
                  <div class="position-relative">
                    <img :src="image" class="img-fluid rounded" />
                    <button 
                      @click="removeExistingImage(index)"
                      type="button"
                      class="btn btn-danger btn-sm position-absolute top-0 end-0 m-2"
                    >
                      <i class="bi bi-x"></i>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <!-- 新增圖片預覽 -->
            <div v-if="newImagePreview && newImagePreview.length > 0" class="mb-3">
              <h6>新增圖片 ({{ newImagePreview.length }})</h6>
              <div class="row g-3">
                <div v-for="(preview, index) in newImagePreview" :key="`preview-${index}`" class="col-md-4">
                  <div class="position-relative">
                    <img :src="preview" class="img-fluid rounded" alt="圖片預覽" />
                    <button 
                      @click="removeNewImage(index)"
                      type="button"
                      class="btn btn-danger btn-sm position-absolute top-0 end-0 m-2"
                    >
                      <i class="bi bi-x"></i>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <!-- 圖片上傳 -->
            <div>
              <label class="form-label">上傳新圖片</label>
              <input 
                @change="handleFileChange"
                type="file" 
                multiple 
                accept="image/*"
                class="form-control"
                ref="fileInput"
              />
              <div class="form-text">支援 JPG、PNG、GIF 格式，單檔最大 5MB</div>
              
              <!-- 調試資訊 -->
              <div class="mt-2 small text-muted">
                <div>新圖片檔案數量: {{ newImageFiles.length }}</div>
                <div>新圖片預覽數量: {{ newImagePreview.length }}</div>
              </div>
            </div>
          </div>
        </div>

        <!-- 管理員備註 -->
        <div class="card mb-4">
          <div class="card-header">
            <h5 class="card-title mb-0">管理員備註</h5>
          </div>
          <div class="card-body">
            <textarea 
              v-model="form.admin_notes" 
              rows="4"
              class="form-control"
              placeholder="管理員備註（可選）"
            ></textarea>
          </div>
        </div>

        <!-- 操作按鈕 -->
        <div class="d-flex justify-content-between mb-4">
          <button @click="$router.back()" type="button" class="btn btn-secondary">
            取消
          </button>
          <button 
            type="submit" 
            class="btn btn-primary"
            :disabled="submitting"
          >
            <span v-if="submitting" class="spinner-border spinner-border-sm me-2"></span>
            {{ submitting ? '更新中...' : '儲存變更' }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
definePageMeta({
  middleware: 'admin-auth',
  layout: 'default'
})

const route = useRoute()
const router = useRouter()

const activity = ref(null)
const loading = ref(true)
const submitting = ref(false)
const deletedImages = ref([])
const newImageFiles = ref([])
const newImagePreview = ref([])

const form = ref({
  title: '',
  description: '',
  event_date: '',
  event_time: '',
  location: '',
  activity_type: '',
  organizer_name: '',
  organizer_email: '',
  organizer_phone: '',
  contact_info: '',
  submitter_name: '',
  submitter_email: '',
  admin_notes: '',
  images: []
})

const fetchActivity = async () => {
  try {
    loading.value = true
    const response = await $fetch(`/api/yilan-activities/${route.params.id}`)
    activity.value = response.data
    
    // 填入表單數據
    Object.keys(form.value).forEach(key => {
      if (activity.value[key] !== undefined) {
        form.value[key] = activity.value[key]
      }
    })
    
    // 格式化日期
    if (activity.value.event_date) {
      form.value.event_date = new Date(activity.value.event_date).toISOString().split('T')[0]
    }
    
  } catch (error) {
    console.error('Failed to fetch activity:', error)
    activity.value = null
  } finally {
    loading.value = false
  }
}

const handleFileChange = (event) => {
  console.log('handleFileChange 被觸發了', event.target.files)
  const files = Array.from(event.target.files)
  
  console.log('選擇的檔案數量:', files.length)
  
  files.forEach((file, fileIndex) => {
    console.log(`處理檔案 ${fileIndex + 1}:`, file.name, file.size)
    
    if (file.size > 5 * 1024 * 1024) {
      alert(`檔案 ${file.name} 超過 5MB 限制`)
      return
    }
    
    newImageFiles.value.push(file)
    console.log('newImageFiles 陣列長度:', newImageFiles.value.length)
    
    const reader = new FileReader()
    reader.onload = (e) => {
      console.log('圖片讀取完成:', e.target.result.substring(0, 50) + '...')
      newImagePreview.value.push(e.target.result)
      console.log('newImagePreview 陣列長度:', newImagePreview.value.length)
    }
    reader.onerror = (e) => {
      console.error('圖片讀取錯誤:', e)
    }
    reader.readAsDataURL(file)
  })
  
  // 清空檔案輸入，允許重複選擇同樣的檔案
  event.target.value = ''
}

const removeExistingImage = (index) => {
  const removedImage = form.value.images[index]
  deletedImages.value.push(removedImage)
  form.value.images.splice(index, 1)
}

const removeNewImage = (index) => {
  newImagePreview.value.splice(index, 1)
  newImageFiles.value.splice(index, 1)
}

const updateActivity = async () => {
  try {
    submitting.value = true
    
    console.log('=== 開始更新活動 ===')
    console.log('新圖片檔案數量:', newImageFiles.value.length)
    console.log('要刪除的圖片:', deletedImages.value)
    
    const formData = new FormData()
    
    // 添加基本表單數據
    Object.keys(form.value).forEach(key => {
      if (form.value[key] !== null && form.value[key] !== undefined && key !== 'images') {
        formData.append(key, form.value[key])
        console.log(`添加欄位 ${key}:`, form.value[key])
      }
    })
    
    // 添加要刪除的圖片
    deletedImages.value.forEach(image => {
      formData.append('deleteImages', image)
      console.log('標記刪除圖片:', image)
    })
    
    // 添加新圖片文件
    newImageFiles.value.forEach((file, index) => {
      formData.append('images', file)
      console.log(`添加新圖片檔案 ${index + 1}:`, file.name, file.size, 'bytes')
    })
    
    console.log('FormData 建立完成，發送請求...')
    
    const response = await $fetch(`/api/yilan-activities/${route.params.id}`, {
      method: 'PATCH',
      body: formData
    })
    
    console.log('✅ 更新成功:', response)
    alert('活動更新成功！')
    
    // 重新載入活動資料以顯示更新的圖片
    await fetchActivity()
    
    // 清空上傳相關的資料
    newImageFiles.value = []
    newImagePreview.value = []
    deletedImages.value = []
    
    router.push(`/admin/activities/${route.params.id}`)
    
  } catch (error) {
    console.error('❌ 更新失敗:', error)
    alert('更新失敗：' + (error.message || '未知錯誤'))
  } finally {
    submitting.value = false
  }
}

onMounted(() => {
  fetchActivity()
})
</script>

<style scoped lang="scss">
// 注意：這是 SCSS/Bootstrap 專案，請勿使用 Tailwind CSS 類別

.activity-edit-admin {
  background-color: #f8f9fa;
  min-height: 100vh;
  padding: 2rem 0;

  .container {
    max-width: 1200px;
  }

  .card {
    border: none;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    border-radius: 8px;
    margin-bottom: 1.5rem;
    
    .card-header {
      background-color: #fff;
      border-bottom: 1px solid #dee2e6;
      border-radius: 8px 8px 0 0;
      padding: 1rem 1.25rem;
      
      .card-title {
        color: #495057;
        font-weight: 600;
      }
    }
    
    .card-body {
      padding: 1.5rem;
    }
  }

  .form-control, .form-select {
    border-radius: 6px;
    border: 1px solid #ced4da;
    transition: border-color 0.15s ease-in-out, box-shadow 0.15s ease-in-out;
    
    &:focus {
      border-color: #86b7fe;
      box-shadow: 0 0 0 0.25rem rgba(13, 110, 253, 0.25);
    }
  }

  .form-text {
    color: #6c757d;
    font-size: 0.875rem;
    margin-top: 0.25rem;
  }

  .btn {
    border-radius: 6px;
    font-weight: 500;
    padding: 0.5rem 1rem;
    
    i {
      font-size: 1rem;
    }
    
    &.btn-primary {
      background-color: #0d6efd;
      border-color: #0d6efd;
      
      &:hover {
        background-color: #0b5ed7;
        border-color: #0a58ca;
      }
    }
    
    &.btn-outline-primary {
      color: #0d6efd;
      border-color: #0d6efd;
      
      &:hover {
        background-color: #0d6efd;
        border-color: #0d6efd;
        color: #fff;
      }
    }
  }

  .position-relative {
    img {
      border-radius: 8px;
      max-height: 200px;
      object-fit: cover;
      width: 100%;
    }
    
    .btn {
      border-radius: 50%;
      width: 32px;
      height: 32px;
      padding: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      position: absolute;
      top: 0.5rem;
      right: 0.5rem;
      background-color: rgba(220, 53, 69, 0.9);
      border-color: transparent;
      color: white;
      
      &:hover {
        background-color: #dc3545;
      }
    }
  }

  .spinner-border {
    width: 1.5rem;
    height: 1.5rem;
  }

  .text-danger {
    color: #dc3545 !important;
  }

  // 響應式設計
  @media (max-width: 768px) {
    padding: 1rem 0;
    
    .card-body {
      padding: 1rem;
    }
    
    .btn {
      width: 100%;
      margin-bottom: 0.5rem;
    }
    
    .d-flex.justify-content-between {
      flex-direction: column;
      
      .btn {
        margin-bottom: 0.5rem;
        
        &:last-child {
          margin-bottom: 0;
        }
      }
    }
  }
}
</style>