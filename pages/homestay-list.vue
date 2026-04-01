<template>
  <div class="flex container">
    <!-- 搜尋控制區域 -->
    <div class="search-controls">
      <!-- 地區選擇 -->
      <div class="area-search-group">
        <!-- <label class="search-label">所在地區</label> -->
        <div class="select-input-group">
          <select class="area-select" v-model="selectedArea" @change="filterByArea">
        <option :value="null">所有地區</option>
        <option
          v-for="area in areas"
          :key="area"
          :value="area"
        >
          {{ area }}
        </option>
      </select>
          <span class="select-suffix">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" viewBox="0 0 16 16">
              <path d="M7.247 11.14 2.451 5.658C1.885 5.013 2.345 4 3.204 4h9.592a1 1 0 0 1 .753 1.659l-4.796 5.48a1 1 0 0 1-1.506 0z"/>
            </svg>
          </span>
        </div>
      </div>

      <!-- 日期搜尋 -->
      <!-- <div class="date-search-group">
        <div class="date-input-wrapper">
          <div class="date-input-group">
            <input
              v-model="checkInDate"
              type="date"
              class="date-input"
              :min="todayString"
              :max="maxDateString"
              placeholder="入住日期"
            />
            <span class="date-label">入住</span>
          </div>
          <div class="date-separator">~</div>
          <div class="date-input-group">
            <input
              v-model="checkOutDate"
              type="date"
              class="date-input"
              :min="minCheckOutDate"
              :max="maxDateString"
              placeholder="退房日期"
            />
            <span class="date-label">退房</span>
          </div>
        </div>
        <button 
          v-if="checkInDate || checkOutDate" 
          @click="clearDates" 
          class="clear-dates-btn"
          type="button"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" viewBox="0 0 16 16">
            <path d="M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708.708L8.707 8l2.647 2.646a.5.5 0 0 1-.708.708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708"/>
          </svg>
        </button>
      </div> -->

      <!-- 人數搜尋 -->
      <div class="people-search-group">
        <!-- <label class="search-label">入住人數</label> -->
        <div class="people-input-group">
          <input
            v-model.number="guestCount"
            type="number"
            class="form-control people-input"
            placeholder="請輸入人數"
            min="1"
            max="50"
          />
          <span class="input-suffix">人</span>
        </div>
      </div>
    </div>

    <!-- 主要搜尋欄 -->
    <div class="main-search-group">
      <!-- <label class="search-label">搜尋民宿</label> -->
      <div class="main-search-wrapper" @keydown.enter.prevent>
        <input 
          type="text" 
          class="main-search-input" 
          maximum-scale="1" 
          placeholder="請輸入民宿名稱或介紹關鍵字" 
          v-model="searchText" 
          @keydown.enter.prevent
        >
        <div class="search-icon-wrapper">
        <svg
          v-if="searchText"
          @click="cleanText"
            xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" class="search-clear-icon" viewBox="0 0 16 16">
          <path d="M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708.708L8.707 8l2.647 2.646a.5.5 0 0 1-.708.708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708"/>
        </svg>
          <svg v-else xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="search-icon" viewBox="0 0 16 16">
          <path d="M11.742 10.344a6.5 6.5 0 1 0-1.397 1.398h-.001q.044.06.098.115l3.85 3.85a1 1 0 0 0 1.415-1.414l-3.85-3.85a1 1 0 0 0-.115-.1zM12 6.5a5.5 5.5 0 1 1-11 0 5.5 5.5 0 0 1 11 0"/>
        </svg>
        </div>
      </div>
      
      <!-- 進階搜尋切換按鈕 -->
      <div class="advanced-search-toggle">
        <button 
          @click="openAdvancedSearch" 
          class="advanced-toggle-btn"
          type="button"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
            <path d="M6 10.5a.5.5 0 0 1 .5-.5h3a.5.5 0 0 1 0 1h-3a.5.5 0 0 1-.5-.5m-2-3a.5.5 0 0 1 .5-.5h7a.5.5 0 0 1 0 1h-7a.5.5 0 0 1-.5-.5m-2-3a.5.5 0 0 1 .5-.5h11a.5.5 0 0 1 0 1h-11a.5.5 0 0 1-.5-.5"/>
          </svg>
          進階搜尋
        </button>
      </div>
      
      <!-- 進階搜尋側邊面板 -->
      <div class="advanced-search-overlay" :class="{ active: showAdvancedSearch }" @click="closeAdvancedSearch">
        <div class="advanced-search-panel" @click.stop>
          <div class="panel-header">
            <h3 class="panel-title">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="currentColor" viewBox="0 0 16 16">
                <path d="M6 10.5a.5.5 0 0 1 .5-.5h3a.5.5 0 0 1 0 1h-3a.5.5 0 0 1-.5-.5m-2-3a.5.5 0 0 1 .5-.5h7a.5.5 0 0 1 0 1h-7a.5.5 0 0 1-.5-.5m-2-3a.5.5 0 0 1 .5-.5h11a.5.5 0 0 1 0 1h-11a.5.5 0 0 1-.5-.5"/>
              </svg>
              進階搜尋
            </h3>
            <button @click="closeAdvancedSearch" class="panel-close-btn">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 16 16">
                <path d="M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708.708L8.707 8l2.647 2.646a.5.5 0 0 1-.708.708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708"/>
              </svg>
            </button>
          </div>
          
          <div class="panel-body">
            <!-- 已選擇的篩選條件 -->
            <div v-if="hasActiveFilters" class="active-filters">
              <div class="filter-tags">
                <span v-for="feature in selectedThemeFeatures" :key="'theme-' + feature" class="filter-tag">
                  主題: {{ feature }}
                  <button @click="removeThemeFeature(feature)" class="tag-remove">×</button>
                </span>
                <span v-for="amenity in selectedServiceAmenities" :key="'amenity-' + amenity" class="filter-tag">
                  設施: {{ amenity }}
                  <button @click="removeServiceAmenity(amenity)" class="tag-remove">×</button>
                </span>
              </div>
            </div>
            
            <!-- 主題特色 -->
            <div class="feature-group">
              <h4 class="feature-group-title">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                  <path d="M8 4.754a3.246 3.246 0 1 0 0 6.492 3.246 3.246 0 0 0 0-6.492M5.754 8a2.246 2.246 0 1 1 4.492 0 2.246 2.246 0 0 1-4.492 0"/>
                  <path d="M9.796 1.343c-.527-1.79-3.065-1.79-3.592 0l-.094.319a.873.873 0 0 1-1.255.52l-.292-.16c-1.64-.892-3.433.902-2.54 2.541l.159.292a.873.873 0 0 1-.52 1.255l-.319.094c-1.79.527-1.79 3.065 0 3.592l.319.094a.873.873 0 0 1 .52 1.255l-.16.292c-.892 1.64.901 3.434 2.541 2.54l.292-.159a.873.873 0 0 1 1.255.52l.094.319c.527 1.79 3.065 1.79 3.592 0l.094-.319a.873.873 0 0 1 1.255-.52l.292.16c1.64.893 3.434-.902 2.54-2.541l-.159-.292a.873.873 0 0 1 .52-1.255l.319-.094c1.79-.527 1.79-3.065 0-3.592l-.319-.094a.873.873 0 0 1-.52-1.255l.16-.292c.893-1.64-.902-3.433-2.541-2.54l-.292.159a.873.873 0 0 1-1.255-.52zm-2.633.283c.246-.835 1.428-.835 1.674 0l.094.319a1.873 1.873 0 0 0 2.693 1.115l.291-.16c.764-.415 1.6.42 1.184 1.185l-.159.292a1.873 1.873 0 0 0 1.116 2.692l.318.094c.835.246.835 1.428 0 1.674l-.319.094a1.873 1.873 0 0 0-1.115 2.693l.16.291c.415.764-.42 1.6-1.185 1.184l-.291-.159a1.873 1.873 0 0 0-2.693 1.116l-.094.318c-.246.835-1.428.835-1.674 0l-.094-.319a1.873 1.873 0 0 0-2.692-1.115l-.292.16c-.764.415-1.6-.42-1.184-1.185l.159-.291A1.873 1.873 0 0 0 1.945 8.93l-.319-.094c-.835-.246-.835-1.428 0-1.674l.319-.094A1.873 1.873 0 0 0 3.06 4.377l-.16-.292c-.415-.764.42-1.6 1.185-1.184l.292.159a1.873 1.873 0 0 0 2.692-1.115z"/>
                </svg>
                主題特色 (交集篩選)
              </h4>
              <div class="feature-options">
                <label 
                  v-for="feature in availableThemeFeatures" 
                  :key="feature" 
                  class="feature-checkbox"
                >
                  <input 
                    type="checkbox" 
                    :value="feature" 
                    v-model="selectedThemeFeatures"
                  >
                  <span class="checkmark"></span>
                  <span class="feature-text">{{ feature }}</span>
                </label>
              </div>
            </div>
            
            <!-- 服務設施 -->
            <div class="feature-group">
              <h4 class="feature-group-title">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                  <path d="M8 1a2.5 2.5 0 0 1 2.5 2.5V4h-5v-.5A2.5 2.5 0 0 1 8 1m3.5 3v-.5a3.5 3.5 0 1 0-7 0V4H1v10a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V4zM2 5h12v9a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1z"/>
                </svg>
                服務設施 (交集篩選)
              </h4>
              <div class="feature-options">
                <label 
                  v-for="amenity in availableServiceAmenities" 
                  :key="amenity" 
                  class="feature-checkbox"
                >
                  <input 
                    type="checkbox" 
                    :value="amenity" 
                    v-model="selectedServiceAmenities"
                  >
                  <span class="checkmark"></span>
                  <span class="feature-text">{{ amenity }}</span>
                </label>
              </div>
            </div>
          </div>
          
          <div class="panel-footer">
            <div class="panel-actions">
              <button 
                @click="clearAdvancedFilters" 
                class="clear-filters-btn"
                type="button"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                  <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14m0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16"/>
                  <path d="M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708.708L8.707 8l2.647 2.646a.5.5 0 0 1-.708.708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708"/>
                </svg>
                清除篩選
              </button>
              <button 
                @click="applyAdvancedFilters" 
                class="apply-filters-btn"
                type="button"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                  <path d="M10.97 4.97a.75.75 0 0 1 1.07 1.05l-3.99 4.99a.75.75 0 0 1-1.08.02L4.324 8.384a.75.75 0 1 1 1.06-1.06l2.094 2.093 3.473-4.425z"/>
                </svg>
                套用篩選 ({{ filteredResultsCount }})
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
    <div class="col-12">
      <div class="tag-list">
        <h2 class="tag-title">
          熱門特色:
        </h2>
        <span class="hot-tag" v-for="tag in hotThemeFeatures" :key="tag" @click="clickTag">
          {{ tag }}
        </span>
      </div>
    </div>
    <div class="my-8 flex w-full max-w-4xl flex-col">
      
      <div v-if="loading">
        <Icon class="h-6 w-6 text-gray-500" name="eos-icons:loading" />
        <p>載入中...</p>
      </div>
      <template v-else>
        <div v-if="error">
          <span class="text-gray-500">發生了一點錯誤，請稍後再嘗試</span>
          <p class="my-2 text-rose-500">{{ error }}</p>
        </div>
        <div v-else-if="!filteredBnbs || filteredBnbs.length === 0">
          <span class="text-gray-500">目前沒有符合條件的民宿</span>
        </div>
        <div v-else class="md:border-l md:border-gray-100">
          <div class="row">
            <article
              v-for="bnb in paginatedBnbs"
              :key="bnb.id"
              class="bnb col-md-3"
            >
            <div 
              class="bnb-wrapper" 
              @click.prevent.stop="navigateToBnb(bnb.id, $event)" 
              @mouseenter="hoveredBnb = bnb.id"
              @mouseleave="hoveredBnb = null"
              style="cursor: pointer;"
            >
              <div class="bnb-img-wrapper">
                <!-- 多圖展示 - 如果有多張圖片就顯示輪播，否則顯示單張 -->
                <div v-if="bnb.image_urls && bnb.image_urls.length > 1" class="mini-slider">
                  <div class="slider-container">
                    <img
                      v-for="(imageUrl, imageIndex) in bnb.image_urls.slice(0, 5)"
                      :key="imageIndex"
                      :src="imageUrl"
                      :alt="`${bnb.name} - 圖片 ${imageIndex + 1}`"
                      class="slider-image"
                      :class="{ 'active': currentImageIndex[bnb.id] === imageIndex }"
                      style="pointer-events: none;"
                    />
                    
                    <!-- 左右導航按鈕 -->
                    <button 
                      v-if="bnb.image_urls.length > 1"
                      @click.stop="prevImage(bnb.id, bnb.image_urls.length)"
                      class="nav-btn prev-btn"
                      :style="{ opacity: hoveredBnb === bnb.id ? 1 : 0 }"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                        <path fill-rule="evenodd" d="M11.354 1.646a.5.5 0 0 1 0 .708L5.707 8l5.647 5.646a.5.5 0 0 1-.708.708l-6-6a.5.5 0 0 1 0-.708l6-6a.5.5 0 0 1 .708 0"/>
                      </svg>
                    </button>
                    
                    <button 
                      v-if="bnb.image_urls.length > 1"
                      @click.stop="nextImage(bnb.id, bnb.image_urls.length)"
                      class="nav-btn next-btn"
                      :style="{ opacity: hoveredBnb === bnb.id ? 1 : 0 }"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                        <path fill-rule="evenodd" d="M4.646 1.646a.5.5 0 0 1 .708 0l6 6a.5.5 0 0 1 0 .708l-6 6a.5.5 0 0 1-.708-.708L10.293 8 4.646 2.354a.5.5 0 0 1 0-.708"/>
                      </svg>
                    </button>
                  </div>
                  
                  <!-- 圖片指示器 -->
                  <div v-if="bnb.image_urls.length > 1" class="image-indicators">
                    <button
                      v-for="(imageUrl, imageIndex) in bnb.image_urls.slice(0, 5)"
                      :key="imageIndex"
                      @click.stop="setCurrentImage(bnb.id, imageIndex)"
                      class="indicator-dot"
                      :class="{ 'active': currentImageIndex[bnb.id] === imageIndex }"
                    ></button>
                    <span v-if="bnb.image_urls.length > 5" class="more-images">
                      +{{ bnb.image_urls.length - 5 }}
                    </span>
                  </div>
                  
                  <!-- 圖片數量標籤 -->
                  <div class="image-count-badge">
                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" fill="currentColor" viewBox="0 0 16 16">
                      <path d="M6.002 5.5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0"/>
                      <path d="M2.002 1a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V3a2 2 0 0 0-2-2h-12zm12 1a1 1 0 0 1 1 1v6.5l-3.777-1.947a.5.5 0 0 0-.577.093l-3.71 3.71-2.66-1.772a.5.5 0 0 0-.63.062L1.002 12V3a1 1 0 0 1 1-1h12z"/>
                    </svg>
                    {{ bnb.image_urls.length }}
                  </div>
                </div>
                
                <!-- 單張圖片顯示 -->
                <div v-else class="single-image">
                  <img
                    :alt="bnb.name"
                    height="165"
                    width="366"
                    :src="bnb.image_urls && bnb.image_urls.length > 0 ? bnb.image_urls[0] : '/images/bnb-placeholder.jpg'"
                    class="bnb-img"
                    style="pointer-events: none;"
                  />
                  <!-- 如果只有一張圖片，也顯示圖片數量 -->
                  <div v-if="bnb.image_urls && bnb.image_urls.length === 1" class="image-count-badge">
                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" fill="currentColor" viewBox="0 0 16 16">
                      <path d="M6.002 5.5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0"/>
                      <path d="M2.002 1a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V3a2 2 0 0 0-2-2h-12zm12 1a1 1 0 0 1 1 1v6.5l-3.777-1.947a.5.5 0 0 0-.577.093l-3.71 3.71-2.66-1.772a.5.5 0 0 0-.63.062L1.002 12V3a1 1 0 0 1 1-1h12z"/>
                    </svg>
                    1
                  </div>
                </div>
              </div>
              <div 
                class="bnb-info" 
                style="pointer-events: none;"
              >
                <!-- 未來可用的標籤位置 - 目前隱藏
                <div v-if="bnb.featured" class="featured-badge" style="pointer-events: none;">
                  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" fill="currentColor" viewBox="0 0 16 16" style="pointer-events: none;">
                    <path d="M3.612 15.443c-.386.198-.824-.149-.746-.592l.83-4.73L.173 6.765c-.329-.314-.158-.888.283-.95l4.898-.696L7.538.792c.197-.39.73-.39.927 0l2.184 4.327 4.898.696c.441.062.612.636.282.95l-3.522 3.356.83 4.73c.078.443-.36.79-.746.592L8 13.187l-4.389 2.256z"/>
                  </svg>
                  精選
                </div>
                -->
                
                <div class="bnb-header-row">
                  <h2 class="bnb-title">
                    <span class="">{{ bnb.name }}</span>
                  </h2>
                </div>
                
                <div class="categories-row">
                  <!-- 位置標籤 -->
                  <span class="bnb-tag location-tag">
                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" fill="currentColor" viewBox="0 0 16 16">
                      <path d="M8 16s6-5.686 6-10A6 6 0 0 0 2 6c0 4.314 6 10 6 10M8 8a2 2 0 1 1 0-4 2 2 0 0 1 0 4"/>
                    </svg>
                    {{ bnb.area }}
                  </span>
                  
                  <!-- 人數範圍 -->
                  <span v-if="bnb.min_guests || bnb.max_guests" class="bnb-tag people-tag">
                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" fill="currentColor" viewBox="0 0 16 16">
                      <path d="M15 14v1H1v-1c0-1 1-4 7-4s7 3 7 4M8 7a4 4 0 1 0 0-8 4 4 0 0 0 0 8"/>
                    </svg>
                    {{ getGuestRange(bnb) }}
                  </span>
                  
                  <!-- 主題特色標籤 -->
                  <template v-for="(themeFeature, index) in (bnb.features?.themeFeatures || []).slice(0, 2)" :key="themeFeature">
                    <span class="bnb-tag theme-tag">
                      <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" fill="currentColor" viewBox="0 0 16 16">
                        <path d="M8 4.754a3.246 3.246 0 1 0 0 6.492 3.246 3.246 0 0 0 0-6.492M5.754 8a2.246 2.246 0 1 1 4.492 0 2.246 2.246 0 0 1-4.492 0"/>
                        <path d="M9.796 1.343c-.527-1.79-3.065-1.79-3.592 0l-.094.319a.873.873 0 0 1-1.255.52l-.292-.16c-1.64-.892-3.433.902-2.54 2.541l.159.292a.873.873 0 0 1-.52 1.255l-.319.094c-1.79.527-1.79 3.065 0 3.592l.319.094a.873.873 0 0 1 .52 1.255l-.16.292c-.892 1.64.901 3.434 2.541 2.54l.292-.159a.873.873 0 0 1 1.255.52l.094.319c.527 1.79 3.065 1.79 3.592 0l.094-.319a.873.873 0 0 1 1.255-.52l.292.16c1.64.893 3.434-.902 2.54-2.541l-.159-.292a.873.873 0 0 1 .52-1.255l.319-.094c1.79-.527 1.79-3.065 0-3.592l-.319-.094a.873.873 0 0 1-.52-1.255l.16-.292c.893-1.64-.902-3.433-2.541-2.54l-.292.159a.873.873 0 0 1-1.255-.52l-.094-.319z"/>
                      </svg>
                      {{ themeFeature }}
                    </span>
                  </template>
                  
                  <!-- 如果有更多特色，顯示省略號 -->
                  <span v-if="(bnb.features?.themeFeatures || []).length > 2" class="bnb-tag more-features-tag">
                    +{{ (bnb.features?.themeFeatures || []).length - 2 }}
                  </span>
                </div>
                
                <p class="index-bnb-text" v-if="bnb.description">
                  {{ bnb.description }}
                </p>
                
                <div class="price-info">
                  <!-- <div v-if="bnb.prices && bnb.prices.weekday">
                    <span class="price-label">平日價格:</span>
                    <span class="price-value">{{ bnb.prices.weekday }}</span>
                  </div>
                  <div v-if="bnb.prices && bnb.prices.weekend">
                    <span class="price-label">假日價格:</span>
                    <span class="price-value">{{ bnb.prices.weekend }}</span>
                  </div> -->
                  <!-- 包棟價格 -->
                  <div v-if="bnb.prices && (bnb.prices.fullRentWeekday || bnb.prices.fullRentWeekend)" class="package-price">
                    <div class="package-header">
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" viewBox="0 0 16 16" class="package-icon">
                        <path d="M2.5 3A1.5 1.5 0 0 0 1 4.5v.793c.026.009.051.02.076.032L7.674 8.51c.206.1.446.1.652 0l6.598-3.185A.755.755 0 0 1 15 5.293V4.5A1.5 1.5 0 0 0 13.5 3h-11Z"/>
                        <path d="M15 6.954 8.978 9.86a2.25 2.25 0 0 1-1.956 0L1 6.954V11.5A1.5 1.5 0 0 0 2.5 13h11a1.5 1.5 0 0 0 1.5-1.5V6.954Z"/>
                      </svg>
                      <span class="package-label">包棟方案</span>
                    </div>
                    <div class="package-prices">
                      <div v-if="bnb.prices.fullRentWeekday" class="package-item weekday">
                        <span class="package-day">平日</span>
                        <span class="package-value">{{ bnb.prices.fullRentWeekday }}</span><span class="price-suffix">起</span>
                      </div>
                      <div v-if="bnb.prices.fullRentWeekend" class="package-item weekend">
                        <span class="package-day">假日</span>
                        <span class="package-value">{{ bnb.prices.fullRentWeekend }}</span><span class="price-suffix">起</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                <!-- 查看次數 -->
                <div v-if="bnb.view_count" class="view-count">
                  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" fill="currentColor" viewBox="0 0 16 16">
                    <path d="M16 8s-3-5.5-8-5.5S0 8 0 8s3 5.5 8 5.5S16 8 16 8M1.173 8a13 13 0 0 1 1.66-2.043C4.12 4.668 5.88 3.5 8 3.5s3.879 1.168 5.168 2.457A13 13 0 0 1 14.828 8q-.086.13-.195.288c-.335.48-.83 1.12-1.465 1.755C11.879 11.332 10.119 12.5 8 12.5s-3.879-1.168-5.168-2.457A13 13 0 0 1 1.172 8z"/>
                    <path d="M8 5.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5M4.5 8a3.5 3.5 0 1 1 7 0 3.5 3.5 0 0 1-7 0"/>
                  </svg>
                  <span>{{ bnb.view_count }} 次查看</span>
                </div>
              </div>
            </div>
            </article>
          </div>
          <!-- 分頁功能 -->
          <nav
            class="mt-12 flex items-center justify-between px-4 py-3 sm:px-6"
          >
            <div class="next-page flex flex-1 justify-center sm:justify">
              <a
                v-if="currentPage > 1"
                class="flex items-center text-xl font-medium text-gray-600 hover:text-emerald-500"
                @click="currentPage = currentPage - 1"
                href="javascript:void(0)"
              >
                <Icon name="ri:arrow-left-s-line" />
                {{ currentPage - 1 }}
              </a>
              <label class="now-page">{{ currentPage }}</label>
              <a
                v-if="currentPage < totalPages"
                class="flex items-center text-xl font-medium text-gray-600 hover:text-emerald-500"
                @click="currentPage = currentPage + 1"
                href="javascript:void(0)"
              >
                {{ currentPage + 1 }}
                <Icon name="ri:arrow-right-s-line" />
              </a>
            </div>
          </nav>
        </div>
      </template>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue';
import { navigateTo } from 'nuxt/app';
import useHomestayStore from '~/store/homestay.js';

// SEO 設定
useSeoMeta({
  title: '宜蘭合法民宿推薦 | 精選優質民宿住宿 - 宜蘭旅遊通-宜蘭觀光民宿行銷協會',
  ogTitle: '宜蘭合法民宿推薦 | 宜蘭旅遊通-宜蘭觀光民宿行銷協會',
  description: '宜蘭旅遊通-宜蘭觀光民宿行銷協會提供宜蘭地區合法民宿，包含親子民宿、寵物民宿、海景民宿、包棟民宿、戲水池民宿、KTV民宿、烤肉民宿等多種主題特色民宿。透過進階搜尋功能，讓您輕鬆找到理想的住宿選擇，規劃完美的宜蘭之旅。',
  ogDescription: '精選宜蘭地區合法民宿，提供親子、寵物、海景、包棟、戲水池、KTV、烤肉等多種主題住宿選擇',
  keywords: '宜蘭民宿推薦,合法民宿,親子民宿,寵物民宿,海景民宿,包棟民宿,戲水池民宿,KTV民宿,烤肉民宿,游泳池民宿,唱歌民宿,BBQ民宿,宜蘭住宿,民宿搜尋,宜蘭旅遊',
  ogImage: 'https://yilanpass.com/logo.png',
  ogUrl: 'https://yilanpass.com/homestay-list',
  twitterCard: 'summary_large_image',
  robots: 'index, follow',
  canonical: 'https://yilanpass.com/homestay-list'
})

// 額外設定 head link (雙重保險)
useHead({
  link: [
    {
      rel: 'canonical',
      href: 'https://yilanpass.com/homestay-list'
    },
    {
      rel: 'llms-txt',
      href: 'https://yilanpass.com/llms.txt'
    }
  ]
})

// 使用 homestay store
const homestayStore = useHomestayStore();

const searchText = ref('');
const selectedArea = ref(null);
const guestCount = ref(null);
const currentPage = ref(1);
const itemsPerPage = 12; // 與後端預設一致

// 日期搜尋相關
const checkInDate = ref('');
const checkOutDate = ref('');
const dateSearchMode = ref(false); // 是否啟用日期搜尋模式
const availableHomestays = ref([]); // 根據日期搜尋的可用民宿

// 進階搜尋相關變量
const showAdvancedSearch = ref(false);
const selectedThemeFeatures = ref([]);
const selectedServiceAmenities = ref([]);
const availableThemeFeatures = ref([]);
const availableServiceAmenities = ref([]);

// 圖片輪播相關狀態
const currentImageIndex = ref({});
const hoveredBnb = ref(null);

// 從store獲取資料
const bnbsData = computed(() => homestayStore.getAllHomestays);
const loading = computed(() => homestayStore.getLoading);
const error = computed(() => homestayStore.getError);
const pagination = computed(() => homestayStore.getPagination);

// 過濾民宿資料 - 增強篩選邏輯，支援日期搜尋
const filteredBnbs = computed(() => {
  // 如果啟用日期搜尋模式，使用日期搜尋結果 (Client-side filtering)
  if (dateSearchMode.value && availableHomestays.value.length >= 0) {
    // 對日期搜尋結果進行進一步篩選
    const result = availableHomestays.value.filter(bnb => {
      const nameMatch = !searchText.value || 
        bnb.name.toLowerCase().includes(searchText.value.toLowerCase()) ||
        bnb.description?.toLowerCase().includes(searchText.value.toLowerCase()) ||
        (bnb.features?.themeFeatures && bnb.features.themeFeatures.some(feature => 
          feature.toLowerCase().includes(searchText.value.toLowerCase())
        ));
      const areaMatch = !selectedArea.value || bnb.area === selectedArea.value;
      const themeMatch = selectedThemeFeatures.value.length === 0 || 
        (bnb.features?.themeFeatures && selectedThemeFeatures.value.every(selected => 
          bnb.features.themeFeatures.includes(selected)
        ));
      const amenityMatch = selectedServiceAmenities.value.length === 0 || 
        (bnb.features?.serviceAmenities && selectedServiceAmenities.value.every(selected => 
          bnb.features.serviceAmenities.includes(selected)
        ));
      return nameMatch && areaMatch && themeMatch && amenityMatch;
    });
    return shuffleArray(result);
  }
  
  // 一般模式 (Server-side filtering) - 直接回傳 store 資料
  // 過濾邏輯已在後端完成
  return bnbsData.value || [];
});

// 計算總頁數
const totalPages = computed(() => {
  if (dateSearchMode.value) {
    return Math.ceil(filteredBnbs.value.length / itemsPerPage);
  }
  // Server-side
  return pagination.value.totalPages;
});

// 當前頁的資料
const paginatedBnbs = computed(() => {
  if (dateSearchMode.value) {
    // Client-side pagination
    const startIndex = (currentPage.value - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredBnbs.value.slice(startIndex, endIndex);
  }
  // Server-side: store data is already the current page
  return filteredBnbs.value;
});

// 熱門主題特色標籤
const hotThemeFeatures = [
  '包棟民宿',
  '親子民宿', 
  '寵物民宿',
  '海景民宿'
];

// 獲取所有區域 - 使用store的getter (注意：這可能只包含當前頁面的區域，如果需要完整列表可能需要優化)
// 獲取所有區域 - 改為靜態列表以確保分頁模式下能選擇所有區域
const areas = computed(() => [
  '頭城鎮', '礁溪鄉', '宜蘭市', '壯圍鄉', '員山鄉', 
  '羅東鎮', '五結鄉', '三星鄉', '冬山鄉', '蘇澳鎮', 
  '南澳鄉', '大同鄉'
]);

// 日期相關的計算屬性
const todayString = computed(() => {
  return new Date().toISOString().split('T')[0];
});

const maxDateString = computed(() => {
  const maxDate = new Date();
  maxDate.setMonth(maxDate.getMonth() + 6);
  return maxDate.toISOString().split('T')[0];
});

const minCheckOutDate = computed(() => {
  if (!checkInDate.value) return todayString.value;
  const checkIn = new Date(checkInDate.value);
  checkIn.setDate(checkIn.getDate() + 1);
  return checkIn.toISOString().split('T')[0];
});

// 除錯用：監控篩選條件變化
const debugFilters = () => {
  console.log('篩選條件:', {
    searchText: searchText.value,
    selectedArea: selectedArea.value,
    guestCount: guestCount.value,
    themes: selectedThemeFeatures.value,
    amenities: selectedServiceAmenities.value,
    page: currentPage.value,
    totalCount: pagination.value.totalCount
  });
}

// 結構化資料 (JSON-LD) - 民宿列表
useHead({
  script: [
    {
      type: 'application/ld+json',
      children: computed(() => JSON.stringify({
        "@context": "https://schema.org",
        "@type": "ItemList",
        "name": "宜蘭合法民宿推薦",
        "description": "精選宜蘭地區合法民宿列表，包含親子、寵物、海景、包棟等主題民宿",
        "url": "https://yilanpass.com/homestay-list",
        "numberOfItems": pagination.value.totalCount || 0,
        "itemListElement": (paginatedBnbs.value || []).slice(0, 20).map((bnb, index) => ({
          "@type": "ListItem",
          "position": index + 1,
          "item": {
            "@type": "LodgingBusiness",
            "name": bnb.name,
            "description": bnb.description,
            "url": `https://yilanpass.com/homestays/${bnb.id}`,
            "image": bnb.image_urls?.[0],
            "address": {
              "@type": "PostalAddress",
              "addressLocality": bnb.area || bnb.location,
              "addressRegion": "宜蘭縣",
              "addressCountry": "TW"
            },
            "priceRange": bnb.prices?.fullRentWeekday ? 
              `NT$${bnb.prices.fullRentWeekday} - NT$${bnb.prices.fullRentWeekday || bnb.prices.fullRentWeekday}` : 
              undefined,
            "aggregateRating": bnb.rating ? {
              "@type": "AggregateRating",
              "ratingValue": bnb.rating,
              "bestRating": 5,
              "ratingCount": bnb.total_reviews || 1
            } : undefined
          }
        }))
      }))
    }
  ]
})

// 點擊熱門標籤
const clickTag = (e) => {
  const tagText = e.target.textContent.trim();
  
  // 根據標籤類型設定不同的篩選方式
  if (tagText === '包棟') {
    // 搜尋包含包棟相關的民宿
    searchText.value = '包棟';
  } else {
    // 其他環境類型標籤，直接搜尋
    searchText.value = tagText;
    selectedArea.value = null;
    guestCount.value = null;
  }
  
  currentPage.value = 1;
  // watch 會自動觸發 fetchFn
}

// 清除搜尋文字
const cleanText = () => {
  searchText.value = '';
  currentPage.value = 1;
}

// 載入進階搜尋選項
const loadAdvancedSearchOptions = async () => {
  try {
    const response = await $fetch('/api/features-options');
    if (response.success) {
      availableThemeFeatures.value = response.data.themeFeatures || [];
      availableServiceAmenities.value = response.data.serviceAmenities || [];
      console.log('載入進階搜尋選項成功:', {
        themeFeatures: availableThemeFeatures.value.length,
        serviceAmenities: availableServiceAmenities.value.length
      });
    }
  } catch (error) {
    console.error('載入進階搜尋選項失敗:', error);
  }
}

// 清除進階篩選
const clearAdvancedFilters = () => {
  selectedThemeFeatures.value = [];
  selectedServiceAmenities.value = [];
  currentPage.value = 1;
}

// 進階搜尋面板相關方法
const openAdvancedSearch = () => {
  showAdvancedSearch.value = true;
  document.body.style.overflow = 'hidden';
}

const closeAdvancedSearch = () => {
  showAdvancedSearch.value = false;
  document.body.style.overflow = 'auto';
}

const applyAdvancedFilters = () => {
  closeAdvancedSearch();
  currentPage.value = 1;
  fetchBnbsData(); // 立即觸發
}

// 移除單個主題特色
const removeThemeFeature = (feature) => {
  const index = selectedThemeFeatures.value.indexOf(feature);
  if (index > -1) {
    selectedThemeFeatures.value.splice(index, 1);
    fetchBnbsData(); // 立即觸發
  }
}

// 移除單個服務設施
const removeServiceAmenity = (amenity) => {
  const index = selectedServiceAmenities.value.indexOf(amenity);
  if (index > -1) {
    selectedServiceAmenities.value.splice(index, 1);
    fetchBnbsData(); // 立即觸發
  }
}

// 檢查是否有篩選條件
const hasActiveFilters = computed(() => {
  return selectedThemeFeatures.value.length > 0 || selectedServiceAmenities.value.length > 0;
})

// 計算篩選結果數量 (這裡直接用當前頁數量，或者可以顯示總數)
const filteredResultsCount = computed(() => {
  return pagination.value.totalCount;
})

// 根據區域過濾
const filterByArea = () => {
  currentPage.value = 1;
  // watch 會自動觸發
};

// 清除日期選擇
const clearDates = () => {
  checkInDate.value = '';
  checkOutDate.value = '';
  dateSearchMode.value = false;
  availableHomestays.value = [];
  currentPage.value = 1;
};

// 根據日期搜尋可用民宿
// TODO: 未來可能需要將日期搜尋整合到後端統一篩選 API
const searchByDates = async () => {
  if (!checkInDate.value || !checkOutDate.value) {
    console.log('日期不完整，取消日期搜尋');
    dateSearchMode.value = false;
    availableHomestays.value = [];
    return;
  }

  console.log('開始根據日期搜尋:', { checkInDate: checkInDate.value, checkOutDate: checkOutDate.value });
  
  try {
    dateSearchMode.value = true;
    // 日期搜尋目前仍使用獨立 API，建議未來整合
    loading.value = true;

    const response = await $fetch('/api/search-available-homestays', {
      query: {
        checkIn: checkInDate.value,
        checkOut: checkOutDate.value,
        guestCount: guestCount.value || undefined,
        area: selectedArea.value || undefined,
        limit: 100 // 獲取更多結果供前端篩選
      }
    });

    if (response.success) {
      availableHomestays.value = response.data.homestays;
      console.log('日期搜尋成功，找到', availableHomestays.value.length, '個可用民宿');
      // 注意：目前日期搜尋結果是前端分頁，如果需要 Server-Side Pagination 需要後端支援
      // 這裡暫時保持原樣，或者是將 available ID 傳給 fetchBnbs
    } else {
      console.error('日期搜尋失敗:', response.error);
      availableHomestays.value = [];
    }
  } catch (error) {
    console.error('日期搜尋發生錯誤:', error);
    availableHomestays.value = [];
  } finally {
    // loading.value = false; // 由 store 控制
    currentPage.value = 1;
  }
};

// 從 store 獲取民宿資料 (Server-Side Pagination)
const fetchBnbsData = async () => {
  console.log('=== fetchBnbsData 開始執行 ===');
  
  try {
    const params = {
      page: currentPage.value,
      limit: itemsPerPage,
      search: searchText.value,
      location: selectedArea.value || '',
      guest_count: guestCount.value || null,
      themes: selectedThemeFeatures.value,
      amenities: selectedServiceAmenities.value,
      // 日期搜尋暫不整合到此，除非後端支援
    };

    console.log('🔄 開始從API獲取資料(分頁)...', params);
    
    await homestayStore.fetchHomestays(params);
    
    console.log('✅ 從 store 獲取民宿資料成功');
    debugFilters();
    
    // 確保響應式更新
    await nextTick();
    
  } catch (err) {
    console.error('載入民宿資料失敗:', err);
  }
  
  console.log('=== fetchBnbsData 執行完成 ===');
}

// 監聽一般篩選條件變化 (Debounce 處理搜尋文字)
let searchTimeout = null;
watch([searchText], () => {
  if (searchTimeout) clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => {
    currentPage.value = 1;
    fetchBnbsData();
  }, 500);
});
// 監聽其他立即生效的篩選條件
watch([selectedArea, guestCount, selectedThemeFeatures, selectedServiceAmenities], () => {
  if (currentPage.value !== 1) {
    currentPage.value = 1;
  } else {
    fetchBnbsData();
  }
  debugFilters();
}, { deep: true });

// 監聽頁碼變化
// 當頁碼改變時，直接觸發資料獲取
watch(currentPage, () => {
  fetchBnbsData();
});

// 監聽日期變化
watch([checkInDate, checkOutDate], () => {
  // 使用 debounce 避免過度頻繁的 API 調用
  if (searchDateTimeout) {
    clearTimeout(searchDateTimeout);
  }
  
  searchDateTimeout = setTimeout(() => {
    searchByDates();
  }, 500); // 500ms 延遲
}, { immediate: false });

let searchDateTimeout = null;

onMounted(async () => {
  console.log('🚀 onMounted 觸發 - 開始載入民宿資料');
  
  // 載入民宿資料和進階搜尋選項
  try {
    await Promise.all([
      fetchBnbsData(), // 預設載入第一頁
      loadAdvancedSearchOptions()
    ]);
    
    console.log('🏁 最終載入結果:', homestayStore.getAllHomestays.length, '筆民宿');
  } catch (error) {
    console.error('❌ 載入失敗:', error);
  }
  
  // 為了視覺效果，先初始化一次
  debugFilters();
});

// 清理函式
onUnmounted(() => {
  document.body.style.overflow = 'auto';
});

// 格式化人數範圍顯示
const getGuestRange = (bnb) => {
  if (!bnb) return ''
  
  const min = bnb.min_guests
  const max = bnb.max_guests
  
  if (min && max) {
    return `${min}~${max}人`
  } else if (min) {
    return `${min}人+`
  } else if (max) {
    return `最多${max}人`
  }
  return ''
}

const navigateToBnb = (id, event) => {
  console.log('=== 點擊事件觸發 ===');
  console.log('民宿 ID:', id);
  
  // 確保阻止所有默認行為
  if (event) {
    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();
  }
  
  if (!id) {
    console.error('無效的民宿ID');
    return false;
  }

  // 先更新查看次數
  homestayStore.updateViewCount(id);
  
  // 使用 navigateTo 而不是 window.location.href 來保持store狀態
  console.log('🚀 使用 navigateTo 導航到:', `/homestays/${id}`);
  navigateTo(`/homestays/${id}`);
  
  return false;
}

// 圖片輪播控制函數
const initializeImageIndex = (bnbId) => {
  if (!currentImageIndex.value[bnbId]) {
    currentImageIndex.value[bnbId] = 0;
  }
};

const nextImage = (bnbId, totalImages) => {
  initializeImageIndex(bnbId);
  currentImageIndex.value[bnbId] = (currentImageIndex.value[bnbId] + 1) % Math.min(totalImages, 5);
};

const prevImage = (bnbId, totalImages) => {
  initializeImageIndex(bnbId);
  currentImageIndex.value[bnbId] = currentImageIndex.value[bnbId] === 0 
    ? Math.min(totalImages, 5) - 1 
    : currentImageIndex.value[bnbId] - 1;
};

const setCurrentImage = (bnbId, imageIndex) => {
  currentImageIndex.value[bnbId] = imageIndex;
};

// 監聽資料變化，初始化圖片索引
watch(bnbsData, (newData) => {
  if (newData && newData.length > 0) {
    newData.forEach(bnb => {
      initializeImageIndex(bnb.id);
    });
  }
}, { immediate: true });
</script>

<style lang="scss" scoped>
/* 搜尋控制區域 */
.search-controls {
  display: flex;
  gap: 16px;
  margin-bottom: 16px;
  flex-wrap: wrap;
  
  @media (max-width: 768px) {
    flex-direction: row;
    gap: 8px;
    flex-wrap: wrap;
    margin-bottom: 8px;
  }
  
  @media (max-width: 480px) {
    gap: 6px;
  }
}
.next-page {
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 16px;
}
.now-page {
  padding: 5px;
  margin: 0 10px;
  background-color: #f1f1f1;
  border-radius: 50%;
}
.bnb-wrapper {
  overflow: hidden;
  margin-bottom: 20px;
  border-radius: 10px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  transition: transform 0.3s ease;
  cursor: pointer;
  position: relative;
}
.bnb-wrapper:hover {
  transform: translateY(-5px);
  box-shadow: 0 10px 20px rgba(0, 0, 0, 0.15);
}
.bnb-title {
  font-size: 16px;
  font-weight: 800;
  color: #613030;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.bnb-info {
  padding: 13px 8px 15px 8px;
  background-color: #fff;
}
.bnb-img-wrapper {
  overflow: hidden;
  height: 165px;
}
.bnb-img {
  display: inline-block;
  object-fit: cover;
  width: 100%;
  height: 100%;
  border-radius: 10px 10px 0 0;
  transition: transform 0.3s ease;
}
.bnb-img:hover {
  transform: scale(1.05);
}
/* 新的標籤基礎樣式 */
.bnb-tag {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  font-weight: 500;
  padding: 4px 8px;
  border-radius: 12px;
  transition: all 0.2s ease;
  border: 1px solid transparent;
  white-space: nowrap;
  
  svg {
    flex-shrink: 0;
  }
}

/* 位置標籤樣式 */
.location-tag {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  box-shadow: 0 2px 4px rgba(102, 126, 234, 0.3);
  
  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 8px rgba(102, 126, 234, 0.4);
  }
}

/* 人數標籤樣式 */
.people-tag {
  background: linear-gradient(135deg, #48c78e 0%, #00d4aa 100%);
  color: white;
  box-shadow: 0 2px 4px rgba(72, 199, 142, 0.3);
  
  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 8px rgba(72, 199, 142, 0.4);
  }
}

/* 主題特色標籤樣式 */
.theme-tag {
  background: linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%);
  color: #8b4513;
  box-shadow: 0 2px 4px rgba(252, 182, 159, 0.3);
  border: 1px solid rgba(252, 182, 159, 0.4);
  
  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 8px rgba(252, 182, 159, 0.4);
    background: linear-gradient(135deg, #ffd89b 0%, #ff8a80 100%);
  }
}

/* 更多特色標籤樣式 */
.more-features-tag {
  background: #f8f9fa;
  color: #6c757d;
  border: 1px solid #dee2e6;
  font-weight: 600;
  
  &:hover {
    background: #e9ecef;
    transform: translateY(-1px);
  }
}

/* 舊樣式保持向後兼容 */
.bnb-category {
  display: inline-block;
  font-size: 14px;
  padding: 3px 6px;
  color: #5db0be;
  background-color: rgba(100,179,244,.1);
  margin: 10px 10px 10px 0;
  border-radius: 4px;
}
.bnb-people {
  background-color: rgba(93, 176, 190, 0.15);
  color: #2c5861;
  font-weight: 700;
  border: 1px solid rgba(93, 176, 190, 0.3);
}
.index-bnb-text {
  color: #272727;
  font-size: 14px;
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  line-height: 1.4;
  margin-bottom: 10px;
}
/* 統一的搜尋標籤樣式 */
.search-label {
  font-size: 12px;
  color: #666;
  margin-bottom: 4px;
  font-weight: 600;
  display: block;
}

/* 地區選擇樣式 */
.area-search-group {
  display: flex;
  flex-direction: column;
  width: 160px;
  
  @media (max-width: 768px) {
    width: calc(50% - 4px);
    min-width: 120px;
  }
  
  @media (max-width: 480px) {
    width: calc(50% - 4px);
    min-width: 100px;
  }
}

.select-input-group {
  display: flex;
  align-items: center;
  border: 2px solid #e9ecef;
  border-radius: 6px;
  background: white;
  transition: border-color 0.3s ease;
  position: relative;
  height: 32px;

  &:focus-within {
    border-color: #5db0be;
    box-shadow: 0 0 0 2px rgba(93, 176, 190, 0.1);
  }
}

.area-select {
  flex: 1;
  border: none !important;
  outline: none !important;
  padding: 6px 12px;
  font-size: 16px;
  background: transparent;
  appearance: none;
  cursor: pointer;
  height: 100%;

  &:focus {
    box-shadow: none !important;
  }
  
  @media (max-width: 768px) {
    padding: 5px 8px;
    font-size: 14px;
  }
  
  @media (max-width: 480px) {
    padding: 4px 6px;
    font-size: 13px;
  }
}

.select-suffix {
  padding: 6px 8px;
  background: #f8f9fa;
  color: #6c757d;
  border-left: 1px solid #e9ecef;
  border-radius: 0 4px 4px 0;
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: none;
  height: 100%;
  
  @media (max-width: 768px) {
    padding: 5px 6px;
    
    svg {
      width: 12px;
      height: 12px;
    }
  }
  
  @media (max-width: 480px) {
    padding: 4px 5px;
    
    svg {
      width: 10px;
      height: 10px;
    }
  }
}

/* 主要搜尋欄樣式 */
.main-search-group {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-width: 300px;
  
  @media (max-width: 768px) {
    min-width: unset;
    width: 100%;
    order: 3; /* 讓主搜尋欄在手機版時排到最後，獨佔一行 */
  }
}

.main-search-wrapper {
  display: flex;
  align-items: center;
  border: 2px solid #e9ecef;
  border-radius: 6px;
  background: white;
  transition: border-color 0.3s ease;
  position: relative;
  height: 32px;

  &:focus-within {
    border-color: #5db0be;
    box-shadow: 0 0 0 2px rgba(93, 176, 190, 0.1);
  }
}

.main-search-input {
  flex: 1;
  border: none !important;
  outline: none !important;
  padding: 6px 12px;
  font-size: 16px;
  background: transparent;
  height: 100%;

  &:focus {
    box-shadow: none !important;
  }

  &::placeholder {
    color: #adb5bd;
    font-size: 14px;
  }
  
  @media (max-width: 768px) {
    padding: 5px 10px;
    font-size: 14px;
    
    &::placeholder {
      font-size: 12px;
    }
  }
  
  @media (max-width: 480px) {
    padding: 4px 8px;
    font-size: 13px;
    
    &::placeholder {
      font-size: 11px;
    }
  }
}

.search-icon-wrapper {
  padding: 6px 8px;
  background: #f8f9fa;
  border-left: 1px solid #e9ecef;
  border-radius: 0 4px 4px 0;
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
}

.search-icon {
  color: #6c757d;
}

.search-clear-icon {
  color: #dc3545;
  cursor: pointer;
  transition: color 0.3s ease;

  &:hover {
    color: #c82333;
  }
}
.tag-title {
  display: inline-block;
  font-size: 14px;
  font-weight: bold;
}
.tag-list {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  justify-content: flex-start;
}
.hot-tag {
  background-color: #ffe9ac69;
  border-radius: 6px;
  padding: 5px;
  margin: 10px 3px;
  font-size: 12px;
  display: inline-block;
  color: #222222;
  cursor: pointer;
  transition: background-color 0.3s ease;
}
.hot-tag:hover {
  background-color: #ffdd87;
}
.price-info {
  margin-top: 10px;
  font-size: 13px;
}
.price-label {
  color: #666;
  margin-right: 5px;
}
.price-value {
  color: #d23333;
  font-weight: 600;
}

/* 新增樣式 */
.featured-badge {
  position: absolute;
  top: 10px;
  left: 10px;
  background: linear-gradient(135deg, #ffd700, #ffb347);
  color: #333;
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 11px;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 3px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.2);
  z-index: 2;
  pointer-events: none; /* 讓點擊穿透到下層 */
}

.bnb-header-row {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 8px;
}



.categories-row {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 12px;
  align-items: center;
  
  @media (max-width: 768px) {
    gap: 4px;
    margin-bottom: 10px;
  }
}


.package-price {
  margin-top: 8px;
  padding: 10px;
  background: linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%);
  border-radius: 8px;
  border: 1px solid #e9ecef;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.package-header {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 8px;
}

.package-icon {
  color: #ff8f00;
  opacity: 0.8;
}

.package-label {
  font-size: 12px;
  color: #252525;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.package-prices {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.package-item {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 11px;
  font-weight: 600;
}

.package-item.weekday {
  background-color: rgba(76, 175, 80, 0.1);
  color: #2e7d32;
}

.package-item.weekend {
  background-color: rgba(244, 67, 54, 0.1);
  color: #d23333;
}

.package-day {
  font-size: 10px;
  opacity: 0.8;
}

.package-value {
  font-weight: 700;
  font-size: 11px;
}

.view-count {
  display: flex;
  align-items: center;
  gap: 4px;
  margin-top: 8px;
  font-size: 11px;
  color: #888;
}

.bnb-wrapper {
  position: relative;
}

/* 調整原有樣式 */
.bnb-title {
  flex: 1;
  margin-bottom: 0;
}



/* 日期搜尋樣式 */
.date-search-group {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 280px;
  
  @media (max-width: 768px) {
    min-width: 100%;
    gap: 8px;
  }
}

.date-input-wrapper {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
  
  @media (max-width: 768px) {
    width: 100%;
    gap: 6px;
  }
}

.date-input-group {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  flex: 1;
}

.date-input {
  width: 100%;
  padding: 6px 8px;
  border: 2px solid #e9ecef;
  border-radius: 6px;
  font-size: 14px;
  background: white;
  transition: border-color 0.3s ease;
  text-align: center;
  
  &:focus {
    outline: none;
    border-color: #5db0be;
    box-shadow: 0 0 0 2px rgba(93, 176, 190, 0.1);
  }
  
  &::-webkit-calendar-picker-indicator {
    cursor: pointer;
    opacity: 0.6;
    
    &:hover {
      opacity: 1;
    }
  }
}

.date-label {
  font-size: 12px;
  color: #6c757d;
  font-weight: 500;
  text-align: center;
}

.date-separator {
  font-size: 18px;
  color: #6c757d;
  font-weight: 600;
  margin: 0 4px;
  
  @media (max-width: 768px) {
    display: none;
  }
}

.clear-dates-btn {
  background: #f8f9fa;
  border: 1px solid #e9ecef;
  border-radius: 6px;
  padding: 6px;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  
  @media (max-width: 768px) {
    padding: 8px;
    margin-left: 4px;
  }
  
  &:hover {
    background: #e9ecef;
    border-color: #dc3545;
    color: #dc3545;
  }
}

/* 人數搜尋樣式 */
.people-search-group {
  display: flex;
  flex-direction: column;
  width: 140px;
  
  @media (max-width: 768px) {
    width: calc(50% - 4px);
    min-width: 120px;
  }
  
  @media (max-width: 480px) {
    width: calc(50% - 4px);
    min-width: 100px;
  }
}

.people-input-group {
  display: flex;
  align-items: center;
  border: 2px solid #e9ecef;
  border-radius: 6px;
  background: white;
  transition: border-color 0.3s ease;
  height: 32px;

  &:focus-within {
    border-color: #5db0be;
    box-shadow: 0 0 0 2px rgba(93, 176, 190, 0.1);
  }
}

.people-input {
  flex: 1;
  border: none !important;
  outline: none !important;
  padding: 6px 12px;
  font-size: 16px;
  background: transparent;
  height: 100%;

  &:focus {
    box-shadow: none !important;
  }

  &::placeholder {
    color: #adb5bd;
    font-size: 14px;
  }
  
  @media (max-width: 768px) {
    padding: 5px 8px;
    font-size: 14px;
    
    &::placeholder {
      font-size: 12px;
    }
  }
  
  @media (max-width: 480px) {
    padding: 4px 6px;
    font-size: 13px;
    
    &::placeholder {
      font-size: 11px;
    }
  }
}

/* 統一的輸入後綴樣式 */
.input-suffix {
  padding: 6px 8px;
  background: #f8f9fa;
  color: #6c757d;
  font-size: 14px;
  font-weight: 600;
  border-left: 1px solid #e9ecef;
  border-radius: 0 4px 4px 0;
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  
  @media (max-width: 768px) {
    padding: 5px 6px;
    font-size: 12px;
  }
  
  @media (max-width: 480px) {
    padding: 4px 5px;
    font-size: 11px;
  }
}

/* 新增多圖輪播樣式 */
.mini-slider {
  position: relative;
  height: 165px;
  overflow: hidden;
  border-radius: 10px 10px 0 0;
}

.slider-container {
  position: relative;
  width: 100%;
  height: 100%;
}

.slider-image {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  opacity: 0;
  transition: opacity 0.4s ease-in-out;
  border-radius: 10px 10px 0 0;
}

.slider-image.active {
  opacity: 1;
}

.single-image {
  height: 165px;
  overflow: hidden;
  border-radius: 10px 10px 0 0;
  position: relative;
}

/* 導航按鈕樣式 */
.nav-btn {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  background: rgba(0, 0, 0, 0.6);
  color: white;
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
  backdrop-filter: blur(4px);
  
  &:hover {
    background: rgba(0, 0, 0, 0.8);
    transform: translateY(-50%) scale(1.1);
  }
  
  &:active {
    transform: translateY(-50%) scale(0.95);
  }
}

.prev-btn {
  left: 8px;
}

.next-btn {
  right: 8px;
}

/* 圖片指示器樣式 */
.image-indicators {
  position: absolute;
  bottom: 8px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  background: rgba(0, 0, 0, 0.6);
  border-radius: 20px;
  backdrop-filter: blur(4px);
  z-index: 3;
}

.indicator-dot {
  width: 8px;
  height: 12px;
  border-radius: 50%;
  border: none;
  background: rgba(255, 255, 255, 0.5);
  cursor: pointer;
  transition: all 0.3s ease;
  
  &:hover {
    background: rgba(255, 255, 255, 0.8);
    transform: scale(1.2);
  }
  
  &.active {
    background: white;
    transform: scale(1);
  }
}

.more-images {
  color: white;
  font-size: 10px;
  font-weight: 600;
  margin-left: 4px;
  background: rgba(255, 255, 255, 0.2);
  padding: 2px 6px;
  border-radius: 10px;
}

/* 圖片數量標籤樣式 */
.image-count-badge {
  position: absolute;
  top: 8px;
  right: 8px;
  background: rgba(0, 0, 0, 0.7);
  color: white;
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 11px;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 4px;
  backdrop-filter: blur(4px);
  z-index: 3;
}

/* 響應式設計 */
@media (max-width: 768px) {
  .nav-btn {
    width: 28px;
    height: 28px;
    
    svg {
      width: 12px;
      height: 12px;
    }
  }
  
  .prev-btn {
    left: 6px;
  }
  
  .next-btn {
    right: 6px;
  }
  
  .image-indicators {
    bottom: 6px;
    padding: 4px 8px;
    gap: 4px;
  }
  
  .indicator-dot {
    width: 6px;
    height: 12px;
  }
  
  .image-count-badge {
    top: 6px;
    right: 6px;
    padding: 3px 6px;
    font-size: 10px;
    
    svg {
      width: 10px;
      height: 10px;
    }
  }
}

/* Hover 效果增強 */
.bnb-wrapper:hover .mini-slider .nav-btn {
  opacity: 1 !important;
}

.bnb-wrapper:hover .image-indicators {
  background: rgba(0, 0, 0, 0.8);
}

.bnb-wrapper:hover .image-count-badge {
  background: rgba(0, 0, 0, 0.9);
}

/* 舊的圖片樣式保持不變 */

/* 進階搜尋樣式 */
.advanced-search-toggle {
  margin-top: 12px;
  
  @media (max-width: 768px) {
    margin-top: 8px;
    width: 100%;
  }
}

.advanced-toggle-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: #f8f9fa;
  border: 1px solid #e9ecef;
  border-radius: 6px;
  color: #495057;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  
  &:hover {
    background: #e9ecef;
    border-color: #5db0be;
    color: #5db0be;
  }
  
  @media (max-width: 768px) {
    width: 100%;
    justify-content: center;
    padding: 5px 16px;
    font-size: 13px;
  }
}

/* 右側滑入面板覆蓋層 */
.advanced-search-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(0, 0, 0, 0);
  z-index: 1000;
  opacity: 0;
  visibility: hidden;
  transition: all 0.3s ease;
  
  @media (max-width: 768px) {
    height: 100dvh; /* 使用動態視口高度 */
    max-height: -webkit-fill-available; /* iOS Safari 兼容 */
  }
  
  &.active {
    opacity: 1;
    visibility: visible;
    background: rgba(0, 0, 0, 0.5);
  }
}

/* 右側滑入面板主體 */
.advanced-search-panel {
  position: fixed;
  top: 0;
  right: -400px;
  width: 400px;
  height: 100vh;
  background: white;
  box-shadow: -4px 0 20px rgba(0, 0, 0, 0.15);
  transition: right 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
  display: flex;
  flex-direction: column;
  z-index: 1001;
  
  @media (max-width: 768px) {
    width: 100vw;
    right: -100vw;
    height: 100dvh; /* 使用動態視口高度，適應手機瀏覽器地址欄 */
    max-height: -webkit-fill-available; /* iOS Safari 兼容 */
  }
  
  .advanced-search-overlay.active & {
    right: 0;
  }
}

/* 面板標題區域 */
.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 24px;
  border-bottom: 1px solid #e9ecef;
  background: #f8f9fa;
  
  @media (max-width: 768px) {
    padding: 16px 20px;
  }
}

.panel-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 18px;
  font-weight: 600;
  color: #333;
  margin: 0;
  
  svg {
    color: #5db0be;
  }
  
  @media (max-width: 768px) {
    font-size: 16px;
  }
}

.panel-close-btn {
  background: none;
  border: none;
  color: #6c757d;
  cursor: pointer;
  padding: 4px;
  border-radius: 50%;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  
  &:hover {
    background: #e9ecef;
    color: #495057;
  }
}

/* 面板內容區域 */
.panel-body {
  flex: 1;
  padding: 24px;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch; /* iOS 平滑滾動 */
  overscroll-behavior: contain; /* 防止滾動穿透 */
  
  @media (max-width: 768px) {
    padding: 20px;
  }
}

/* 已選擇的篩選條件 */
.active-filters {
  margin-bottom: 24px;
  padding: 16px;
  background: #f8f9fa;
  border-radius: 8px;
  border: 1px solid #e9ecef;
}

.filter-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.filter-tag {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: linear-gradient(135deg, #5db0be 0%, #4a9eff 100%);
  color: white;
  padding: 6px 12px;
  border-radius: 16px;
  font-size: 13px;
  font-weight: 500;
  box-shadow: 0 2px 4px rgba(93, 176, 190, 0.3);
  
  .tag-remove {
    background: none;
    border: none;
    color: white;
    font-size: 16px;
    font-weight: bold;
    cursor: pointer;
    padding: 0;
    margin-left: 4px;
    line-height: 1;
    opacity: 0.8;
    transition: opacity 0.2s ease;
    
    &:hover {
      opacity: 1;
    }
  }
}

/* 特色群組樣式 */
.feature-group {
  margin-bottom: 32px;
  
  &:last-child {
    margin-bottom: 0;
  }
}

.feature-group-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 16px;
  font-weight: 600;
  color: #333;
  margin-bottom: 16px;
  padding-bottom: 8px;
  border-bottom: 2px solid #e9ecef;
  
  svg {
    color: #5db0be;
  }
}

.feature-options {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: flex-start;
  
  @media (max-width: 768px) {
    gap: 6px;
  }
  
  @media (max-width: 480px) {
    gap: 4px;
  }
}

.feature-checkbox {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  border-radius: 20px;
  cursor: pointer;
  border: 2px solid transparent;
  transition: all 0.2s ease;
  background: #f8f9fa;
  white-space: nowrap;
  flex-shrink: 0;
  
  @media (max-width: 768px) {
    padding: 6px 10px;
    gap: 6px;
    border-radius: 16px;
  }
  
  @media (max-width: 480px) {
    padding: 5px 8px;
    gap: 5px;
    border-radius: 14px;
  }
  
  &:hover {
    background: #e9ecef;
    border-color: #5db0be;
    transform: translateY(-1px);
    box-shadow: 0 2px 4px rgba(93, 176, 190, 0.2);
  }
  
  /* 選中狀態的樣式 */
  &:has(input[type="checkbox"]:checked) {
    background: linear-gradient(135deg, #5db0be 0%, #4a9eff 100%);
    border-color: #5db0be;
    color: white;
    box-shadow: 0 2px 8px rgba(93, 176, 190, 0.3);
    
    .feature-text {
      color: white;
    }
  }
  
  input[type="checkbox"] {
    position: relative;
    width: 16px;
    height: 16px;
    appearance: none;
    border: 2px solid #dee2e6;
    border-radius: 3px;
    background: white;
    cursor: pointer;
    transition: all 0.2s ease;
    flex-shrink: 0;
    
    &:checked {
      background: white;
      border-color: white;
      
      &::after {
        content: '✓';
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        color: #5db0be;
        font-size: 12px;
        font-weight: bold;
      }
    }
    
    &:hover {
      border-color: #5db0be;
    }
  }
  
  .feature-text {
    flex: 1;
    font-size: 13px;
    color: #495057;
    font-weight: 500;
    line-height: 1.2;
    
    @media (max-width: 768px) {
      font-size: 12px;
    }
    
    @media (max-width: 480px) {
      font-size: 11px;
    }
  }
}

/* 面板底部操作區域 */
.panel-footer {
  padding: 20px 24px;
  border-top: 1px solid #e9ecef;
  background: #f8f9fa;
  
  @media (max-width: 768px) {
    padding: 16px 20px;
  }
}

.panel-actions {
  display: flex;
  gap: 12px;
  
  @media (max-width: 768px) {
    flex-direction: column;
    gap: 8px;
  }
}

.clear-filters-btn {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 12px 16px;
  background: #f8f9fa;
  border: 2px solid #dee2e6;
  border-radius: 8px;
  color: #6c757d;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  
  &:hover {
    background: #e9ecef;
    border-color: #dc3545;
    color: #dc3545;
  }
  
  @media (max-width: 768px) {
    padding: 14px 16px;
  }
}

.apply-filters-btn {
  flex: 2;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 12px 16px;
  background: linear-gradient(135deg, #5db0be 0%, #4a9eff 100%);
  border: none;
  border-radius: 8px;
  color: white;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 12px rgba(93, 176, 190, 0.3);
  
  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 6px 16px rgba(93, 176, 190, 0.4);
    background: linear-gradient(135deg, #4a9eff 0%, #5db0be 100%);
  }
  
  &:active {
    transform: translateY(0);
  }
  
  @media (max-width: 768px) {
    padding: 14px 16px;
  }
}

/* 響應式調整 */
@media (max-width: 480px) {
  .advanced-search-panel {
    width: 100vw;
  }
  
  .panel-header,
  .panel-body,
  .panel-footer {
    padding-left: 16px;
    padding-right: 16px;
  }
  
  .filter-tag {
    padding: 4px 8px;
    font-size: 12px;
  }
}
</style> 