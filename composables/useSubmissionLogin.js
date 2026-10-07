// Check before editing a form so login does not discard an in-progress submission.
export function useSubmissionLogin() {
  const route = useRoute()
  onMounted(async () => {
    try { await $fetch('/api/upload-access') } catch (error) {
      if (error.statusCode === 401 || error.response?.status === 401) {
        await navigateTo(`/api/line/login?returnTo=${encodeURIComponent(route.fullPath)}`, { external: true })
      }
    }
  })
}
