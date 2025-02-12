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
    public: {
      mapApiKey: "AIzaSyD7HWVfZa4Tq-IGp0SsaCOanE4wtux-T74",
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
    // server: {
    //   proxy: {
    //     '/api/sendMsg': { // API 路由
    //       target: 'https://api.line.me/', // 主要 Domain
    //       changeOrigin: true,
    //     },
    //   },
    // },
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
});