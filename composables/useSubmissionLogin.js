// Check before editing a form so login does not discard an in-progress submission.
// 未登入時不再自動跳轉到 LINE，改由頁面顯示登入提示卡（SubmissionLoginGate），由使用者主動登入。
export function useSubmissionLogin() {
  const route = useRoute()
  const loginRequired = ref(false)
  const loginUrl = computed(() => `/api/line/login?returnTo=${encodeURIComponent(route.fullPath)}`)

  onMounted(async () => {
    try {
      await $fetch('/api/upload-access')
    } catch (error) {
      if (error.statusCode === 401 || error.response?.status === 401) {
        loginRequired.value = true
      }
    }
  })

  return { loginRequired, loginUrl }
}
