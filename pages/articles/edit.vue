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

.create-img {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 1rem;
  margin-top: 1rem;
}
</style>
<script setup>
import { ref, onMounted, computed } from 'vue';
import { category, township } from '~/utils/category';
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

const coverUrl = ref('')

// 計算屬性用於圖片預覽和排序
const coverArray = computed({
  get: () => {
    return articleData.value.cover ? articleData.value.cover.split(',').filter(url => url.trim()) : [];
  },
  set: (newArray) => {
    articleData.value.cover = newArray.join(',');
  }
});

const addCoverUrl = () => {
  if (coverUrl.value.trim()) {
    try {
      new URL(coverUrl.value)
      const newArray = [...coverArray.value];
      newArray.push(coverUrl.value.trim());
      coverArray.value = newArray;
      coverUrl.value = ''
    } catch (e) {
      alert('請輸入有效的圖片 URL')
    }
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
      
      // 添加到 coverArray
      const newArray = [...coverArray.value];
      newArray.push(data.url);
      coverArray.value = newArray;

    } catch (error) {
      console.error('上傳錯誤:', error)
      alert(`上傳失敗：${error.message}`)
    }
  }
}

// 移除圖片
const removeImage = (index) => {
  const newArray = [...coverArray.value];
  newArray.splice(index, 1);
  coverArray.value = newArray;
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
};

const handleSubmit = async () => {
  try {
    // 驗證必填欄位
    if (!articleData.value || !articleData.value.title || !articleData.value.category) {
      alert('請填寫必要欄位！');
      return;
    }
    
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
      cover: coverArray.value,
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
    } catch (error) {
      console.error('提交錯誤：', error);
      alert('提交失敗，請檢查所有欄位後重試');
    }
}

definePageMeta({
  middleware: 'auth'
})
</script>
