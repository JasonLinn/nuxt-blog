<template>
  <div>
    <NuxtLayout>
      <NuxtLoadingIndicator :throttle="0" />
      <NuxtPage />
    </NuxtLayout>
  </div>
</template>

<script setup>
const SITE_URL = 'https://yilanpass.com'
const BRAND = '宜蘭旅遊通'
const route = useRoute()

// 預設 canonical / og:url 指向目前頁面（不含查詢參數）；頁面有自己的設定時會覆蓋
const pageUrl = computed(() => {
  const path = route.path.length > 1 ? route.path.replace(/\/+$/, '') : '/'
  return path === '/' ? SITE_URL : `${SITE_URL}${path}`
})

// 設定 description
useHead({
  // 頁面標題已含品牌名時不再重複加
  titleTemplate: (title) => {
    if (!title) return BRAND
    return title.includes(BRAND) ? title : `${title} - ${BRAND}`
  },
  htmlAttrs: {
    lang: 'zh-TW'
  },
  link: [
    {
      rel: 'icon',
      href: '/favicon.png'
    },
    {
      rel: 'canonical',
      href: pageUrl
    }
  ],
  script: [
    {
      children: `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
      new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
      j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
      'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
      })(window,document,'script','dataLayer','GTM-N97SLNC2');`
    }
  ],
  // Google Tag Manager (noscript)：放在 head 設定輸出到 <body> 開頭，
  // 寫在 template 裡會因 noscript 內容在伺服器與瀏覽器解析不同而造成 hydration 不一致
  noscript: [
    {
      innerHTML:
        '<iframe src="https://www.googletagmanager.com/ns.html?id=GTM-N97SLNC2" height="0" width="0" style="display:none;visibility:hidden"></iframe>',
      tagPosition: 'bodyOpen'
    }
  ]
})

const seoMeta = {
  title: '宜蘭旅遊通 | 店家優惠券與合法民宿推薦',
  description:
    '宜蘭旅遊通由宜蘭觀光民宿行銷協會發起，提供在地店家的免費電子優惠券、合法民宿推薦與旅遊資訊。領取店家優惠，依地區、人數與特色尋找合適的合法民宿，輕鬆規劃宜蘭旅程。',
  image: `${SITE_URL}/logo.png`
}

useSeoMeta({
  description: seoMeta.description,
  ogTitle: seoMeta.title,
  ogDescription: seoMeta.description,
  ogImage: seoMeta.image,
  ogUrl: pageUrl,
  twitterTitle: seoMeta.title,
  twitterDescription: seoMeta.description,
  twitterImage: seoMeta.image,
  twitterUrl: pageUrl,
  twitterCard: 'summary_large_image'
})
</script>
<style>
.layout-enter-active,
.layout-leave-active {
  transition: all 0.4s;
}
.layout-enter-from,
.layout-leave-to {
  filter: grayscale(1);
}
</style>
