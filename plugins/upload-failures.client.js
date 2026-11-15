import { flushUploadFailures } from '~/utils/report-upload-failure'

export default defineNuxtPlugin(() => {
  window.addEventListener('online', flushUploadFailures)
  void flushUploadFailures()
})
