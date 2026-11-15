import { reportUploadFailure } from '~/utils/report-upload-failure'
import { prepareUploadImage } from '~/utils/image-upload'

export function useFormImageUpload(source, addImage) {
  const uploadingImages = ref(false)

  async function handleFileUpload(event, onUploaded = addImage) {
    const input = event.target
    const files = Array.from(input.files)
    if (uploadingImages.value || !files.length) return
    input.value = ''
    uploadingImages.value = true
    try {
      for (const file of files) {
        try {
          const body = new FormData()
          body.append('file', await prepareUploadImage(file))
          const result = await $fetch('/api/upload', { method: 'POST', headers: { 'x-upload-source': source }, body })
          if (!result.success || !result.url) throw new Error(result.error || '請稍後再試。')
          onUploaded(result.url)
        } catch (error) {
          alert(`${file.name} 上傳失敗：${reportUploadFailure(source, 'upload', error, file)}`)
        }
      }
    } finally {
      uploadingImages.value = false
    }
  }

  function enableEditorImageUpload(quill) {
    quill.getModule('toolbar').addHandler('image', () => {
      if (uploadingImages.value) return
      const index = quill.getSelection(true).index
      const input = document.createElement('input')
      input.type = 'file'
      input.accept = 'image/jpeg,image/png,image/gif,image/webp'
      input.onchange = event => handleFileUpload(event, url => {
        quill.insertEmbed(index, 'image', url, 'user')
        quill.setSelection(index + 1, 0)
      })
      input.click()
    })
  }

  return { uploadingImages, handleFileUpload, enableEditorImageUpload }
}
