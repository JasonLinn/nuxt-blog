<template>
  <div class="yp-auth">
    <div class="yp-auth__card">
      <img src="/logo.png" alt="宜蘭旅遊通" class="yp-auth__logo" />
      <h1 class="yp-auth__title">管理後台登入</h1>
      <p class="yp-auth__desc">宜蘭旅遊通 · 民宿平台管理系統</p>

      <form class="d-grid gap-3" @submit.prevent="handleLogin">
        <div>
          <label class="form-label" for="admin-username">管理員帳號</label>
          <input
            id="admin-username"
            v-model="formData.username"
            type="text"
            class="form-control"
            placeholder="請輸入管理員帳號"
            autocomplete="username"
            required
            :disabled="logging"
          />
        </div>

        <div>
          <label class="form-label" for="admin-password">管理員密碼</label>
          <input
            id="admin-password"
            v-model="formData.password"
            type="password"
            class="form-control"
            placeholder="請輸入管理員密碼"
            autocomplete="current-password"
            required
            :disabled="logging"
          />
        </div>

        <!-- 錯誤訊息 -->
        <div
          v-if="errorMessage"
          class="alert alert-danger d-flex align-items-start mb-0 gap-2"
          role="alert"
        >
          <Icon name="ri:error-warning-line" class="fs-5 flex-none" />
          <span class="flex-grow-1">{{ errorMessage }}</span>
          <button
            type="button"
            class="btn-close"
            aria-label="關閉"
            @click="errorMessage = ''"
          ></button>
        </div>

        <button type="submit" class="btn btn-primary btn-lg" :disabled="!canLogin || logging">
          <span v-if="logging" class="spinner-border spinner-border-sm me-2"></span>
          {{ logging ? '登入中...' : '登入系統' }}
        </button>
      </form>

      <ul class="yp-auth__features">
        <li><Icon name="ri:file-list-3-line" /> 審核新民宿申請</li>
        <li><Icon name="ri:checkbox-circle-line" /> 批准或拒絕民宿註冊</li>
        <li><Icon name="ri:bar-chart-box-line" /> 查看民宿申請狀態</li>
        <li><Icon name="ri:mail-send-line" /> 發送審核結果通知</li>
      </ul>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { navigateTo } from 'nuxt/app'

definePageMeta({ layout: false })

// SEO 設定
useSeoMeta({
  title: '管理員登入 - 宜蘭旅遊通',
  description: '民宿平台管理員登入頁面',
  robots: 'noindex, nofollow',
  canonical: 'https://yilanpass.com/admin-login'
})

useHead({
  link: [
    {
      rel: 'canonical',
      href: 'https://yilanpass.com/admin-login'
    }
  ]
})

// 表單狀態
const logging = ref(false)
const errorMessage = ref('')

// 表單資料
const formData = ref({
  username: '',
  password: ''
})

// 驗證邏輯
const canLogin = computed(() => {
  return formData.value.username.trim() && formData.value.password.trim()
})

// 處理登入
const handleLogin = async () => {
  if (!canLogin.value) return

  logging.value = true
  errorMessage.value = ''

  try {
    const response = await $fetch('/api/admin-login', {
      method: 'POST',
      body: {
        username: formData.value.username.trim(),
        password: formData.value.password
      }
    })

    if (response.success) {
      // 登入成功，跳轉到管理頁面
      await navigateTo('/admin-review')
    } else {
      errorMessage.value = response.message || '登入失敗'
    }
  } catch (error) {
    console.error('管理員登入錯誤:', error)
    errorMessage.value = error.data?.message || '帳號或密碼錯誤'
  } finally {
    logging.value = false
  }
}

// 檢查是否已登入
onMounted(async () => {
  try {
    const response = await $fetch('/api/admin-auth')
    if (response.success) {
      await navigateTo('/admin-review')
    }
  } catch (error) {
    // 未登入，保持在登入頁面
  }
})
</script>

<style scoped lang="scss">
.yp-auth__features {
  list-style: none;
  margin: 24px 0 0;
  padding: 16px 0 0;
  border-top: 1px solid $yp-line;
  display: grid;
  gap: 8px;
  font-size: 0.875rem;
  color: $yp-muted;

  li {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .icon {
    color: $yp-primary;
    font-size: 1.125rem;
  }
}
</style>
