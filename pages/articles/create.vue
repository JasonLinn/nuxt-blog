<template>
  <div class="yp-page yp-page--form">
    <nav class="yp-breadcrumb" aria-label="目前位置">
      <NuxtLink to="/">首頁</NuxtLink>
      <span>新增優惠券</span>
    </nav>
    <header class="yp-page-head">
      <div>
        <span class="yp-page-head__eyebrow">優惠券管理</span>
        <h1 class="yp-page-head__title">新增優惠券</h1>
        <p class="yp-page-head__desc">填寫店家資訊與優惠內容，發布後即可在前台顯示。</p>
      </div>
    </header>

    <form @submit.prevent="handleSubmit">
      <!-- 基本資訊 -->
      <section class="yp-form-section">
        <h2 class="yp-form-section__title">基本資訊</h2>
        <p class="yp-form-section__desc">店家名稱、分類與位置。</p>
        <div class="row g-3">
          <div class="col-12">
            <label for="title" class="form-label required">優惠券名稱</label>
            <input
              id="title"
              v-model="articleData.title"
              placeholder="請輸入優惠券名稱"
              name="title"
              type="text"
              autocomplete="title"
              class="form-control"
            />
          </div>
          <div class="col-12">
            <label for="category" class="form-label required">分類</label>
            <select id="category" v-model="articleData.category" class="form-select">
              <option v-for="cate in category" :key="cate.id" :value="cate.id">
                {{ cate.name }}
              </option>
            </select>
          </div>
          <div class="col-12">
            <label for="adress" class="form-label required">地址（用逗點分隔）</label>
            <textarea
              id="adress"
              v-model="articleData.adress"
              placeholder="請輸入地址"
              name="adress"
              rows="2"
              class="form-control"
            />
          </div>
          <div class="col-12">
            <label for="position" class="form-label required">經緯度</label>
            <input
              id="position"
              v-model="articleData.position"
              placeholder="請輸入經緯度"
              name="position"
              type="text"
              class="form-control"
            />
            <div class="form-text">例如：24.63567884891394, 121.79100640000001</div>
          </div>
          <div class="col-12">
            <label for="township" class="form-label required">鄉鎮（用逗點分隔）</label>
            <textarea
              id="township"
              v-model="articleData.township"
              placeholder="請輸入鄉鎮"
              name="township"
              rows="2"
              class="form-control"
            />
          </div>
        </div>
      </section>

      <!-- 領取設定 -->
      <section class="yp-form-section">
        <h2 class="yp-form-section__title">領取設定</h2>
        <p class="yp-form-section__desc">數量與領取限制。</p>
        <div class="row g-3">
          <div class="col-12">
            <label for="amount" class="form-label required">發放數量</label>
            <input
              id="amount"
              v-model="articleData.amount"
              placeholder="輸入發放數量"
              name="amount"
              type="number"
              class="form-control"
            />
          </div>
          <div class="col-12 col-sm-4">
            <span class="form-label required d-block">是否顯示推薦店家</span>
            <div class="form-check form-check-inline">
              <input
                id="referralTrue"
                v-model="articleData.isReferral"
                class="form-check-input"
                type="radio"
                value="true"
              />
              <label class="form-check-label" for="referralTrue">是</label>
            </div>
            <div class="form-check form-check-inline">
              <input
                id="referralFalse"
                v-model="articleData.isReferral"
                class="form-check-input"
                type="radio"
                value="false"
              />
              <label class="form-check-label" for="referralFalse">否</label>
            </div>
          </div>
          <div class="col-12 col-sm-4">
            <span class="form-label required d-block">一個帳號只能領一次</span>
            <div class="form-check form-check-inline">
              <input
                id="isonceTrue"
                v-model="articleData.isonce"
                class="form-check-input"
                type="radio"
                value="true"
              />
              <label class="form-check-label" for="isonceTrue">是</label>
            </div>
            <div class="form-check form-check-inline">
              <input
                id="isonceFalse"
                v-model="articleData.isonce"
                class="form-check-input"
                type="radio"
                value="false"
              />
              <label class="form-check-label" for="isonceFalse">否</label>
            </div>
          </div>
          <div class="col-12 col-sm-4">
            <span class="form-label required d-block">是否有序號</span>
            <div class="form-check form-check-inline">
              <input
                id="hashTrue"
                v-model="articleData.hash"
                class="form-check-input"
                type="radio"
                value="true"
              />
              <label class="form-check-label" for="hashTrue">是</label>
            </div>
            <div class="form-check form-check-inline">
              <input
                id="hashFalse"
                v-model="articleData.hash"
                class="form-check-input"
                type="radio"
                value="false"
              />
              <label class="form-check-label" for="hashFalse">否</label>
            </div>
          </div>
        </div>
      </section>

      <!-- 圖片 -->
      <section class="yp-form-section">
        <h2 class="yp-form-section__title">圖片</h2>
        <p class="yp-form-section__desc">
          第一張會作為封面。可貼上圖片網址，或上傳圖片檔（JPEG / PNG / GIF，5MB 以內）。
        </p>

        <label for="coverUrl" class="form-label required">圖片 URL</label>
        <div class="input-group">
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
            class="btn btn-outline-primary"
            :disabled="!coverUrl"
            @click.prevent="addCoverUrl"
          >
            添加圖片 URL
          </button>
        </div>

        <label class="yp-upload mt-3">
          <input
            type="file"
            class="visually-hidden"
            accept="image/*"
            multiple
            @change="handleFileUpload"
          />
          <Icon name="ri:upload-cloud-2-line" class="upload-icon" />
          <span class="d-block fw-bold text-ink">請上傳代表性圖片</span>
          <span class="d-block small">點擊選擇檔案，可一次選多張</span>
        </label>

        <!-- 統一的圖片預覽區域 -->
        <div v-if="articleData.cover?.length" class="create-img">
          <figure v-for="(url, index) in articleData.cover" :key="index" class="create-img__item">
            <img :src="url" :alt="'圖片 ' + (index + 1)" />
            <span v-if="index === 0" class="create-img__badge yp-tag yp-tag--primary">封面</span>
            <button
              type="button"
              class="create-img__remove btn btn-danger btn-sm"
              aria-label="刪除圖片"
              @click.prevent="removeImage(index)"
            >
              <Icon name="ri:close-line" />
            </button>
          </figure>
        </div>
      </section>

      <!-- 內容 -->
      <section class="yp-form-section">
        <h2 class="yp-form-section__title">優惠內容</h2>
        <p class="yp-form-section__desc">顧客會在優惠券詳情頁看到這些文字。</p>
        <div class="row g-3">
          <div class="col-12">
            <label for="content" class="form-label required">優惠券內容</label>
            <textarea
              id="content"
              v-model="articleData.content"
              name="content"
              rows="5"
              placeholder="請撰寫優惠券內容..."
              class="form-control"
            />
          </div>
          <div class="col-12">
            <label for="tags" class="form-label required">標籤</label>
            <textarea
              id="tags"
              v-model="articleData.tags"
              name="tags"
              rows="2"
              placeholder="請用#撰寫標籤..."
              class="form-control"
            />
          </div>
        </div>
      </section>

      <div class="yp-form-actions">
        <NuxtLink class="btn btn-ghost" to="/">取消</NuxtLink>
        <button type="submit" class="btn btn-primary">發布</button>
      </div>
    </form>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'

import { category } from '~/utils/category'

const articleData = reactive({
  title: '',
  category: '',
  adress: [],
  township: [],
  content: '',
  cover: [],
  isReferral: false,
  isonce: false,
  amount: 10000,
  usedTimes: 0,
  hash: false,
  position: '',
  hashTag: ''
})

const coverUrl = ref('')

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

      // 只添加到 articleData.cover
      if (!articleData.cover) articleData.cover = []
      articleData.cover.push(data.url)
    } catch (error) {
      console.error('上傳錯誤:', error)
      alert(`上傳失敗：${error.message}`)
    }
  }
}

const removeImage = (index) => {
  articleData.cover.splice(index, 1)
}

const addCoverUrl = () => {
  if (coverUrl.value.trim()) {
    try {
      // eslint-disable-next-line no-new
      new URL(coverUrl.value)
      if (!articleData.cover) {
        articleData.cover = []
      }
      // 只添加到 articleData.cover
      articleData.cover.push(coverUrl.value.trim())
      coverUrl.value = ''
    } catch (e) {
      alert('請輸入有效的圖片 URL')
    }
  }
}

const handleSubmit = async () => {
  try {
    const position = articleData.position.match(/\d+\.\d+/g)

    const response = await $fetch('/api/articles', {
      method: 'POST',
      body: {
        title: articleData.title,
        category: articleData.category,
        adress: [articleData.adress],
        township: [articleData.township],
        content: articleData.content,
        cover: articleData.cover,
        amount: articleData.amount,
        usedTimes: articleData.usedTimes,
        isReferral: articleData.isReferral,
        isonce: articleData.isonce,
        hash: articleData.hash,
        position: {
          lat: Number(position[0]),
          lng: Number(position[1])
        },
        tags: articleData.tags
      }
    })

    navigateTo({
      name: 'articles-id',
      params: {
        id: response.id
      }
    })
  } catch (error) {
    console.error('Submit error:', error)
    alert('發布失敗，請重試')
  }
}

definePageMeta({
  middleware: 'auth'
})
</script>

<style scoped lang="scss">
.upload-icon {
  display: block;
  margin: 0 auto 6px;
  font-size: 36px;
  color: $yp-primary;
}

.yp-upload:focus-within {
  border-color: $yp-primary;
  background: $yp-primary-soft;
}

.create-img {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: 12px;
  margin-top: 16px;

  &__item {
    position: relative;
    margin: 0;
    aspect-ratio: 4 / 3;
    border-radius: $yp-radius;
    overflow: hidden;
    background: $yp-surface-2;

    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      display: block;
    }
  }

  &__badge {
    position: absolute;
    left: 8px;
    top: 8px;
    box-shadow: $yp-shadow-sm;
  }

  &__remove {
    position: absolute;
    right: 6px;
    top: 6px;
    width: 30px;
    height: 30px;
    padding: 0;
    border-radius: 50%;
    display: grid;
    place-items: center;
    font-size: 18px;
  }

  &__order {
    position: absolute;
    right: 6px;
    bottom: 6px;
    display: flex;
    gap: 4px;

    .btn {
      width: 28px;
      height: 28px;
      padding: 0;
      border-radius: 50%;
      display: grid;
      place-items: center;
      background: rgba($yp-ink, 0.8);
      border-color: transparent;
      color: #fff;
      font-size: 16px;

      &:disabled {
        opacity: 0.4;
      }
    }
  }
}
</style>
