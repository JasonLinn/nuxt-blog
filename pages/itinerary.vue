<template>
  <div class="itinerary-planner">
    <!-- 頁面標題 -->
    <header class="page-header">
      <div class="header-content">
        <h1 class="page-title">
          <Icon name="mdi:map-marker-path" class="title-icon" />
          宜蘭行程規劃
        </h1>
        <p class="page-subtitle">探索宜蘭的美景與美食，規劃您的完美旅程</p>
      </div>
    </header>

    <!-- 主要內容 -->
    <div class="main-content">
      <!-- 左側：分類篩選和地點列表 -->
      <div class="sidebar">
        <!-- 篩選器 -->
        <div class="filter-section">
          <div class="filter-header">
            <h3 class="filter-title">
              <Icon name="mdi:filter" />
              篩選地點
            </h3>
            <button
              @click="showSubmissionModal = true"
              class="btn-recommend-place"
              title="推薦新地點給其他旅客，需經管理員審核"
            >
              <Icon name="mdi:heart-plus" />
              推薦地點
            </button>
          </div>
          
          <!-- 分類篩選 -->
          <div class="category-filters">
            <button 
              v-for="category in categories" 
              :key="category.id"
              @click="toggleCategory(category.id)"
              :class="['category-btn', { active: selectedCategories.includes(category.id) }]"
            >
              <Icon :name="category.icon" />
              <span>{{ category.name }}</span>
              <span class="count">({{ getCategoryCount(category.id) }})</span>
            </button>
          </div>

          <!-- 搜尋框 -->
          <div class="search-section">
            <div class="search-input-group">
              <Icon name="mdi:magnify" class="search-icon" />
              <input
                v-model="searchQuery"
                type="text"
                placeholder="搜尋地點名稱..."
                class="search-input"
              />
            </div>
          </div>

          <!-- 其他篩選選項 -->
          <div class="additional-filters">
            <label class="filter-option">
              <input v-model="showFeaturedOnly" type="checkbox" />
              <span>只顯示精選地點</span>
            </label>
            
            <label class="filter-option">
              <input v-model="showPrivateOnly" type="checkbox" />
              <span>只顯示私房景點</span>
            </label>
          </div>
        </div>

        <!-- 地點列表 -->
        <div class="places-list">
          <h3 class="list-title">
            地點列表
            <span class="count">({{ filteredPlaces.length }})</span>
          </h3>
          
          <div v-if="loading" class="loading-state">
            <Icon name="eos-icons:loading" />
            <span>載入中...</span>
          </div>
          
          <div v-else-if="filteredPlaces.length === 0" class="empty-state">
            <Icon name="mdi:map-marker-off" />
            <p>沒有找到符合條件的地點</p>
          </div>
          
          <div v-else class="places-grid">
            <div 
              v-for="place in filteredPlaces" 
              :key="place.id"
              @click="selectPlace(place)"
              :class="['place-card', { selected: selectedPlace?.id === place.id }]"
            >
              <!-- 地點圖片 -->
              <div class="place-image">
                <img :src="getPlaceImage(place)" :alt="place.name" />
                <div class="place-badges">
                  <span v-if="place.is_featured" class="featured-badge">
                    <Icon name="mdi:star" />
                  </span>
                  <span v-if="place.is_private" class="private-badge">
                    <Icon name="mdi:lock" />
                  </span>
                </div>
              </div>

              <!-- 地點資訊 -->
              <div class="place-info">
                <h4 class="place-name">{{ place.name }}</h4>
                <div class="place-category">
                  <Icon :name="getCategoryIcon(place.category_id)" />
                  {{ getCategoryName(place.category_id) }}
                </div>
                
                <div v-if="place.rating" class="place-rating">
                  <Icon name="mdi:star" />
                  {{ place.rating }}
                  <span class="rating-count">({{ place.user_ratings_total || 0 }})</span>
                </div>
                
                <div class="place-address">
                  <Icon name="mdi:map-marker" />
                  {{ place.formatted_address }}
                </div>

                <!-- 行程操作按鈕 -->
                <div class="place-actions">
                  <button 
                    @click.stop="addToItinerary(place)"
                    :disabled="isInItinerary(place.id)"
                    class="btn-add"
                  >
                    <Icon :name="isInItinerary(place.id) ? 'mdi:check' : 'mdi:plus'" />
                    {{ isInItinerary(place.id) ? '已加入' : '加入行程' }}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 右側：地圖和行程規劃 -->
      <div class="main-panel">
        <!-- 行程總覽 -->
        <div class="itinerary-overview">
          <div class="overview-header">
            <h3 class="overview-title">
              <Icon name="mdi:calendar" />
              我的行程
            </h3>
            <div class="overview-actions">
              <select v-model="currentDay" class="day-selector">
                <option v-for="day in totalDays" :key="day" :value="day">
                  第 {{ day }} 天
                </option>
              </select>
              <button @click="addDay" class="btn-add-day">
                <Icon name="mdi:plus" />
                新增天數
              </button>
            </div>
          </div>

          <!-- 當前天數的行程 -->
          <div class="day-itinerary">
            <div v-if="getCurrentDayPlaces().length === 0" class="empty-day">
              <Icon name="mdi:calendar-plus" />
              <p>第 {{ currentDay }} 天還沒有安排行程</p>
              <span>從左側地點列表選擇想要造訪的地點</span>
            </div>
            
            <div v-else class="itinerary-timeline">
              <div 
                v-for="(item, index) in getCurrentDayPlaces()" 
                :key="item.id"
                class="timeline-item"
              >
                <div class="timeline-marker">
                  {{ index + 1 }}
                </div>
                
                <div class="timeline-content">
                  <div class="timeline-place">
                    <img :src="getPlaceImage(item.place)" :alt="item.place.name" />
                    <div class="place-details">
                      <h4>{{ item.place.name }}</h4>
                      <div class="place-meta">
                        <span>
                          <Icon :name="getCategoryIcon(item.place.category_id)" />
                          {{ getCategoryName(item.place.category_id) }}
                        </span>
                        <span v-if="item.duration_minutes">
                          <Icon name="mdi:clock" />
                          {{ item.duration_minutes }} 分鐘
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div class="timeline-actions">
                    <button @click="moveUp(item.id)" :disabled="index === 0" class="btn-move">
                      <Icon name="mdi:arrow-up" />
                    </button>
                    <button @click="moveDown(item.id)" :disabled="index === getCurrentDayPlaces().length - 1" class="btn-move">
                      <Icon name="mdi:arrow-down" />
                    </button>
                    <button @click="removeFromItinerary(item.id)" class="btn-remove">
                      <Icon name="mdi:delete" />
                    </button>
                  </div>
                </div>

                <!-- 路線連接線 -->
                <div v-if="index < getCurrentDayPlaces().length - 1" class="timeline-connector">
                  <Icon name="mdi:arrow-down" />
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 地圖容器 -->
        <div class="map-container">
          <div id="itinerary-map" class="map"></div>
          
          <!-- 地圖控制項 -->
          <div class="map-controls">
            <button @click="centerMap" class="btn-control">
              <Icon name="mdi:crosshairs-gps" />
            </button>
            <button @click="toggleMapType" class="btn-control">
              <Icon name="mdi:layers" />
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 行程儲存模態框 -->
    <div v-if="showSaveModal" class="modal-overlay" @click.self="showSaveModal = false">
      <div class="save-modal">
        <h3>儲存行程</h3>
        <form @submit.prevent="saveItinerary">
          <div class="form-group">
            <label>行程名稱</label>
            <input v-model="itineraryTitle" type="text" placeholder="請輸入行程名稱" required />
          </div>
          <div class="form-group">
            <label>行程描述</label>
            <textarea v-model="itineraryDescription" placeholder="描述這個行程的特色..."></textarea>
          </div>
          <div class="form-actions">
            <button type="button" @click="showSaveModal = false" class="btn-cancel">取消</button>
            <button type="submit" class="btn-save">儲存行程</button>
          </div>
        </form>
      </div>
    </div>

    <!-- 浮動儲存按鈕 -->
    <div v-if="itinerary.length > 0" class="floating-save">
      <button @click="showSaveModal = true" class="btn-save-float">
        <Icon name="mdi:content-save" />
        儲存行程
      </button>
    </div>

    <!-- 地點詳細資訊 Modal -->
    <div v-if="showPlaceModal" class="modal-overlay" @click.self="closePlaceModal">
      <div class="place-modal">
        <div class="modal-header">
          <h3 class="modal-title">地點詳細資訊</h3>
          <button @click="closePlaceModal" class="btn-close">
            <Icon name="mdi:close" />
          </button>
        </div>

        <div v-if="loadingPlaceDetails" class="modal-loading">
          <Icon name="mdi:loading" class="loading-spinner" />
          <p>載入地點資訊中...</p>
        </div>

        <div v-else-if="placeDetails" class="modal-content">
          <!-- 地點照片輪播 -->
          <div v-if="placeDetails.photos && placeDetails.photos.length > 0" class="place-photos">
            <div class="photo-carousel">
              <img 
                v-for="(photo, index) in placeDetails.photos.slice(0, 5)" 
                :key="index"
                :src="photo.photo_reference ? 
                  `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photoreference=${photo.photo_reference}&key=${config.public.googleMapsApiKey}` :
                  getPlaceImage(placeDetails)"
                :alt="`${placeDetails.name} 照片 ${index + 1}`"
                class="place-photo"
              />
            </div>
          </div>

          <!-- 基本資訊 -->
          <div class="place-info-section">
            <h4 class="place-name">{{ placeDetails.name }}</h4>
            
            <div v-if="placeDetails.rating" class="place-rating">
              <div class="rating-stars">
                <Icon 
                  v-for="star in 5" 
                  :key="star"
                  name="mdi:star"
                  :class="{ 'filled': star <= Math.floor(placeDetails.rating) }"
                />
              </div>
              <span class="rating-value">{{ placeDetails.rating }}</span>
              <span class="rating-count">({{ placeDetails.user_ratings_total || 0 }} 則評價)</span>
            </div>

            <div class="place-address">
              <Icon name="mdi:map-marker" />
              {{ placeDetails.formatted_address }}
            </div>

            <div v-if="placeDetails.phone" class="place-contact">
              <Icon name="mdi:phone" />
              <a :href="`tel:${placeDetails.phone}`">{{ placeDetails.phone }}</a>
            </div>

            <div v-if="placeDetails.website" class="place-contact">
              <Icon name="mdi:web" />
              <a :href="placeDetails.website" target="_blank" rel="noopener">官方網站</a>
            </div>

            <!-- 營業時間 -->
            <div v-if="placeDetails.opening_hours" class="opening-hours">
              <h5>營業時間</h5>
              <div class="hours-list">
                <div 
                  v-for="(period, index) in placeDetails.opening_hours.weekday_text" 
                  :key="index"
                  class="hours-item"
                >
                  {{ period }}
                </div>
              </div>
            </div>
          </div>

          <!-- 評價 -->
          <div v-if="placeDetails.reviews && placeDetails.reviews.length > 0" class="reviews-section">
            <h5>最新評價</h5>
            <div class="reviews-list">
              <div 
                v-for="(review, index) in placeDetails.reviews.slice(0, 3)" 
                :key="index"
                class="review-item"
              >
                <div class="review-header">
                  <div class="reviewer-info">
                    <img 
                      v-if="review.profile_photo_url"
                      :src="review.profile_photo_url"
                      :alt="review.author_name"
                      class="reviewer-avatar"
                    />
                    <div>
                      <div class="reviewer-name">{{ review.author_name }}</div>
                      <div class="review-rating">
                        <Icon 
                          v-for="star in 5" 
                          :key="star"
                          name="mdi:star"
                          :class="{ 'filled': star <= review.rating }"
                        />
                      </div>
                    </div>
                  </div>
                  <div class="review-time">{{ formatReviewTime(review.time) }}</div>
                </div>
                <p class="review-text">{{ review.text }}</p>
              </div>
            </div>
          </div>

          <!-- 操作按鈕 -->
          <div class="modal-actions">
            <button 
              @click="addToItinerary(placeDetails)"
              :disabled="isInItinerary(placeDetails.id)"
              class="btn-add-itinerary"
            >
              <Icon :name="isInItinerary(placeDetails.id) ? 'mdi:check' : 'mdi:plus'" />
              {{ isInItinerary(placeDetails.id) ? '已加入行程' : '加入行程' }}
            </button>
            <button @click="closePlaceModal" class="btn-close-modal">關閉</button>
          </div>
        </div>
      </div>
    </div>

    <!-- 推薦地點模態框 -->
    <div v-if="showSubmissionModal" class="modal-overlay" @click.self="showSubmissionModal = false">
      <div class="place-submission-modal">
        <!-- 模態框標題 -->
        <div class="modal-header">
          <h2 class="modal-title">
            <Icon name="mdi:heart-plus" />
            推薦新地點
          </h2>
          <button @click="showSubmissionModal = false" class="modal-close">
            <Icon name="mdi:close" />
          </button>
        </div>

        <!-- 模態框內容 -->
        <div class="modal-content">
          <div class="submission-notice">
            <Icon name="mdi:information" />
            <p>感謝您推薦新地點！您的推薦將經過管理員審核後公開。</p>
          </div>

          <form @submit.prevent="handlePlaceSubmission" class="submission-form">
            <!-- Google Maps 搜尋區域 -->
            <div class="form-section">
              <h3 class="section-title">
                <Icon name="mdi:google-maps" />
                Google Maps 搜尋
              </h3>
              <div class="google-search-container">
                <div class="search-input-group">
                  <Icon name="mdi:magnify" class="search-icon" />
                  <input
                    v-model="googleSearchQuery"
                    type="text"
                    placeholder="搜尋地點名稱或地址..."
                    class="search-input"
                    @input="handleGoogleSearch"
                  />
                  <button 
                    v-if="googleSearchQuery" 
                    @click="clearGoogleSearch" 
                    type="button"
                    class="clear-search"
                  >
                    <Icon name="mdi:close" />
                  </button>
                </div>
                
                <!-- 搜尋結果 -->
                <div v-if="googleSearchResults.length > 0" class="search-results">
                  <div class="search-results-header">
                    <span class="results-count">找到 {{ googleSearchResults.length }} 個地點</span>
                  </div>
                  <div 
                    v-for="result in googleSearchResults" 
                    :key="result.place_id"
                    @click="selectGooglePlaceForSubmission(result)"
                    class="search-result-item"
                  >
                    <div class="result-content">
                      <div class="result-name">{{ result.name }}</div>
                      <div class="result-address">{{ result.formatted_address || result.vicinity || '地址資訊不完整' }}</div>
                      <div class="result-meta">
                        <span v-if="result.rating" class="result-rating">
                          <Icon name="mdi:star" />
                          {{ result.rating }}
                        </span>
                        <span v-if="result.types && result.types.length > 0" class="result-types">
                          {{ result.types[0].replace(/_/g, ' ') }}
                        </span>
                      </div>
                    </div>
                    <Icon name="mdi:chevron-right" class="result-arrow" />
                  </div>
                </div>
                
                <!-- 載入中 -->
                <div v-if="isGoogleSearching" class="search-loading">
                  <Icon name="eos-icons:loading" />
                  <span>搜尋中...</span>
                </div>

                <!-- 沒有結果時的提示 -->
                <div v-if="!isGoogleSearching && googleSearchQuery.length >= 3 && googleSearchResults.length === 0" class="search-no-results">
                  <Icon name="mdi:map-marker-off" />
                  <span>找不到相關地點，請嘗試其他關鍵字</span>
                </div>

                <!-- 除錯資訊 (開發時使用) -->
                <div v-if="googleSearchQuery.length >= 3" class="search-debug" style="margin-top: 8px; font-size: 10px; color: #9ca3af; padding: 4px; background: #f9fafb; border-radius: 4px;">
                  除錯: 查詢="{{googleSearchQuery}}" | 結果={{googleSearchResults.length}}個 | 搜尋中={{isGoogleSearching}}
                </div>
              </div>
            </div>

            <!-- 基本資訊 -->
            <div class="form-section">
              <h3 class="section-title">基本資訊</h3>
              
              <div class="form-row">
                <div class="form-group">
                  <label class="form-label required">地點名稱</label>
                  <input
                    v-model="submissionForm.name"
                    type="text"
                    class="form-input"
                    required
                    placeholder="請輸入地點名稱"
                  />
                </div>
              </div>
              
              <div class="form-row">
                <div class="form-group">
                  <label class="form-label">地點描述</label>
                  <textarea
                    v-model="submissionForm.description"
                    class="form-textarea"
                    rows="3"
                    placeholder="請簡述這個地點的特色和推薦理由..."
                  ></textarea>
                </div>
              </div>
              
              <div class="form-row">
                <div class="form-group">
                  <label class="form-label">詳細地址</label>
                  <input
                    v-model="submissionForm.formatted_address"
                    type="text"
                    class="form-input"
                    placeholder="請輸入完整地址"
                  />
                </div>
              </div>
            </div>

            <!-- 圖片預覽區域 -->
            <div v-if="submissionForm.photos && submissionForm.photos.length > 0" class="form-section">
              <h3 class="section-title">
                <Icon name="mdi:image-multiple" />
                自動載入的地點圖片
              </h3>
              
              <div class="photo-preview-grid">
                <div 
                  v-for="(photo, index) in submissionForm.photos" 
                  :key="index"
                  class="photo-preview-item"
                >
                  <img 
                    :src="photo" 
                    :alt="`地點圖片 ${index + 1}`"
                    class="photo-preview-image"
                    @error="handleImageError(index)"
                  />
                  <button
                    type="button"
                    @click="removePhoto(index)"
                    class="photo-remove-btn"
                    title="移除此圖片"
                  >
                    <Icon name="mdi:close" />
                  </button>
                  <div class="photo-preview-overlay">
                    <span class="photo-number">{{ index + 1 }}</span>
                  </div>
                </div>
              </div>
              
              <div class="photo-info">
                <Icon name="mdi:information" />
                <span>已自動從 Google Maps 載入 {{ submissionForm.photos.length }} 張圖片</span>
              </div>
            </div>

            <!-- 位置資訊 -->
            <div class="form-section">
              <h3 class="section-title">位置資訊</h3>
              
              <div class="form-row">
                <div class="form-group half">
                  <label class="form-label required">緯度</label>
                  <input
                    v-model.number="submissionForm.latitude"
                    type="number"
                    step="any"
                    class="form-input"
                    required
                    placeholder="例: 24.7736"
                  />
                </div>
                <div class="form-group half">
                  <label class="form-label required">經度</label>
                  <input
                    v-model.number="submissionForm.longitude"
                    type="number"
                    step="any"
                    class="form-input"
                    required
                    placeholder="例: 121.7741"
                  />
                </div>
              </div>
              
              <button
                type="button"
                @click="selectLocationOnMap"
                class="btn-map-select"
              >
                <Icon name="mdi:map-marker-radius" />
                從地圖選擇位置
              </button>
            </div>

            <!-- 分類和聯絡資訊 -->
            <div class="form-section">
              <h3 class="section-title">其他資訊</h3>
              
              <div class="form-row">
                <div class="form-group">
                  <label class="form-label required">地點分類</label>
                  <select v-model="submissionForm.category_id" class="form-select" required>
                    <option value="">請選擇分類</option>
                    <option v-for="category in categories" :key="category.id" :value="category.id">
                      {{ category.name }}
                    </option>
                  </select>
                </div>
              </div>
              
              <div class="form-row">
                <div class="form-group half">
                  <label class="form-label">官方網站</label>
                  <input
                    v-model="submissionForm.website"
                    type="url"
                    class="form-input"
                    placeholder="https://..."
                  />
                </div>
                <div class="form-group half">
                  <label class="form-label">聯絡電話</label>
                  <input
                    v-model="submissionForm.phone_number"
                    type="tel"
                    class="form-input"
                    placeholder="03-123-4567"
                  />
                </div>
              </div>
            </div>

            <!-- 提交按鈕 -->
            <div class="form-actions">
              <button 
                type="button" 
                @click="showSubmissionModal = false"
                class="btn-cancel"
              >
                取消
              </button>
              <button 
                type="submit"
                :disabled="isSubmitting"
                class="btn-submit"
              >
                <Icon name="eos-icons:loading" v-if="isSubmitting" />
                <Icon name="mdi:heart-plus" v-else />
                {{ isSubmitting ? '提交中...' : '推薦地點' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, watch } from 'vue';

// 取得運行時配置
const config = useRuntimeConfig();

// 直接在頁面中載入 Google Maps API
useHead({
  script: [
    {
      src: `https://maps.googleapis.com/maps/api/js?key=${config.public.GOOGLE_MAPS_API_KEY}&libraries=places,geometry,drawing`,
      defer: true,
      onload: () => {
        console.log('Google Maps API loaded via useHead');
        // 發送載入完成事件
        window.dispatchEvent(new Event('google-maps-loaded'));
      }
    }
  ]
});

// SEO 設定
useSeoMeta({
  title: '宜蘭行程規劃 - 探索在地美景與美食',
  description: '規劃您的宜蘭之旅！探索私房景點、在地美食、特色住宿，打造專屬的宜蘭旅遊行程。',
  keywords: '宜蘭旅遊,行程規劃,宜蘭景點,宜蘭美食,宜蘭住宿,旅遊規劃,宜蘭私房景點',
  ogTitle: '宜蘭行程規劃 - 探索在地美景與美食',
  ogDescription: '規劃您的宜蘭之旅！探索私房景點、在地美食、特色住宿，打造專屬的宜蘭旅遊行程。',
  ogImage: '/yilan-travel.jpg',
  twitterCard: 'summary_large_image'
});

// 狀態管理
const loading = ref(true);
const places = ref([]);
const categories = ref([]);
const selectedPlace = ref(null);
const selectedCategories = ref([]);
const searchQuery = ref('');
const showFeaturedOnly = ref(false);
const showPrivateOnly = ref(false);

// 行程相關
const itinerary = ref([]);
const currentDay = ref(1);
const totalDays = ref(1);
const showSaveModal = ref(false);
const itineraryTitle = ref('');
const itineraryDescription = ref('');

// 地點詳細資訊相關
const showPlaceModal = ref(false);
const placeDetails = ref(null);
const loadingPlaceDetails = ref(false);

// 新增地點相關
const showSubmissionModal = ref(false);

// 推薦地點表單資料
const submissionForm = reactive({
  name: '',
  description: '',
  formatted_address: '',
  latitude: null,
  longitude: null,
  category_id: '',
  website: '',
  phone_number: '',
  google_place_id: '',
  photos: []
});

// Google 搜尋相關
const googleSearchQuery = ref('');
const googleSearchResults = ref([]);
const isGoogleSearching = ref(false);
const isSubmitting = ref(false);

// 地圖相關
let map = null;
let markers = [];
let directionsService = null;
let directionsRenderer = null;

// 計算屬性
const filteredPlaces = computed(() => {
  if (!places.value || !Array.isArray(places.value)) {
    console.log('places.value 為空或不是陣列:', places.value);
    return [];
  }
  
  let filtered = places.value;

  // 分類篩選
  if (selectedCategories.value.length > 0) {
    filtered = filtered.filter(place => 
      selectedCategories.value.includes(place.category_id)
    );
  }

  // 搜尋篩選
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase();
    filtered = filtered.filter(place =>
      place.name.toLowerCase().includes(query) ||
      (place.formatted_address && place.formatted_address.toLowerCase().includes(query))
    );
  }

  // 精選地點篩選
  if (showFeaturedOnly.value) {
    filtered = filtered.filter(place => place.is_featured);
  }

  // 私房景點篩選
  if (showPrivateOnly.value) {
    filtered = filtered.filter(place => place.is_private);
  }

  console.log('filteredPlaces 計算結果:', {
    原始數量: places.value?.length || 0,
    過濾後數量: filtered.length,
    篩選條件: {
      selectedCategories: selectedCategories.value,
      searchQuery: searchQuery.value,
      showFeaturedOnly: showFeaturedOnly.value,
      showPrivateOnly: showPrivateOnly.value
    }
  });

  return filtered;
});

// 載入資料
const loadPlaces = async () => {
  try {
    console.log('開始載入地點資料...');
    console.log('Google Maps API Key:', config.public.GOOGLE_MAPS_API_KEY ? 'Set' : 'Not set');
    const response = await $fetch('/api/places');
    if (response.success) {
      console.log('地點資料載入成功，數量:', response.data?.length || 0);
      places.value = response.data;
      
      // 檢查前幾個地點的圖片資料
      if (response.data && response.data.length > 0) {
        console.log('前3個地點的圖片資料:');
        response.data.slice(0, 3).forEach((place, index) => {
          console.log(`地點 ${index + 1}: ${place.name}`, {
            hasPhotos: !!(place.photos && place.photos.length > 0),
            photosCount: place.photos?.length || 0,
            firstPhoto: place.photos?.[0]
          });
        });
      }
      
      // 檢查前幾個地點的座標資料  
      if (response.data && response.data.length > 0) {
        console.log('前3個地點的座標資料:');
        response.data.slice(0, 3).forEach((place, index) => {
          console.log(`地點 ${index + 1}: ${place.name}`, {
            latitude: place.latitude,
            longitude: place.longitude,
            type_lat: typeof place.latitude,
            type_lng: typeof place.longitude
          });
        });
      }
    } else {
      console.error('地點資料載入失敗: response.success 為 false');
    }
  } catch (error) {
    console.error('載入地點失敗:', error);
  }
};

const loadCategories = async () => {
  try {
    const response = await $fetch('/api/place-categories');
    if (response.success) {
      categories.value = response.data;
    }
  } catch (error) {
    console.error('載入分類失敗:', error);
  }
};

// 輔助函數
const getPlaceImage = (place) => {
  console.log('getPlaceImage called for:', place.name, {
    hasPhotos: !!(place.photos && place.photos.length > 0),
    photosCount: place.photos?.length || 0,
    firstPhoto: place.photos?.[0]
  });
  
  // 使用 Google Photos（目前資料庫中主要的圖片來源）
  if (place.photos && place.photos.length > 0) {
    const photo = place.photos[0];
    if (photo.photo_reference) {
      // 檢查是否有 API key
      const apiKey = config.public.GOOGLE_MAPS_API_KEY;
      if (apiKey) {
        const googleImageUrl = `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photoreference=${photo.photo_reference}&key=${apiKey}`;
        console.log('Using Google photo URL:', googleImageUrl);
        return googleImageUrl;
      } else {
        console.warn('Google Maps API Key not found');
      }
    } else {
      console.warn('No photo_reference found for photo:', photo);
    }
  }
  
  console.log('Using placeholder image for:', place.name);
  return '/placeholder-place.jpg';
};

const getCategoryName = (categoryId) => {
  const category = categories.value.find(c => c.id === categoryId);
  return category ? category.name : '未分類';
};

const getCategoryIcon = (categoryId) => {
  const category = categories.value.find(c => c.id === categoryId);
  return category ? category.icon : 'mdi:map-marker';
};

const getCategoryCount = (categoryId) => {
  return places.value.filter(p => p.category_id === categoryId).length;
};

// 篩選功能
const toggleCategory = (categoryId) => {
  const index = selectedCategories.value.indexOf(categoryId);
  if (index > -1) {
    selectedCategories.value.splice(index, 1);
  } else {
    selectedCategories.value.push(categoryId);
  }
};

// 地點選擇
const selectPlace = (place) => {
  selectedPlace.value = place;
  
  // 在地圖上突出顯示選中的地點
  if (map && place.latitude && place.longitude) {
    const lat = parseFloat(place.latitude);
    const lng = parseFloat(place.longitude);
    
    if (!isNaN(lat) && !isNaN(lng) && lat !== 0 && lng !== 0) {
      map.setCenter({ lat: lat, lng: lng });
      map.setZoom(15);
    }
  }
  
  // 顯示地點詳細資訊
  showPlaceDetails(place);
};

// 獲取並顯示地點詳細資訊
const showPlaceDetails = async (place) => {
  if (!place.google_place_id) {
    // 如果沒有 google_place_id，直接顯示基本資訊
    placeDetails.value = {
      ...place,
      photos: [],
      reviews: [],
      opening_hours: null,
      phone: null,
      website: null
    };
    showPlaceModal.value = true;
    return;
  }

  try {
    loadingPlaceDetails.value = true;
    showPlaceModal.value = true;
    
    // 調用 Google Places Details API
    const response = await $fetch('/api/google/places/details', {
      method: 'POST',
      body: {
        place_id: place.google_place_id,
        fields: [
          'name',
          'formatted_address',
          'geometry',
          'photos',
          'rating',
          'user_ratings_total',
          'reviews',
          'opening_hours',
          'formatted_phone_number',
          'website',
          'price_level',
          'business_status'
        ]
      }
    });

    if (response.success && response.data) {
      placeDetails.value = {
        ...place,
        ...response.data,
        photos: response.data.photos || [],
        reviews: response.data.reviews || [],
        opening_hours: response.data.opening_hours || null,
        phone: response.data.formatted_phone_number || null,
        website: response.data.website || null
      };
    } else {
      // 如果 API 調用失敗，顯示基本資訊
      placeDetails.value = {
        ...place,
        photos: [],
        reviews: [],
        opening_hours: null,
        phone: null,
        website: null
      };
    }
  } catch (error) {
    console.error('獲取地點詳細資訊失敗:', error);
    // 如果發生錯誤，顯示基本資訊
    placeDetails.value = {
      ...place,
      photos: [],
      reviews: [],
      opening_hours: null,
      phone: null,
      website: null
    };
  } finally {
    loadingPlaceDetails.value = false;
  }
};

// 關閉地點詳細資訊 modal
const closePlaceModal = () => {
  showPlaceModal.value = false;
  placeDetails.value = null;
};

// 格式化評價時間
const formatReviewTime = (timestamp) => {
  if (!timestamp) return '';
  
  try {
    const date = new Date(timestamp * 1000); // Google API 返回的是 Unix 時間戳
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) {
      return '昨天';
    } else if (diffDays < 7) {
      return `${diffDays} 天前`;
    } else if (diffDays < 30) {
      const weeks = Math.floor(diffDays / 7);
      return `${weeks} 週前`;
    } else if (diffDays < 365) {
      const months = Math.floor(diffDays / 30);
      return `${months} 個月前`;
    } else {
      const years = Math.floor(diffDays / 365);
      return `${years} 年前`;
    }
  } catch (error) {
    return '';
  }
};

// 行程管理
const addToItinerary = (place) => {
  if (isInItinerary(place.id)) return;
  
  const maxOrder = getCurrentDayPlaces().length;
  
  itinerary.value.push({
    id: Date.now(),
    place: place,
    day_number: currentDay.value,
    order_in_day: maxOrder + 1,
    duration_minutes: place.recommended_duration || 60
  });
  
  updateMap();
};

const removeFromItinerary = (itemId) => {
  const index = itinerary.value.findIndex(item => item.id === itemId);
  if (index > -1) {
    itinerary.value.splice(index, 1);
    reorderDay(currentDay.value);
    updateMap();
  }
};

const isInItinerary = (placeId) => {
  return itinerary.value.some(item => item.place.id === placeId);
};

const getCurrentDayPlaces = () => {
  return itinerary.value
    .filter(item => item.day_number === currentDay.value)
    .sort((a, b) => a.order_in_day - b.order_in_day);
};

const moveUp = (itemId) => {
  const item = itinerary.value.find(i => i.id === itemId);
  if (item && item.order_in_day > 1) {
    const prevItem = itinerary.value.find(i => 
      i.day_number === item.day_number && i.order_in_day === item.order_in_day - 1
    );
    
    if (prevItem) {
      [item.order_in_day, prevItem.order_in_day] = [prevItem.order_in_day, item.order_in_day];
      updateMap();
    }
  }
};

const moveDown = (itemId) => {
  const item = itinerary.value.find(i => i.id === itemId);
  const dayPlaces = getCurrentDayPlaces();
  
  if (item && item.order_in_day < dayPlaces.length) {
    const nextItem = itinerary.value.find(i => 
      i.day_number === item.day_number && i.order_in_day === item.order_in_day + 1
    );
    
    if (nextItem) {
      [item.order_in_day, nextItem.order_in_day] = [nextItem.order_in_day, item.order_in_day];
      updateMap();
    }
  }
};

const reorderDay = (dayNumber) => {
  const dayItems = itinerary.value
    .filter(item => item.day_number === dayNumber)
    .sort((a, b) => a.order_in_day - b.order_in_day);
  
  dayItems.forEach((item, index) => {
    item.order_in_day = index + 1;
  });
};

const addDay = () => {
  totalDays.value++;
  currentDay.value = totalDays.value;
};

// 推薦地點處理函數
let searchTimeout = null;

const handleGoogleSearch = async () => {
  // 清除之前的延遲執行
  if (searchTimeout) {
    clearTimeout(searchTimeout);
  }
  
  if (!googleSearchQuery.value || googleSearchQuery.value.length < 3) {
    googleSearchResults.value = [];
    return;
  }
  
  // 延遲 500ms 執行搜尋，避免過於頻繁的 API 呼叫
  searchTimeout = setTimeout(async () => {
    isGoogleSearching.value = true;
    console.log('🔍 開始 Google 搜尋:', googleSearchQuery.value);
    
    try {
      const response = await $fetch('/api/google/places/search', {
        method: 'POST',
        body: {
          query: googleSearchQuery.value + ' 宜蘭', // 加上地區限制
          region: 'tw',
          language: 'zh-TW',
          location: {
            lat: 24.7021,
            lng: 121.7378
          },
          radius: 50000 // 50公里範圍
        }
      });
      
      console.log('📡 Google API 完整回應:', response);
      
      if (response.success && response.data) {
        const results = response.data.results || response.data || [];
        googleSearchResults.value = results;
        
        console.log('✅ 處理後的搜尋結果:', {
          數量: results.length,
          前三個: results.slice(0, 3).map(r => ({
            名稱: r.name,
            地址: r.formatted_address || r.vicinity,
            place_id: r.place_id,
            評分: r.rating
          }))
        });
        
        // 檢查響應式資料是否正確更新
        console.log('📊 響應式資料狀態:', {
          googleSearchResults數量: googleSearchResults.value.length,
          isGoogleSearching: isGoogleSearching.value,
          googleSearchQuery: googleSearchQuery.value
        });
        
      } else {
        console.warn('⚠️ Google 搜尋無結果或失敗:', response);
        googleSearchResults.value = [];
      }
    } catch (error) {
      console.error('❌ Google 搜尋錯誤:', error);
      googleSearchResults.value = [];
    } finally {
      isGoogleSearching.value = false;
      console.log('🏁 搜尋完成，結果數量:', googleSearchResults.value.length);
    }
  }, 500);
};

const clearGoogleSearch = () => {
  googleSearchQuery.value = '';
  googleSearchResults.value = [];
  // 清除延遲執行的搜尋
  if (searchTimeout) {
    clearTimeout(searchTimeout);
    searchTimeout = null;
  }
  console.log('🧹 已清除 Google 搜尋');
};

const selectGooglePlaceForSubmission = async (place) => {
  try {
    // 填入基本資訊
    submissionForm.name = place.name;
    submissionForm.formatted_address = place.formatted_address;
    submissionForm.google_place_id = place.place_id;
    
    if (place.geometry?.location) {
      submissionForm.latitude = place.geometry.location.lat;
      submissionForm.longitude = place.geometry.location.lng;
    }
    
    // 獲取詳細資訊
    const detailsResponse = await $fetch('/api/google/places/details', {
      method: 'POST',
      body: {
        place_id: place.place_id,
        language: 'zh-TW',
        fields: [
          'name',
          'formatted_address',
          'geometry',
          'photos',
          'formatted_phone_number',
          'website',
          'rating',
          'price_level',
          'business_status'
        ]
      }
    });
    
    if (detailsResponse.success && detailsResponse.data) {
      const details = detailsResponse.data;
      
      // 填入更多詳細資訊
      if (details.website) submissionForm.website = details.website;
      if (details.formatted_phone_number) submissionForm.phone_number = details.formatted_phone_number;
      
      // 處理 Google Photos - 取前三張圖片並轉換為實際 URL
      if (details.photos && details.photos.length > 0) {
        console.log(`開始載入 ${Math.min(3, details.photos.length)} 張 Google 圖片...`);
        
        const photoUrls = await Promise.all(
          details.photos.slice(0, 3).map(async (photo, index) => {
            try {
              console.log(`載入第 ${index + 1} 張圖片，photo_reference:`, photo.photo_reference);
              
              // 使用 Google Places Photo API 取得圖片 URL
              const photoResponse = await $fetch('/api/google/places/photo', {
                method: 'POST',
                body: {
                  photo_reference: photo.photo_reference,
                  maxwidth: 800 // 設定適中的圖片寬度
                }
              });
              
              if (photoResponse.success && photoResponse.url) {
                console.log(`第 ${index + 1} 張圖片載入成功:`, photoResponse.url);
                return photoResponse.url;
              } else {
                console.warn(`第 ${index + 1} 張圖片載入失敗:`, photoResponse);
              }
            } catch (error) {
              console.error(`載入第 ${index + 1} 張圖片時發生錯誤:`, error);
            }
            return null;
          })
        );
        
        // 過濾掉失敗的請求，只保留成功的圖片 URL
        const validPhotoUrls = photoUrls.filter(url => url !== null);
        
        if (validPhotoUrls.length > 0) {
          // 將 Google 圖片 URL 添加到表單的 photos 陣列中
          submissionForm.photos = [...(submissionForm.photos || []), ...validPhotoUrls];
          console.log(`✅ 成功載入 ${validPhotoUrls.length} 張 Google 圖片到表單中`);
          console.log('所有圖片 URLs:', submissionForm.photos);
        } else {
          console.warn('⚠️ 沒有成功載入任何 Google 圖片');
        }
      }
    }
    
    // 清除搜尋結果
    googleSearchResults.value = [];
    googleSearchQuery.value = '';
    
    console.log('✅ Google 地點選擇完成，表單資料:', submissionForm);
    
  } catch (error) {
    console.error('選擇 Google 地點失敗:', error);
    alert('獲取地點詳細資訊失敗，請手動填入資料');
  }
};

const selectLocationOnMap = () => {
  alert('地圖選點功能開發中，請暫時手動輸入經緯度座標');
  // TODO: 實現地圖選點功能
};

const handlePlaceSubmission = async () => {
  if (isSubmitting.value) return;
  
  isSubmitting.value = true;
  try {
    const response = await $fetch('/api/places/submit', {
      method: 'POST',
      body: {
        ...submissionForm,
        submitted_by: 'user', // 可以後續加入用戶認證
        status: 'pending' // 需要審核
      }
    });
    
    if (response.success) {
      alert('感謝您的推薦！地點已成功提交，待管理員審核通過後將會顯示在地圖上。');
      
      // 重置表單
      Object.keys(submissionForm).forEach(key => {
        if (typeof submissionForm[key] === 'string') {
          submissionForm[key] = '';
        } else if (typeof submissionForm[key] === 'number') {
          submissionForm[key] = null;
        } else if (Array.isArray(submissionForm[key])) {
          submissionForm[key] = [];
        }
      });
      
      showSubmissionModal.value = false;
    } else {
      alert('提交失敗：' + (response.message || '未知錯誤'));
    }
  } catch (error) {
    console.error('提交地點失敗:', error);
    alert('提交失敗，請檢查網路連線後重試');
  } finally {
    isSubmitting.value = false;
  }
};

// 圖片處理函式
const removePhoto = (index) => {
  submissionForm.photos.splice(index, 1);
  console.log(`已移除第 ${index + 1} 張圖片，剩餘 ${submissionForm.photos.length} 張`);
};

const handleImageError = (index) => {
  console.error(`第 ${index + 1} 張圖片載入失敗，將從列表中移除`);
  removePhoto(index);
};

// 新增地點處理函數
const onPlaceSubmitted = (newPlace) => {
  console.log('地點提交成功:', newPlace);
  // 提示用戶地點已提交審核
  alert('感謝您的推薦！地點已提交審核，通過後將出現在地圖上。');
  
  // 可選：重新載入地點資料以包含新提交的地點（如果後端立即返回）
  // loadPlaces();
};

const onSelectLocation = () => {
  // 實作地圖選點功能
  console.log('開啟地圖選點模式');
  showSubmissionModal.value = false;
  alert('地圖選點功能將在下個版本推出\n目前請手動輸入座標');
  // TODO: 實作地圖點擊選取座標功能
  showSubmissionModal.value = true;
};

// 地圖功能
const initMap = async () => {
  console.log('initMap called, google available:', typeof google !== 'undefined');
  
  if (typeof google === 'undefined') {
    console.error('Google Maps API 未載入');
    return;
  }

  console.log('Creating map instance...');
  
  const mapElement = document.getElementById('itinerary-map');
  console.log('Map element found:', !!mapElement);
  
  if (!mapElement) {
    console.error('Map container element not found');
    return;
  }

  map = new google.maps.Map(mapElement, {
    center: { lat: 24.7021, lng: 121.7378 }, // 宜蘭中心點
    zoom: 11,
    mapTypeId: 'roadmap',
    styles: [
      {
        featureType: 'poi',
        elementType: 'labels',
        stylers: [{ visibility: 'off' }]
      }
    ]
  });

  console.log('Map created successfully:', !!map);

  directionsService = new google.maps.DirectionsService();
  directionsRenderer = new google.maps.DirectionsRenderer({
    suppressMarkers: true,
    polylineOptions: {
      strokeColor: '#3b82f6',
      strokeWeight: 4
    }
  });
  directionsRenderer.setMap(map);

  console.log('Map initialization completed');
  await updateMap();
};

// 創建地點詳細資訊的 InfoWindow 內容 - 支援點擊時重新載入最新 Google 資料
const createPlaceInfoWindowContent = async (place, forceRefresh = false) => {
  let placeDetails = place;
  let hasGoogleData = false;
  
  console.log('正在載入地點詳細資訊:', place.name, {
    hasGooglePlaceId: !!place.google_place_id,
    googlePlaceId: place.google_place_id,
    forceRefresh: forceRefresh
  });
  
  // 嘗試使用多種方式獲取最新的 Google 資料
  if (place.google_place_id) {
    try {
      console.log('使用 google_place_id 獲取最新詳細資訊...');
      const response = await $fetch('/api/google/places/details', {
        method: 'POST',
        body: {
          place_id: place.google_place_id,
          fields: [
            'name',
            'rating',
            'user_ratings_total',
            'reviews',
            'photos',
            'formatted_address',
            'formatted_phone_number',
            'website',
            'opening_hours',
            'price_level',
            'types',
            'business_status'
          ]
        }
      });

      if (response.success && response.data) {
        placeDetails = { ...place, ...response.data };
        hasGoogleData = true;
        console.log('成功獲取最新 Google 資料:', {
          rating: placeDetails.rating,
          reviewsCount: placeDetails.reviews?.length || 0,
          photosCount: placeDetails.photos?.length || 0,
          businessStatus: placeDetails.business_status
        });
      }
    } catch (error) {
      console.error('使用 google_place_id 獲取詳細資訊失敗:', error);
    }
  } 
  
  // 如果沒有 google_place_id 或者獲取失敗，嘗試使用地點名稱搜尋
  if (!hasGoogleData && place.name) {
    try {
      console.log('使用地點名稱搜尋最新 Google Places 資料...');
      const searchResponse = await $fetch('/api/google/places/search', {
        method: 'POST',
        body: {
          query: place.name,
          location: place.latitude && place.longitude ? {
            lat: parseFloat(place.latitude),
            lng: parseFloat(place.longitude)
          } : null,
          radius: 1000 // 1公里範圍內搜尋
        }
      });

      if (searchResponse.success && searchResponse.data && searchResponse.data.length > 0) {
        const foundPlace = searchResponse.data[0];
        console.log('找到匹配的 Google Place:', foundPlace.name);
        
        // 獲取詳細資訊
        const detailsResponse = await $fetch('/api/google/places/details', {
          method: 'POST',
          body: {
            place_id: foundPlace.place_id,
            fields: [
              'name',
              'rating',
              'user_ratings_total',
              'reviews',
              'photos',
              'formatted_address',
              'formatted_phone_number',
              'website',
              'opening_hours',
              'price_level',
              'types',
              'business_status'
            ]
          }
        });

        if (detailsResponse.success && detailsResponse.data) {
          placeDetails = { ...place, ...detailsResponse.data };
          hasGoogleData = true;
          console.log('成功獲取搜尋到的最新 Google 資料:', {
            rating: placeDetails.rating,
            reviewsCount: placeDetails.reviews?.length || 0,
            photosCount: placeDetails.photos?.length || 0
          });
        }
      }
    } catch (error) {
      console.error('搜尋地點失敗:', error);
    }
  }

  // 取得當前時間用於顯示資料新鮮度
  const now = new Date();
  const timeString = now.toLocaleTimeString('zh-TW', { 
    hour: '2-digit', 
    minute: '2-digit' 
  });

  // 生成照片 HTML
  const photosHtml = placeDetails.photos && placeDetails.photos.length > 0 
    ? placeDetails.photos.slice(0, 3).map(photo => {
        const photoUrl = photo.photo_reference 
          ? `https://maps.googleapis.com/maps/api/place/photo?maxwidth=150&photoreference=${photo.photo_reference}&key=${config.public.GOOGLE_MAPS_API_KEY}`
          : getPlaceImage(placeDetails);
        return `<img src="${photoUrl}" alt="${placeDetails.name}" style="width: 50px; height: 50px; object-fit: cover; border-radius: 4px; margin-right: 4px;">`;
      }).join('')
    : `<img src="${getPlaceImage(placeDetails)}" alt="${placeDetails.name}" style="width: 50px; height: 50px; object-fit: cover; border-radius: 4px;">`;

  // 生成評分 HTML
  const ratingHtml = placeDetails.rating 
    ? `
      <div style="display: flex; align-items: center; margin: 8px 0;">
        <div style="display: flex; margin-right: 8px;">
          ${Array.from({ length: 5 }, (_, i) => 
            `<span style="color: ${i < Math.floor(placeDetails.rating) ? '#fbbf24' : '#d1d5db'}; font-size: 14px;">★</span>`
          ).join('')}
        </div>
        <span style="font-weight: 600; margin-right: 4px;">${placeDetails.rating}</span>
        <span style="color: #6b7280; font-size: 12px;">(${placeDetails.user_ratings_total || 0} 則評價)</span>
        ${hasGoogleData ? `<span style="color: #10b981; font-size: 10px; margin-left: 8px;">● 最新資料 ${timeString}</span>` : ''}
      </div>
    `
    : hasGoogleData ? `
      <div style="margin: 8px 0;">
        <span style="color: #9ca3af; font-size: 11px;">暫無評分資料 ${timeString}</span>
      </div>
    ` : '';

  // 營業狀態 HTML
  const businessStatusHtml = placeDetails.business_status ? `
    <div style="margin: 4px 0;">
      <span style="font-size: 11px; padding: 2px 6px; border-radius: 3px; ${
        placeDetails.business_status === 'OPERATIONAL' ? 'background: #dcfce7; color: #166534;' :
        placeDetails.business_status === 'CLOSED_TEMPORARILY' ? 'background: #fef3c7; color: #92400e;' :
        placeDetails.business_status === 'CLOSED_PERMANENTLY' ? 'background: #fee2e2; color: #991b1b;' :
        'background: #f3f4f6; color: #4b5563;'
      }">
        ${
          placeDetails.business_status === 'OPERATIONAL' ? '營業中' :
          placeDetails.business_status === 'CLOSED_TEMPORARILY' ? '暫時關閉' :
          placeDetails.business_status === 'CLOSED_PERMANENTLY' ? '永久關閉' :
          '狀態未知'
        }
      </span>
    </div>
  ` : '';

  // 生成評論 HTML
  const reviewsHtml = placeDetails.reviews && placeDetails.reviews.length > 0
    ? `
      <div style="margin: 8px 0;">
        <strong style="font-size: 12px; color: #4b5563;">最新評價 ${hasGoogleData ? `(來自 Google ${timeString})` : '(本地資料)'}：</strong>
        ${placeDetails.reviews.slice(0, 2).map(review => `
          <div style="margin: 4px 0; padding: 4px; background: #f9fafb; border-radius: 4px; font-size: 11px;">
            <div style="display: flex; align-items: center; margin-bottom: 2px;">
              <strong style="font-size: 11px;">${review.author_name || '匿名用戶'}</strong>
              <div style="margin-left: 8px;">
                ${Array.from({ length: 5 }, (_, i) => 
                  `<span style="color: ${i < (review.rating || 0) ? '#fbbf24' : '#d1d5db'}; font-size: 10px;">★</span>`
                ).join('')}
              </div>
              ${review.relative_time_description ? `<span style="margin-left: 8px; color: #9ca3af; font-size: 9px;">${review.relative_time_description}</span>` : ''}
            </div>
            <p style="margin: 2px 0; line-height: 1.3; color: #4b5563;">${(review.text || '').length > 100 ? (review.text || '').substring(0, 100) + '...' : (review.text || '無評論內容')}</p>
          </div>
        `).join('')}
      </div>
    `
    : hasGoogleData ? `
      <div style="margin: 8px 0;">
        <span style="font-size: 11px; color: #9ca3af;">暫無 Google 評論資料 (${timeString})</span>
      </div>
    ` : `
      <div style="margin: 8px 0;">
        <span style="font-size: 11px; color: #9ca3af;">正在載入評論資料...</span>
      </div>
    `;

  // 聯絡資訊 HTML
  const contactHtml = placeDetails.formatted_phone_number || placeDetails.website
    ? `
      <div style="margin: 8px 0; font-size: 11px;">
        ${placeDetails.formatted_phone_number ? `<div><strong>電話:</strong> ${placeDetails.formatted_phone_number}</div>` : ''}
        ${placeDetails.website ? `<div><strong>網站:</strong> <a href="${placeDetails.website}" target="_blank" style="color: #3b82f6;">查看</a></div>` : ''}
      </div>
    `
    : '';

  // 價格等級 HTML
  const priceLevelHtml = placeDetails.price_level !== undefined ? `
    <div style="margin: 4px 0; font-size: 11px;">
      <strong>價格等級:</strong> ${'$'.repeat(placeDetails.price_level || 1)}
    </div>
  ` : '';

  return `
    <div style="max-width: 320px; font-family: system-ui;">
      <div style="margin-bottom: 8px;">
        <h4 style="margin: 0 0 4px 0; font-size: 16px; font-weight: 600; color: #1f2937;">${placeDetails.name}</h4>
        <p style="margin: 0; color: #6b7280; font-size: 12px;">${getCategoryName(placeDetails.category_id)}</p>
        ${businessStatusHtml}
        ${ratingHtml}
        ${priceLevelHtml}
      </div>
      
      <div style="margin: 8px 0;">
        <div style="display: flex; gap: 4px; margin-bottom: 8px;">
          ${photosHtml}
        </div>
      </div>
      
      ${reviewsHtml}
      ${contactHtml}
      
      <div style="margin-top: 8px; display: flex; gap: 6px; flex-wrap: wrap;">
        <button onclick="window.selectPlaceFromMap('${placeDetails.id}')" 
                style="background: #3b82f6; color: white; border: none; padding: 4px 8px; border-radius: 4px; font-size: 11px; cursor: pointer;">
          查看詳情
        </button>
        <button onclick="window.addPlaceToItinerary('${placeDetails.id}')" 
                style="background: #10b981; color: white; border: none; padding: 4px 8px; border-radius: 4px; font-size: 11px; cursor: pointer;">
          加入行程
        </button>
      </div>
    </div>
  `;
};

const updateMap = async () => {
  console.log('=== updateMap 開始執行 ===');
  
  if (!map) {
    console.log('地圖尚未初始化，跳過更新');
    return;
  }

  // 清除現有標記
  markers.forEach(marker => marker.setMap(null));
  markers = [];

  console.log('清除舊標記完成');

  // 顯示所有地點（不只是行程中的地點）
  console.log('原始地點數量 (places.value):', places.value?.length || 0);
  
  const allPlaces = filteredPlaces.value;
  console.log('過濾後地點數量 (filteredPlaces):', allPlaces?.length || 0);
  console.log('過濾條件:', {
    selectedCategories: selectedCategories.value,
    searchQuery: searchQuery.value,
    showFeaturedOnly: showFeaturedOnly.value,
    showPrivateOnly: showPrivateOnly.value
  });
  
  const dayPlaces = getCurrentDayPlaces();
  
  console.log('開始更新地圖標記...');
  console.log('總地點數量:', allPlaces.length);
  console.log('當天行程地點數量:', dayPlaces.length);
  
  // 為所有地點添加標記
  let validPlaceCount = 0;
  let invalidPlaceCount = 0;
  
  for (const [index, place] of allPlaces.entries()) {
    // 驗證地點的經緯度資料 - 支援字串和數字格式
    const lat = parseFloat(place.latitude);
    const lng = parseFloat(place.longitude);
    
    if (!place.latitude || !place.longitude || 
        isNaN(lat) || isNaN(lng) ||
        lat === 0 || lng === 0) {
      console.warn('跳過無效的地點座標:', place.name, {
        latitude: place.latitude,
        longitude: place.longitude,
        parsed_lat: lat,
        parsed_lng: lng,
        type_lat: typeof place.latitude,
        type_lng: typeof place.longitude
      });
      invalidPlaceCount++;
      continue;
    }
    
    validPlaceCount++;
    const isInItinerary = dayPlaces.some(item => item.place.id === place.id);
    
    const marker = new google.maps.Marker({
      position: { lat: lat, lng: lng },
      map: map,
      title: place.name,
      icon: {
        url: 'data:image/svg+xml,' + encodeURIComponent(`
          <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32">
            <circle cx="16" cy="16" r="14" fill="${isInItinerary ? '#10b981' : '#3b82f6'}" stroke="white" stroke-width="2"/>
            <text x="16" y="20" text-anchor="middle" fill="white" font-size="10" font-weight="bold">
              ${isInItinerary ? '✓' : '●'}
            </text>
          </svg>
        `),
        scaledSize: new google.maps.Size(32, 32),
        anchor: new google.maps.Point(16, 16)
      }
    });

    // 創建詳細的 InfoWindow
    const content = await createPlaceInfoWindowContent(place);
    const infoWindow = new google.maps.InfoWindow({
      content: content,
      maxWidth: 320
    });

    marker.addListener('click', () => {
      // 關閉其他 InfoWindow
      markers.forEach(m => {
        if (m.infoWindow) {
          m.infoWindow.close();
        }
      });
      infoWindow.open(map, marker);
    });

    // 保存 infoWindow 引用以便關閉
    marker.infoWindow = infoWindow;
    markers.push(marker);
  }

  // 繪製行程路線（只針對行程中的地點）
  if (dayPlaces.length > 1) {
    // 過濾出有效座標的地點
    const validDayPlaces = dayPlaces.filter(item => {
      const lat = parseFloat(item.place.latitude);
      const lng = parseFloat(item.place.longitude);
      return item.place.latitude && item.place.longitude &&
             !isNaN(lat) && !isNaN(lng) && lat !== 0 && lng !== 0;
    });
    
    if (validDayPlaces.length > 1) {
      const waypoints = validDayPlaces.slice(1, -1).map(item => ({
        location: { lat: parseFloat(item.place.latitude), lng: parseFloat(item.place.longitude) },
        stopover: true
      }));

      directionsService.route({
        origin: { lat: parseFloat(validDayPlaces[0].place.latitude), lng: parseFloat(validDayPlaces[0].place.longitude) },
        destination: { lat: parseFloat(validDayPlaces[validDayPlaces.length - 1].place.latitude), lng: parseFloat(validDayPlaces[validDayPlaces.length - 1].place.longitude) },
        waypoints: waypoints,
        travelMode: google.maps.TravelMode.DRIVING
      }, (result, status) => {
        if (status === 'OK') {
          directionsRenderer.setDirections(result);
        }
      });
    } else {
      // 如果沒有足夠的有效地點，清除之前的路線
      directionsRenderer.setDirections({ routes: [] });
    }
  } else {
    // 如果沒有路線，清除之前的路線
    directionsRenderer.setDirections({ routes: [] });
  }
  
  console.log('地圖更新完成統計:');
  console.log('- 有效地點:', validPlaceCount);
  console.log('- 無效地點:', invalidPlaceCount);
  console.log('- 總標記數量:', markers.length);
  
  // 如果有標記，調整地圖範圍以顯示所有標記
  if (markers.length > 0) {
    const bounds = new google.maps.LatLngBounds();
    let markerCount = 0;
    
    markers.forEach(marker => {
      if (marker.getPosition) {
        bounds.extend(marker.getPosition());
        markerCount++;
      }
    });
    
    console.log('設定地圖範圍，標記數:', markerCount);
    
    if (markerCount > 0) {
      map.fitBounds(bounds);
      
      // 如果只有一個標記，設定適當的縮放等級
      if (markerCount === 1) {
        setTimeout(() => {
          map.setZoom(15);
        }, 100);
      }
    }
  } else {
    console.log('沒有標記，使用預設中心點');
    map.setCenter({ lat: 24.7021, lng: 121.7378 });
    map.setZoom(11);
  }
};

const centerMap = () => {
  if (!map) return;
  
  const dayPlaces = getCurrentDayPlaces();
  
  // 過濾出有效座標的地點
  const validDayPlaces = dayPlaces.filter(item => {
    const lat = parseFloat(item.place.latitude);
    const lng = parseFloat(item.place.longitude);
    return item.place.latitude && item.place.longitude &&
           !isNaN(lat) && !isNaN(lng) && lat !== 0 && lng !== 0;
  });
  
  if (validDayPlaces.length === 0) {
    map.setCenter({ lat: 24.7021, lng: 121.7378 });
    map.setZoom(11);
    return;
  }

  const bounds = new google.maps.LatLngBounds();
  validDayPlaces.forEach(item => {
    bounds.extend({ lat: parseFloat(item.place.latitude), lng: parseFloat(item.place.longitude) });
  });
  
  map.fitBounds(bounds);
};

const toggleMapType = () => {
  if (!map) return;
  
  const currentType = map.getMapTypeId();
  map.setMapTypeId(currentType === 'roadmap' ? 'satellite' : 'roadmap');
};

// 行程儲存
const saveItinerary = async () => {
  try {
    const response = await $fetch('/api/itineraries', {
      method: 'POST',
      body: {
        title: itineraryTitle.value,
        description: itineraryDescription.value,
        days: totalDays.value,
        places: itinerary.value.map(item => ({
          place_id: item.place.id,
          day_number: item.day_number,
          order_in_day: item.order_in_day,
          duration_minutes: item.duration_minutes
        }))
      }
    });

    if (response.success) {
      showSaveModal.value = false;
      alert('行程已儲存成功！');
      
      // 重置表單
      itineraryTitle.value = '';
      itineraryDescription.value = '';
    }
  } catch (error) {
    console.error('儲存行程失敗:', error);
    alert('儲存失敗，請重試');
  }
};

// 監聽當前天數變化
watch(currentDay, () => {
  updateMap();
});

// 監聽地點資料變化
watch(places, (newPlaces) => {
  console.log('places 資料變化:', newPlaces?.length || 0);
  if (map && newPlaces && newPlaces.length > 0) {
    console.log('觸發地圖更新（因為地點資料變化）');
    updateMap();
  }
}, { immediate: false });

// 初始化
onMounted(async () => {
  console.log('Itinerary component mounted');
  
  // 添加全域函數供 InfoWindow 使用
  window.selectPlaceFromMap = (placeId) => {
    const place = places.value.find(p => p.id == placeId);
    if (place) {
      selectPlace(place);
    }
  };

  window.addPlaceToItinerary = (placeId) => {
    const place = places.value.find(p => p.id == placeId);
    if (place) {
      addToItinerary(place);
    }
  };

  // 重新整理地點 Google 資訊的全域函數

  
  try {
    await Promise.all([
      loadPlaces(),
      loadCategories()
    ]);
    
    console.log('Data loaded, checking for map element...');
    const mapElement = document.getElementById('itinerary-map');
    console.log('Map element found:', !!mapElement);
    
    // 等待 Google Maps API 載入
    if (typeof google !== 'undefined') {
      console.log('Google API already available, initializing map...');
      await initMap();
      
      // 初始化完成後，如果有地點資料，立即更新地圖
      if (places.value && places.value.length > 0) {
        console.log('地點資料已載入，立即更新地圖');
        await updateMap();
      }
    } else {
      console.log('Google API not available, waiting for load event...');
      // 監聽 Google Maps API 載入完成
      window.addEventListener('google-maps-loaded', async () => {
        console.log('Google Maps API load event received');
        await initMap();
        
        // 初始化完成後，如果有地點資料，立即更新地圖
        if (places.value && places.value.length > 0) {
          console.log('地點資料已載入，立即更新地圖');
          await updateMap();
        }
      });
    }
  } finally {
    loading.value = false;
  }
});
</script>

<style lang="scss" scoped>
.itinerary-planner {
  min-height: 100vh;
  background: #f8fafc;
}

.page-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 60px 0;
  text-align: center;
  
  .header-content {
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 24px;
    
    .page-title {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 16px;
      font-size: 36px;
      font-weight: 700;
      margin-bottom: 16px;
      
      .title-icon {
        font-size: 42px;
      }
    }
    
    .page-subtitle {
      font-size: 18px;
      opacity: 0.9;
      margin: 0;
    }
  }
}

.main-content {
  display: grid;
  grid-template-columns: 400px 1fr;
  gap: 24px;
  max-width: 1400px;
  margin: 0 auto;
  padding: 24px;
  min-height: calc(100vh - 200px);
}

.sidebar {
  background: white;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  height: fit-content;
  max-height: calc(100vh - 250px);
  display: flex;
  flex-direction: column;
}

.filter-section {
  padding: 24px;
  border-bottom: 1px solid #e5e7eb;
  
  .filter-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
    
    .filter-title {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 18px;
      font-weight: 600;
      margin: 0;
      color: #1f2937;
    }
    
    .btn-recommend-place {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 8px 16px;
      background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
      color: white;
      border: none;
      border-radius: 8px;
      font-size: 13px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s ease;
      box-shadow: 0 2px 4px rgba(245, 158, 11, 0.2);
      
      &:hover {
        background: linear-gradient(135deg, #d97706 0%, #b45309 100%);
        transform: translateY(-1px);
        box-shadow: 0 4px 8px rgba(245, 158, 11, 0.3);
      }
      
      &:active {
        transform: translateY(0);
      }
      
      svg {
        font-size: 14px;
      }
    }
  }
  
  .filter-title {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 18px;
    font-weight: 600;
    margin-bottom: 20px;
    color: #1f2937;
  }
  
  .category-filters {
    display: flex;
    flex-direction: column;
    gap: 8px;
    margin-bottom: 20px;
    
    .category-btn {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px 16px;
      border: 2px solid #e5e7eb;
      border-radius: 8px;
      background: white;
      cursor: pointer;
      transition: all 0.3s ease;
      text-align: left;
      
      &:hover {
        border-color: #3b82f6;
        background: #f8fafc;
      }
      
      &.active {
        border-color: #3b82f6;
        background: #eff6ff;
        color: #3b82f6;
      }
      
      svg {
        font-size: 18px;
      }
      
      .count {
        margin-left: auto;
        font-size: 12px;
        color: #6b7280;
      }
    }
  }
  
  .search-section {
    margin-bottom: 20px;
    
    .search-input-group {
      position: relative;
      
      .search-icon {
        position: absolute;
        left: 12px;
        top: 50%;
        transform: translateY(-50%);
        color: #9ca3af;
        font-size: 18px;
      }
      
      .search-input {
        width: 100%;
        padding: 12px 16px 12px 44px;
        border: 2px solid #e5e7eb;
        border-radius: 8px;
        font-size: 14px;
        transition: border-color 0.3s ease;
        
        &:focus {
          outline: none;
          border-color: #3b82f6;
        }
      }
    }
  }
  
  .additional-filters {
    .filter-option {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 12px;
      cursor: pointer;
      
      input[type="checkbox"] {
        width: 16px;
        height: 16px;
      }
      
      span {
        font-size: 14px;
        color: #374151;
      }
    }
  }
}

.places-list {
  flex: 1;
  overflow-y: auto;
  
  .list-title {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 20px 24px 16px;
    margin: 0;
    font-size: 16px;
    font-weight: 600;
    color: #1f2937;
    
    .count {
      font-size: 14px;
      color: #6b7280;
      background: #f3f4f6;
      padding: 4px 8px;
      border-radius: 12px;
    }
  }
  
  .loading-state,
  .empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 40px 20px;
    color: #6b7280;
    text-align: center;
    
    svg {
      font-size: 48px;
      margin-bottom: 12px;
    }
  }
  
  .places-grid {
    padding: 0 24px 24px;
    
    .place-card {
      border: 2px solid #e5e7eb;
      border-radius: 12px;
      overflow: hidden;
      margin-bottom: 16px;
      cursor: pointer;
      transition: all 0.3s ease;
      background: white;
      
      &:hover {
        border-color: #3b82f6;
        transform: translateY(-2px);
        box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
      }
      
      &.selected {
        border-color: #3b82f6;
        box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
      }
      
      .place-image {
        position: relative;
        height: 120px;
        overflow: hidden;
        
        img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        
        .place-badges {
          position: absolute;
          top: 8px;
          right: 8px;
          display: flex;
          gap: 4px;
          
          .featured-badge,
          .private-badge {
            background: rgba(0, 0, 0, 0.7);
            color: white;
            padding: 4px 6px;
            border-radius: 4px;
            font-size: 12px;
            display: flex;
            align-items: center;
            
            svg {
              font-size: 12px;
            }
          }
          
          .featured-badge {
            background: rgba(251, 191, 36, 0.9);
          }
          
          .private-badge {
            background: rgba(107, 114, 128, 0.9);
          }
        }
      }
      
      .place-info {
        padding: 16px;
        
        .place-name {
          font-size: 16px;
          font-weight: 600;
          color: #1f2937;
          margin-bottom: 8px;
          line-height: 1.4;
        }
        
        .place-category {
          display: flex;
          align-items: center;
          gap: 6px;
          color: #6b7280;
          font-size: 14px;
          margin-bottom: 6px;
        }
        
        .place-rating {
          display: flex;
          align-items: center;
          gap: 4px;
          color: #f59e0b;
          font-size: 14px;
          margin-bottom: 6px;
          
          .rating-count {
            color: #9ca3af;
            font-size: 12px;
          }
        }
        
        .place-address {
          display: flex;
          align-items: center;
          gap: 6px;
          color: #9ca3af;
          font-size: 12px;
          margin-bottom: 12px;
          line-height: 1.3;
        }
        
        .place-actions {
          .btn-add {
            display: flex;
            align-items: center;
            gap: 6px;
            width: 100%;
            padding: 8px 12px;
            background: #3b82f6;
            color: white;
            border: none;
            border-radius: 6px;
            font-size: 14px;
            font-weight: 600;
            cursor: pointer;
            transition: background 0.3s ease;
            justify-content: center;
            
            &:hover:not(:disabled) {
              background: #2563eb;
            }
            
            &:disabled {
              background: #10b981;
              cursor: not-allowed;
            }
          }
        }
      }
    }
  }
}

.main-panel {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.itinerary-overview {
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  
  .overview-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 24px;
    border-bottom: 1px solid #e5e7eb;
    
    .overview-title {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 20px;
      font-weight: 600;
      color: #1f2937;
      margin: 0;
    }
    
    .overview-actions {
      display: flex;
      gap: 12px;
      
      .day-selector {
        padding: 8px 12px;
        border: 2px solid #e5e7eb;
        border-radius: 6px;
        font-size: 14px;
        
        &:focus {
          outline: none;
          border-color: #3b82f6;
        }
      }
      
      .btn-add-day {
        display: flex;
        align-items: center;
        gap: 6px;
        padding: 8px 12px;
        background: #10b981;
        color: white;
        border: none;
        border-radius: 6px;
        font-size: 14px;
        font-weight: 600;
        cursor: pointer;
        
        &:hover {
          background: #059669;
        }
      }
    }
  }
  
  .day-itinerary {
    min-height: 200px;
    
    .empty-day {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 60px 20px;
      text-align: center;
      color: #6b7280;
      
      svg {
        font-size: 48px;
        margin-bottom: 16px;
        color: #d1d5db;
      }
      
      p {
        font-size: 16px;
        font-weight: 600;
        margin-bottom: 8px;
      }
      
      span {
        font-size: 14px;
      }
    }
    
    .itinerary-timeline {
      padding: 24px;
      
      .timeline-item {
        position: relative;
        display: flex;
        gap: 16px;
        margin-bottom: 20px;
        
        .timeline-marker {
          flex-shrink: 0;
          width: 36px;
          height: 36px;
          background: #3b82f6;
          color: white;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 600;
          font-size: 14px;
        }
        
        .timeline-content {
          flex: 1;
          background: #f8fafc;
          border-radius: 12px;
          padding: 16px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          
          .timeline-place {
            display: flex;
            gap: 12px;
            flex: 1;
            
            img {
              width: 60px;
              height: 60px;
              object-fit: cover;
              border-radius: 8px;
            }
            
            .place-details {
              h4 {
                font-size: 16px;
                font-weight: 600;
                color: #1f2937;
                margin-bottom: 8px;
              }
              
              .place-meta {
                display: flex;
                flex-direction: column;
                gap: 4px;
                
                span {
                  display: flex;
                  align-items: center;
                  gap: 4px;
                  color: #6b7280;
                  font-size: 12px;
                }
              }
            }
          }
          
          .timeline-actions {
            display: flex;
            flex-direction: column;
            gap: 4px;
            
            button {
              width: 32px;
              height: 32px;
              border: none;
              border-radius: 6px;
              cursor: pointer;
              display: flex;
              align-items: center;
              justify-content: center;
              font-size: 14px;
              
              &:disabled {
                opacity: 0.5;
                cursor: not-allowed;
              }
            }
            
            .btn-move {
              background: #e5e7eb;
              color: #374151;
              
              &:hover:not(:disabled) {
                background: #d1d5db;
              }
            }
            
            .btn-remove {
              background: #fee2e2;
              color: #dc2626;
              
              &:hover {
                background: #fecaca;
              }
            }
          }
        }
        
        .timeline-connector {
          position: absolute;
          left: 18px;
          top: 56px;
          bottom: -20px;
          width: 2px;
          background: #e5e7eb;
          display: flex;
          align-items: center;
          justify-content: center;
          
          svg {
            background: white;
            color: #9ca3af;
            padding: 2px;
          }
        }
      }
    }
  }
}

.map-container {
  position: relative;
  background: white;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  flex: 1;
  min-height: 400px;
  
  .map {
    width: 100%;
    height: 100%;
    min-height: 400px;
  }
  
  .map-controls {
    position: absolute;
    top: 16px;
    right: 16px;
    display: flex;
    flex-direction: column;
    gap: 8px;
    
    .btn-control {
      width: 40px;
      height: 40px;
      background: white;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
      transition: all 0.3s ease;
      
      &:hover {
        background: #f8fafc;
        border-color: #3b82f6;
      }
      
      svg {
        font-size: 18px;
        color: #374151;
      }
    }
  }
}

// Google 搜尋結果樣式
.search-container {
  position: relative;
  margin-bottom: 20px;

  .search-input {
    width: 100%;
    padding: 12px 16px;
    border: 2px solid #e5e7eb;
    border-radius: 8px;
    font-size: 16px;
    transition: all 0.2s ease;

    &:focus {
      outline: none;
      border-color: #3b82f6;
      box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
    }
  }

  .search-results {
    position: absolute;
    top: 100%;
    left: 0;
    right: 0;
    background: white;
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
    max-height: 400px;
    overflow-y: auto;
    z-index: 1000;
    margin-top: 4px;

    .search-result-item {
      padding: 12px 16px;
      border-bottom: 1px solid #f3f4f6;
      cursor: pointer;
      transition: background-color 0.2s ease;

      &:hover {
        background-color: #f9fafb;
      }

      &:last-child {
        border-bottom: none;
      }

      .place-name {
        font-weight: 600;
        color: #111827;
        margin-bottom: 4px;
      }

      .place-address {
        font-size: 14px;
        color: #6b7280;
      }
    }

    .search-loading {
      padding: 20px;
      text-align: center;
      color: #6b7280;
      font-style: italic;
    }

    .search-no-results {
      padding: 20px;
      text-align: center;
      color: #6b7280;
      font-style: italic;
    }

    .search-debug {
      padding: 12px;
      background: #f3f4f6;
      border-top: 1px solid #e5e7eb;
      font-size: 12px;
      color: #374151;
      font-family: monospace;
    }
  }
}

// 推薦地點模態框樣式
.place-submission-modal {
  background: white;
  border-radius: 16px;
  width: 100%;
  max-width: 800px;
  max-height: 90vh;
  margin: 20px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15);

  .modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 24px;
    border-bottom: 1px solid #e5e7eb;
    background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);

    .modal-title {
      display: flex;
      align-items: center;
      gap: 12px;
      font-size: 20px;
      font-weight: 700;
      color: white;
      margin: 0;

      svg {
        font-size: 24px;
      }
    }

    .modal-close {
      background: rgba(255, 255, 255, 0.2);
      border: none;
      color: white;
      padding: 8px;
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.2s ease;

      &:hover {
        background: rgba(255, 255, 255, 0.3);
        transform: scale(1.05);
      }

      svg {
        font-size: 18px;
      }
    }
  }

  .modal-content {
    flex: 1;
    overflow-y: auto;
    padding: 0;

    .submission-notice {
      display: flex;
      align-items: center;
      gap: 12px;
      background: #fef3c7;
      border: 1px solid #f59e0b;
      border-radius: 8px;
      padding: 16px;
      margin: 24px;
      color: #92400e;

      svg {
        font-size: 20px;
        color: #f59e0b;
        flex-shrink: 0;
      }

      p {
        margin: 0;
        font-size: 14px;
        line-height: 1.5;
      }
    }

    .submission-form {
      padding: 0 24px 24px;

      .form-section {
        margin-bottom: 32px;

        .section-title {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 16px;
          font-weight: 600;
          color: #1f2937;
          margin: 0 0 16px 0;
          padding-bottom: 8px;
          border-bottom: 2px solid #f3f4f6;

          svg {
            font-size: 18px;
            color: #f59e0b;
          }
        }

        .google-search-container {
          .search-input-group {
            position: relative;
            display: flex;
            align-items: center;
            margin-bottom: 12px;

            .search-icon {
              position: absolute;
              left: 12px;
              color: #6b7280;
              font-size: 16px;
            }

            .search-input {
              width: 100%;
              padding: 12px 16px 12px 40px;
              border: 2px solid #e5e7eb;
              border-radius: 8px;
              font-size: 14px;
              transition: all 0.2s ease;

              &:focus {
                outline: none;
                border-color: #f59e0b;
                box-shadow: 0 0 0 3px rgba(245, 158, 11, 0.1);
              }
            }

            .clear-search {
              position: absolute;
              right: 8px;
              background: none;
              border: none;
              color: #6b7280;
              padding: 4px;
              border-radius: 4px;
              cursor: pointer;

              &:hover {
                background: #f3f4f6;
                color: #374151;
              }
            }
          }

          .search-results {
            max-height: 240px;
            overflow-y: auto;
            border: 1px solid #e5e7eb;
            border-radius: 8px;
            background: white;

            .search-result-item {
              display: flex;
              align-items: center;
              justify-content: space-between;
              padding: 12px 16px;
              cursor: pointer;
              transition: all 0.2s ease;
              border-bottom: 1px solid #f3f4f6;

              &:last-child {
                border-bottom: none;
              }

              &:hover {
                background: #fef3c7;
              }

              .result-content {
                flex: 1;

                .result-name {
                  font-weight: 600;
                  color: #1f2937;
                  margin-bottom: 4px;
                }

                .result-address {
                  font-size: 13px;
                  color: #6b7280;
                  margin-bottom: 4px;
                }

                .result-meta {
                  display: flex;
                  gap: 12px;

                  .result-rating {
                    display: flex;
                    align-items: center;
                    gap: 4px;
                    font-size: 12px;
                    color: #f59e0b;

                    svg {
                      font-size: 12px;
                    }
                  }

                  .result-types {
                    font-size: 12px;
                    color: #6b7280;
                  }
                }
              }

              .result-arrow {
                color: #9ca3af;
                font-size: 16px;
              }
            }
          }

          .search-loading {
            display: flex;
            align-items: center;
            gap: 8px;
            padding: 16px;
            color: #6b7280;
            justify-content: center;

            svg {
              font-size: 16px;
              animation: spin 1s linear infinite;
            }
          }
        }

        .form-row {
          display: flex;
          gap: 16px;
          margin-bottom: 16px;

          .form-group {
            flex: 1;

            &.half {
              flex: 0.5;
            }

            .form-label {
              display: block;
              font-size: 14px;
              font-weight: 600;
              color: #374151;
              margin-bottom: 6px;

              &.required::after {
                content: ' *';
                color: #ef4444;
              }
            }

            .form-input,
            .form-textarea,
            .form-select {
              width: 100%;
              padding: 12px;
              border: 2px solid #e5e7eb;
              border-radius: 8px;
              font-size: 14px;
              transition: all 0.2s ease;

              &:focus {
                outline: none;
                border-color: #f59e0b;
                box-shadow: 0 0 0 3px rgba(245, 158, 11, 0.1);
              }
            }

            .form-textarea {
              resize: vertical;
              min-height: 80px;
            }
          }
        }

        .btn-map-select {
          display: flex;
          align-items: center;
          gap: 8px;
          width: 100%;
          padding: 12px;
          background: #f3f4f6;
          border: 2px dashed #d1d5db;
          border-radius: 8px;
          color: #6b7280;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;

          &:hover {
            background: #e5e7eb;
            border-color: #9ca3af;
            color: #374151;
          }

          svg {
            font-size: 18px;
          }
        }
      }

      .form-actions {
        display: flex;
        gap: 12px;
        justify-content: flex-end;
        padding-top: 24px;
        border-top: 1px solid #e5e7eb;

        .btn-cancel,
        .btn-submit {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 12px 24px;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .btn-cancel {
          background: #f3f4f6;
          color: #374151;
          border: 2px solid #e5e7eb;

          &:hover {
            background: #e5e7eb;
            border-color: #d1d5db;
          }
        }

        .btn-submit {
          background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
          color: white;
          border: 2px solid transparent;

          &:hover:not(:disabled) {
            background: linear-gradient(135deg, #d97706 0%, #b45309 100%);
            transform: translateY(-1px);
            box-shadow: 0 4px 12px rgba(245, 158, 11, 0.3);
          }

          &:disabled {
            opacity: 0.6;
            cursor: not-allowed;
          }

          svg {
            font-size: 16px;
          }
        }
      }
    }
  }
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

@media (max-width: 768px) {
  .place-submission-modal {
    margin: 10px;
    max-height: 95vh;

    .modal-header {
      padding: 16px;

      .modal-title {
        font-size: 18px;
      }
    }

    .modal-content {
      .submission-notice {
        margin: 16px;
        padding: 12px;
      }

      .submission-form {
        padding: 0 16px 16px;

        .form-section {
          margin-bottom: 24px;

          .form-row {
            flex-direction: column;
            gap: 12px;

            .form-group.half {
              flex: 1;
            }
          }
        }

        .form-actions {
          flex-direction: column;

          .btn-cancel,
          .btn-submit {
            width: 100%;
            justify-content: center;
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
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  backdrop-filter: blur(4px);
}

.save-modal {
  background: white;
  border-radius: 12px;
  padding: 32px;
  width: 100%;
  max-width: 500px;
  margin: 20px;
  
  h3 {
    font-size: 20px;
    font-weight: 600;
    margin-bottom: 24px;
    color: #1f2937;
  }
  
  .form-group {
    margin-bottom: 20px;
    
    label {
      display: block;
      margin-bottom: 8px;
      font-weight: 600;
      color: #374151;
    }
    
    input,
    textarea {
      width: 100%;
      padding: 12px 16px;
      border: 2px solid #e5e7eb;
      border-radius: 8px;
      font-size: 14px;
      
      &:focus {
        outline: none;
        border-color: #3b82f6;
      }
    }
    
    textarea {
      resize: vertical;
      min-height: 80px;
    }
  }
  
  .form-actions {
    display: flex;
    gap: 12px;
    justify-content: flex-end;
    
    button {
      padding: 12px 24px;
      border-radius: 8px;
      font-weight: 600;
      cursor: pointer;
      
      &.btn-cancel {
        background: #f3f4f6;
        color: #374151;
        border: 2px solid #e5e7eb;
        
        &:hover {
          background: #e5e7eb;
        }
      }
      
      &.btn-save {
        background: #3b82f6;
        color: white;
        border: 2px solid #3b82f6;
        
        &:hover {
          background: #2563eb;
        }
      }
    }
  }
}

// 浮動儲存按鈕
.floating-save {
  position: fixed;
  bottom: 32px;
  right: 32px;
  z-index: 1000;
  
  .btn-save-float {
    display: flex;
    align-items: center;
    gap: 8px;
    background: #10b981;
    color: white;
    border: none;
    padding: 16px 24px;
    border-radius: 50px;
    font-size: 16px;
    font-weight: 600;
    cursor: pointer;
    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
    transition: all 0.3s ease;
    
    &:hover {
      background: #059669;
      transform: translateY(-2px);
      box-shadow: 0 12px 35px rgba(0, 0, 0, 0.2);
    }
    
    svg {
      font-size: 20px;
    }
  }
}

// 響應式設計
@media (max-width: 1024px) {
  .main-content {
    grid-template-columns: 1fr;
    gap: 16px;
    padding: 16px;
  }
  
  .sidebar {
    max-height: none;
    height: auto;
  }
  
  .places-list {
    max-height: 400px;
  }
}

@media (max-width: 768px) {
  .page-header {
    padding: 40px 0;
    
    .header-content {
      .page-title {
        font-size: 28px;
        flex-direction: column;
        gap: 8px;
      }
      
      .page-subtitle {
        font-size: 16px;
      }
    }
  }
  
  .overview-header {
    flex-direction: column;
    gap: 16px;
    align-items: stretch;
  }
  
  .timeline-content {
    flex-direction: column;
    gap: 12px;
    
    .timeline-actions {
      flex-direction: row;
      justify-content: center;
    }
  }
  
  .floating-save {
    bottom: 20px;
    right: 20px;
  }
}

// 地點詳細資訊 Modal 樣式
.place-modal {
  background: white;
  border-radius: 16px;
  width: 100%;
  max-width: 700px;
  max-height: 90vh;
  margin: 20px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid #e5e7eb;
  background: #f8fafc;
  
  .modal-title {
    font-size: 18px;
    font-weight: 600;
    color: #1f2937;
    margin: 0;
  }
  
  .btn-close {
    background: none;
    border: none;
    font-size: 20px;
    color: #6b7280;
    cursor: pointer;
    padding: 4px;
    border-radius: 4px;
    
    &:hover {
      background: #e5e7eb;
      color: #374151;
    }
  }
}

.modal-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px;
  color: #6b7280;
  
  .loading-spinner {
    font-size: 32px;
    margin-bottom: 12px;
    animation: spin 1s linear infinite;
  }
  
  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
}

.modal-content {
  flex: 1;
  overflow-y: auto;
  padding: 0;
}

.place-photos {
  .photo-carousel {
    display: flex;
    gap: 8px;
    overflow-x: auto;
    padding: 16px;
    background: #f8fafc;
    
    .place-photo {
      width: 150px;
      height: 120px;
      object-fit: cover;
      border-radius: 8px;
      flex-shrink: 0;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    }
  }
}

.place-info-section {
  padding: 20px 24px;
  
  .place-name {
    font-size: 24px;
    font-weight: 700;
    color: #1f2937;
    margin-bottom: 12px;
  }
  
  .place-rating {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 12px;
    
    .rating-stars {
      display: flex;
      gap: 2px;
      
      .icon {
        font-size: 16px;
        color: #d1d5db;
        
        &.filled {
          color: #fbbf24;
        }
      }
    }
    
    .rating-value {
      font-weight: 600;
      color: #1f2937;
    }
    
    .rating-count {
      color: #6b7280;
      font-size: 14px;
    }
  }
  
  .place-address,
  .place-contact {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 8px;
    color: #4b5563;
    
    .icon {
      font-size: 16px;
      color: #6b7280;
    }
    
    a {
      color: #3b82f6;
      text-decoration: none;
      
      &:hover {
        text-decoration: underline;
      }
    }
  }
  
  .opening-hours {
    margin-top: 16px;
    
    h5 {
      font-size: 16px;
      font-weight: 600;
      color: #1f2937;
      margin-bottom: 8px;
    }
    
    .hours-list {
      .hours-item {
        padding: 4px 0;
        color: #4b5563;
        font-size: 14px;
        border-bottom: 1px solid #f3f4f6;
        
        &:last-child {
          border-bottom: none;
        }
      }
    }
  }
}

.reviews-section {
  padding: 0 24px 20px;
  border-top: 1px solid #e5e7eb;
  
  h5 {
    font-size: 16px;
    font-weight: 600;
    color: #1f2937;
    margin: 16px 0 12px;
  }
  
  .reviews-list {
    .review-item {
      padding: 12px 0;
      border-bottom: 1px solid #f3f4f6;
      
      &:last-child {
        border-bottom: none;
      }
      
      .review-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        margin-bottom: 8px;
        
        .reviewer-info {
          display: flex;
          gap: 8px;
          align-items: center;
          
          .reviewer-avatar {
            width: 32px;
            height: 32px;
            border-radius: 50%;
            object-fit: cover;
          }
          
          .reviewer-name {
            font-weight: 600;
            color: #1f2937;
            font-size: 14px;
          }
          
          .review-rating {
            display: flex;
            gap: 1px;
            
            .icon {
              font-size: 12px;
              color: #d1d5db;
              
              &.filled {
                color: #fbbf24;
              }
            }
          }
        }
        
        .review-time {
          color: #6b7280;
          font-size: 12px;
        }
      }
      
      .review-text {
        color: #4b5563;
        font-size: 14px;
        line-height: 1.5;
        margin: 0;
      }
    }
  }
}

.modal-actions {
  display: flex;
  gap: 12px;
  padding: 16px 24px;
  border-top: 1px solid #e5e7eb;
  background: #f8fafc;
  
  .btn-add-itinerary,
  .btn-close-modal {
    flex: 1;
    padding: 12px 20px;
    border-radius: 8px;
    font-weight: 600;
    border: 2px solid transparent;
    cursor: pointer;
    transition: all 0.2s;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    
    .icon {
      font-size: 16px;
    }
  }
  
  .btn-add-itinerary {
    background: #3b82f6;
    color: white;
    border-color: #3b82f6;
    
    &:hover:not(:disabled) {
      background: #2563eb;
      border-color: #2563eb;
    }
    
    &:disabled {
      background: #9ca3af;
      border-color: #9ca3af;
      cursor: not-allowed;
    }
  }
  
  .btn-close-modal {
    background: white;
    color: #6b7280;
    border-color: #d1d5db;
    
    &:hover {
      background: #f9fafb;
      border-color: #9ca3af;
    }
  }
}

@media (max-width: 768px) {
  .place-modal {
    margin: 10px;
    max-height: 95vh;
  }
  
  .place-photos .photo-carousel {
    .place-photo {
      width: 120px;
      height: 100px;
    }
  }
  
  .place-info-section .place-name {
    font-size: 20px;
  }
  
  .modal-actions {
    flex-direction: column;
    
    .btn-add-itinerary,
    .btn-close-modal {
      flex: none;
    }
  }
}

// 圖片預覽區域樣式
.photo-preview-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: 12px;
  margin: 16px 0;
}

.photo-preview-item {
  position: relative;
  aspect-ratio: 1;
  border-radius: 8px;
  overflow: hidden;
  border: 2px solid #e5e7eb;
  transition: all 0.2s;
  
  &:hover {
    border-color: #3b82f6;
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(59, 130, 246, 0.2);
    
    .photo-remove-btn {
      opacity: 1;
    }
  }
}

.photo-preview-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.2s;
  
  .photo-preview-item:hover & {
    transform: scale(1.05);
  }
}

.photo-remove-btn {
  position: absolute;
  top: 4px;
  right: 4px;
  width: 24px;
  height: 24px;
  background: rgba(239, 68, 68, 0.9);
  color: white;
  border: none;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: all 0.2s;
  
  &:hover {
    background: rgba(220, 38, 38, 1);
    transform: scale(1.1);
  }
  
  .icon {
    font-size: 12px;
  }
}

.photo-preview-overlay {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: linear-gradient(transparent, rgba(0, 0, 0, 0.6));
  padding: 8px 6px 4px;
  
  .photo-number {
    color: white;
    font-size: 11px;
    font-weight: 600;
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
  }
}

.photo-info {
  display: flex;
  align-items: center;
  gap: 6px;
  color: #059669;
  font-size: 13px;
  background: #f0fdf4;
  padding: 8px 12px;
  border-radius: 6px;
  border: 1px solid #bbf7d0;
  
  .icon {
    font-size: 16px;
  }
}

@media (max-width: 768px) {
  .photo-preview-grid {
    grid-template-columns: repeat(3, 1fr);
    gap: 8px;
  }
  
  .photo-remove-btn {
    opacity: 1; // 在手機上總是顯示移除按鈕
  }
}
</style>
