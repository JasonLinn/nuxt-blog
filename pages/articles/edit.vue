<template>
  <div class="container flex w-full justify-center px-6 lg:px-0">
    <div class="edit mb-8 flex w-full max-w-3xl justify-center">
      <form class="edit-form w-100 space-y-8 divide-y divide-gray-200" @submit.prevent="handleSubmit">
        <div class="space-y-8 divide-y divide-gray-200">
          <div>
            <div class="mt-6">
              <h3 class="edit-title text-xl font-medium leading-6 text-gray-900">更新優惠券</h3>
            </div>

            <div class="mt-6 grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-6">
              <section class="edit-part col-span-12">
                <label for="title" class="edit-name block text-sm font-medium text-gray-700">
                  <TipIcon/>優惠券標題：
                </label>
                <div class="mt-1">
                  <input
                    id="title"
                    v-model="articleData.title"
                    placeholder="請撰輸入優惠券標題"
                    name="title"
                    type="text"
                    autocomplete="title"
                    class="w-100 block w-full appearance-none rounded-md border border-gray-300 px-3 py-2 placeholder-gray-400 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-emerald-500 sm:text-sm"
                  />
                </div>
              </section>
              <section class="col-md-12 edit-part">
                <label for="cover" class="edit-name block text-sm font-medium text-gray-700">
                  <TipIcon/>分類：
                </label>
                <select class="create-category boder shadow-sm w-100 py-2 px-3 mt-1" v-model="articleData.category" value="play">
                  <option v-for="cate in category" :value="cate.id">{{ cate.name }}</option>
                </select>
              </section>
              <section class="col-md-12 create-part">
                <label for="adress" class="create-name block text-sm font-medium text-gray-700">
                  <TipIcon/>地址(用逗點分隔)：
                </label>
                <textarea
                  id="adress"
                  v-model="articleData.adress"
                  placeholder="請輸入地址"
                  name="adress"
                  class="w-100"
                />
              </section>
              <section class="col-md-12 create-part">
                <label for="position" class="create-name block text-sm font-medium text-gray-700">
                  <TipIcon/>經緯度(經度：121.614046 緯度：24.6379):
                </label>
                <div class="mt-1">
                  <input
                    id="position"
                    v-model="articleData.position"
                    placeholder="請輸入經緯度"
                    name="position"
                    type="text"
                    class="w-100 block w-full appearance-none rounded-md border border-gray-300 px-3 py-2 placeholder-gray-400 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-emerald-500 sm:text-sm"
                  />
                </div>
              </section>
              <section class="col-md-12 create-part">
                <label for="township" class="create-name block text-sm font-medium text-gray-700">
                  <TipIcon/>鄉鎮(用逗點分隔)：
                </label>
                <textarea
                  id="township"
                  v-model="articleData.township"
                  placeholder="請輸入鄉鎮"
                  name="township"
                  class="w-100"
                />
              </section>
              <section class="col-md-12 edit-part">
                <label for="cover" class="edit-name block text-sm font-medium text-gray-700">
                  <TipIcon/>發放數量：
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
                  <TipIcon/>是否允許推薦店家：
                </label>
                <div class="mt-1">
                  <input type="radio" id="referralTrue" value="true" v-model="articleData.isReferral">
                  <label for="referralTrue">是</label>
                  <input type="radio" id="referralFalse" value="false" v-model="articleData.isReferral">
                  <label for="referralFalse">否</label>
                </div>
              </section>
              <section class="col-md-12 create-part">
                <label for="once" class="edit-name block text-sm font-medium text-gray-700">
                  <TipIcon/>一個帳號只能領一次：
                </label>
                <div class="mt-1">
                  <input type="radio" id="isonceTrue" value="true" v-model="articleData.isonce">
                  <label for="isonceTrue">是</label>
                  <input type="radio" id="isonceFalse" value="false" v-model="articleData.isonce">
                  <label for="isonceFalse">否</label>
                </div>
              </section>
              <section class="edit-part col-span-12">
                <label for="cover" class="block text-sm font-medium text-gray-700">
                  <TipIcon/>圖片連結(用逗點分隔)：
                </label>
                <div class="mt-1 w-full">
                  <textarea
                    v-model="articleData.cover"
                    placeholder="請撰輸入圖片網址"
                    name="cover"
                    class="articleCover w-100"
                  />
                </div>
                
                <!-- 添加圖片預覽和排序功能 -->
                <div class="mt-4">
                  <label class="block text-sm font-medium text-gray-700 mb-2">圖片預覽與排序：</label>
                  <div class="create-img grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
                    <div v-for="(url, index) in coverArray" :key="index" class="relative">
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
                          :disabled="index === coverArray.length - 1"
                          :class="{'opacity-50 cursor-not-allowed': index === coverArray.length - 1}"
                          title="下移"
                        >
                          ↓
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </section>

              <section class="edit-part col-span-12">
                <label for="about" class="edit-name block text-sm font-medium text-gray-700">
                  <TipIcon/>優惠券內容：
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
              <section class="col-md-12 create-part">
                <label for="tags" class="create-name block text-sm font-medium text-gray-700">
                  <TipIcon/>標籤：
                </label>
                <div class="mt-1">
                  <textarea
                    id="tags"
                    v-model="articleData.tags"
                    name="tags"
                    rows="2"
                    placeholder="請用#撰寫標籤..."
                    class="w-100 block w-full appearance-none rounded-md border border-gray-300 px-3 py-2 placeholder-gray-400 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-emerald-500 sm:text-sm"
                  />
                </div>
              </section>
              <section class="col-md-12 edit-part">
                <label for="cover" class="edit-name block text-sm font-medium text-gray-700">
                  <TipIcon/>是否有序號：
                </label>
                <div class="mt-1">
                  <input type="radio" id="hashTrue" value="true" v-model="articleData.hash">
                  <label for="hashTrue">是</label>
                  <input type="radio" id="hashFalse" value="false" v-model="articleData.hash">
                  <label for="hashFalse">否</label>
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
import { ref, onMounted, computed } from 'vue';
import { township } from '~/utils/category';
const route = useRoute()

const { data: articleData, error } = await useFetch(`/api/articles/${route.query.id}`)

if (error.value) {
  throw createError({ statusCode: 400, message: '您要更新的優惠券不存在或已經被刪除' })
}

// 先轉字串
articleData.value.adress = await articleData.value.adress.toString()
articleData.value.township = await articleData.value.township.toString()
articleData.value.cover = await articleData.value.cover.toString()
articleData.value.position = await '經度：' + articleData.value.position?.lng + ' 緯度：' + articleData.value.position?.lat

// 計算屬性用於圖片預覽和排序
const coverArray = computed({
  get: () => {
    return articleData.value.cover ? articleData.value.cover.split(',').filter(url => url.trim()) : [];
  },
  set: (newArray) => {
    articleData.value.cover = newArray.join(',');
  }
});

// 移除圖片
const removeImage = (index) => {
  const newArray = [...coverArray.value];
  newArray.splice(index, 1);
  coverArray.value = newArray;
  articleData.value.cover = newArray.join(',');
};

// 移動圖片順序
const moveImage = (index, direction) => {
  const newArray = [...coverArray.value];
  
  if (direction === 'up' && index > 0) {
    // 與上一個元素交換位置
    const temp = newArray[index];
    newArray[index] = newArray[index - 1];
    newArray[index - 1] = temp;
  } else if (direction === 'down' && index < newArray.length - 1) {
    // 與下一個元素交換位置
    const temp = newArray[index];
    newArray[index] = newArray[index + 1];
    newArray[index + 1] = temp;
  }
  
  coverArray.value = newArray;
  articleData.value.cover = newArray.join(',');
};

const handleSubmit = async () => {
  console.log(articleData, 'ddddd')
  let position = articleData.value.position.match(/\d+\.\d+/g)
  await $fetch(`/api/articles/${route.query.id}`, {
    method: 'PATCH',
    body: {
      title: articleData.value.title,
      category: articleData.value.category,
      content: articleData.value.content,
      adress: articleData.value.adress.split(','),
      township: articleData.value.township.split(','),
      cover: articleData.value.cover.split(','),
      amount: articleData.value.amount,
      isReferral: articleData.value.isReferral,
      isonce: articleData.value.isonce,
      // 轉陣列
      hash: articleData.value.hash,
      position: {
        lng: Number(position[0]),
        lat: Number(position[1])
      },
      tags: articleData.value.tags
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
</script>
