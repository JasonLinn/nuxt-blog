export function useActivityImageSelection() {
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
      alert('最多可選擇 5 張活動圖片。')
      return
    }
    if (replace) clearImages()
    for (const file of files) {
      selectedImages.value.push({ file, url: URL.createObjectURL(file) })
    }
  }

  function removeImage(index) {
    URL.revokeObjectURL(selectedImages.value[index].url)
    selectedImages.value.splice(index, 1)
  }

  onBeforeUnmount(clearImages)
  return { selectedImages, selectImages, removeImage, clearImages }
}
