<template>
  <div class="homestay-detail">
    <!-- 載入狀態 -->
    <div v-if="loading" class="loading-container">
      <div class="loading-spinner"></div>
      <p class="loading-text">載入中...</p>
    </div>

    <!-- 錯誤狀態 -->
    <div v-else-if="error" class="error-container">
      <div class="error-icon">⚠️</div>
      <h3 class="error-title">載入失敗</h3>
      <p class="error-message">{{ error }}</p>
      <button @click="fetchBnbDetail" class="retry-btn">重新載入</button>
    </div>

    <!-- 找不到民宿 -->
    <div v-else-if="!bnb" class="not-found-container">
      <div class="not-found-icon">🏠</div>
      <h3 class="not-found-title">找不到民宿</h3>
      <p class="not-found-message">您查看的民宿可能已下架或不存在</p>
      <NuxtLink to="/homestay-list" class="back-to-list-btn">回到列表</NuxtLink>
    </div>

    <!-- 民宿詳情 -->
    <div v-else class="homestay-content">
      <!-- 頂部導航 -->
      <div class="top-nav">
        <NuxtLink to="/homestay-list" class="back-link">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 16 16">
            <path fill-rule="evenodd" d="M15 8a.5.5 0 0 0-.5-.5H2.707l3.147-3.146a.5.5 0 1 0-.708-.708l-4 4a.5.5 0 0 0 0 .708l4 4a.5.5 0 0 0 .708-.708L2.707 8.5H14.5A.5.5 0 0 0 15 8"/>
          </svg>
          <span>返回列表</span>
        </NuxtLink>
        
        <div class="owner-actions">
          <span class="owner-hint">{{ bnb.name }} 的業者？</span>
        </div>
      </div>

      <!-- 主要內容 -->
      <div class="main-content">
        <!-- 民宿標題區 -->
        <div class="homestay-header">
          <div class="homestay-info">
            <h1 class="homestay-title">{{ bnb.name }}</h1>
          </div>
          
          <!-- 民宿圖片 -->
          <div class="homestay-image-container">
            <div v-if="bnb.image_urls && bnb.image_urls.length > 0" class="image-gallery">
              <!-- 主圖展示 -->
              <div class="main-image-container">
                <img 
                  :src="bnb.image_urls[currentMainImageIndex]" 
                  :alt="`${bnb.name} - 主圖`" 
                  class="main-image" 
                  @click="openLightbox(currentMainImageIndex)"
                />
                
                <!-- 導航按鈕 -->
                <button 
                  v-if="bnb.image_urls.length > 1"
                  @click="prevMainImage"
                  class="image-nav-btn prev-main-btn"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" viewBox="0 0 16 16">
                    <path fill-rule="evenodd" d="M11.354 1.646a.5.5 0 0 1 0 .708L5.707 8l5.647 5.646a.5.5 0 0 1-.708.708l-6-6a.5.5 0 0 1 0-.708l6-6a.5.5 0 0 1 .708 0"/>
                  </svg>
                </button>
                
                <button 
                  v-if="bnb.image_urls.length > 1"
                  @click="nextMainImage"
                  class="image-nav-btn next-main-btn"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" viewBox="0 0 16 16">
                    <path fill-rule="evenodd" d="M4.646 1.646a.5.5 0 0 1 .708 0l6 6a.5.5 0 0 1 0 .708l-6 6a.5.5 0 0 1-.708-.708L10.293 8 4.646 2.354a.5.5 0 0 1 0-.708"/>
                  </svg>
                </button>
                
                <!-- 圖片資訊覆層 -->
                <div class="image-overlay">
                  <div class="image-info">
                    <div class="image-count">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                        <path d="M6.002 5.5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0"/>
                        <path d="M2.002 1a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V3a2 2 0 0 0-2-2h-12zm12 1a1 1 0 0 1 1 1v6.5l-3.777-1.947a.5.5 0 0 0-.577.093l-3.71 3.71-2.66-1.772a.5.5 0 0 0-.63.062L1.002 12V3a1 1 0 0 1 1-1h12z"/>
                      </svg>
                      {{ currentMainImageIndex + 1 }} / {{ bnb.image_urls.length }}
                    </div>
                    <button class="fullscreen-btn" @click="openLightbox(currentMainImageIndex)">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                        <path d="M1.5 1a.5.5 0 0 0-.5.5v4a.5.5 0 0 1-1 0v-4A1.5 1.5 0 0 1 1.5 0h4a.5.5 0 0 1 0 1zM10 .5a.5.5 0 0 1 .5-.5h4A1.5 1.5 0 0 1 16 1.5v4a.5.5 0 0 1-1 0v-4a.5.5 0 0 0-.5-.5h-4a.5.5 0 0 1-.5-.5M.5 10a.5.5 0 0 1 .5.5v4a.5.5 0 0 0 .5.5h4a.5.5 0 0 1 0 1h-4A1.5 1.5 0 0 1 0 14.5v-4a.5.5 0 0 1 .5-.5m15 0a.5.5 0 0 1 .5.5v4a1.5 1.5 0 0 1-1.5 1.5h-4a.5.5 0 0 1 0-1h4a.5.5 0 0 0 .5-.5v-4a.5.5 0 0 1 .5-.5"/>
                      </svg>
                      檢視大圖
                    </button>
                  </div>
                </div>
              </div>
              
              <!-- 縮圖導航 -->
              <div v-if="bnb.image_urls.length > 1" class="thumbnail-gallery">
                <div class="thumbnail-container">
                  <div 
                    v-for="(imageUrl, index) in bnb.image_urls" 
                    :key="index"
                    class="thumbnail-item"
                    :class="{ 'active': index === currentMainImageIndex }"
                    @click="setMainImage(index)"
                  >
                    <img 
                      :src="imageUrl" 
                      :alt="`${bnb.name} - 縮圖 ${index + 1}`" 
                      class="thumbnail-image"
                    />
                    <div class="thumbnail-overlay">
                      <div class="thumbnail-number">{{ index + 1 }}</div>
                    </div>
                  </div>
                </div>
                
                <!-- 縮圖導航按鈕 -->
                <button 
                  v-if="showThumbnailNav.prev"
                  @click="scrollThumbnails('prev')"
                  class="thumbnail-nav-btn prev-thumb-btn"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                    <path fill-rule="evenodd" d="M11.354 1.646a.5.5 0 0 1 0 .708L5.707 8l5.647 5.646a.5.5 0 0 1-.708.708l-6-6a.5.5 0 0 1 0-.708l6-6a.5.5 0 0 1 .708 0"/>
                  </svg>
                </button>
                
                <button 
                  v-if="showThumbnailNav.next"
                  @click="scrollThumbnails('next')"
                  class="thumbnail-nav-btn next-thumb-btn"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                    <path fill-rule="evenodd" d="M4.646 1.646a.5.5 0 0 1 .708 0l6 6a.5.5 0 0 1 0 .708l-6 6a.5.5 0 0 1-.708-.708L10.293 8 4.646 2.354a.5.5 0 0 1 0-.708"/>
                  </svg>
                </button>
              </div>
              

            </div>
            
            <!-- 沒有圖片的情況 -->
            <div v-else class="no-image">
              <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" fill="currentColor" viewBox="0 0 16 16">
                <path d="M6.002 5.5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0"/>
                <path d="M2.002 1a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V3a2 2 0 0 0-2-2h-12zm12 1a1 1 0 0 1 1 1v6.5l-3.777-1.947a.5.5 0 0 0-.577.093l-3.71 3.71-2.66-1.772a.5.5 0 0 0-.63.062L1.002 12V3a1 1 0 0 1 1-1h12z"/>
              </svg>
              <p>暫無圖片</p>
            </div>
          </div>
        </div>

        <!-- 詳細信息卡片 -->
        <div class="info-cards">
          <!-- 第一行：民宿介紹（全寬） -->
          <div v-if="bnb.description" class="info-card full-width">
            <div class="card-header">
              <div class="card-icon">📝</div>
              <h3 class="card-title">民宿介紹</h3>
            </div>
            <div class="card-content">
              <p class="description">{{ bnb.description }}</p>
            </div>
          </div>

          <!-- 可預訂日曆（全寬） -->
          <!-- <div class="info-card full-width">
            <div class="card-header">
              <div class="card-icon">📅</div>
              <h3 class="card-title">空房狀況</h3>
            </div>
            <div class="card-content">
              <AvailabilityCalendar 
                :homestay-id="bnbId"
                :view-only="true"
              />
            </div>
          </div> -->

          <!-- 第二行：住宿人數 + 環境特色 -->
          <div class="info-card compact">
            <div class="card-header">
              <div class="card-icon">👥</div>
              <h3 class="card-title">住宿人數</h3>
            </div>
            <div class="card-content">
              <div v-if="bnb.min_guests || bnb.max_guests" class="guest-capacity">
                <div class="capacity-info">
                  <div class="capacity-icon">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" viewBox="0 0 16 16">
                      <path d="M15 14v1H1v-1c0-1 1-4 7-4s7 3 7 4Zm-9.995-.944v-.002.002ZM8.5 8.018A2.5 2.5 0 1 0 8.5 3a2.5 2.5 0 0 0 0 5.018Z"/>
                      <path d="M2.5 8.018A2.5 2.5 0 1 0 2.5 3a2.5 2.5 0 0 0 0 5.018Z"/>
                      <path d="M13.5 8.018A2.5 2.5 0 1 0 13.5 3a2.5 2.5 0 0 0 0 5.018Z"/>
                    </svg>
                  </div>
                  <div class="capacity-details">
                    <div class="capacity-range">
                      <span v-if="bnb.min_guests && bnb.max_guests" class="guest-count">
                        {{ bnb.min_guests }} - {{ bnb.max_guests }} 人
                      </span>
                      <span v-else-if="bnb.max_guests" class="guest-count">
                        最多 {{ bnb.max_guests }} 人
                      </span>
                      <span v-else-if="bnb.min_guests" class="guest-count">
                        最少 {{ bnb.min_guests }} 人
                      </span>
                    </div>
                    <div class="capacity-description">
                      適合的住宿人數範圍
                    </div>
                  </div>
                </div>
              </div>
              <div v-else class="no-data">
                <p>暫無人數資訊</p>
              </div>
            </div>
          </div>



          <!-- 主題特色 -->
          <div class="info-card compact">
            <div class="card-header">
              <div class="card-icon">🏠</div>
              <h3 class="card-title">主題特色</h3>
            </div>
            <div class="card-content">
              <div v-if="bnb.features && bnb.features.themeFeatures && bnb.features.themeFeatures.length > 0" class="tag-container">
                <div v-for="(feature, index) in bnb.features.themeFeatures" :key="index" class="feature-tag theme">
                  {{ feature }}
                </div>
              </div>
              <div v-else class="no-data">
                <p>暫無主題特色資訊</p>
              </div>
            </div>
          </div>



          <!-- 服務設施 -->
          <div class="info-card compact">
            <div class="card-header">
              <div class="card-icon">🎯</div>
              <h3 class="card-title">服務設施</h3>
            </div>
            <div class="card-content">
              <div v-if="bnb.features && bnb.features.serviceAmenities && bnb.features.serviceAmenities.length > 0" class="tag-container">
                <div v-for="(service, index) in bnb.features.serviceAmenities" :key="index" class="feature-tag service">
                  {{ service }}
                </div>
              </div>
              <div v-else class="no-data">
                <p>暫無服務設施資訊</p>
              </div>
            </div>
          </div>

          <!-- 第三行：價格資訊 + 聯絡資訊 -->
          <div class="info-card compact">
            <div class="card-header">
              <div class="card-icon">💰</div>
              <h3 class="card-title">價格資訊</h3>
            </div>
            <div class="card-content">
              <div v-if="bnb.prices" class="price-grid">
                <div v-if="bnb.prices.weekday" class="price-item">
                  <div class="price-label">平日價格</div>
                  <div class="price-amount">{{ bnb.prices.weekday }} 起</div>
                </div>
                <div v-if="bnb.prices.weekend" class="price-item">
                  <div class="price-label">假日價格</div>
                  <div class="price-amount">{{ bnb.prices.weekend }} 起</div>
                </div>
                <div v-if="bnb.prices.fullRentWeekday" class="price-item">
                  <div class="price-label">平日包棟</div>
                  <div class="price-amount">{{ bnb.prices.fullRentWeekday }} 起</div>
                </div>
                <div v-if="bnb.prices.fullRentWeekend" class="price-item">
                  <div class="price-label">假日包棟</div>
                  <div class="price-amount">{{ bnb.prices.fullRentWeekend }} 起</div>
                </div>
              </div>
              <div v-else class="no-data">
                <p>暫無價格資訊</p>
              </div>
            </div>
          </div>

          <div class="info-card compact">
            <div class="card-header">
              <div class="card-icon">📞</div>
              <h3 class="card-title">聯絡資訊</h3>
            </div>
            <div class="card-content">
              <div v-if="bnb.contact" class="contact-list">
                <div v-if="bnb.contact.phone" class="contact-item">
                  <div class="contact-icon">📱</div>
                  <div class="contact-info">
                    <div class="contact-label">電話</div>
                    <a :href="`tel:${bnb.contact.phone}`" class="contact-link">{{ bnb.contact.phone }}</a>
                  </div>
                </div>
                <div v-if="bnb.contact.website" class="contact-item">
                  <div class="contact-icon">🌐</div>
                  <div class="contact-info">
                    <div class="contact-label">網站</div>
                    <a :href="bnb.contact.website" target="_blank" class="contact-link">前往官網</a>
                  </div>
                </div>
                <div v-if="bnb.contact.line" class="contact-item">
                  <div class="contact-icon">💬</div>
                  <div class="contact-info">
                    <div class="contact-label">LINE</div>
                    <a :href="bnb.contact.line" target="_blank" class="contact-link">加入LINE</a>
                  </div>
                </div>
                <div v-if="bnb.contact.instagram" class="contact-item">
                  <div class="contact-icon">📷</div>
                  <div class="contact-info">
                    <div class="contact-label">Instagram</div>
                    <a :href="bnb.contact.instagram" target="_blank" class="contact-link">關注IG</a>
                  </div>
                </div>
                <div v-if="bnb.contact.facebook" class="contact-item">
                  <div class="contact-icon">📘</div>
                  <div class="contact-info">
                    <div class="contact-label">Facebook</div>
                    <a :href="bnb.contact.facebook" target="_blank" class="contact-link">前往粉專</a>
                  </div>
                </div>
              </div>
              <div v-else class="no-data">
                <p>暫無聯絡資訊</p>
              </div>
            </div>
          </div>
          
          <!-- 位置資訊 -->
          <div class="info-card">
            <div class="card-header">
              <div class="card-icon">📍</div>
              <h3 class="card-title">位置資訊</h3>
            </div>
            <div class="card-content">
              <div class="location-info">
                <div class="location-address-tag">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                    <path d="M8 16s6-5.686 6-10A6 6 0 0 0 2 6c0 4.314 6 10 6 10m0-7a3 3 0 1 1 0-6 3 3 0 0 1 0 6"/>
                  </svg>
                  <span v-if="bnb.area && bnb.address">{{ bnb.area }} - {{ bnb.address }}</span>
                  <span v-else-if="bnb.area">{{ bnb.area }}</span>
                  <span v-else-if="bnb.address">{{ bnb.address }}</span>
                </div>
                
                <!-- Google 地圖按鈕 -->
                <a 
                  v-if="bnb.name || bnb.address" 
                  :href="getGoogleMapsUrl(bnb.name, bnb.address)" 
                  target="_blank" 
                  class="maps-link-btn"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                    <path d="M8 16s6-5.686 6-10A6 6 0 0 0 2 6c0 4.314 6 10 6 10m0-7a3 3 0 1 1 0-6 3 3 0 0 1 0 6"/>
                  </svg>
                  <span>開啟 Google 地圖</span>
                </a>
              </div>
            </div>
          </div>
        </div>

        <!-- 業者登入按鈕 -->
        <div class="owner-login-section">
          <NuxtLink to="/homestay-login" class="owner-login-btn">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
              <path d="M8 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6m2-3a2 2 0 1 1-4 0 2 2 0 0 1 4 0m4 8c0 1-1 1-1 1H3s-1 0-1-1 1-4 6-4 6 3 6 4m-1-.004c-.001-.246-.154-.986-.832-1.664C11.516 10.68 10.289 10 8 10s-3.516.68-4.168 1.332c-.678.678-.83 1.418-.832 1.664z"/>
            </svg>
            <span>{{ bnb.name }} 的業者登入</span>
          </NuxtLink>
        </div>
      </div>
    </div>

    <!-- EasyLightbox 組件 -->
    <VueEasyLightbox
      v-if="lightboxVisible"
      :imgs="lightboxImages"
      :index="lightboxIndex"
      :visible="lightboxVisible"
      @hide="lightboxVisible = false"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useRoute, useFetch, createError, useSeoMeta, useHead } from 'nuxt/app';

// 直接從URL獲取ID參數
const route = useRoute();
const bnbId = route.params.id;

// 使用 useFetch 進行 SSR 資料獲取
const { data: bnbData, error: fetchError } = await useFetch('/api/fetchBnbDetail', {
  query: { id: bnbId }
});

// 處理錯誤
if (fetchError.value || !bnbData.value?.bnb) {
  throw createError({
    statusCode: 404,
    statusMessage: 'Page Not Found',
    fatal: true
  });
}

// 綁定資料
const bnb = computed(() => bnbData.value?.bnb);
const loading = ref(false); // SSR 完成後就不需要 loading 狀態了，或者可以保留給切換圖片等操作

// 設定 SEO
// 因為是 SSR，這裡的 bnb.value 已經有值，可以直接使用
const homestay = bnb.value;
const canonicalUrl = `https://yilanpass.com/homestays/${homestay.id}`;

useSeoMeta({
  title: `${homestay.name} | 宜蘭合法民宿 - 宜蘭旅遊通-宜蘭觀光民宿行銷協會`,
  ogTitle: `${homestay.name} | 宜蘭旅遊通-宜蘭觀光民宿行銷協會`,
  description: homestay.description || `位於宜蘭${homestay.area || homestay.location}的合法民宿${homestay.name}，提供優質住宿體驗。可能設有戲水池、KTV、烤肉設施等休閒娛樂設備，查看詳細房型、價格與預訂資訊。`,
  ogDescription: homestay.description || `宜蘭${homestay.area}優質民宿${homestay.name}，提供多樣化休閒設施`,
  keywords: `${homestay.name},宜蘭民宿,${homestay.area || homestay.location}民宿,合法民宿,戲水池民宿,KTV民宿,烤肉民宿,游泳池民宿,唱歌民宿,BBQ民宿${homestay.features?.themeFeatures ? ',' + homestay.features.themeFeatures.join(',') : ''}${homestay.features?.serviceAmenities ? ',' + homestay.features.serviceAmenities.join(',') : ''}`,
  ogImage: homestay.image_urls?.[0] || 'https://yilanpass.com/logo.png',
  ogUrl: canonicalUrl,
  ogType: 'website',
  twitterCard: 'summary_large_image',
  twitterTitle: `${homestay.name} | 宜蘭民宿`,
  twitterDescription: homestay.description || `宜蘭${homestay.area}優質民宿${homestay.name}`,
  twitterImage: homestay.image_urls?.[0] || 'https://yilanpass.com/logo.png',
  robots: 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1',
  canonical: canonicalUrl
});

// 額外設定 head link & JSON-LD
useHead({
  link: [
    {
      rel: 'canonical',
      href: canonicalUrl
    },
    {
      rel: 'llms-txt',
      href: `https://yilanpass.com/homestays/${homestay.id}/llms.txt`
    }
  ],
  script: [
    {
      type: 'application/ld+json',
      children: JSON.stringify({
        "@context": "https://schema.org",
        "@type": ["LodgingBusiness", "LocalBusiness"],
        "@id": canonicalUrl,
        "name": homestay.name,
        "alternateName": `${homestay.name} 民宿`,
        "description": homestay.description || `位於宜蘭${homestay.area || homestay.location}的合法民宿${homestay.name}，提供優質住宿體驗。設有多樣化休閒設施，是您宜蘭旅遊的最佳選擇。`,
        "url": `https://yilanpass.com/homestays/${homestay.id}`,
        "sameAs": [
          `https://yilanpass.com/homestays/${homestay.id}/llms.txt`,
          `https://yilanpass.com/homestays/${homestay.id}`,
          "https://yilanpass.com",
          homestay.facebook_url,
          homestay.instagram_url,
          homestay.website
        ].filter(Boolean),
        "image": homestay.image_urls || ["/logo.jpg"],
        "logo": "https://yilanpass.com/logo.png",
        "telephone": homestay.phone || homestay.contactPhone,
        "address": {
          "@type": "PostalAddress",
          "streetAddress": homestay.address,
          "addressLocality": homestay.area || homestay.location,
          "addressRegion": "宜蘭縣",
          "postalCode": homestay.postal_code,
          "addressCountry": "TW"
        },
        "geo": homestay.latitude && homestay.longitude ? {
          "@type": "GeoCoordinates",
          "latitude": parseFloat(homestay.latitude),
          "longitude": parseFloat(homestay.longitude)
        } : undefined,
        "priceRange": homestay.prices?.fullRentWeekday ? 
          `NT$${homestay.prices.fullRentWeekday} - NT$${homestay.prices.fullRentWeekend || homestay.prices.fullRentWeekday}` : 
          "NT$2000 - NT$8000",
        "currenciesAccepted": "TWD",
        "paymentAccepted": ["Cash", "Credit Card", "Bank Transfer"],
        "openingHours": "Mo-Su 24:00",
        "checkinTime": "15:00",
        "checkoutTime": "11:00",
        "numberOfRooms": homestay.roomCount || homestay.room_count,
        "maximumAttendeeCapacity": homestay.max_guests,
        "minimumAttendeeCapacity": homestay.min_guests || 1,
        "petsAllowed": homestay.features?.serviceAmenities?.includes('寵物友善') || homestay.pet_friendly || false,
        "amenityFeature": [
          ...(homestay.features?.themeFeatures?.map(feature => ({
            "@type": "LocationFeatureSpecification",
            "name": feature,
            "value": true
          })) || []),
          ...(homestay.features?.serviceAmenities?.map(amenity => ({
            "@type": "LocationFeatureSpecification", 
            "name": amenity,
            "value": true
          })) || [])
        ]
      })
    },
    {
      type: 'application/ld+json',
      children: JSON.stringify({
        "@context": "https://schema.org",
        "@type": "FAQPage",
        "mainEntity": [
          {
            "@type": "Question",
            "name": `${homestay.name}最多可以住幾個人？`,
            "acceptedAnswer": {
              "@type": "Answer",
              "text": homestay.max_guests 
                ? `住宿人數範圍為${homestay.min_guests || 1}至${homestay.max_guests}人，適合家族包棟、同學會或公司團體旅遊使用。`
                : `${homestay.name}提供多種房型選擇，適合不同人數的團體入住，建議訂房時先與業者確認。`
            }
          },
          {
            "@type": "Question",
            "name": `${homestay.name}可以帶寵物入住嗎？`,
            "acceptedAnswer": {
              "@type": "Answer",
              "text": (homestay.features?.serviceAmenities?.includes('寵物友善') || homestay.pet_friendly)
                ? `可以，${homestay.name}為寵物友善民宿，歡迎毛孩子一同入住，建議訂房時先與業者確認相關規定。`
                : `目前${homestay.name}的寵物入住規定，建議訂房前先致電與業者確認，以獲得最準確的資訊。`
            }
          },
          {
            "@type": "Question",
            "name": `${homestay.name}包棟費用是多少？`,
            "acceptedAnswer": {
              "@type": "Answer",
              "text": homestay.prices?.fullRentWeekday 
                ? `平日包棟${homestay.prices.fullRentWeekday}起，假日包棟${homestay.prices.fullRentWeekend || homestay.prices.fullRentWeekday}起；實際價格以訂房時為準。`
                : `價格資訊請參考頁面說明或直接與業者聯繫，平日與假日價格會有所調整。`
            }
          },
          {
            "@type": "Question",
            "name": `${homestay.name}附近有哪些景點？`,
            "acceptedAnswer": {
              "@type": "Answer",
              "text": `民宿位於宜蘭${homestay.area || homestay.location}，鄰近宜蘭各大熱門景點，交通便利，非常適合安排宜蘭一日或兩日遊。`
            }
          },
          {
            "@type": "Question",
            "name": `${homestay.name}有哪些娛樂設施？`,
            "acceptedAnswer": {
              "@type": "Answer",
              "text": `提供的設施包括：${[...(homestay.features?.themeFeatures || []), ...(homestay.features?.serviceAmenities || [])].join('、') || '優質住宿環境'}。室內外娛樂一應俱全。`
            }
          }
        ]
      })
    }
  ]
});

// 圖片畫廊相關狀態
const currentMainImageIndex = ref(0);
const lightboxVisible = ref(false);
const lightboxIndex = ref(0);

// 縮圖導航狀態
const showThumbnailNav = ref({
  prev: false,
  next: false
});

// 計算 lightbox 圖片陣列
const lightboxImages = computed(() => {
  if (!bnb.value?.image_urls) return [];
  return bnb.value.image_urls.map(url => ({ src: url }));
});

// 圖片導航函數
const nextMainImage = () => {
  if (bnb.value?.image_urls && bnb.value.image_urls.length > 1) {
    currentMainImageIndex.value = (currentMainImageIndex.value + 1) % bnb.value.image_urls.length;
  }
};

const prevMainImage = () => {
  if (bnb.value?.image_urls && bnb.value.image_urls.length > 1) {
    currentMainImageIndex.value = currentMainImageIndex.value === 0 
      ? bnb.value.image_urls.length - 1 
      : currentMainImageIndex.value - 1;
  }
};

const setMainImage = (index) => {
  currentMainImageIndex.value = index;
};

// Lightbox 控制函數
const openLightbox = (index) => {
  lightboxIndex.value = index;
  lightboxVisible.value = true;
};

// 縮圖滾動控制
const scrollThumbnails = (direction) => {
  // 這裡可以實現縮圖滾動邏輯
  // 暫時保持簡單實現
  if (direction === 'next') {
    nextMainImage();
  } else {
    prevMainImage();
  }
};

// 鍵盤導航支援
const handleKeydown = (event) => {
  if (!bnb.value?.image_urls) return;
  
  if (event.key === 'ArrowLeft') {
    prevMainImage();
  } else if (event.key === 'ArrowRight') {
    nextMainImage();
  } else if (event.key === 'Escape') {
    lightboxVisible.value = false;
  }
};

onMounted(() => {
  // 添加鍵盤事件監聽器
  window.addEventListener('keydown', handleKeydown);
});

// 組件卸載時清理事件監聽器
onUnmounted(() => {
  window.removeEventListener('keydown', handleKeydown);
});

// Google Maps URL 生成函數
const getGoogleMapsUrl = (name, address) => {
  const query = [name, address].filter(Boolean).join(' ');
  return `https://www.google.com/maps/?q=${encodeURIComponent(query)}`;
};

// 調試信息
console.log('路由參數:', route.params);
console.log('民宿ID:', bnbId);
</script>

<style lang="scss" scoped>
.homestay-detail {
  min-height: 100vh;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  padding: 0;
}

// 載入狀態
.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 60vh;
  gap: 20px;
}

.loading-spinner {
  width: 50px;
  height: 50px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid #3498db;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.loading-text {
  font-size: 18px;
  color: #666;
  font-weight: 500;
}

// 錯誤狀態
.error-container, .not-found-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 60vh;
  gap: 20px;
  padding: 20px;
  text-align: center;
}

.error-icon, .not-found-icon {
  font-size: 64px;
  margin-bottom: 10px;
}

.error-title, .not-found-title {
  font-size: 24px;
  font-weight: 600;
  color: #333;
  margin: 0;
}

.error-message, .not-found-message {
  font-size: 16px;
  color: #666;
  margin: 10px 0;
}

.retry-btn, .back-to-list-btn {
  padding: 12px 24px;
  background: #3498db;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;
  text-decoration: none;
  transition: all 0.3s ease;
  
  &:hover {
    background: #2980b9;
    transform: translateY(-2px);
  }
}

// 主要內容
.homestay-content {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0;
}

// 頂部導航
.top-nav {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  padding: 16px 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid rgba(0, 0, 0, 0.1);
  position: sticky;
  top: 0;
  z-index: 11;
  
  @media (max-width: 768px) {
    flex-direction: column;
    gap: 10px;
    padding: 12px 15px;
  }
}

.back-link {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #3498db;
  text-decoration: none;
  font-weight: 500;
  transition: all 0.3s ease;
  
  &:hover {
    color: #2980b9;
    transform: translateX(-2px);
  }
}

.owner-actions {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 14px;
  
  @media (max-width: 768px) {
    font-size: 12px;
  }
}

.owner-hint {
  color: #666;
  
  @media (max-width: 768px) {
    display: none;
  }
}

// 主要內容區
.main-content {
  padding: 25px 20px;
  
  @media (max-width: 768px) {
    padding: 20px 15px;
  }
}

// 民宿標題區
.homestay-header {
  grid-template-columns: 1fr 400px;
  gap: 25px;
  margin-bottom: 32px;
  
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    gap: 18px;
    margin-bottom: 24px;
  }
}

.homestay-info {
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.homestay-title {
  font-size: 2.5rem;
  font-weight: 700;
  color: #2c3e50;
  margin: 0 0 20px 0;
  line-height: 1.2;
  
  @media (max-width: 768px) {
    font-size: 2rem;
    margin-bottom: 15px;
  }
}

.homestay-meta {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.location-tag, .address-tag {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  background: rgba(52, 152, 219, 0.1);
  border: 1px solid rgba(52, 152, 219, 0.2);
  border-radius: 8px;
  color: #2980b9;
  font-weight: 500;
  width: fit-content;
}

.address-tag {
  background: rgba(46, 204, 113, 0.1);
  border-color: rgba(46, 204, 113, 0.2);
  color: #27ae60;
}

// 民宿圖片
.homestay-image-container {
  position: relative;
}

.image-gallery {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

// 主圖容器
.main-image-container {
  position: relative;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.15);
  transition: transform 0.3s ease;
  cursor: pointer;
  
  &:hover {
    transform: translateY(-5px);
  }
}

.main-image {
  width: 100%;
  height: 400px;
  object-fit: cover;
  display: block;
  transition: transform 0.3s ease;
  
  @media (max-width: 768px) {
    height: 250px;
  }
  
  &:hover {
    transform: scale(1.02);
  }
}

// 主圖導航按鈕
.image-nav-btn {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  background: rgba(0, 0, 0, 0.6);
  color: white;
  border: none;
  border-radius: 50%;
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s ease;
  z-index: 5;
  backdrop-filter: blur(8px);
  opacity: 0;
  
  &:hover {
    background: rgba(0, 0, 0, 0.8);
    transform: translateY(-50%) scale(1.1);
  }
  
  @media (max-width: 768px) {
    width: 40px;
    height: 40px;
    opacity: 1;
    
    svg {
      width: 18px;
      height: 18px;
    }
  }
}

.prev-main-btn {
  left: 16px;
}

.next-main-btn {
  right: 16px;
}

.main-image-container:hover .image-nav-btn {
  opacity: 1;
}

// 圖片資訊覆層
.image-overlay {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: linear-gradient(transparent, rgba(0, 0, 0, 0.8));
  padding: 20px;
  color: white;
}

.image-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.image-count {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
  font-weight: 500;
}

.fullscreen-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  background: rgba(255, 255, 255, 0.2);
  color: white;
  border: none;
  padding: 8px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  backdrop-filter: blur(4px);
  
  &:hover {
    background: rgba(255, 255, 255, 0.3);
    transform: translateY(-1px);
  }
}

// 縮圖畫廊
.thumbnail-gallery {
  position: relative;
  padding: 0 40px;
  
  @media (max-width: 768px) {
    padding: 0 30px;
  }
}

.thumbnail-container {
  display: flex;
  gap: 12px;
  overflow-x: auto;
  scroll-behavior: smooth;
  padding: 8px;
  
  // 隱藏滾動條但保持滾動功能
  &::-webkit-scrollbar {
    height: 4px;
  }
  
  &::-webkit-scrollbar-track {
    background: #f1f1f1;
    border-radius: 2px;
  }
  
  &::-webkit-scrollbar-thumb {
    background: #c1c1c1;
    border-radius: 2px;
    
    &:hover {
      background: #a8a8a8;
    }
  }
}

.thumbnail-item {
  position: relative;
  flex: 0 0 80px;
  height: 60px;
  border-radius: 8px;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.3s ease;
  border: 2px solid transparent;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  }
  
  &.active {
    border-color: #3498db;
    transform: scale(1.05);
    box-shadow: 0 4px 15px rgba(52, 152, 219, 0.3);
  }
  
  @media (max-width: 768px) {
    flex: 0 0 60px;
    height: 45px;
  }
}

.thumbnail-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.3s ease;
}

.thumbnail-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.3s ease;
}

.thumbnail-item:hover .thumbnail-overlay {
  opacity: 1;
}

.thumbnail-item.active .thumbnail-overlay {
  opacity: 0;
}

.thumbnail-number {
  color: white;
  font-size: 11px;
  font-weight: 600;
  background: rgba(0, 0, 0, 0.6);
  padding: 4px;
  border-radius: 50%;
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
}

// 縮圖導航按鈕
.thumbnail-nav-btn {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  background: rgba(255, 255, 255, 0.9);
  color: #333;
  border: none;
  border-radius: 50%;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s ease;
  z-index: 3;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  
  &:hover {
    background: white;
    transform: translateY(-50%) scale(1.1);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  }
}

.prev-thumb-btn {
  left: 8px;
}

.next-thumb-btn {
  right: 8px;
}



.homestay-image {
  position: relative;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.15);
  transition: transform 0.3s ease;
  
  &:hover {
    transform: translateY(-5px);
  }
}

// 資訊卡片
.info-cards {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
  
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    gap: 16px;
  }
}

.info-card {
  background: white;
  border-radius: 16px;
  padding: 20px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  transition: all 0.3s ease;
  
  &:hover {
    transform: translateY(-3px);
    box-shadow: 0 6px 25px rgba(0, 0, 0, 0.1);
  }
  
  &.full-width {
    grid-column: 1 / -1;
  }
  
  &.compact {
    // 保持原有樣式不變
  }
}

.card-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 2px solid #f1f3f4;
}

.card-icon {
  font-size: 24px;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 10px;
  color: white;
}

.card-title {
  font-size: 18px;
  font-weight: 600;
  color: #2c3e50;
  margin: 0;
}

.card-content {
  line-height: 1.6;
}

.description {
  color: #5a6c7d;
  font-size: 15px;
  line-height: 1.7;
  margin: 0;
}

// 標籤容器
.tag-container {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.feature-tag {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 8px 16px;
  border-radius: 20px;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.3s ease;
  
  &.environment {
    background: linear-gradient(135deg, #2ecc71 0%, #27ae60 100%);
    box-shadow: 0 2px 8px rgba(46, 204, 113, 0.3);
    
    &:hover {
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(46, 204, 113, 0.4);
    }
  }
  
  &.theme {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    box-shadow: 0 2px 8px rgba(102, 126, 234, 0.3);
    
    &:hover {
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
    }
  }
  
  &.service {
    background: linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%);
    color: #333;
    box-shadow: 0 2px 8px rgba(252, 182, 159, 0.3);
    
    &:hover {
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(252, 182, 159, 0.4);
    }
  }
}

// 住宿人數容量樣式
.guest-capacity {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 10px;
}

.capacity-info {
  display: flex;
  align-items: center;
  gap: 15px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 20px;
  border-radius: 16px;
  color: white;
  width: 100%;
  max-width: 300px;
  box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);
}

.capacity-icon {
  background: rgba(255, 255, 255, 0.2);
  padding: 10px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  
  svg {
    color: white;
  }
}

.capacity-details {
  flex: 1;
  text-align: left;
}

.capacity-range {
  margin-bottom: 5px;
}

.guest-count {
  font-size: 18px;
  font-weight: 600;
  display: block;
}

.capacity-description {
  font-size: 13px;
  opacity: 0.9;
  font-weight: 400;
}

// 價格網格
.price-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 15px;
}

.price-item {
  background: #f8f9fa;
  padding: 15px;
  border-radius: 10px;
  text-align: center;
  border-left: 4px solid #28a745;
  transition: all 0.3s ease;
  
  &:hover {
    background: #e9ecef;
    transform: translateY(-2px);
  }
}

.price-label {
  font-size: 13px;
  color: #6c757d;
  margin-bottom: 5px;
  font-weight: 500;
}

.price-amount {
  font-size: 16px;
  font-weight: 600;
  color: #28a745;
}

// 聯絡清單
.contact-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.contact-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 15px;
  background: #f8f9fa;
  border-radius: 8px;
  transition: all 0.3s ease;
  
  &:hover {
    background: #e9ecef;
    transform: translateX(3px);
  }
}

.contact-icon {
  font-size: 18px;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #3498db 0%, #2980b9 100%);
  border-radius: 6px;
  color: white;
  flex-shrink: 0;
}

.contact-info {
  flex: 1;
  min-width: 0;
}

.contact-label {
  font-size: 12px;
  color: #6c757d;
  margin-bottom: 2px;
  font-weight: 500;
}

.contact-link {
  color: #3498db;
  text-decoration: none;
  font-weight: 500;
  transition: color 0.3s ease;
  display: block;
  word-break: break-all;
  
  &:hover {
    color: #2980b9;
    text-decoration: underline;
  }
}

// 無資料狀態
.no-data {
  text-align: center;
  padding: 20px;
  color: #95a5a6;
  font-style: italic;
  
  p {
    margin: 0;
    font-size: 15px;
  }
}

// 特色標籤容器和樣式
.tag-container {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  justify-content: flex-start;
}

.feature-tag {
  display: inline-block;
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 13px;
  font-weight: 500;
  text-align: center;
  transition: all 0.3s ease;
  
  &.environment {
    background: linear-gradient(135deg, #48c78e 0%, #00d4aa 100%);
    color: white;
    box-shadow: 0 2px 8px rgba(72, 199, 142, 0.3);
    
    &:hover {
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(72, 199, 142, 0.4);
    }
  }
  
  &.theme {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    box-shadow: 0 2px 8px rgba(102, 126, 234, 0.3);
    
    &:hover {
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
    }
  }
  

  
  &.service {
    background: linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%);
    color: #333;
    box-shadow: 0 2px 8px rgba(252, 182, 159, 0.3);
    
    &:hover {
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(252, 182, 159, 0.4);
    }
  }
}

// 位置資訊樣式
.location-info {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.location-address-tag {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 16px;
  background: linear-gradient(135deg, #28a745 0%, #20c997 100%);
  color: white;
  border-radius: 12px;
  font-weight: 500;
  font-size: 15px;
  box-shadow: 0 3px 10px rgba(40, 167, 69, 0.3);
  transition: all 0.3s ease;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 5px 15px rgba(40, 167, 69, 0.4);
  }
  
  svg {
    flex-shrink: 0;
  }
}

// Google 地圖按鈕樣式
.maps-link-btn {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 16px;
  background: linear-gradient(135deg, #dc3545 0%, #c82333 100%);
  color: white;
  border-radius: 12px;
  font-weight: 500;
  font-size: 15px;
  text-decoration: none;
  box-shadow: 0 3px 10px rgba(220, 53, 69, 0.3);
  transition: all 0.3s ease;
  width: fit-content;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 5px 15px rgba(220, 53, 69, 0.4);
    text-decoration: none;
    color: white;
  }
  
  svg {
    flex-shrink: 0;
  }
}

// 業者登入按鈕區域
.owner-login-section {
  margin-top: 40px;
  padding: 30px;
  text-align: center;
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
  border-radius: 20px;
  border-top: 1px solid #dee2e6;
}

.owner-login-btn {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  padding: 12px 30px;
  background: linear-gradient(135deg, #007bff 0%, #0056b3 100%);
  color: white;
  text-decoration: none;
  border-radius: 25px;
  font-weight: 600;
  font-size: 16px;
  transition: all 0.3s ease;
  box-shadow: 0 4px 15px rgba(0, 123, 255, 0.3);
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(0, 123, 255, 0.4);
    background: linear-gradient(135deg, #0056b3 0%, #003d82 100%);
    text-decoration: none;
  }
  
  svg {
    transition: transform 0.3s ease;
  }
  
  &:hover svg {
    transform: scale(1.1);
  }
  
  @media (max-width: 768px) {
    padding: 10px 24px;
    font-size: 14px;
    gap: 8px;
    
    svg {
      width: 14px;
      height: 14px;
    }
  }
}

// 響應式設計
@media (max-width: 768px) {
  .homestay-header {
    text-align: center;
  }
  
  .homestay-meta {
    align-items: center;
  }
  
  .location-tag, .address-tag {
    justify-content: center;
  }
  
  .price-grid {
    grid-template-columns: 1fr 1fr;
  }
  
  .contact-item {
    flex-direction: row;
    text-align: left;
    gap: 10px;
    padding: 8px 12px;
  }
  
  .contact-info {
    text-align: left;
  }
  
  .contact-icon {
    width: 28px;
    height: 28px;
    font-size: 16px;
  }
  
  .location-info {
    gap: 10px;
  }
  
  .location-tag, .address-tag {
    padding: 10px 14px;
    font-size: 14px;
    
    svg {
      width: 14px;
      height: 14px;
    }
  }
  
  // 手機版人數容量樣式
  .capacity-info {
    flex-direction: column;
    text-align: center;
    gap: 10px;
    max-width: 100%;
  }
  
  .capacity-details {
    text-align: center;
  }
}

@media (max-width: 480px) {
  .homestay-title {
    font-size: 1.5rem;
  }
  
  .info-cards {
    grid-template-columns: 1fr;
  }
  
  .owner-login-section {
    margin-top: 30px;
    padding: 20px;
  }
  
  .price-grid {
    grid-template-columns: 1fr;
  }
  
  .tag-container {
    justify-content: center;
  }
  
  // 小螢幕人數容量樣式
  .capacity-info {
    padding: 15px;
  }
  
  .guest-count {
    font-size: 16px;
  }
  
  .capacity-description {
    font-size: 12px;
  }
  
  .contact-item {
    padding: 6px 10px;
    gap: 8px;
  }
  
  .contact-icon {
    width: 24px;
    height: 24px;
    font-size: 14px;
  }
  
  .contact-label {
    font-size: 11px;
  }
  
  .contact-link {
    font-size: 14px;
  }
  
  .location-tag, .address-tag {
    padding: 8px 12px;
    font-size: 13px;
    
    svg {
      width: 12px;
      height: 12px;
    }
  }
  
  .maps-link-btn {
    padding: 8px 12px;
    font-size: 13px;
    gap: 8px;
    
    svg {
      width: 12px;
      height: 12px;
    }
  }
}
</style> 