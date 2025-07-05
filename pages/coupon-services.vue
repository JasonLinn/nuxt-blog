<template>
  <div class="coupon-services-container">
    <div class="page-header">
      <h1>優惠券/代訂服務列表</h1>
    </div>
    
    <div class="service-section">
      <div class="section-header">
        <h2>優惠券服務</h2>
        <a :href="liffUrls.coupon" class="liff-link" target="_blank">
          <span>前往 LINE 服務</span>
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-box-arrow-up-right" viewBox="0 0 16 16">
            <path fill-rule="evenodd" d="M8.636 3.5a.5.5 0 0 0-.5-.5H1.5A1.5 1.5 0 0 0 0 4.5v10A1.5 1.5 0 0 0 1.5 16h10a1.5 1.5 0 0 0 1.5-1.5V7.864a.5.5 0 0 0-1 0V14.5a.5.5 0 0 1-.5.5h-10a.5.5 0 0 1-.5-.5v-10a.5.5 0 0 1 .5-.5h6.636a.5.5 0 0 0 .5-.5"/>
            <path fill-rule="evenodd" d="M16 .5a.5.5 0 0 0-.5-.5h-5a.5.5 0 0 0 0 1h3.793L6.146 9.146a.5.5 0 1 0 .708.708L15 1.707V5.5a.5.5 0 0 0 1 0z"/>
          </svg>
        </a>
      </div>
      
      <div class="service-list">
        <div v-if="loading" class="loading-container">
          <Icon class="loading-icon" name="eos-icons:loading" />
          <p>載入中...</p>
        </div>
        <div v-else-if="error" class="error-container">
          <p>發生錯誤，請稍後再試</p>
        </div>
        <div v-else-if="couponData && couponData.length > 0" class="coupon-grid">
          <div v-for="coupon in couponData" :key="coupon.id" class="coupon-card" @click="navigateToCoupon(coupon.id)">
            <div class="coupon-image">
              <img :src="coupon.cover[0]" alt="優惠券圖片" />
            </div>
            <div class="coupon-info">
              <h3>{{ coupon.title }}</h3>
              <p class="coupon-description">{{ truncateText(coupon.content, 50) }}</p>
              <div class="coupon-location">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-geo-alt-fill" viewBox="0 0 16 16">
                  <path d="M8 16s6-5.686 6-10A6 6 0 0 0 2 6c0 4.314 6 10 6 10m0-7a3 3 0 1 1 0-6 3 3 0 0 1 0 6"/>
                </svg>
                <span>{{ coupon.adress[0] }}</span>
              </div>
            </div>
          </div>
        </div>
        <div v-else class="empty-container">
          <p>目前沒有可用的優惠券</p>
        </div>
      </div>
    </div>
    
    <div class="service-section">
      <div class="section-header">
        <h2>代訂服務</h2>
        <a :href="liffUrls.booking" class="liff-link" target="_blank">
          <span>前往 LINE 服務</span>
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-box-arrow-up-right" viewBox="0 0 16 16">
            <path fill-rule="evenodd" d="M8.636 3.5a.5.5 0 0 0-.5-.5H1.5A1.5 1.5 0 0 0 0 4.5v10A1.5 1.5 0 0 0 1.5 16h10a1.5 1.5 0 0 0 1.5-1.5V7.864a.5.5 0 0 0-1 0V14.5a.5.5 0 0 1-.5.5h-10a.5.5 0 0 1-.5-.5v-10a.5.5 0 0 1 .5-.5h6.636a.5.5 0 0 0 .5-.5"/>
            <path fill-rule="evenodd" d="M16 .5a.5.5 0 0 0-.5-.5h-5a.5.5 0 0 0 0 1h3.793L6.146 9.146a.5.5 0 1 0 .708.708L15 1.707V5.5a.5.5 0 0 0 1 0z"/>
          </svg>
        </a>
      </div>
      
      <div class="service-list">
        <div v-if="loadingBooking" class="loading-container">
          <Icon class="loading-icon" name="eos-icons:loading" />
          <p>載入中...</p>
        </div>
        <div v-else-if="errorBooking" class="error-container">
          <p>發生錯誤，請稍後再試</p>
        </div>
        <div v-else-if="bookingData && bookingData.length > 0" class="coupon-grid">
          <div v-for="booking in bookingData" :key="booking.id" class="coupon-card" @click="navigateToBooking(booking.id)">
            <div class="coupon-image">
              <img :src="booking.cover[0]" alt="代訂服務圖片" />
            </div>
            <div class="coupon-info">
              <h3>{{ booking.title }}</h3>
              <p class="coupon-description">{{ truncateText(booking.content, 50) }}</p>
              <div class="coupon-location">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-geo-alt-fill" viewBox="0 0 16 16">
                  <path d="M8 16s6-5.686 6-10A6 6 0 0 0 2 6c0 4.314 6 10 6 10m0-7a3 3 0 1 1 0-6 3 3 0 0 1 0 6"/>
                </svg>
                <span>{{ booking.adress[0] }}</span>
              </div>
            </div>
          </div>
        </div>
        <div v-else class="empty-container">
          <p>目前沒有可用的代訂服務</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import useCouponStore from '~/store/coupon';

const router = useRouter();
const couponStore = useCouponStore();

// 數據狀態
const couponData = ref([]);
const bookingData = ref([]);
const loading = ref(true);
const loadingBooking = ref(true);
const error = ref(null);
const errorBooking = ref(null);

// LIFF 連結
const liffUrls = {
  coupon: 'https://liff.line.me/2005661804-zld9QenV',
  booking: 'https://liff.line.me/2005661804-9KNJXMpB'
};

// 獲取優惠券數據
const fetchCouponData = async () => {
  loading.value = true;
  try {
    await couponStore.fetchAndSetCoupon({
      selectedCate: '優惠券',
      pageSize: 10
    });
    
    if (couponStore.couponData.error) {
      error.value = couponStore.couponData.error.value;
    } else {
      couponData.value = couponStore.couponData.data.value;
    }
  } catch (err) {
    error.value = err.message || '獲取優惠券數據時發生錯誤';
  } finally {
    loading.value = false;
  }
};

// 獲取代訂服務數據
const fetchBookingData = async () => {
  loadingBooking.value = true;
  try {
    // 使用臨時 store 實例來獲取代訂服務數據，避免覆蓋優惠券數據
    const tempStore = useCouponStore();
    await tempStore.fetchAndSetCoupon({
      selectedCate: '代訂服務',
      pageSize: 10
    });
    
    if (tempStore.couponData.error) {
      errorBooking.value = tempStore.couponData.error.value;
    } else {
      bookingData.value = tempStore.couponData.data.value;
    }
  } catch (err) {
    errorBooking.value = err.message || '獲取代訂服務數據時發生錯誤';
  } finally {
    loadingBooking.value = false;
  }
};

// 截斷文本
const truncateText = (text, maxLength) => {
  if (!text) return '';
  return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
};

// 導航到優惠券詳情頁
const navigateToCoupon = (id) => {
  router.push(`/articles/${id}`);
};

// 導航到代訂服務詳情頁
const navigateToBooking = (id) => {
  router.push(`/articles/${id}`);
};

// 頁面加載時獲取數據
onMounted(() => {
  fetchCouponData();
  fetchBookingData();
});
</script>

<style scoped>
.coupon-services-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.page-header {
  margin-bottom: 30px;
  text-align: center;
}

.page-header h1 {
  font-size: 24px;
  font-weight: bold;
  color: #333;
}

.service-section {
  margin-bottom: 40px;
  background-color: #fff;
  border-radius: 10px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px 20px;
  background-color: #f8f9fa;
  border-bottom: 1px solid #eee;
}

.section-header h2 {
  font-size: 18px;
  font-weight: bold;
  color: #333;
  margin: 0;
}

.liff-link {
  display: flex;
  align-items: center;
  gap: 5px;
  color: #06c755; /* LINE 綠色 */
  text-decoration: none;
  font-size: 14px;
  padding: 5px 10px;
  border-radius: 5px;
  transition: background-color 0.3s;
}

.liff-link:hover {
  background-color: rgba(6, 199, 85, 0.1);
}

.service-list {
  padding: 20px;
}

.loading-container, .error-container, .empty-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 200px;
  color: #666;
}

.loading-icon {
  font-size: 32px;
  margin-bottom: 10px;
  animation: spin 1s infinite linear;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.coupon-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 20px;
}

.coupon-card {
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition: transform 0.3s, box-shadow 0.3s;
  cursor: pointer;
  background-color: #fff;
}

.coupon-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.15);
}

.coupon-image {
  height: 160px;
  overflow: hidden;
}

.coupon-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.3s;
}

.coupon-card:hover .coupon-image img {
  transform: scale(1.05);
}

.coupon-info {
  padding: 15px;
}

.coupon-info h3 {
  font-size: 16px;
  font-weight: bold;
  margin: 0 0 10px 0;
  color: #333;
}

.coupon-description {
  font-size: 14px;
  color: #666;
  margin-bottom: 10px;
  line-height: 1.4;
}

.coupon-location {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 12px;
  color: #888;
}

/* 響應式調整 */
@media (max-width: 768px) {
  .coupon-grid {
    grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  }
}

@media (max-width: 480px) {
  .coupon-grid {
    grid-template-columns: 1fr;
  }
  
  .coupon-image {
    height: 180px;
  }
}
</style> 