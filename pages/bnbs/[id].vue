<template>
  <div class="container bnb-detail">
    <div v-if="loading" class="loading">
      <Icon class="h-6 w-6 text-gray-500" name="eos-icons:loading" />
    </div>
    <div v-else-if="error" class="error">
      <p class="text-gray-500">發生了一點錯誤，請稍後再嘗試</p>
      <p class="text-rose-500">{{ error }}</p>
    </div>
    <div v-else-if="!bnb" class="not-found">
      <p class="text-gray-500">找不到此民宿資訊</p>
    </div>
    <template v-else>
      <div class="back-btn">
        <NuxtLink to="/bnbs" class="back-link">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" class="bi bi-arrow-left" viewBox="0 0 16 16">
            <path fill-rule="evenodd" d="M15 8a.5.5 0 0 0-.5-.5H2.707l3.147-3.146a.5.5 0 1 0-.708-.708l-4 4a.5.5 0 0 0 0 .708l4 4a.5.5 0 0 0 .708-.708L2.707 8.5H14.5A.5.5 0 0 0 15 8"/>
          </svg>
          返回列表
        </NuxtLink>
        
        <div class="owner-actions">
          <span class="owner-hint">是 {{ bnb.name }} 的業者嗎？</span>
          <NuxtLink to="/homestay-login" class="owner-login-btn">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
              <path d="M8 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6m2-3a2 2 0 1 1-4 0 2 2 0 0 1 4 0m4 8c0 1-1 1-1 1H3s-1 0-1-1 1-4 6-4 6 3 6 4m-1-.004c-.001-.246-.154-.986-.832-1.664C11.516 10.68 10.289 10 8 10s-3.516.68-4.168 1.332c-.678.678-.83 1.418-.832 1.664z"/>
            </svg>
            登入管理
          </NuxtLink>
        </div>
      </div>
      
      <div class="bnb-header">
        <div class="bnb-info-header">
          <h1 class="bnb-title">{{ bnb.name }}</h1>
          <div class="bnb-tags">
            <span class="bnb-tag">{{ bnb.area }}</span>
            <span class="bnb-tag address" v-if="bnb.address">{{ bnb.address }}</span>
          </div>
        </div>
        <div class="bnb-image" v-if="bnb.image_urls && bnb.image_urls.length > 0">
          <img :src="bnb.image_urls[0]" :alt="bnb.name" class="detail-img" />
        </div>
      </div>

      <div class="bnb-content">
        <div class="info-section" v-if="bnb.description">
          <h2 class="section-title">民宿介紹</h2>
          <p class="description">{{ bnb.description }}</p>
        </div>

        <div class="info-section">
          <h2 class="section-title">適合人數</h2>
          <div v-if="bnb.features && bnb.features.peopleTypes && bnb.features.peopleTypes.length > 0" class="people-types">
            <div v-for="(type, index) in bnb.features.peopleTypes" :key="index" class="people-type">
              <span class="type-label">{{ type }}</span>
            </div>
          </div>
          <div v-else class="no-data">
            <p>暫無人數資訊</p>
          </div>
        </div>

        <div class="info-section">
          <h2 class="section-title">環境特色</h2>
          <div v-if="bnb.features && bnb.features.environmentTypes && bnb.features.environmentTypes.length > 0" class="environment-types">
            <div v-for="(type, index) in bnb.features.environmentTypes" :key="index" class="environment-type">
              <span class="type-label">{{ type }}</span>
            </div>
          </div>
          <div v-else class="no-data">
            <p>暫無環境特色資訊</p>
          </div>
        </div>

        <div class="info-section">
          <h2 class="section-title">價格資訊</h2>
          <div class="prices" v-if="bnb.prices">
            <div class="price-row" v-if="bnb.prices.weekday">
              <span class="price-key">平日價格</span>
              <span class="price-value">{{ bnb.prices.weekday }}</span>
            </div>
            <div class="price-row" v-if="bnb.prices.weekend">
              <span class="price-key">假日價格</span>
              <span class="price-value">{{ bnb.prices.weekend }}</span>
            </div>
            <div class="price-row" v-if="bnb.prices.fullRentWeekday">
              <span class="price-key">平日包棟</span>
              <span class="price-value">{{ bnb.prices.fullRentWeekday }}</span>
            </div>
            <div class="price-row" v-if="bnb.prices.fullRentWeekend">
              <span class="price-key">假日包棟</span>
              <span class="price-value">{{ bnb.prices.fullRentWeekend }}</span>
            </div>
          </div>
          <div v-else class="no-data">
            <p>暫無價格資訊</p>
          </div>
        </div>

        <div class="info-section">
          <h2 class="section-title">聯絡資訊</h2>
          <div class="contact-info" v-if="bnb.contact">
            <div class="contact-row" v-if="bnb.contact.phone">
              <span class="contact-key">電話</span>
              <span class="contact-value">
                <a :href="`tel:${bnb.contact.phone}`" class="contact-link">{{ bnb.contact.phone }}</a>
              </span>
            </div>
            <div class="contact-row" v-if="bnb.contact.website">
              <span class="contact-key">網站</span>
              <span class="contact-value">
                <a :href="bnb.contact.website" target="_blank" class="contact-link">{{ bnb.contact.website }}</a>
              </span>
            </div>
            <div class="contact-row" v-if="bnb.contact.line">
              <span class="contact-key">LINE</span>
              <span class="contact-value">
                <a :href="bnb.contact.line" target="_blank" class="contact-link">點擊加入LINE</a>
              </span>
            </div>
          </div>
          <div v-else class="no-data">
            <p>暫無聯絡資訊</p>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRoute } from 'nuxt/app';

// 直接從URL獲取ID參數
const route = useRoute();
const bnbId = route.params.id;
const bnb = ref(null);
const loading = ref(true);
const error = ref(null);

// 調試信息
console.log('路由參數:', route.params);
console.log('民宿ID:', bnbId);

// 獲取民宿詳細資料
const fetchBnbDetail = async () => {
  try {
    loading.value = true;
    console.log('正在獲取民宿詳情，ID:', bnbId);
    
    // 直接請求API
    const response = await fetch(`/api/fetchBnbDetail?id=${bnbId}`);
    console.log('API響應狀態:', response.status);
    
    if (!response.ok) {
      throw new Error(`API返回錯誤狀態: ${response.status}`);
    }
    
    const data = await response.json();
    console.log('獲取的數據:', data);
    
    if (data.bnb) {
      bnb.value = data.bnb;
      console.log('已設置民宿數據:', bnb.value);
    } else if (data.error) {
      error.value = data.error;
      console.error('API返回錯誤:', data.error);
    } else {
      error.value = '找不到民宿資料';
      console.error('API未返回有效數據');
    }
    
    loading.value = false;
  } catch (err) {
    error.value = err.message;
    loading.value = false;
    console.error('獲取民宿詳細資料失敗', err);
  }
};

onMounted(() => {
  console.log('組件已掛載，開始獲取數據');
  fetchBnbDetail();
});
</script>

<style lang="scss" scoped>
.bnb-detail {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.loading, .error, .not-found {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 300px;
  flex-direction: column;
}

.back-btn {
  margin-bottom: 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 16px;
}

.back-link {
  display: flex;
  align-items: center;
  color: #5db0be;
  font-weight: 500;
  transition: color 0.3s ease;
  
  &:hover {
    color: #3d8999;
  }
  
  svg {
    margin-right: 5px;
  }
}

.bnb-header {
  display: flex;
  flex-direction: column;
  margin-bottom: 30px;
  
  @media (min-width: 768px) {
    flex-direction: row;
    align-items: flex-start;
  }
}

.bnb-info-header {
  flex: 1;
}

.bnb-title {
  font-size: 28px;
  font-weight: 800;
  color: #613030;
  margin-bottom: 15px;
}

.bnb-tags {
  display: flex;
  flex-wrap: wrap;
  margin-bottom: 15px;
}

.bnb-tag {
  display: inline-block;
  font-size: 14px;
  padding: 5px 10px;
  color: #5db0be;
  background-color: rgba(100,179,244,.1);
  margin: 0 10px 10px 0;
  border-radius: 4px;
}

.bnb-tag.address {
  color: #666;
  background-color: #f5f5f5;
}

.bnb-image {
  width: 100%;
  margin-top: 15px;
  
  @media (min-width: 768px) {
    width: 40%;
    margin-top: 0;
    margin-left: 30px;
  }
}

.detail-img {
  width: 100%;
  height: auto;
  border-radius: 10px;
  object-fit: cover;
}

.bnb-content {
  display: flex;
  flex-direction: column;
}

.info-section {
  background-color: #fff;
  padding: 20px;
  border-radius: 10px;
  margin-bottom: 20px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.section-title {
  font-size: 18px;
  font-weight: 700;
  color: #613030;
  margin-bottom: 15px;
  padding-bottom: 10px;
  border-bottom: 1px solid #eee;
}

.description {
  font-size: 16px;
  line-height: 1.6;
  color: #444;
}

.people-types, .environment-types {
  display: flex;
  flex-wrap: wrap;
}

.people-type, .environment-type {
  background-color: #f8f9fa;
  padding: 8px 12px;
  border-radius: 6px;
  margin: 0 10px 10px 0;
}

.type-label {
  font-size: 14px;
  color: #555;
}

.no-data {
  color: #999;
  font-style: italic;
}

.prices {
  display: flex;
  flex-direction: column;
}

.price-row, .contact-row {
  display: flex;
  justify-content: space-between;
  padding: 10px 0;
  border-bottom: 1px solid #f0f0f0;
  
  &:last-child {
    border-bottom: none;
  }
}

.price-key, .contact-key {
  font-weight: 600;
  color: #666;
  flex: 1;
}

.price-value, .contact-value {
  color: #ff6b6b;
  font-weight: 500;
  flex: 2;
  text-align: right;
}

.contact-value {
  color: #333;
}

.contact-link {
  color: #5db0be;
  text-decoration: none;
  transition: color 0.3s ease;
  
  &:hover {
    color: #3d8999;
    text-decoration: underline;
  }
}

/* 業者管理區域樣式 */
.owner-actions {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.owner-hint {
  font-size: 13px;
  color: #666;
  font-weight: 500;
}

.owner-login-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 8px 16px;
  border-radius: 20px;
  text-decoration: none;
  font-size: 13px;
  font-weight: 600;
  transition: all 0.3s ease;
  box-shadow: 0 2px 6px rgba(102, 126, 234, 0.3);

  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
    color: white;
  }

  svg {
    flex-shrink: 0;
    margin-right: 0;
  }
}

@media (max-width: 767px) {
  .price-row, .contact-row {
    flex-direction: column;
    
    .price-key, .contact-key, .price-value, .contact-value {
      width: 100%;
      text-align: left;
      margin-bottom: 5px;
    }
  }
}
</style> 