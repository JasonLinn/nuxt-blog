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
                <section class="edit-part col-span-12">
                  <label for="cover" class="block text-sm font-medium text-gray-700">
                    代表性圖片連結
                  </label>
                  <div class="mt-1">
                    <textarea
                      id="cover"
                      v-model="articleData.cover"
                      placeholder="請撰輸入網址連結"
                      name="cover"
                      type="text"
                      rows="4"
                      autocomplete="cover"
                      class="w-100 block w-full appearance-none rounded-md border border-gray-300 px-3 py-2 placeholder-gray-400 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-emerald-500 sm:text-sm"
                    />
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
  </style>
  <script setup>
  const route = useRoute()
  
  const { data: articleData, error } = await useFetch(`/api/relative/${route.query.id}`)
  
  if (error.value) {
    throw createError({ statusCode: 400, message: '您要更新的代訂服務不存在或已經被刪除' })
  }
  
  // 先轉字串
  articleData.value.hash = await articleData.value.hash.toString()
  
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
  