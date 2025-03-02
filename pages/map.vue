<!-- pages/map.vue -->
<template>
    <div class="map-container">
      <div class="control-bar">
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
            @input="handleSearch" 
            placeholder="搜尋地點..." 
            class="search-input"
          />
          <div v-if="searchResults.length > 0" class="search-results">
            <div 
              v-for="(result, index) in searchResults" 
              :key="index" 
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
      <button class="location-btn" @click="getCurrentLocation">
        <span class="location-icon">📍</span>
      </button>
      
      <!-- 地標資訊面板 -->
      <div class="map-info-panel" :class="{ 'map-info-panel-open': isInfoPanelOpen }">
        <div class="map-info-toggle" @click="isInfoPanelOpen = !isInfoPanelOpen">
          <Icon name="ri:arrow-up-s-line" class="map-toggle" :class="{ 'arrow-upside': isInfoPanelOpen }" />
        </div>
        <div class="map-info-wrapper" v-if="selectedCoupon && selectedCoupon.id">
          <CouponInfo :couponId="selectedCoupon.id" :key="selectedCoupon.id"></CouponInfo>
        </div>
      </div>
    </div>
  </template>
  
  <script setup>
  import { ref, onMounted, reactive, computed, watch } from 'vue';
  import useCouponMapStore from "~~/store/couponMap";

    const store = useCouponMapStore();
    const couponObject = computed(() => store.getCouponData);
    const selectedCategory = ref(null);
    const couponData = computed(() => {
      if (!couponObject.value?.data?.items) return [];
      return selectedCategory.value 
        ? couponObject.value.data.items.filter((i) => i.category === selectedCategory.value) 
        : couponObject.value.data.items;
    });
    
    if (!couponData.value?.length){
        store.fetchAndSetCoupon({pageSize: 150});
    }
  // 地標資訊面板控制
  const isInfoPanelOpen = ref(false);
  const selectedCoupon = ref(null);
  
  // 地图容器引用
  const mapRef = ref(null);
  let map = null;
  let markers = [];
  let userLocationMarker = null;
  
  // 標籤顯示控制
  const showLabels = ref(false);
  
  // 搜尋功能
  const searchQuery = ref('');
  const searchResults = ref([]);
  
  // 處理搜尋
  const handleSearch = () => {
    if (!searchQuery.value.trim()) {
      searchResults.value = [];
      return;
    }
    
    if (!couponData.value || !Array.isArray(couponData.value)) {
      return;
    }
    
    // 過濾符合搜尋條件的地點
    const query = searchQuery.value.toLowerCase().trim();
    searchResults.value = couponData.value
      .filter(item => {
        // 搜尋標題
        const titleMatch = item.title && item.title.toLowerCase().includes(query);
        
        // 搜尋內容 (content)
        const contentMatch = item.content && item.content.toLowerCase().includes(query);
        
        // 搜尋描述 (description)
        const descriptionMatch = item.description && item.description.toLowerCase().includes(query);
        
        // 只要任一欄位符合即可
        return titleMatch || contentMatch || descriptionMatch;
      })
      .slice(0, 5); // 限制最多顯示5個結果
  };
  
  // 導航到選擇的位置
  const navigateToLocation = (location) => {
    if (!map || !location.position) return;
    
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
    
    // 顯示地標資訊
    showCouponInfo(location);
  };
  
  // 顯示地標資訊
  const showCouponInfo = (coupon) => {
    selectedCoupon.value = coupon;
    isInfoPanelOpen.value = true;
  };
  
  // 高亮顯示選中的標記
  const highlightMarker = (location) => {
    // 不再調用 updateMarkers()，避免重新刷新所有標記
    
    // 找到對應的標記並高亮顯示
    markers.forEach(marker => {
      if (marker instanceof google.maps.Marker && 
          marker.getPosition && 
          marker.getPosition().lat() === parseFloat(location.position.lat) && 
          marker.getPosition().lng() === parseFloat(location.position.lng)) {
        
        // 臨時放大標記
        const icon = marker.getIcon();
        if (icon && icon.scale) {
          const originalScale = icon.scale;
          icon.scale = originalScale * 1.5;
          marker.setIcon(icon);
          
          // 2秒後恢復原始大小
          setTimeout(() => {
            icon.scale = originalScale;
            marker.setIcon(icon);
          }, 2000);
        }
        
        // 如果標籤未顯示，臨時顯示此標記的標題
        if (!showLabels.value) {
          // 找到對應的標題覆蓋層
          const titleOverlay = markers.find(m => 
            m instanceof TitleOverlay && 
            m.position.lat() === parseFloat(location.position.lat) && 
            m.position.lng() === parseFloat(location.position.lng)
          );
          
          if (titleOverlay) {
            // 臨時顯示標題
            titleOverlay.show();
            
            // 3秒後隱藏
            setTimeout(() => {
              titleOverlay.hide();
            }, 3000);
          }
        }
      }
    });
  };
  
  // 切換標籤顯示/隱藏
  const toggleLabels = () => {
    showLabels.value = !showLabels.value;
    updateMarkerLabels();
  };
  
  // 更新標記標籤顯示
  const updateMarkerLabels = () => {
    if (!window.google || !window.google.maps || !map) return;
    
    markers.forEach(marker => {
      if (marker instanceof google.maps.Marker && marker.getLabel) {
        const label = marker.getLabel();
        if (label) {
          // 始終顯示表情符號，但根據showLabels控制標題顯示
          marker.setLabel(label);
        }
      }
      
      // 根據標籤顯示設置顯示或隱藏標題覆蓋層
      if (marker instanceof TitleOverlay) {
        marker.toggle(showLabels.value);
      }
    });
  };
  
  // 地標類別
  const categories = [
    { key: 'eat', name: '食', icon: '🍽️', color: '#FF5722' },
    { key: 'play', name: '樂', icon: '🎪', color: '#2196F3' },
    { key: 'housing', name: '住', icon: '🏠', color: '#4CAF50' },
    { key: 'traffic', name: '行', icon: '🚗', color: '#FFC107' }
  ];
  
  // 活躍類別狀態
  const activeCategoriesMap = reactive({
    eat: true,
    play: true,
    housing: true,
    traffic: true
  });
  
  // 切換類別顯示/隱藏
  const toggleCategory = (category) => {
    activeCategoriesMap[category] = !activeCategoriesMap[category];
    updateMarkers();
  };
  
  // 更新標記
  const updateMarkers = () => {
    // 清除現有標記
    markers.forEach(marker => marker.setMap(null));
    markers = [];

    // 確保 Google Maps API 已載入
    if (!window.google || !window.google.maps) {
      console.error('Google Maps API 尚未載入');
      return;
    }
    
    // 添加符合當前活躍類別的標記
    if (couponData.value && Array.isArray(couponData.value)) {
      couponData.value.forEach(landmark => {
        // 檢查位置對象是否有效
        if (!landmark.position || typeof landmark.position.lat !== 'number' || typeof landmark.position.lng !== 'number') {
          console.error('無效的位置對象:', landmark);
          return; // 跳過這個地標
        }
        
        // 獲取類別對象，如果找不到則嘗試使用默認類別
        const categoryKey = landmark.category || '';
        const categoryObj = categories.find(cat => cat.key === categoryKey);
        
        // 只要該類別被激活就顯示標記
        if (categoryObj && activeCategoriesMap[categoryObj.key]) {
          // 創建標記
          const marker = new google.maps.Marker({
            position: new google.maps.LatLng(
              parseFloat(landmark.position.lat),
              parseFloat(landmark.position.lng)
            ),
            map: map,
            title: landmark.title,
            icon: {
              path: google.maps.SymbolPath.CIRCLE,
              fillColor: categoryObj.color,
              fillOpacity: 0.7,
              strokeWeight: 1,
              strokeColor: '#FFFFFF',
              scale: 14
            },
            label: {
              text: categoryObj.icon,
              fontSize: '16px', // 始終顯示表情符號
              fontWeight: 'bold'
            },
            zIndex: 1
          });
          
          // 添加點擊事件
          marker.addListener('click', () => {
            showCouponInfo(landmark);
            highlightMarker(landmark);
          });
          
          markers.push(marker);
          
          // 添加標題標籤
          if (landmark.title) { // 創建標題覆蓋層，但根據showLabels控制顯示
            // 創建自定義標題覆蓋層
            const titleOverlay = new TitleOverlay(
              new google.maps.LatLng(
                parseFloat(landmark.position.lat),
                parseFloat(landmark.position.lng)
              ),
              landmark.title,
              map
            );
            
            // 根據當前標籤顯示設置控制可見性
            titleOverlay.toggle(showLabels.value);
            
            markers.push(titleOverlay);
          }
        }
      });
    } else {
      console.error('couponData.value 不是陣列:', couponData.value);
    }
  };
  
  // 自定義標題覆蓋層類
  let TitleOverlay;
  
  // 初始化 TitleOverlay 類
  const initTitleOverlay = () => {
    if (!window.google || !window.google.maps) {
      console.error('Google Maps API 尚未載入，無法初始化 TitleOverlay');
      return;
    }
    
    TitleOverlay = class extends google.maps.OverlayView {
      constructor(position, title, map) {
        super();
        this.position = position;
        this.title = title;
        this.map = map;
        this.div = null;
        this.setMap(map);
      }
      
      onAdd() {
        // 創建標題容器
        const div = document.createElement('div');
        div.style.position = 'absolute';
        div.style.backgroundColor = 'rgba(0, 0, 0, 0.6)';
        div.style.color = 'white';
        div.style.fontWeight = 'bold';
        div.style.fontSize = '12px';
        div.style.padding = '3px 8px';
        div.style.borderRadius = '4px';
        div.style.textAlign = 'center';
        div.style.minWidth = '80px';
        div.style.maxWidth = '150px';
        div.style.overflow = 'hidden';
        div.style.textOverflow = 'ellipsis';
        div.style.whiteSpace = 'nowrap';
        div.style.pointerEvents = 'none'; // 允許點擊穿透
        div.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.3)';
        div.style.transform = 'translate(-50%, -100%)'; // 使用 transform 進行居中和上移
        div.style.marginTop = '-10px'; // 額外的上方間距
        div.innerHTML = this.title;
        
        // 初始時根據 showLabels 設置顯示狀態
        div.style.display = showLabels.value ? 'block' : 'none';
        
        this.div = div;
        
        // 將元素添加到覆蓋層窗格
        const panes = this.getPanes();
        panes.overlayMouseTarget.appendChild(div);
      }
      
      draw() {
        if (!this.div) return;
        
        // 獲取投影
        const overlayProjection = this.getProjection();
        if (!overlayProjection) return;
        
        // 將地理坐標轉換為像素坐標
        const position = overlayProjection.fromLatLngToDivPixel(this.position);
        if (!position) return;
        
        // 使用絕對定位設置標題位置
        this.div.style.left = position.x + 'px';
        this.div.style.top = position.y + 'px';
      }
      
      onRemove() {
        if (this.div) {
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
      
      setMap(map) {
        if (map === null) {
          this.onRemove();
        }
        super.setMap(map);
      }
    };
  };
  
  // 獲取當前位置
  const getCurrentLocation = () => {
    // 確保 Google Maps API 已載入
    if (!window.google || !window.google.maps) {
      console.error('Google Maps API 尚未載入');
      alert('地圖尚未完全載入，請稍後再試。');
      return;
    }
    
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const userLocation = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
          
          // 移動地圖到用戶位置
          map.setCenter(userLocation);
          map.setZoom(16);
          
          // 如果已有用戶位置標記，則移除
          if (userLocationMarker) {
            userLocationMarker.setMap(null);
          }
          
          // 添加用戶位置標記
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
            zIndex: 1000 // 確保用戶位置標記顯示在最上層
          });
        },
        (error) => {
          console.error('獲取位置失敗:', error);
          alert('無法獲取您的位置，請確保已授予位置權限。');
        },
        {
          enableHighAccuracy: true,
          timeout: 5000,
          maximumAge: 0
        }
      );
    } else {
      alert('您的瀏覽器不支援地理位置功能。');
    }
  };
  
  // 異步載入Google Maps API
  const loadGoogleMapsApi = () => {
    return new Promise((resolve, reject) => {
      if (window.google && window.google.maps) {
        resolve();
        return;
      }
      
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=AIzaSyD7HWVfZa4Tq-IGp0SsaCOanE4wtux-T74&callback=initGoogleMaps`;
      script.async = true;
      script.defer = true;
      
      window.initGoogleMaps = () => {
        resolve();
      };
      
      script.onerror = (error) => {
        reject(new Error('Google Maps API failed to load'));
      };
      
      document.head.appendChild(script);
    });
  };
  
  // 初始化地圖
  const initMap = () => {
    // 確保 Google Maps API 已載入
    if (!window.google || !window.google.maps) {
      console.error('Google Maps API 尚未載入，無法初始化地圖');
      return;
    }
    
    // 默認位置（宜蘭）
    const center = { lat: 24.677407, lng: 121.75371 };
    
    // 創建地圖
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
          stylers: [
            {
              visibility: 'off'
            }
          ]
        },
        {
          featureType: 'poi',
          elementType: 'labels.text',
          stylers: [
            {
              visibility: 'off'
            }
          ]
        },
        {
          featureType: 'poi.business',
          stylers: [
            {
              visibility: 'off'
            }
          ]
        },
        {
          featureType: 'poi.park',
          elementType: 'labels.text',
          stylers: [
            {
              visibility: 'off'
            }
          ]
        },
        {
          featureType: 'road.arterial',
          elementType: 'labels',
          stylers: [
            {
              visibility: 'off'
            }
          ]
        },
        {
          featureType: 'road.highway',
          elementType: 'labels',
          stylers: [
            {
              visibility: 'off'
            }
          ]
        },
        {
          featureType: 'road.local',
          stylers: [
            {
              visibility: 'off'
            }
          ]
        },
        {
          featureType: 'road.local',
          elementType: 'labels',
          stylers: [
            {
              visibility: 'off'
            }
          ]
        }
      ]
    });
    
    // 初始化 TitleOverlay 類
    initTitleOverlay();
    
    // 初始化標記
    updateMarkers();
    
    // 確保所有標題覆蓋層在初始時都是隱藏的
    markers.forEach(marker => {
      if (marker instanceof TitleOverlay) {
        marker.hide();
      }
    });
    
    // 添加縮放事件監聽器
    map.addListener('zoom_changed', () => {
      const zoom = map.getZoom();
      
      // 根據縮放級別調整標記大小，但不影響可見性
      markers.forEach(marker => {
        if (marker instanceof google.maps.Marker) {
          // 根據縮放級別調整標記大小
          if (marker.getIcon) {
            const icon = marker.getIcon();
            if (icon && icon.scale) {
              const newScale = 10 + (zoom / 3); // 根據縮放級別調整大小
              icon.scale = newScale;
              marker.setIcon(icon);
            }
          }
        }
      });
    });
    
    // 添加地圖移動結束事件監聽器，確保標題位置正確更新
    map.addListener('idle', () => {
      // 觸發所有 TitleOverlay 的 draw 方法重新計算位置
      markers.forEach(marker => {
        if (marker instanceof TitleOverlay) {
          marker.draw();
        }
      });
    });
  };
  
  // 監聽 couponData 變化，當數據加載完成後更新標記
  watch(() => couponData.value, (newValue, oldValue) => {
    if (newValue && Array.isArray(newValue) && newValue.length > 0 && map) {
      console.log('couponData 已更新，重新加載標記');
      updateMarkers();
    }
  }, { deep: true });
  
  // 組件掛載後初始化
  onMounted(async () => {
    try {
      await loadGoogleMapsApi();
      initMap();
    } catch (error) {
      console.error('Failed to initialize Google Maps:', error);
    }
  });
  </script>
  
  <style scoped>
  .map-container {
    position: relative;
    width: 100%;
    height: calc(100vh - 70px);
  }
  
  #map {
    width: 100%;
    height: 100%;
  }
  
  .control-bar {
    position: absolute;
    top: 10px;
    left: 10px;
    z-index: 1;
    background-color: rgba(255, 255, 255, 0.9);
    padding: 10px;
    border-radius: 5px;
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);
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
  
  .category-btn:hover, .option-btn:hover {
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
    box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.1);
    transform: translateY(calc(100% - 30px));
    transition: transform 0.3s ease;
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
    background-color: #f9f9f9c7;
    border-radius: 12px 12px 0 0;
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
  </style>