export default defineNuxtRouteMiddleware(async (to, from) => {
  // 只在客戶端執行
  if (process.server) return;

  // 檢查是否為民宿後台相關頁面
  if (to.path.startsWith('/homestay-admin')) {
    try {
      // 檢查登入狀態
      const response = await $fetch('/api/homestay-auth');
      
      if (!response.success) {
        return navigateTo('/homestay-login');
      }
      
    } catch (error) {
      console.error('民宿認證檢查失敗:', error);
      return navigateTo('/homestay-login');
    }
  }
}); 