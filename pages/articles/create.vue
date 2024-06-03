<template>
  <div class="flex w-full justify-center px-6 lg:px-0">
    <div class="mb-8 flex w-full max-w-3xl justify-center">
      <form class="w-full space-y-8 divide-y divide-gray-200" @submit.prevent="handleSubmit">
        <div class="space-y-8 divide-y divide-gray-200">
          <div>
            <div class="mt-6">
              <h3 class="text-xl font-medium leading-6 text-gray-900">新增優惠券</h3>
            </div>

            <div class="mt-6 grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-6">
              <div class="col-span-12">
                <label for="title" class="block text-sm font-medium text-gray-700">
                  優惠券名稱
                </label>
                <div class="mt-1">
                  <input
                    id="title"
                    v-model="articleData.title"
                    placeholder="請輸入優惠券名稱"
                    name="title"
                    type="text"
                    autocomplete="title"
                    class="block w-full appearance-none rounded-md border border-gray-300 px-3 py-2 placeholder-gray-400 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-emerald-500 sm:text-sm"
                  />
                </div>
              </div>
              <div class="col-span-12">
                <label for="cover" class="block text-sm font-medium text-gray-700">
                  分類
                </label>
                <select class="mt-1" v-model="articleData.category">
                  <option v-for="cate in category" :value="cate.id">{{ cate.name }}</option>
                </select>
              </div>
              <div class="col-span-12">
                <label for="cover" class="block text-sm font-medium text-gray-700">
                  代表性圖片連結
                </label>
                <div class="mt-1">
                  <input
                    id="cover"
                    v-model="articleData.cover"
                    placeholder="請撰輸入網址連結"
                    name="cover"
                    type="text"
                    autocomplete="cover"
                    class="block w-full appearance-none rounded-md border border-gray-300 px-3 py-2 placeholder-gray-400 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-emerald-500 sm:text-sm"
                  />
                </div>
              </div>

              <div class="col-span-12">
                <label for="about" class="block text-sm font-medium text-gray-700">優惠券內容</label>
                <div class="mt-1">
                  <textarea
                    id="content"
                    v-model="articleData.content"
                    name="content"
                    rows="4"
                    placeholder="請撰寫優惠券內容..."
                    class="block w-full appearance-none rounded-md border border-gray-300 px-3 py-2 placeholder-gray-400 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-emerald-500 sm:text-sm"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="pt-5">
          <div class="flex justify-end">
            <NuxtLink
              class="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
              to="/"
            >
              取消
            </NuxtLink>
            <button
              type="submit"
              class="ml-3 inline-flex justify-center rounded-md border border-transparent bg-emerald-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
            >
              發布
            </button>
          </div>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
const articleData = reactive({
  title: '',
  category: '',
  content: '',
  cover: ''
})

const handleSubmit = async () => {
  await $fetch('/api/articles', {
    method: 'POST',
    body: {
      title: articleData.title,
      category: articleData.category,
      content: articleData.content,
      cover: articleData.cover
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

const category = [{
  id: 'play',
  name: '玩',
},{
  id: 'buy',
  name: '買',
},{
  id: 'live',
  name: '住',
},{
  id: 'traffic',
  name: '行',
}]
</script>
