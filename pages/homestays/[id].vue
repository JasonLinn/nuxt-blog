<template>
  <div class="homestay-detail-page">
    <!-- 載入狀態 -->
    <div v-if="loading" class="loading">
      <div class="loading-spinner"></div>
      <p>正在載入民宿資料...</p>
    </div>

    <!-- 錯誤狀態 -->
    <div v-else-if="error" class="error">
      <h2>❌ 載入失敗</h2>
      <p>{{ error }}</p>
      <button @click="goBack" class="btn-back">返回列表</button>
    </div>

    <!-- 民宿詳情 -->
    <div v-else-if="homestay" class="homestay-detail">
      <!-- 頂部導航 -->
      <div class="header">
        <button @click="goBack" class="btn-back">
          ← 返回民宿列表
        </button>
        <div class="breadcrumb">
          <span>民宿列表</span> > <span class="current">{{ homestay.name }}</span>
        </div>
      </div>

      <!-- 民宿主要資訊 -->
      <div class="homestay-hero">
        <div class="hero-image">
          <img 
            :src="getMainImage()" 
            :alt="homestay.name" 
            class="main-image"
            @error="handleImageError"
          >
          <div v-if="homestay.is_featured" class="featured-badge">
            ⭐ 精選民宿
          </div>
        </div>
        
        <div class="hero-info">
          <h1 class="homestay-title">{{ homestay.name }}</h1>
          <div class="homestay-meta">
            <span class="location">📍 {{ homestay.area || homestay.location }}</span>
            <span v-if="homestay.rating" class="rating">⭐ {{ homestay.rating }} 分</span>
            <span v-if="homestay.total_reviews" class="reviews">({{ homestay.total_reviews }} 則評價)</span>
          </div>
          
          <!-- 快速聯絡 -->
          <div class="quick-contact" v-if="homestay.contact">
            <button 
              v-if="homestay.contact.phone" 
              @click="callHomestay" 
              class="btn-call"
            >
              📞 立即致電
            </button>
            <a 
              v-if="homestay.contact.website" 
              :href="homestay.contact.website" 
              target="_blank" 
              class="btn-website"
            >
              🌐 官方網站
            </a>
          </div>
        </div>
      </div>

      <!-- 主要內容區域 -->
      <div class="content-section">
        <div class="content-grid">
          <!-- 左側內容 -->
          <div class="content-left">
            <!-- 民宿介紹 -->
            <div class="info-card">
              <h3 class="card-title">🏠 民宿介紹</h3>
              <p class="description">
                {{ homestay.description || homestay.capacity_description || '這是一間舒適溫馨的民宿，提供賓至如歸的住宿體驗。' }}
              </p>
            </div>

            <!-- 特色標籤 -->
            <div class="info-card" v-if="hasFeatures">
              <h3 class="card-title">✨ 特色亮點</h3>
              <div class="features-grid">
                <!-- 適合對象 -->
                <div v-if="homestay.features?.peopleTypes" class="feature-group">
                  <h4>👥 適合對象</h4>
                  <div class="tags">
                    <span v-for="type in homestay.features.peopleTypes" :key="type" class="tag people-tag">
                      {{ type }}
                    </span>
                  </div>
                </div>
                
                <!-- 環境特色 -->
                <div v-if="homestay.features?.environmentTypes" class="feature-group">
                  <h4>🌿 環境特色</h4>
                  <div class="tags">
                    <span v-for="type in homestay.features.environmentTypes" :key="type" class="tag env-tag">
                      {{ type }}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <!-- 位置資訊 -->
            <div class="info-card" v-if="homestay.address">
              <h3 class="card-title">📍 位置資訊</h3>
              <p class="address">{{ homestay.address }}</p>
              <div class="location-note">
                <small>* 實際地址請聯絡民宿業者確認</small>
              </div>
            </div>
          </div>

          <!-- 右側側邊欄 -->
          <div class="content-right">
            <!-- 價格資訊 -->
            <div class="price-card">
              <h3 class="card-title">💰 價格資訊</h3>
              <div v-if="homestay.prices" class="price-list">
                <div v-if="homestay.prices.weekday" class="price-item">
                  <span class="price-label">平日住宿</span>
                  <span class="price-value">{{ homestay.prices.weekday }}</span>
                </div>
                <div v-if="homestay.prices.weekend" class="price-item">
                  <span class="price-label">假日住宿</span>
                  <span class="price-value">{{ homestay.prices.weekend }}</span>
                </div>
                <div v-if="homestay.prices.fullRentWeekday" class="price-item special">
                  <span class="price-label">平日包棟</span>
                  <span class="price-value">{{ homestay.prices.fullRentWeekday }}</span>
                </div>
                <div v-if="homestay.prices.fullRentWeekend" class="price-item special">
                  <span class="price-label">假日包棟</span>
                  <span class="price-value">{{ homestay.prices.fullRentWeekend }}</span>
                </div>
              </div>
              <div v-else class="no-price">
                <p>💬 價格請洽詢民宿業者</p>
              </div>
            </div>

            <!-- 聯絡資訊 -->
            <div class="contact-card" v-if="homestay.contact">
              <h3 class="card-title">📞 聯絡資訊</h3>
              <div class="contact-list">
                <div v-if="homestay.contact.phone" class="contact-item">
                  <div class="contact-label">電話</div>
                  <a :href="`tel:${homestay.contact.phone}`" class="contact-value">
                    {{ homestay.contact.phone }}
                  </a>
                </div>
                <div v-if="homestay.contact.website" class="contact-item">
                  <div class="contact-label">官網</div>
                  <a :href="homestay.contact.website" target="_blank" class="contact-value">
                    前往官方網站 ↗
                  </a>
                </div>
              </div>
            </div>

            <!-- 統計資訊 -->
            <div class="stats-card">
              <h3 class="card-title">📊 民宿資訊</h3>
              <div class="stats-list">
                <div class="stat-item">
                  <span class="stat-label">民宿編號</span>
                  <span class="stat-value">#{{ homestay.id }}</span>
                </div>
                <div v-if="homestay.view_count" class="stat-item">
                  <span class="stat-label">瀏覽次數</span>
                  <span class="stat-value">{{ homestay.view_count }} 次</span>
                </div>
                <div v-if="homestay.total_reviews" class="stat-item">
                  <span class="stat-label">評論數量</span>
                  <span class="stat-value">{{ homestay.total_reviews }} 則</span>
                </div>
                <div class="stat-item">
                  <span class="stat-label">最後更新</span>
                  <span class="stat-value">{{ formatDate(homestay.updated_at) }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 沒有找到民宿 -->
    <div v-else class="not-found">
      <div class="not-found-content">
        <h2>😕 找不到民宿</h2>
        <p>抱歉，無法找到您要查看的民宿資料。</p>
        <button @click="goBack" class="btn-back">返回民宿列表</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, navigateTo } from 'nuxt/app'

// 響應式資料
const route = useRoute()
const homestay = ref(null)
const loading = ref(true)
const error = ref(null)

// 計算屬性
const hasFeatures = computed(() => {
  return homestay.value?.features?.peopleTypes?.length > 0 || 
         homestay.value?.features?.environmentTypes?.length > 0
})

// 方法
const goBack = () => {
  navigateTo('/bnbs')
}

const callHomestay = () => {
  if (homestay.value?.contact?.phone) {
    window.location.href = `tel:${homestay.value.contact.phone}`
  }
}

const getMainImage = () => {
  if (homestay.value?.image_urls && homestay.value.image_urls.length > 0) {
    return homestay.value.image_urls[0]
  }
  return '/logo.png'
}

const handleImageError = (event) => {
  event.target.src = '/logo.png'
}

const formatDate = (dateString) => {
  if (!dateString) return '最近'
  try {
    return new Date(dateString).toLocaleDateString('zh-TW')
  } catch {
    return '最近'
  }
}

// 獲取民宿詳情
const fetchHomestayDetail = async () => {
  const id = route.params.id
  
  console.log('🏠 正在載入民宿詳情，ID:', id)
  
  if (!id) {
    error.value = '無效的民宿ID'
    loading.value = false
    return
  }

  try {
    loading.value = true
    error.value = null
    
    const response = await fetch(`/api/fetchBnbDetail?id=${id}`)
    
    if (!response.ok) {
      throw new Error(`網路錯誤 (${response.status})`)
    }
    
    const data = await response.json()
    console.log('📄 API 回應資料:', data)
    
    if (data.success && data.bnb) {
      homestay.value = data.bnb
      console.log('✅ 民宿資料載入成功:', homestay.value.name)
      
      // 設置頁面標題
      useHead({
        title: `${homestay.value.name} - 民宿詳情`
      })
    } else {
      throw new Error(data.error || '找不到民宿資料')
    }
    
  } catch (err) {
    console.error('❌ 載入民宿詳情失敗:', err)
    error.value = err.message || '載入失敗，請稍後再試'
  } finally {
    loading.value = false
  }
}

// 組件掛載
onMounted(() => {
  fetchHomestayDetail()
})

// SEO 設定
useHead({
  title: '民宿詳情',
  meta: [
    { name: 'description', content: '查看民宿詳細資訊，包含價格、聯絡方式和特色介紹' }
  ]
})
</script>

<style scoped>
.homestay-detail-page {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
  background-color: #f8f9fa;
  min-height: 100vh;
}

/* 載入狀態 */
.loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 50vh;
  text-align: center;
}

.loading-spinner {
  width: 50px;
  height: 50px;
  border: 4px solid #e9ecef;
  border-top: 4px solid #5db0be;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 20px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* 錯誤和找不到狀態 */
.error, .not-found {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 50vh;
}

.not-found-content {
  text-align: center;
  padding: 40px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

.error h2, .not-found h2 {
  font-size: 28px;
  margin-bottom: 16px;
  color: #e74c3c;
}

/* 按鈕樣式 */
.btn-back, .btn-call, .btn-website {
  padding: 12px 24px;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.btn-back {
  background-color: #6c757d;
  color: white;
}

.btn-back:hover {
  background-color: #5a6268;
  transform: translateY(-1px);
}

.btn-call {
  background-color: #28a745;
  color: white;
}

.btn-call:hover {
  background-color: #218838;
  transform: translateY(-1px);
}

.btn-website {
  background-color: #007bff;
  color: white;
}

.btn-website:hover {
  background-color: #0056b3;
  transform: translateY(-1px);
}

/* 頭部區域 */
.header {
  margin-bottom: 30px;
}

.breadcrumb {
  margin-top: 10px;
  font-size: 14px;
  color: #6c757d;
}

.breadcrumb .current {
  color: #5db0be;
  font-weight: 600;
}

/* 民宿主要資訊 */
.homestay-hero {
  background: white;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  margin-bottom: 30px;
}

.hero-image {
  position: relative;
  height: 400px;
  overflow: hidden;
}

.main-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.featured-badge {
  position: absolute;
  top: 20px;
  right: 20px;
  background: linear-gradient(135deg, #ff6b6b, #ee5a52);
  color: white;
  padding: 8px 16px;
  border-radius: 20px;
  font-size: 14px;
  font-weight: 600;
  box-shadow: 0 2px 10px rgba(238, 90, 82, 0.3);
}

.hero-info {
  padding: 30px;
}

.homestay-title {
  font-size: 36px;
  font-weight: 700;
  color: #2c3e50;
  margin: 0 0 16px 0;
  line-height: 1.2;
}

.homestay-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 20px;
  margin-bottom: 24px;
  font-size: 16px;
}

.location, .rating, .reviews {
  display: flex;
  align-items: center;
  gap: 6px;
  color: #6c757d;
}

.rating {
  color: #ff6b6b;
  font-weight: 600;
}

.quick-contact {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

/* 內容區域 */
.content-section {
  margin-top: 30px;
}

.content-grid {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 30px;
}

/* 資訊卡片 */
.info-card, .price-card, .contact-card, .stats-card {
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
  margin-bottom: 24px;
}

.card-title {
  font-size: 20px;
  font-weight: 700;
  color: #2c3e50;
  margin: 0 0 20px 0;
  display: flex;
  align-items: center;
  gap: 8px;
}

.description {
  font-size: 16px;
  line-height: 1.7;
  color: #555;
  margin: 0;
}

/* 特色功能 */
.features-grid {
  display: grid;
  gap: 20px;
}

.feature-group h4 {
  font-size: 16px;
  font-weight: 600;
  color: #495057;
  margin: 0 0 12px 0;
}

.tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.tag {
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 13px;
  font-weight: 500;
}

.people-tag {
  background-color: rgba(255, 146, 70, 0.1);
  color: #ff9246;
  border: 1px solid rgba(255, 146, 70, 0.2);
}

.env-tag {
  background-color: rgba(93, 176, 190, 0.1);
  color: #5db0be;
  border: 1px solid rgba(93, 176, 190, 0.2);
}

/* 位置資訊 */
.address {
  font-size: 16px;
  color: #495057;
  margin: 0 0 12px 0;
}

.location-note {
  color: #6c757d;
  font-style: italic;
}

/* 價格卡片 */
.price-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.price-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 0;
  border-bottom: 1px solid #f8f9fa;
}

.price-item.special {
  background-color: #f8f9fa;
  margin: 0 -12px;
  padding: 12px;
  border-radius: 8px;
  border: none;
}

.price-label {
  font-size: 14px;
  color: #6c757d;
}

.price-value {
  font-size: 16px;
  font-weight: 700;
  color: #e74c3c;
}

.no-price {
  text-align: center;
  padding: 20px;
  color: #6c757d;
}

/* 聯絡資訊 */
.contact-list, .stats-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.contact-item, .stat-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
}

.contact-label, .stat-label {
  font-size: 14px;
  color: #6c757d;
  font-weight: 500;
}

.contact-value, .stat-value {
  font-size: 14px;
  color: #495057;
  font-weight: 600;
}

.contact-value {
  color: #5db0be;
  text-decoration: none;
}

.contact-value:hover {
  text-decoration: underline;
}

/* 響應式設計 */
@media (max-width: 768px) {
  .homestay-detail-page {
    padding: 16px;
  }
  
  .content-grid {
    grid-template-columns: 1fr;
  }
  
  .hero-image {
    height: 250px;
  }
  
  .homestay-title {
    font-size: 28px;
  }
  
  .homestay-meta {
    flex-direction: column;
    gap: 8px;
  }
  
  .quick-contact {
    flex-direction: column;
  }
  
  .btn-call, .btn-website {
    justify-content: center;
  }
}

@media (max-width: 480px) {
  .hero-info {
    padding: 20px;
  }
  
  .info-card, .price-card, .contact-card, .stats-card {
    padding: 20px;
  }
  
  .homestay-title {
    font-size: 24px;
  }
}
</style>
</code_block_to_apply_changes_from>
</rewritten_file>