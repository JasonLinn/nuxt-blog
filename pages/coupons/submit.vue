<template>
  <div class="container w-full justify-center px-6 lg:px-0">
    <div class="coupon-submit mb-8 flex w-full max-w-3xl justify-center">
      <form class="coupon-form w-100 divide-y divide-gray-200" @submit.prevent="submitCoupon">
        <div class="space-y-8 divide-y divide-gray-200">
          <div>
            <div class="mt-6">
              <h3 class="submit-title text-xl font-medium leading-6 text-gray-900">填寫優惠券</h3>
              <!-- 說明區塊 -->
            <div class="info-banner">
              <div class="info-header">
                <Icon name="mdi:information-outline" />
                <h4>填寫說明</h4>
              </div>
              <p class="info-description">
                填寫以下資料並上傳圖片，填寫後經過審核（約 3–7 個工作天）即可在「宜蘭旅遊通」平台上架。
                一起分享好康、推廣在地好店 💚
              </p>
            </div>
            </div>

            <div class="mt-6 grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-6">
              <!-- 優惠券名稱 -->
              <section class="col-md-12 submit-part">
                <label for="title" class="submit-name block text-sm font-medium text-gray-700">
                  <TipIcon/>優惠券名稱：
                </label>
                <div class="mt-1">
                  <input
                    id="title"
                    v-model="form.title"
                    placeholder="請輸入優惠券名稱"
                    name="title"
                    type="text"
                    required
                    class="w-100 block w-full appearance-none rounded-md border border-gray-300 px-3 py-2 placeholder-gray-400 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-emerald-500 sm:text-sm"
                  />
                </div>
              </section>

              <!-- 商家名稱 -->
              <section class="col-md-12 submit-part">
                <label for="business_name" class="submit-name block text-sm font-medium text-gray-700">
                  <TipIcon/>商家名稱：
                </label>
                <div class="mt-1">
                  <input
                    id="business_name"
                    v-model="form.business_name"
                    placeholder="請輸入商家或店家名稱"
                    name="business_name"
                    type="text"
                    required
                    class="w-100 block w-full appearance-none rounded-md border border-gray-300 px-3 py-2 placeholder-gray-400 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-emerald-500 sm:text-sm"
                  />
                </div>
              </section>

              <!-- 分類 -->
              <section class="col-md-12 submit-part">
                <label for="category" class="submit-name block text-sm font-medium text-gray-700">
                  <TipIcon/>分類：
                </label>
                <select class="submit-category border shadow-sm w-100 py-2 px-3 mt-1 rounded-md" v-model="form.category_id">
                  <option value="">請選擇分類</option>
                  <option v-for="cate in category" :key="cate.id" :value="cate.id">{{ cate.name }}</option>
                </select>
              </section>

              <!-- 地址 -->
              <section class="col-md-12 submit-part">
                <label for="adress" class="submit-name block text-sm font-medium text-gray-700">
                  <TipIcon/>地址：
                </label>
                <textarea
                  id="adress"
                  v-model="form.adress"
                  placeholder="請輸入商家地址"
                  name="adress"
                  rows="2"
                  class="w-100 block w-full appearance-none rounded-md border border-gray-300 px-3 py-2 placeholder-gray-400 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-emerald-500 sm:text-sm"
                />
              </section>

              <!-- 經緯度 -->
              <section class="col-md-12 submit-part">
                <label for="position" class="submit-name block text-sm font-medium text-gray-700">
                  <TipIcon/>經緯度(例如: 24.63567884891394, 121.79100640000001):
                </label>
                <div class="mt-1">
                  <input
                    id="position"
                    v-model="form.position"
                    placeholder="請輸入經緯度(google 地圖使用)"
                    name="position"
                    type="text"
                    class="w-100 block w-full appearance-none rounded-md border border-gray-300 px-3 py-2 placeholder-gray-400 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-emerald-500 sm:text-sm"
                  />
                  <small class="text-gray-500">可以從 Google 地圖獲取經緯度座標</small>
                </div>
              </section>

              <!-- 鄉鎮 -->
              <section class="col-md-12 submit-part">
                <label for="township" class="submit-name block text-sm font-medium text-gray-700">
                  <TipIcon/>鄉鎮：
                </label>
                <textarea
                  id="township"
                  v-model="form.township"
                  placeholder="請輸入鄉鎮"
                  name="township"
                  rows="2"
                  class="w-100 block w-full appearance-none rounded-md border border-gray-300 px-3 py-2 placeholder-gray-400 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-emerald-500 sm:text-sm"
                />
              </section>

              <!-- 發放數量 -->
              <section class="col-md-12 submit-part">
                <label for="amount" class="submit-name block text-sm font-medium text-gray-700">
                  <TipIcon/>發放數量：
                </label>
                <div class="mt-1">
                  <input
                    id="amount"
                    v-model.number="form.amount"
                    placeholder="輸入發放數量"
                    name="amount"
                    type="number"
                    min="1"
                    class="w-100 block w-full appearance-none rounded-md border border-gray-300 px-3 py-2 placeholder-gray-400 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-emerald-500 sm:text-sm"
                  />
                </div>
              </section>

              <!-- 是否顯示推薦店家 -->
              <section class="col-md-12 submit-part">
                <label class="submit-name block text-sm font-medium text-gray-700">
                  <TipIcon/>是否需顯示推薦店家：
                </label>
                <div class="mt-2 flex gap-4">
                  <label class="inline-flex items-center">
                    <input type="radio" value="true" v-model="form.isReferral" class="mr-2">
                    是
                  </label>
                  <label class="inline-flex items-center">
                    <input type="radio" value="false" v-model="form.isReferral" class="mr-2">
                    否
                  </label>
                </div>
              </section>

              <!-- 一個帳號只能領一次 -->
              <section class="col-md-12 submit-part">
                <label class="submit-name block text-sm font-medium text-gray-700">
                  <TipIcon/>一個帳號只能領一次：
                </label>
                <div class="mt-2 flex gap-4">
                  <label class="inline-flex items-center">
                    <input type="radio" value="true" v-model="form.isonce" class="mr-2">
                    是
                  </label>
                  <label class="inline-flex items-center">
                    <input type="radio" value="false" v-model="form.isonce" class="mr-2">
                    否
                  </label>
                </div>
              </section>

              <!-- 圖片上傳區域 -->
              <section class="col-md-12 submit-part">
                <label class="submit-name block text-sm font-medium text-gray-700">
                  <TipIcon/>請上傳代表性圖片：
                </label>
                
                <div class="upload-steps">
                  <p class="upload-step">
                    <span class="step-index">1.</span>
                    已有圖片網址？請貼上 URL。
                  </p>
                  <p class="upload-step">
                    <span class="step-index">2.</span>
                    沒有網址？改用下方上傳圖片檔。
                  </p>
                </div>

                <!-- 圖片 URL 輸入 -->
                <div class="mt-2">
                  <div class="flex gap-2">
                    <input
                      v-model="coverUrl"
                      placeholder="或輸入圖片 URL"
                      type="text"
                      class="flex-1 block appearance-none rounded-md border border-gray-300 px-3 py-2 placeholder-gray-400 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-emerald-500 sm:text-sm"
                      @keyup.enter="addCoverUrl"
                    />
                    <button 
                      @click.prevent="addCoverUrl" 
                      class="add-url-btn"
                      :disabled="!coverUrl"
                    >
                      添加 URL
                    </button>
                  </div>
                </div>

                <!-- 檔案上傳 -->
                <div class="mt-3">
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

                <!-- 圖片預覽 -->
                <div class="submit-img mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
                  <div v-for="(url, index) in form.cover" :key="index" class="relative">
                    <img :src="url" :alt="'圖片 ' + (index + 1)" class="w-full h-32 object-cover rounded-lg shadow-sm" />
                    <button 
                      @click.prevent="removeImage(index)" 
                      class="absolute top-2 right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-600 shadow-md"
                    >
                      ×
                    </button>
                  </div>
                </div>
              </section>

              <!-- 優惠券內容 -->
              <section class="col-md-12 submit-part">
                <label for="content" class="submit-name block text-sm font-medium text-gray-700">
                  <TipIcon/>優惠券內容：
                </label>
                <div class="mt-1">
                  <textarea
                    id="content"
                    v-model="form.content"
                    name="content"
                    rows="4"
                    required
                    placeholder="請詳細描述優惠券內容、使用方式等..."
                    class="w-100 block w-full appearance-none rounded-md border border-gray-300 px-3 py-2 placeholder-gray-400 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-emerald-500 sm:text-sm"
                  />
                </div>
              </section>

              <!-- 標籤 -->
              <section class="col-md-12 submit-part">
                <label for="tags" class="submit-name block text-sm font-medium text-gray-700">
                  <TipIcon/>標籤：
                </label>
                <div class="mt-1">
                  <textarea
                    id="tags"
                    v-model="form.tags"
                    name="tags"
                    rows="2"
                    placeholder="請用#撰寫標籤，例如：#美食 #特惠 #限時"
                    class="w-100 block w-full appearance-none rounded-md border border-gray-300 px-3 py-2 placeholder-gray-400 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-emerald-500 sm:text-sm"
                  />
                </div>
              </section>

              <!-- 是否有序號 -->
              <section class="col-md-12 submit-part">
                <label class="submit-name block text-sm font-medium text-gray-700">
                  <TipIcon/>是否有序號：
                </label>
                <div class="mt-2 flex gap-4">
                  <label class="inline-flex items-center">
                    <input type="radio" value="true" v-model="form.hash" class="mr-2">
                    是
                  </label>
                  <label class="inline-flex items-center">
                    <input type="radio" value="false" v-model="form.hash" class="mr-2">
                    否
                  </label>
                </div>
              </section>

              <!-- 填寫者資訊 -->
              <section class="col-span-full submit-part submitter-section">
                <div class="submitter-header">
                  <Icon name="mdi:account-circle-outline" />
                  <h4>填寫者資訊</h4>
                </div>
                
                <div class="submitter-fields">
                  <div class="field-group">
                    <label for="submitter_name" class="submit-name">
                      <TipIcon />您的姓名/暱稱：
                    </label>
                    <input 
                      id="submitter_name"
                      v-model="form.submitter_name" 
                      type="text" 
                      placeholder="請輸入您的姓名或暱稱"
                      required 
                      class="w-100 block w-full appearance-none rounded-md border border-gray-300 px-3 py-2 placeholder-gray-400 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-emerald-500 sm:text-sm"
                    />
                  </div>

                  <div class="field-group">
                    <label for="submitter_email" class="submit-name">
                      <TipIcon />電子郵件：
                    </label>
                    <input 
                      id="submitter_email"
                      v-model="form.submitter_email" 
                      type="email" 
                      placeholder="您的電子郵件地址（選填）"
                      class="w-100 block w-full appearance-none rounded-md border border-gray-300 px-3 py-2 placeholder-gray-400 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-emerald-500 sm:text-sm"
                    />
                  </div>
                </div>
              </section>
            </div>
          </div>
        </div>

        <div class="pt-5">
          <div class="submit-button flex justify-between">
            <button type="button" @click="resetForm" class="btn btn-light shadow-sm">
              <Icon name="mdi:refresh" class="inline-block mr-1" />
              重設表單
            </button>
            <button
              type="submit"
              :disabled="submitting"
              class="ml-3 btn btn-info text-white shadow-sm flex items-center gap-2"
            >
              <Icon v-if="submitting" name="eos-icons:loading" />
              <Icon v-else name="mdi:send" />
              {{ submitting ? '填寫中...' : '填寫審核' }}
            </button>
          </div>
        </div>
      </form>
    </div>

    <!-- 成功填寫的模態框 -->
    <div v-if="showSuccessModal" class="modal-overlay" @click="closeSuccessModal">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <Icon name="mdi:check-circle" class="success-icon" />
          <h3>填寫成功！</h3>
        </div>
        <div class="modal-body">
          <p>您的優惠券已成功填寫，我們會在 1-3 個工作天內進行審核。</p>
          <p>審核結果將透過您提供的聯絡方式通知。</p>
        </div>
        <div class="modal-actions">
          <button @click="closeSuccessModal" class="px-6 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700">
            確定
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { category } from '~/utils/category'

// 設定頁面標題
useHead({
  title: '填寫優惠券 - 宜蘭旅遊網',
  meta: [
    { name: 'description', content: '分享您的優惠券給其他旅客，豐富宜蘭旅遊體驗' }
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

  for (let file of files) {
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
const resetForm = () => {
  if (confirm('確定要重設表單？所有資料將會清除。')) {
    Object.keys(form).forEach(key => {
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

    // 處理圖片 - 取得第一張圖片 URL
    let coverUrl = null
    if (form.cover && form.cover.length > 0) {
      coverUrl = form.cover[0]
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
        category_id: form.category_id,
        address: form.adress,
        township: form.township,
        tags: form.tags,
        position: form.position,
        amount: form.amount,
        isonce: form.isonce === 'true',
        isReferral: form.isReferral === 'true',
        cover_url: coverUrl
      }
    })

    if (response.success) {
      showSuccessModal.value = true
      resetForm()
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
.user-info {
  z-index: 1;
}

.container {
  background: #f6f7f9;
  min-height: 100vh;
  padding-top: 2rem;
  padding-bottom: 2rem;
}

.coupon-submit {
  display: flex;
  justify-content: center;
}

// 新增說明區塊樣式
.info-banner {
  background: #f0fdfa;
  border-left: 4px solid #0f766e;
  border-radius: 8px;
  padding: 16px 20px;
  margin-bottom: 24px;

  .info-header {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 8px;

    svg {
      font-size: 20px;
      color: #0f766e;
    }

    h4 {
      font-size: 16px;
      font-weight: 600;
      color: #0f766e;
      margin: 0;
    }
  }

  .info-description {
    color: #374151;
    font-size: 14px;
    line-height: 1.6;
    margin: 0;
  }
}

// 響應式設計
@media (max-width: 768px) {
  .info-banner {
    padding: 14px 16px;

    .info-header {
      h4 {
        font-size: 15px;
      }

      svg {
        font-size: 18px;
      }
    }

    .info-description {
      font-size: 13px;
    }
  }
}

// 填寫者資訊區塊樣式
.submitter-section {
  margin-top: 32px;
  padding-top: 24px;
  border-top: 2px solid #e5e7eb;
  
  .submitter-header {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 20px;
    padding-left: 4px;
    
    svg {
      color: #0f766e;
      font-size: 24px;
    }
    
    h4 {
      font-size: 18px;
      font-weight: 600;
      color: #1f2937;
      margin: 0;
    }
  }
  
  .submitter-fields {
    display: grid;
    gap: 16px;
    
    .field-group {
      label {
        display: flex;
        align-items: center;
        gap: 4px;
        font-size: 14px;
        font-weight: 500;
        color: #374151;
        margin-bottom: 8px;
      }
      
      input {
        width: 100%;
        padding: 10px 14px;
        font-size: 14px;
        border: 1px solid #d1d5db;
        border-radius: 6px;
        transition: all 0.15s ease-in-out;
        
        &::placeholder {
          color: #9ca3af;
        }
        
        &:focus {
          outline: none;
          border-color: #0f766e;
          box-shadow: 0 0 0 3px rgba(15, 118, 110, 0.1);
        }
      }
    }
  }
}

@media (max-width: 768px) {
  .submitter-section {
    margin-top: 24px;
    padding-top: 20px;
    
    .submitter-header {
      margin-bottom: 16px;
      
      svg {
        font-size: 22px;
      }
      
      h4 {
        font-size: 16px;
      }
    }
    
    .submitter-fields {
      gap: 14px;
      
      .field-group {
        label {
          font-size: 13px;
        }
        
        input {
          padding: 9px 12px;
          font-size: 13px;
        }
      }
    }
  }
}

.submit-title {
  font-size: 30px;
  font-weight: 700;
  color: #0f766e;
  margin-bottom: 6px;
}

.submit-subtitle {
  color: #5f6b7a;
  line-height: 1.6;
  font-size: 15px;
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 0.75rem 0;
}

.coupon-form {
  background: #ffffff;
  border-radius: 16px;
  padding: 36px;
  box-shadow: 0 12px 32px rgba(15, 118, 110, 0.08);
  border: 1px solid rgba(15, 118, 110, 0.08);
}

.submit-name {
  font-size: 14px;
  font-weight: 600;
  margin-bottom: 10px;
  color: #2b3440;
  display: flex;
  align-items: center;
  gap: 4px;
}

.submit-category {
  display: block;
  height: 44px;
  border: 1px solid #d4d9df;
  border-radius: 10px;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
  background: white;
  
  &:hover {
    border-color: #0f766e;
  }
  
  &:focus {
    outline: none;
    border-color: #0f766e;
    box-shadow: 0 0 0 3px rgba(15, 118, 110, 0.15);
  }
}


.submit-img {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 1.25rem;
  margin-top: 16px;
}

.submit-img img {
  width: 100%;
  height: 150px;
  object-fit: cover;
  border-radius: 10px;
  border: 1px solid rgba(15, 118, 110, 0.15);
  box-shadow: 0 6px 14px rgba(15, 118, 110, 0.08);
}

.submit-part {
  margin-bottom: 28px;

  label.submit-name {
    margin-bottom: 10px;
  }

  input[type="text"],
  input[type="number"],
  input[type="tel"],
  input[type="email"],
  textarea,
  select {
    border: 1px solid #d4d9df;
    border-radius: 10px;
    transition: border-color 0.2s ease, box-shadow 0.2s ease;

    &:hover {
      border-color: #0f766e;
    }

    &:focus {
      border-color: #0f766e;
      box-shadow: 0 0 0 3px rgba(15, 118, 110, 0.15);
    }
  }

  input[type="radio"] {
    width: 18px;
    height: 18px;
    accent-color: #0f766e;
    cursor: pointer;
    margin-right: 8px;
  }

  label:not(.submit-name) {
    cursor: pointer;
    color: #4b5563;

    &:hover {
      color: #0f766e;
    }
  }

  small {
    display: block;
    margin-top: 6px;
    color: #94a3b8;
    font-size: 13px;
  }

  .flex.gap-2 {
    margin-bottom: 12px;
  }

  .add-url-btn {
    padding: 0.65rem 1.25rem;
    border-radius: 10px;
    font-weight: 600;
    background: linear-gradient(135deg, #0f766e 0%, #14b8a6 100%);
    color: #ffffff;
    border: none;
    box-shadow: 0 8px 16px rgba(15, 118, 110, 0.18);
    transition: transform 0.2s ease, box-shadow 0.2s ease, background 0.2s ease;

    &:hover:not(:disabled) {
      transform: translateY(-1px);
      box-shadow: 0 10px 20px rgba(15, 118, 110, 0.22);
      background: linear-gradient(135deg, #0b5250 0%, #0f766e 100%);
    }

    &:disabled {
      opacity: 0.55;
      box-shadow: none;
      cursor: not-allowed;
    }
  }

  .upload-steps {
    margin-bottom: 12px;
    color: #4b5563;
  }

  .upload-step {
    display: flex;
    gap: 8px;
    font-size: 13px;
    line-height: 1.6;
    margin-bottom: 4px;

    &:last-child {
      margin-bottom: 0;
    }
  }

  .step-index {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 18px;
    height: 18px;
    border-radius: 999px;
    background: #0f766e;
    color: #ffffff;
    font-size: 12px;
    font-weight: 600;
    flex-shrink: 0;
    margin-top: 2px;
  }
}

.submit-button {
  display: flex;
  justify-content: space-between;
  padding-top: 1.5rem;
  gap: 12px;

  button {
    transition: background-color 0.2s ease, box-shadow 0.2s ease;
    font-weight: 600;
    border-radius: 10px;
    padding: 0.75rem 1.5rem;
  }

  .btn-light {
    background: #f8fafc;
    border: 1px solid #d4d9df;
    color: #2b3440;

    &:hover:not(:disabled) {
      background: #eef2f6;
      border-color: #0f766e;
      color: #0f766e;
    }
  }

  .btn-info {
    background: #0f766e;
    border: 1px solid #0f766e;

    &:hover:not(:disabled) {
      background: #0a5b54;
      border-color: #0a5b54;
      box-shadow: 0 6px 16px rgba(15, 118, 110, 0.2);
    }

    &:disabled {
      opacity: 0.7;
      box-shadow: none;
    }
  }
}

// 分隔線樣式
.space-y-8 > div {
  padding-bottom: 20px;

  &:not(:last-child) {
    margin-bottom: 20px;
  }
}

.divide-y > div {
  border-color: #e5e7eb;
}

// Grid 佈局間距
.grid.gap-4 {
  gap: 18px !important;
}

.grid.gap-x-4 {
  column-gap: 18px !important;
}

.grid.gap-y-6 {
  row-gap: 26px !important;
}

// 填寫者資訊區塊
.border-t {
  border-color: #e5e7eb !important;
  background: #f8fafc;
  border-radius: 12px;
  padding: 24px !important;
  margin-top: 16px;
  
  h4 {
    color: #1f2937;
    font-weight: 700;
    position: relative;
    padding-left: 14px;
    margin-bottom: 18px !important;
    
    &:before {
      content: '';
      position: absolute;
      left: 0;
      top: 50%;
      transform: translateY(-50%);
      width: 3px;
      height: 24px;
      background: #0f766e;
      border-radius: 999px;
    }
  }
}

// 模態框樣式
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.35);
  backdrop-filter: blur(2px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  animation: fadeIn 0.25s ease;
}

.modal-content {
  background: #ffffff;
  border-radius: 18px;
  padding: 32px;
  max-width: 420px;
  width: calc(100% - 40px);
  text-align: center;
  box-shadow: 0 18px 36px rgba(15, 118, 110, 0.15);
  animation: slideUp 0.3s ease;

  .modal-header {
    margin-bottom: 20px;

    .success-icon {
      width: 60px;
      height: 60px;
      color: #0f766e;
      margin: 0 auto 16px;
    }

    h3 {
      margin: 0;
      color: #0f172a;
      font-size: 22px;
      font-weight: 700;
    }
  }

  .modal-body {
    margin-bottom: 24px;

    p {
      color: #4b5563;
      line-height: 1.7;
      margin-bottom: 12px;
      font-size: 15px;

      &:last-child {
        margin-bottom: 0;
      }
    }
  }

  .modal-actions {
    button {
      font-weight: 600;
      transition: background-color 0.2s ease;
      background: #0f766e;
      border-radius: 10px;
      padding: 0.75rem 1.75rem;

      &:hover {
        background: #0a5b54;
      }
    }
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
    transform: translateY(30px) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

@keyframes scaleIn {
  from {
    opacity: 0;
    transform: scale(0);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

// 響應式設計
@media (max-width: 768px) {
  .coupon-form {
    padding: 24px;
  }
  
  .submit-title {
    font-size: 26px;
  }
  
  .modal-content {
    padding: 32px 24px;
  }
  
  .submit-button {
    flex-direction: column;
    
    button {
      width: 100%;
    }
  }
}
</style>