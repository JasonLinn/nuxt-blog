<template>
    <div class="container w-full justify-center px-6 lg:px-0">
      <div class="create mb-8 flex w-full max-w-3xl justify-center">
        <form class="create-form w-100 divide-y divide-gray-200" @submit.prevent="handleSubmit">
          <div class="space-y-8 divide-y divide-gray-200">
            <div>
              <div class="mt-6">
                <h3 class="create-title text-xl font-medium leading-6 text-gray-900">新增代訂服務</h3>
              </div>
              <div class="mt-6 grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-6">
                <section class="col-md-12 create-part">
                  <label for="title" class="create-name block text-sm font-medium text-gray-700">
                    合作店家名稱：
                  </label>
                  <div class="mt-1">
                    <input
                      id="title"
                      v-model="articleData.title"
                      placeholder="請輸入合作店家名稱"
                      name="title"
                      type="text"
                      autocomplete="title"
                      class="w-100 block w-full appearance-none rounded-md border border-gray-300 px-3 py-2 placeholder-gray-400 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-emerald-500 sm:text-sm"
                    />
                  </div>
                </section>
                <section class="col-md-12 create-part">
                  <label for="category" class="create-name block text-sm font-medium text-gray-700">
                    分類：
                  </label>
                  <select class="create-category boder shadow-sm w-100 py-2 px-3 mt-1" v-model="articleData.category">
                    <option v-for="cate in categoryRelative" :key="cate.id" :value="cate.id">{{ cate.name }}</option>
                  </select>
                </section>
                <section class="col-md-12 create-part">
                  <label for="coverUrl" class="edit-name block text-sm font-medium text-gray-700">
                    <TipIcon/>圖片 URL：
                  </label>
                  <div class="mt-1">
                    <div class="input-group">
                      <input
                        id="coverUrl"
                        v-model="coverUrl"
                        placeholder="請輸入圖片 URL"
                        type="text"
                        class="w-100 block w-full appearance-none rounded-md border border-gray-300 px-3 py-2 placeholder-gray-400 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-emerald-500 sm:text-sm"
                        @keyup.enter="addCoverUrl"
                      />
                      <button 
                        @click.prevent="addCoverUrl" 
                        class="mt-2 btn btn-primary"
                        :disabled="!coverUrl"
                      >
                        添加圖片 URL
                      </button>
                    </div>
                  </div>
                </section>

                <section class="col-md-12 create-part">
                  <label for="fileUpload" class="create-name block text-sm font-medium text-gray-700">
                    或 上傳代表性圖片：
                  </label>
                  <div class="mt-1">
                    <input 
                      id="fileUpload"
                      type="file" 
                      @change="handleFileUpload" 
                      accept="image/*" 
                      multiple 
                      class="block w-full text-sm text-gray-500
                        file:mr-4 file:py-2 file:px-4
                        file:rounded-full file:border-0
                        file:text-sm file:font-semibold
                        file:bg-emerald-50 file:text-emerald-700
                        hover:file:bg-emerald-100"
                    />
                  </div>
                  <div class="create-img mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
                    <div v-for="(url, index) in articleData.cover" :key="index" class="relative">
                      <img :src="url" :alt="'圖片 ' + (index + 1)" class="w-full h-32 object-cover rounded-lg" />
                      <button 
                        @click.prevent="removeImage(index)" 
                        class="absolute top-2 right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-600"
                      >
                        ×
                      </button>
                    </div>
                  </div>
                </section>

                <section class="col-md-12 create-part">
                  <label for="content" class="create-name block text-sm font-medium text-gray-700">
                    代訂服務內容：
                  </label>
                  <div class="mt-1">
                    <ClientOnly>
                      <!-- Quill 編輯器容器 -->
                      <div id="quill-editor" class="w-100 h-64 editor-container"></div>
                      <!-- 隱藏的 textarea 用於保存內容 -->
                      <textarea 
                        id="quill-content-hidden" 
                        v-model="articleData.content" 
                        style="display: none;"
                      ></textarea>
                      
                      <template #fallback>
                        <textarea
                          id="content-fallback"
                          v-model="articleData.content"
                          name="content"
                          rows="8"
                          placeholder="正在載入編輯器..."
                          class="w-100 block w-full appearance-none rounded-md border border-gray-300 px-3 py-2 placeholder-gray-400 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-emerald-500 sm:text-sm"
                        />
                      </template>
                    </ClientOnly>
                  </div>
                </section>
              </div>
            </div>
          </div>
  
          <div class="pt-2">
            <div class="create-button">
              <NuxtLink
                class="btn btn-light shadow-sm"
                to="/"
              >
                取消
              </NuxtLink>
              <button
                type="submit"
                class="ml-3 btn btn-info text-white shadow-sm"
              >
                發布
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  </template>
  <style>
  .user-info {
    z-index: 1;
  }
  .create {
    display: flex;
    justify-content: center;
  }
  .create-title {
    font-size: 34px;
    margin-bottom: 20px;
    font-weight: bold;
  }
  .create-form {
    background-color: #fff;
  }
  .create-name {
    font-size: 16px;
    margin-bottom: 5px;
  }
  .create-category {
    display: block;
    height: 36px;
    border-color: #dee2e6;
  }
  .create-part {
    margin-bottom: 30px;
  }
  .create-button {
    display: flex;
    justify-content: space-around;
  }
  .create-img {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
    gap: 1rem;
    margin-top: 1rem;
  }
  
  .create-img img {
    width: 100%;
    height: 150px;
    object-fit: cover;
    border-radius: 0.5rem;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  }

  .editor-container {
    min-height: 200px;
  }

  .ql-container {
    font-size: 16px;
    border-bottom-left-radius: 0.375rem;
    border-bottom-right-radius: 0.375rem;
  }

  .ql-toolbar {
    border-top-left-radius: 0.375rem;
    border-top-right-radius: 0.375rem;
    background-color: #f9fafb;
  }
  </style>

<script setup>
import { ref, reactive, onMounted } from 'vue';
import { categoryRelative } from '~/utils/category';

// Quill 實例
let quill = null;

const articleData = reactive({
    title: '',
    category: '',
    content: '',
    cover: [],
    amount: 0,
    usedTimes: 0,
    hash: '',
})
const isReferral = ref(false)
const coverUrl = ref('')

// 初始化 Quill 編輯器
onMounted(() => {
  // 確保只在客戶端執行
  if (process.client) {
    // 加載 Quill CDN
    const quillCSS = document.createElement('link');
    quillCSS.href = 'https://cdn.quilljs.com/1.3.6/quill.snow.css';
    quillCSS.rel = 'stylesheet';
    document.head.appendChild(quillCSS);

    const quillScript = document.createElement('script');
    quillScript.src = 'https://cdn.quilljs.com/1.3.6/quill.min.js';
    quillScript.onload = initQuill;
    document.head.appendChild(quillScript);
  }
});

// Quill 初始化狀態標誌
let quillInitialized = false;

function initQuill() {
  // 確保只在客戶端執行
  if (!process.client) return;
  
  if (quillInitialized) return;

  // 確保 DOM 元素存在
  const editorContainer = document.getElementById('quill-editor');
  if (!editorContainer) return;

  // 確保 Quill 已加載
  if (typeof window === 'undefined' || !window.Quill) return;

  quill = new window.Quill('#quill-editor', {
    theme: 'snow',
    modules: {
      toolbar: [
        ['bold', 'italic', 'underline', 'strike'],
        ['blockquote', 'code-block'],
        [{ 'header': 1 }, { 'header': 2 }],
        [{ 'list': 'ordered' }, { 'list': 'bullet' }],
        [{ 'script': 'sub' }, { 'script': 'super' }],
        [{ 'indent': '-1' }, { 'indent': '+1' }],
        [{ 'direction': 'rtl' }],
        [{ 'size': ['small', false, 'large', 'huge'] }],
        [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
        [{ 'color': [] }, { 'background': [] }],
        [{ 'font': [] }],
        [{ 'align': [] }],
        ['clean'],
        ['link', 'image', 'video']
      ]
    },
    placeholder: '請撰寫代訂服務內容...'
  });

  quillInitialized = true;

  // 初始內容
  if (quill && articleData && articleData.content) {
    try {
      quill.root.innerHTML = articleData.content;
    } catch (error) {
      console.error('設置編輯器內容錯誤：', error);
    }
  }

  // 監聽內容變化
  quill.on('text-change', () => {
    try {
      if (articleData) {
        articleData.content = quill.root.innerHTML;
      }
    } catch (error) {
      console.error('更新內容錯誤：', error);
    }
  });
}

const handleFileUpload = async (event) => {
  const files = event.target.files
  if (!files.length) return

  for (let file of files) {
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
      alert('請填寫必要欄位！');
      return;
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
    console.error('提交錯誤：', error);
    alert('提交失敗，請檢查所有欄位後重試');
  }
}
  
  definePageMeta({
    middleware: 'auth'
  })
</script>
  