<template><div class="container"><h1>{{ errorMessage || 'LINE登入中 ···' }}</h1><CustomerLoading :isLoading="!errorMessage" /></div></template>
<script setup>
import useStore from '~/store'
const route = useRoute()
const store = useStore()
const errorMessage = ref('')
onMounted(async () => {
  try {
    const result = await $fetch('/api/line/callback', { method: 'POST', body: { code: route.query.code, state: route.query.state } })
    await store.fetchAndSetUser(result.profile)
    await navigateTo(result.returnTo)
  } catch { errorMessage.value = '登入未完成，請返回首頁重新登入。' }
})
</script>
