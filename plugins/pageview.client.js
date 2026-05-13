// 客戶端 pageview 計數
// - 首屏載入由 LayoutHeader 的 animateVisitor() 處理
// - SPA 切換頁面由本 plugin 處理（page:finish 第二次起才計）
export default defineNuxtPlugin((nuxtApp) => {
  let isFirstPageFinish = true

  nuxtApp.hook('page:finish', () => {
    if (isFirstPageFinish) {
      // 跳過初次載入（避免與 animateVisitor 的初次 +1 重複）
      isFirstPageFinish = false
      return
    }
    const { trackPageview } = useSiteStats()
    trackPageview()
  })
})
