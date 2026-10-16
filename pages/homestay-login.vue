<template>
  <div class="yp-auth login-page">
    <div class="yp-auth__card">
      <div class="login-icon">
        <Icon name="ri:home-heart-line" />
      </div>
      <h1 class="yp-auth__title">民宿會員登入</h1>
      <p class="yp-auth__desc">使用您的民宿編號登入管理後台</p>

      <form class="login-form" @submit.prevent="handleLogin">
        <div class="mb-3">
          <label for="account" class="form-label">民宿編號</label>
          <input
            id="account"
            v-model="form.account"
            type="text"
            autocomplete="username"
            placeholder="請輸入您的民宿編號"
            class="form-control"
            :disabled="loading"
            required
          />
        </div>

        <div class="mb-3">
          <label for="password" class="form-label">密碼</label>
          <input
            id="password"
            v-model="form.password"
            type="password"
            autocomplete="current-password"
            placeholder="請輸入密碼"
            class="form-control"
            :disabled="loading"
            required
          />
        </div>

        <div
          v-if="error"
          class="alert alert-danger d-flex align-items-start gap-2 py-2"
          role="alert"
        >
          <Icon name="ri:error-warning-line" class="mt-1 flex-shrink-0" />
          <span>{{ error }}</span>
        </div>

        <button type="submit" class="btn btn-primary btn-lg w-100" :disabled="loading">
          <span
            v-if="loading"
            class="spinner-border spinner-border-sm me-2"
            aria-hidden="true"
          ></span>
          {{ loading ? '登入中...' : '登入管理後台' }}
        </button>
      </form>

      <div class="login-footer">
        <NuxtLink to="/homestay-list" class="btn btn-ghost btn-sm btn-icon">
          <Icon name="ri:arrow-left-line" />
          返回民宿列表
        </NuxtLink>
        <NuxtLink to="/homestay-register" class="btn btn-ghost btn-sm">尚未加入？申請註冊</NuxtLink>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import { navigateTo } from 'nuxt/app'

// SEO設定
useSeoMeta({
  title: '民宿會員登入 - 宜蘭旅遊通',
  description: '民宿業者專用登入頁面，管理您的民宿資訊',
  canonical: 'https://yilanpass.com/homestay-login'
})

useHead({
  link: [
    {
      rel: 'canonical',
      href: 'https://yilanpass.com/homestay-login'
    }
  ]
})

// 表單狀態
const form = ref({
  account: '',
  password: ''
})

const loading = ref(false)
const error = ref('')

// 處理登入
const handleLogin = async () => {
  try {
    loading.value = true
    error.value = ''

    if (!form.value.account.trim() || !form.value.password.trim()) {
      error.value = '請輸入民宿編號和密碼'
      return
    }

    const response = await $fetch('/api/homestay-login', {
      method: 'POST',
      body: {
        account: form.value.account.trim(),
        password: form.value.password.trim()
      }
    })

    if (response.success) {
      // 登入成功，跳轉到管理後台
      await navigateTo('/homestay-admin')
    }
  } catch (err) {
    console.error('登入錯誤:', err)
    error.value = err.data?.message || err.message || '登入失敗，請檢查帳號密碼'
  } finally {
    loading.value = false
  }
}

// 自動填入密碼提示
watch(
  () => form.value.account,
  (newAccount) => {
    if (newAccount && !form.value.password.startsWith('B')) {
      // 當輸入民宿編號時，自動提示密碼格式
      if (newAccount.length > 0) {
        // 可以選擇性地自動填入密碼前綴
        // form.value.password = `B${newAccount}`;
      }
    }
  }
)
</script>

<style lang="scss" scoped>
// 保留在 default layout（有前台 Header），所以不佔滿整個 viewport
.login-page {
  min-height: calc(100vh - #{$yp-header-h} - #{$yp-tabbar-h});
  padding: 32px 16px;

  @media (min-width: $yp-bp-md) {
    min-height: calc(100vh - #{$yp-header-h});
  }
}

.login-icon {
  width: 48px;
  height: 48px;
  margin-bottom: 16px;
  border-radius: $yp-radius;
  background: $yp-primary-soft;
  color: $yp-primary;
  display: grid;
  place-items: center;
  font-size: 26px;
}

.login-footer {
  margin-top: 20px;
  padding-top: 16px;
  border-top: 1px solid $yp-line;
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  gap: 4px;
}
</style>
