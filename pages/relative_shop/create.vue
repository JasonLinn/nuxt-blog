<template>
  <div class="yp-page yp-page--form">
    <nav class="yp-breadcrumb" aria-label="breadcrumb">
      <NuxtLink to="/">首頁</NuxtLink>
      <NuxtLink to="/relative">代訂服務</NuxtLink>
      <span>新增</span>
    </nav>
    <header class="yp-page-head">
      <div>
        <h1 class="yp-page-head__title">新增代訂服務</h1>
        <p class="yp-page-head__desc">填寫合作店家資訊、圖片與服務內容後發布。</p>
      </div>
    </header>

    <form @submit.prevent="handleSubmit">
      <!-- 基本資訊 -->
      <section class="yp-form-section">
        <h2 class="yp-form-section__title">基本資訊</h2>
        <p class="yp-form-section__desc">店家名稱與服務分類。</p>
        <div class="mb-3">
          <label for="title" class="form-label required">合作店家名稱</label>
          <input
            id="title"
            v-model="articleData.title"
            placeholder="請輸入合作店家名稱"
            name="title"
            type="text"
            autocomplete="title"
            class="form-control"
          />
        </div>
        <div>
          <label for="category" class="form-label required">分類</label>
          <select id="category" v-model="articleData.category" class="form-select">
            <option v-for="cate in categoryRelative" :key="cate.id" :value="cate.id">
              {{ cate.name }}
            </option>
          </select>
        </div>
      </section>

      <!-- 圖片 -->
      <section class="yp-form-section">
        <h2 class="yp-form-section__title">圖片</h2>
        <p class="yp-form-section__desc">
          可貼上圖片網址，或直接上傳（JPEG、PNG、GIF，單檔 5MB 內）。
        </p>

        <label for="coverUrl" class="form-label"><TipIcon />圖片 URL</label>
        <div class="input-group mb-3">
          <input
            id="coverUrl"
            v-model="coverUrl"
            placeholder="請輸入圖片 URL"
            type="text"
            class="form-control"
            @keyup.enter="addCoverUrl"
          />
          <button
            type="button"
            class="btn btn-primary"
            :disabled="!coverUrl"
            @click.prevent="addCoverUrl"
          >
            添加
          </button>
        </div>

        <label for="fileUpload" class="yp-upload d-block">
          <Icon name="ri:image-add-line" class="fs-2 text-primary" />
          <div class="fw-bold mt-1">或 上傳代表性圖片</div>
          <div class="small">點擊選擇檔案，可一次選多張</div>
        </label>
        <input
          id="fileUpload"
          type="file"
          accept="image/*"
          multiple
          class="visually-hidden"
          @change="handleFileUpload"
        />

        <div v-if="articleData.cover?.length" class="create-img">
          <div v-for="(url, index) in articleData.cover" :key="index" class="create-img__item">
            <img :src="url" :alt="'圖片 ' + (index + 1)" />
            <button
              type="button"
              class="create-img__remove"
              :aria-label="'移除圖片 ' + (index + 1)"
              @click.prevent="removeImage(index)"
            >
              <Icon name="ri:close-line" />
            </button>
          </div>
        </div>
      </section>

      <!-- 內容 -->
      <section class="yp-form-section">
        <h2 class="yp-form-section__title">代訂服務內容</h2>
        <p class="yp-form-section__desc">介紹服務項目、價格與預約方式。</p>
        <ClientOnly>
          <!-- Quill 編輯器容器 -->
          <div id="quill-editor" class="editor-container"></div>
          <!-- 隱藏的 textarea 用於保存內容 -->
          <textarea
            id="quill-content-hidden"
            v-model="articleData.content"
            style="display: none"
          ></textarea>

          <template #fallback>
            <textarea
              id="content-fallback"
              v-model="articleData.content"
              name="content"
              rows="8"
              placeholder="正在載入編輯器..."
              class="form-control"
            />
          </template>
        </ClientOnly>
      </section>

      <div class="yp-form-actions">
        <NuxtLink class="btn btn-ghost" to="/">取消</NuxtLink>
        <button type="submit" class="btn btn-primary">發布</button>
      </div>
    </form>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { categoryRelative } from '~/utils/category'

// Quill 實例
let quill = null

const articleData = reactive({
  title: '',
  category: '',
  content: '',
  cover: [],
  amount: 0,
  usedTimes: 0,
  hash: ''
})
const isReferral = ref(false)
const coverUrl = ref('')

// 初始化 Quill 編輯器
onMounted(() => {
  // 確保只在客戶端執行
  if (process.client) {
    // 加載 Quill CDN
    const quillCSS = document.createElement('link')
    quillCSS.href = 'https://cdn.quilljs.com/1.3.6/quill.snow.css'
    quillCSS.rel = 'stylesheet'
    document.head.appendChild(quillCSS)

    const quillScript = document.createElement('script')
    quillScript.src = 'https://cdn.quilljs.com/1.3.6/quill.min.js'
    quillScript.onload = initQuill
    document.head.appendChild(quillScript)
  }
})

// Quill 初始化狀態標誌
let quillInitialized = false

function initQuill() {
  // 確保只在客戶端執行
  if (!process.client) return

  if (quillInitialized) return

  // 確保 DOM 元素存在
  const editorContainer = document.getElementById('quill-editor')
  if (!editorContainer) return

  // 確保 Quill 已加載
  if (typeof window === 'undefined' || !window.Quill) return

  quill = new window.Quill('#quill-editor', {
    theme: 'snow',
    modules: {
      toolbar: [
        ['bold', 'italic', 'underline', 'strike'],
        ['blockquote', 'code-block'],
        [{ header: 1 }, { header: 2 }],
        [{ list: 'ordered' }, { list: 'bullet' }],
        [{ script: 'sub' }, { script: 'super' }],
        [{ indent: '-1' }, { indent: '+1' }],
        [{ direction: 'rtl' }],
        [{ size: ['small', false, 'large', 'huge'] }],
        [{ header: [1, 2, 3, 4, 5, 6, false] }],
        [{ color: [] }, { background: [] }],
        [{ font: [] }],
        [{ align: [] }],
        ['clean'],
        ['link', 'image', 'video']
      ]
    },
    placeholder: '請撰寫代訂服務內容...'
  })

  quillInitialized = true

  // 初始內容
  if (quill && articleData && articleData.content) {
    try {
      quill.root.innerHTML = articleData.content
    } catch (error) {
      console.error('設置編輯器內容錯誤：', error)
    }
  }

  // 監聽內容變化
  quill.on('text-change', () => {
    try {
      if (articleData) {
        articleData.content = quill.root.innerHTML
      }
    } catch (error) {
      console.error('更新內容錯誤：', error)
    }
  })
}

const handleFileUpload = async (event) => {
  const files = event.target.files
  if (!files.length) return

  for (const file of files) {
    try {
      console.log('開始上傳文件:', file.name)

      const allowedTypes = ['image/jpeg', 'image/png', 'image/gif']
      if (!allowedTypes.includes(file.type)) {
        throw new Error('只允許上傳 JPEG、PNG 和 GIF 格式的圖片')
      }

      const maxSize = 5 * 1024 * 1024 // 5MB
      if (file.size > maxSize) {
        throw new Error('文件太大，最大允許 5MB')
      }

      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      })

      const data = await response.json()

      if (!data.success) {
        throw new Error(data.error || '上傳失敗')
      }

      console.log('上傳成功:', data.url)
      if (!articleData.cover) articleData.cover = [] // Ensure cover is an array
      articleData.cover.push(data.url)
    } catch (error) {
      console.error('上傳錯誤:', error)
      alert('上傳失敗：' + error.message)
    }
  }
}

const addCoverUrl = () => {
  if (coverUrl.value.trim()) {
    try {
      // eslint-disable-next-line no-new
      new URL(coverUrl.value) // Basic URL validation
      if (!articleData.cover) {
        articleData.cover = []
      }
      articleData.cover.push(coverUrl.value.trim())
      coverUrl.value = ''
    } catch (e) {
      alert('請輸入有效的圖片 URL')
    }
  }
}

const removeImage = (index) => {
  articleData.cover.splice(index, 1)
}

const handleSubmit = async () => {
  try {
    // 驗證必填欄位
    if (!articleData.title || !articleData.category) {
      alert('請填寫必要欄位！')
      return
    }

    await $fetch('/api/relative', {
      method: 'POST',
      body: {
        title: articleData.title,
        category: articleData.category,
        content: articleData.content || '', // 添加空字串作為默認值
        cover: articleData.cover,
        amount: articleData.amount,
        usedTimes: articleData.usedTimes,
        isReferral: isReferral.value,
        hash: articleData.hash ? articleData.hash.split(',') : []
      }
    })
      .then((response) => {
        navigateTo({
          name: 'relative_shop-id',
          params: {
            id: response.id
          }
        })
      })
      .catch((error) => alert(error))
  } catch (error) {
    console.error('提交錯誤：', error)
    alert('提交失敗，請檢查所有欄位後重試')
  }
}

definePageMeta({
  middleware: 'auth'
})
</script>

<style scoped lang="scss">
.create-img {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(130px, 1fr));
  gap: 12px;
  margin-top: 16px;

  &__item {
    position: relative;

    img {
      width: 100%;
      height: 110px;
      object-fit: cover;
      border-radius: $yp-radius;
      box-shadow: $yp-shadow-sm;
      display: block;
    }
  }

  &__remove {
    position: absolute;
    top: 6px;
    right: 6px;
    width: 28px;
    height: 28px;
    border: 0;
    border-radius: 50%;
    background: rgba($yp-ink, 0.75);
    color: #fff;
    display: grid;
    place-items: center;

    &:hover {
      background: $yp-danger;
    }
  }
}

.editor-container {
  min-height: 220px;
}
</style>

<style lang="scss">
.ql-container {
  font-size: 16px;
  border-bottom-left-radius: $yp-radius-sm;
  border-bottom-right-radius: $yp-radius-sm;
  border-color: $yp-line !important;
}

.ql-toolbar {
  border-top-left-radius: $yp-radius-sm;
  border-top-right-radius: $yp-radius-sm;
  background-color: $yp-surface-2;
  border-color: $yp-line !important;
}
</style>
