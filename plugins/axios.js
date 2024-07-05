

import axios from 'axios'
import { defineNuxtPlugin } from '#app'
export default defineNuxtPlugin((nuxtApp) => {
  return {
    provide: {
      axios: axios
    }
  }
})

// # 上面的代碼主要是將axios註冊為 this.$axios
// # 前端就可以呼叫axios了!
// # etc. await this.$axios.get('/api/testAPI/getOneDB')