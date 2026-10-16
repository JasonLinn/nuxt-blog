<template>
  <div>
    <header class="yp-admin-head">
      <div>
        <h1 class="yp-admin-head__title">特色項目管理</h1>
        <p class="yp-admin-head__desc">維護民宿的主題特色與服務設施選項</p>
      </div>
    </header>

    <div class="d-grid gap-4">
      <section v-for="section in sections" :key="section.type">
        <div class="yp-section-head">
          <h2 class="yp-section-head__title d-flex align-items-center gap-2">
            <Icon :name="section.icon" class="text-primary" />
            {{ section.title }}
          </h2>
          <button
            type="button"
            class="btn btn-primary btn-icon"
            @click="showAddModal(section.type)"
          >
            <Icon name="ri:add-line" /> {{ section.addLabel }}
          </button>
        </div>
        <p class="text-muted small mb-3">{{ section.desc }}</p>

        <div class="yp-table-wrap">
          <div v-if="loading" class="d-grid gap-2 p-3">
            <span v-for="n in 3" :key="n" class="yp-skeleton" style="height: 40px"></span>
          </div>

          <div v-else-if="!section.items.length" class="yp-empty">
            <div class="yp-empty__icon"><Icon :name="section.icon" /></div>
            <h3 class="yp-empty__title">尚未建立{{ section.title }}</h3>
            <p class="yp-empty__text">點擊上方按鈕新增第一個項目。</p>
          </div>

          <template v-else>
            <div class="table-responsive">
              <table class="table-hover yp-table-stack table align-middle">
                <thead>
                  <tr>
                    <th>名稱</th>
                    <th style="width: 120px">狀態</th>
                    <th class="text-end" style="width: 200px">操作</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="feature in section.items" :key="feature.id">
                    <td
                      data-label="名稱"
                      class="fw-bold"
                      :class="{ 'text-muted': !feature.is_active }"
                    >
                      {{ feature.name }}
                    </td>
                    <td data-label="狀態">
                      <span
                        class="yp-status"
                        :class="feature.is_active ? 'yp-status--active' : 'yp-status--inactive'"
                      >
                        {{ feature.is_active ? '啟用' : '停用' }}
                      </span>
                    </td>
                    <td data-label="操作">
                      <div class="yp-row-actions">
                        <button
                          type="button"
                          class="btn btn-sm btn-soft btn-icon"
                          title="編輯"
                          @click="editFeature(feature)"
                        >
                          <Icon name="ri:edit-line" /> 編輯
                        </button>
                        <button
                          type="button"
                          class="btn btn-sm btn-outline-secondary btn-icon"
                          :title="feature.is_active ? '停用' : '啟用'"
                          @click="toggleFeatureStatus(feature)"
                        >
                          <Icon :name="feature.is_active ? 'ri:eye-off-line' : 'ri:eye-line'" />
                          {{ feature.is_active ? '停用' : '啟用' }}
                        </button>
                        <button
                          type="button"
                          class="btn btn-sm btn-outline-danger btn-icon"
                          title="刪除"
                          aria-label="刪除"
                          @click="deleteFeature(feature)"
                        >
                          <Icon name="ri:delete-bin-line" />
                        </button>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div class="yp-table-wrap__footer">
              <span>共 {{ section.items.length }} 項</span>
            </div>
          </template>
        </div>
      </section>
    </div>

    <!-- 新增/編輯模態框 -->
    <div v-if="showModal" class="yp-modal-overlay" @click="closeModal">
      <div class="yp-modal" role="dialog" aria-modal="true" @click.stop>
        <div class="yp-modal__header">
          <h3 class="yp-modal__title">
            {{ editingFeature ? '編輯' : '新增'
            }}{{ modalType === 'theme' ? '主題特色' : '服務設施' }}
          </h3>
          <button type="button" class="btn-close" aria-label="關閉" @click="closeModal"></button>
        </div>

        <form class="yp-modal__body d-grid gap-3" @submit.prevent="saveFeature">
          <div>
            <label class="form-label required" for="feature-name">名稱</label>
            <input
              id="feature-name"
              v-model="featureForm.name"
              type="text"
              class="form-control"
              placeholder="請輸入特色名稱"
              required
            />
          </div>

          <div class="form-check form-switch">
            <input
              id="feature-active"
              v-model="featureForm.is_active"
              type="checkbox"
              class="form-check-input"
              role="switch"
            />
            <label class="form-check-label" for="feature-active">啟用此項目</label>
          </div>

          <div class="d-flex justify-content-end gap-2 pt-2">
            <button type="button" class="btn btn-ghost" @click="closeModal">取消</button>
            <button type="submit" class="btn btn-primary" :disabled="processing">
              {{ processing ? '儲存中...' : '儲存' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'

definePageMeta({
  layout: 'admin',
  middleware: ['admin-auth']
})

// 狀態管理
const themeFeatures = ref([])
const serviceAmenities = ref([])
const loading = ref(true)
const processing = ref(false)
const showModal = ref(false)
const modalType = ref('theme') // 'theme' or 'service'
const editingFeature = ref(null)

// 表單資料
const featureForm = ref({
  name: '',
  is_active: true
})

// 載入特色項目
const loadFeatures = async () => {
  try {
    loading.value = true
    const response = await $fetch('/api/admin/features')
    if (response.success) {
      themeFeatures.value = response.data.themeFeatures || []
      serviceAmenities.value = response.data.serviceAmenities || []
    }
  } catch (error) {
    console.error('載入特色項目失敗:', error)
    alert('載入特色項目失敗，請重新整理頁面')
  } finally {
    loading.value = false
  }
}

// 顯示新增模態框
const showAddModal = (type) => {
  modalType.value = type
  editingFeature.value = null
  featureForm.value = {
    name: '',
    is_active: true
  }
  showModal.value = true
}

// 編輯特色項目
const editFeature = (feature) => {
  modalType.value = feature.type
  editingFeature.value = feature
  featureForm.value = {
    name: feature.name,
    is_active: feature.is_active
  }
  showModal.value = true
}

// 儲存特色項目
const saveFeature = async () => {
  try {
    processing.value = true

    const url = editingFeature.value
      ? `/api/admin/features/${editingFeature.value.id}`
      : '/api/admin/features'

    const method = editingFeature.value ? 'PUT' : 'POST'

    const response = await $fetch(url, {
      method,
      body: {
        ...featureForm.value,
        type: modalType.value
      }
    })

    if (response.success) {
      await loadFeatures()
      closeModal()
      alert(editingFeature.value ? '更新成功！' : '新增成功！')
    }
  } catch (error) {
    console.error('儲存失敗:', error)
    alert('儲存失敗，請稍後再試')
  } finally {
    processing.value = false
  }
}

// 切換項目狀態
const toggleFeatureStatus = async (feature) => {
  try {
    const response = await $fetch(`/api/admin/features/${feature.id}`, {
      method: 'PUT',
      body: {
        ...feature,
        is_active: !feature.is_active
      }
    })

    if (response.success) {
      await loadFeatures()
    }
  } catch (error) {
    console.error('更新狀態失敗:', error)
    alert('更新狀態失敗')
  }
}

// 刪除特色項目
const deleteFeature = async (feature) => {
  if (!confirm(`確定要刪除「${feature.name}」嗎？此操作不可復原。`)) return

  try {
    const response = await $fetch(`/api/admin/features/${feature.id}`, {
      method: 'DELETE'
    })

    if (response.success) {
      await loadFeatures()
      alert('刪除成功！')
    }
  } catch (error) {
    console.error('刪除失敗:', error)
    alert('刪除失敗，請稍後再試')
  }
}

// 關閉模態框
const closeModal = () => {
  showModal.value = false
  editingFeature.value = null
  featureForm.value = { name: '', is_active: true }
}

onMounted(() => {
  loadFeatures()
})

// 兩個分類區塊（僅用於 template 渲染）
const sections = computed(() => [
  {
    type: 'theme',
    title: '主題特色',
    desc: '民宿主題標籤，例如親子、寵物友善',
    icon: 'ri:home-heart-line',
    addLabel: '新增主題特色',
    items: themeFeatures.value
  },
  {
    type: 'service',
    title: '服務設施',
    desc: '民宿提供的服務與設施',
    icon: 'ri:service-line',
    addLabel: '新增服務設施',
    items: serviceAmenities.value
  }
])
</script>

<style scoped lang="scss">
.yp-modal-overlay {
  position: fixed;
  inset: 0;
  z-index: 1050;
  display: grid;
  place-items: center;
  padding: 16px;
  background: rgba(19, 48, 58, 0.45);
}

.yp-modal {
  width: 100%;
  max-width: 440px;
  max-height: 90vh;
  overflow-y: auto;
  background: $yp-surface;
  border-radius: $yp-radius-lg;
  box-shadow: $yp-shadow-lg;

  &__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    padding: 18px 20px 0;
  }

  &__title {
    font-size: 1.125rem;
    font-weight: 700;
    margin: 0;
  }

  &__body {
    padding: 16px 20px 20px;
  }
}
</style>
