<template>
  <div class="container py-4">
    <div class="d-flex justify-content-between align-items-center mb-4">
      <h1 class="h2 mb-0">圖片管理</h1>
      <div class="text-muted">
        共 {{ images.length }} 張圖片
      </div>
    </div>
    
    <!-- 載入中狀態 -->
    <div v-if="loading" class="text-center py-5">
      <div class="spinner-border text-primary" role="status">
        <span class="visually-hidden">載入中...</span>
      </div>
    </div>

    <!-- 錯誤訊息 -->
    <div v-if="error" class="alert alert-danger" role="alert">
      {{ error }}
    </div>

    <!-- 圖片列表 -->
    <div v-if="!loading && !error" class="row g-4">
      <div v-for="image in images" :key="image.sha" class="col-6 col-sm-4 col-md-3 col-lg-2">
        <div class="position-relative image-card">
          <img 
            :src="image.download_url" 
            :alt="image.name"
            class="img-fluid rounded shadow-sm"
          />
          <div class="image-overlay">
            <p class="text-white small mb-2 text-truncate">{{ image.name }}</p>
            <div class="d-flex gap-2">
              <button 
                @click="confirmDelete(image)"
                class="btn btn-sm btn-danger"
              >
                刪除
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 刪除確認對話框 -->
    <div v-if="showDeleteConfirm" class="modal show d-block" tabindex="-1" style="z-index: 1050;">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">確認刪除</h5>
            <button type="button" class="btn-close" @click="showDeleteConfirm = false"></button>
          </div>
          <div class="modal-body">
            <p>確定要刪除這張圖片嗎？此操作無法復原。</p>
          </div>
          <div class="modal-footer">
            <button 
              type="button" 
              class="btn btn-secondary" 
              @click="showDeleteConfirm = false"
            >
              取消
            </button>
            <button 
              type="button" 
              class="btn btn-danger" 
              @click="deleteImage"
            >
              確定刪除
            </button>
          </div>
        </div>
      </div>
      <div class="modal-backdrop show" style="z-index: 1040;"></div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'

const images = ref([])
const loading = ref(true)
const error = ref(null)
const showDeleteConfirm = ref(false)
const selectedImage = ref(null)

// 獲取圖片列表
const fetchImages = async () => {
  try {
    loading.value = true
    error.value = null
    
    const response = await fetch('/api/images/list', {
      method: 'GET',
      headers: {
        'Accept': 'application/json'
      }
    })
    
    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.message || '獲取圖片列表失敗')
    }
    
    const data = await response.json()
    images.value = data.filter(item => 
      item.type === 'file' && 
      /\.(jpg|jpeg|png|gif)$/i.test(item.name)
    )
  } catch (err) {
    error.value = err.message
    console.error('Error fetching images:', err)
  } finally {
    loading.value = false
  }
}

// 確認刪除
const confirmDelete = (image) => {
  selectedImage.value = image
  showDeleteConfirm.value = true
}

// 刪除圖片
const deleteImage = async () => {
  try {
    const response = await fetch('/api/images/delete', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name: selectedImage.value.name,
        sha: selectedImage.value.sha
      })
    })

    const data = await response.json()

    if (!data.success) {
      throw new Error(data.error || '刪除失敗')
    }

    // 更新圖片列表
    await fetchImages()
    showDeleteConfirm.value = false
    selectedImage.value = null
  } catch (err) {
    error.value = err.message
    console.error('Error deleting image:', err)
  }
}

onMounted(() => {
  fetchImages()
})

// 需要管理員權限
definePageMeta({
  middleware: 'auth'
})
</script>

<style scoped>
.container {
  max-width: 1400px;
}

.image-card {
  aspect-ratio: 1;
  overflow: hidden;
}

.image-card img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.3s ease;
}

.image-card:hover img {
  transform: scale(1.05);
}

.image-overlay {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  opacity: 0;
  transition: opacity 0.3s ease;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  padding: 1rem;
}

.image-card:hover .image-overlay {
  opacity: 1;
}

/* 自定義滾動條樣式 */
::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 4px;
}

::-webkit-scrollbar-thumb {
  background: #888;
  border-radius: 4px;
}

::-webkit-scrollbar-thumb:hover {
  background: #555;
}

.modal {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 1050;
}

.modal-backdrop {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  z-index: 1040;
}

.modal-dialog {
  position: relative;
  width: auto;
  margin: 1.75rem auto;
  pointer-events: auto;
  z-index: 1060;
}

.modal-content {
  position: relative;
  display: flex;
  flex-direction: column;
  width: 100%;
  pointer-events: auto;
  background-color: #fff;
  background-clip: padding-box;
  border: 0;
  border-radius: 0.3rem;
  outline: 0;
  box-shadow: 0 0.5rem 1rem rgba(0, 0, 0, 0.15);
}

@media (max-width: 576px) {
  .modal-dialog {
    margin: 0.5rem;
  }
}
</style> 