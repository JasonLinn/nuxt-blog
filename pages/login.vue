<template>
  <div class="yp-auth">
    <div class="yp-auth__card">
      <NuxtLink to="/" class="d-inline-block" aria-label="回首頁">
        <img src="/one_text.png" class="yp-auth__logo" alt="宜蘭旅遊通" />
      </NuxtLink>
      <h1 class="yp-auth__title">管理員登入</h1>
      <p class="yp-auth__desc">請輸入管理員帳號與密碼。</p>

      <form @submit.prevent="handleLogin">
        <div class="mb-3">
          <label for="account" class="form-label">帳號</label>
          <input
            id="account"
            v-model="loginData.account"
            name="account"
            type="text"
            autocomplete="account"
            required
            class="form-control"
          />
        </div>

        <div class="mb-4">
          <label for="password" class="form-label">密碼</label>
          <input
            id="password"
            v-model="loginData.password"
            name="password"
            type="password"
            autocomplete="current-password"
            required
            class="form-control"
          />
        </div>

        <button type="submit" class="btn btn-primary w-100" :disabled="submitting">
          <span
            v-if="submitting"
            class="spinner-border spinner-border-sm me-2"
            aria-hidden="true"
          ></span>
          {{ submitting ? '登入中…' : '登入' }}
        </button>
      </form>

      <p class="mb-0 mt-4 text-center">
        <NuxtLink to="/" class="small text-secondary">
          <Icon name="ri:arrow-left-line" /> 回到首頁
        </NuxtLink>
      </p>
    </div>
  </div>
</template>

<script setup>
definePageMeta({
  layout: false
})

useSeoMeta({
  title: '管理員登入 - 宜蘭旅遊通',
  description: '宜蘭旅遊通管理員登入頁面。',
  canonical: 'https://yilanpass.com/login'
})

useHead({
  link: [
    {
      rel: 'canonical',
      href: 'https://yilanpass.com/login'
    }
  ]
})

const loginData = reactive({
  account: '',
  password: ''
})

const submitting = ref(false)

const handleLogin = async () => {
  submitting.value = true
  try {
    const { data, error } = await useFetch('/api/login', {
      method: 'POST',
      body: {
        account: loginData.account,
        password: loginData.password
      }
    })

    if (error.value) {
      alert(error.value?.data?.message || '登入失敗')
    } else if (data.value) {
      navigateTo('/')
    }
  } finally {
    submitting.value = false
  }
}
</script>
