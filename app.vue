<template>
  <div>
    <NuxtLayout>
      <NuxtLoadingIndicator :throttle="0" />
      <div>
        <NuxtPage />
      </div>
    </NuxtLayout>
  </div>
</template>

<script setup>
// 設定 description
useHead({
  titleTemplate: (title) => (title ? `${title} - 宜蘭旅遊通-電子優惠券` : '宜蘭旅遊通-電子優惠券'),
  htmlAttrs: {
    lang: 'zh-TW'
  },
  link: [
    {
      rel: 'icon',
      href: '/favicon.png'
    }
  ]
})

const { origin } = useRequestURL()
const { baseURL } = useRuntimeConfig().app

const seoMeta = {
  title: '宜蘭旅遊通-電子優惠券',
  description: '歡迎來到「宜蘭旅遊通」，由宜蘭觀光民宿協會發起，專為旅客打造的數位旅遊優惠平台！我們致力於為每一位來到宜蘭的旅客提供便利的數位化旅遊折扣，讓您不僅能輕鬆暢玩宜蘭，更能享受超值優惠。「宜蘭旅遊通」整合宜蘭當地知名景點、優質民宿與特色商家，包括冬山河親水公園、幾米廣場、特色農場與溫泉度假村等，為您帶來親子、情侶及團體旅遊的全方位體驗。透過我們的數位平台，您可以快速搜尋並下載景點門票折扣、餐飲優惠及住宿特惠券，直接用手機掃描即可使用，方便、環保又實惠！宜蘭旅遊通不僅是旅客的旅遊好幫手，還是推動當地經濟的重要力量。我們攜手宜蘭觀光民宿協會，期望透過數位化創新，為宜蘭旅遊業注入更多活力，提升旅遊品質，同時提倡綠色旅遊，讓旅客與自然更親近。立即加入「宜蘭旅遊通」，與宜蘭觀光民宿協會一起探索宜蘭的獨特魅力！體驗便捷旅遊的同時，享受專屬優惠，為您的宜蘭之旅留下更多難忘回憶。',
  image: origin + '/logo.png',
  url: `${origin}${baseURL}`
}

useSeoMeta({
  description: seoMeta.description,
  ogTitle: seoMeta.title,
  ogDescription: seoMeta.description,
  ogImage: seoMeta.image,
  ogUrl: seoMeta.url,
  twitterTitle: seoMeta.title,
  twitterDescription: seoMeta.description,
  twitterImage: seoMeta.image,
  twitterUrl: seoMeta.url,
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
