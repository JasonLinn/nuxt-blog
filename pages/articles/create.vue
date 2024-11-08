<template>
  <div class="container w-full justify-center px-6 lg:px-0">
    <div class="create mb-8 flex w-full max-w-3xl justify-center">
      <form class="create-form w-100 divide-y divide-gray-200" @submit.prevent="handleSubmit">
        <div class="space-y-8 divide-y divide-gray-200">
          <div>
            <div class="mt-6">
              <h3 class="create-title text-xl font-medium leading-6 text-gray-900">新增優惠券</h3>
            </div>

            <div class="mt-6 grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-6">
              <section class="col-md-12 create-part">
                <label for="title" class="create-name block text-sm font-medium text-gray-700">
                  優惠券名稱：
                </label>
                <div class="mt-1">
                  <input
                    id="title"
                    v-model="articleData.title"
                    placeholder="請輸入優惠券名稱"
                    name="title"
                    type="text"
                    autocomplete="title"
                    class="w-100 block w-full appearance-none rounded-md border border-gray-300 px-3 py-2 placeholder-gray-400 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-emerald-500 sm:text-sm"
                  />
                </div>
              </section>
              <section class="col-md-12 create-part">
                <label for="cover" class="create-name block text-sm font-medium text-gray-700">
                  分類：
                </label>
                <select class="create-category boder shadow-sm w-100 py-2 px-3 mt-1" v-model="articleData.category" value="play">
                  <option v-for="cate in category" :value="cate.id">{{ cate.name }}</option>
                </select>
              </section>
              <section class="col-md-12 create-part">
                <label for="cover" class="create-name block text-sm font-medium text-gray-700">
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
              <section class="col-md-12 create-part">
                <label for="cover" class="edit-name block text-sm font-medium text-gray-700">
                  是否允許推薦店家：
                </label>
                <div class="mt-1">
                  <input type="radio" id="referralTrue" value="true" v-model="isReferral">
                  <label for="referralTrue">是</label>
                  <input type="radio" id="referralFalse" value="false" v-model="isReferral">
                  <label for="referralFalse">否</label>
                </div>
              </section>
              <section class="col-md-12 create-part">
                <label for="cover" class="edit-name block text-sm font-medium text-gray-700">
                  序號：
                </label>
                <div class="mt-1">
                  <textarea
                    id="hash"
                    v-model="articleData.hash"
                    name="hash"
                    rows="4"
                    placeholder="請撰寫優惠券序號..."
                    class="w-100 block w-full appearance-none rounded-md border border-gray-300 px-3 py-2 placeholder-gray-400 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-emerald-500 sm:text-sm"
                  />
                </div>
              </section>
              <section class="col-md-12 create-part">
                <label for="cover" class="create-name block text-sm font-medium text-gray-700">
                  ※請上傳代表性圖片：
                </label>
                <input type="file" @input="handleFileInput" multiple />
                <div class="create-img">
                  <img v-for="file in files" :key="file.name" :src="file.content" alt="file.name" />
                </div>
              </section>
              <section class="col-md-12 create-part">
                <label for="about" class="create-name block text-sm font-medium text-gray-700">
                  優惠券內容：
                </label>
                <div class="mt-1">
                  <textarea
                    id="content"
                    v-model="articleData.content"
                    name="content"
                    rows="4"
                    placeholder="請撰寫優惠券內容..."
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
  padding: 20px;
}
.create-title {
  font-size: 34px;
  margin-bottom: 20px;
  font-weight: bold;
}
.create-form {
  padding: 20px;
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
.create-img > img {
  width: 100px;
}
.create-part {
  margin-bottom: 30px;
}
.create-button {
  display: flex;
  justify-content: space-around;
}
</style>

<script setup>
import { index_url } from '~/utils/static'

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

const { handleFileInput, files } = useFileStorage()

const handleSubmit = async () => {
  // if (!files.value[0]) {
  //   alert('請上傳至少一個圖檔')
  //   return
  // }
  files.value.map((file)=> {
    articleData.cover.push(index_url + 'shop/' + file.name)
  })

  const response = await $fetch('/api/files', {
		method: 'POST',
		body: {
			files: files.value,
      url: 'shop/'
		}
	})

  await $fetch('/api/articles', {
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
        name: 'articles-id',
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

import { category } from '~/utils/category';
</script>
