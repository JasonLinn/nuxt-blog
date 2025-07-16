<template>
  <div class="page-container">
    <!-- 頁面標題 -->
    <div class="header">
      <div class="header-content">
        <div class="title-section">
          <h1 class="page-title">優惠券列表</h1>
          <p class="page-description">瀏覽所有優惠券和代訂服務</p>
        </div>
      </div>
    </div>

    <!-- 主要內容 -->
    <div class="main-content">
      <!-- 載入中 - 骨架屏效果 -->
      <div v-if="loading" class="content-section">
        <div class="cards-grid">
          <div
            v-for="n in 8"
            :key="`skeleton-${n}`"
            class="card skeleton-card"
          >
            <div class="card-content">
              <div class="card-header">
                <div class="skeleton skeleton-title"></div>
                <div class="skeleton skeleton-btn"></div>
              </div>
              
              <div class="tags-container">
                <div class="skeleton skeleton-tag"></div>
                <div class="skeleton skeleton-tag-small"></div>
              </div>

              <div class="info-section">
                <div class="skeleton skeleton-time"></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 錯誤訊息 -->
      <div v-else-if="error" class="error-container">
        <Icon name="ri:error-warning-line" class="error-icon" />
        <h3 class="error-title">載入失敗</h3>
        <p class="error-message">{{ error }}</p>
        <div class="error-actions">
          <button @click="fetchData" class="retry-btn">
            重試
          </button>
        </div>
      </div>

      <!-- 資料列表 -->
      <div v-else-if="data.items && data.items.length > 0" class="content-section">
        <!-- 優惠券列表 -->
        <div class="cards-grid">
          <div
            v-for="item in data.items"
            :key="item.id"
            class="card"
            @click="navigateToItem(item)"
          >
            <!-- 內容 -->
            <div class="card-content">
              <div class="card-header">
                <!-- 標題 -->
                <h3 class="card-title">
                  {{ item.title }}
                </h3>
                
                <!-- 操作按鈕 -->
                <button
                  class="detail-btn"
                  @click.stop="navigateToItem(item)"
                >
                  詳情
                </button>
              </div>
              
              <!-- 標籤 -->
              <div class="tags-container">
                <span
                  v-if="item.source === 'relative'"
                  class="tag tag-referral"
                >
                  代訂
                </span>
                <span
                  v-if="item.isonce"
                  class="tag tag-once"
                >
                  限一次
                </span>
              </div>

              <!-- 基本資訊 -->
              <div class="info-section">
                <div class="time-info">
                  更新時間: {{ formatDate(item.updated_at) }}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 空狀態 -->
      <div v-else class="empty-state">
        <Icon name="ri:coupon-line" class="empty-icon" />
        <h3 class="empty-title">沒有優惠券</h3>
        <p class="empty-description">目前沒有任何優惠券或代訂服務</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { $fetch } from 'ofetch'
import { ref, onMounted } from 'vue'

// 響應式資料
const loading = ref(false)
const error = ref(null)
const data = ref({
  items: []
})

// 用戶資訊
const userInfo = ref(null)

// 方法
const fetchData = async () => {
  loading.value = true
  error.value = null
  
  try {
    const response = await $fetch('/api/articles/launch-schedule')
    data.value = response
  } catch (err) {
    console.error('Fetch data error:', err)
    error.value = err.message || '載入資料失敗'
  } finally {
    loading.value = false
  }
}

const navigateToItem = (item) => {
  const path = item.source === 'relative' ? `/relative_shop/${item.id}` : `/articles/${item.id}`
  navigateTo(path)
}

const formatDate = (dateString) => {
  if (!dateString) return '未知時間'
  
  try {
    const date = new Date(dateString)
    if (isNaN(date.getTime())) return '無效時間'
    
    const now = new Date()
    const diffTime = Math.abs(now - date)
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    
    if (diffDays === 1) {
      return '今天'
    } else if (diffDays === 2) {
      return '昨天'
    } else if (diffDays <= 7) {
      return `${diffDays - 1} 天前`
    } else {
      return date.toLocaleDateString('zh-TW', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      })
    }
  } catch (error) {
    console.error('Date formatting error:', error)
    return '時間錯誤'
  }
}

// 獲取用戶資訊
const fetchUserInfo = async () => {
  try {
    const user = await $fetch('/api/whoami')
    userInfo.value = user
  } catch (err) {
    console.log('User not logged in or error:', err)
  }
}

// 生命週期
onMounted(() => {
  fetchUserInfo()
  fetchData()
})

// 頁面元資料
definePageMeta({
  title: '優惠券上架時間列表',
  description: '查看所有優惠券和代訂服務的上架時間'
})
</script>

<style scoped>
.page-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
}

.header {
  background-color: white;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  border-bottom: 1px solid #e9ecef;
}

.header-content {
  max-width: 1200px;
  margin: 0 auto;
  padding: 16px;
}

.title-section {
  text-align: center;
}

.page-title {
  font-size: 24px;
  font-weight: bold;
  color: #343a40;
  margin: 0 0 8px 0;
}

.page-description {
  font-size: 14px;
  color: #6c757d;
  margin: 0;
}

.main-content {
  max-width: 1200px;
  margin: 0 auto;
  padding: 16px;
}

/* 載入狀態 */
.loading-container {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 48px 0;
}

.loading-spinner {
  width: 32px;
  height: 32px;
  border: 2px solid #e9ecef;
  border-top: 2px solid #28a745;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.loading-text {
  margin-left: 12px;
  font-size: 14px;
  color: #6c757d;
}

/* 錯誤狀態 */
.error-container {
  text-align: center;
  padding: 48px 0;
}

.error-icon {
  width: 48px;
  height: 48px;
  color: #dc3545;
  margin: 0 auto 16px auto;
}

.error-title {
  font-size: 16px;
  font-weight: 600;
  color: #343a40;
  margin: 0 0 8px 0;
}

.error-message {
  font-size: 14px;
  color: #6c757d;
  margin: 0 0 24px 0;
}

.retry-btn {
  padding: 8px 16px;
  font-size: 14px;
  font-weight: 500;
  color: white;
  background-color: #28a745;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.retry-btn:hover {
  background-color: #218838;
}

/* 卡片網格 */
.cards-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 16px;
}

@media (min-width: 640px) {
  .cards-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
  }
}

@media (min-width: 768px) {
  .cards-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

@media (min-width: 1024px) {
  .cards-grid {
    grid-template-columns: repeat(4, 1fr);
  }
}

@media (min-width: 1280px) {
  .cards-grid {
    grid-template-columns: repeat(5, 1fr);
  }

  .page-title {
    font-size: 32px;
  }

  .page-description {
    font-size: 16px;
  }

  .main-content {
    padding: 24px;
  }

  .header-content {
    padding: 24px;
  }
}

/* 卡片樣式 */
.card {
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  border: 1px solid #e9ecef;
  overflow: hidden;
  transition: all 0.2s;
  cursor: pointer;
}

.card:hover {
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
  transform: translateY(-2px);
}


.card-content {
  padding: 12px;
}

.card-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 10px;
  gap: 8px;
}

.card-title {
  font-size: 14px;
  font-weight: 700;
  color: #343a40;
  margin: 0;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-align: left;
  flex: 1;
}

/* 標籤 */
.tags-container {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 8px;
  justify-content: flex-start;
}

.tag {
  display: inline-flex;
  align-items: center;
  padding: 4px 10px;
  border-radius: 16px;
  font-size: 12px;
  font-weight: 600;
}

.tag-referral {
  background-color: #e7e3ff;
  color: #6f42c1;
}

.tag-once {
  background-color: #fff3cd;
  color: #856404;
}

/* 資訊區塊 */
.info-section {
  margin-bottom: 12px;
}

.meta-item {
  color: #6c757d;
}

.time-info {
  font-size: 12px;
  color: #adb5bd;
}

/* 按鈕 */
.detail-btn {
  padding: 4px 8px;
  background-color: #007bff;
  color: white;
  border: none;
  font-size: 11px;
  font-weight: 600;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
  flex-shrink: 0;
}

.detail-btn:hover {
  background-color: #0056b3;
  transform: scale(1.05);
}

/* 空狀態 */
.empty-state {
  text-align: center;
  padding: 48px 0;
}

.empty-icon {
  width: 48px;
  height: 48px;
  color: #adb5bd;
  margin: 0 auto 16px auto;
}

.empty-title {
  font-size: 16px;
  font-weight: 600;
  color: #343a40;
  margin: 0 0 8px 0;
}

.empty-description {
  font-size: 14px;
  color: #6c757d;
  margin: 0;
}

/* 骨架屏動畫效果 */
.skeleton {
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: skeleton-loading 1.5s infinite;
  border-radius: 4px;
}

@keyframes skeleton-loading {
  0% {
    background-position: 200% 0;
  }
  100% {
    background-position: -200% 0;
  }
}

.skeleton-card {
  pointer-events: none;
  cursor: default;
}

.skeleton-card:hover {
  transform: none;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

/* 骨架屏元素尺寸 */
.skeleton-title {
  height: 16px;
  width: 70%;
  margin-bottom: 4px;
}

.skeleton-btn {
  height: 20px;
  width: 40px;
  border-radius: 4px;
}

.skeleton-tag {
  height: 20px;
  width: 50px;
  border-radius: 16px;
}

.skeleton-tag-small {
  height: 20px;
  width: 35px;
  border-radius: 16px;
}

.skeleton-time {
  height: 12px;
  width: 60%;
}

/* 響應式骨架屏調整 */
@media (max-width: 639px) {
  .skeleton-title {
    width: 85%;
  }
  
  .skeleton-time {
    width: 75%;
  }
}

@media (min-width: 1024px) {
  .skeleton-title {
    width: 65%;
  }
  
  .skeleton-time {
    width: 55%;
  }
}
</style>