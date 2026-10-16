<template>
  <div class="yp-page itin-page">
    <!-- 頁面標題 -->
    <header class="yp-page-head">
      <div>
        <span class="yp-page-head__eyebrow">旅遊工具</span>
        <h1 class="yp-page-head__title">宜蘭行程規劃</h1>
        <p class="yp-page-head__desc">探索宜蘭的美景與美食，規劃您的完美旅程</p>
      </div>
      <div class="yp-page-head__actions">
        <a href="#my-itinerary" class="btn btn-soft btn-icon d-lg-none">
          <Icon name="ri:route-line" />
          我的行程
          <span v-if="itinerary.length > 0" class="yp-tag yp-tag--primary">{{
            itinerary.length
          }}</span>
        </a>
        <button
          type="button"
          class="btn btn-outline-primary btn-icon"
          title="推薦新地點給其他旅客，需經管理員審核"
          @click="showSubmissionModal = true"
        >
          <Icon name="ri:heart-add-line" />
          推薦地點
        </button>
      </div>
    </header>

    <!-- 主要內容 -->
    <div class="main-content">
      <!-- 左側：分類篩選和地點列表 -->
      <div class="sidebar yp-card">
        <!-- 篩選器 -->
        <div class="filter-section">
          <!-- 分頁選項卡 -->
          <div class="tab-selector yp-seg">
            <button
              type="button"
              :class="['tab-btn', 'yp-seg__btn', { 'is-active': activeTab === 'places' }]"
              @click="activeTab = 'places'"
            >
              <Icon name="ri:map-pin-line" />
              <span>景點地點</span>
            </button>
            <button
              type="button"
              :class="['tab-btn', 'yp-seg__btn', { 'is-active': activeTab === 'recommended' }]"
              @click="activeTab = 'recommended'"
            >
              <Icon name="ri:star-line" />
              <span>推薦行程</span>
              <span v-if="recommendedItinerariesFromDB.length > 0" class="count">
                {{ recommendedItinerariesFromDB.length }}
              </span>
            </button>
          </div>

          <!-- 地點篩選選項 (只在景點分頁顯示) -->
          <div v-if="activeTab === 'places'" class="filter-body">
            <!-- 搜尋框 -->
            <div class="itin-search">
              <Icon name="ri:search-line" class="itin-search__icon" />
              <input
                v-model="searchQuery"
                type="text"
                placeholder="搜尋地點名稱..."
                class="form-control itin-search__input"
                aria-label="搜尋地點名稱"
              />
              <button
                v-if="searchQuery"
                type="button"
                class="itin-search__clear"
                aria-label="清除搜尋"
                @click="searchQuery = ''"
              >
                <Icon name="ri:close-line" />
              </button>
            </div>

            <!-- 分類篩選 -->
            <div class="category-filters">
              <button
                v-for="category in categories"
                :key="category.id"
                type="button"
                :class="[
                  'category-btn',
                  'yp-chip',
                  'yp-chip--sm',
                  { 'is-active': selectedCategories.includes(category.id) }
                ]"
                @click="toggleCategory(category.id)"
              >
                <Icon :name="category.icon" />
                <span>{{ category.name }}</span>
                <span class="yp-chip__count">{{ getCategoryCount(category.id) }}</span>
              </button>
            </div>

            <!-- 其他篩選選項 -->
            <div class="additional-filters">
              <div class="form-check form-switch">
                <input
                  id="itin-featured"
                  v-model="showFeaturedOnly"
                  class="form-check-input"
                  type="checkbox"
                  role="switch"
                />
                <label class="form-check-label" for="itin-featured">只顯示精選地點</label>
              </div>
              <div class="form-check form-switch">
                <input
                  id="itin-private"
                  v-model="showPrivateOnly"
                  class="form-check-input"
                  type="checkbox"
                  role="switch"
                />
                <label class="form-check-label" for="itin-private">只顯示私房景點</label>
              </div>
            </div>
          </div>
        </div>

        <!-- 內容列表 (根據分頁顯示) -->
        <div class="content-list">
          <!-- 景點地點分頁 -->
          <div v-if="activeTab === 'places'">
            <h3 class="list-title">
              地點列表
              <span class="yp-tag">{{ filteredPlaces.length }}</span>
            </h3>

            <div v-if="loading" class="places-grid" aria-busy="true" aria-label="載入中">
              <div v-for="n in 4" :key="n" class="place-card is-skeleton">
                <span class="yp-skeleton place-image"></span>
                <div class="place-info">
                  <span class="yp-skeleton" style="width: 70%; height: 16px"></span>
                  <span class="yp-skeleton" style="width: 45%; height: 14px"></span>
                  <span class="yp-skeleton" style="width: 90%; height: 14px"></span>
                </div>
              </div>
            </div>

            <div v-else-if="placesError" class="yp-empty yp-empty--error">
              <div class="yp-empty__icon"><Icon name="ri:error-warning-line" /></div>
              <p class="yp-empty__title">載入地點失敗</p>
              <p class="yp-empty__text">請檢查網路連線後再試一次</p>
              <button type="button" class="btn btn-primary" @click="retryPlaces">重新載入</button>
            </div>

            <div v-else-if="filteredPlaces.length === 0" class="yp-empty">
              <div class="yp-empty__icon"><Icon name="ri:map-pin-line" /></div>
              <p class="yp-empty__title">沒有找到符合條件的地點</p>
              <p class="yp-empty__text">試試調整分類或搜尋關鍵字</p>
            </div>

            <div v-else class="places-grid">
              <div
                v-for="place in filteredPlaces"
                :key="place.id"
                :class="['place-card', { selected: selectedPlace?.id === place.id }]"
                @click="selectPlace(place)"
              >
                <!-- 地點圖片 -->
                <div class="place-image">
                  <img :src="getPlaceImage(place)" :alt="place.name" loading="lazy" />
                  <div v-if="place.is_featured || place.is_private" class="place-badges">
                    <span v-if="place.is_featured" class="featured-badge" title="精選地點">
                      <Icon name="ri:star-fill" />
                    </span>
                    <span v-if="place.is_private" class="private-badge" title="私房景點">
                      <Icon name="ri:lock-line" />
                    </span>
                  </div>
                </div>

                <!-- 地點資訊 -->
                <div class="place-info">
                  <h4 class="place-name yp-clamp-1">{{ place.name }}</h4>
                  <div class="yp-tags">
                    <span class="yp-tag yp-tag--primary">
                      <Icon :name="getCategoryIcon(place.category_id)" />
                      {{ getCategoryName(place.category_id) }}
                    </span>
                    <span v-if="place.rating" class="yp-tag yp-tag--warning">
                      <Icon name="ri:star-fill" />
                      {{ place.rating }}
                      <span class="rating-count">({{ place.user_ratings_total || 0 }})</span>
                    </span>
                  </div>

                  <div class="place-address yp-clamp-1">
                    <Icon name="ri:map-pin-2-line" />
                    {{ place.formatted_address }}
                  </div>

                  <!-- 行程操作按鈕 -->
                  <div class="place-actions">
                    <button
                      type="button"
                      :disabled="isInItinerary(place.id)"
                      :class="[
                        'btn btn-sm btn-icon btn-add',
                        isInItinerary(place.id) ? 'btn-soft' : 'btn-primary'
                      ]"
                      @click.stop="addToItinerary(place)"
                    >
                      <Icon :name="isInItinerary(place.id) ? 'ri:check-line' : 'ri:add-line'" />
                      {{ isInItinerary(place.id) ? '已加入' : '加入行程' }}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- 推薦行程分頁 -->
          <div v-else-if="activeTab === 'recommended'">
            <h3 class="list-title">
              推薦行程
              <span class="yp-tag">{{ recommendedItinerariesFromDB.length }}</span>
            </h3>

            <div
              v-if="loadingRecommended"
              class="recommended-grid"
              aria-busy="true"
              aria-label="載入推薦行程中"
            >
              <div v-for="n in 2" :key="n" class="recommended-card yp-card yp-card--flat">
                <span class="yp-skeleton recommended-image"></span>
                <div class="recommended-info">
                  <span class="yp-skeleton" style="width: 60%; height: 18px"></span>
                  <span class="yp-skeleton" style="width: 95%; height: 14px"></span>
                  <span class="yp-skeleton" style="width: 80%; height: 14px"></span>
                </div>
              </div>
            </div>

            <div v-else-if="recommendedError" class="yp-empty yp-empty--error">
              <div class="yp-empty__icon"><Icon name="ri:error-warning-line" /></div>
              <p class="yp-empty__title">載入推薦行程失敗</p>
              <p class="yp-empty__text">{{ recommendedError.message }}</p>
            </div>

            <div v-else-if="recommendedItinerariesFromDB.length === 0" class="yp-empty">
              <div class="yp-empty__icon"><Icon name="ri:search-eye-line" /></div>
              <p class="yp-empty__title">目前沒有推薦行程</p>
              <p class="yp-empty__text">敬請期待更多精彩行程</p>
            </div>

            <div v-else class="recommended-grid">
              <div
                v-for="itinerary in recommendedItinerariesFromDB"
                :key="itinerary.id"
                class="recommended-card yp-card yp-card--flat"
              >
                <!-- 行程圖片 -->
                <div class="recommended-image">
                  <img
                    :src="itinerary.image_url || '/images/place-placeholder.svg'"
                    :alt="itinerary.title"
                    loading="lazy"
                  />
                  <div class="recommended-badges">
                    <span class="days-badge yp-tag yp-tag--primary">
                      <Icon name="ri:calendar-line" />
                      {{ itinerary.days }} 天
                    </span>
                    <span
                      v-if="itinerary.difficulty_level"
                      class="difficulty-badge yp-tag"
                      :class="itinerary.difficulty_level"
                    >
                      {{ getDifficultyText(itinerary.difficulty_level) }}
                    </span>
                  </div>
                </div>

                <!-- 行程資訊 -->
                <div class="recommended-info">
                  <h4 class="recommended-title">{{ itinerary.title }}</h4>
                  <p class="recommended-description yp-clamp-2">{{ itinerary.description }}</p>

                  <div v-if="itinerary.average_rating > 0" class="recommended-rating">
                    <Icon name="ri:star-fill" />
                    {{ itinerary.average_rating.toFixed(1) }}
                    <span class="rating-count">({{ itinerary.rating_count }} 評分)</span>
                  </div>

                  <div v-if="itinerary.tags && itinerary.tags.length > 0" class="yp-tags">
                    <span v-for="tag in itinerary.tags.slice(0, 3)" :key="tag" class="yp-tag">
                      {{ tag }}
                    </span>
                  </div>

                  <!-- 行程操作按鈕 -->
                  <div class="recommended-actions">
                    <button
                      type="button"
                      class="btn btn-sm btn-primary btn-icon btn-load-template"
                      @click="loadItineraryTemplate(itinerary)"
                    >
                      <Icon name="ri:download-2-line" />
                      套用行程
                    </button>
                    <button
                      type="button"
                      class="btn btn-sm btn-soft btn-icon btn-view-details"
                      @click="viewItineraryDetails(itinerary)"
                    >
                      <Icon name="ri:eye-line" />
                      查看詳情
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 右側：行程規劃和地圖 -->
      <div class="main-panel">
        <!-- 行程總覽 -->
        <section id="my-itinerary" class="itinerary-overview yp-card">
          <div class="yp-card__head overview-header">
            <h3 class="yp-card__head-title overview-title">
              <Icon name="ri:route-line" />
              我的行程
              <span v-if="itinerary.length > 0" class="yp-tag yp-tag--primary"
                >{{ itinerary.length }} 個地點</span
              >
            </h3>
            <button type="button" class="btn btn-sm btn-soft btn-icon btn-add-day" @click="addDay">
              <Icon name="ri:add-line" />
              新增天數
            </button>
          </div>

          <div class="yp-card__section overview-body">
            <!-- 天數切換 -->
            <div class="yp-chips day-chips" role="tablist" aria-label="選擇天數">
              <button
                v-for="day in totalDays"
                :key="day"
                type="button"
                role="tab"
                :aria-selected="currentDay === day"
                :class="['yp-chip', 'yp-chip--sm', { 'is-active': currentDay === day }]"
                @click="currentDay = day"
              >
                第 {{ day }} 天
              </button>
            </div>

            <!-- 當前天數的行程 -->
            <div class="day-itinerary">
              <div v-if="getCurrentDayPlaces().length === 0" class="yp-empty empty-day">
                <div class="yp-empty__icon"><Icon name="ri:calendar-event-line" /></div>
                <p class="yp-empty__title">第 {{ currentDay }} 天還沒有安排行程</p>
                <p class="yp-empty__text">從地點列表選擇想要造訪的地點，或套用推薦行程</p>
              </div>

              <ol v-else class="itinerary-timeline">
                <li
                  v-for="(item, index) in getCurrentDayPlaces()"
                  :key="item.id"
                  class="timeline-item"
                >
                  <span class="timeline-marker">{{ index + 1 }}</span>

                  <div class="timeline-content">
                    <div class="timeline-place">
                      <img :src="getPlaceImage(item.place)" :alt="item.place.name" loading="lazy" />
                      <div class="place-details">
                        <h4 class="yp-clamp-1">{{ item.place.name }}</h4>
                        <div class="yp-tags place-meta">
                          <span class="yp-tag yp-tag--primary">
                            <Icon :name="getCategoryIcon(item.place.category_id)" />
                            {{ getCategoryName(item.place.category_id) }}
                          </span>
                          <span v-if="item.duration_minutes" class="yp-tag">
                            <Icon name="ri:time-line" />
                            {{ item.duration_minutes }} 分鐘
                          </span>
                        </div>
                      </div>
                    </div>

                    <div class="timeline-actions">
                      <button
                        type="button"
                        class="btn btn-ghost btn-move"
                        aria-label="上移"
                        :disabled="index === 0"
                        @click="moveUp(item.id)"
                      >
                        <Icon name="ri:arrow-up-line" />
                      </button>
                      <button
                        type="button"
                        class="btn btn-ghost btn-move"
                        aria-label="下移"
                        :disabled="index === getCurrentDayPlaces().length - 1"
                        @click="moveDown(item.id)"
                      >
                        <Icon name="ri:arrow-down-line" />
                      </button>
                      <button
                        type="button"
                        class="btn btn-ghost btn-remove"
                        aria-label="移除地點"
                        @click="removeFromItinerary(item.id)"
                      >
                        <Icon name="ri:delete-bin-line" />
                      </button>
                    </div>
                  </div>
                </li>
              </ol>
            </div>
          </div>
        </section>

        <!-- 地圖容器 -->
        <div class="map-container yp-card">
          <div id="itinerary-map" class="map"></div>

          <!-- 地圖控制項 -->
          <div class="map-controls">
            <button type="button" class="btn-control" aria-label="重置地圖視野" @click="centerMap">
              <Icon name="ri:focus-3-line" />
            </button>
            <button
              type="button"
              class="btn-control"
              aria-label="切換衛星與標準圖資"
              @click="toggleMapType"
            >
              <Icon name="ri:stack-line" />
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 行程儲存模態框 -->
    <div v-if="showSaveModal" class="modal-overlay" @click.self="showSaveModal = false">
      <div class="save-modal" role="dialog" aria-modal="true" aria-labelledby="itin-save-title">
        <div class="pm-head">
          <h3 id="itin-save-title" class="pm-title">儲存行程</h3>
          <button type="button" class="pm-close" aria-label="關閉" @click="showSaveModal = false">
            <Icon name="ri:close-line" />
          </button>
        </div>
        <form class="pm-body" @submit.prevent="saveItinerary">
          <div class="mb-3">
            <label class="form-label required" for="itin-title">行程名稱</label>
            <input
              id="itin-title"
              v-model="itineraryTitle"
              type="text"
              class="form-control"
              placeholder="請輸入行程名稱"
              required
            />
          </div>
          <div class="mb-3">
            <label class="form-label" for="itin-desc">行程描述</label>
            <textarea
              id="itin-desc"
              v-model="itineraryDescription"
              class="form-control"
              rows="3"
              placeholder="描述這個行程的特色..."
            ></textarea>
          </div>
          <div class="pm-actions">
            <button type="button" class="btn btn-ghost" @click="showSaveModal = false">取消</button>
            <button type="submit" class="btn btn-primary btn-icon">
              <Icon name="ri:save-line" />
              儲存行程
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- 浮動儲存按鈕 -->
    <div v-if="itinerary.length > 0" class="floating-save">
      <button
        type="button"
        class="btn btn-primary btn-pill btn-icon btn-save-float"
        @click="showSaveModal = true"
      >
        <Icon name="ri:save-line" />
        儲存行程
      </button>
    </div>

    <!-- 地點詳細資訊 Modal -->
    <div v-if="showPlaceModal" class="modal-overlay" @click.self="closePlaceModal">
      <div class="place-modal" role="dialog" aria-modal="true" aria-label="地點詳細資訊">
        <div class="pm-head">
          <h3 class="pm-title">地點詳細資訊</h3>
          <button type="button" class="pm-close" aria-label="關閉" @click="closePlaceModal">
            <Icon name="ri:close-line" />
          </button>
        </div>

        <div v-if="loadingPlaceDetails" class="modal-loading">
          <Icon name="ri:loader-4-line" class="loading-spinner" />
          <p>載入地點資訊中...</p>
        </div>

        <div v-else-if="placeDetails" class="pm-body">
          <!-- 地點照片輪播 -->
          <div v-if="placeDetails.photos && placeDetails.photos.length > 0" class="place-photos">
            <div class="photo-carousel">
              <img
                v-for="(photo, index) in placeDetails.photos.slice(0, 5)"
                :key="index"
                :src="
                  photo.photo_reference
                    ? `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photo_reference=${encodeURIComponent(
                        photo.photo_reference
                      )}&key=${config.public.googleMapsApiKey}`
                    : getPlaceImage(placeDetails)
                "
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
                  name="ri:star-fill"
                  :class="{ filled: star <= Math.floor(placeDetails.rating) }"
                />
              </div>
              <span class="rating-value">{{ placeDetails.rating }}</span>
              <span class="rating-count">({{ placeDetails.user_ratings_total || 0 }} 則評價)</span>
            </div>

            <div class="place-address">
              <Icon name="ri:map-pin-2-line" />
              {{ placeDetails.formatted_address }}
            </div>

            <div v-if="placeDetails.phone" class="place-contact">
              <Icon name="ri:phone-line" />
              <a :href="`tel:${placeDetails.phone}`">{{ placeDetails.phone }}</a>
            </div>

            <div v-if="placeDetails.website" class="place-contact">
              <Icon name="ri:global-line" />
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
          <div
            v-if="placeDetails.reviews && placeDetails.reviews.length > 0"
            class="reviews-section"
          >
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
                          name="ri:star-fill"
                          :class="{ filled: star <= review.rating }"
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
          <div class="pm-actions modal-actions">
            <button type="button" class="btn btn-ghost" @click="closePlaceModal">關閉</button>
            <button
              type="button"
              :disabled="isInItinerary(placeDetails.id)"
              :class="[
                'btn btn-icon btn-add-itinerary',
                isInItinerary(placeDetails.id) ? 'btn-soft' : 'btn-primary'
              ]"
              @click="addToItinerary(placeDetails)"
            >
              <Icon :name="isInItinerary(placeDetails.id) ? 'ri:check-line' : 'ri:add-line'" />
              {{ isInItinerary(placeDetails.id) ? '已加入行程' : '加入行程' }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 推薦地點模態框 -->
    <div v-if="showSubmissionModal" class="modal-overlay" @click.self="showSubmissionModal = false">
      <div
        class="place-submission-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="itin-submit-title"
      >
        <!-- 模態框標題 -->
        <div class="pm-head">
          <h2 id="itin-submit-title" class="pm-title">
            <Icon name="ri:heart-add-line" />
            推薦新地點
          </h2>
          <button
            type="button"
            class="pm-close"
            aria-label="關閉"
            @click="showSubmissionModal = false"
          >
            <Icon name="ri:close-line" />
          </button>
        </div>

        <!-- 模態框內容 -->
        <div class="pm-body">
          <div class="submission-notice">
            <Icon name="ri:information-line" />
            <p>感謝您推薦新地點！您的推薦將經過管理員審核後公開。</p>
          </div>

          <form class="submission-form" @submit.prevent="handlePlaceSubmission">
            <!-- Google Maps 搜尋區域 -->
            <div class="pm-section">
              <h3 class="pm-section__title">
                <Icon name="ri:map-2-line" />
                Google Maps 搜尋
              </h3>
              <div class="google-search-container">
                <div class="itin-search">
                  <Icon name="ri:search-line" class="itin-search__icon" />
                  <input
                    v-model="googleSearchQuery"
                    type="text"
                    placeholder="搜尋地點名稱或地址..."
                    class="form-control itin-search__input"
                    aria-label="搜尋地點名稱或地址"
                    @input="handleGoogleSearch"
                  />
                  <button
                    v-if="googleSearchQuery"
                    type="button"
                    class="itin-search__clear"
                    aria-label="清除搜尋"
                    @click="clearGoogleSearch"
                  >
                    <Icon name="ri:close-line" />
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
                    class="search-result-item"
                    @click="selectGooglePlaceForSubmission(result)"
                  >
                    <div class="result-content">
                      <div class="result-name">{{ result.name }}</div>
                      <div class="result-address">
                        {{ result.formatted_address || result.vicinity || '地址資訊不完整' }}
                      </div>
                      <div class="result-meta">
                        <span v-if="result.rating" class="yp-tag yp-tag--warning">
                          <Icon name="ri:star-fill" />
                          {{ result.rating }}
                        </span>
                        <span v-if="result.types && result.types.length > 0" class="yp-tag">
                          {{ result.types[0].replace(/_/g, ' ') }}
                        </span>
                      </div>
                    </div>
                    <Icon name="ri:arrow-right-s-line" class="result-arrow" />
                  </div>
                </div>

                <!-- 載入中 -->
                <div v-if="isGoogleSearching" class="search-status">
                  <Icon name="ri:loader-4-line" class="loading-spinner" />
                  <span>搜尋中...</span>
                </div>

                <!-- 沒有結果時的提示 -->
                <div
                  v-if="
                    !isGoogleSearching &&
                    googleSearchQuery.length >= 3 &&
                    googleSearchResults.length === 0
                  "
                  class="search-status"
                >
                  <Icon name="ri:map-pin-line" />
                  <span>找不到相關地點，請嘗試其他關鍵字</span>
                </div>
              </div>
            </div>

            <!-- 基本資訊 -->
            <div class="pm-section">
              <h3 class="pm-section__title">基本資訊</h3>

              <div class="mb-3">
                <label class="form-label required">地點名稱</label>
                <input
                  v-model="submissionForm.name"
                  type="text"
                  class="form-control"
                  required
                  placeholder="請輸入地點名稱"
                />
              </div>

              <div class="mb-3">
                <label class="form-label">地點描述</label>
                <textarea
                  v-model="submissionForm.description"
                  class="form-control"
                  rows="3"
                  placeholder="請簡述這個地點的特色和推薦理由..."
                ></textarea>
              </div>

              <div class="mb-0">
                <label class="form-label">詳細地址</label>
                <input
                  v-model="submissionForm.formatted_address"
                  type="text"
                  class="form-control"
                  placeholder="請輸入完整地址"
                />
              </div>
            </div>

            <!-- 圖片預覽區域 -->
            <div
              v-if="submissionForm.photos && submissionForm.photos.length > 0"
              class="pm-section"
            >
              <h3 class="pm-section__title">
                <Icon name="ri:image-line" />
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
                    class="photo-remove-btn"
                    title="移除此圖片"
                    aria-label="移除此圖片"
                    @click="removePhoto(index)"
                  >
                    <Icon name="ri:close-line" />
                  </button>
                  <div class="photo-preview-overlay">
                    <span class="photo-number">{{ index + 1 }}</span>
                  </div>
                </div>
              </div>

              <div class="photo-info">
                <Icon name="ri:information-line" />
                <span>已自動從 Google Maps 載入 {{ submissionForm.photos.length }} 張圖片</span>
              </div>
            </div>

            <!-- 位置資訊 -->
            <div class="pm-section">
              <h3 class="pm-section__title">位置資訊</h3>

              <div class="row g-3 mb-3">
                <div class="col-6">
                  <label class="form-label required">緯度</label>
                  <input
                    v-model.number="submissionForm.latitude"
                    type="number"
                    step="any"
                    class="form-control"
                    required
                    placeholder="例: 24.7736"
                  />
                </div>
                <div class="col-6">
                  <label class="form-label required">經度</label>
                  <input
                    v-model.number="submissionForm.longitude"
                    type="number"
                    step="any"
                    class="form-control"
                    required
                    placeholder="例: 121.7741"
                  />
                </div>
              </div>

              <button
                type="button"
                class="btn btn-soft btn-icon btn-map-select"
                @click="selectLocationOnMap"
              >
                <Icon name="ri:map-pin-range-line" />
                從地圖選擇位置
              </button>
            </div>

            <!-- 分類和聯絡資訊 -->
            <div class="pm-section">
              <h3 class="pm-section__title">其他資訊</h3>

              <div class="mb-3">
                <label class="form-label required">地點分類</label>
                <select v-model="submissionForm.category_id" class="form-select" required>
                  <option value="">請選擇分類</option>
                  <option v-for="category in categories" :key="category.id" :value="category.id">
                    {{ category.name }}
                  </option>
                </select>
              </div>

              <div class="row g-3">
                <div class="col-12 col-sm-6">
                  <label class="form-label">官方網站</label>
                  <input
                    v-model="submissionForm.website"
                    type="url"
                    class="form-control"
                    placeholder="https://..."
                  />
                </div>
                <div class="col-12 col-sm-6">
                  <label class="form-label">聯絡電話</label>
                  <input
                    v-model="submissionForm.phone_number"
                    type="tel"
                    class="form-control"
                    placeholder="03-123-4567"
                  />
                </div>
              </div>
            </div>

            <!-- 提交按鈕 -->
            <div class="pm-actions">
              <button type="button" class="btn btn-ghost" @click="showSubmissionModal = false">
                取消
              </button>
              <button
                type="submit"
                :disabled="isSubmitting"
                class="btn btn-primary btn-icon btn-submit"
              >
                <Icon v-if="isSubmitting" name="ri:loader-4-line" class="loading-spinner" />
                <Icon v-else name="ri:heart-add-line" />
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
/* eslint-disable camelcase, no-unused-vars, require-await, eqeqeq -- 既有邏輯（API 欄位命名、字串/數字 id 比較），本次 UI 重構不更動 */
import { ref, reactive, computed, onMounted, onUnmounted, watch } from 'vue'
import { safeImageUrl } from '~/utils/safe-content.js'

// 取得運行時配置
const config = useRuntimeConfig()

// SEO 設定
useSeoMeta({
  title: '宜蘭行程規劃 - 宜蘭旅遊通',
  description: '規劃您的宜蘭之旅！探索私房景點、在地美食、特色住宿，打造專屬的宜蘭旅遊行程。',
  keywords: '宜蘭旅遊,行程規劃,宜蘭景點,宜蘭美食,宜蘭住宿,旅遊規劃,宜蘭私房景點',
  ogTitle: '宜蘭行程規劃 - 宜蘭旅遊通',
  ogDescription: '規劃您的宜蘭之旅！探索私房景點、在地美食、特色住宿，打造專屬的宜蘭旅遊行程。',
  ogImage: '/yilan-travel.jpg',
  twitterCard: 'summary_large_image',
  canonical: 'https://yilanpass.com/itinerary'
})

useHead({
  link: [
    {
      rel: 'canonical',
      href: 'https://yilanpass.com/itinerary'
    }
  ]
})

// 狀態管理
const loading = ref(true)
const placesError = ref(false)
const places = ref([])
const categories = ref([])
const selectedPlace = ref(null)
const selectedCategories = ref([])
const searchQuery = ref('')
const showFeaturedOnly = ref(false)
const showPrivateOnly = ref(false)

// 分頁相關
const activeTab = ref('places') // 'places' 或 'recommended'

// 行程相關
const itinerary = ref([])
const currentDay = ref(1)
const totalDays = ref(1)
const showSaveModal = ref(false)
const itineraryTitle = ref('')
const itineraryDescription = ref('')

// 地點詳細資訊相關
const showPlaceModal = ref(false)
const placeDetails = ref(null)
const loadingPlaceDetails = ref(false)

// 新增地點相關
const showSubmissionModal = ref(false)

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
})

// Google 搜尋相關
const googleSearchQuery = ref('')
const googleSearchResults = ref([])
const isGoogleSearching = ref(false)
const isSubmitting = ref(false)

// 開源地圖相關 (Leaflet + OpenStreetMap)
let L = null
let map = null
let markersLayer = null
let markers = []
let routePolyline = null
let osmTileLayer = null
let satelliteTileLayer = null
let currentMapType = 'roadmap'
let updateMapSeq = 0

// 推薦行程相關 - 使用 useFetch 在頂層載入
const {
  data: recommendedItinerariesData,
  pending: loadingRecommended,
  error: recommendedError
} = await useFetch('/api/recommended-itineraries')

const recommendedItinerariesFromDB = computed(() => {
  if (recommendedError.value) {
    console.log('載入推薦行程錯誤:', recommendedError.value.message)
    return []
  }

  if (recommendedItinerariesData.value?.success && recommendedItinerariesData.value.data) {
    const itineraries = recommendedItinerariesData.value.data.map((itinerary) => {
      // 轉換 places 資料結構為前端期望的格式
      let places_data = []
      if (itinerary.places && Array.isArray(itinerary.places)) {
        console.log('轉換推薦行程 places 資料:', itinerary.title, itinerary.places)

        places_data = itinerary.places.map((dayData, dayIndex) => {
          console.log(`第 ${dayIndex + 1} 天資料:`, dayData)

          // 如果 dayData 本身就是地點陣列 (新格式: [[{name: "地點1"}, {name: "地點2"}]])
          if (Array.isArray(dayData)) {
            return dayData.map((place) => {
              if (typeof place === 'string') {
                return place
              } else if (place && place.name) {
                return place.name
              } else {
                return String(place)
              }
            })
          }
          // 如果 dayData 包含 places 屬性 (舊格式: [{day: 1, places: [...]}])
          else if (dayData && dayData.places && Array.isArray(dayData.places)) {
            return dayData.places.map((place) => place.name || place)
          }
          // 如果 dayData 本身就是一個地點物件
          else if (dayData && dayData.name) {
            return [dayData.name]
          }
          // 如果 dayData 是字串
          else if (typeof dayData === 'string') {
            return [dayData]
          }

          return []
        })

        console.log('轉換後的 places_data:', places_data)
      }

      return {
        ...itinerary,
        places_data
      }
    })
    console.log('載入推薦行程成功！共', itineraries.length, '筆行程')
    return itineraries
  } else {
    console.log('推薦行程 API 回應格式錯誤')
    return []
  }
})

const userRatings = ref({})

// 計算屬性
const filteredPlaces = computed(() => {
  if (!places.value || !Array.isArray(places.value)) {
    console.log('places.value 為空或不是陣列:', places.value)
    return []
  }

  let filtered = places.value

  // 分類篩選
  if (selectedCategories.value.length > 0) {
    filtered = filtered.filter((place) => selectedCategories.value.includes(place.category_id))
  }

  // 搜尋篩選
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    filtered = filtered.filter(
      (place) =>
        place.name.toLowerCase().includes(query) ||
        (place.formatted_address && place.formatted_address.toLowerCase().includes(query))
    )
  }

  // 精選地點篩選
  if (showFeaturedOnly.value) {
    filtered = filtered.filter((place) => place.is_featured)
  }

  // 私房景點篩選
  if (showPrivateOnly.value) {
    filtered = filtered.filter((place) => place.is_private)
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
  })

  return filtered
})

// 載入資料
const loadPlaces = async () => {
  placesError.value = false
  try {
    console.log('開始載入地點資料...')
    console.log('Google Maps API Key:', config.public.GOOGLE_MAPS_API_KEY ? 'Set' : 'Not set')
    const response = await $fetch('/api/places')
    if (response.success) {
      console.log('地點資料載入成功，數量:', response.data?.length || 0)
      places.value = response.data

      // 檢查前幾個地點的圖片資料
      if (response.data && response.data.length > 0) {
        console.log('前3個地點的圖片資料:')
        response.data.slice(0, 3).forEach((place, index) => {
          console.log(`地點 ${index + 1}: ${place.name}`, {
            hasPhotos: !!(place.photos && place.photos.length > 0),
            photosCount: place.photos?.length || 0,
            firstPhoto: place.photos?.[0]
          })
        })
      }

      // 檢查前幾個地點的座標資料
      if (response.data && response.data.length > 0) {
        console.log('前3個地點的座標資料:')
        response.data.slice(0, 3).forEach((place, index) => {
          console.log(`地點 ${index + 1}: ${place.name}`, {
            latitude: place.latitude,
            longitude: place.longitude,
            type_lat: typeof place.latitude,
            type_lng: typeof place.longitude
          })
        })
      }
    } else {
      console.error('地點資料載入失敗: response.success 為 false')
      placesError.value = true
    }
  } catch (error) {
    console.error('載入地點失敗:', error)
    placesError.value = true
  }
}

const retryPlaces = async () => {
  loading.value = true
  await loadPlaces()
  loading.value = false
}

const loadCategories = async () => {
  try {
    const response = await $fetch('/api/place-categories')
    if (response.success) {
      categories.value = response.data
    }
  } catch (error) {
    console.error('載入分類失敗:', error)
  }
}

// 輔助函數
const getPlaceImage = (place) => {
  console.log('getPlaceImage called for:', place.name, {
    hasPhotos: !!(place.photos && place.photos.length > 0),
    photosCount: place.photos?.length || 0,
    firstPhoto: place.photos?.[0]
  })

  // 使用 Google Photos（目前資料庫中主要的圖片來源）
  if (place.photos && place.photos.length > 0) {
    const photo = place.photos[0]
    if (typeof photo === 'string' && safeImageUrl(photo)) return safeImageUrl(photo)
    if (photo.photo_reference) {
      // 檢查是否有 API key
      const apiKey = config.public.GOOGLE_MAPS_API_KEY
      if (apiKey) {
        const googleImageUrl = `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photo_reference=${encodeURIComponent(
          photo.photo_reference
        )}&key=${apiKey}`
        console.log('Using Google photo URL:', googleImageUrl)
        return googleImageUrl
      } else {
        console.warn('Google Maps API Key not found')
      }
    } else {
      console.warn('No photo_reference found for photo:', photo)
    }
  }

  const storedImage =
    Array.isArray(place.images) &&
    place.images.find((image) => typeof image === 'string' && safeImageUrl(image))
  if (storedImage) return safeImageUrl(storedImage)
  console.log('Using placeholder image for:', place.name)
  return '/images/place-placeholder.svg'
}

const getCategoryName = (categoryId) => {
  const category = categories.value.find((c) => c.id === categoryId)
  return category ? category.name : '未分類'
}

const getCategoryIcon = (categoryId) => {
  const category = categories.value.find((c) => c.id === categoryId)
  return category ? category.icon : 'ri:map-pin-line'
}

const getCategoryCount = (categoryId) => {
  return places.value.filter((p) => p.category_id === categoryId).length
}

// 篩選功能
const toggleCategory = (categoryId) => {
  const index = selectedCategories.value.indexOf(categoryId)
  if (index > -1) {
    selectedCategories.value.splice(index, 1)
  } else {
    selectedCategories.value.push(categoryId)
  }
}

// 地點選擇
const selectPlace = (place) => {
  selectedPlace.value = place

  // 在地圖上突出顯示選中的地點
  if (map && place.latitude && place.longitude) {
    const lat = parseFloat(place.latitude)
    const lng = parseFloat(place.longitude)

    if (!isNaN(lat) && !isNaN(lng) && lat !== 0 && lng !== 0) {
      if (typeof map.setView === 'function') {
        map.setView([lat, lng], 15, { animate: true })
      }
    }
  }

  // 顯示地點詳細資訊
  showPlaceDetails(place)
}

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
    }
    showPlaceModal.value = true
    return
  }

  try {
    loadingPlaceDetails.value = true
    showPlaceModal.value = true

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
    })

    if (response.success && response.data) {
      placeDetails.value = {
        ...place,
        ...response.data,
        photos: response.data.photos || [],
        reviews: response.data.reviews || [],
        opening_hours: response.data.opening_hours || null,
        phone: response.data.formatted_phone_number || null,
        website: response.data.website || null
      }
    } else {
      // 如果 API 調用失敗，顯示基本資訊
      placeDetails.value = {
        ...place,
        photos: [],
        reviews: [],
        opening_hours: null,
        phone: null,
        website: null
      }
    }
  } catch (error) {
    console.error('獲取地點詳細資訊失敗:', error)
    // 如果發生錯誤，顯示基本資訊
    placeDetails.value = {
      ...place,
      photos: [],
      reviews: [],
      opening_hours: null,
      phone: null,
      website: null
    }
  } finally {
    loadingPlaceDetails.value = false
  }
}

// 關閉地點詳細資訊 modal
const closePlaceModal = () => {
  showPlaceModal.value = false
  placeDetails.value = null
}

// 格式化評價時間
const formatReviewTime = (timestamp) => {
  if (!timestamp) return ''

  try {
    const date = new Date(timestamp * 1000) // Google API 返回的是 Unix 時間戳
    const now = new Date()
    const diffTime = Math.abs(now - date)
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    if (diffDays === 1) {
      return '昨天'
    } else if (diffDays < 7) {
      return `${diffDays} 天前`
    } else if (diffDays < 30) {
      const weeks = Math.floor(diffDays / 7)
      return `${weeks} 週前`
    } else if (diffDays < 365) {
      const months = Math.floor(diffDays / 30)
      return `${months} 個月前`
    } else {
      const years = Math.floor(diffDays / 365)
      return `${years} 年前`
    }
  } catch (error) {
    return ''
  }
}

// 行程管理
const addToItinerary = (place) => {
  if (isInItinerary(place.id)) return

  const maxOrder = getCurrentDayPlaces().length

  itinerary.value.push({
    id: Date.now(),
    place,
    day_number: currentDay.value,
    order_in_day: maxOrder + 1,
    duration_minutes: place.recommended_duration || 60
  })

  updateMap()
}

const removeFromItinerary = (itemId) => {
  const index = itinerary.value.findIndex((item) => item.id === itemId)
  if (index > -1) {
    itinerary.value.splice(index, 1)
    reorderDay(currentDay.value)
    updateMap()
  }
}

const isInItinerary = (placeId) => {
  return itinerary.value.some((item) => item.place.id === placeId)
}

const getCurrentDayPlaces = () => {
  return itinerary.value
    .filter((item) => item.day_number === currentDay.value)
    .sort((a, b) => a.order_in_day - b.order_in_day)
}

const moveUp = (itemId) => {
  const item = itinerary.value.find((i) => i.id === itemId)
  if (item && item.order_in_day > 1) {
    const prevItem = itinerary.value.find(
      (i) => i.day_number === item.day_number && i.order_in_day === item.order_in_day - 1
    )

    if (prevItem) {
      ;[item.order_in_day, prevItem.order_in_day] = [prevItem.order_in_day, item.order_in_day]
      updateMap()
    }
  }
}

const moveDown = (itemId) => {
  const item = itinerary.value.find((i) => i.id === itemId)
  const dayPlaces = getCurrentDayPlaces()

  if (item && item.order_in_day < dayPlaces.length) {
    const nextItem = itinerary.value.find(
      (i) => i.day_number === item.day_number && i.order_in_day === item.order_in_day + 1
    )

    if (nextItem) {
      ;[item.order_in_day, nextItem.order_in_day] = [nextItem.order_in_day, item.order_in_day]
      updateMap()
    }
  }
}

const reorderDay = (dayNumber) => {
  const dayItems = itinerary.value
    .filter((item) => item.day_number === dayNumber)
    .sort((a, b) => a.order_in_day - b.order_in_day)

  dayItems.forEach((item, index) => {
    item.order_in_day = index + 1
  })
}

const addDay = () => {
  totalDays.value++
  currentDay.value = totalDays.value
}

// 推薦行程相關函式
const getDifficultyText = (level) => {
  switch (level) {
    case 'easy':
      return '輕鬆'
    case 'medium':
      return '適中'
    case 'hard':
      return '挑戰'
    default:
      return '未分級'
  }
}

const loadItineraryTemplate = async (template) => {
  try {
    console.log('開始套用行程模板:', template.title)
    console.log('模板資料:', template)

    // 確認是否要覆蓋目前的行程
    if (itinerary.value.length > 0) {
      const confirmed = confirm(`套用此推薦行程將清除目前的行程安排，確定要繼續嗎？`)
      if (!confirmed) return
    }

    // 清空目前行程
    itinerary.value = []
    totalDays.value = template.days
    currentDay.value = 1

    let addedPlacesCount = 0
    const missingPlaces = []

    // 載入推薦行程的地點 - 處理多種可能的資料格式
    let placesData = []

    // 檢查是否有 places_data（前端轉換後的格式）
    if (template.places_data && Array.isArray(template.places_data)) {
      placesData = template.places_data
      console.log('使用 places_data 格式:', placesData)
    }
    // 檢查原始的 places 格式（資料庫中的格式）
    else if (template.places && Array.isArray(template.places)) {
      console.log('使用原始 places 格式，進行轉換...')
      console.log('原始 places 資料:', template.places)

      // 處理不同的 places 資料結構
      placesData = template.places.map((dayData, dayIndex) => {
        console.log(`處理第 ${dayIndex + 1} 天資料:`, dayData)

        // 如果 dayData 本身就是地點陣列 (新格式)
        if (Array.isArray(dayData)) {
          return dayData.map((place) => {
            if (typeof place === 'string') {
              return place
            } else if (place && place.name) {
              return place.name
            } else {
              return String(place)
            }
          })
        }
        // 如果 dayData 包含 places 屬性 (舊格式)
        else if (dayData && dayData.places && Array.isArray(dayData.places)) {
          return dayData.places.map((place) => {
            if (typeof place === 'string') {
              return place
            } else if (place && place.name) {
              return place.name
            } else {
              return String(place)
            }
          })
        }
        // 如果 dayData 本身就是一個地點物件
        else if (dayData && dayData.name) {
          return [dayData.name]
        }
        // 如果 dayData 是字串
        else if (typeof dayData === 'string') {
          return [dayData]
        }

        return []
      })
      console.log('轉換後的 placesData:', placesData)
    }

    if (placesData.length > 0) {
      for (let dayIndex = 0; dayIndex < placesData.length; dayIndex++) {
        const dayPlaces = placesData[dayIndex]

        if (Array.isArray(dayPlaces)) {
          for (let placeIndex = 0; placeIndex < dayPlaces.length; placeIndex++) {
            const placeName = dayPlaces[placeIndex]
            console.log(`嘗試匹配地點: "${placeName}"`)

            // 嘗試在現有地點中找到匹配的地點 - 使用更寬鬆的匹配邏輯
            const matchedPlace = places.value.find((p) => {
              const pName = p.name.trim().toLowerCase()
              const searchName = placeName.trim().toLowerCase()

              return (
                pName === searchName ||
                pName.includes(searchName) ||
                searchName.includes(pName) ||
                // 移除括號後再比較
                pName.replace(/[()（）]/g, '') === searchName.replace(/[()（）]/g, '') ||
                // 移除空格後再比較
                pName.replace(/\s/g, '') === searchName.replace(/\s/g, '')
              )
            })

            if (matchedPlace) {
              console.log(`成功匹配地點: "${placeName}" -> "${matchedPlace.name}"`)
              itinerary.value.push({
                id: Date.now() + dayIndex * 1000 + placeIndex,
                place: matchedPlace,
                day_number: dayIndex + 1,
                order_in_day: placeIndex + 1,
                duration_minutes: matchedPlace.recommended_duration || 60
              })
              addedPlacesCount++
            } else {
              console.warn(`找不到匹配的地點: "${placeName}"`)
              missingPlaces.push(placeName)
            }
          }
        }
      }
    }

    console.log('套用結果:', {
      totalDays: totalDays.value,
      addedPlaces: addedPlacesCount,
      missingPlaces,
      finalItinerary: itinerary.value
    })

    // 提供更詳細的結果回饋
    if (addedPlacesCount > 0) {
      let message = `已套用「${template.title}」行程模板！\n成功添加 ${addedPlacesCount} 個地點`
      if (missingPlaces.length > 0) {
        message += `\n\n無法找到以下地點，請手動添加：\n${missingPlaces.join(', ')}`
      }
      alert(message)
    } else {
      alert(
        `套用「${template.title}」行程模板失敗\n找不到任何匹配的地點。\n\n可能原因：\n1. 地點名稱不匹配\n2. 地點資料尚未載入\n\n請稍後重試或手動添加地點。`
      )
    }

    updateMap()
  } catch (error) {
    console.error('載入行程模板失敗:', error)
    alert('載入行程模板失敗，請稍後重試。')
  }
}

const viewItineraryDetails = (itinerary) => {
  // 顯示行程詳細資訊 - 這裡可以開啟一個 modal 或跳轉到詳細頁面
  alert(
    `行程詳情：\n\n標題：${itinerary.title}\n天數：${itinerary.days}天\n描述：${itinerary.description}\n\n功能開發中...`
  )
}

// 推薦地點處理函數
let searchTimeout = null

const handleGoogleSearch = async () => {
  // 清除之前的延遲執行
  if (searchTimeout) {
    clearTimeout(searchTimeout)
  }

  if (!googleSearchQuery.value || googleSearchQuery.value.length < 3) {
    googleSearchResults.value = []
    return
  }

  // 延遲 500ms 執行搜尋，避免過於頻繁的 API 呼叫
  searchTimeout = setTimeout(async () => {
    isGoogleSearching.value = true
    console.log('🔍 開始 Google 搜尋:', googleSearchQuery.value)

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
      })

      console.log('📡 Google API 完整回應:', response)

      if (response.success && response.data) {
        const results = response.data.results || response.data || []
        googleSearchResults.value = results

        console.log('✅ 處理後的搜尋結果:', {
          數量: results.length,
          前三個: results.slice(0, 3).map((r) => ({
            名稱: r.name,
            地址: r.formatted_address || r.vicinity,
            place_id: r.place_id,
            評分: r.rating
          }))
        })

        // 檢查響應式資料是否正確更新
        console.log('📊 響應式資料狀態:', {
          googleSearchResults數量: googleSearchResults.value.length,
          isGoogleSearching: isGoogleSearching.value,
          googleSearchQuery: googleSearchQuery.value
        })
      } else {
        console.warn('⚠️ Google 搜尋無結果或失敗:', response)
        googleSearchResults.value = []
      }
    } catch (error) {
      console.error('❌ Google 搜尋錯誤:', error)
      googleSearchResults.value = []
    } finally {
      isGoogleSearching.value = false
      console.log('🏁 搜尋完成，結果數量:', googleSearchResults.value.length)
    }
  }, 500)
}

const clearGoogleSearch = () => {
  googleSearchQuery.value = ''
  googleSearchResults.value = []
  // 清除延遲執行的搜尋
  if (searchTimeout) {
    clearTimeout(searchTimeout)
    searchTimeout = null
  }
  console.log('🧹 已清除 Google 搜尋')
}

const selectGooglePlaceForSubmission = async (place) => {
  try {
    // 填入基本資訊
    submissionForm.name = place.name
    submissionForm.formatted_address = place.formatted_address
    submissionForm.google_place_id = place.place_id

    if (place.geometry?.location) {
      submissionForm.latitude = place.geometry.location.lat
      submissionForm.longitude = place.geometry.location.lng
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
    })

    if (detailsResponse.success && detailsResponse.data) {
      const details = detailsResponse.data

      // 填入更多詳細資訊
      if (details.website) submissionForm.website = details.website
      if (details.formatted_phone_number)
        submissionForm.phone_number = details.formatted_phone_number

      // 處理 Google Photos - 取前三張圖片並轉換為實際 URL
      if (details.photos && details.photos.length > 0) {
        console.log(`開始載入 ${Math.min(3, details.photos.length)} 張 Google 圖片...`)

        const photoUrls = await Promise.all(
          details.photos.slice(0, 3).map(async (photo, index) => {
            try {
              console.log(`載入第 ${index + 1} 張圖片，photo_reference:`, photo.photo_reference)

              // 使用 Google Places Photo API 取得圖片 URL
              const photoResponse = await $fetch('/api/google/places/photo', {
                method: 'POST',
                body: {
                  photo_reference: photo.photo_reference,
                  maxwidth: 800 // 設定適中的圖片寬度
                }
              })

              if (photoResponse.success && photoResponse.url) {
                console.log(`第 ${index + 1} 張圖片載入成功:`, photoResponse.url)
                return photoResponse.url
              } else {
                console.warn(`第 ${index + 1} 張圖片載入失敗:`, photoResponse)
              }
            } catch (error) {
              console.error(`載入第 ${index + 1} 張圖片時發生錯誤:`, error)
            }
            return null
          })
        )

        // 過濾掉失敗的請求，只保留成功的圖片 URL
        const validPhotoUrls = photoUrls.filter((url) => url !== null)

        if (validPhotoUrls.length > 0) {
          // 將 Google 圖片 URL 添加到表單的 photos 陣列中
          submissionForm.photos = [...(submissionForm.photos || []), ...validPhotoUrls]
          console.log(`✅ 成功載入 ${validPhotoUrls.length} 張 Google 圖片到表單中`)
          console.log('所有圖片 URLs:', submissionForm.photos)
        } else {
          console.warn('⚠️ 沒有成功載入任何 Google 圖片')
        }
      }
    }

    // 清除搜尋結果
    googleSearchResults.value = []
    googleSearchQuery.value = ''

    console.log('✅ Google 地點選擇完成，表單資料:', submissionForm)
  } catch (error) {
    console.error('選擇 Google 地點失敗:', error)
    alert('獲取地點詳細資訊失敗，請手動填入資料')
  }
}

const selectLocationOnMap = () => {
  alert('地圖選點功能開發中，請暫時手動輸入經緯度座標')
  // TODO: 實現地圖選點功能
}

const handlePlaceSubmission = async () => {
  if (isSubmitting.value) return

  isSubmitting.value = true
  try {
    const response = await $fetch('/api/places/submit', {
      method: 'POST',
      body: {
        ...submissionForm,
        submitted_by: 'user', // 可以後續加入用戶認證
        status: 'pending' // 需要審核
      }
    })

    if (response.success) {
      alert('感謝您的推薦！地點已成功提交，待管理員審核通過後將會顯示在地圖上。')

      // 重置表單
      Object.keys(submissionForm).forEach((key) => {
        if (typeof submissionForm[key] === 'string') {
          submissionForm[key] = ''
        } else if (typeof submissionForm[key] === 'number') {
          submissionForm[key] = null
        } else if (Array.isArray(submissionForm[key])) {
          submissionForm[key] = []
        }
      })

      showSubmissionModal.value = false
    } else {
      alert('提交失敗：' + (response.message || '未知錯誤'))
    }
  } catch (error) {
    console.error('提交地點失敗:', error)
    alert('提交失敗，請檢查網路連線後重試')
  } finally {
    isSubmitting.value = false
  }
}

// 圖片處理函式
const removePhoto = (index) => {
  submissionForm.photos.splice(index, 1)
  console.log(`已移除第 ${index + 1} 張圖片，剩餘 ${submissionForm.photos.length} 張`)
}

const handleImageError = (index) => {
  console.error(`第 ${index + 1} 張圖片載入失敗，將從列表中移除`)
  removePhoto(index)
}

// 新增地點處理函數
const onPlaceSubmitted = (newPlace) => {
  console.log('地點提交成功:', newPlace)
  // 提示用戶地點已提交審核
  alert('感謝您的推薦！地點已提交審核，通過後將出現在地圖上。')

  // 可選：重新載入地點資料以包含新提交的地點（如果後端立即返回）
  // loadPlaces();
}

const onSelectLocation = () => {
  // 實作地圖選點功能
  console.log('開啟地圖選點模式')
  showSubmissionModal.value = false
  alert('地圖選點功能將在下個版本推出\n目前請手動輸入座標')
  // TODO: 實作地圖點擊選取座標功能
  showSubmissionModal.value = true
}

// 開源地圖初始化 (Leaflet + OpenStreetMap)
const initMap = async () => {
  if (process.server) return

  if (!L) {
    L = await import('leaflet')
  }

  const mapElement = document.getElementById('itinerary-map')
  if (!mapElement) {
    console.error('Map container element not found')
    return
  }

  if (map) {
    await updateMap()
    return
  }

  map = L.map(mapElement, {
    center: [24.7021, 121.7378], // 宜蘭中心點
    zoom: 11,
    zoomControl: false
  })

  L.control.zoom({ position: 'bottomright' }).addTo(map)

  osmTileLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    maxZoom: 19
  })

  satelliteTileLayer = L.tileLayer(
    'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    {
      attribution:
        'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and GIS Community',
      maxZoom: 18
    }
  )

  osmTileLayer.addTo(map)
  currentMapType = 'roadmap'

  markersLayer = L.layerGroup().addTo(map)
  console.log('Leaflet Map initialization completed')
  await updateMap()
}

const escapeHtml = (str) => {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

// 創建基本地點資訊的 InfoWindow 內容 - 不載入詳細資料
const createBasicPlaceInfoWindowContent = (place) => {
  console.log('創建基本地點資訊:', place.name)

  const safeName = escapeHtml(place.name)
  const safeAddress = escapeHtml(place.address || '地址資訊不詳')
  const safeId = escapeHtml(place.id)

  // 基本照片
  const basicImageHtml = `<img src="${escapeHtml(
    safeImageUrl(getPlaceImage(place))
  )}" alt="${safeName}" style="width: 50px; height: 50px; object-fit: cover; border-radius: 4px;">`

  return `
    <div style="max-width: 300px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
      <div style="display: flex; gap: 12px; align-items: flex-start;">
        ${basicImageHtml}
        <div style="flex: 1; min-width: 0;">
          <h4 style="margin: 0 0 8px 0; font-size: 16px; font-weight: 600; color: #13303A; line-height: 1.3;">${safeName}</h4>
          <p style="margin: 0 0 8px 0; color: #5E7780; font-size: 13px; line-height: 1.4;">${safeAddress}</p>
          <div style="display: flex; gap: 8px; flex-wrap: wrap;">
            <button
              onclick="window.addPlaceToItinerary('${safeId}')"
              style="background: #16A34A; color: white; border: none; padding: 6px 12px; border-radius: 6px; font-size: 12px; cursor: pointer; transition: background 0.2s;"
              onmouseover="this.style.background='#15803d'"
              onmouseout="this.style.background='#16A34A'"
            >
              加入行程
            </button>
          </div>
        </div>
      </div>
    </div>
  `
}

// 創建地點詳細資訊的 InfoWindow 內容 - 支援點擊時重新載入最新 Google 資料
const createPlaceInfoWindowContent = async (place, forceRefresh = false) => {
  let placeDetails = place
  let hasGoogleData = false

  console.log('正在載入地點詳細資訊:', place.name, {
    hasGooglePlaceId: !!place.google_place_id,
    googlePlaceId: place.google_place_id,
    forceRefresh
  })

  // 嘗試使用多種方式獲取最新的 Google 資料
  if (place.google_place_id) {
    try {
      console.log('使用 google_place_id 獲取最新詳細資訊...')
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
      })

      if (response.success && response.data) {
        placeDetails = { ...place, ...response.data }
        hasGoogleData = true
        console.log('成功獲取最新 Google 資料:', {
          rating: placeDetails.rating,
          reviewsCount: placeDetails.reviews?.length || 0,
          photosCount: placeDetails.photos?.length || 0,
          businessStatus: placeDetails.business_status
        })
      }
    } catch (error) {
      console.error('使用 google_place_id 獲取詳細資訊失敗:', error)
    }
  }

  // 如果沒有 google_place_id 或者獲取失敗，嘗試使用地點名稱搜尋
  if (!hasGoogleData && place.name) {
    try {
      console.log('使用地點名稱搜尋最新 Google Places 資料...')
      const searchResponse = await $fetch('/api/google/places/search', {
        method: 'POST',
        body: {
          query: place.name,
          location:
            place.latitude && place.longitude
              ? {
                  lat: parseFloat(place.latitude),
                  lng: parseFloat(place.longitude)
                }
              : null,
          radius: 1000 // 1公里範圍內搜尋
        }
      })

      if (searchResponse.success && searchResponse.data && searchResponse.data.length > 0) {
        const foundPlace = searchResponse.data[0]
        console.log('找到匹配的 Google Place:', foundPlace.name)

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
        })

        if (detailsResponse.success && detailsResponse.data) {
          placeDetails = { ...place, ...detailsResponse.data }
          hasGoogleData = true
          console.log('成功獲取搜尋到的最新 Google 資料:', {
            rating: placeDetails.rating,
            reviewsCount: placeDetails.reviews?.length || 0,
            photosCount: placeDetails.photos?.length || 0
          })
        }
      }
    } catch (error) {
      console.error('搜尋地點失敗:', error)
    }
  }

  const safeName = escapeHtml(placeDetails.name)
  const safeId = escapeHtml(placeDetails.id)

  // 取得當前時間用於顯示資料新鮮度
  const now = new Date()
  const timeString = now.toLocaleTimeString('zh-TW', {
    hour: '2-digit',
    minute: '2-digit'
  })

  // 生成照片 HTML
  const photosHtml =
    placeDetails.photos && placeDetails.photos.length > 0
      ? placeDetails.photos
          .slice(0, 3)
          .map((photo) => {
            const photoUrl = photo.photo_reference
              ? `https://maps.googleapis.com/maps/api/place/photo?maxwidth=150&photo_reference=${encodeURIComponent(
                  photo.photo_reference
                )}&key=${config.public.GOOGLE_MAPS_API_KEY}`
              : getPlaceImage(placeDetails)
            return `<img src="${escapeHtml(
              safeImageUrl(photoUrl)
            )}" alt="${safeName}" style="width: 50px; height: 50px; object-fit: cover; border-radius: 4px; margin-right: 4px;">`
          })
          .join('')
      : `<img src="${escapeHtml(
          safeImageUrl(getPlaceImage(placeDetails))
        )}" alt="${safeName}" style="width: 50px; height: 50px; object-fit: cover; border-radius: 4px;">`

  // 生成評分 HTML
  const ratingHtml = placeDetails.rating
    ? `
      <div style="display: flex; align-items: center; margin: 8px 0;">
        <div style="display: flex; margin-right: 8px;">
          ${Array.from(
            { length: 5 },
            (_, i) =>
              `<span style="color: ${
                i < Math.floor(placeDetails.rating) ? '#D97706' : '#DCEBEF'
              }; font-size: 14px;">★</span>`
          ).join('')}
        </div>
        <span style="font-weight: 600; margin-right: 4px;">${escapeHtml(placeDetails.rating)}</span>
        <span style="color: #5E7780; font-size: 12px;">(${escapeHtml(
          placeDetails.user_ratings_total || 0
        )} 則評價)</span>
        ${
          hasGoogleData
            ? `<span style="color: #16A34A; font-size: 10px; margin-left: 8px;">● 最新資料 ${timeString}</span>`
            : ''
        }
      </div>
    `
    : hasGoogleData
    ? `
      <div style="margin: 8px 0;">
        <span style="color: #8BA1A8; font-size: 11px;">暫無評分資料 ${timeString}</span>
      </div>
    `
    : ''

  // 營業狀態 HTML
  const businessStatusHtml = placeDetails.business_status
    ? `
    <div style="margin: 4px 0;">
      <span style="font-size: 11px; padding: 2px 6px; border-radius: 3px; ${
        placeDetails.business_status === 'OPERATIONAL'
          ? 'background: #E7F6EC; color: #15803d;'
          : placeDetails.business_status === 'CLOSED_TEMPORARILY'
          ? 'background: #FEF3DC; color: #b45309;'
          : placeDetails.business_status === 'CLOSED_PERMANENTLY'
          ? 'background: #FDECEC; color: #b91c1c;'
          : 'background: #EEF5F7; color: #5E7780;'
      }">
        ${
          placeDetails.business_status === 'OPERATIONAL'
            ? '營業中'
            : placeDetails.business_status === 'CLOSED_TEMPORARILY'
            ? '暫時關閉'
            : placeDetails.business_status === 'CLOSED_PERMANENTLY'
            ? '永久關閉'
            : '狀態未知'
        }
      </span>
    </div>
  `
    : ''

  // 生成評論 HTML
  const reviewsHtml =
    placeDetails.reviews && placeDetails.reviews.length > 0
      ? `
      <div style="margin: 8px 0;">
        <strong style="font-size: 12px; color: #5E7780;">最新評價 ${
          hasGoogleData ? `(來自 Google ${timeString})` : '(本地資料)'
        }：</strong>
        ${placeDetails.reviews
          .slice(0, 2)
          .map(
            (review) => `
          <div style="margin: 4px 0; padding: 4px; background: #F6FAFB; border-radius: 4px; font-size: 11px;">
            <div style="display: flex; align-items: center; margin-bottom: 2px;">
              <strong style="font-size: 11px;">${escapeHtml(
                review.author_name || '匿名用戶'
              )}</strong>
              <div style="margin-left: 8px;">
                ${Array.from(
                  { length: 5 },
                  (_, i) =>
                    `<span style="color: ${
                      i < (review.rating || 0) ? '#D97706' : '#DCEBEF'
                    }; font-size: 10px;">★</span>`
                ).join('')}
              </div>
              ${
                review.relative_time_description
                  ? `<span style="margin-left: 8px; color: #8BA1A8; font-size: 9px;">${escapeHtml(
                      review.relative_time_description
                    )}</span>`
                  : ''
              }
            </div>
            <p style="margin: 2px 0; line-height: 1.3; color: #5E7780;">${escapeHtml(
              (review.text || '').length > 100
                ? (review.text || '').substring(0, 100) + '...'
                : review.text || '無評論內容'
            )}</p>
          </div>
        `
          )
          .join('')}
      </div>
    `
      : hasGoogleData
      ? `
      <div style="margin: 8px 0;">
        <span style="font-size: 11px; color: #8BA1A8;">暫無 Google 評論資料 (${timeString})</span>
      </div>
    `
      : `
      <div style="margin: 8px 0;">
        <span style="font-size: 11px; color: #8BA1A8;">正在載入評論資料...</span>
      </div>
    `

  // 聯絡資訊 HTML
  const contactHtml =
    placeDetails.formatted_phone_number || placeDetails.website
      ? `
      <div style="margin: 8px 0; font-size: 11px;">
        ${
          placeDetails.formatted_phone_number
            ? `<div><strong>電話:</strong> ${escapeHtml(placeDetails.formatted_phone_number)}</div>`
            : ''
        }
        ${
          placeDetails.website
            ? `<div><strong>網站:</strong> <a href="${escapeHtml(
                safeImageUrl(placeDetails.website)
              )}" target="_blank" rel="noopener noreferrer" style="color: #0A9EC0;">查看</a></div>`
            : ''
        }
      </div>
    `
      : ''

  // 價格等級 HTML
  const priceLevelHtml =
    placeDetails.price_level !== undefined
      ? `
    <div style="margin: 4px 0; font-size: 11px;">
      <strong>價格等級:</strong> ${'$'.repeat(placeDetails.price_level || 1)}
    </div>
  `
      : ''

  return `
    <div style="max-width: 320px; font-family: system-ui;">
      <div style="margin-bottom: 8px;">
        <h4 style="margin: 0 0 4px 0; font-size: 16px; font-weight: 600; color: #13303A;">${safeName}</h4>
        <p style="margin: 0; color: #5E7780; font-size: 12px;">${escapeHtml(
          getCategoryName(placeDetails.category_id)
        )}</p>
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
        <button onclick="window.selectPlaceFromMap('${safeId}')" 
                style="background: #0A9EC0; color: white; border: none; padding: 4px 8px; border-radius: 4px; font-size: 11px; cursor: pointer;">
          查看詳情
        </button>
        <button onclick="window.addPlaceToItinerary('${safeId}')" 
                style="background: #16A34A; color: white; border: none; padding: 4px 8px; border-radius: 4px; font-size: 11px; cursor: pointer;">
          加入行程
        </button>
      </div>
    </div>
  `
}

const updateMap = async () => {
  console.log('=== updateMap 開始執行 ===')

  if (!map || !markersLayer || !L) {
    console.log('地圖尚未初始化，跳過更新')
    return
  }

  const currentSeq = ++updateMapSeq

  // 清除現有標記
  markersLayer.clearLayers()
  markers = []

  // 清除舊路線
  if (routePolyline) {
    map.removeLayer(routePolyline)
    routePolyline = null
  }

  console.log('清除舊標記完成')

  const allPlaces = filteredPlaces.value
  const dayPlaces = getCurrentDayPlaces()

  console.log('開始更新地圖標記...')
  console.log('總地點數量:', allPlaces?.length || 0)
  console.log('當天行程地點數量:', dayPlaces?.length || 0)

  let validPlaceCount = 0
  let invalidPlaceCount = 0

  if (allPlaces && Array.isArray(allPlaces)) {
    for (const place of allPlaces) {
      const lat = parseFloat(place.latitude)
      const lng = parseFloat(place.longitude)

      if (
        !place.latitude ||
        !place.longitude ||
        isNaN(lat) ||
        isNaN(lng) ||
        lat === 0 ||
        lng === 0
      ) {
        invalidPlaceCount++
        continue
      }

      validPlaceCount++
      const isInItinerary = dayPlaces.some((item) => item.place.id === place.id)

      const markerIcon = L.divIcon({
        className: 'itinerary-marker-wrapper',
        html: `
          <div class="itinerary-custom-marker">
            <div class="itinerary-marker-label">${escapeHtml(place.name)}</div>
            <div class="itinerary-marker-pin ${isInItinerary ? 'in-itinerary' : ''}">
              <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32">
                <circle cx="16" cy="16" r="13" fill="${
                  isInItinerary ? '#16A34A' : '#0A9EC0'
                }" stroke="white" stroke-width="2"/>
                <text x="16" y="20" text-anchor="middle" fill="white" font-size="12" font-weight="bold">
                  ${isInItinerary ? '✓' : '●'}
                </text>
              </svg>
            </div>
          </div>
        `,
        iconSize: [32, 32],
        iconAnchor: [16, 16],
        popupAnchor: [0, -18]
      })

      const marker = L.marker([lat, lng], { icon: markerIcon })
      marker.place = place

      // 點擊 Marker 顯示 Popup
      marker.on('click', async () => {
        const loadingContent = `
          <div style="max-width: 300px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 20px; text-align: center;">
            <div style="display: flex; align-items: center; justify-content: center; gap: 8px; margin-bottom: 12px;">
              <div style="width: 20px; height: 20px; border: 2px solid #DCEBEF; border-top: 2px solid #0A9EC0; border-radius: 50%; animation: itin-spin 1s linear infinite;"></div>
              <span style="color: #5E7780; font-size: 14px;">正在載入詳細資料...</span>
            </div>
            <p style="margin: 0; color: #8BA1A8; font-size: 12px;">請稍候片刻</p>
          </div>
        `
        marker.bindPopup(loadingContent, { maxWidth: 320 }).openPopup()

        try {
          const detailedContent = await createPlaceInfoWindowContent(place, true)
          marker.setPopupContent(detailedContent)
        } catch (error) {
          console.error('載入地點詳細資訊失敗:', error)
          const basicContent = createBasicPlaceInfoWindowContent(place)
          marker.setPopupContent(basicContent)
        }
      })

      marker.addTo(markersLayer)
      markers.push(marker)
    }
  }

  // 繪製行程路線（只針對當天行程中的地點）
  if (dayPlaces.length > 1) {
    const validDayPlaces = dayPlaces.filter((item) => {
      const lat = parseFloat(item.place.latitude)
      const lng = parseFloat(item.place.longitude)
      return (
        item.place.latitude &&
        item.place.longitude &&
        !isNaN(lat) &&
        !isNaN(lng) &&
        lat !== 0 &&
        lng !== 0
      )
    })

    if (validDayPlaces.length > 1) {
      const coords = validDayPlaces
        .map((item) => `${parseFloat(item.place.longitude)},${parseFloat(item.place.latitude)}`)
        .join(';')

      try {
        const res = await fetch(
          `https://router.project-osrm.org/route/v1/driving/${coords}?overview=full&geometries=geojson`
        )
        const data = await res.json()

        if (currentSeq !== updateMapSeq) return

        if (data.code === 'Ok' && data.routes && data.routes[0]) {
          const latLngs = data.routes[0].geometry.coordinates.map((coord) => [coord[1], coord[0]])
          if (routePolyline) {
            map.removeLayer(routePolyline)
          }
          routePolyline = L.polyline(latLngs, {
            color: '#0A9EC0',
            weight: 4,
            opacity: 0.85
          }).addTo(map)
        } else {
          throw new Error('OSRM route failed')
        }
      } catch (err) {
        if (currentSeq !== updateMapSeq) return
        console.warn('OSRM 路線獲取失敗，改用直連線條:', err)
        if (routePolyline) {
          map.removeLayer(routePolyline)
        }
        const directCoords = validDayPlaces.map((item) => [
          parseFloat(item.place.latitude),
          parseFloat(item.place.longitude)
        ])
        routePolyline = L.polyline(directCoords, {
          color: '#0A9EC0',
          weight: 4,
          opacity: 0.85,
          dashArray: '6, 6'
        }).addTo(map)
      }
    }
  }

  console.log('地圖更新完成統計:')
  console.log('- 有效地點:', validPlaceCount)
  console.log('- 無效地點:', invalidPlaceCount)
  console.log('- 總標記數量:', markers.length)

  // 調整視野以容納所有標記
  if (markers.length > 0) {
    if (markers.length === 1) {
      map.setView(markers[0].getLatLng(), 15)
    } else {
      const bounds = L.latLngBounds(markers.map((m) => m.getLatLng()))
      map.fitBounds(bounds, { padding: [40, 40] })
    }
  } else {
    map.setView([24.7021, 121.7378], 11)
  }
}

const centerMap = () => {
  if (!map || !L) return

  const dayPlaces = getCurrentDayPlaces()
  const validDayPlaces = dayPlaces.filter((item) => {
    const lat = parseFloat(item.place.latitude)
    const lng = parseFloat(item.place.longitude)
    return (
      item.place.latitude &&
      item.place.longitude &&
      !isNaN(lat) &&
      !isNaN(lng) &&
      lat !== 0 &&
      lng !== 0
    )
  })

  if (validDayPlaces.length === 0) {
    map.setView([24.7021, 121.7378], 11)
    return
  }

  const bounds = L.latLngBounds(
    validDayPlaces.map((item) => [
      parseFloat(item.place.latitude),
      parseFloat(item.place.longitude)
    ])
  )
  map.fitBounds(bounds, { padding: [40, 40] })
}

const toggleMapType = () => {
  if (!map || !osmTileLayer || !satelliteTileLayer) return

  if (currentMapType === 'roadmap') {
    map.removeLayer(osmTileLayer)
    satelliteTileLayer.addTo(map)
    currentMapType = 'satellite'
  } else {
    map.removeLayer(satelliteTileLayer)
    osmTileLayer.addTo(map)
    currentMapType = 'roadmap'
  }
}

// 行程儲存
const saveItinerary = async () => {
  try {
    const response = await $fetch('/api/itineraries', {
      method: 'POST',
      body: {
        title: itineraryTitle.value,
        description: itineraryDescription.value,
        days: totalDays.value,
        places: itinerary.value.map((item) => ({
          place_id: item.place.id,
          day_number: item.day_number,
          order_in_day: item.order_in_day,
          duration_minutes: item.duration_minutes
        }))
      }
    })

    if (response.success) {
      showSaveModal.value = false
      alert('行程已儲存成功！')

      // 重置表單
      itineraryTitle.value = ''
      itineraryDescription.value = ''
    }
  } catch (error) {
    console.error('儲存行程失敗:', error)
    alert('儲存失敗，請重試')
  }
}

// 監聽當前天數變化
watch(currentDay, () => {
  updateMap()
})

// 監聽地點資料變化
watch(
  places,
  (newPlaces) => {
    console.log('places 資料變化:', newPlaces?.length || 0)
    if (map && newPlaces && newPlaces.length > 0) {
      console.log('觸發地圖更新（因為地點資料變化）')
      updateMap()
    }
  },
  { immediate: false }
)

// 初始化
onMounted(async () => {
  console.log('Itinerary component mounted')

  // 添加全域函數供 InfoWindow 使用
  window.selectPlaceFromMap = (placeId) => {
    const place = places.value.find((p) => p.id == placeId)
    if (place) {
      selectPlace(place)
    }
  }

  window.addPlaceToItinerary = (placeId) => {
    console.log('Adding place to itinerary:', placeId)
    const place = places.value.find((p) => p.id == parseInt(placeId))
    if (place) {
      console.log('Found place:', place.name)
      addToItinerary(place)
    } else {
      console.error('找不到地點:', placeId)
    }
  }

  // 重新整理地點 Google 資訊的全域函數

  try {
    await Promise.all([loadPlaces(), loadCategories()])

    console.log('Data loaded, initializing open-source map...')
    await initMap()
    if (places.value && places.value.length > 0) {
      console.log('地點資料已載入，立即更新地圖')
      await updateMap()
    }
  } catch (error) {
    console.error('初始化頁面資料或地圖失敗:', error)
  } finally {
    loading.value = false
  }
})

onUnmounted(() => {
  if (searchTimeout) {
    clearTimeout(searchTimeout)
    searchTimeout = null
  }
  if (map) {
    map.remove()
    map = null
  }
  markersLayer = null
  markers = []
  routePolyline = null
})
</script>

<style lang="scss">
// 非 scoped：地圖 popup 的 inline HTML 會引用這個動畫
@keyframes itin-spin {
  to {
    transform: rotate(360deg);
  }
}
</style>

<style lang="scss" scoped>
$itin-sidebar-w: 380px;
$itin-success-ink: darken($yp-success, 10%);
$itin-warning-ink: darken($yp-warning, 8%);

.loading-spinner {
  animation: itin-spin 1s linear infinite;
}

// ───── 版面 ─────
.main-content {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 16px;
  align-items: start;

  @media (min-width: $yp-bp-lg) {
    grid-template-columns: $itin-sidebar-w minmax(0, 1fr);
    gap: 24px;
  }
}

.sidebar {
  display: flex;
  flex-direction: column;

  @media (min-width: $yp-bp-lg) {
    position: sticky;
    top: calc(#{$yp-header-h} + 16px);
    max-height: calc(100vh - #{$yp-header-h} - 32px);
  }
}

.main-panel {
  display: flex;
  flex-direction: column;
  gap: 16px;
  min-width: 0;
}

// ───── 篩選區 ─────
.filter-section {
  flex: none;
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding: 16px;
  border-bottom: 1px solid $yp-line;
}

.tab-selector {
  display: flex;
  width: 100%;

  .tab-btn {
    flex: 1;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    min-height: 40px;
    font-weight: 500;
  }

  .count {
    font-family: $yp-font-num;
    font-size: 0.75rem;
    opacity: 0.75;
  }
}

.filter-body {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.itin-search {
  position: relative;

  &__icon {
    position: absolute;
    left: 14px;
    top: 50%;
    transform: translateY(-50%);
    color: $yp-subtle;
    font-size: 1.125rem;
    pointer-events: none;
  }

  &__input {
    padding-left: 40px;
    padding-right: 38px;
  }

  &__clear {
    position: absolute;
    right: 8px;
    top: 50%;
    transform: translateY(-50%);
    width: 26px;
    height: 26px;
    display: grid;
    place-items: center;
    padding: 0;
    border: 0;
    border-radius: 50%;
    background: $yp-surface-2;
    color: $yp-muted;
    cursor: pointer;

    &:hover {
      color: $yp-ink;
    }
  }
}

.category-filters {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;

  .category-btn {
    font-size: 0.8125rem;
  }
}

.additional-filters {
  display: flex;
  flex-wrap: wrap;
  gap: 8px 20px;

  .form-check {
    margin: 0;
    font-size: 0.875rem;
    color: $yp-muted;
  }

  .form-check-input:checked {
    background-color: $yp-primary;
    border-color: $yp-primary;
  }
}

// ───── 列表 ─────
.content-list {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: 0 12px 12px;
  max-height: 60vh;

  @media (min-width: $yp-bp-lg) {
    max-height: none;
  }
}

.list-title {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin: 0;
  padding: 14px 4px 10px;
  font-size: 0.9375rem;
  font-weight: 700;
  color: $yp-ink;
}

.places-grid,
.recommended-grid {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.place-card {
  display: grid;
  grid-template-columns: 92px minmax(0, 1fr);
  gap: 12px;
  padding: 10px;
  border: 1px solid $yp-line;
  border-radius: $yp-radius;
  background: $yp-surface;
  cursor: pointer;
  transition:
    border-color 0.15s ease,
    box-shadow 0.15s ease,
    background-color 0.15s ease;

  &:hover {
    border-color: $yp-primary;
  }

  &.selected {
    border-color: $yp-primary;
    background: $yp-primary-soft;
    box-shadow: 0 0 0 2px rgba($yp-primary, 0.2);
  }

  &.is-skeleton {
    cursor: default;

    &:hover {
      border-color: $yp-line;
    }

    .place-image {
      height: 92px;
    }
  }
}

.place-image {
  position: relative;
  width: 92px;
  aspect-ratio: 1;
  border-radius: 10px;
  overflow: hidden;
  background: $yp-surface-2;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
  }
}

.place-badges {
  position: absolute;
  top: 4px;
  left: 4px;
  display: flex;
  gap: 4px;

  .featured-badge,
  .private-badge {
    width: 20px;
    height: 20px;
    display: grid;
    place-items: center;
    border-radius: 50%;
    font-size: 0.6875rem;
    color: #fff;
  }

  .featured-badge {
    background: $yp-warning;
  }

  .private-badge {
    background: $yp-ink;
  }
}

.place-info {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.place-name {
  margin: 0;
  font-size: 0.9375rem;
  font-weight: 700;
  line-height: 1.4;
  color: $yp-ink;
}

.rating-count {
  font-size: 0.6875rem;
  opacity: 0.8;
}

.place-address {
  font-size: 0.75rem;
  color: $yp-muted;

  .icon {
    vertical-align: -2px;
    margin-right: 2px;
  }
}

.place-actions {
  margin-top: auto;

  .btn-add {
    min-height: 34px;
  }
}

// ───── 推薦行程 ─────
.recommended-card {
  .recommended-image {
    position: relative;
    aspect-ratio: 16 / 9;
    width: 100%;
    background: $yp-surface-2;
    overflow: hidden;

    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      display: block;
    }
  }

  .recommended-badges {
    position: absolute;
    left: 10px;
    bottom: 10px;
    display: flex;
    gap: 6px;

    .days-badge {
      background: rgba(#fff, 0.94);
    }
  }

  .recommended-info {
    display: flex;
    flex-direction: column;
    gap: 8px;
    padding: 14px 16px 16px;
  }

  .recommended-title {
    margin: 0;
    font-size: 1rem;
    font-weight: 700;
    line-height: 1.4;
    color: $yp-ink;
  }

  .recommended-description {
    margin: 0;
    font-size: 0.875rem;
    color: $yp-muted;
  }

  .recommended-rating {
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: 0.8125rem;
    font-weight: 700;
    color: $itin-warning-ink;
  }

  .recommended-actions {
    display: flex;
    gap: 8px;
    margin-top: 4px;

    .btn {
      flex: 1;
    }
  }
}

.difficulty-badge {
  &.easy {
    background: $yp-success-soft;
    color: $itin-success-ink;
  }

  &.medium {
    background: $yp-warning-soft;
    color: $itin-warning-ink;
  }

  &.hard {
    background: $yp-danger-soft;
    color: darken($yp-danger, 10%);
  }
}

// ───── 我的行程 ─────
.overview-title {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;

  .icon {
    color: $yp-primary;
    font-size: 1.25rem;
  }
}

.overview-body {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 16px;

  @media (min-width: $yp-bp-md) {
    padding: 20px;
  }
}

#my-itinerary {
  scroll-margin-top: calc(#{$yp-header-h} + 12px);
}

.empty-day {
  padding: 28px 12px;
}

.itinerary-timeline {
  list-style: none;
  margin: 0;
  padding: 0;
}

.timeline-item {
  position: relative;
  padding: 0 0 12px 40px;

  &:last-child {
    padding-bottom: 0;
  }

  // 連接線
  &:not(:last-child)::before {
    content: '';
    position: absolute;
    left: 13px;
    top: 40px;
    bottom: -12px;
    width: 2px;
    background: $yp-line;
  }

  @media (min-width: $yp-bp-md) {
    padding-left: 48px;

    &:not(:last-child)::before {
      left: 15px;
    }
  }
}

.timeline-marker {
  position: absolute;
  left: 0;
  top: 14px;
  width: 28px;
  height: 28px;
  display: grid;
  place-items: center;
  border-radius: 50%;
  background: $yp-primary;
  color: #fff;
  font-family: $yp-font-num;
  font-size: 0.8125rem;
  font-weight: 700;
  box-shadow: 0 0 0 4px $yp-surface;

  @media (min-width: $yp-bp-md) {
    width: 32px;
    height: 32px;
    top: 12px;
  }
}

.timeline-content {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 6px 8px;
  padding: 8px;
  border: 1px solid $yp-line;
  border-radius: $yp-radius;
  background: $yp-surface;

  @media (min-width: $yp-bp-md) {
    flex-wrap: nowrap;
  }
}

.timeline-place {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1 1 200px;
  min-width: 0;

  img {
    flex: none;
    width: 56px;
    height: 56px;
    border-radius: 8px;
    object-fit: cover;
    background: $yp-surface-2;
  }

  .place-details {
    flex: 1;
    min-width: 0;

    h4 {
      margin: 0 0 4px;
      font-size: 0.9375rem;
      font-weight: 700;
      color: $yp-ink;
    }
  }
}

.timeline-actions {
  display: flex;
  flex: none;
  gap: 2px;
  margin-left: auto;

  .btn-move,
  .btn-remove {
    width: 38px;
    height: 38px;
    padding: 0;
    display: inline-grid;
    place-items: center;
    font-size: 1.125rem;

    &:disabled {
      opacity: 0.3;
    }
  }

  .btn-remove {
    --bs-btn-hover-color: #{$yp-danger};
    --bs-btn-hover-bg: #{$yp-danger-soft};
  }
}

// ───── 地圖 ─────
.map-container {
  position: relative;
  z-index: 0;
  isolation: isolate;
  height: clamp(320px, 55vh, 560px);

  .map {
    width: 100%;
    height: 100%;
  }
}

.map-controls {
  position: absolute;
  top: 12px;
  right: 12px;
  z-index: 1001;
  display: flex;
  flex-direction: column;
  gap: 8px;

  .btn-control {
    width: 40px;
    height: 40px;
    display: grid;
    place-items: center;
    padding: 0;
    border: 1px solid $yp-line;
    border-radius: $yp-radius-sm;
    background: $yp-surface;
    color: $yp-ink;
    font-size: 1.125rem;
    cursor: pointer;
    box-shadow: $yp-shadow-sm;
    transition:
      border-color 0.15s ease,
      color 0.15s ease;

    &:hover {
      border-color: $yp-primary;
      color: $yp-primary-ink;
    }
  }
}

// ───── 浮動儲存 ─────
.floating-save {
  position: fixed;
  right: 16px;
  bottom: calc(var(--yp-tabbar-h) + 16px + env(safe-area-inset-bottom));
  z-index: 1000;

  @media (min-width: $yp-bp-md) {
    right: 24px;
    bottom: 24px;
  }

  .btn-save-float {
    padding: 0.7rem 1.4rem;
    font-weight: 700;
    box-shadow: $yp-shadow-lg;
  }
}

// ───── 模態框 ─────
.modal-overlay {
  position: fixed;
  inset: 0;
  z-index: 1090;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  background: rgba($yp-ink, 0.45);

  @media (min-width: $yp-bp-md) {
    align-items: center;
    padding: 24px;
  }
}

.save-modal,
.place-modal,
.place-submission-modal {
  display: flex;
  flex-direction: column;
  width: 100%;
  max-height: 92vh;
  overflow: hidden;
  background: $yp-surface;
  border-radius: $yp-radius-lg $yp-radius-lg 0 0;
  box-shadow: 0 24px 48px -16px rgba($yp-ink, 0.4);

  @media (min-width: $yp-bp-md) {
    max-height: calc(100vh - 48px);
    border-radius: $yp-radius-lg;
  }
}

.save-modal {
  max-width: 480px;
}

.place-modal {
  max-width: 640px;
}

.place-submission-modal {
  max-width: 680px;
}

.pm-head {
  flex: none;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 14px 20px;
  border-bottom: 1px solid $yp-line;
}

.pm-title {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0;
  font-size: 1.0625rem;
  font-weight: 700;
  color: $yp-ink;

  .icon {
    color: $yp-primary;
  }
}

.pm-close {
  flex: none;
  width: 40px;
  height: 40px;
  display: grid;
  place-items: center;
  padding: 0;
  border: 0;
  border-radius: 50%;
  background: transparent;
  color: $yp-muted;
  font-size: 1.25rem;
  cursor: pointer;

  &:hover {
    background: $yp-surface-2;
    color: $yp-ink;
  }
}

.pm-body {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: 20px 20px calc(20px + env(safe-area-inset-bottom));
}

.pm-actions {
  position: sticky;
  bottom: 0;
  z-index: 2;
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin: 8px -20px calc(-20px - env(safe-area-inset-bottom));
  padding: 12px 20px calc(12px + env(safe-area-inset-bottom));
  background: $yp-surface;
  border-top: 1px solid $yp-line;
}

.pm-section {
  margin-bottom: 20px;
  padding-bottom: 20px;
  border-bottom: 1px solid $yp-line;

  &:nth-last-child(2) {
    border-bottom: 0;
    margin-bottom: 0;
    padding-bottom: 0;
  }

  &__title {
    display: flex;
    align-items: center;
    gap: 6px;
    margin: 0 0 12px;
    font-size: 0.9375rem;
    font-weight: 700;
    color: $yp-ink;

    .icon {
      color: $yp-primary;
    }
  }
}

.modal-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 48px 20px;
  color: $yp-muted;
  font-size: 1.5rem;

  p {
    margin: 0;
    font-size: 0.9375rem;
  }
}

// 地點詳細資訊
.place-photos {
  margin: -4px -20px 16px;
  padding: 0 20px;

  .photo-carousel {
    display: flex;
    gap: 8px;
    overflow-x: auto;
    scroll-snap-type: x proximity;
    padding-bottom: 4px;
  }

  .place-photo {
    flex: none;
    width: 200px;
    height: 140px;
    border-radius: $yp-radius;
    object-fit: cover;
    scroll-snap-align: start;
    background: $yp-surface-2;
  }
}

.place-info-section {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 20px;

  .place-name {
    font-size: 1.25rem;
    font-weight: 600;
  }

  .place-rating {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 6px;
    font-size: 0.875rem;

    .rating-stars {
      display: flex;
      color: $yp-line;

      .filled {
        color: $yp-warning;
      }
    }

    .rating-value {
      font-family: $yp-font-num;
      font-weight: 700;
    }

    .rating-count {
      font-size: 0.8125rem;
      color: $yp-muted;
      opacity: 1;
    }
  }

  .place-address,
  .place-contact {
    display: flex;
    align-items: flex-start;
    gap: 6px;
    font-size: 0.875rem;
    color: $yp-muted;

    .icon {
      flex: none;
      margin-top: 3px;
    }

    a {
      color: $yp-primary-ink;
    }
  }
}

.opening-hours {
  margin-top: 8px;
  padding: 12px 14px;
  border-radius: $yp-radius;
  background: $yp-surface-2;

  h5 {
    margin: 0 0 6px;
    font-size: 0.875rem;
    font-weight: 700;
  }

  .hours-item {
    padding: 2px 0;
    font-size: 0.8125rem;
    color: $yp-muted;
  }
}

.reviews-section {
  margin-bottom: 20px;

  h5 {
    margin: 0 0 10px;
    font-size: 0.9375rem;
    font-weight: 700;
  }

  .reviews-list {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .review-item {
    padding: 12px 14px;
    border: 1px solid $yp-line;
    border-radius: $yp-radius;
  }

  .review-header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 8px;
    margin-bottom: 6px;
  }

  .reviewer-info {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .reviewer-avatar {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    object-fit: cover;
  }

  .reviewer-name {
    font-size: 0.875rem;
    font-weight: 700;
  }

  .review-rating {
    display: flex;
    font-size: 0.75rem;
    color: $yp-line;

    .filled {
      color: $yp-warning;
    }
  }

  .review-time {
    flex: none;
    font-size: 0.75rem;
    color: $yp-subtle;
  }

  .review-text {
    margin: 0;
    font-size: 0.875rem;
    line-height: 1.6;
    color: $yp-muted;
  }
}

// 推薦地點表單
.submission-notice {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  margin-bottom: 20px;
  padding: 12px 14px;
  border-radius: $yp-radius;
  background: $yp-primary-soft;
  color: $yp-primary-ink;
  font-size: 0.875rem;

  .icon {
    flex: none;
    margin-top: 3px;
  }

  p {
    margin: 0;
  }
}

.search-results {
  margin-top: 8px;
  max-height: 260px;
  overflow-y: auto;
  border: 1px solid $yp-line;
  border-radius: $yp-radius;
  background: $yp-surface;
}

.search-results-header {
  padding: 8px 12px;
  background: $yp-surface-2;
  font-size: 0.75rem;
  color: $yp-muted;
}

.search-result-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  border-top: 1px solid $yp-line;
  cursor: pointer;

  &:hover {
    background: $yp-primary-soft;
  }

  .result-content {
    flex: 1;
    min-width: 0;
  }

  .result-name {
    font-size: 0.875rem;
    font-weight: 700;
  }

  .result-address {
    font-size: 0.75rem;
    color: $yp-muted;
  }

  .result-meta {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    margin-top: 4px;
  }

  .result-arrow {
    flex: none;
    color: $yp-subtle;
  }
}

.search-status {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 2px 0;
  font-size: 0.8125rem;
  color: $yp-muted;
}

.photo-preview-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
  margin-bottom: 12px;

  @media (min-width: $yp-bp-sm) {
    grid-template-columns: repeat(auto-fill, minmax(110px, 1fr));
    gap: 12px;
  }
}

.photo-preview-item {
  position: relative;
  aspect-ratio: 1;
  border-radius: 10px;
  overflow: hidden;
  border: 1px solid $yp-line;

  &:hover .photo-remove-btn {
    opacity: 1;
  }
}

.photo-preview-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.photo-remove-btn {
  position: absolute;
  top: 4px;
  right: 4px;
  width: 26px;
  height: 26px;
  display: grid;
  place-items: center;
  padding: 0;
  border: 0;
  border-radius: 50%;
  background: rgba($yp-danger, 0.92);
  color: #fff;
  font-size: 0.875rem;
  cursor: pointer;
  opacity: 0;
  transition: opacity 0.15s ease;

  @media (hover: none) {
    opacity: 1;
  }
}

.photo-preview-overlay {
  position: absolute;
  inset: auto 0 0;
  padding: 10px 6px 4px;
  background: linear-gradient(transparent, rgba($yp-ink, 0.6));

  .photo-number {
    font-family: $yp-font-num;
    font-size: 0.6875rem;
    font-weight: 700;
    color: #fff;
  }
}

.photo-info {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  border-radius: $yp-radius-sm;
  background: $yp-success-soft;
  color: $itin-success-ink;
  font-size: 0.8125rem;
}

// ───── Leaflet（地圖元件）─────
:deep(.itinerary-marker-wrapper) {
  background: transparent;
  border: none;
}

:deep(.itinerary-custom-marker) {
  position: relative;
  cursor: pointer;

  .itinerary-marker-label {
    position: absolute;
    bottom: 100%;
    left: 50%;
    transform: translate(-50%, -6px);
    background-color: rgba($yp-ink, 0.82);
    color: #fff;
    font-weight: 700;
    font-size: 12px;
    padding: 3px 8px;
    border-radius: 6px;
    box-shadow: 0 1px 4px rgba($yp-ink, 0.3);
    white-space: nowrap;
    max-width: 140px;
    overflow: hidden;
    text-overflow: ellipsis;
    pointer-events: none;
  }

  .itinerary-marker-pin {
    display: flex;
    align-items: center;
    justify-content: center;
    filter: drop-shadow(0 2px 6px rgba($yp-ink, 0.25));
    transition: transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);

    &:hover {
      transform: scale(1.2);
    }
  }
}

:deep(.leaflet-popup-content-wrapper) {
  border-radius: $yp-radius-lg;
  box-shadow: $yp-shadow-lg;
  border: 1px solid $yp-line;
  padding: 4px;
  color: $yp-ink;
}

:deep(.leaflet-popup-tip) {
  box-shadow: 0 4px 10px rgba($yp-ink, 0.1);
}

:deep(.leaflet-bar) {
  border: none !important;
  border-radius: $yp-radius !important;
  overflow: hidden;
  box-shadow: $yp-shadow !important;

  a {
    background-color: rgba(#fff, 0.96) !important;
    color: $yp-ink !important;
    border-bottom: 1px solid $yp-line !important;
    width: 36px !important;
    height: 36px !important;
    line-height: 36px !important;
    font-size: 18px !important;
    transition: color 0.15s ease;

    &:hover {
      background-color: #fff !important;
      color: $yp-primary !important;
    }
  }
}

:deep(.leaflet-control-attribution) {
  background: rgba(#fff, 0.8) !important;
  font-size: 10px !important;
  color: $yp-subtle !important;
  padding: 2px 8px !important;
  border-top-left-radius: 8px;

  a {
    color: $yp-muted !important;
    text-decoration: none;

    &:hover {
      text-decoration: underline;
    }
  }
}
</style>
