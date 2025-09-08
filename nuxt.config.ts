// https://nuxt.com/docs/api/configuration/nuxt-config
// export default defineNuxtConfig({
//   modules: ['@nuxtjs/tailwindcss', 'nuxt-icon'],
//   devtools: { enabled: true }
// })
import { resolve } from 'path'
export default defineNuxtConfig({
  css: ['~/assets/scss/main.scss'],
  modules: [
    'nuxt-icon',
    '@nuxtjs/ngrok',
    '@pinia/nuxt',
    'vue3-carousel-nuxt',
    'radix-vue/nuxt',
    'nuxt-file-storage',
    '@nuxt/image',
    "nuxt-easy-lightbox",
    '@nuxtjs/sitemap'
  ],
  runtimeConfig: {
    // 只在服務器端可用的私有鍵
    DATABASE_URL: process.env.DATABASE_URL,
    GOOGLE_MAPS_API_KEY: process.env.GOOGLE_MAPS_API_KEY,
    GITHUB_TOKEN: process.env.GITHUB_TOKEN,
    GITHUB_USERNAME: process.env.GITHUB_USERNAME,
    GITHUB_REPO: process.env.GITHUB_REPO,
    EMAIL_USER: process.env.EMAIL_USER,
    EMAIL_PASSWORD: process.env.EMAIL_PASSWORD,
    
    // 可以暴露給客戶端的公共鍵
    public: {
      GOOGLE_MAPS_API_KEY: process.env.GOOGLE_MAPS_API_KEY,
      GA_MEASUREMENT_ID: process.env.GA_MEASUREMENT_ID || 'G-45PDMJHNT9'
    },
  },
  vite: {
    css: {
      preprocessorOptions: {
        scss: {
          additionalData: `
            @import "@/assets/scss/_color.scss";
            @import "@/assets/scss/_variables.scss";
          `
        }
      }
    },
    optimizeDeps: {
      include: ["@fawmi/vue-google-maps", "fast-deep-equal"],
    },
    define: {
      global: 'globalThis',
    },
    ssr: {
      noExternal: ['form-data', 'axios']
    }
  },
  devtools: { enabled: true },
  ngrok: {
    // module options
    authtoken: process.env.NGROK_AUTHTOKEN
  },
  routeRules : {
    '/api/notify' : {
        proxy : { to : "https://notify-api.line.me/api/notify" , },
    },
    // '/api/sendMsg' : {
    //     proxy : { to : "https://api.line.me/v2/bot/message/push" , },
    // },
  },
  app: {
    head: {
      htmlAttrs: {
        lang: 'zh-TW'
      },
      charset: 'utf-8',
      viewport: 'width=device-width, initial-scale=1',
      title: '宜蘭旅遊通-宜蘭觀光民宿行銷協會 | 宜蘭合法民宿推薦與旅遊資訊',
      meta: [
        { name: 'description', content: '宜蘭旅遊通-宜蘭觀光民宿行銷協會提供宜蘭地區合法民宿推薦、親子民宿、寵物民宿、海景民宿、包棟民宿等多種主題特色民宿。設有戲水池、KTV、烤肉設施的民宿應有盡有，讓您輕鬆規劃完美的宜蘭之旅' },
        { name: 'keywords', content: '宜蘭民宿,合法民宿,親子民宿,寵物民宿,海景民宿,包棟民宿,戲水池民宿,KTV民宿,烤肉民宿,宜蘭住宿,宜蘭旅遊,民宿推薦,游泳池民宿,唱歌民宿,BBQ民宿' },
        { name: 'author', content: '宜蘭旅遊通-宜蘭觀光民宿行銷協會' },
        { name: 'robots', content: 'index, follow' },
        
        // Open Graph
        { property: 'og:site_name', content: '宜蘭旅遊通-宜蘭觀光民宿行銷協會' },
        { property: 'og:type', content: 'website' },
        { property: 'og:title', content: '宜蘭旅遊通-宜蘭觀光民宿行銷協會 | 宜蘭合法民宿推薦與旅遊資訊' },
        { property: 'og:description', content: '提供宜蘭地區合法民宿推薦，包含親子民宿、寵物民宿、海景民宿、戲水池民宿、KTV民宿、烤肉民宿等多樣化住宿選擇' },
        { property: 'og:url', content: 'https://yilanpass.com' },
        { property: 'og:image', content: 'https://yilanpass.com/logo.png' },
        
        // Twitter Card
        { name: 'twitter:card', content: 'summary_large_image' },
        { name: 'twitter:title', content: '宜蘭旅遊通-宜蘭觀光民宿行銷協會 | 宜蘭合法民宿推薦' },
        { name: 'twitter:description', content: '提供宜蘭地區合法民宿推薦，包含戲水池、KTV、烤肉設施等多樣化住宿選擇，讓您輕鬆規劃完美的宜蘭之旅' },
        { name: 'twitter:image', content: 'https://yilanpass.com/logo.png' }
      ],
      link: [
        { rel: 'canonical', href: 'https://yilanpass.com' },
        { rel: 'icon', type: 'image/x-icon', href: '/favicon.png' }
      ]
    }
  },
  components: [
    {
      path: '~/components',
      pathPrefix: false
    }
  ],
  fileStorage: {
    // enter the absolute path to the location of your storage
    mount: 'public/',

    // {OR} use environment variables (recommended)
    // mount: process.env.mount
    // you need to set the mount in your .env file at the root of your project
  },
  // 添加對 CommonJS 模塊的支持
  build: {
    transpile: ['utils/hashDatabase.cjs']
  },
  nitro: {
    experimental: {
      wasm: true
    }
  },
  alias: {
    '@': resolve(__dirname, './')
  },
  
  // SEO 設定
  site: {
    url: 'https://yilanpass.com'
  },
  
  // Sitemap 設定 - 使用 v7 語法
  sitemap: {
    urls: [
      '/',
      '/homestay-list',
      '/about',
      '/rule',
      '/relative',
      '/findRoom'
    ]
  }
});