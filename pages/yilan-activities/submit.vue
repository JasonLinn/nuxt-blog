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

              <!-- 活動時間設定 -->
              <div class="mb-3">
                <div class="form-check">
                  <input
                    id="is_multi_day"
                    v-model="form.is_multi_day"
                    type="checkbox"
                    class="form-check-input"
                    @change="handleMultiDayChange"
                  />
                  <label for="is_multi_day" class="form-check-label">
                    跨日活動（多天活動）
                  </label>
                </div>
              </div>

              <!-- 活動日期 -->
              <div class="row">
                <div class="col-md-6">
                  <div class="mb-3">
                    <label for="event_start_date" class="form-label"
                      >{{ form.is_multi_day ? '開始日期' : '活動日期' }} <span class="text-danger">*</span></label
                    >
                    <input
                      id="event_start_date"
                      v-model="form.event_start_date"
                      type="date"
                      class="form-control"
                      :class="{ 'is-invalid': errors.event_start_date }"
                      :min="today"
                      required
                      @change="handleStartDateChange"
                    />
                    <div v-if="errors.event_start_date" class="invalid-feedback">
                      {{ errors.event_start_date }}
                    </div>
                  </div>
                </div>
                <div v-if="form.is_multi_day" class="col-md-6">
                  <div class="mb-3">
                    <label for="event_end_date" class="form-label"
                      >結束日期 <span class="text-danger">*</span></label
                    >
                    <input
                      id="event_end_date"
                      v-model="form.event_end_date"
                      type="date"
                      class="form-control"
                      :class="{ 'is-invalid': errors.event_end_date }"
                      :min="form.event_start_date || today"
                      :required="form.is_multi_day"
                    />
                    <div v-if="errors.event_end_date" class="invalid-feedback">
                      {{ errors.event_end_date }}
                    </div>
                  </div>
                </div>
              </div>

              <!-- 活動時間 -->
              <div class="row">
                <div class="col-md-6">
                  <div class="mb-3">
                    <label for="event_start_time" class="form-label">
                      {{ form.is_multi_day ? '開始時間' : '活動時間' }}
                    </label>
                    <input
                      id="event_start_time"
                      v-model="form.event_start_time"
                      type="time"
                      class="form-control"
                      :class="{ 'is-invalid': errors.event_start_time }"
                    />
                    <div v-if="errors.event_start_time" class="invalid-feedback">
                      {{ errors.event_start_time }}
                    </div>
                    <div class="form-text">選填，如有明確時間請填寫</div>
                  </div>
                </div>
                <div class="col-md-6">
                  <div class="mb-3">
                    <label for="event_end_time" class="form-label">結束時間</label>
                    <input
                      id="event_end_time"
                      v-model="form.event_end_time"
                      type="time"
                      class="form-control"
                      :class="{ 'is-invalid': errors.event_end_time }"
                      :disabled="!form.event_start_time && !form.is_multi_day"
                    />
                    <div v-if="errors.event_end_time" class="invalid-feedback">
                      {{ errors.event_end_time }}
                    </div>
                    <div class="form-text">
                      {{ form.is_multi_day ? '選填，多天活動的最終結束時間' : '選填，需先填寫開始時間' }}
                    </div>
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
                    <label for="organizer_email" class="form-label">主辦單位信箱</label>
                    <input
                      id="organizer_email"
                      v-model="form.organizer_email"
                      type="email"
                      class="form-control"
                      :class="{ 'is-invalid': errors.organizer_email }"
                      placeholder="請輸入主辦單位信箱"
                      maxlength="100"
                    />
                    <div v-if="errors.organizer_email" class="invalid-feedback">
                      {{ errors.organizer_email }}
                    </div>
                    <div class="form-text">選填，建議填寫以便聯繫</div>
                  </div>
                </div>
              </div>

              <div class="row">
                <div class="col-md-6">
                  <div class="mb-3">
                    <label for="organizer_phone" class="form-label">主辦單位電話</label>
                    <input
                      id="organizer_phone"
                      v-model="form.organizer_phone"
                      type="tel"
                      class="form-control"
                      placeholder="請輸入聯絡電話"
                      maxlength="20"
                    />
                    <div class="form-text">選填，建議填寫以便聯繫</div>
                  </div>
                </div>
                <div class="col-md-6">
                  <div class="mb-3">
                    <label for="organizer_contact" class="form-label">其他聯絡方式</label>
                    <input
                      id="organizer_contact"
                      v-model="form.organizer_contact"
                      type="text"
                      class="form-control"
                      placeholder="LINE ID、Facebook 等"
                      maxlength="100"
                    />
                    <div class="form-text">選填，如 LINE ID、社群媒體等</div>
                  </div>
                </div>
              </div>

              <!-- 提交者信息 -->
              <div class="row">
                <div class="col-md-6">
                  <div class="mb-3">
                    <label for="submitter_name" class="form-label"
                      >提交者姓名 <span class="text-danger">*</span></label
                    >
                    <input
                      id="submitter_name"
                      v-model="form.submitter_name"
                      type="text"
                      class="form-control"
                      :class="{ 'is-invalid': errors.submitter_name }"
                      placeholder="請輸入您的姓名"
                      maxlength="50"
                      required
                    />
                    <div v-if="errors.submitter_name" class="invalid-feedback">
                      {{ errors.submitter_name }}
                    </div>
                  </div>
                </div>
                <div class="col-md-6">
                  <div class="mb-3">
                    <label for="submitter_email" class="form-label"
                      >提交者信箱 <span class="text-danger">*</span></label
                    >
                    <input
                      id="submitter_email"
                      v-model="form.submitter_email"
                      type="email"
                      class="form-control"
                      :class="{ 'is-invalid': errors.submitter_email }"
                      placeholder="請輸入您的信箱"
                      maxlength="100"
                      required
                    />
                    <div v-if="errors.submitter_email" class="invalid-feedback">
                      {{ errors.submitter_email }}
                    </div>
                    <div class="form-text">用於接收審核結果通知</div>
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
  event_start_date: '',
  event_end_date: '',
  event_start_time: '',
  event_end_time: '',
  is_multi_day: false,
  location: '',
  organizer_name: '',
  organizer_email: '',
  organizer_phone: '',
  organizer_contact: '',
  submitter_name: '',
  submitter_email: '',
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

// 處理多天活動切換
const handleMultiDayChange = () => {
  if (!form.is_multi_day) {
    form.event_end_date = ''
    delete errors.event_end_date
  } else {
    // 如果開啟多天活動，自動設定結束日期為開始日期
    if (form.event_start_date) {
      form.event_end_date = form.event_start_date
    }
  }
}

// 處理開始日期變更
const handleStartDateChange = () => {
  // 如果是多天活動且結束日期早於開始日期，自動調整結束日期
  if (form.is_multi_day && form.event_end_date && form.event_end_date < form.event_start_date) {
    form.event_end_date = form.event_start_date
  }
  delete errors.event_start_date
}

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
    event_start_date: form.is_multi_day ? '開始日期' : '活動日期',
    location: '活動地點',
    organizer_name: '主辦單位',
    submitter_name: '提交者姓名',
    submitter_email: '提交者信箱'
  }

  // 如果是多天活動，結束日期也是必填
  if (form.is_multi_day) {
    requiredFields.event_end_date = '結束日期'
  }

  Object.entries(requiredFields).forEach(([field, label]) => {
    if (!form[field] || form[field].toString().trim() === '') {
      errors[field] = `${label}為必填項目`
      isValid = false
    }
  })

  // 日期驗證
  if (form.event_start_date && new Date(form.event_start_date) < new Date()) {
    errors.event_start_date = '活動日期不能早於今天'
    isValid = false
  }

  // 多天活動日期範圍驗證
  if (form.is_multi_day && form.event_start_date && form.event_end_date) {
    if (new Date(form.event_end_date) < new Date(form.event_start_date)) {
      errors.event_end_date = '結束日期不能早於開始日期'
      isValid = false
    }
  }

  // 時間範圍驗證
  if (form.event_start_time && form.event_end_time && !form.is_multi_day) {
    // 單日活動時間驗證
    if (form.event_start_date && form.event_end_time <= form.event_start_time) {
      errors.event_end_time = '結束時間必須晚於開始時間'
      isValid = false
    }
  }

  // Email 格式驗證
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
  if (form.organizer_email && form.organizer_email.trim() && !emailRegex.test(form.organizer_email)) {
    errors.organizer_email = '請輸入有效的電子信箱格式'
    isValid = false
  }
  if (form.submitter_email && !emailRegex.test(form.submitter_email)) {
    errors.submitter_email = '請輸入有效的電子信箱格式'
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
