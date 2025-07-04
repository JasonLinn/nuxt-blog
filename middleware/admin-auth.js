export default defineNuxtRouteMiddleware(async () => {
  // 檢查是否在客戶端
  if (process.client) {
    try {
      // 驗證管理員登入狀態
      const response = await $fetch('/api/admin-auth', {
        headers: useRequestHeaders(['cookie'])
      })
      
      if (!response.success || !response.admin) {
        return navigateTo('/admin-login')
      }
    } catch (error) {
      console.error('管理員認證失敗:', error)
      return navigateTo('/admin-login')
    }
  }
}) 