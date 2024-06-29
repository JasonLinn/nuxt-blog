// https://nuxt.com/docs/api/configuration/nuxt-config
// export default defineNuxtConfig({
//   modules: ['@nuxtjs/tailwindcss', 'nuxt-icon'],
//   devtools: { enabled: true }
// })

export default defineNuxtConfig({
  css: ['~/assets/scss/main.scss'],
  modules: ['nuxt-icon', '@nuxtjs/ngrok'],
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
    server: {
      proxy: {
        '/api/notify': { // API 路由
          target: 'https://notify-api.line.me/', // 主要 Domain
          changeOrigin: true,
        },
        '/api/sendMsg': { // API 路由
          target: 'https://api.line.me/', // 主要 Domain
          changeOrigin: true,
        },
      },
    },
  },
  devtools: { enabled: true },
  ngrok: {
    // module options
    authtoken: process.env.NGROK_AUTHTOKEN
  }
});
