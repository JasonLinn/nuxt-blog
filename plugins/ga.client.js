export default defineNuxtPlugin((nuxtApp) => {
  const runtimeConfig = useRuntimeConfig()

  function initGoogleAnalytics() {
    const gtagScript = document.createElement('script')
    gtagScript.async = true
    gtagScript.src = 'https://www.googletagmanager.com/gtag/js?id=' + runtimeConfig.public.GA_MEASUREMENT_ID
    document.head.appendChild(gtagScript)

    window.dataLayer = window.dataLayer || []
    function gtag() {
      dataLayer.push(arguments)
    }
    gtag('js', new Date())
    gtag('config', runtimeConfig.public.GA_MEASUREMENT_ID)

    window.gtag = gtag
  }

  if (typeof window !== 'undefined') {
    nuxtApp.hook('app:mounted', () => {
      initGoogleAnalytics()
    })

    // 監聽路由變化
    nuxtApp.$router.afterEach((to) => {
      window?.gtag?.('event', 'page_view', {
        page_path: to.fullPath,
        page_title: document.title
      })
    })
  }
}) 