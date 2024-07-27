<template>
  <div>
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
  </div>
</template>

<script setup>
useHead({
  titleTemplate: (title) => (title ? `${title} - 宜蘭旅遊通-電子優惠券` : '宜蘭旅遊通-電子優惠券'),
  htmlAttrs: {
    lang: 'zh-TW'
  },
  link: [
    {
      rel: 'icon',
      href: '/favicon.ico'
    }
  ]
})

const { origin } = useRequestURL()
const { baseURL } = useRuntimeConfig().app

const seoMeta = {
  title: '宜蘭旅遊通-電子優惠券',
  description: '歡迎使用，內含各式優惠',
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
