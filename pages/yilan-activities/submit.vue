<template>
  <div class="yp-page yp-page--form">
    <nav class="yp-breadcrumb" aria-label="導覽">
      <NuxtLink to="/">首頁</NuxtLink>
      <NuxtLink to="/yilan-activities">宜蘭活動總匯</NuxtLink>
      <span>投稿活動</span>
    </nav>

    <header class="yp-page-head">
      <div>
        <h1 class="yp-page-head__title">投稿活動</h1>
        <p class="yp-page-head__desc">
          分享您的精彩活動，讓更多人知道宜蘭的美好。審核通過後會刊登在活動總匯。
        </p>
      </div>
    </header>

    <SubmissionLoginGate v-if="loginRequired" :login-url="loginUrl" title="請先登入再投稿活動" />
    <form v-else novalidate @submit.prevent="submitActivity">
      <!-- AI 自動填入區塊（僅管理員可見） -->
      <section v-if="isAdmin" class="yp-form-section ai-assist">
        <h2 class="yp-form-section__title">
          <Icon name="ri:robot-2-line" class="me-1" />AI 智能填表助手
        </h2>
        <p class="yp-form-section__desc">上傳活動海報，讓 AI 自動幫您填寫表單內容</p>

        <input
          id="ai-image"
          ref="aiImageInput"
          type="file"
          class="form-control"
          accept="image/*"
          :disabled="aiProcessing"
          @change="handleAIImageUpload"
        />
        <div class="form-text">支援 JPG、PNG、WebP 格式，建議大小不超過 5MB</div>

        <div v-if="aiProcessing" class="py-3 text-center">
          <div class="spinner-border text-primary" role="status">
            <span class="visually-hidden">分析中...</span>
          </div>
          <p class="mb-0 mt-2">Gemini AI 正在分析圖片，請稍候...</p>
        </div>

        <div v-if="aiResult" class="mt-3">
          <div class="alert alert-success d-flex align-items-center gap-2">
            <Icon name="ri:checkbox-circle-line" /> AI 分析完成！已自動填入以下欄位
          </div>
          <div class="yp-tags">
            <span v-for="field in filledFields" :key="field" class="yp-tag yp-tag--success">
              {{ field }}
            </span>
          </div>
        </div>

        <div v-if="aiError" class="alert alert-danger d-flex align-items-center mt-3 gap-2">
          <Icon name="ri:error-warning-line" /> {{ aiError }}
        </div>
      </section>

      <!-- 活動內容 -->
      <section class="yp-form-section">
        <h2 class="yp-form-section__title">活動內容</h2>
        <p class="yp-form-section__desc">標題與介紹是旅客第一眼看到的資訊，請寫得清楚一些。</p>

        <div class="row g-3">
          <div class="col-md-8">
            <label for="title" class="form-label required">活動標題</label>
            <input
              id="title"
              v-model="form.title"
              type="text"
              class="form-control"
              :class="{ 'is-invalid': errors.title, 'ai-filled': aiFilledFields.includes('title') }"
              placeholder="請輸入活動標題"
              maxlength="100"
              required
            />
            <div v-if="errors.title" class="invalid-feedback">{{ errors.title }}</div>
          </div>
          <div class="col-md-4">
            <label for="activity_type" class="form-label required">活動類型</label>
            <select
              id="activity_type"
              v-model="form.activity_type"
              class="form-select"
              :class="{
                'is-invalid': errors.activity_type,
                'ai-filled': aiFilledFields.includes('activity_type')
              }"
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
          <div class="col-12">
            <label for="description" class="form-label required">活動描述</label>
            <textarea
              id="description"
              v-model="form.description"
              class="form-control"
              :class="{
                'is-invalid': errors.description,
                'ai-filled': aiFilledFields.includes('description')
              }"
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
        </div>
      </section>

      <!-- 時間與地點 -->
      <section class="yp-form-section">
        <h2 class="yp-form-section__title">時間與地點</h2>
        <p class="yp-form-section__desc">跨日活動請勾選下方選項並填寫結束日期。</p>

        <div class="row g-3">
          <div class="col-12">
            <div class="form-check">
              <input
                id="is_multi_day"
                v-model="form.is_multi_day"
                type="checkbox"
                class="form-check-input"
                @change="handleMultiDayChange"
              />
              <label for="is_multi_day" class="form-check-label">跨日活動（多天活動）</label>
            </div>
          </div>

          <div class="col-md-6">
            <label for="event_start_date" class="form-label required">{{
              form.is_multi_day ? '開始日期' : '活動日期'
            }}</label>
            <input
              id="event_start_date"
              v-model="form.event_start_date"
              type="date"
              class="form-control"
              :class="{
                'is-invalid': errors.event_start_date,
                'ai-filled': aiFilledFields.includes('event_start_date')
              }"
              required
              @change="handleStartDateChange"
            />
            <div v-if="errors.event_start_date" class="invalid-feedback">
              {{ errors.event_start_date }}
            </div>
          </div>
          <div v-if="form.is_multi_day" class="col-md-6">
            <label for="event_end_date" class="form-label required">結束日期</label>
            <input
              id="event_end_date"
              v-model="form.event_end_date"
              type="date"
              class="form-control"
              :class="{
                'is-invalid': errors.event_end_date,
                'ai-filled': aiFilledFields.includes('event_end_date')
              }"
              :min="form.event_start_date"
              :required="form.is_multi_day"
            />
            <div v-if="errors.event_end_date" class="invalid-feedback">
              {{ errors.event_end_date }}
            </div>
          </div>

          <div class="col-md-6">
            <label for="event_start_time" class="form-label">{{
              form.is_multi_day ? '開始時間' : '活動時間'
            }}</label>
            <input
              id="event_start_time"
              v-model="form.event_start_time"
              type="time"
              class="form-control"
              :class="{
                'is-invalid': errors.event_start_time,
                'ai-filled': aiFilledFields.includes('event_start_time')
              }"
            />
            <div v-if="errors.event_start_time" class="invalid-feedback">
              {{ errors.event_start_time }}
            </div>
            <div class="form-text">選填，如有明確時間請填寫</div>
          </div>
          <div class="col-md-6">
            <label for="event_end_time" class="form-label">結束時間</label>
            <input
              id="event_end_time"
              v-model="form.event_end_time"
              type="time"
              class="form-control"
              :class="{
                'is-invalid': errors.event_end_time,
                'ai-filled': aiFilledFields.includes('event_end_time')
              }"
              :disabled="!form.event_start_time && !form.is_multi_day"
            />
            <div v-if="errors.event_end_time" class="invalid-feedback">
              {{ errors.event_end_time }}
            </div>
            <div class="form-text">
              {{ form.is_multi_day ? '選填，多天活動的最終結束時間' : '選填，需先填寫開始時間' }}
            </div>
          </div>

          <div class="col-12">
            <label for="location" class="form-label required">活動地點</label>
            <input
              id="location"
              v-model="form.location"
              type="text"
              class="form-control"
              :class="{
                'is-invalid': errors.location,
                'ai-filled': aiFilledFields.includes('location')
              }"
              placeholder="請輸入詳細地址或地標"
              maxlength="200"
              required
            />
            <div v-if="errors.location" class="invalid-feedback">{{ errors.location }}</div>
          </div>
        </div>
      </section>

      <!-- 主辦單位 -->
      <section class="yp-form-section">
        <h2 class="yp-form-section__title">主辦單位</h2>
        <p class="yp-form-section__desc">提供聯絡方式，方便旅客與我們聯繫您。</p>

        <div class="row g-3">
          <div class="col-md-6">
            <label for="organizer_name" class="form-label required">主辦單位</label>
            <input
              id="organizer_name"
              v-model="form.organizer_name"
              type="text"
              class="form-control"
              :class="{
                'is-invalid': errors.organizer_name,
                'ai-filled': aiFilledFields.includes('organizer_name')
              }"
              placeholder="請輸入主辦單位名稱"
              maxlength="100"
              required
            />
            <div v-if="errors.organizer_name" class="invalid-feedback">
              {{ errors.organizer_name }}
            </div>
          </div>
          <div class="col-md-6">
            <label for="organizer_email" class="form-label">主辦單位信箱</label>
            <input
              id="organizer_email"
              v-model="form.organizer_email"
              type="email"
              class="form-control"
              :class="{
                'is-invalid': errors.organizer_email,
                'ai-filled': aiFilledFields.includes('organizer_email')
              }"
              placeholder="請輸入主辦單位信箱"
              maxlength="100"
            />
            <div v-if="errors.organizer_email" class="invalid-feedback">
              {{ errors.organizer_email }}
            </div>
            <div class="form-text">選填，建議填寫以便聯繫</div>
          </div>
          <div class="col-md-6">
            <label for="organizer_phone" class="form-label">主辦單位電話</label>
            <input
              id="organizer_phone"
              v-model="form.organizer_phone"
              type="tel"
              class="form-control"
              :class="{ 'ai-filled': aiFilledFields.includes('organizer_phone') }"
              placeholder="請輸入聯絡電話"
              maxlength="20"
            />
            <div class="form-text">選填，建議填寫以便聯繫</div>
          </div>
          <div class="col-md-6">
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
      </section>

      <!-- 活動詳情 -->
      <section class="yp-form-section">
        <h2 class="yp-form-section__title">活動詳情</h2>
        <p class="yp-form-section__desc">費用、名額與相關連結，皆為選填。</p>

        <div class="row g-3">
          <div class="col-md-6">
            <label for="price" class="form-label">活動費用</label>
            <div class="input-group">
              <span class="input-group-text">NT$</span>
              <input
                id="price"
                v-model="form.price"
                type="number"
                class="form-control"
                :class="{ 'ai-filled': aiFilledFields.includes('price') }"
                placeholder="0"
                min="0"
                step="1"
              />
            </div>
            <div class="form-text">填寫 0 代表免費活動</div>
          </div>
          <div class="col-md-6">
            <label for="capacity" class="form-label">參與人數限制</label>
            <input
              id="capacity"
              v-model="form.capacity"
              type="number"
              class="form-control"
              :class="{ 'ai-filled': aiFilledFields.includes('capacity') }"
              placeholder="不限制請留空"
              min="1"
              step="1"
            />
            <div class="form-text">選填，不填寫代表不限制人數</div>
          </div>
          <div class="col-12">
            <label for="website" class="form-label">活動網站或相關連結</label>
            <input
              id="website"
              v-model="form.website"
              type="url"
              class="form-control"
              :class="{ 'ai-filled': aiFilledFields.includes('website') }"
              placeholder="https://example.com"
              maxlength="200"
            />
            <div class="form-text">選填，可填寫官方網站、Facebook 活動頁面等</div>
          </div>
        </div>
      </section>

      <!-- 活動圖片 -->
      <section class="yp-form-section">
        <h2 class="yp-form-section__title">活動圖片</h2>
        <p class="yp-form-section__desc">可上傳多張圖片，建議大小不超過 2MB。</p>

        <label for="images" class="yp-upload upload-zone" :class="{ 'is-invalid': errors.images }">
          <input
            id="images"
            type="file"
            class="upload-zone__input"
            accept="image/*"
            multiple
            @change="handleImageUpload"
          />
          <Icon name="ri:image-add-line" class="upload-zone__icon" />
          <span class="upload-zone__title">點擊或拖曳圖片到這裡上傳</span>
          <span class="upload-zone__hint">支援 JPG、PNG、WebP，可一次選取多張</span>
        </label>
        <div v-if="errors.images" class="text-danger small mt-2">{{ errors.images }}</div>

        <!-- 圖片預覽 -->
        <div v-if="imagePreviews.length > 0" class="preview-grid">
          <div v-for="(preview, index) in imagePreviews" :key="index" class="preview-grid__item">
            <img :src="preview" :alt="`預覽圖片 ${index + 1}`" />
            <button
              type="button"
              class="preview-grid__remove"
              :aria-label="`移除圖片 ${index + 1}`"
              @click="removeImage(index)"
            >
              <Icon name="ri:close-line" />
            </button>
          </div>
        </div>
      </section>

      <!-- 提交者資訊 -->
      <section class="yp-form-section">
        <h2 class="yp-form-section__title">投稿人資訊</h2>
        <p class="yp-form-section__desc">僅供審核聯繫，不會公開顯示。</p>

        <div class="row g-3">
          <div class="col-md-6">
            <label for="submitter_name" class="form-label required">提交者姓名</label>
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
          <div class="col-md-6">
            <label for="submitter_email" class="form-label required">提交者信箱</label>
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
      </section>

      <!-- 提交按鈕 -->
      <div class="yp-form-actions">
        <NuxtLink to="/yilan-activities" class="btn btn-outline-secondary">取消返回</NuxtLink>
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
</template>

<script setup>
const { loginRequired, loginUrl } = useSubmissionLogin()

// 檢查是否為管理員
const isAdmin = ref(false)

// AI 相關狀態
const aiProcessing = ref(false)
const aiResult = ref(null)
const aiError = ref('')
const aiFilledFields = ref([])
const aiImageInput = ref(null)

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

// 已填入欄位的中文名稱
const filledFields = computed(() => {
  const fieldNames = {
    title: '活動標題',
    description: '活動描述',
    activity_type: '活動類型',
    event_start_date: '開始日期',
    event_end_date: '結束日期',
    event_start_time: '開始時間',
    event_end_time: '結束時間',
    location: '活動地點',
    organizer_name: '主辦單位',
    organizer_email: '主辦信箱',
    organizer_phone: '主辦電話',
    price: '活動費用',
    capacity: '人數限制',
    website: '活動網站'
  }

  return aiFilledFields.value.map((field) => fieldNames[field] || field)
})

// 檢查管理員權限
onMounted(async () => {
  try {
    const response = await $fetch('/api/auth/check-admin')
    isAdmin.value = response.isAdmin
  } catch (error) {
    isAdmin.value = false
  }
})

// 處理 AI 圖片上傳
const handleAIImageUpload = async (event) => {
  const file = event.target.files?.[0]

  if (!file) return

  // 檢查檔案大小（5MB）
  if (file.size > 5 * 1024 * 1024) {
    aiError.value = '圖片大小不能超過 5MB'
    return
  }

  aiProcessing.value = true
  aiError.value = ''
  aiResult.value = null
  aiFilledFields.value = []

  try {
    const formData = new FormData()
    formData.append('image', file)

    const response = await $fetch('/api/ai/extract-activity-info', {
      method: 'POST',
      body: formData
    })

    if (response.success && response.data) {
      aiResult.value = response.data

      // 自動填入表單
      const data = response.data
      const filled = []

      if (data.title) {
        form.title = data.title
        filled.push('title')
      }
      if (data.description) {
        form.description = data.description
        filled.push('description')
      }
      if (data.activity_type) {
        form.activity_type = data.activity_type
        filled.push('activity_type')
      }
      if (data.event_start_date) {
        form.event_start_date = data.event_start_date
        filled.push('event_start_date')
      }
      if (data.event_end_date) {
        form.event_end_date = data.event_end_date
        filled.push('event_end_date')
      }
      if (data.event_start_time) {
        form.event_start_time = data.event_start_time
        filled.push('event_start_time')
      }
      if (data.event_end_time) {
        form.event_end_time = data.event_end_time
        filled.push('event_end_time')
      }
      if (data.is_multi_day !== null) {
        form.is_multi_day = data.is_multi_day
      }
      if (data.location) {
        form.location = data.location
        filled.push('location')
      }
      if (data.organizer_name) {
        form.organizer_name = data.organizer_name
        filled.push('organizer_name')
      }
      if (data.organizer_email) {
        form.organizer_email = data.organizer_email
        filled.push('organizer_email')
      }
      if (data.organizer_phone) {
        form.organizer_phone = data.organizer_phone
        filled.push('organizer_phone')
      }
      if (data.price !== null) {
        form.price = data.price
        filled.push('price')
      }
      if (data.capacity !== null) {
        form.capacity = data.capacity
        filled.push('capacity')
      }
      if (data.website) {
        form.website = data.website
        filled.push('website')
      }

      aiFilledFields.value = filled

      // 清空檔案輸入
      if (aiImageInput.value) {
        aiImageInput.value.value = ''
      }
    } else {
      throw new Error('AI 分析失敗')
    }
  } catch (error) {
    console.error('AI 分析錯誤:', error)
    aiError.value = error.data?.message || error.message || 'AI 分析失敗，請稍後再試'
  } finally {
    aiProcessing.value = false
  }
}

// 處理多天活動切換
const handleMultiDayChange = () => {
  if (!form.is_multi_day) {
    form.event_end_date = ''
    delete errors.event_end_date
  } else if (form.event_start_date) {
    // 如果開啟多天活動，自動設定結束日期為開始日期
    form.event_end_date = form.event_start_date
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
  if (
    form.organizer_email &&
    form.organizer_email.trim() &&
    !emailRegex.test(form.organizer_email)
  ) {
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

<style scoped lang="scss">
// AI 填入的欄位高亮
.ai-filled {
  border-color: $yp-success !important;
  background-color: $yp-success-soft !important;

  &:focus {
    box-shadow: 0 0 0 0.2rem rgba($yp-success, 0.25) !important;
  }
}

.ai-assist {
  border-left: 4px solid $yp-primary;
}

// 圖片上傳區：整個區塊都是 file input 的點擊 / 拖放目標
.upload-zone {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;

  &:focus-within {
    border-color: $yp-primary;
    background: $yp-primary-soft;
  }

  &.is-invalid {
    border-color: $yp-danger;
  }

  &__input {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    opacity: 0;
    cursor: pointer;
  }

  &__icon {
    font-size: 32px;
    color: $yp-primary;
  }

  &__title {
    font-weight: 700;
    color: $yp-ink;
  }

  &__hint {
    font-size: 0.8125rem;
  }
}

.preview-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
  margin-top: 16px;

  @media (min-width: $yp-bp-md) {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }

  &__item {
    position: relative;
    aspect-ratio: 1;
    border-radius: $yp-radius;
    overflow: hidden;
    background: $yp-surface-2;

    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      display: block;
    }
  }

  &__remove {
    position: absolute;
    top: 6px;
    right: 6px;
    width: 28px;
    height: 28px;
    display: grid;
    place-items: center;
    border: 0;
    border-radius: 50%;
    background: rgba($yp-ink, 0.75);
    color: #fff;
    padding: 0;

    &:hover {
      background: $yp-danger;
    }
  }
}
</style>
