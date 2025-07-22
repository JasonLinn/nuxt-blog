<template>
  <div class="container">
    <div class="row">
      <div class="col-12">
        <div class="py-4 text-center">
          <h1 class="display-5 fw-bold text-primary mb-3">宜蘭活動總匯 - 投稿活動</h1>
          <p class="lead text-muted">分享您的精彩活動，讓更多人知道宜蘭的美好</p>
        </div>
      </div>
    </div>

    <div class="row justify-content-center">
      <div class="col-12 col-lg-8">
        <div class="card">
          <div class="card-header">
            <h2 class="card-title mb-0">活動投稿表單</h2>
          </div>
          <div class="card-body">
            <form novalidate @submit.prevent="submitActivity">
              <!-- 基本信息 -->
              <div class="row">
                <div class="col-md-8">
                  <div class="mb-3">
                    <label for="title" class="form-label"
                      >活動標題 <span class="text-danger">*</span></label
                    >
                    <input
                      id="title"
                      v-model="form.title"
                      type="text"
                      class="form-control"
                      :class="{ 'is-invalid': errors.title }"
                      placeholder="請輸入活動標題"
                      maxlength="100"
                      required
                    />
                    <div v-if="errors.title" class="invalid-feedback">{{ errors.title }}</div>
                  </div>
                </div>
                <div class="col-md-4">
                  <div class="mb-3">
                    <label for="activity_type" class="form-label"
                      >活動類型 <span class="text-danger">*</span></label
                    >
                    <select
                      id="activity_type"
                      v-model="form.activity_type"
                      class="form-select"
                      :class="{ 'is-invalid': errors.activity_type }"
                      required
                    >
                      <option value="">選擇活動類型</option>
                      <option value="文化藝術">文化藝術</option>
                      <option value="觀光旅遊">觀光旅遊</option>
                      <option value="美食餐飲">美食餐飲</option>
                      <option value="戶外運動">戶外運動</option>
                      <option value="親子活動">親子活動</option>
                      <option value="節慶慶典">節慶慶典</option>
                      <option value="教育講座">教育講座</option>
                      <option value="其他">其他</option>
                    </select>
                    <div v-if="errors.activity_type" class="invalid-feedback">
                      {{ errors.activity_type }}
                    </div>
                  </div>
                </div>
              </div>

              <div class="mb-3">
                <label for="description" class="form-label"
                  >活動描述 <span class="text-danger">*</span></label
                >
                <textarea
                  id="description"
                  v-model="form.description"
                  class="form-control"
                  :class="{ 'is-invalid': errors.description }"
                  rows="4"
                  placeholder="請描述您的活動內容、特色等..."
                  maxlength="500"
                  required
                ></textarea>
                <div class="form-text">{{ form.description.length }}/500 字</div>
                <div v-if="errors.description" class="invalid-feedback">
                  {{ errors.description }}
                </div>
              </div>

              <!-- 時間地點 -->
              <div class="row">
                <div class="col-md-6">
                  <div class="mb-3">
                    <label for="event_date" class="form-label"
                      >活動日期 <span class="text-danger">*</span></label
                    >
                    <input
                      id="event_date"
                      v-model="form.event_date"
                      type="date"
                      class="form-control"
                      :class="{ 'is-invalid': errors.event_date }"
                      :min="today"
                      required
                    />
                    <div v-if="errors.event_date" class="invalid-feedback">
                      {{ errors.event_date }}
                    </div>
                  </div>
                </div>
                <div class="col-md-6">
                  <div class="mb-3">
                    <label for="event_time" class="form-label">活動時間</label>
                    <input
                      id="event_time"
                      v-model="form.event_time"
                      type="time"
                      class="form-control"
                    />
                    <div class="form-text">選填，如有明確時間請填寫</div>
                  </div>
                </div>
              </div>

              <div class="mb-3">
                <label for="location" class="form-label"
                  >活動地點 <span class="text-danger">*</span></label
                >
                <input
                  id="location"
                  v-model="form.location"
                  type="text"
                  class="form-control"
                  :class="{ 'is-invalid': errors.location }"
                  placeholder="請輸入詳細地址或地標"
                  maxlength="200"
                  required
                />
                <div v-if="errors.location" class="invalid-feedback">{{ errors.location }}</div>
              </div>

              <!-- 主辦方信息 -->
              <div class="row">
                <div class="col-md-6">
                  <div class="mb-3">
                    <label for="organizer_name" class="form-label"
                      >主辦單位 <span class="text-danger">*</span></label
                    >
                    <input
                      id="organizer_name"
                      v-model="form.organizer_name"
                      type="text"
                      class="form-control"
                      :class="{ 'is-invalid': errors.organizer_name }"
                      placeholder="請輸入主辦單位名稱"
                      maxlength="100"
                      required
                    />
                    <div v-if="errors.organizer_name" class="invalid-feedback">
                      {{ errors.organizer_name }}
                    </div>
                  </div>
                </div>
                <div class="col-md-6">
                  <div class="mb-3">
                    <label for="organizer_contact" class="form-label"
                      >聯絡方式 <span class="text-danger">*</span></label
                    >
                    <input
                      id="organizer_contact"
                      v-model="form.organizer_contact"
                      type="text"
                      class="form-control"
                      :class="{ 'is-invalid': errors.organizer_contact }"
                      placeholder="電話、Email 或 LINE ID"
                      maxlength="100"
                      required
                    />
                    <div v-if="errors.organizer_contact" class="invalid-feedback">
                      {{ errors.organizer_contact }}
                    </div>
                  </div>
                </div>
              </div>

              <!-- 詳細信息 -->
              <div class="row">
                <div class="col-md-6">
                  <div class="mb-3">
                    <label for="price" class="form-label">活動費用</label>
                    <div class="input-group">
                      <span class="input-group-text">NT$</span>
                      <input
                        id="price"
                        v-model="form.price"
                        type="number"
                        class="form-control"
                        placeholder="0"
                        min="0"
                        step="1"
                      />
                    </div>
                    <div class="form-text">填寫 0 代表免費活動</div>
                  </div>
                </div>
                <div class="col-md-6">
                  <div class="mb-3">
                    <label for="capacity" class="form-label">參與人數限制</label>
                    <input
                      id="capacity"
                      v-model="form.capacity"
                      type="number"
                      class="form-control"
                      placeholder="不限制請留空"
                      min="1"
                      step="1"
                    />
                    <div class="form-text">選填，不填寫代表不限制人數</div>
                  </div>
                </div>
              </div>

              <div class="mb-3">
                <label for="website" class="form-label">活動網站或相關連結</label>
                <input
                  id="website"
                  v-model="form.website"
                  type="url"
                  class="form-control"
                  placeholder="https://example.com"
                  maxlength="200"
                />
                <div class="form-text">選填，可填寫官方網站、Facebook 活動頁面等</div>
              </div>

              <!-- 活動圖片 -->
              <div class="mb-3">
                <label for="images" class="form-label">活動圖片</label>
                <input
                  id="images"
                  type="file"
                  class="form-control"
                  :class="{ 'is-invalid': errors.images }"
                  accept="image/*"
                  multiple
                  @change="handleImageUpload"
                />
                <div class="form-text">可上傳多張圖片，建議大小不超過 2MB</div>
                <div v-if="errors.images" class="invalid-feedback">{{ errors.images }}</div>

                <!-- 圖片預覽 -->
                <div v-if="imagePreviews.length > 0" class="mt-3">
                  <div class="row">
                    <div
                      v-for="(preview, index) in imagePreviews"
                      :key="index"
                      class="col-4 col-md-3 mb-2"
                    >
                      <div class="position-relative">
                        <img
                          :src="preview"
                          class="img-thumbnail"
                          style="width: 100%; height: 100px; object-fit: cover"
                        />
                        <button
                          type="button"
                          class="btn btn-sm btn-danger position-absolute end-0 top-0 m-1"
                          style="padding: 2px 6px; font-size: 10px"
                          @click="removeImage(index)"
                        >
                          ×
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- 提交按鈕 -->
              <div class="d-flex justify-content-between mt-4">
                <NuxtLink to="/yilan-activities" class="btn btn-outline-secondary">
                  取消返回
                </NuxtLink>
                <button type="submit" class="btn btn-primary" :disabled="isSubmitting">
                  <span
                    v-if="isSubmitting"
                    class="spinner-border spinner-border-sm me-2"
                    role="status"
                  ></span>
                  {{ isSubmitting ? '提交中...' : '提交投稿' }}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>

// 表單資料
const form = reactive({
  title: '',
  description: '',
  activity_type: '',
  event_date: '',
  event_time: '',
  location: '',
  organizer_name: '',
  organizer_contact: '',
  price: null,
  capacity: null,
  website: '',
  images: []
})

// 表單驗證錯誤
const errors = reactive({})

// 提交狀態
const isSubmitting = ref(false)

// 圖片預覽
const imagePreviews = ref([])

// 今日日期
const today = computed(() => {
  const date = new Date()
  return date.toISOString().split('T')[0]
})

// 處理圖片上傳
const handleImageUpload = (event) => {
  const files = Array.from(event.target.files)
  form.images = files

  // 生成預覽圖
  imagePreviews.value = []
  files.forEach((file) => {
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader()
      reader.onload = (e) => {
        imagePreviews.value.push(e.target.result)
      }
      reader.readAsDataURL(file)
    }
  })
}

// 移除圖片
const removeImage = (index) => {
  imagePreviews.value.splice(index, 1)
  const newFiles = Array.from(form.images)
  newFiles.splice(index, 1)
  form.images = newFiles
}

// 表單驗證
const validateForm = () => {
  // 清除之前的錯誤
  Object.keys(errors).forEach((key) => delete errors[key])

  let isValid = true

  // 必填欄位驗證
  const requiredFields = {
    title: '活動標題',
    description: '活動描述',
    activity_type: '活動類型',
    event_date: '活動日期',
    location: '活動地點',
    organizer_name: '主辦單位',
    organizer_contact: '聯絡方式'
  }

  Object.entries(requiredFields).forEach(([field, label]) => {
    if (!form[field] || form[field].toString().trim() === '') {
      errors[field] = `${label}為必填項目`
      isValid = false
    }
  })

  // 日期驗證
  if (form.event_date && new Date(form.event_date) < new Date()) {
    errors.event_date = '活動日期不能早於今天'
    isValid = false
  }

  // 網址驗證
  if (form.website && !form.website.startsWith('http')) {
    form.website = 'https://' + form.website
  }

  return isValid
}

// 提交表單
const submitActivity = async () => {
  if (!validateForm()) {
    // 滾動到第一個錯誤欄位
    const firstError = document.querySelector('.is-invalid')
    if (firstError) {
      firstError.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
    return
  }

  isSubmitting.value = true

  try {
    // 準備 FormData
    const formData = new FormData()

    // 添加文字欄位
    Object.entries(form).forEach(([key, value]) => {
      if (key !== 'images' && value !== null && value !== '') {
        formData.append(key, value)
      }
    })

    // 添加圖片檔案
    if (form.images && form.images.length > 0) {
      form.images.forEach((file, index) => {
        formData.append('images', file)
      })
    }

    // 提交到 API
    const response = await $fetch('/api/yilan-activities', {
      method: 'POST',
      body: formData
    })

    if (response.success) {
      // 提交成功，顯示成功訊息並跳轉
      await navigateTo({
        path: '/yilan-activities',
        query: { success: 'submitted' }
      })
    } else {
      throw new Error(response.message || '提交失敗')
    }
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('提交活動失敗:', error)

    // 顯示錯誤訊息
    const errorMessage = error.data?.message || error.message || '提交失敗，請稍後再試'

    // 這裡可以用 toast 或 alert 顯示錯誤
    alert(errorMessage)
  } finally {
    isSubmitting.value = false
  }
}

// 設定頁面標題
useHead({
  title: '宜蘭活動投稿 | 宜蘭活動總匯',
  meta: [{ name: 'description', content: '投稿您的精彩宜蘭活動，與大家分享宜蘭的美好體驗' }]
})
</script>
