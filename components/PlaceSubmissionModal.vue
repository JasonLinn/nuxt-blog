<template>
  <div v-if="isOpen" class="psm-overlay">
    <div
      class="psm-dialog"
      role="dialog"
      aria-modal="true"
      aria-labelledby="place-submission-title"
    >
      <div class="psm-header">
        <h2 id="place-submission-title" class="psm-title">推薦新地點</h2>
        <button
          type="button"
          class="btn btn-ghost btn-icon psm-close"
          aria-label="關閉"
          :disabled="isSubmitting"
          @click="closeModal"
        >
          <Icon name="ri:close-line" />
        </button>
      </div>

      <form class="psm-form" @submit.prevent="submitPlace">
        <div class="psm-body">
          <div class="row g-3">
            <!-- 地點名稱 -->
            <div class="col-12">
              <label class="form-label required" for="psm-name">地點名稱</label>
              <input
                id="psm-name"
                v-model="formData.name"
                type="text"
                required
                class="form-control"
                placeholder="請輸入地點名稱"
              />
            </div>

            <!-- 地點描述 -->
            <div class="col-12">
              <label class="form-label" for="psm-description">地點描述</label>
              <textarea
                id="psm-description"
                v-model="formData.description"
                rows="3"
                class="form-control"
                placeholder="請簡述這個地點的特色..."
              ></textarea>
            </div>

            <!-- 地址 -->
            <div class="col-12">
              <label class="form-label" for="psm-address">地址</label>
              <input
                id="psm-address"
                v-model="formData.address"
                type="text"
                class="form-control"
                placeholder="請輸入完整地址"
              />
            </div>

            <!-- 座標 (可從地圖選取) -->
            <div class="col-6">
              <label class="form-label required" for="psm-lat">緯度</label>
              <input
                id="psm-lat"
                v-model.number="formData.latitude"
                type="number"
                step="any"
                required
                class="form-control"
                placeholder="例: 24.7736"
              />
            </div>
            <div class="col-6">
              <label class="form-label required" for="psm-lng">經度</label>
              <input
                id="psm-lng"
                v-model.number="formData.longitude"
                type="number"
                step="any"
                required
                class="form-control"
                placeholder="例: 121.7741"
              />
            </div>

            <!-- 從地圖選取座標按鈕 -->
            <div class="col-12">
              <button type="button" class="btn btn-soft btn-icon w-100" @click="selectFromMap">
                <Icon name="ri:map-pin-line" />
                從地圖選取座標
              </button>
            </div>

            <!-- 分類 -->
            <div class="col-12">
              <label class="form-label required" for="psm-category">地點分類</label>
              <select id="psm-category" v-model="formData.category_id" required class="form-select">
                <option value="">請選擇分類</option>
                <option value="1">美食餐廳</option>
                <option value="2">觀光景點</option>
                <option value="3">住宿飯店</option>
                <option value="4">購物商店</option>
                <option value="5">休閒娛樂</option>
                <option value="6">交通運輸</option>
                <option value="7">生活服務</option>
                <option value="8">其他</option>
              </select>
            </div>

            <!-- Google Place ID (可選) -->
            <div class="col-12">
              <label class="form-label" for="psm-place-id">Google Place ID（可選）</label>
              <input
                id="psm-place-id"
                v-model="formData.google_place_id"
                type="text"
                class="form-control"
                placeholder="如果知道的話可以填入..."
              />
              <div class="form-text">填入後系統會自動獲取 Google 地點資訊</div>
            </div>

            <!-- 聯絡資訊 -->
            <div class="col-12">
              <label class="form-label" for="psm-website">官方網站</label>
              <input
                id="psm-website"
                v-model="formData.website"
                type="url"
                class="form-control"
                placeholder="https://..."
              />
            </div>
            <div class="col-12">
              <label class="form-label" for="psm-phone">聯絡電話</label>
              <input
                id="psm-phone"
                v-model="formData.phone"
                type="tel"
                class="form-control"
                placeholder="例: 03-123-4567"
              />
            </div>

            <!-- 營業時間 -->
            <div class="col-12">
              <label class="form-label" for="psm-hours">營業時間</label>
              <textarea
                id="psm-hours"
                v-model="formData.opening_hours_text"
                rows="2"
                class="form-control"
                placeholder="例: 週一至週日 09:00-21:00"
              ></textarea>
            </div>

            <!-- 提交須知 -->
            <div class="col-12">
              <div class="alert alert-warning psm-notice mb-0" role="note">
                <h3 class="psm-notice__title">
                  <Icon name="ri:information-line" />
                  提交須知
                </h3>
                <ul class="psm-notice__list">
                  <li>您推薦的地點將送交管理員審核</li>
                  <li>審核通過後才會在地圖上顯示</li>
                  <li>請確保資訊正確且完整</li>
                  <li>我們會在 1-3 個工作天內完成審核</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        <!-- 提交按鈕 -->
        <div class="psm-footer">
          <button
            type="button"
            class="btn btn-outline-secondary"
            :disabled="isSubmitting"
            @click="closeModal"
          >
            取消
          </button>
          <button type="submit" class="btn btn-primary btn-icon" :disabled="isSubmitting">
            <span
              v-if="isSubmitting"
              class="spinner-border spinner-border-sm"
              aria-hidden="true"
            ></span>
            {{ isSubmitting ? '提交中...' : '提交推薦' }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  isOpen: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['close', 'submitted', 'selectLocation'])

const isSubmitting = ref(false)

// 表單資料
const formData = ref({
  name: '',
  description: '',
  address: '',
  latitude: null,
  longitude: null,
  category_id: '',
  google_place_id: '',
  website: '',
  phone: '',
  opening_hours_text: ''
})

// 關閉對話框
const closeModal = () => {
  if (!isSubmitting.value) {
    resetForm()
    emit('close')
  }
}

// 重置表單
const resetForm = () => {
  formData.value = {
    name: '',
    description: '',
    address: '',
    latitude: null,
    longitude: null,
    category_id: '',
    google_place_id: '',
    website: '',
    phone: '',
    opening_hours_text: ''
  }
}

// 從地圖選取座標
const selectFromMap = () => {
  alert('請在地圖上點擊選取位置\n(此功能將在接下來整合)')
  // TODO: 實作地圖選點功能
  // 可以發送事件給父組件開啟地圖選點模式
  emit('selectLocation')
}

// 提交地點
const submitPlace = async () => {
  try {
    isSubmitting.value = true

    // 準備提交資料
    const submitData = {
      ...formData.value,
      status: 'pending', // 設為待審核狀態
      is_featured: false,
      is_private: false,
      auto_import_photo: true // 自動匯入 Google 照片
    }

    // 如果有營業時間文字，嘗試解析為 JSON 格式
    if (submitData.opening_hours_text) {
      // 簡單的時間格式解析，實際可以更複雜
      submitData.opening_hours = {
        text: submitData.opening_hours_text
      }
      delete submitData.opening_hours_text
    }

    console.log('提交地點資料:', submitData)

    // 呼叫 API
    const response = await $fetch('/api/places', {
      method: 'POST',
      body: submitData
    })

    if (response.success) {
      // 顯示成功訊息
      alert('地點推薦已提交！\n感謝您的推薦，我們會在 1-3 個工作天內審核完成。')

      // 發送提交完成事件
      emit('submitted', response.data)

      // 關閉對話框
      closeModal()
    } else {
      throw new Error(response.message || '提交失敗')
    }
  } catch (error) {
    console.error('提交地點失敗:', error)
    alert('提交失敗：' + (error.data?.message || error.message || '未知錯誤'))
  } finally {
    isSubmitting.value = false
  }
}

// 監聽 ESC 鍵關閉對話框
onMounted(() => {
  const handleEscape = (e) => {
    if (e.key === 'Escape' && props.isOpen) {
      closeModal()
    }
  }

  document.addEventListener('keydown', handleEscape)

  onUnmounted(() => {
    document.removeEventListener('keydown', handleEscape)
  })
})
</script>

<style scoped lang="scss">
// 視覺與 Bootstrap modal 一致：白底、16px 圓角、陰影、遮罩 rgba(19,48,58,.45)
.psm-overlay {
  position: fixed;
  inset: 0;
  z-index: 1090;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  background: rgba(19, 48, 58, 0.45);

  // 手機：貼底的抽屜樣式
  @media (max-width: #{$yp-bp-md - 1px}) {
    align-items: flex-end;
    padding: 12px 0 0;
  }
}

.psm-dialog {
  display: flex;
  flex-direction: column;
  width: 100%;
  max-width: 520px;
  max-height: 100%;
  overflow: hidden;
  background: $yp-surface;
  border-radius: $yp-radius-lg;
  box-shadow: $yp-shadow-lg;

  @media (max-width: #{$yp-bp-md - 1px}) {
    max-height: 94dvh;
    border-radius: $yp-radius-lg $yp-radius-lg 0 0;
  }
}

.psm-header {
  display: flex;
  flex: none;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 16px 20px;
  border-bottom: 1px solid $yp-line;
}

.psm-title {
  margin: 0;
  color: $yp-ink;
  font-size: 1.25rem;
  font-weight: 700;
}

.psm-close {
  width: 40px;
  height: 40px;
  padding: 0;
  font-size: 22px;
}

.psm-form {
  display: flex;
  flex: 1;
  flex-direction: column;
  min-height: 0;
}

.psm-body {
  flex: 1;
  min-height: 0;
  padding: 20px;
  overflow-y: auto;
}

.form-label {
  font-size: 0.875rem;
  font-weight: 700;
  color: $yp-ink;
}

.psm-notice {
  background: $yp-warning-soft;
  color: $yp-ink;

  &__title {
    display: flex;
    align-items: center;
    gap: 6px;
    margin: 0 0 6px;
    color: $yp-warning;
    font-size: 0.9375rem;
    font-weight: 700;
  }

  &__list {
    margin: 0;
    padding-left: 1.25rem;
    color: $yp-muted;
    font-size: 0.875rem;
  }
}

.psm-footer {
  display: flex;
  flex: none;
  gap: 8px;
  padding: 14px 20px calc(14px + env(safe-area-inset-bottom));
  border-top: 1px solid $yp-line;
  background: $yp-bg;

  .btn {
    flex: 1;
  }

  @media (min-width: $yp-bp-md) {
    justify-content: flex-end;
    padding-bottom: 14px;

    .btn {
      flex: 0 0 auto;
      min-width: 112px;
    }
  }
}
</style>
