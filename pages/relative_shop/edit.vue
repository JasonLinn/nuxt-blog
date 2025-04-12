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
                      <button 
                        @click.prevent="removeImage(index)" 
                        class="absolute top-2 right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-600"
                      >
                        ×
                      </button>
                    </div>
                  </div>
                </section>
  
                <section class="edit-part col-span-12">
                  <label for="about" class="edit-name block text-sm font-medium text-gray-700">代訂服務內容</label>
                  <div class="mt-1">
                    <textarea
                      id="content"
                      v-model="articleData.content"
                      name="content"
                      rows="12"
                      placeholder="請撰寫代訂服務內容..."
                      class="w-100 block w-full appearance-none rounded-md border border-gray-300 px-3 py-2 placeholder-gray-400 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-emerald-500 sm:text-sm"
                    />
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
  </style>
  <script setup>
  import { ref } from 'vue';
  const route = useRoute()
  
  const { data: articleData, error } = await useFetch(`/api/relative/${route.query.id}`)
  
  if (error.value) {
    throw createError({ statusCode: 400, message: '您要更新的代訂服務不存在或已經被刪除' })
  }
  
  // 確保cover是數組
  if (typeof articleData.value.cover === 'string') {
    articleData.value.cover = articleData.value.cover.split(',');
  }

  // 先轉字串
  articleData.value.hash = await articleData.value.hash.toString()
  
  const coverUrl = ref('')

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
    await $fetch(`/api/relative/${route.query.id}`, {
      method: 'PATCH',
      body: {
        title: articleData.value.title,
        category: articleData.value.category,
        content: articleData.value.content,
        cover: articleData.value.cover,
        amount: articleData.value.amount,
        // 轉陣列
        hash: articleData.value.hash.split(',')
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
  }
  
  definePageMeta({
    middleware: 'auth'
  })

import { categoryRelative } from '~/utils/category';
</script>
  