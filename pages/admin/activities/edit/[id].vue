<template>
  <div class="activity-edit">
    <nav class="yp-breadcrumb" aria-label="麵包屑">
      <NuxtLink to="/admin/yilan-activities">宜蘭活動管理</NuxtLink>
      <NuxtLink :to="`/admin/activities/${route.params.id}`">活動詳情</NuxtLink>
      <span>編輯活動</span>
    </nav>

    <header class="yp-admin-head">
      <div>
        <h1 class="yp-admin-head__title">編輯活動</h1>
        <p class="yp-admin-head__desc">修改活動內容、主辦資訊與圖片</p>
      </div>
    </header>

    <!-- 載入狀態 -->
    <div v-if="loading" class="yp-form-section">
      <span class="yp-skeleton mb-3" style="width: 30%; height: 20px"></span>
      <span class="yp-skeleton mb-2" style="width: 100%; height: 44px"></span>
      <span class="yp-skeleton" style="width: 100%; height: 120px"></span>
    </div>

    <!-- 找不到活動 -->
    <div v-else-if="!activity" class="yp-card">
      <div class="yp-empty yp-empty--error">
        <div class="yp-empty__icon"><Icon name="ri:error-warning-line" /></div>
        <h3 class="yp-empty__title">找不到此活動</h3>
        <p class="yp-empty__text">活動可能已被刪除，或網址有誤</p>
        <NuxtLink to="/admin/yilan-activities" class="btn btn-primary">返回活動列表</NuxtLink>
      </div>
    </div>

    <form v-else @submit.prevent="updateActivity">
      <!-- 基本資訊 -->
      <section class="yp-form-section">
        <h2 class="yp-form-section__title">基本資訊</h2>
        <p class="yp-form-section__desc">活動名稱與簡介會顯示在前台活動頁。</p>
        <div class="mb-3">
          <label class="form-label required" for="f-title">活動標題</label>
          <input id="f-title" v-model="form.title" type="text" required class="form-control" />
        </div>
        <div>
          <label class="form-label required" for="f-description">活動簡介</label>
          <textarea
            id="f-description"
            v-model="form.description"
            required
            rows="6"
            class="form-control"
          ></textarea>
          <div class="form-text">{{ form.description?.length || 0 }}/1000 字</div>
        </div>
      </section>

      <!-- 活動詳情 -->
      <section class="yp-form-section">
        <h2 class="yp-form-section__title">活動詳情</h2>
        <p class="yp-form-section__desc">時間、地點與活動類型。</p>
        <div class="row g-3">
          <div class="col-md-6">
            <label class="form-label required" for="f-date">活動日期</label>
            <input
              id="f-date"
              v-model="form.event_date"
              type="date"
              required
              class="form-control"
            />
          </div>
          <div class="col-md-6">
            <label class="form-label" for="f-time">活動時間</label>
            <input id="f-time" v-model="form.event_time" type="time" class="form-control" />
          </div>
          <div class="col-md-6">
            <label class="form-label" for="f-location">活動地點</label>
            <input id="f-location" v-model="form.location" type="text" class="form-control" />
          </div>
          <div class="col-md-6">
            <label class="form-label" for="f-type">活動類型</label>
            <select id="f-type" v-model="form.activity_type" class="form-select">
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
      </section>

      <!-- 主辦單位資訊 -->
      <section class="yp-form-section">
        <h2 class="yp-form-section__title">主辦單位資訊</h2>
        <p class="yp-form-section__desc">聯絡窗口，方便民眾與管理員聯繫。</p>
        <div class="row g-3">
          <div class="col-md-6">
            <label class="form-label" for="f-org">主辦單位名稱</label>
            <input id="f-org" v-model="form.organizer_name" type="text" class="form-control" />
          </div>
          <div class="col-md-6">
            <label class="form-label" for="f-email">主辦單位信箱</label>
            <input id="f-email" v-model="form.organizer_email" type="email" class="form-control" />
            <div class="form-text">選填，用於活動相關聯繫</div>
          </div>
          <div class="col-md-6">
            <label class="form-label" for="f-phone">聯絡電話</label>
            <input id="f-phone" v-model="form.organizer_phone" type="tel" class="form-control" />
          </div>
          <div class="col-md-6">
            <label class="form-label" for="f-contact">其他聯絡方式</label>
            <textarea
              id="f-contact"
              v-model="form.contact_info"
              rows="3"
              class="form-control"
            ></textarea>
          </div>
        </div>
      </section>

      <!-- 提交者資訊 -->
      <section class="yp-form-section">
        <h2 class="yp-form-section__title">提交者資訊</h2>
        <p class="yp-form-section__desc">審核結果會寄送至提交者信箱。</p>
        <div class="row g-3">
          <div class="col-md-6">
            <label class="form-label required" for="f-sname">提交者姓名</label>
            <input
              id="f-sname"
              v-model="form.submitter_name"
              type="text"
              required
              class="form-control"
            />
          </div>
          <div class="col-md-6">
            <label class="form-label required" for="f-semail">提交者信箱</label>
            <input
              id="f-semail"
              v-model="form.submitter_email"
              type="email"
              required
              class="form-control"
            />
            <div class="form-text">用於接收審核結果通知</div>
          </div>
        </div>
      </section>

      <!-- 活動圖片 -->
      <section class="yp-form-section">
        <h2 class="yp-form-section__title">活動圖片</h2>
        <p class="yp-form-section__desc">支援 JPG、PNG、GIF 格式，單檔最大 5MB。</p>

        <!-- 現有圖片 -->
        <div v-if="form.images && form.images.length" class="mb-4">
          <h3 class="activity-edit__sub">現有圖片</h3>
          <div class="activity-edit__thumbs">
            <div v-for="(image, index) in form.images" :key="index" class="activity-edit__thumb">
              <img :src="image" :alt="`現有圖片 ${index + 1}`" />
              <button
                type="button"
                class="activity-edit__remove"
                :aria-label="`移除現有圖片 ${index + 1}`"
                @click="removeExistingImage(index)"
              >
                <Icon name="ri:close-line" />
              </button>
            </div>
          </div>
        </div>

        <!-- 新圖片預覽 -->
        <div v-if="newImagePreview.length" class="mb-4">
          <h3 class="activity-edit__sub">新增圖片</h3>
          <div class="activity-edit__thumbs">
            <div
              v-for="(preview, index) in newImagePreview"
              :key="index"
              class="activity-edit__thumb"
            >
              <img :src="preview" :alt="`新圖片預覽 ${index + 1}`" />
              <button
                type="button"
                class="activity-edit__remove"
                :aria-label="`移除新圖片 ${index + 1}`"
                @click="removeNewImage(index)"
              >
                <Icon name="ri:close-line" />
              </button>
            </div>
          </div>
        </div>

        <!-- 上傳新圖片 -->
        <label class="yp-upload d-block">
          <Icon name="ri:upload-2-line" class="activity-edit__upload-icon" />
          <span class="d-block fw-bold">點擊選擇圖片</span>
          <span class="d-block small">可一次選擇多張</span>
          <input
            ref="fileInput"
            type="file"
            multiple
            accept="image/*"
            class="d-none"
            @change="handleFileChange"
          />
        </label>
      </section>

      <!-- 管理員備註 -->
      <section class="yp-form-section">
        <h2 class="yp-form-section__title">管理員備註</h2>
        <p class="yp-form-section__desc">僅管理員可見，不會顯示在前台。</p>
        <textarea
          v-model="form.admin_notes"
          rows="4"
          placeholder="管理員內部備註..."
          class="form-control"
          aria-label="管理員備註"
        ></textarea>
      </section>

      <!-- 提交按鈕 -->
      <div class="yp-form-actions">
        <button type="button" class="btn btn-soft" @click="$router.back()">取消</button>
        <button type="submit" class="btn btn-primary" :disabled="submitting">
          <span
            v-if="submitting"
            class="spinner-border spinner-border-sm me-2"
            aria-hidden="true"
          ></span>
          {{ submitting ? '更新中...' : '儲存更新' }}
        </button>
      </div>
    </form>
  </div>
</template>

<script setup>
definePageMeta({
  middleware: 'admin-auth',
  layout: 'admin'
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
    Object.keys(form.value).forEach((key) => {
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
    Object.keys(form.value).forEach((key) => {
      if (form.value[key] !== null && form.value[key] !== undefined && key !== 'images') {
        formData.append(key, form.value[key])
        console.log(`添加欄位 ${key}:`, form.value[key])
      }
    })

    // 添加要刪除的圖片
    deletedImages.value.forEach((image) => {
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
.activity-edit {
  max-width: 880px;

  &__sub {
    font-size: 0.9375rem;
    font-weight: 700;
    margin: 0 0 10px;
  }

  &__thumbs {
    display: grid;
    gap: 12px;
    grid-template-columns: repeat(2, minmax(0, 1fr));

    @media (min-width: $yp-bp-md) {
      grid-template-columns: repeat(3, minmax(0, 1fr));
    }
  }

  &__thumb {
    position: relative;
    aspect-ratio: 16 / 10;
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
    top: 8px;
    right: 8px;
    width: 32px;
    height: 32px;
    display: grid;
    place-items: center;
    border: 0;
    border-radius: 50%;
    background: rgba(19, 48, 58, 0.7);
    color: #fff;
    font-size: 1.125rem;

    &:hover {
      background: $yp-danger;
    }
  }

  &__upload-icon {
    font-size: 2rem;
    color: $yp-primary;
    margin-bottom: 6px;
  }
}
</style>
