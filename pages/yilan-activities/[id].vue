<template>
  <div class="activity-detail">
    <!-- 載入狀態 -->
    <div v-if="loading" class="loading-container">
      <div class="loading-spinner"></div>
      <p class="loading-text">載入活動資訊中...</p>
    </div>

    <!-- 找不到活動 -->
    <div v-else-if="!activity" class="not-found-container">
      <div class="not-found-icon">🎪</div>
      <h3 class="not-found-title">找不到此活動</h3>
      <p class="not-found-message">您查看的活動可能已結束或不存在</p>
      <NuxtLink to="/yilan-activities" class="back-to-list-btn">返回活動列表</NuxtLink>
    </div>

    <!-- 活動詳情 -->
    <div v-else class="activity-content">
      <!-- 頂部導航 -->
      <div class="top-nav">
        <NuxtLink to="/yilan-activities" class="back-link">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 16 16">
            <path fill-rule="evenodd" d="M15 8a.5.5 0 0 0-.5-.5H2.707l3.147-3.146a.5.5 0 1 0-.708-.708l-4 4a.5.5 0 0 0 0 .708l4 4a.5.5 0 0 0 .708-.708L2.707 8.5H14.5A.5.5 0 0 0 15 8"/>
          </svg>
          <span>返回活動列表</span>
        </NuxtLink>
        
        <div class="breadcrumb-nav">
          <NuxtLink to="/" class="breadcrumb-item">首頁</NuxtLink>
          <span class="breadcrumb-separator">/</span>
          <NuxtLink to="/yilan-activities" class="breadcrumb-item">宜蘭活動總匯</NuxtLink>
          <span class="breadcrumb-separator">/</span>
          <span class="breadcrumb-current">{{ activity.title }}</span>
        </div>
      </div>

      <!-- 主要內容 -->
      <div class="main-content">
        <!-- 活動標題區 -->
        <div class="activity-header">
          <div class="activity-info">
            <h1 class="activity-title">{{ activity.title }}</h1>
            <div class="activity-meta">
              <span v-if="activity.activity_type" class="activity-type-tag">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                  <path d="M8 4.754a3.246 3.246 0 1 0 0 6.492 3.246 3.246 0 0 0 0-6.492M5.754 8a2.246 2.246 0 1 1 4.492 0 2.246 2.246 0 0 1-4.492 0"/>
                  <path d="M9.796 1.343c-.527-1.79-3.065-1.79-3.592 0l-.094.319a.873.873 0 0 1-1.255.52l-.292-.16c-1.64-.892-3.433.902-2.54 2.541l.159.292a.873.873 0 0 1-.52 1.255l-.319.094c-1.79.527-1.79 3.065 0 3.592l.319.094a.873.873 0 0 1 .52 1.255l-.16.292c-.892 1.64.901 3.434 2.541 2.54l.292-.159a.873.873 0 0 1 1.255.52l.094.319c.527 1.79 3.065 1.79 3.592 0l.094-.319a.873.873 0 0 1 1.255-.52l.292.16c1.64.893 3.434-.902 2.54-2.541l-.159-.292a.873.873 0 0 1 .52-1.255l.319-.094c1.79-.527 1.79-3.065 0-3.592l-.319-.094a.873.873 0 0 1-.52-1.255l.16-.292c.893-1.64-.902-3.433-2.541-2.54l-.292.159a.873.873 0 0 1-1.255-.52zm-2.633.283c.246-.835 1.428-.835 1.674 0l.094.319a1.873 1.873 0 0 0 2.693 1.115l.291-.16c.764-.415 1.6.42 1.184 1.185l-.159.292a1.873 1.873 0 0 0 1.116 2.692l.318.094c.835.246.835 1.428 0 1.674l-.319.094a1.873 1.873 0 0 0-1.115 2.693l.16.291c.415.764-.42 1.6-1.185 1.184l-.291-.159a1.873 1.873 0 0 0-2.693 1.116l-.094.318c-.246.835-1.428.835-1.674 0l-.094-.319a1.873 1.873 0 0 0-2.692-1.115l-.292.16c-.764.415-1.6-.42-1.184-1.185l.159-.291A1.873 1.873 0 0 0 1.945 8.93l-.319-.094c-.835-.246-.835-1.428 0-1.674l.319-.094A1.873 1.873 0 0 0 3.06 4.377l-.16-.292c-.415-.764.42-1.6 1.185-1.184l.292.159a1.873 1.873 0 0 0 2.692-1.115z"/>
                </svg>
                {{ activity.activity_type }}
              </span>
              <div class="event-date-time">
                <div class="date-info">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                    <path d="M3.5 0a.5.5 0 0 1 .5.5V1h8V.5a.5.5 0 0 1 1 0V1h1a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V3a2 2 0 0 1 2-2h1V.5a.5.5 0 0 1 .5 0M1 4v10a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V4z"/>
                  </svg>
                  {{ formatDate(activity.event_date) }}
                </div>
                <div v-if="activity.event_time" class="time-info">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                    <path d="M8 3.5a.5.5 0 0 0-1 0V9a.5.5 0 0 0 .252.434l3.5 2a.5.5 0 0 0 .496-.868L8 8.71z"/>
                    <path d="M8 16A8 8 0 1 0 8 0a8 8 0 0 0 0 16m7-8A7 7 0 1 1 1 8a7 7 0 0 1 14 0"/>
                  </svg>
                  {{ activity.event_time }}
                </div>
              </div>
            </div>
          </div>
          
          <!-- 活動圖片 -->
          <div class="activity-image-container">
            <div v-if="activity.images && activity.images.length > 0" class="image-gallery">
              <!-- 主圖展示 -->
              <div class="main-image-container">
                <img 
                  :src="activity.images[currentMainImageIndex]" 
                  :alt="activity.title + ' - 主圖'" 
                  class="main-image" 
                  @click="openLightbox(currentMainImageIndex)"
                />
                
                <!-- 導航按鈕 -->
                <button 
                  v-if="activity.images.length > 1"
                  @click="prevMainImage"
                  class="image-nav-btn prev-main-btn"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" viewBox="0 0 16 16">
                    <path fill-rule="evenodd" d="M11.354 1.646a.5.5 0 0 1 0 .708L5.707 8l5.647 5.646a.5.5 0 0 1-.708.708l-6-6a.5.5 0 0 1 0-.708l6-6a.5.5 0 0 1 .708 0"/>
                  </svg>
                </button>
                
                <button 
                  v-if="activity.images.length > 1"
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
                      {{ currentMainImageIndex + 1 }} / {{ activity.images.length }}
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

              <!-- 縮略圖列表 -->
              <div v-if="activity.images.length > 1" class="thumbnail-list">
                <button
                  v-for="(image, index) in activity.images.slice(0, 5)"
                  :key="index"
                  @click="setMainImage(index)"
                  class="thumbnail-btn"
                  :class="{ active: currentMainImageIndex === index }"
                >
                  <img :src="image" :alt="'活動圖片 ' + (index + 1)" class="thumbnail-image" />
                </button>
                <button v-if="activity.images.length > 5" class="thumbnail-more-btn" @click="openLightbox(5)">
                  <span class="more-count">+{{ activity.images.length - 5 }}</span>
                </button>
              </div>
            </div>

            <!-- 沒有圖片的佔位符 -->
            <div v-else class="no-image-placeholder">
              <div class="placeholder-content">
                <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" fill="currentColor" viewBox="0 0 16 16">
                  <path d="M6.002 5.5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0"/>
                  <path d="M2.002 1a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V3a2 2 0 0 0-2-2h-12zm12 1a1 1 0 0 1 1 1v6.5l-3.777-1.947a.5.5 0 0 0-.577.093l-3.71 3.71-2.66-1.772a.5.5 0 0 0-.63.062L1.002 12V3a1 1 0 0 1 1-1h12z"/>
                </svg>
                <p class="placeholder-text">暫無活動圖片</p>
              </div>
            </div>
          </div>
        </div>

        <!-- 活動詳細資訊 -->
        <div class="activity-details">
          <!-- 活動描述 -->
          <div class="description-section">
            <h2 class="section-title">活動介紹</h2>
            <div class="description-content" v-html="formatDescription(activity.description)"></div>
          </div>

          <!-- 活動資訊卡片 -->
          <div class="info-cards">
            <!-- 基本資訊卡 -->
            <div class="info-card basic-info">
              <div class="card-header">
                <h3 class="card-title">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 16 16">
                    <path d="M8 16A8 8 0 1 0 8 0a8 8 0 0 0 0 16M7 6.5C7 7.328 6.552 8 6 8s-1-.672-1-1.5S5.448 5 6 5s1 .672 1 1.5M4.285 9.567a.5.5 0 0 1 .683.183A3.5 3.5 0 0 0 8 11.5a3.5 3.5 0 0 0 3.032-1.75.5.5 0 1 1 .866.5A4.5 4.5 0 0 1 8 12.5a4.5 4.5 0 0 1-3.898-2.25.5.5 0 0 1 .183-.683M10 8c-.552 0-1-.672-1-1.5S9.448 5 10 5s1 .672 1 1.5S10.552 8 10 8"/>
                  </svg>
                  基本資訊
                </h3>
              </div>
              <div class="card-content">
                <div class="info-row">
                  <div class="info-label">活動日期</div>
                  <div class="info-value">{{ formatDate(activity.event_date) }}</div>
                </div>
                <div v-if="activity.event_time" class="info-row">
                  <div class="info-label">活動時間</div>
                  <div class="info-value">{{ activity.event_time }}</div>
                </div>
                <div v-if="activity.location" class="info-row">
                  <div class="info-label">活動地點</div>
                  <div class="info-value">{{ activity.location }}</div>
                </div>
              </div>
            </div>

            <!-- 主辦單位卡 -->
            <div class="info-card organizer-info">
              <div class="card-header">
                <h3 class="card-title">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 16 16">
                    <path d="M15 14s1 0 1-1-1-4-5-4-5 3-5 4 1 1 1 1zm-7.978-1L7 12.996c.001-.264.167-1.03.76-1.72C8.312 10.629 9.282 10 11 10c1.717 0 2.687.63 3.24 1.276.593.69.758 1.457.76 1.72l-.008.002-.014.002zM11 7a2 2 0 1 0 0-4 2 2 0 0 0 0 4m3-2a3 3 0 1 1-6 0 3 3 0 0 1 6 0M6.936 9.28a6 6 0 0 0-1.23-.247A7 7 0 0 0 5 9c-4 0-5 3-5 4q0 1 1 1h4.216A2.24 2.24 0 0 1 5 13c0-1.01.377-2.042 1.09-2.904.243-.294.526-.569.846-.816M4.92 10A5.5 5.5 0 0 0 4 13H1c0-.26.164-1.03.76-1.724.545-.636 1.492-1.256 3.16-1.275ZM1.5 5.5a3 3 0 1 1 6 0 3 3 0 0 1-6 0m3-2a2 2 0 1 0 0 4 2 2 0 0 0 0-4"/>
                  </svg>
                  主辦單位
                </h3>
              </div>
              <div class="card-content">
                <div class="info-row">
                  <div class="info-label">單位名稱</div>
                  <div class="info-value">{{ activity.organizer_name }}</div>
                </div>
                <div v-if="activity.organizer_email" class="info-row">
                  <div class="info-label">聯絡信箱</div>
                  <div class="info-value">
                    <a :href="'mailto:' + activity.organizer_email" class="contact-link">
                      {{ activity.organizer_email }}
                    </a>
                  </div>
                </div>
                <div v-if="activity.organizer_phone" class="info-row">
                  <div class="info-label">聯絡電話</div>
                  <div class="info-value">
                    <a :href="'tel:' + activity.organizer_phone" class="contact-link">
                      {{ activity.organizer_phone }}
                    </a>
                  </div>
                </div>
                <div v-if="activity.contact_info" class="info-row contact-info-row">
                  <div class="info-label">其他聯絡資訊</div>
                  <div class="info-value">{{ activity.contact_info }}</div>
                </div>
              </div>
            </div>

            <!-- 狀態與分享卡 -->
            <div class="info-card status-share">
              <div class="card-header">
                <h3 class="card-title">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 16 16">
                    <path d="M10.067.87a2.89 2.89 0 0 0-4.134 0l-.622.638-.89-.011a2.89 2.89 0 0 0-2.924 2.924l.01.89-.636.622a2.89 2.89 0 0 0 0 4.134l.637.622-.011.89a2.89 2.89 0 0 0 2.924 2.924l.89-.01.622.636a2.89 2.89 0 0 0 4.134 0l.622-.637.89.011a2.89 2.89 0 0 0 2.924-2.924l-.01-.89.636-.622a2.89 2.89 0 0 0 0-4.134l-.637-.622.011-.89a2.89 2.89 0 0 0-2.924-2.924l-.89.01zm.287 5.984-3 3a.5.5 0 0 1-.708 0l-1.5-1.5a.5.5 0 1 1 .708-.708L7 8.793l2.646-2.647a.5.5 0 0 1 .708.708"/>
                  </svg>
                  狀態與分享
                </h3>
              </div>
              <div class="card-content">
                <div class="status-row">
                  <span class="status-badge approved">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                      <path d="M10.067.87a2.89 2.89 0 0 0-4.134 0l-.622.638-.89-.011a2.89 2.89 0 0 0-2.924 2.924l.01.89-.636.622a2.89 2.89 0 0 0 0 4.134l.637.622-.011.89a2.89 2.89 0 0 0 2.924 2.924l.89-.01.622.636a2.89 2.89 0 0 0 4.134 0l.622-.637.89.011a2.89 2.89 0 0 0 2.924-2.924l-.01-.89.636-.622a2.89 2.89 0 0 0 0-4.134l-.637-.622.011-.89a2.89 2.89 0 0 0-2.924-2.924l-.89.01zm.287 5.984-3 3a.5.5 0 0 1-.708 0l-1.5-1.5a.5.5 0 1 1 .708-.708L7 8.793l2.646-2.647a.5.5 0 0 1 .708.708"/>
                    </svg>
                    已審核通過
                  </span>
                </div>
                <div class="share-buttons">
                  <button @click="shareOnFacebook" class="share-btn facebook">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                      <path d="M16 8.049c0-4.446-3.582-8.05-8-8.05C3.58 0-.002 3.603-.002 8.05c0 4.017 2.926 7.347 6.75 7.951v-5.625h-2.03V8.05H6.75V6.275c0-2.017 1.195-3.131 3.022-3.131.876 0 1.791.157 1.791.157v1.98h-1.009c-.993 0-1.303.621-1.303 1.258v1.51h2.218l-.354 2.326H9.25V16c3.824-.604 6.75-3.934 6.75-7.951"/>
                    </svg>
                    Facebook
                  </button>
                  <button @click="shareOnLine" class="share-btn line">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                      <path d="M8 0c4.411 0 8 2.912 8 6.492 0 1.433-.555 2.723-1.715 3.994-1.678 1.932-5.431 4.285-6.285 4.645-.83.35-.734-.197-.696-.413l.003-.018.114-.685c.027-.204.055-.521-.026-.723-.09-.223-.444-.339-.704-.395C2.846 12.39 0 9.701 0 6.492 0 2.912 3.590 0 8 0"/>
                    </svg>
                    LINE
                  </button>
                  <button @click="copyLink" class="share-btn copy">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                      <path d="M4 1.5H3a2 2 0 0 0-2 2V14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V3.5a2 2 0 0 0-2-2h-1v1h1a1 1 0 0 1 1 1V14a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V3.5a1 1 0 0 1 1-1h1z"/>
                      <path d="M9.5 1a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-3a.5.5 0 0 1-.5-.5v-1a.5.5 0 0 1 .5-.5zm-3-1A1.5 1.5 0 0 0 5 1.5v1A1.5 1.5 0 0 0 6.5 4h3A1.5 1.5 0 0 0 11 2.5v-1A1.5 1.5 0 0 0 9.5 0z"/>
                    </svg>
                    複製連結
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 圖片燈箱 -->
    <div v-if="showLightbox" class="lightbox-overlay" @click="closeLightbox">
      <div class="lightbox-container" @click.stop>
        <!-- 關閉按鈕 -->
        <button class="lightbox-close" @click="closeLightbox">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" viewBox="0 0 16 16">
            <path d="M2.146 2.854a.5.5 0 1 1 .708-.708L8 7.293l5.146-5.147a.5.5 0 0 1 .708.708L8.707 8l5.147 5.146a.5.5 0 0 1-.708.708L8 8.707l-5.146 5.147a.5.5 0 0 1-.708-.708L7.293 8z"/>
          </svg>
        </button>

        <!-- 主要圖片 -->
        <div class="lightbox-image-container">
          <img 
            v-if="activity?.images?.[lightboxImageIndex]"
            :src="activity.images[lightboxImageIndex]" 
            :alt="activity.title + ' - 圖片 ' + (lightboxImageIndex + 1)"
            class="lightbox-image"
            @click.stop
          />
        </div>

        <!-- 導航按鈕 -->
        <button 
          v-if="activity?.images?.length > 1"
          class="lightbox-nav prev" 
          @click="prevLightboxImage"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" fill="currentColor" viewBox="0 0 16 16">
            <path fill-rule="evenodd" d="M11.354 1.646a.5.5 0 0 1 0 .708L5.707 8l5.647 5.646a.5.5 0 0 1-.708.708l-6-6a.5.5 0 0 1 0-.708l6-6a.5.5 0 0 1 .708 0"/>
          </svg>
        </button>

        <button 
          v-if="activity?.images?.length > 1"
          class="lightbox-nav next" 
          @click="nextLightboxImage"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" fill="currentColor" viewBox="0 0 16 16">
            <path fill-rule="evenodd" d="M4.646 1.646a.5.5 0 0 1 .708 0l6 6a.5.5 0 0 1 0 .708l-6 6a.5.5 0 0 1-.708-.708L10.293 8 4.646 2.354a.5.5 0 0 1 0-.708"/>
          </svg>
        </button>

        <!-- 圖片資訊 -->
        <div class="lightbox-info">
          <div class="lightbox-counter">
            {{ lightboxImageIndex + 1 }} / {{ activity?.images?.length || 0 }}
          </div>
          <div class="lightbox-title">{{ activity?.title }}</div>
        </div>

        <!-- 縮略圖導航 -->
        <div v-if="activity?.images?.length > 1" class="lightbox-thumbnails">
          <button
            v-for="(image, index) in activity.images"
            :key="index"
            class="lightbox-thumbnail"
            :class="{ active: index === lightboxImageIndex }"
            @click="lightboxImageIndex = index"
          >
            <img :src="image" :alt="'縮圖 ' + (index + 1)" />
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
const route = useRoute()
const activity = ref(null)
const loading = ref(true)
const currentMainImageIndex = ref(0)
const showLightbox = ref(false)
const lightboxImageIndex = ref(0)

const fetchActivity = async () => {
  try {
    loading.value = true
    const response = await $fetch(`/api/yilan-activities/${route.params.id}`)

    // 只顯示已通過審核的活動
    if (response.data.status !== 'approved') {
      activity.value = null
      return
    }

    activity.value = response.data
  } catch (error) {
    console.error('Failed to fetch activity:', error)
    activity.value = null
  } finally {
    loading.value = false
  }
}

const formatDate = (dateString) => {
  const date = new Date(dateString)
  return date.toLocaleDateString('zh-TW', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long'
  })
}

const formatDateTime = (dateString) => {
  const date = new Date(dateString)
  return date.toLocaleString('zh-TW')
}

const formatDescription = (description) => {
  if (!description) return ''
  return description.replace(/\n/g, '<br>')
}

// 圖片相關函數
const prevMainImage = () => {
  if (!activity.value?.images?.length) return
  currentMainImageIndex.value = 
    currentMainImageIndex.value === 0 
      ? activity.value.images.length - 1 
      : currentMainImageIndex.value - 1
}

const nextMainImage = () => {
  if (!activity.value?.images?.length) return
  currentMainImageIndex.value = 
    currentMainImageIndex.value === activity.value.images.length - 1 
      ? 0 
      : currentMainImageIndex.value + 1
}

const setMainImage = (index) => {
  currentMainImageIndex.value = index
}

const openLightbox = (index) => {
  if (activity.value?.images?.length) {
    lightboxImageIndex.value = index
    showLightbox.value = true
    // 防止背景滾動
    document.body.style.overflow = 'hidden'
  }
}

const closeLightbox = () => {
  showLightbox.value = false
  // 恢復背景滾動
  document.body.style.overflow = ''
}

const prevLightboxImage = () => {
  if (!activity.value?.images?.length) return
  lightboxImageIndex.value = 
    lightboxImageIndex.value === 0 
      ? activity.value.images.length - 1 
      : lightboxImageIndex.value - 1
}

const nextLightboxImage = () => {
  if (!activity.value?.images?.length) return
  lightboxImageIndex.value = 
    lightboxImageIndex.value === activity.value.images.length - 1 
      ? 0 
      : lightboxImageIndex.value + 1
}

// 鍵盤事件處理
const handleKeydown = (event) => {
  if (!showLightbox.value) return
  
  switch (event.key) {
    case 'Escape':
      closeLightbox()
      break
    case 'ArrowLeft':
      prevLightboxImage()
      break
    case 'ArrowRight':
      nextLightboxImage()
      break
  }
}

// 分享功能
const shareOnFacebook = () => {
  const url = encodeURIComponent(window.location.href)
  const title = encodeURIComponent(activity.value.title)
  window.open(
    `https://www.facebook.com/sharer/sharer.php?u=${url}&t=${title}`,
    '_blank',
    'width=600,height=400'
  )
}

const shareOnLine = () => {
  const url = encodeURIComponent(window.location.href)
  const text = encodeURIComponent(`${activity.value.title} - 宜蘭活動總匯`)
  window.open(
    `https://social-plugins.line.me/lineit/share?url=${url}&text=${text}`,
    '_blank',
    'width=600,height=400'
  )
}

const copyLink = async () => {
  try {
    if (process.client) {
      await navigator.clipboard.writeText(window.location.href)
      alert('連結已複製到剪貼簿')
    }
  } catch (error) {
    console.error('Failed to copy link:', error)
    // 備用方案
    if (process.client) {
      const textArea = document.createElement('textarea')
      textArea.value = window.location.href
      document.body.appendChild(textArea)
      textArea.select()
      document.execCommand('copy')
      document.body.removeChild(textArea)
      alert('連結已複製到剪貼簿')
    }
  }
}

onMounted(() => {
  fetchActivity()
  // 添加鍵盤事件監聽
  document.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  // 清理事件監聽和樣式
  document.removeEventListener('keydown', handleKeydown)
  document.body.style.overflow = ''
})

// 動態設定頁面 SEO
watchEffect(() => {
  if (activity.value) {
    useHead({
      title: `${activity.value.title} | 宜蘭活動總匯`,
      meta: [
        { name: 'description', content: activity.value.description?.substring(0, 150) + '...' || '宜蘭活動介紹' },
        { property: 'og:title', content: activity.value.title },
        {
          property: 'og:description',
          content: activity.value.description?.substring(0, 150) + '...' || '宜蘭活動介紹'
        },
        {
          property: 'og:image',
          content: activity.value.images && activity.value.images.length ? activity.value.images[0] : ''
        }
      ]
    })
  }
})
</script>

<style scoped lang="scss">
// 基本樣式重置和變數
* {
  box-sizing: border-box;
}

.activity-detail {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Noto Sans', sans-serif;
  line-height: 1.6;
  color: #333;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  min-height: 100vh;
  padding: 20px;
}

// 載入狀態
.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 60vh;
  text-align: center;
  color: white;
}

.loading-spinner {
  width: 50px;
  height: 50px;
  border: 4px solid rgba(255, 255, 255, 0.3);
  border-left: 4px solid #fff;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 20px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.loading-text {
  font-size: 18px;
  margin: 0;
}

// 找不到活動狀態
.not-found-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 60vh;
  text-align: center;
  color: white;
}

.not-found-icon {
  font-size: 4rem;
  margin-bottom: 20px;
}

.not-found-title {
  font-size: 2rem;
  margin-bottom: 15px;
  font-weight: 700;
}

.not-found-message {
  font-size: 1.1rem;
  margin-bottom: 30px;
  opacity: 0.9;
}

.back-to-list-btn {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  padding: 12px 24px;
  background: rgba(255, 255, 255, 0.2);
  color: white;
  text-decoration: none;
  border-radius: 25px;
  font-weight: 600;
  border: 2px solid rgba(255, 255, 255, 0.3);
  transition: all 0.3s ease;

  &:hover {
    background: rgba(255, 255, 255, 0.3);
    border-color: rgba(255, 255, 255, 0.5);
    text-decoration: none;
    color: white;
    transform: translateY(-2px);
  }
}

// 活動內容主要區域
.activity-content {
  max-width: 1200px;
  margin: 0 auto;
  background: white;
  border-radius: 24px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  animation: slideUp 0.6s ease-out;
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

// 頂部導航
.top-nav {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 30px;
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
  border-bottom: 1px solid #dee2e6;
}

.back-link {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #495057;
  text-decoration: none;
  font-weight: 600;
  transition: all 0.3s ease;

  &:hover {
    color: #007bff;
    text-decoration: none;
    transform: translateX(-3px);
  }

  svg {
    transition: transform 0.3s ease;
  }

  &:hover svg {
    transform: translateX(-2px);
  }
}

.breadcrumb-nav {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.9rem;
}

.breadcrumb-item {
  color: #495057;
  text-decoration: none;
  transition: color 0.2s ease;

  &:hover {
    color: #007bff;
  }
}

.breadcrumb-separator {
  color: #6c757d;
}

.breadcrumb-current {
  color: #007bff;
  font-weight: 600;
}

// 主要內容區
.main-content {
  padding: 0;
}

// 活動標題區
.activity-header {
  padding: 40px 30px;
  border-bottom: 1px solid #dee2e6;
}

.activity-info {
  margin-bottom: 30px;
}

.activity-title {
  font-size: 2.5rem;
  font-weight: 700;
  color: #2c3e50;
  margin-bottom: 20px;
  line-height: 1.2;
}

.activity-meta {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 15px;
}

.activity-type-tag {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-radius: 20px;
  font-size: 0.9rem;
  font-weight: 600;
  box-shadow: 0 2px 8px rgba(102, 126, 234, 0.3);
}

.event-date-time {
  display: flex;
  gap: 20px;
}

.date-info, .time-info {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #495057;
  font-weight: 500;

  svg {
    color: #007bff;
  }
}

// 圖片相關樣式
.activity-image-container {
  margin-top: 30px;
}

.image-gallery {
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
}

.main-image-container {
  position: relative;
  height: 400px;
  overflow: hidden;
}

.main-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  cursor: pointer;
  transition: transform 0.3s ease;

  &:hover {
    transform: scale(1.05);
  }
}

.image-nav-btn {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  width: 50px;
  height: 50px;
  background: rgba(255, 255, 255, 0.9);
  border: none;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);

  &:hover {
    background: white;
    transform: translateY(-50%) scale(1.1);
  }

  svg {
    color: #495057;
  }
}

.prev-main-btn {
  left: 20px;
}

.next-main-btn {
  right: 20px;
}

.image-overlay {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: linear-gradient(to top, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0) 100%);
  padding: 20px;
}

.image-info {
  display: flex;
  align-items: center;
  justify-content: space-between;
  color: white;
}

.image-count {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
}

.fullscreen-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  background: rgba(255, 255, 255, 0.2);
  color: white;
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 20px;
  padding: 8px 12px;
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    background: rgba(255, 255, 255, 0.3);
    border-color: rgba(255, 255, 255, 0.5);
  }
}

// 縮略圖
.thumbnail-list {
  display: flex;
  gap: 10px;
  padding: 15px;
  background: #f8f9fa;
  border-top: 1px solid #dee2e6;
}

.thumbnail-btn {
  width: 80px;
  height: 60px;
  border: 3px solid transparent;
  border-radius: 8px;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover, &.active {
    border-color: #007bff;
    transform: scale(1.05);
  }
}

.thumbnail-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.thumbnail-more-btn {
  width: 80px;
  height: 60px;
  border: 2px dashed #dee2e6;
  border-radius: 8px;
  background: #f8f9fa;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    border-color: #007bff;
    background: #e7f1ff;
  }
}

.more-count {
  font-weight: 600;
  color: #495057;
}

// 沒有圖片佔位符
.no-image-placeholder {
  height: 300px;
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2px dashed #dee2e6;
}

.placeholder-content {
  text-align: center;
  color: #adb5bd;
}

.placeholder-content svg {
  margin-bottom: 15px;
}

.placeholder-text {
  font-size: 1.1rem;
  font-weight: 500;
  margin: 0;
}

// 活動詳細資訊區
.activity-details {
  padding: 40px 30px;
}

.description-section {
  margin-bottom: 40px;
}

.section-title {
  font-size: 1.75rem;
  font-weight: 700;
  color: #2c3e50;
  margin-bottom: 20px;
  position: relative;

  &::after {
    content: '';
    position: absolute;
    left: 0;
    bottom: -8px;
    width: 60px;
    height: 3px;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    border-radius: 2px;
  }
}

.description-content {
  font-size: 1.1rem;
  line-height: 1.8;
  color: #495057;
}

// 資訊卡片
.info-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
  gap: 30px;
}

.info-card {
  background: white;
  border-radius: 16px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  overflow: hidden;
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-5px);
    box-shadow: 0 8px 30px rgba(0, 0, 0, 0.12);
  }
}

.card-header {
  padding: 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.card-title {
  display: flex;
  align-items: center;
  gap: 10px;
  margin: 0;
  font-size: 1.2rem;
  font-weight: 600;
}

.card-content {
  padding: 25px;
}

.info-row {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 15px;
  padding-bottom: 15px;
  border-bottom: 1px solid #f1f3f4;

  &:last-child {
    margin-bottom: 0;
    padding-bottom: 0;
    border-bottom: none;
  }
}

.contact-info-row {
  flex-direction: column;
  align-items: flex-start;
  
  .info-label {
    margin-bottom: 5px;
  }
}

.info-label {
  font-weight: 600;
  color: #495057;
  font-size: 0.95rem;
}

.info-value {
  color: #6c757d;
  text-align: right;
  max-width: 60%;
  word-wrap: break-word;

  .contact-info-row & {
    text-align: left;
    max-width: 100%;
  }
}

.contact-link {
  color: #007bff;
  text-decoration: none;
  transition: color 0.2s ease;

  &:hover {
    color: #0056b3;
    text-decoration: underline;
  }
}

// 狀態與分享
.status-row {
  margin-bottom: 20px;
  text-align: center;
}

.status-badge {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  background: linear-gradient(135deg, #28a745 0%, #20c997 100%);
  color: white;
  border-radius: 25px;
  font-weight: 600;
  box-shadow: 0 3px 12px rgba(40, 167, 69, 0.3);
}

.share-buttons {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.share-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 12px;
  border: none;
  border-radius: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;

  &.facebook {
    background: #1877f2;
    color: white;

    &:hover {
      background: #166fe5;
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(24, 119, 242, 0.3);
    }
  }

  &.line {
    background: #06c755;
    color: white;

    &:hover {
      background: #05b84d;
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(6, 199, 85, 0.3);
    }
  }

  &.copy {
    background: #6c757d;
    color: white;

    &:hover {
      background: #5a6268;
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(108, 117, 125, 0.3);
    }
  }
}

// 燈箱樣式
.lightbox-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.95);
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
  animation: fadeIn 0.3s ease-out;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.lightbox-container {
  position: relative;
  width: 90vw;
  height: 90vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.lightbox-close {
  position: absolute;
  top: 20px;
  right: 20px;
  width: 50px;
  height: 50px;
  background: rgba(255, 255, 255, 0.2);
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-radius: 50%;
  color: white;
  cursor: pointer;
  z-index: 10001;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;

  &:hover {
    background: rgba(255, 255, 255, 0.3);
    border-color: rgba(255, 255, 255, 0.5);
    transform: scale(1.1);
  }
}

.lightbox-image-container {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 80px 0 120px;
}

.lightbox-image {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
  border-radius: 8px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.5);
  animation: zoomIn 0.3s ease-out;
}

@keyframes zoomIn {
  from {
    opacity: 0;
    transform: scale(0.8);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

.lightbox-nav {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  width: 60px;
  height: 60px;
  background: rgba(255, 255, 255, 0.2);
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-radius: 50%;
  color: white;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
  z-index: 10001;

  &:hover {
    background: rgba(255, 255, 255, 0.3);
    border-color: rgba(255, 255, 255, 0.5);
    transform: translateY(-50%) scale(1.1);
  }

  &.prev {
    left: 30px;
  }

  &.next {
    right: 30px;
  }
}

.lightbox-info {
  position: absolute;
  bottom: 80px;
  left: 50%;
  transform: translateX(-50%);
  text-align: center;
  color: white;
  z-index: 10001;
}

.lightbox-counter {
  font-size: 1.2rem;
  font-weight: 600;
  margin-bottom: 8px;
  background: rgba(0, 0, 0, 0.5);
  padding: 8px 16px;
  border-radius: 20px;
  backdrop-filter: blur(10px);
}

.lightbox-title {
  font-size: 1rem;
  opacity: 0.9;
  max-width: 400px;
  margin: 0 auto;
}

.lightbox-thumbnails {
  position: absolute;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  gap: 8px;
  max-width: 80vw;
  overflow-x: auto;
  padding: 10px;
  background: rgba(0, 0, 0, 0.3);
  border-radius: 25px;
  backdrop-filter: blur(10px);

  &::-webkit-scrollbar {
    height: 4px;
  }

  &::-webkit-scrollbar-track {
    background: rgba(255, 255, 255, 0.1);
    border-radius: 2px;
  }

  &::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.3);
    border-radius: 2px;
  }
}

.lightbox-thumbnail {
  flex-shrink: 0;
  width: 60px;
  height: 45px;
  border: 2px solid transparent;
  border-radius: 6px;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.3s ease;
  opacity: 0.6;

  &:hover {
    opacity: 0.8;
    transform: scale(1.05);
  }

  &.active {
    border-color: white;
    opacity: 1;
    transform: scale(1.05);
  }

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
}

// 響應式設計
@media (max-width: 768px) {
  .activity-detail {
    padding: 10px;
  }

  .top-nav {
    padding: 15px 20px;
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }

  .breadcrumb-nav {
    font-size: 0.8rem;
  }

  .activity-header {
    padding: 30px 20px;
  }

  .activity-title {
    font-size: 1.8rem;
  }

  .activity-meta {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }

  .event-date-time {
    flex-direction: column;
    gap: 10px;
  }

  .main-image-container {
    height: 250px;
  }

  .image-nav-btn {
    width: 40px;
    height: 40px;
  }

  .prev-main-btn {
    left: 10px;
  }

  .next-main-btn {
    right: 10px;
  }

  .activity-details {
    padding: 30px 20px;
  }

  .info-cards {
    grid-template-columns: 1fr;
    gap: 20px;
  }

  .info-row {
    flex-direction: column;
    align-items: flex-start;
    gap: 5px;
  }

  .info-value {
    text-align: left;
    max-width: 100%;
  }

  .thumbnail-list {
    gap: 8px;
    padding: 12px;
  }

  .thumbnail-btn, .thumbnail-more-btn {
    width: 60px;
    height: 45px;
  }

  .share-buttons {
    grid-template-columns: 1fr;
  }

  // 燈箱移動端優化
  .lightbox-close {
    width: 40px;
    height: 40px;
    top: 15px;
    right: 15px;
  }

  .lightbox-nav {
    width: 50px;
    height: 50px;

    &.prev {
      left: 15px;
    }

    &.next {
      right: 15px;
    }
  }

  .lightbox-info {
    bottom: 60px;
  }

  .lightbox-thumbnails {
    bottom: 15px;
    max-width: 95vw;
  }

  .lightbox-thumbnail {
    width: 50px;
    height: 38px;
  }
}

@media (max-width: 480px) {
  .activity-title {
    font-size: 1.5rem;
  }

  .section-title {
    font-size: 1.4rem;
  }

  .card-header {
    padding: 15px;
  }

  .card-content {
    padding: 20px;
  }

  .main-image-container {
    height: 200px;
  }

  .image-nav-btn {
    width: 35px;
    height: 35px;
  }

  // 燈箱超小螢幕優化
  .lightbox-close {
    width: 35px;
    height: 35px;
    top: 10px;
    right: 10px;
  }

  .lightbox-nav {
    width: 45px;
    height: 45px;

    &.prev {
      left: 10px;
    }

    &.next {
      right: 10px;
    }
  }

  .lightbox-counter {
    font-size: 1rem;
    padding: 6px 12px;
  }

  .lightbox-title {
    font-size: 0.9rem;
  }

  .lightbox-thumbnails {
    bottom: 10px;
    gap: 6px;
  }

  .lightbox-thumbnail {
    width: 45px;
    height: 34px;
  }
}
</style>
