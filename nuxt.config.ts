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
    "nuxt-easy-lightbox"
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
      charset: 'utf-8',
      viewport: 'width=device-width, initial-scale=1',
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
  ssr: {
    noExternal: ['axios', 'form-data']
  },
  nitro: {
    experimental: {
      wasm: true
    }
  },
  alias: {
    '@': resolve(__dirname, './')
  }
});