<template>
  <div class="yp-page yp-page--form">
    <nav class="yp-breadcrumb" aria-label="breadcrumb">
      <NuxtLink to="/">首頁</NuxtLink>
      <NuxtLink to="/relative">代訂服務</NuxtLink>
      <span>編輯</span>
    </nav>
    <header class="yp-page-head">
      <div>
        <h1 class="yp-page-head__title">更新代訂服務</h1>
        <p class="yp-page-head__desc">修改店家資訊、圖片與服務內容後按下更新。</p>
      </div>
    </header>

    <form @submit.prevent="handleSubmit">
      <!-- 基本資訊 -->
      <section class="yp-form-section">
        <h2 class="yp-form-section__title">基本資訊</h2>
        <p class="yp-form-section__desc">標題、分類與數量。</p>
        <div class="mb-3">
          <label for="title" class="form-label required">代訂服務標題</label>
          <input
            id="title"
            v-model="articleData.title"
            placeholder="請輸入代訂服務標題"
            name="title"
            type="text"
            autocomplete="title"
            class="form-control"
          />
        </div>
        <div class="row g-3">
          <div class="col-12 col-md-6">
            <label for="category" class="form-label required">分類</label>
            <select id="category" v-model="articleData.category" class="form-select">
              <option v-for="cate in categoryRelative" :key="cate.id" :value="cate.id">
                {{ cate.name }}
              </option>
            </select>
          </div>
          <div class="col-12 col-md-6">
            <label for="amount" class="form-label">發放數量</label>
            <input
              id="amount"
              v-model="articleData.amount"
              placeholder="輸入發放數量"
              name="amount"
              type="number"
              class="form-control"
            />
          </div>
        </div>
      </section>

      <!-- 圖片 -->
      <section class="yp-form-section">
        <h2 class="yp-form-section__title">圖片</h2>
        <p class="yp-form-section__desc">
          可貼上圖片網址或上傳（JPEG、PNG、GIF，單檔 5MB 內）；第一張為封面，可用箭頭調整順序。
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
          <div class="fw-bold mt-1">請上傳代表性圖片</div>
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

        <!-- 統一的圖片預覽區域 -->
        <div v-if="articleData.cover?.length" class="create-img">
          <div v-for="(url, index) in articleData.cover" :key="index" class="create-img__item">
            <img :src="url" :alt="'圖片 ' + (index + 1)" />
            <span v-if="index === 0" class="create-img__badge">封面</span>
            <button
              type="button"
              class="create-img__btn create-img__btn--remove"
              title="刪除"
              :aria-label="'刪除圖片 ' + (index + 1)"
              @click.prevent="removeImage(index)"
            >
              <Icon name="ri:close-line" />
            </button>
            <div class="create-img__move">
              <button
                type="button"
                class="create-img__btn"
                title="上移"
                aria-label="上移"
                :disabled="index === 0"
                @click.prevent="moveImage(index, 'up')"
              >
                <Icon name="ri:arrow-up-s-line" />
              </button>
              <button
                type="button"
                class="create-img__btn"
                title="下移"
                aria-label="下移"
                :disabled="index === articleData.cover.length - 1"
                @click.prevent="moveImage(index, 'down')"
              >
                <Icon name="ri:arrow-down-s-line" />
              </button>
            </div>
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
            v-if="articleData"
            id="quill-content-hidden"
            v-model="articleData.content"
            style="display: none"
          ></textarea>

          <template #fallback>
            <textarea
              v-if="articleData"
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
        <button type="submit" class="btn btn-primary">更新</button>
      </div>
    </form>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import { categoryRelative } from '~/utils/category'

const route = useRoute()

const { data: articleData, error } = await useFetch(`/api/relative/${route.query.id}`)

if (error.value) {
  throw createError({ statusCode: 400, message: '您要更新的代訂服務不存在或已經被刪除' })
}

// 確保cover是數組
if (articleData.value && typeof articleData.value.cover === 'string') {
  articleData.value.cover = articleData.value.cover.split(',')
}

// 先轉字串
if (articleData.value && articleData.value.hash) {
  articleData.value.hash = articleData.value.hash.toString()
}

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

// 定義初始化函數在外部，這樣可以在 watch 中也使用它
let quill = null
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

  // 設置初始內容 - 確保數據已準備好
  setQuillContent()

  // 監聽內容變化
  quill.on('text-change', () => {
    try {
      if (articleData && articleData.value) {
        articleData.value.content = quill.root.innerHTML
      }
    } catch (error) {
      console.error('更新內容錯誤：', error)
    }
  })
}

// 單獨設置內容的函數，方便在 watch 中使用
function setQuillContent() {
  // 確保只在客戶端執行
  if (!process.client || !quill || !articleData || !articleData.value) return

  try {
    if (articleData.value.content) {
      quill.root.innerHTML = articleData.value.content
    }
  } catch (error) {
    console.error('設置編輯器內容錯誤：', error)
  }
}

// 監視 articleData.value，當它變為可用時設置編輯器內容
watch(
  () => articleData.value,
  (newVal) => {
    // 確保只在客戶端執行
    if (!process.client) return

    if (newVal && quill) {
      setQuillContent()
    } else if (newVal && !quill && typeof window !== 'undefined' && window.Quill) {
      // 如果 articleData 數據已加載，但 quill 尚未初始化，嘗試初始化它
      initQuill()
    }
  },
  { immediate: true }
)

const addCoverUrl = () => {
  if (coverUrl.value.trim()) {
    try {
      // eslint-disable-next-line no-new
      new URL(coverUrl.value)
      if (!Array.isArray(articleData.value.cover)) {
        articleData.value.cover = []
      }
      articleData.value.cover.push(coverUrl.value.trim())
      coverUrl.value = ''
    } catch (e) {
      alert('請輸入有效的圖片 URL')
    }
  }
}

const removeImage = (index) => {
  articleData.value.cover.splice(index, 1)
}

// 新增移動圖片功能
const moveImage = (index, direction) => {
  if (direction === 'up' && index > 0) {
    // 與上一個元素交換位置
    const temp = articleData.value.cover[index]
    articleData.value.cover[index] = articleData.value.cover[index - 1]
    articleData.value.cover[index - 1] = temp
  } else if (direction === 'down' && index < articleData.value.cover.length - 1) {
    // 與下一個元素交換位置
    const temp = articleData.value.cover[index]
    articleData.value.cover[index] = articleData.value.cover[index + 1]
    articleData.value.cover[index + 1] = temp
  }
}

const handleFileUpload = async (event) => {
  const files = event.target.files
  if (!files.length) return

  for (const file of files) {
    try {
      console.log('開始上傳文件:', file.name)

      // 驗證文件類型
      const allowedTypes = ['image/jpeg', 'image/png', 'image/gif']
      if (!allowedTypes.includes(file.type)) {
        throw new Error('只允許上傳 JPEG、PNG 和 GIF 格式的圖片')
      }

      // 驗證文件大小 (5MB)
      const maxSize = 5 * 1024 * 1024
      if (file.size > maxSize) {
        throw new Error('文件太大，最大允許 5MB')
      }

      // 創建 FormData
      const formData = new FormData()
      formData.append('file', file)

      // 上傳到後端 API
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      })

      const data = await response.json()

      if (!data.success) {
        throw new Error(data.error || '上傳失敗')
      }

      console.log('上傳成功:', data.url)

      // 確保 cover 是數組
      if (!Array.isArray(articleData.value.cover)) {
        articleData.value.cover = []
      }

      articleData.value.cover.push(data.url)
    } catch (error) {
      console.error('上傳錯誤:', error)
      alert(`上傳失敗：${error.message}`)
    }
  }
}

const handleSubmit = async () => {
  try {
    // 驗證必填欄位
    if (!articleData.value || !articleData.value.title || !articleData.value.category) {
      alert('請填寫必要欄位！')
      return
    }

    await $fetch(`/api/relative/${route.query.id}`, {
      method: 'PATCH',
      body: {
        title: articleData.value.title,
        category: articleData.value.category,
        content: articleData.value.content || '', // 添加空字串作為默認值
        cover: articleData.value.cover || [],
        amount: articleData.value.amount,
        // 轉陣列
        hash: articleData.value.hash ? articleData.value.hash.split(',') : []
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

  &__badge {
    position: absolute;
    left: 6px;
    top: 6px;
    padding: 2px 8px;
    border-radius: $yp-radius-pill;
    background: $yp-primary;
    color: #fff;
    font-size: 0.75rem;
    font-weight: 700;
  }

  &__move {
    position: absolute;
    right: 6px;
    bottom: 6px;
    display: flex;
    gap: 4px;
  }

  &__btn {
    width: 28px;
    height: 28px;
    border: 0;
    border-radius: 50%;
    background: rgba($yp-ink, 0.75);
    color: #fff;
    display: grid;
    place-items: center;

    &:hover:not(:disabled) {
      background: $yp-ink;
    }

    &:disabled {
      opacity: 0.4;
    }

    &--remove {
      position: absolute;
      top: 6px;
      right: 6px;

      &:hover:not(:disabled) {
        background: $yp-danger;
      }
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

.ql-editor strong {
  font-weight: bold !important;
}

.ql-editor em {
  font-style: italic !important;
}

.ql-editor u {
  text-decoration: underline !important;
}

.ql-editor ol,
.ql-editor ul {
  padding-left: 1.5em !important;
}

.ql-editor ol > li {
  list-style-type: decimal !important;
}

.ql-editor ul > li {
  list-style-type: disc !important;
}
</style>
