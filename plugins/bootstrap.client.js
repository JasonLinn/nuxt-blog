// plugins/bootstrap.client.js
// 只載入實際用到的 Modal、Collapse，不要整包 bootstrap JS 進主要 bundle
import Modal from 'bootstrap/js/dist/modal'
import Collapse from 'bootstrap/js/dist/collapse'

export default defineNuxtPlugin((_nuxtApp) => {
  return {
    provide: {
      bootstrap: {
        modal: (element) => new Modal(element),
        collapse: (element) => new Collapse(element)
      }
    }
  }
})
