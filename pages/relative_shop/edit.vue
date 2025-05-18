<template>
    <div class="container flex w-full justify-center px-6 lg:px-0">
      <div class="edit mb-8 flex w-full max-w-3xl justify-center">
        <form class="edit-form w-100 space-y-8 divide-y divide-gray-200" @submit.prevent="handleSubmit">
          <div class="space-y-8 divide-y divide-gray-200">
            <div>
              <div class="mt-6">
                <h3 class="edit-title text-xl font-medium leading-6 text-gray-900">更新代訂服務</h3>
              </div>
  
              <div class="mt-6 grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-6">
                <section class="edit-part col-span-12">
                  <label for="title" class="edit-name block text-sm font-medium text-gray-700">
                    代訂服務標題
                  </label>
                  <div class="mt-1">
                    <input
                      id="title"
                      v-model="articleData.title"
                      placeholder="請撰輸入代訂服務標題"
                      name="title"
                      type="text"
                      autocomplete="title"
                      class="w-100 block w-full appearance-none rounded-md border border-gray-300 px-3 py-2 placeholder-gray-400 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-emerald-500 sm:text-sm"
                    />
                  </div>
                </section>
                <section class="col-md-12 edit-part">
                  <label for="cover" class="edit-name block text-sm font-medium text-gray-700">
                    分類：
                  </label>
                  <select class="create-category boder shadow-sm w-100 py-2 px-3 mt-1" v-model="articleData.category" value="play">
                    <option v-for="cate in categoryRelative" :value="cate.id">{{ cate.name }}</option>
                  </select>
                </section>
                <section class="col-md-12 edit-part">
                  <label for="cover" class="edit-name block text-sm font-medium text-gray-700">
                    發放數量：
                  </label>
                  <div class="mt-1">
                    <input
                      id="amount"
                      v-model="articleData.amount"
                      placeholder="輸入發放數量"
                      name="amount"
                      type="number"
                      class="w-100 block w-full appearance-none rounded-md border border-gray-300 px-3 py-2 placeholder-gray-400 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-emerald-500 sm:text-sm"
                    />
                  </div>
                </section>
                <!-- <section class="col-md-12 edit-part">
                  <label for="cover" class="edit-name block text-sm font-medium text-gray-700">
                    序號：
                  </label>
                  <div class="mt-1">
                    <textarea
                      id="hash"
                      v-model="articleData.hash"
                      name="hash"
                      rows="4"
                      placeholder="請撰寫代訂服務序號..."
                      class="w-100 block w-full appearance-none rounded-md border border-gray-300 px-3 py-2 placeholder-gray-400 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-emerald-500 sm:text-sm"
                    />
                  </div>
                </section> -->
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
                  <label for="cover" class="create-name block text-sm font-medium text-gray-700">
                    請上傳代表性圖片：
                  </label>
                  <div class="mt-1">
                    <input 
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
                  <!-- 統一的圖片預覽區域 -->
                  <div class="create-img mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
                    <div v-for="(url, index) in articleData.cover" :key="index" class="relative">
                      <img :src="url" :alt="'圖片 ' + (index + 1)" class="w-full h-32 object-cover rounded-lg" />
                      <div class="absolute top-2 right-2 flex gap-1">
                        <button 
                          @click.prevent="removeImage(index)" 
                          class="bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-600"
                          title="刪除"
                        >
                          ×
                        </button>
                      </div>
                      <div class="absolute bottom-2 right-2 flex gap-1">
                        <button 
                          @click.prevent="moveImage(index, 'up')" 
                          class="bg-gray-700 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-gray-800"
                          :disabled="index === 0"
                          :class="{'opacity-50 cursor-not-allowed': index === 0}"
                          title="上移"
                        >
                          ↑
                        </button>
                        <button 
                          @click.prevent="moveImage(index, 'down')" 
                          class="bg-gray-700 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-gray-800"
                          :disabled="index === articleData.cover.length - 1"
                          :class="{'opacity-50 cursor-not-allowed': index === articleData.cover.length - 1}"
                          title="下移"
                        >
                          ↓
                        </button>
                      </div>
                    </div>
                  </div>
                </section>
  
                <section class="edit-part col-span-12">
                  <label for="about" class="edit-name block text-sm font-medium text-gray-700">代訂服務內容</label>
                  <div class="mt-1">
                    <ClientOnly>
                      <!-- Quill 編輯器容器 -->
                      <div id="quill-editor" class="w-100 h-64 editor-container"></div>
                      <!-- 隱藏的 textarea 用於保存內容 -->
                      <textarea 
                        id="quill-content-hidden" 
                        v-if="articleData && articleData.value"
                        v-model="articleData.value.content" 
                        style="display: none;"
                      ></textarea>
                      
                      <template #fallback>
                        <textarea
                          id="content-fallback"
                          v-if="articleData && articleData.value"
                          v-model="articleData.value.content"
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
  
          <div class="pt-5">
            <div class="edit-button flex justify-end">
              <NuxtLink
                class="btn rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
                to="/"
              >
                取消
              </NuxtLink>
              <button
                type="submit"
                class="ml-3 btn btn-info inline-flex justify-center rounded-md border border-transparent bg-emerald-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
              >
                更新
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  </template>
  <style>
  .edit {
    display: flex;
    justify-content: center;
  }
  .edit-title {
    font-size: 34px;
    margin-bottom: 20px;
    font-weight: bold;
  }
  .edit-form {
    background-color: #fff;
  }
  .edit-name {
    font-size: 16px;
    margin-bottom: 5px;
  }
  .edit-category {
    display: block;
    height: 36px;
    border-color: #dee2e6;
  }
  .edit-part {
    margin-bottom: 30px;
  }
  .edit-button {
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

  /* 添加明確的文本格式樣式 */
  .ql-editor strong {
    font-weight: bold !important;
  }
  
  .ql-editor em {
    font-style: italic !important;
  }
  
  .ql-editor u {
    text-decoration: underline !important;
  }

  .ql-editor ol, .ql-editor ul {
    padding-left: 1.5em !important;
  }

  .ql-editor ol > li {
    list-style-type: decimal !important;
  }

  .ql-editor ul > li {
    list-style-type: disc !important;
  }
  </style>
  <script setup>
  import { ref, onMounted, watch } from 'vue';
  import { categoryRelative } from '~/utils/category';

  const route = useRoute()
  
  const { data: articleData, error } = await useFetch(`/api/relative/${route.query.id}`)
  
  if (error.value) {
    throw createError({ statusCode: 400, message: '您要更新的代訂服務不存在或已經被刪除' })
  }
  
  // 確保cover是數組
  if (articleData.value && typeof articleData.value.cover === 'string') {
    articleData.value.cover = articleData.value.cover.split(',');
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

  // 定義初始化函數在外部，這樣可以在 watch 中也使用它
  let quill = null;
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

    // 設置初始內容 - 確保數據已準備好
    setQuillContent();

    // 監聽內容變化
    quill.on('text-change', () => {
      try {
        if (articleData && articleData.value) {
          articleData.value.content = quill.root.innerHTML;
        }
      } catch (error) {
        console.error('更新內容錯誤：', error);
      }
    });
  }

  // 單獨設置內容的函數，方便在 watch 中使用
  function setQuillContent() {
    // 確保只在客戶端執行
    if (!process.client || !quill || !articleData || !articleData.value) return;
    
    try {
      if (articleData.value.content) {
        quill.root.innerHTML = articleData.value.content;
      }
    } catch (error) {
      console.error('設置編輯器內容錯誤：', error);
    }
  }

  // 監視 articleData.value，當它變為可用時設置編輯器內容
  watch(() => articleData.value, (newVal) => {
    // 確保只在客戶端執行
    if (!process.client) return;

    if (newVal && quill) {
      setQuillContent();
    } else if (newVal && !quill && typeof window !== 'undefined' && window.Quill) {
      // 如果 articleData 數據已加載，但 quill 尚未初始化，嘗試初始化它
      initQuill();
    }
  }, { immediate: true });

  const addCoverUrl = () => {
    if (coverUrl.value.trim()) {
      try {
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
      const temp = articleData.value.cover[index];
      articleData.value.cover[index] = articleData.value.cover[index - 1];
      articleData.value.cover[index - 1] = temp;
    } else if (direction === 'down' && index < articleData.value.cover.length - 1) {
      // 與下一個元素交換位置
      const temp = articleData.value.cover[index];
      articleData.value.cover[index] = articleData.value.cover[index + 1];
      articleData.value.cover[index + 1] = temp;
    }
  }

  const handleFileUpload = async (event) => {
    const files = event.target.files
    if (!files.length) return

    for (let file of files) {
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
        alert('請填寫必要欄位！');
        return;
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
      console.error('提交錯誤：', error);
      alert('提交失敗，請檢查所有欄位後重試');
    }
  }
  
  definePageMeta({
    middleware: 'auth'
  })
  </script>
  