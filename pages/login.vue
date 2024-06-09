<template>
  <div class="flex flex-col items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
    <div class="w-full max-w-md">
      <div class="flex flex-col items-center">
        <NuxtLink to="/">
          <Icon name="logos:nuxt-icon" size="80" />
        </NuxtLink>
        <h2 class="login-title mt-6 py-3 text-center text-3xl font-bold tracking-tight text-gray-700">管理員登入</h2>
      </div>

      <div class="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div class="bg-white px-4 py-8 shadow sm:rounded-lg sm:px-10">
          <form class="space-y-6" @submit.prevent="handleLogin">
            <div class="p-2">
              <label for="account" class="login-title block text-sm font-medium text-gray-700">帳號：</label>
              <div class="mt-1">
                <input
                  id="account"
                  v-model="loginData.account"
                  name="account"
                  type="text"
                  autocomplete="account"
                  required
                  class="block w-full appearance-none rounded-md border border-gray-300 px-3 py-2 placeholder-gray-400 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-emerald-500 sm:text-sm"
                />
              </div>
            </div>

            <div class="p-2">
              <label for="password" class="login-title block text-sm font-medium text-gray-700">密碼：</label>
              <div class="mt-1">
                <input
                  id="password"
                  v-model="loginData.password"
                  name="password"
                  type="password"
                  autocomplete="current-password"
                  required
                  class="block w-full appearance-none rounded-md border border-gray-300 px-3 py-2 placeholder-gray-400 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-emerald-500 sm:text-sm"
                />
              </div>
            </div>

            <div class="p-2">
              <button
                type="submit"
                class="flex w-full justify-center rounded-md border border-transparent bg-emerald-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
              >
                登入
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  </div>
</template>
<style>
.login-title {
  font-weight: bold;
}
</style>

<script setup>
definePageMeta({
  layout: false
})

const loginData = reactive({
  account: '',
  password: ''
})

const handleLogin = async () => {
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
}
</script>
