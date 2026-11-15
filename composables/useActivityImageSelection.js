import { reportUploadFailure } from '~/utils/report-upload-failure'
import { imageSelectionError } from '~/utils/upload-failures'
export function useActivityImageSelection(source) {
  const selectedImages = ref([])

  function clearImages() {
    selectedImages.value.forEach(image => URL.revokeObjectURL(image.url))
    selectedImages.value = []
  }

  function selectImages(event, { replace = false, existingCount = 0 } = {}) {
    const files = Array.from(event.target.files)
    event.target.value = ''
    if (!files.length) return
    if (existingCount + (replace ? 0 : selectedImages.value.length) + files.length > 5) {
      alert(reportUploadFailure(source, 'select', imageSelectionError('tooMany')))
      return
    }
    const previews = []
    for (const file of files) {
      try {
        if (!['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'].includes(file.type)) throw imageSelectionError('format')
        if (!file.size) throw imageSelectionError('empty')
        previews.push({ file, url: URL.createObjectURL(file) })
      } catch (error) {
        previews.forEach(image => URL.revokeObjectURL(image.url))
        alert(reportUploadFailure(source, 'select', error.failureReason ? error : imageSelectionError('decode'), file))
        return
      }
    }
    if (replace) clearImages()
    selectedImages.value.push(...previews)
  }

  function removeImage(index) {
    URL.revokeObjectURL(selectedImages.value[index].url)
    selectedImages.value.splice(index, 1)
  }

  onBeforeUnmount(clearImages)
  return { selectedImages, selectImages, removeImage, clearImages }
}
