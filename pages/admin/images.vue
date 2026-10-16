<template>
  <div>
    <header class="yp-admin-head">
      <div>
        <h1 class="yp-admin-head__title">圖片管理</h1>
        <p class="yp-admin-head__desc">瀏覽並刪除已上傳的圖片</p>
      </div>
      <div class="yp-admin-head__actions">
        <button
          type="button"
          class="btn btn-soft btn-icon"
          :disabled="loading"
          @click="fetchImages"
        >
          <Icon name="ri:refresh-line" /> 重新整理
        </button>
      </div>
    </header>

    <!-- 錯誤訊息 -->
    <div v-if="error" class="alert alert-danger d-flex align-items-center gap-2" role="alert">
      <Icon name="ri:error-warning-line" class="fs-5" />
      <span>{{ error }}</span>
    </div>

    <!-- 載入中狀態 -->
    <div v-if="loading" class="image-grid">
      <span v-for="n in 12" :key="n" class="yp-skeleton image-grid__skeleton"></span>
    </div>

    <!-- 圖片列表 -->
    <template v-else-if="!error">
      <div v-if="images.length" class="yp-table-wrap">
        <div class="image-grid p-3">
          <figure v-for="image in images" :key="image.sha" class="image-tile">
            <img :src="image.download_url" :alt="image.name" loading="lazy" />
            <figcaption class="image-tile__bar">
              <span class="image-tile__name yp-clamp-1" :title="image.name">{{ image.name }}</span>
              <button
                type="button"
                class="btn btn-sm btn-outline-danger btn-icon"
                :aria-label="`刪除 ${image.name}`"
                @click="confirmDelete(image)"
              >
                <Icon name="ri:delete-bin-line" />
              </button>
            </figcaption>
          </figure>
        </div>
        <div class="yp-table-wrap__footer">
          <span>共 {{ images.length }} 張圖片</span>
        </div>
      </div>

      <div v-else class="yp-table-wrap">
        <div class="yp-empty">
          <div class="yp-empty__icon"><Icon name="ri:image-line" /></div>
          <h2 class="yp-empty__title">目前沒有圖片</h2>
          <p class="yp-empty__text">上傳的圖片會顯示在這裡。</p>
        </div>
      </div>
    </template>

    <!-- 刪除確認對話框 -->
    <div v-if="showDeleteConfirm" class="modal show d-block" tabindex="-1" style="z-index: 1050">
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">確認刪除</h5>
            <button
              type="button"
              class="btn-close"
              aria-label="關閉"
              @click="showDeleteConfirm = false"
            ></button>
          </div>
          <div class="modal-body">
            <p v-if="selectedImage" class="fw-bold text-break mb-1">{{ selectedImage.name }}</p>
            <p class="text-muted mb-0">確定要刪除這張圖片嗎？此操作無法復原。</p>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-ghost" @click="showDeleteConfirm = false">
              取消
            </button>
            <button type="button" class="btn btn-danger" @click="deleteImage">確定刪除</button>
          </div>
        </div>
      </div>
      <div class="modal-backdrop show" style="z-index: -1"></div>
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
        Accept: 'application/json'
      }
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.message || '獲取圖片列表失敗')
    }

    const data = await response.json()
    images.value = data.filter(
      (item) => item.type === 'file' && /\.(jpg|jpeg|png|gif)$/i.test(item.name)
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
  layout: 'admin',
  middleware: 'auth'
})
</script>

<style scoped lang="scss">
.image-grid {
  display: grid;
  gap: 12px;
  grid-template-columns: repeat(2, minmax(0, 1fr));

  @media (min-width: $yp-bp-sm) {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }

  @media (min-width: $yp-bp-md) {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }

  @media (min-width: $yp-bp-xl) {
    grid-template-columns: repeat(6, minmax(0, 1fr));
  }

  &__skeleton {
    aspect-ratio: 1;
    border-radius: $yp-radius;
  }
}

.image-tile {
  margin: 0;
  border: 1px solid $yp-line;
  border-radius: $yp-radius;
  overflow: hidden;
  background: $yp-surface;

  img {
    display: block;
    width: 100%;
    aspect-ratio: 1;
    object-fit: cover;
    background: $yp-surface-2;
  }

  &__bar {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 8px 8px 10px;
  }

  &__name {
    flex: 1;
    min-width: 0;
    font-size: 0.8125rem;
    color: $yp-muted;
  }
}
</style>
