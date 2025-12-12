<template>
  <div>
    <AdminHeader />
    
    <div class="coupon-review-container">
      <div class="header-section">
        <h2>優惠券審核管理</h2>
        <div class="filter-dropdown">
          <button class="filter-btn" @click="toggleDropdown">
            狀態篩選: {{ statusFilterText }}
            <span class="dropdown-arrow">▼</span>
          </button>
          <div class="dropdown-menu" v-show="dropdownOpen">
            <a @click="filterByStatus('all')">全部</a>
            <a @click="filterByStatus('pending')">待審核</a>
            <a @click="filterByStatus('approved')">已核准</a>
            <a @click="filterByStatus('rejected')">已拒絕</a>
          </div>
        </div>
      </div>

      <!-- 載入狀態 -->
      <div v-if="loading" class="loading-section">
        <div class="loading-spinner"></div>
        <p>載入中...</p>
      </div>

      <!-- 無資料狀態 -->
      <div v-else-if="filteredCoupons.length === 0" class="empty-section">
        <div class="empty-icon">📭</div>
        <p>目前沒有需要審核的優惠券</p>
      </div>

      <!-- 優惠券列表 -->
      <div v-else class="coupons-grid">
        <div 
          v-for="coupon in filteredCoupons" 
          :key="coupon.id" 
          class="coupon-card"
        >
          <!-- 狀態標籤 -->
          <div class="status-badge" :class="getStatusBadgeClass(coupon.status)">
            {{ getStatusText(coupon.status) }}
          </div>
          
          <!-- 封面圖片 -->
          <div class="image-section">
            <img 
              v-if="coupon.cover && coupon.cover.length > 0" 
              :src="coupon.cover[0]" 
              :alt="coupon.title"
            >
            <img 
              v-else-if="coupon.cover_image" 
              :src="coupon.cover_image" 
              :alt="coupon.title"
            >
            <div v-else class="placeholder-image">
              🖼️
            </div>
          </div>

          <div class="card-content">
            <h3>{{ coupon.title }}</h3>
            <p class="business-name">🏪 {{ coupon.business_name }}</p>
            <p class="description">{{ truncateText(coupon.content, 80) }}</p>
            
            <!-- 優惠詳情 -->
            <div class="coupon-details">
              <span class="discount-badge">
                {{ coupon.discount_type === 'percentage' ? `${coupon.discount_value}% 折扣` : `NT$${coupon.discount_value} 折扣` }}
              </span>
              <span class="date-text">
                {{ formatDate(coupon.created_at) }}
              </span>
            </div>
            
            <!-- 聯絡資訊 -->
            <div class="contact-info">
              <div>👤 {{ coupon.submitter_name }}</div>
              <div>📞 {{ coupon.submitter_phone }}</div>
              <div v-if="coupon.submitter_email">
                ✉️ {{ coupon.submitter_email }}
              </div>
            </div>

            <!-- 操作按鈕 -->
            <div class="action-buttons" v-if="coupon.status === 'pending'">
              <button 
                class="approve-btn"
                @click="reviewCoupon(coupon.id, 'approved')"
                :disabled="reviewingIds.includes(coupon.id)"
              >
                <span v-if="reviewingIds.includes(coupon.id)" class="spinner"></span>
                核准
              </button>
              <button 
                class="reject-btn"
                @click="reviewCoupon(coupon.id, 'rejected')"
                :disabled="reviewingIds.includes(coupon.id)"
              >
                拒絕
              </button>
              <button 
                class="detail-btn"
                @click="viewDetails(coupon)"
              >
                詳細
              </button>
            </div>
            
            <div v-else class="action-buttons">
              <button 
                class="detail-btn"
                @click="viewDetails(coupon)"
              >
                查看詳細
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 詳細資訊模態框 -->
    <div class="modal-overlay" v-show="showModal" @click="closeModal">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3>優惠券詳細資訊</h3>
          <button class="close-btn" @click="closeModal">✕</button>
        </div>
        <div class="modal-body" v-if="selectedCoupon">
          <div class="modal-grid">
            <div class="modal-image">
              <img 
                v-if="selectedCoupon.cover && selectedCoupon.cover.length > 0" 
                :src="selectedCoupon.cover[0]" 
                :alt="selectedCoupon.title"
              >
              <img 
                v-else-if="selectedCoupon.cover_image" 
                :src="selectedCoupon.cover_image" 
                :alt="selectedCoupon.title"
              >
              <div v-else class="placeholder-image">🖼️</div>
            </div>
            <div class="modal-details">
              <h4>{{ selectedCoupon.title }}</h4>
              <p class="business-name">{{ selectedCoupon.business_name }}</p>
              
              <div class="detail-section">
                <strong>優惠內容：</strong>
                <p>{{ selectedCoupon.content }}</p>
              </div>

              <div class="detail-row">
                <div>
                  <strong>優惠類型：</strong>
                  <span class="discount-badge">
                    {{ selectedCoupon.discount_type === 'percentage' ? '百分比折扣' : '固定金額折扣' }}
                  </span>
                </div>
                <div>
                  <strong>優惠值：</strong>
                  {{ selectedCoupon.discount_type === 'percentage' ? `${selectedCoupon.discount_value}%` : `NT$${selectedCoupon.discount_value}` }}
                </div>
              </div>

              <div class="detail-section">
                <strong>商家資訊：</strong>
                <div class="info-list">
                  <div v-if="selectedCoupon.category">類別：{{ selectedCoupon.category }}</div>
                  <div v-if="selectedCoupon.township">
                    鄉鎮：{{ Array.isArray(selectedCoupon.township) ? selectedCoupon.township.join(', ') : selectedCoupon.township }}
                  </div>
                  <div v-if="selectedCoupon.adress">
                    地址：{{ Array.isArray(selectedCoupon.adress) ? selectedCoupon.adress.join(', ') : selectedCoupon.adress || selectedCoupon.address }}
                  </div>
                  <div v-else-if="selectedCoupon.address">地址：{{ selectedCoupon.address }}</div>
                  <div v-if="selectedCoupon.phone">電話：{{ selectedCoupon.phone }}</div>
                  <div v-if="selectedCoupon.website">網站：<a :href="selectedCoupon.website" target="_blank">{{ selectedCoupon.website }}</a></div>
                </div>
              </div>

              <div class="detail-section">
                <strong>提交者資訊：</strong>
                <div class="info-list">
                  <div>姓名：{{ selectedCoupon.submitter_name }}</div>
                  <div>電話：{{ selectedCoupon.submitter_phone }}</div>
                  <div v-if="selectedCoupon.submitter_email">Email：{{ selectedCoupon.submitter_email }}</div>
                </div>
              </div>

              <div class="detail-section">
                <div class="date-info">
                  <div>提交時間：{{ formatDate(selectedCoupon.created_at) }}</div>
                  <div v-if="selectedCoupon.updated_at !== selectedCoupon.created_at">
                    更新時間：{{ formatDate(selectedCoupon.updated_at) }}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div v-if="selectedCoupon.usage_notes" class="usage-notes">
            <strong>使用說明：</strong>
            <p>{{ selectedCoupon.usage_notes }}</p>
          </div>
        </div>
        <div class="modal-footer" v-if="selectedCoupon && selectedCoupon.status === 'pending'">
          <button 
            class="approve-btn"
            @click="reviewCoupon(selectedCoupon.id, 'approved')"
            :disabled="reviewingIds.includes(selectedCoupon.id)"
          >
            <span v-if="reviewingIds.includes(selectedCoupon.id)" class="spinner"></span>
            核准此優惠券
          </button>
          <button 
            class="reject-btn"
            @click="reviewCoupon(selectedCoupon.id, 'rejected')"
            :disabled="reviewingIds.includes(selectedCoupon.id)"
          >
            拒絕此優惠券
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import AdminHeader from '~/components/AdminHeader.vue'

// 響應式資料
const loading = ref(true)
const coupons = ref([])
const selectedCoupon = ref(null)
const statusFilter = ref('all')
const reviewingIds = ref([])
const showModal = ref(false)
const dropdownOpen = ref(false)

// 計算屬性
const statusFilterText = computed(() => {
  const map = {
    'all': '全部',
    'pending': '待審核',
    'approved': '已核准', 
    'rejected': '已拒絕'
  }
  return map[statusFilter.value] || '全部'
})

const filteredCoupons = computed(() => {
  if (statusFilter.value === 'all') {
    return coupons.value
  }
  return coupons.value.filter(coupon => coupon.status === statusFilter.value)
})

// 方法
const loadCoupons = async () => {
  try {
    loading.value = true
    const { data } = await $fetch('/api/coupons/review')
    coupons.value = data || []
  } catch (error) {
    console.error('載入優惠券失敗:', error)
    alert('載入優惠券失敗')
  } finally {
    loading.value = false
  }
}

const reviewCoupon = async (couponId, status) => {
  try {
    reviewingIds.value.push(couponId)
    
    const { data } = await $fetch('/api/coupons/review', {
      method: 'POST',
      body: { id: couponId, status }
    })

    // 更新本地資料
    const couponIndex = coupons.value.findIndex(c => c.id === couponId)
    if (couponIndex !== -1) {
      coupons.value[couponIndex].status = status
      coupons.value[couponIndex].updated_at = new Date().toISOString()
    }

    // 關閉模態框
    closeModal()

    const statusText = status === 'approved' ? '核准' : '拒絕'
    alert(`優惠券${statusText}成功`)

  } catch (error) {
    console.error('審核失敗:', error)
    alert('審核失敗，請稍後再試')
  } finally {
    reviewingIds.value = reviewingIds.value.filter(id => id !== couponId)
  }
}

const viewDetails = (coupon) => {
  selectedCoupon.value = coupon
  showModal.value = true
  dropdownOpen.value = false
}

const closeModal = () => {
  showModal.value = false
  selectedCoupon.value = null
}

const toggleDropdown = () => {
  dropdownOpen.value = !dropdownOpen.value
}

const filterByStatus = (status) => {
  statusFilter.value = status
  dropdownOpen.value = false
}

const getStatusBadgeClass = (status) => {
  const classes = {
    'pending': 'status-pending',
    'approved': 'status-approved',
    'rejected': 'status-rejected'
  }
  return classes[status] || 'status-default'
}

const getStatusText = (status) => {
  const texts = {
    'pending': '待審核',
    'approved': '已核准',
    'rejected': '已拒絕'
  }
  return texts[status] || status
}

const truncateText = (text, maxLength) => {
  if (!text) return ''
  return text.length > maxLength ? text.substring(0, maxLength) + '...' : text
}

const formatDate = (dateString) => {
  if (!dateString) return ''
  return new Date(dateString).toLocaleDateString('zh-TW', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

// 關閉下拉選單當點擊外部
const handleClickOutside = (event) => {
  if (!event.target.closest('.filter-dropdown')) {
    dropdownOpen.value = false
  }
}

// 生命週期
onMounted(() => {
  loadCoupons()
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})

// SEO
definePageMeta({
  middleware: 'admin-auth'
})

useHead({
  title: '優惠券審核管理 - 管理後台'
})
</script>

<style lang="scss" scoped>
.coupon-review-container {
  max-width: 1400px;
  margin: 0 auto;
  padding: 24px;
  
  .header-section {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 32px;
    
    h2 {
      margin: 0;
      color: #1f2937;
      font-size: 28px;
      font-weight: 700;
    }
    
    .filter-dropdown {
      position: relative;
      
      .filter-btn {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        border: none;
        padding: 10px 16px;
        border-radius: 8px;
        cursor: pointer;
        font-weight: 500;
        display: flex;
        align-items: center;
        gap: 8px;
        transition: all 0.3s ease;
        
        &:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
        }
        
        .dropdown-arrow {
          transition: transform 0.3s ease;
          font-size: 12px;
        }
      }
      
      .dropdown-menu {
        position: absolute;
        top: 100%;
        right: 0;
        background: white;
        border-radius: 8px;
        box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
        padding: 8px 0;
        min-width: 150px;
        z-index: 1000;
        
        a {
          display: block;
          padding: 10px 16px;
          color: #374151;
          text-decoration: none;
          cursor: pointer;
          transition: background-color 0.2s ease;
          
          &:hover {
            background-color: #f3f4f6;
            color: #1f2937;
          }
        }
      }
    }
  }
  
  .loading-section {
    text-align: center;
    padding: 80px 20px;
    
    .loading-spinner {
      width: 40px;
      height: 40px;
      border: 4px solid #f3f4f6;
      border-top: 4px solid #667eea;
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin: 0 auto 16px;
    }
    
    p {
      color: #6b7280;
      font-size: 16px;
    }
  }
  
  .empty-section {
    text-align: center;
    padding: 80px 20px;
    
    .empty-icon {
      font-size: 64px;
      margin-bottom: 16px;
    }
    
    p {
      color: #6b7280;
      font-size: 18px;
    }
  }
  
  .coupons-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
    gap: 24px;
    
    .coupon-card {
      background: white;
      border-radius: 12px;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
      overflow: hidden;
      transition: all 0.3s ease;
      position: relative;
      
      &:hover {
        transform: translateY(-4px);
        box-shadow: 0 12px 25px -5px rgba(0, 0, 0, 0.15);
      }
      
      .status-badge {
        position: absolute;
        top: 12px;
        right: 12px;
        padding: 4px 12px;
        border-radius: 20px;
        font-size: 12px;
        font-weight: 600;
        z-index: 10;
        
        &.status-pending {
          background-color: #fbbf24;
          color: #92400e;
        }
        
        &.status-approved {
          background-color: #10b981;
          color: white;
        }
        
        &.status-rejected {
          background-color: #ef4444;
          color: white;
        }
      }
      
      .image-section {
        height: 200px;
        overflow: hidden;
        
        img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        
        .placeholder-image {
          width: 100%;
          height: 100%;
          background-color: #f3f4f6;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 48px;
          color: #9ca3af;
        }
      }
      
      .card-content {
        padding: 20px;
        
        h3 {
          margin: 0 0 8px 0;
          font-size: 18px;
          font-weight: 600;
          color: #1f2937;
          line-height: 1.4;
        }
        
        .business-name {
          color: #6b7280;
          font-size: 14px;
          margin: 0 0 12px 0;
        }
        
        .description {
          color: #374151;
          font-size: 14px;
          line-height: 1.5;
          margin-bottom: 16px;
        }
        
        .coupon-details {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
          
          .discount-badge {
            background: linear-gradient(135deg, #3b82f6 0%, #1e40af 100%);
            color: white;
            padding: 4px 12px;
            border-radius: 16px;
            font-size: 12px;
            font-weight: 600;
          }
          
          .date-text {
            color: #6b7280;
            font-size: 12px;
          }
        }
        
        .contact-info {
          background-color: #f9fafb;
          padding: 12px;
          border-radius: 8px;
          margin-bottom: 16px;
          
          div {
            font-size: 13px;
            color: #374151;
            margin-bottom: 4px;
            
            &:last-child {
              margin-bottom: 0;
            }
          }
        }
        
        .action-buttons {
          display: flex;
          gap: 8px;
          
          button {
            flex: 1;
            padding: 8px 12px;
            border: none;
            border-radius: 6px;
            font-size: 14px;
            font-weight: 500;
            cursor: pointer;
            transition: all 0.2s ease;
            position: relative;
            
            &:disabled {
              opacity: 0.6;
              cursor: not-allowed;
            }
            
            .spinner {
              display: inline-block;
              width: 14px;
              height: 14px;
              border: 2px solid currentColor;
              border-top: 2px solid transparent;
              border-radius: 50%;
              animation: spin 1s linear infinite;
              margin-right: 4px;
            }
          }
          
          .approve-btn {
            background-color: #10b981;
            color: white;
            
            &:hover:not(:disabled) {
              background-color: #059669;
            }
          }
          
          .reject-btn {
            background-color: #ef4444;
            color: white;
            
            &:hover:not(:disabled) {
              background-color: #dc2626;
            }
          }
          
          .detail-btn {
            background-color: #f3f4f6;
            color: #374151;
            
            &:hover {
              background-color: #e5e7eb;
            }
          }
        }
      }
    }
  }
}

// 模態框樣式
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
  
  .modal-content {
    background: white;
    border-radius: 12px;
    max-width: 800px;
    width: 100%;
    max-height: 90vh;
    overflow-y: auto;
    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
    
    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 24px 24px 0 24px;
      
      h3 {
        margin: 0;
        font-size: 20px;
        font-weight: 600;
        color: #1f2937;
      }
      
      .close-btn {
        background: none;
        border: none;
        font-size: 24px;
        cursor: pointer;
        color: #6b7280;
        
        &:hover {
          color: #374151;
        }
      }
    }
    
    .modal-body {
      padding: 24px;
      
      .modal-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 24px;
        margin-bottom: 24px;
        
        .modal-image {
          img {
            width: 100%;
            border-radius: 8px;
          }
          
          .placeholder-image {
            width: 100%;
            height: 250px;
            background-color: #f3f4f6;
            border-radius: 8px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 48px;
            color: #9ca3af;
          }
        }
        
        .modal-details {
          h4 {
            margin: 0 0 8px 0;
            font-size: 20px;
            font-weight: 600;
            color: #1f2937;
          }
          
          .business-name {
            color: #6b7280;
            margin-bottom: 16px;
          }
          
          .detail-section {
            margin-bottom: 16px;
            
            strong {
              color: #374151;
              font-weight: 600;
            }
            
            p {
              margin: 8px 0 0 0;
              color: #374151;
              line-height: 1.5;
            }
          }
          
          .detail-row {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 16px;
            margin-bottom: 16px;
          }
          
          .info-list {
            margin-top: 8px;
            
            div {
              margin-bottom: 4px;
              color: #374151;
              font-size: 14px;
              
              a {
                color: #3b82f6;
                text-decoration: none;
                
                &:hover {
                  text-decoration: underline;
                }
              }
            }
          }
          
          .date-info {
            margin-top: 8px;
            
            div {
              font-size: 13px;
              color: #6b7280;
              margin-bottom: 4px;
            }
          }
          
          .discount-badge {
            background: linear-gradient(135deg, #3b82f6 0%, #1e40af 100%);
            color: white;
            padding: 4px 12px;
            border-radius: 16px;
            font-size: 12px;
            font-weight: 600;
            margin-left: 8px;
          }
        }
      }
      
      .usage-notes {
        border-top: 1px solid #e5e7eb;
        padding-top: 16px;
        
        strong {
          color: #374151;
          font-weight: 600;
        }
        
        p {
          margin: 8px 0 0 0;
          color: #374151;
          line-height: 1.5;
        }
      }
    }
    
    .modal-footer {
      border-top: 1px solid #e5e7eb;
      padding: 16px 24px;
      display: flex;
      gap: 12px;
      justify-content: flex-end;
      
      button {
        padding: 10px 20px;
        border: none;
        border-radius: 6px;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.2s ease;
        
        &.approve-btn {
          background-color: #10b981;
          color: white;
          
          &:hover:not(:disabled) {
            background-color: #059669;
          }
        }
        
        &.reject-btn {
          background-color: #ef4444;
          color: white;
          
          &:hover:not(:disabled) {
            background-color: #dc2626;
          }
        }
        
        &:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
        
        .spinner {
          display: inline-block;
          width: 14px;
          height: 14px;
          border: 2px solid currentColor;
          border-top: 2px solid transparent;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin-right: 4px;
        }
      }
    }
  }
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

// 響應式設計
@media (max-width: 768px) {
  .coupon-review-container {
    padding: 16px;
    
    .header-section {
      flex-direction: column;
      gap: 16px;
      align-items: flex-start;
      
      h2 {
        font-size: 24px;
      }
    }
    
    .coupons-grid {
      grid-template-columns: 1fr;
      gap: 16px;
    }
  }
  
  .modal-overlay {
    padding: 10px;
    
    .modal-content {
      .modal-body {
        padding: 16px;
        
        .modal-grid {
          grid-template-columns: 1fr;
          gap: 16px;
        }
      }
      
      .modal-footer {
        padding: 12px 16px;
        flex-direction: column;
        
        button {
          width: 100%;
        }
      }
    }
  }
}

@media (max-width: 480px) {
  .coupon-review-container {
    .coupons-grid {
      .coupon-card {
        .card-content {
          .action-buttons {
            flex-direction: column;
            
            button {
              width: 100%;
            }
          }
        }
      }
    }
  }
}
</style>