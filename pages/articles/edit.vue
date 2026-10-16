<template>
  <div class="yp-page yp-page--form">
    <nav class="yp-breadcrumb" aria-label="目前位置">
      <NuxtLink to="/">首頁</NuxtLink>
      <span>更新優惠券</span>
    </nav>
    <header class="yp-page-head">
      <div>
        <span class="yp-page-head__eyebrow">優惠券管理</span>
        <h1 class="yp-page-head__title">更新優惠券</h1>
        <p class="yp-page-head__desc">修改優惠券資訊，儲存後前台會立即更新。</p>
      </div>
    </header>

    <form @submit.prevent="handleSubmit">
      <!-- 基本資訊 -->
      <section class="yp-form-section">
        <h2 class="yp-form-section__title">基本資訊</h2>
        <p class="yp-form-section__desc">店家名稱、分類與位置。</p>
        <div class="row g-3">
          <div class="col-12">
            <label for="title" class="form-label required">優惠券標題</label>
            <input
              id="title"
              v-model="articleData.title"
              placeholder="請輸入優惠券標題"
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
            <div class="form-text">格式：經度：121.614046 緯度：24.6379</div>
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
            <span class="form-label required d-block">是否允許推薦店家</span>
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
          第一張會作為封面，可用箭頭調整順序。可貼上圖片網址，或上傳圖片檔（JPEG / PNG / GIF，5MB
          以內）。
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
        <div v-if="coverArray.length" class="create-img">
          <figure v-for="(url, index) in coverArray" :key="index" class="create-img__item">
            <img :src="url" :alt="'圖片 ' + (index + 1)" />
            <span v-if="index === 0" class="create-img__badge yp-tag yp-tag--primary">封面</span>
            <button
              type="button"
              class="create-img__remove btn btn-danger btn-sm"
              title="刪除"
              aria-label="刪除圖片"
              @click.prevent="removeImage(index)"
            >
              <Icon name="ri:close-line" />
            </button>
            <div class="create-img__order">
              <button
                type="button"
                class="btn btn-sm"
                title="上移"
                aria-label="上移"
                :disabled="index === 0"
                @click.prevent="moveImage(index, 'up')"
              >
                <Icon name="ri:arrow-up-line" />
              </button>
              <button
                type="button"
                class="btn btn-sm"
                title="下移"
                aria-label="下移"
                :disabled="index === coverArray.length - 1"
                @click.prevent="moveImage(index, 'down')"
              >
                <Icon name="ri:arrow-down-line" />
              </button>
            </div>
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
        <button type="submit" class="btn btn-primary">更新</button>
      </div>
    </form>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { category } from '~/utils/category'
const route = useRoute()

const { data: articleData, error } = await useFetch(`/api/articles/${route.query.id}`)

if (error.value) {
  throw createError({ statusCode: 400, message: '您要更新的優惠券不存在或已經被刪除' })
}

// 先轉字串
articleData.value.adress = await articleData.value.adress.toString()
articleData.value.township = await articleData.value.township.toString()
articleData.value.cover = await articleData.value.cover.toString()
articleData.value.position =
  (await '經度：') + articleData.value.position?.lng + ' 緯度：' + articleData.value.position?.lat

const coverUrl = ref('')

// 計算屬性用於圖片預覽和排序
const coverArray = computed({
  get: () => {
    return articleData.value.cover
      ? articleData.value.cover.split(',').filter((url) => url.trim())
      : []
  },
  set: (newArray) => {
    articleData.value.cover = newArray.join(',')
  }
})

const addCoverUrl = () => {
  if (coverUrl.value.trim()) {
    try {
      // eslint-disable-next-line no-new
      new URL(coverUrl.value)
      const newArray = [...coverArray.value]
      newArray.push(coverUrl.value.trim())
      coverArray.value = newArray
      coverUrl.value = ''
    } catch (e) {
      alert('請輸入有效的圖片 URL')
    }
  }
}

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

      // 添加到 coverArray
      const newArray = [...coverArray.value]
      newArray.push(data.url)
      coverArray.value = newArray
    } catch (error) {
      console.error('上傳錯誤:', error)
      alert(`上傳失敗：${error.message}`)
    }
  }
}

// 移除圖片
const removeImage = (index) => {
  const newArray = [...coverArray.value]
  newArray.splice(index, 1)
  coverArray.value = newArray
}

// 移動圖片順序
const moveImage = (index, direction) => {
  const newArray = [...coverArray.value]

  if (direction === 'up' && index > 0) {
    // 與上一個元素交換位置
    const temp = newArray[index]
    newArray[index] = newArray[index - 1]
    newArray[index - 1] = temp
  } else if (direction === 'down' && index < newArray.length - 1) {
    // 與下一個元素交換位置
    const temp = newArray[index]
    newArray[index] = newArray[index + 1]
    newArray[index + 1] = temp
  }

  coverArray.value = newArray
}

const handleSubmit = async () => {
  try {
    // 驗證必填欄位
    if (!articleData.value || !articleData.value.title || !articleData.value.category) {
      alert('請填寫必要欄位！')
      return
    }

    console.log(articleData, 'ddddd')
    const position = articleData.value.position.match(/\d+\.\d+/g)
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
    console.error('提交錯誤：', error)
    alert('提交失敗，請檢查所有欄位後重試')
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
