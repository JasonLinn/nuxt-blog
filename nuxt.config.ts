// https://nuxt.com/docs/api/configuration/nuxt-config
// export default defineNuxtConfig({
//   modules: ['@nuxtjs/tailwindcss', 'nuxt-icon'],
//   devtools: { enabled: true }
// })

export default defineNuxtConfig({
  css: ['~/assets/scss/main.scss'],
  modules: [
    'nuxt-icon',
    '@nuxtjs/ngrok',
    '@pinia/nuxt',
    'nuxt-swiper'
  ],
  // swiper: {
  //   modules: ['navigation', 'pagination', 'effect-creative' ]
  // },
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
  }
});