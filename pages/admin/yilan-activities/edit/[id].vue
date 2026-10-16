<template>
  <div class="yilan-edit">
    <nav class="yp-breadcrumb" aria-label="麵包屑">
      <NuxtLink to="/admin/yilan-activities">宜蘭活動管理</NuxtLink>
      <NuxtLink :to="`/admin/yilan-activities/${route.params.id}`">活動詳情</NuxtLink>
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
              <option value="觀光旅遊">觀光旅遊</option>
              <option value="美食餐飲">美食餐飲</option>
              <option value="戶外運動">戶外運動</option>
              <option value="親子活動">親子活動</option>
              <option value="節慶慶典">節慶慶典</option>
              <option value="教育講座">教育講座</option>
              <option value="商業促銷">商業促銷</option>
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
            <label class="form-label" for="f-email">聯絡信箱</label>
            <input id="f-email" v-model="form.organizer_email" type="email" class="form-control" />
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

      <!-- 活動圖片 -->
      <section class="yp-form-section">
        <h2 class="yp-form-section__title">活動圖片</h2>
        <p class="yp-form-section__desc">最多 5 張，支援 JPG、PNG，單張不超過 5MB。</p>

        <!-- 現有圖片 -->
        <div v-if="form.images && form.images.length" class="mb-4">
          <h3 class="yilan-edit__sub">現有圖片</h3>
          <div class="yilan-edit__thumbs">
            <div v-for="(image, index) in form.images" :key="index" class="yilan-edit__thumb">
              <img :src="image" :alt="`現有圖片 ${index + 1}`" />
              <button
                type="button"
                class="yilan-edit__remove"
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
          <h3 class="yilan-edit__sub">新增圖片</h3>
          <div class="yilan-edit__thumbs">
            <div v-for="(preview, index) in newImagePreview" :key="index" class="yilan-edit__thumb">
              <img :src="preview.url" :alt="`新圖片預覽 ${index + 1}`" />
              <button
                type="button"
                class="yilan-edit__remove"
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
          <Icon name="ri:upload-2-line" class="yilan-edit__upload-icon" />
          <span class="d-block fw-bold">點擊選擇圖片</span>
          <span class="d-block small">可一次選擇多張（最多 5 張）</span>
          <input
            ref="fileInput"
            type="file"
            multiple
            accept="image/*"
            class="d-none"
            @change="handleFileUpload"
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
const newImageFiles = ref([])
const newImagePreview = ref([])
const deletedImages = ref([])
const fileInput = ref(null)

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
  admin_notes: '',
  images: []
})

const fetchActivity = async () => {
  try {
    loading.value = true
    const response = await $fetch(`/api/yilan-activities/${route.params.id}`)
    activity.value = response.data

    // 填充表單
    Object.keys(form.value).forEach((key) => {
      if (activity.value[key] !== null && activity.value[key] !== undefined) {
        form.value[key] = activity.value[key]
      }
    })

    // 處理日期格式
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

const handleFileUpload = (event) => {
  const files = Array.from(event.target.files)
  const totalImages = (form.value.images?.length || 0) + newImageFiles.value.length + files.length

  if (totalImages > 5) {
    alert('最多只能有 5 張圖片')
    return
  }

  files.forEach((file) => {
    if (file.size > 5 * 1024 * 1024) {
      alert(`圖片 ${file.name} 超過 5MB，請選擇較小的檔案`)
      return
    }

    const reader = new FileReader()
    reader.onload = (e) => {
      newImagePreview.value.push({
        url: e.target.result,
        file
      })
      newImageFiles.value.push(file)
    }
    reader.readAsDataURL(file)
  })

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

    const formData = new FormData()

    // 添加基本表單數據
    Object.keys(form.value).forEach((key) => {
      if (form.value[key] !== null && form.value[key] !== undefined && key !== 'images') {
        formData.append(key, form.value[key])
      }
    })

    // 添加現有圖片（去除已刪除的）
    const remainingImages = form.value.images || []
    formData.append('images', JSON.stringify(remainingImages))

    // 添加要刪除的圖片
    deletedImages.value.forEach((image) => {
      formData.append('deleteImages', image)
    })

    // 添加新圖片文件
    newImageFiles.value.forEach((file) => {
      formData.append('images', file)
    })

    await $fetch(`/api/yilan-activities/${route.params.id}`, {
      method: 'PATCH',
      body: formData
    })

    router.push(`/admin/yilan-activities/${route.params.id}`)
  } catch (error) {
    console.error('Failed to update activity:', error)
    alert('更新失敗，請稍後再試')
  } finally {
    submitting.value = false
  }
}

onMounted(() => {
  fetchActivity()
})
</script>

<style scoped lang="scss">
.yilan-edit {
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
