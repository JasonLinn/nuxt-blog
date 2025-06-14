<!-- pages/map.vue -->
<template>
    <div class="map-container">
      <!-- 載入狀態 -->
      <div v-if="isMapLoading" class="loading-overlay">
        <div class="loading-content">
          <Icon class="h-8 w-8 text-blue-500 animate-spin" name="eos-icons:loading" />
          <span class="ml-2 text-gray-600">載入地圖中...</span>
        </div>
      </div>
      
      <!-- 錯誤狀態 -->
      <div v-else-if="mapError" class="error-overlay">
        <div class="error-content">
          <span class="text-red-600">地圖載入失敗</span>
          <p class="text-gray-600 mt-2">{{ mapError }}</p>
          <button @click="retryLoadMap" class="retry-btn">重試</button>
        </div>
      </div>
      
      <div class="control-bar" v-show="!isMapLoading && !mapError">
        <div class="control-title">地標類別</div>
        <div class="control-buttons">
          <button 
            v-for="(category, index) in categories" 
            :key="index" 
            @click="toggleCategory(category.key)"
            :class="{ active: activeCategoriesMap[category.key] }"
            class="category-btn"
          >
            {{ category.name }}
          </button>
        </div>
        
        <div class="search-container">
          <input 
            type="text" 
            v-model="searchQuery" 
            @input="handleSearchInput" 
            placeholder="搜尋地點..." 
            class="search-input"
            autocomplete="off"
            spellcheck="false"
          />
          <div v-if="searchResults.length > 0" class="search-results">
            <div 
              v-for="(result, index) in searchResults" 
              :key="result.id || index" 
              @click="navigateToLocation(result)"
              class="search-result-item"
            >
              {{ result.title }}
            </div>
          </div>
        </div>
        
        <div class="control-options">
          <button 
            @click="toggleLabels"
            :class="{ active: showLabels }"
            class="option-btn"
          >
            {{ showLabels ? '隱藏店名' : '顯示店名' }}
          </button>
        </div>
      </div>
      <div id="map" ref="mapRef"></div>
      <button class="location-btn" @click="getCurrentLocation" v-show="!isMapLoading && !mapError">
        <span class="location-icon">📍</span>
      </button>
      
      <!-- 地標資訊面板 -->
      <div class="map-info-panel" :class="{ 'map-info-panel-open': isInfoPanelOpen }" ref="infoPanelRef">
        <div class="map-info-toggle" @click="isInfoPanelOpen = !isInfoPanelOpen">
          <Icon name="ri:arrow-up-s-line" class="map-toggle" :class="{ 'arrow-upside': isInfoPanelOpen }" />
        </div>
        <div class="map-info-wrapper" v-if="selectedCoupon && selectedCoupon.id">
          <CouponInfo :couponId="selectedCoupon.id" :key="selectedCoupon.id"></CouponInfo>
        </div>
        <div class="map-info-wrapper" v-else-if="selectedCoupon && !selectedCoupon.id">
          <div class="debug-info">
            <h3>除錯資訊</h3>
            <p>選中的優惠券沒有 ID</p>
            <pre>{{ JSON.stringify(selectedCoupon, null, 2) }}</pre>
          </div>
        </div>
        <div class="map-info-wrapper" v-else-if="isInfoPanelOpen">
          <div class="debug-info">
            <p>面板已開啟但沒有選中的優惠券</p>
          </div>
        </div>
      </div>
    </div>
  </template>
  
  <script setup>
  import { ref, onMounted, reactive, computed, watch, onUnmounted, nextTick } from 'vue';
  import useCouponMapStore from "~~/store/couponMap";
  import { Loader } from '@googlemaps/js-api-loader';

  // SEO 優化
  useSeoMeta({
    title: '優惠券地圖 - 探索周邊優惠',
    ogTitle: '優惠券地圖 - 探索周邊優惠',
    description: '在地圖上探索宜蘭各地的優惠券和特色商家位置',
    ogDescription: '在地圖上探索宜蘭各地的優惠券和特色商家位置',
    keywords: '優惠券,地圖,宜蘭,位置,商家,導航'
  })

  const store = useCouponMapStore();
  const couponObject = computed(() => store.getCouponData);
  const selectedCategory = ref(null);
  
  // 效能優化：使用快取的計算屬性
  const couponDataCache = new Map();
  const couponData = computed(() => {
    if (!couponObject.value?.data?.items) return [];
    
    const cacheKey = `${selectedCategory.value || 'all'}_${couponObject.value.data.items.length}`;
    
    if (couponDataCache.has(cacheKey)) {
      return couponDataCache.get(cacheKey);
    }
    
    const result = selectedCategory.value 
      ? couponObject.value.data.items.filter((i) => i.category === selectedCategory.value) 
      : couponObject.value.data.items;
    
    couponDataCache.set(cacheKey, result);
    
    // 限制快取大小
    if (couponDataCache.size > 10) {
      const firstKey = couponDataCache.keys().next().value;
      couponDataCache.delete(firstKey);
    }
    
    return result;
  });
  
  // 載入狀態管理
  const isMapLoading = ref(true);
  const mapError = ref(null);
  
  // 初始化數據
  if (!couponData.value?.length) {
    store.fetchAndSetCoupon({pageSize: 150});
  }

  // 地標資訊面板控制
  const isInfoPanelOpen = ref(false);
  const selectedCoupon = ref(null);
  const infoPanelRef = ref(null);
  
  // 地图容器引用
  const mapRef = ref(null);
  let map = null;
  let markers = [];
  let markerPool = []; // 標記池，重複使用標記對象
  let userLocationMarker = null;
  
  // 標籤顯示控制 - 預設開啟店名顯示
  const showLabels = ref(true);
  
  // 搜尋功能優化
  const searchQuery = ref('');
  const searchResults = ref([]);
  let searchTimeout = null;
  const searchCache = new Map();
  
  // 防彈跳搜尋處理
  const handleSearchInput = () => {
    if (searchTimeout) clearTimeout(searchTimeout);
    
    // 如果搜尋框為空，立即清空結果
    if (!searchQuery.value.trim()) {
      searchResults.value = [];
      return;
    }
    
    searchTimeout = setTimeout(() => {
      performSearch();
    }, 300); // 300ms 防彈跳
  };
  
  // 優化的搜尋函數
  const performSearch = () => {
    const query = searchQuery.value.trim();
    
    if (!query) {
      searchResults.value = [];
      return;
    }
    
    // 檢查快取
    if (searchCache.has(query)) {
      searchResults.value = searchCache.get(query);
      return;
    }
    
    if (!couponData.value || !Array.isArray(couponData.value)) {
      return;
    }
    
    // 過濾符合搜尋條件的地點
    const queryLower = query.toLowerCase();
    const results = couponData.value
      .filter(item => {
        // 優先匹配標題，然後是內容和描述
        const titleMatch = item.title && item.title.toLowerCase().includes(queryLower);
        if (titleMatch) return true;
        
        const contentMatch = item.content && item.content.toLowerCase().includes(queryLower);
        if (contentMatch) return true;
        
        const descriptionMatch = item.description && item.description.toLowerCase().includes(queryLower);
        return descriptionMatch;
      })
      .slice(0, 5); // 限制最多顯示5個結果
    
    // 快取搜尋結果
    searchCache.set(query, results);
    
    // 限制快取大小
    if (searchCache.size > 20) {
      const firstKey = searchCache.keys().next().value;
      searchCache.delete(firstKey);
    }
    
    searchResults.value = results;
  };
  
  // 導航到選擇的位置
  const navigateToLocation = (location) => {
    console.log('點擊搜尋結果:', location); // 除錯用
    
    if (!map || !location.position) {
      console.error('地圖或位置無效:', { map: !!map, position: location.position });
      return;
    }
    
    // 檢查位置對象是否有效
    if (typeof location.position.lat !== 'number' || typeof location.position.lng !== 'number') {
      console.error('無效的位置對象:', location);
      return;
    }
    
    // 移動地圖到選擇的位置
    const position = new google.maps.LatLng(
      parseFloat(location.position.lat),
      parseFloat(location.position.lng)
    );
    
    map.setCenter(position);
    map.setZoom(16);
    
    // 清空搜尋結果
    searchQuery.value = '';
    searchResults.value = [];
    
    // 高亮顯示選中的標記
    highlightMarker(location);
    
    // 顯示地標資訊 - 延遲一點確保地圖移動完成
    setTimeout(() => {
      showCouponInfo(location);
    }, 300);
  };
  
  // 顯示地標資訊
  const showCouponInfo = (coupon) => {
    console.log('顯示資訊面板:', coupon); // 除錯用
    selectedCoupon.value = coupon;
    isInfoPanelOpen.value = true;
    
    // 確保面板能夠正確顯示，延遲一點時間讓動畫觸發
    nextTick(() => {
      const panel = document.querySelector('.map-info-panel');
      if (panel) {
        panel.scrollIntoView({ behavior: 'smooth', block: 'end' });
      }
    });
  };
  
  // 優化的高亮標記函數
  const highlightMarker = (location) => {
    const targetLat = parseFloat(location.position.lat);
    const targetLng = parseFloat(location.position.lng);
    
    // 使用 requestAnimationFrame 優化動畫效能
    requestAnimationFrame(() => {
      markers.forEach(marker => {
        if (marker instanceof google.maps.Marker && 
            marker.getPosition && 
            Math.abs(marker.getPosition().lat() - targetLat) < 0.0001 && 
            Math.abs(marker.getPosition().lng() - targetLng) < 0.0001) {
          
          // 臨時放大標記
          const icon = marker.getIcon();
          if (icon && icon.scale) {
            const originalScale = icon.scale;
            icon.scale = originalScale * 1.5;
            marker.setIcon(icon);
            
            // 2秒後恢復原始大小
            setTimeout(() => {
              if (marker.getMap()) { // 確保標記還在地圖上
                icon.scale = originalScale;
                marker.setIcon(icon);
              }
            }, 2000);
          }
          
          // 如果標籤未顯示，臨時顯示此標記的標題
          if (!showLabels.value) {
            const titleOverlay = markers.find(m => 
              m instanceof TitleOverlay && 
              Math.abs(m.position.lat() - targetLat) < 0.0001 && 
              Math.abs(m.position.lng() - targetLng) < 0.0001
            );
            
            if (titleOverlay) {
              titleOverlay.show();
              setTimeout(() => {
                if (titleOverlay.div) { // 確保覆蓋層還存在
                  titleOverlay.hide();
                }
              }, 3000);
            }
          }
        }
      });
    });
  };
  
  // 切換標籤顯示/隱藏
  const toggleLabels = () => {
    showLabels.value = !showLabels.value;
    updateMarkerLabels();
  };
  
  // 批量更新標記標籤
  const updateMarkerLabels = () => {
    if (!window.google || !window.google.maps || !map) return;
    
    // 使用 requestAnimationFrame 優化批量更新
    requestAnimationFrame(() => {
      markers.forEach(marker => {
        if (marker instanceof google.maps.Marker && marker.getLabel) {
          const label = marker.getLabel();
          if (label) {
            marker.setLabel(label);
          }
        }
        
        if (marker instanceof TitleOverlay) {
          marker.toggle(showLabels.value);
        }
      });
    });
  };
  
  // 地標類別
  const categories = [
    { key: 'eat', name: '食', icon: '🍽️', color: '#FF5722' },
    { key: 'play', name: '樂', icon: '🎪', color: '#2196F3' },
    { key: 'housing', name: '住', icon: '🏠', color: '#4CAF50' },
    { key: 'traffic', name: '行', icon: '🚗', color: '#FFC107' }
  ];
  
  // 活躍類別狀態 - 預設只顯示「食」類別
  const activeCategoriesMap = reactive({
    eat: true,
    play: false,
    housing: false,
    traffic: false
  });
  
  // 切換類別顯示/隱藏
  const toggleCategory = (category) => {
    activeCategoriesMap[category] = !activeCategoriesMap[category];
    // 使用 nextTick 確保響應式更新完成後再更新標記
    nextTick(() => {
      updateMarkers();
    });
  };
  
  // 標記池管理：重複使用標記對象
  const getMarkerFromPool = () => {
    return markerPool.pop() || null;
  };
  
  const returnMarkerToPool = (marker) => {
    if (marker instanceof google.maps.Marker) {
      marker.setMap(null);
      marker.setPosition(null);
      marker.setTitle('');
      markerPool.push(marker);
    }
  };
  
  // 優化的標記更新函數
  const updateMarkers = () => {
    if (!window.google || !window.google.maps || !map) {
      return;
    }
    
    // 將現有標記回收到池中
    markers.forEach(marker => {
      if (marker instanceof google.maps.Marker) {
        returnMarkerToPool(marker);
      } else if (marker instanceof TitleOverlay) {
        marker.setMap(null);
      }
    });
    markers = [];
    
    // 批量處理標記創建
    const newMarkers = [];
    const newTitleOverlays = [];
    
    if (couponData.value && Array.isArray(couponData.value)) {
      couponData.value.forEach(landmark => {
        // 檢查位置對象是否有效
        if (!landmark.position || typeof landmark.position.lat !== 'number' || typeof landmark.position.lng !== 'number') {
          return;
        }
        
        const categoryKey = landmark.category || '';
        const categoryObj = categories.find(cat => cat.key === categoryKey);
        
        if (categoryObj && activeCategoriesMap[categoryObj.key]) {
          // 嘗試從池中獲取標記
          let marker = getMarkerFromPool();
          
          if (!marker) {
            marker = new google.maps.Marker({
              map: map,
              zIndex: 1
            });
          }
          
          // 配置標記
          marker.setPosition(new google.maps.LatLng(
            parseFloat(landmark.position.lat),
            parseFloat(landmark.position.lng)
          ));
          marker.setMap(map);
          marker.setTitle(landmark.title);
          marker.setIcon({
            path: google.maps.SymbolPath.CIRCLE,
            fillColor: categoryObj.color,
            fillOpacity: 0.7,
            strokeWeight: 1,
            strokeColor: '#FFFFFF',
            scale: 14
          });
          marker.setLabel({
            text: categoryObj.icon,
            fontSize: '16px',
            fontWeight: 'bold'
          });
          
          // 移除舊的事件監聽器並添加新的
          google.maps.event.clearInstanceListeners(marker);
          marker.addListener('click', () => {
            window.isMarkerClick = true;
            showCouponInfo(landmark);
            highlightMarker(landmark);
          });
          
          newMarkers.push(marker);
          
          // 創建標題覆蓋層
          if (landmark.title) {
            const titleOverlay = new TitleOverlay(
              new google.maps.LatLng(
                parseFloat(landmark.position.lat),
                parseFloat(landmark.position.lng)
              ),
              landmark.title,
              map
            );
            
            titleOverlay.toggle(showLabels.value);
            newTitleOverlays.push(titleOverlay);
          }
        }
      });
    }
    
    // 批量添加到標記陣列
    markers.push(...newMarkers, ...newTitleOverlays);
  };
  
  // 自定義標題覆蓋層類
  let TitleOverlay;
  
  // 初始化 TitleOverlay 類
  const initTitleOverlay = () => {
    if (!window.google || !window.google.maps) {
      return null;
    }
    
    class TitleOverlay extends google.maps.OverlayView {
      constructor(position, title, map) {
        super();
        this.position = position;
        this.title = title;
        this.map = map;
        this.div = null;
        this.setMap(map);
      }
      
      onAdd() {
        const div = document.createElement('div');
        div.style.cssText = `
          position: absolute;
          background-color: rgba(0, 0, 0, 0.6);
          color: white;
          font-weight: bold;
          font-size: 12px;
          padding: 3px 8px;
          border-radius: 4px;
          text-align: center;
          min-width: 80px;
          max-width: 150px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          pointer-events: none;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
          transform: translate(-50%, -100%);
          margin-top: -10px;
          display: ${showLabels.value ? 'block' : 'none'};
        `;
        div.textContent = this.title;
        
        this.div = div;
        const panes = this.getPanes();
        panes.overlayMouseTarget.appendChild(div);
      }
      
      draw() {
        if (!this.div) return;
        
        const overlayProjection = this.getProjection();
        if (!overlayProjection) return;
        
        const position = overlayProjection.fromLatLngToDivPixel(this.position);
        if (!position) return;
        
        this.div.style.left = position.x + 'px';
        this.div.style.top = position.y + 'px';
      }
      
      onRemove() {
        if (this.div && this.div.parentNode) {
          this.div.parentNode.removeChild(this.div);
          this.div = null;
        }
      }
      
      hide() {
        if (this.div) {
          this.div.style.display = 'none';
        }
      }
      
      show() {
        if (this.div) {
          this.div.style.display = 'block';
        }
      }
      
      toggle(visible) {
        if (this.div) {
          this.div.style.display = visible ? 'block' : 'none';
        }
      }
    }

    return TitleOverlay;
  };
  
  // 優化的當前位置獲取
  const getCurrentLocation = () => {
    if (!window.google || !window.google.maps) {
      alert('地圖尚未完全載入，請稍後再試。');
      return;
    }
    
    if (!navigator.geolocation) {
      alert('您的瀏覽器不支援地理位置功能。');
      return;
    }
    
    // 顯示載入狀態
    const locationBtn = document.querySelector('.location-btn');
    if (locationBtn) {
      locationBtn.style.opacity = '0.6';
      locationBtn.style.pointerEvents = 'none';
    }
    
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const userLocation = {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        };
        
        map.setCenter(userLocation);
        map.setZoom(16);
        
        // 清理舊的用戶位置標記
        if (userLocationMarker) {
          userLocationMarker.setMap(null);
        }
        
        // 添加新的用戶位置標記
        userLocationMarker = new google.maps.Marker({
          position: new google.maps.LatLng(userLocation.lat, userLocation.lng),
          map: map,
          title: '我的位置',
          icon: {
            path: google.maps.SymbolPath.CIRCLE,
            scale: 10,
            fillColor: '#4285F4',
            fillOpacity: 1,
            strokeColor: '#FFFFFF',
            strokeWeight: 2
          },
          label: {
            text: '📍',
            fontSize: '16px',
            fontWeight: 'bold'
          },
          zIndex: 1000
        });
        
        // 恢復按鈕狀態
        if (locationBtn) {
          locationBtn.style.opacity = '1';
          locationBtn.style.pointerEvents = 'auto';
        }
      },
      (error) => {
        console.error('獲取位置失敗:', error);
        alert('無法獲取您的位置，請確保已授予位置權限。');
        
        // 恢復按鈕狀態
        if (locationBtn) {
          locationBtn.style.opacity = '1';
          locationBtn.style.pointerEvents = 'auto';
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000 // 5分鐘快取
      }
    );
  };
  
  // 重試載入地圖
  const retryLoadMap = async () => {
    mapError.value = null;
    isMapLoading.value = true;
    try {
      await loadGoogleMapsApi();
      await initMap();
    } catch (error) {
      console.error('重試載入失敗:', error);
      mapError.value = error.message || '地圖載入失敗';
    } finally {
      isMapLoading.value = false;
    }
  };
  
  // 異步載入 Google Maps API
  const loadGoogleMapsApi = async () => {
    try {
      const config = useRuntimeConfig();
      const googleMapsApiKey = config.public.GOOGLE_MAPS_API_KEY;

      if (!googleMapsApiKey) {
        throw new Error('Google Maps API Key 未設定');
      }
      
      const loader = new Loader({
        apiKey: googleMapsApiKey,
        version: 'weekly',
        libraries: ['places'] // 如果需要的話
      });
      
      await loader.load();
    } catch (error) {
      console.error('Google Maps API 載入失敗:', error);
      throw error;
    }
  };

  // 優化的地圖初始化
  const initMap = async () => {
    if (!window.google || !window.google.maps) {
      throw new Error('Google Maps API 尚未載入');
    }
    
    const center = { lat: 24.677407, lng: 121.75371 };
    
    map = new google.maps.Map(mapRef.value, {
      center: center,
      zoom: 12,
      mapTypeControl: true,
      streetViewControl: true,
      fullscreenControl: true,
      gestureHandling: "greedy",
      styles: [
        {
          featureType: 'administrative.land_parcel',
          elementType: 'labels',
          stylers: [{ visibility: 'off' }]
        },
        {
          featureType: 'poi',
          elementType: 'labels.text',
          stylers: [{ visibility: 'off' }]
        },
        {
          featureType: 'poi.business',
          stylers: [{ visibility: 'off' }]
        },
        {
          featureType: 'road.local',
          stylers: [{ visibility: 'off' }]
        }
      ]
    });
    
    // 初始化 TitleOverlay 類
    TitleOverlay = initTitleOverlay();
    
    if (!TitleOverlay) {
      throw new Error('TitleOverlay 初始化失敗');
    }
    
    // 初始化標記
    updateMarkers();
    
    // 節流的縮放事件監聽器
    let zoomTimeout = null;
    map.addListener('zoom_changed', () => {
      if (zoomTimeout) clearTimeout(zoomTimeout);
      zoomTimeout = setTimeout(() => {
        const zoom = map.getZoom();
        
        requestAnimationFrame(() => {
          markers.forEach(marker => {
            if (marker instanceof google.maps.Marker && marker.getIcon) {
              const icon = marker.getIcon();
              if (icon && typeof icon.scale === 'number') {
                const newScale = 10 + (zoom / 3);
                icon.scale = newScale;
                marker.setIcon(icon);
              }
            }
          });
        });
      }, 100);
    });
    
    // 優化的地圖移動事件
    let idleTimeout = null;
    map.addListener('idle', () => {
      if (idleTimeout) clearTimeout(idleTimeout);
      idleTimeout = setTimeout(() => {
        markers.forEach(marker => {
          if (marker instanceof TitleOverlay) {
            marker.draw();
          }
        });
      }, 50);
    });
  };
  
  // 優化的 couponData 監聽器
  let updateTimeout = null;
  watch(() => couponData.value, (newValue) => {
    if (newValue && Array.isArray(newValue) && newValue.length > 0 && map) {
      if (updateTimeout) clearTimeout(updateTimeout);
      updateTimeout = setTimeout(() => {
        updateMarkers();
      }, 100);
    }
  }, { deep: false }); // 使用淺監聽提升效能
  
  // 優化的點擊外部處理
  const handleClickOutside = (event) => {
    if (!isInfoPanelOpen.value || !infoPanelRef.value) return;
    
    if (infoPanelRef.value.contains(event.target)) return;
    
    const controlBar = document.querySelector('.control-bar');
    const locationBtn = document.querySelector('.location-btn');
    
    if ((controlBar && controlBar.contains(event.target)) || 
        (locationBtn && locationBtn.contains(event.target))) {
      return;
    }
    
    if (window.isMarkerClick) {
      window.isMarkerClick = false;
      return;
    }
    
    isInfoPanelOpen.value = false;
  };
  
  // 清理函數
  const cleanup = () => {
    // 清理定時器
    if (searchTimeout) clearTimeout(searchTimeout);
    if (updateTimeout) clearTimeout(updateTimeout);
    
    // 清理事件監聽器的定時器
    const allTimeouts = [searchTimeout, updateTimeout];
    allTimeouts.forEach(timeout => {
      if (timeout) clearTimeout(timeout);
    });
    
    // 清理標記
    markers.forEach(marker => {
      if (marker instanceof google.maps.Marker) {
        google.maps.event.clearInstanceListeners(marker);
        marker.setMap(null);
      } else if (marker instanceof TitleOverlay) {
        marker.setMap(null);
      }
    });
    
    // 清理標記池
    markerPool.forEach(marker => {
      google.maps.event.clearInstanceListeners(marker);
    });
    
    // 清理用戶位置標記
    if (userLocationMarker) {
      google.maps.event.clearInstanceListeners(userLocationMarker);
      userLocationMarker.setMap(null);
    }
    
    // 清理地圖事件監聽器
    if (map) {
      google.maps.event.clearInstanceListeners(map);
    }
    
    // 清理快取
    couponDataCache.clear();
    searchCache.clear();
    
    // 移除 DOM 事件監聽器
    document.removeEventListener('click', handleClickOutside);
  };
  
  // 組件掛載
  onMounted(async () => {
    try {
      window.isMarkerClick = false;
      
      await loadGoogleMapsApi();
      await initMap();
      
      document.addEventListener('click', handleClickOutside, { passive: true });
    } catch (error) {
      console.error('地圖初始化失敗:', error);
      mapError.value = error.message || '地圖載入失敗';
    } finally {
      isMapLoading.value = false;
    }
  });
  
  // 組件卸載
  onUnmounted(() => {
    cleanup();
  });
  </script>
  
  <style scoped>
  .map-container {
    position: relative;
    width: 100%;
    height: calc(100vh - 70px);
  }
  
  .loading-overlay, .error-overlay {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: rgba(255, 255, 255, 0.9);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
  }
  
  .loading-content, .error-content {
    text-align: center;
    padding: 20px;
    background-color: white;
    border-radius: 8px;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  }
  
  .retry-btn {
    margin-top: 12px;
    padding: 8px 16px;
    background-color: #4285F4;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    transition: background-color 0.2s;
  }
  
  .retry-btn:hover {
    background-color: #3367D6;
  }
  
  #map {
    width: 100%;
    height: 100%;
  }
  
  .control-bar {
    position: absolute;
    top: 10px;
    left: 10px;
    width: 60%;
    max-width: 400px;
    z-index: 1;
    background-color: rgba(255, 255, 255, 0.95);
    padding: 10px;
    border-radius: 5px;
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);
    backdrop-filter: blur(5px);
  }
  
  .control-title {
    font-weight: bold;
    margin-bottom: 8px;
    text-align: center;
  }
  
  .control-buttons {
    display: flex;
    gap: 8px;
    margin-bottom: 8px;
  }
  
  .search-container {
    position: relative;
    margin: 10px 0;
    width: 100%;
  }
  
  .search-input {
    width: 100%;
    padding: 8px 12px;
    border: 1px solid #ddd;
    border-radius: 4px;
    font-size: 16px;
    box-sizing: border-box;
    transition: border-color 0.2s;
  }
  
  .search-input:focus {
    outline: none;
    border-color: #4285F4;
  }
  
  .search-results {
    position: absolute;
    top: 100%;
    left: 0;
    right: 0;
    background-color: white;
    border: 1px solid #ddd;
    border-radius: 0 0 4px 4px;
    max-height: 200px;
    overflow-y: auto;
    z-index: 20;
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
  }
  
  .search-result-item {
    padding: 8px 12px;
    cursor: pointer;
    border-bottom: 1px solid #eee;
    font-size: 14px;
    transition: background-color 0.2s;
  }
  
  .search-result-item:last-child {
    border-bottom: none;
  }
  
  .search-result-item:hover {
    background-color: #f5f5f5;
  }
  
  .control-options {
    display: flex;
    justify-content: center;
    margin-top: 8px;
    border-top: 1px solid #eee;
    padding-top: 8px;
  }
  
  .category-btn, .option-btn {
    padding: 8px 12px;
    border: 1px solid #ddd;
    border-radius: 4px;
    background-color: white;
    cursor: pointer;
    transition: all 0.2s;
  }
  
  .option-btn {
    width: 100%;
    font-size: 12px;
  }
  
  .category-btn.active, .option-btn.active {
    background-color: #4285F4;
    color: white;
    border-color: #4285F4;
  }
  
  .category-btn:hover:not(.active), .option-btn:hover:not(.active) {
    background-color: #f1f1f1;
  }
  
  .category-btn.active:hover, .option-btn.active:hover {
    background-color: #3367D6;
  }
  
  .location-btn {
    position: absolute;
    bottom: 160px;
    right: 6px;
    width: 48px;
    height: 48px;
    border-radius: 50%;
    background-color: white;
    border: none;
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 10;
    transition: all 0.2s;
  }
  
  .location-btn:hover {
    background-color: #f1f1f1;
    transform: scale(1.05);
  }
  
  .location-btn:active {
    transform: scale(0.95);
  }
  
  .location-icon {
    font-size: 24px;
  }
  
  .map-info-panel {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    background-color: white;
    border-radius: 12px 12px 0 0;
    box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.15);
    transform: translateY(calc(100% - 30px));
    transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    z-index: 20;
    max-height: 60vh;
    overflow: hidden;
  }
  
  .map-info-panel-open {
    transform: translateY(0);
  }
  
  .map-info-toggle {
    height: 30px;
    display: flex;
    justify-content: center;
    align-items: center;
    cursor: pointer;
    background-color: rgba(249, 249, 249, 0.8);
    border-radius: 12px 12px 0 0;
    backdrop-filter: blur(5px);
  }
  
  .map-toggle {
    font-size: 24px;
    color: #666;
    transition: transform 0.3s ease;
  }
  
  .arrow-upside {
    transform: rotate(180deg);
  }
  
  .map-info-wrapper {
    padding: 15px;
    overflow-y: auto;
    max-height: calc(60vh - 30px);
  }
  
  /* 響應式設計 */
  @media (max-width: 768px) {
    .control-bar {
      top: 5px;
      left: 5px;
      right: 5px;
      padding: 8px;
    }
    
    .control-buttons {
      flex-wrap: wrap;
      gap: 4px;
    }
    
    .category-btn {
      flex: 1;
      min-width: calc(25% - 3px);
      font-size: 12px;
      padding: 6px 8px;
    }
    
    .location-btn {
      bottom: 120px;
      right: 10px;
      width: 44px;
      height: 44px;
    }
    
    .location-icon {
      font-size: 20px;
    }
  }
  
  /* 滾動條樣式優化 */
  .search-results::-webkit-scrollbar,
  .map-info-wrapper::-webkit-scrollbar {
    width: 4px;
  }
  
  .search-results::-webkit-scrollbar-track,
  .map-info-wrapper::-webkit-scrollbar-track {
    background: #f1f1f1;
  }
  
  .search-results::-webkit-scrollbar-thumb,
  .map-info-wrapper::-webkit-scrollbar-thumb {
    background: #c1c1c1;
    border-radius: 2px;
  }
  
  .search-results::-webkit-scrollbar-thumb:hover,
  .map-info-wrapper::-webkit-scrollbar-thumb:hover {
    background: #a8a8a8;
  }
  
  /* 除錯資訊樣式 */
  .debug-info {
    padding: 20px;
    background-color: #f8f9fa;
    border-radius: 8px;
    margin: 10px;
  }
  
  .debug-info h3 {
    color: #dc3545;
    margin-bottom: 10px;
  }
  
  .debug-info p {
    color: #6c757d;
    margin-bottom: 10px;
  }
  
  .debug-info pre {
    background-color: #e9ecef;
    padding: 10px;
    border-radius: 4px;
    font-size: 12px;
    overflow-x: auto;
  }
  </style>