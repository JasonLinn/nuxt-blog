<template>
  <div class="yp-page yp-page--form">
    <nav class="yp-breadcrumb" aria-label="目前位置">
      <NuxtLink to="/">首頁</NuxtLink>
      <span>填寫優惠券</span>
    </nav>
    <header class="yp-page-head">
      <div>
        <span class="yp-page-head__eyebrow">店家刊登</span>
        <h1 class="yp-page-head__title">填寫優惠券</h1>
        <p class="yp-page-head__desc">免費刊登，讓入住合法民宿的旅客找到你。</p>
      </div>
    </header>

    <!-- 說明區塊 -->
    <aside class="submit-notice">
      <Icon name="ri:information-line" class="submit-notice__icon" />
      <div>
        <h2 class="submit-notice__title">填寫說明</h2>
        <p class="submit-notice__text">
          填寫以下資料並上傳圖片，填寫後經過審核（約 3–7 個工作天）即可在「宜蘭旅遊通」平台上架。
          一起分享好康、推廣在地好店。
        </p>
      </div>
    </aside>

    <SubmissionLoginGate v-if="loginRequired" :login-url="loginUrl" title="請先登入再刊登優惠券" />
    <form v-else class="coupon-form" @submit.prevent="submitCoupon">
      <!-- 優惠資訊 -->
      <section class="yp-form-section">
        <h2 class="yp-form-section__title">優惠資訊</h2>
        <p class="yp-form-section__desc">店家名稱、分類與位置。</p>
        <div class="row g-3">
          <!-- 優惠券名稱 -->
          <div class="col-12">
            <label for="title" class="form-label required">優惠券名稱</label>
            <input
              id="title"
              v-model="form.title"
              placeholder="請輸入優惠券名稱"
              name="title"
              type="text"
              required
              class="form-control"
            />
          </div>

          <!-- 商家名稱 -->
          <div class="col-12">
            <label for="business_name" class="form-label required">商家名稱</label>
            <input
              id="business_name"
              v-model="form.business_name"
              placeholder="請輸入商家或店家名稱"
              name="business_name"
              type="text"
              required
              class="form-control"
            />
          </div>

          <!-- 分類 -->
          <div class="col-12">
            <label for="category" class="form-label required">分類</label>
            <select id="category" v-model="form.category_id" class="form-select">
              <option value="">請選擇分類</option>
              <option v-for="cate in category" :key="cate.id" :value="cate.id">
                {{ cate.name }}
              </option>
            </select>
          </div>

          <!-- 地址 -->
          <div class="col-12">
            <label for="adress" class="form-label required">地址</label>
            <textarea
              id="adress"
              v-model="form.adress"
              placeholder="請輸入商家地址"
              name="adress"
              rows="2"
              class="form-control"
            />
          </div>

          <!-- 經緯度 -->
          <div class="col-12">
            <label for="position" class="form-label required">經緯度</label>
            <input
              id="position"
              v-model="form.position"
              placeholder="請輸入經緯度(google 地圖使用)"
              name="position"
              type="text"
              class="form-control"
            />
            <div class="form-text">
              例如：24.63567884891394, 121.79100640000001。可以從 Google 地圖獲取經緯度座標
            </div>
          </div>

          <!-- 鄉鎮 -->
          <div class="col-12">
            <label for="township" class="form-label required">鄉鎮</label>
            <textarea
              id="township"
              v-model="form.township"
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
        <p class="yp-form-section__desc">發放數量與領取限制。</p>
        <div class="row g-3">
          <!-- 發放數量 -->
          <div class="col-12">
            <label for="amount" class="form-label required">發放數量</label>
            <input
              id="amount"
              v-model.number="form.amount"
              placeholder="輸入發放數量"
              name="amount"
              type="number"
              min="1"
              class="form-control"
            />
          </div>

          <!-- 是否顯示推薦店家 -->
          <div class="col-12 col-sm-4">
            <span class="form-label required d-block">是否需顯示推薦店家</span>
            <div class="form-check form-check-inline">
              <input
                id="isReferralTrue"
                v-model="form.isReferral"
                class="form-check-input"
                type="radio"
                value="true"
              />
              <label class="form-check-label" for="isReferralTrue">是</label>
            </div>
            <div class="form-check form-check-inline">
              <input
                id="isReferralFalse"
                v-model="form.isReferral"
                class="form-check-input"
                type="radio"
                value="false"
              />
              <label class="form-check-label" for="isReferralFalse">否</label>
            </div>
          </div>

          <!-- 一個帳號只能領一次 -->
          <div class="col-12 col-sm-4">
            <span class="form-label required d-block">一個帳號只能領一次</span>
            <div class="form-check form-check-inline">
              <input
                id="isonceTrue"
                v-model="form.isonce"
                class="form-check-input"
                type="radio"
                value="true"
              />
              <label class="form-check-label" for="isonceTrue">是</label>
            </div>
            <div class="form-check form-check-inline">
              <input
                id="isonceFalse"
                v-model="form.isonce"
                class="form-check-input"
                type="radio"
                value="false"
              />
              <label class="form-check-label" for="isonceFalse">否</label>
            </div>
          </div>

          <!-- 是否有序號 -->
          <div class="col-12 col-sm-4">
            <span class="form-label required d-block">是否有序號</span>
            <div class="form-check form-check-inline">
              <input
                id="hashTrue"
                v-model="form.hash"
                class="form-check-input"
                type="radio"
                value="true"
              />
              <label class="form-check-label" for="hashTrue">是</label>
            </div>
            <div class="form-check form-check-inline">
              <input
                id="hashFalse"
                v-model="form.hash"
                class="form-check-input"
                type="radio"
                value="false"
              />
              <label class="form-check-label" for="hashFalse">否</label>
            </div>
          </div>
        </div>
      </section>

      <!-- 圖片上傳區域 -->
      <section class="yp-form-section">
        <h2 class="yp-form-section__title">代表性圖片</h2>
        <ol class="submit-steps">
          <li>已有圖片網址？請貼上 URL。</li>
          <li>沒有網址？改用下方上傳圖片檔（JPEG / PNG / GIF，5MB 以內）。</li>
        </ol>

        <!-- 圖片 URL 輸入 -->
        <label for="coverUrl" class="form-label">圖片網址</label>
        <div class="input-group">
          <input
            id="coverUrl"
            v-model="coverUrl"
            placeholder="或輸入圖片 URL"
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
            添加 URL
          </button>
        </div>

        <!-- 檔案上傳 -->
        <label class="yp-upload mt-3">
          <input
            type="file"
            class="visually-hidden"
            accept="image/*"
            multiple
            @change="handleFileUpload"
          />
          <Icon name="ri:upload-cloud-2-line" class="upload-icon" />
          <span class="d-block fw-bold text-ink">點擊選擇圖片</span>
          <span class="d-block small">可一次選多張，第一張會作為封面</span>
        </label>

        <!-- 圖片預覽 -->
        <div v-if="form.cover.length" class="submit-img">
          <figure v-for="(url, index) in form.cover" :key="index" class="submit-img__item">
            <img :src="url" :alt="'圖片 ' + (index + 1)" />
            <span v-if="index === 0" class="submit-img__badge yp-tag yp-tag--primary">封面</span>
            <button
              type="button"
              class="submit-img__remove btn btn-danger btn-sm"
              aria-label="刪除圖片"
              @click.prevent="removeImage(index)"
            >
              <Icon name="ri:close-line" />
            </button>
          </figure>
        </div>
      </section>

      <!-- 優惠內容 -->
      <section class="yp-form-section">
        <h2 class="yp-form-section__title">優惠內容</h2>
        <p class="yp-form-section__desc">旅客會在優惠券詳情頁看到這些文字。</p>
        <div class="row g-3">
          <div class="col-12">
            <label for="content" class="form-label required">優惠券內容</label>
            <textarea
              id="content"
              v-model="form.content"
              name="content"
              rows="5"
              required
              placeholder="請詳細描述優惠券內容、使用方式等..."
              class="form-control"
            />
          </div>
          <div class="col-12">
            <label for="tags" class="form-label">標籤</label>
            <textarea
              id="tags"
              v-model="form.tags"
              name="tags"
              rows="2"
              placeholder="請用#撰寫標籤，例如：#美食 #特惠 #限時"
              class="form-control"
            />
          </div>
        </div>
      </section>

      <!-- 填寫者資訊 -->
      <section class="yp-form-section">
        <h2 class="yp-form-section__title">
          <Icon name="ri:user-3-line" class="me-1" />填寫者資訊
        </h2>
        <p class="yp-form-section__desc">審核結果會透過這裡的聯絡方式通知你。</p>
        <div class="row g-3">
          <div class="col-12 col-md-6">
            <label for="submitter_name" class="form-label required">您的姓名/暱稱</label>
            <input
              id="submitter_name"
              v-model="form.submitter_name"
              type="text"
              placeholder="請輸入您的姓名或暱稱"
              required
              class="form-control"
            />
          </div>
          <div class="col-12 col-md-6">
            <label for="submitter_email" class="form-label">電子郵件</label>
            <input
              id="submitter_email"
              v-model="form.submitter_email"
              type="email"
              placeholder="您的電子郵件地址（選填）"
              class="form-control"
            />
          </div>
        </div>
      </section>

      <div class="yp-form-actions">
        <button type="button" class="btn btn-ghost btn-icon me-auto" @click="resetForm">
          <Icon name="ri:refresh-line" />重設表單
        </button>
        <button type="submit" :disabled="submitting" class="btn btn-primary btn-icon">
          <span v-if="submitting" class="spinner-border spinner-border-sm" aria-hidden="true" />
          <Icon v-else name="ri:send-plane-fill" />
          {{ submitting ? '填寫中...' : '填寫審核' }}
        </button>
      </div>
    </form>

    <!-- 成功填寫的模態框 -->
    <div v-if="showSuccessModal" class="submit-modal" @click="closeSuccessModal">
      <div
        class="submit-modal__card"
        role="dialog"
        aria-modal="true"
        aria-labelledby="submit-success-title"
        @click.stop
      >
        <div class="submit-modal__icon">
          <Icon name="ri:checkbox-circle-fill" />
        </div>
        <h3 id="submit-success-title" class="submit-modal__title">填寫成功！</h3>
        <p>您的優惠券已成功填寫，我們會在 1-3 個工作天內進行審核。</p>
        <p>審核結果將透過您提供的聯絡方式通知。</p>
        <button type="button" class="btn btn-primary w-100" @click="closeSuccessModal">確定</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { category } from '~/utils/category'
const { loginRequired, loginUrl } = useSubmissionLogin()

// 設定頁面標題
useHead({
  title: '店家免費刊登優惠券',
  meta: [
    {
      name: 'description',
      content: '宜蘭在地店家可免費在宜蘭旅遊通刊登電子優惠券，讓來宜蘭的旅客找到你的店。'
    }
  ]
})

// 響應式資料
const submitting = ref(false)
const showSuccessModal = ref(false)
const coverUrl = ref('')

// 表單資料
const form = reactive({
  title: '',
  content: '',
  business_name: '',
  category_id: '',
  adress: '',
  township: '',
  position: '',
  amount: 1000,
  cover: [],
  isReferral: 'false',
  isonce: 'true',
  tags: '',
  hash: 'false',
  submitter_name: '',
  submitter_email: '',
  usedTimes: 0
})

// 處理圖片上傳
const handleFileUpload = async (event) => {
  const files = event.target.files
  if (!files.length) return

  for (const file of files) {
    try {
      console.log('開始上傳文件:', file.name)

      // 驗證文件類型
      const allowedTypes = ['image/jpeg', 'image/png', 'image/gif']
      if (!allowedTypes.includes(file.type)) {
        alert('只允許上傳 JPEG、PNG 和 GIF 格式的圖片')
        continue
      }

      // 驗證文件大小 (5MB)
      const maxSize = 5 * 1024 * 1024
      if (file.size > maxSize) {
        alert('文件太大，最大允許 5MB')
        continue
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
      form.cover.push(data.url)
    } catch (error) {
      console.error('上傳錯誤:', error)
      alert(`上傳失敗：${error.message}`)
    }
  }
}

// 添加圖片 URL
const addCoverUrl = () => {
  if (coverUrl.value.trim()) {
    try {
      // eslint-disable-next-line no-new
      new URL(coverUrl.value)
      form.cover.push(coverUrl.value.trim())
      coverUrl.value = ''
    } catch (e) {
      alert('請輸入有效的圖片 URL')
    }
  }
}

// 移除圖片
const removeImage = (index) => {
  form.cover.splice(index, 1)
}

// 重設表單
const resetForm = (force) => {
  if (force === true || confirm('確定要重設表單？所有資料將會清除。')) {
    Object.keys(form).forEach((key) => {
      if (key === 'amount') {
        form[key] = 1000
      } else if (key === 'isonce') {
        form[key] = 'true'
      } else if (key === 'isReferral') {
        form[key] = 'false'
      } else if (key === 'hash') {
        form[key] = 'false'
      } else if (key === 'usedTimes') {
        form[key] = 0
      } else if (key === 'cover') {
        form[key] = []
      } else {
        form[key] = ''
      }
    })
    coverUrl.value = ''
  }
}

// 填寫優惠券
const submitCoupon = async () => {
  try {
    submitting.value = true

    // 處理地址和鄉鎮轉為陣列
    const adressArray = form.adress ? [form.adress] : []
    const townshipArray = form.township ? [form.township] : []

    // 處理座標轉為 JSON
    let positionJson = null
    if (form.position) {
      const parts = form.position.split(',').map((p) => p.trim())
      if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
        positionJson = { lat: parseFloat(parts[0]), lng: parseFloat(parts[1]) }
      } else {
        try {
          positionJson = JSON.parse(form.position)
        } catch (e) {
          positionJson = { raw: form.position }
        }
      }
    }

    // 使用 $fetch 發送 JSON
    const response = await $fetch('/api/coupons/submit', {
      method: 'POST',
      body: {
        title: form.title,
        content: form.content,
        business_name: form.business_name,
        submitter_name: form.submitter_name,
        submitter_email: form.submitter_email,
        category: form.category_id,
        category_id: form.category_id,
        adress: adressArray,
        township: townshipArray,
        tags: form.tags,
        position: positionJson,
        amount: form.amount,
        isonce: form.isonce === 'true',
        isReferral: form.isReferral === 'true',
        hash: form.hash === 'true',
        cover: form.cover
      }
    })

    if (response.success) {
      showSuccessModal.value = true
      resetForm(true)
    } else {
      throw new Error(response.message || '填寫失敗')
    }
  } catch (error) {
    console.error('填寫優惠券失敗:', error)
    alert('填寫失敗：' + (error.data?.message || error.message || '請稍後再試'))
  } finally {
    submitting.value = false
  }
}

// 關閉成功模態框
const closeSuccessModal = () => {
  showSuccessModal.value = false
}
</script>

<style lang="scss" scoped>
// 說明區塊
.submit-notice {
  display: flex;
  gap: 12px;
  padding: 14px 16px;
  margin-bottom: 16px;
  border-radius: $yp-radius;
  background: $yp-primary-soft;
  color: $yp-primary-ink;

  &__icon {
    flex: none;
    margin-top: 2px;
    font-size: 20px;
  }

  &__title {
    font-size: 1rem;
    font-weight: 700;
    margin: 0 0 2px;
  }

  &__text {
    margin: 0;
    font-size: 0.875rem;
    line-height: 1.6;
    color: $yp-ink;
  }
}

.submit-steps {
  margin: 0 0 16px;
  padding-left: 1.25rem;
  font-size: 0.875rem;
  color: $yp-muted;
}

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

// 圖片預覽
.submit-img {
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
}

// 成功視窗
.submit-modal {
  position: fixed;
  inset: 0;
  z-index: 1100;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
  background: rgba(19, 48, 58, 0.45);
  animation: fadeIn 0.2s ease;

  &__card {
    width: 100%;
    max-width: 420px;
    padding: 28px 24px 24px;
    border-radius: $yp-radius-lg;
    background: $yp-surface;
    box-shadow: $yp-shadow-lg;
    text-align: center;
    animation: slideUp 0.25s ease;

    p {
      margin: 0 0 8px;
      color: $yp-muted;
      line-height: 1.7;
    }

    .btn {
      margin-top: 16px;
    }
  }

  &__icon {
    width: 64px;
    height: 64px;
    margin: 0 auto 12px;
    border-radius: 50%;
    display: grid;
    place-items: center;
    font-size: 32px;
    background: $yp-success-soft;
    color: $yp-success;
  }

  &__title {
    margin: 0 0 8px;
    font-size: 1.375rem;
    font-weight: 700;
  }
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(24px) scale(0.97);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}
</style>
