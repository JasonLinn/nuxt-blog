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
                    <textarea
                      id="content"
                      v-model="articleData.content"
                      name="content"
                      rows="4"
                      placeholder="請撰寫代訂服務內容..."
                      class="w-100 block w-full appearance-none rounded-md border border-gray-300 px-3 py-2 placeholder-gray-400 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-emerald-500 sm:text-sm"
                    />
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
  </style>

<script setup>
import { ref, reactive } from 'vue';
import { categoryRelative } from '~/utils/category';

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
    await $fetch('/api/relative', {
      method: 'POST',
      body: {
        title: articleData.title,
        category: articleData.category,
        content: articleData.content,
        cover: articleData.cover,
        amount: articleData.amount,
        usedTimes: articleData.usedTimes,
        isReferral: isReferral.value,
        hash: articleData.hash.split(',')
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
</script>
  