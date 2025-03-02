<!-- pages/map.vue -->
<template>
    <div class="map-container">
      <div class="control-bar">
        <div class="control-title">地标类别</div>
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
        <div class="control-options">
          <button 
            @click="toggleLabels"
            :class="{ active: showLabels }"
            class="option-btn"
          >
            {{ showLabels ? '隐藏标签' : '显示标签' }}
          </button>
        </div>
      </div>
      <div id="map" ref="mapRef"></div>
      <button class="location-btn" @click="getCurrentLocation">
        <span class="location-icon">📍</span>
      </button>
    </div>
  </template>
  
  <script setup>
  import { ref, onMounted, reactive, computed } from 'vue';
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
  // 地图容器引用
  const mapRef = ref(null);
  let map = null;
  let markers = [];
  let userLocationMarker = null;
  
  // 标签显示控制
  const showLabels = ref(false);
  
  // 切换标签显示/隐藏
  const toggleLabels = () => {
    showLabels.value = !showLabels.value;
    updateMarkerLabels();
  };
  
  // 更新标记标签显示
  const updateMarkerLabels = () => {
    if (!window.google || !window.google.maps || !map) return;
    
    markers.forEach(marker => {
      if (marker instanceof google.maps.Marker && marker.getLabel) {
        const label = marker.getLabel();
        if (label) {
          // 始终显示表情符号，但根据showLabels控制标题显示
          marker.setLabel(label);
        }
      }
      
      // 根据标签显示设置显示或隐藏标题覆盖层
      if (marker instanceof TitleOverlay && marker.div) {
        marker.div.style.display = showLabels.value ? 'block' : 'none';
      }
    });
  };
  
  // 地标类别
  const categories = [
    { key: 'eat', name: '食', icon: '🍽️', color: '#FF5722' },
    { key: 'play', name: '樂', icon: '👕', color: '#2196F3' },
    { key: 'housing', name: '住', icon: '🏠', color: '#4CAF50' },
    { key: 'traffic', name: '行', icon: '🚗', color: '#FFC107' }
  ];
  
  // 活跃类别状态
  const activeCategoriesMap = reactive({
    eat: true,
    play: true,
    housing: true,
    traffic: true
  });
  
  // 切换类别显示/隐藏
  const toggleCategory = (category) => {
    activeCategoriesMap[category] = !activeCategoriesMap[category];
    updateMarkers();
  };
  
  // 更新标记
  const updateMarkers = () => {
    // 清除现有标记
    markers.forEach(marker => marker.setMap(null));
    markers = [];
    
    console.log(couponData.value, 'ddddddd', selectedCategory.value, couponObject.value);
    
    // 确保 Google Maps API 已加载
    if (!window.google || !window.google.maps) {
      console.error('Google Maps API 尚未加载');
      return;
    }
    
    // 添加符合当前活跃类别的标记
    if (couponData.value && Array.isArray(couponData.value)) {
      couponData.value.forEach(landmark => {
        // 检查位置对象是否有效
        if (!landmark.position || typeof landmark.position.lat !== 'number' || typeof landmark.position.lng !== 'number') {
          console.error('无效的位置对象:', landmark);
          return; // 跳过这个地标
        }
        
        // 获取类别对象，如果找不到则尝试使用默认类别
        const categoryKey = landmark.category || '';
        const categoryObj = categories.find(cat => cat.key === categoryKey);
        
        // 只要该类别被激活就显示标记
        if (categoryObj && activeCategoriesMap[categoryObj.key]) {
          // 创建标记
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
              fontSize: '16px', // 始终显示表情符号
              fontWeight: 'bold'
            },
            zIndex: 1
          });
          
          markers.push(marker);
          
          // 添加标题标签
          if (landmark.title) { // 创建标题覆盖层，但根据showLabels控制显示
            // 创建自定义标题覆盖层
            const titleOverlay = new TitleOverlay(
              new google.maps.LatLng(
                parseFloat(landmark.position.lat),
                parseFloat(landmark.position.lng)
              ),
              landmark.title,
              map
            );
            
            // 根据当前标签显示设置控制可见性
            if (titleOverlay.div) {
              titleOverlay.div.style.display = showLabels.value ? 'block' : 'none';
            }
            
            markers.push(titleOverlay);
          }
        }
      });
    } else {
      console.error('couponData.value is not an array:', couponData.value);
    }
  };
  
  // 自定义标题覆盖层类
  let TitleOverlay;
  
  // 初始化 TitleOverlay 类
  const initTitleOverlay = () => {
    if (!window.google || !window.google.maps) {
      console.error('Google Maps API 尚未加载，无法初始化 TitleOverlay');
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
        div.style.pointerEvents = 'none'; // 允许点击穿透
        div.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.3)';
        div.innerHTML = this.title;
        
        this.div = div;
        const panes = this.getPanes();
        panes.overlayLayer.appendChild(div);
      }
      
      draw() {
        if (!this.div) return;
        
        const overlayProjection = this.getProjection();
        const position = overlayProjection.fromLatLngToDivPixel(this.position);
        
        // 将标题定位在标记上方
        this.div.style.left = (position.x - this.div.offsetWidth / 2) + 'px';
        this.div.style.top = (position.y - 40) + 'px'; // 上移40像素
      }
      
      onRemove() {
        if (this.div) {
          this.div.parentNode.removeChild(this.div);
          this.div = null;
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
  
  // 获取当前位置
  const getCurrentLocation = () => {
    // 确保 Google Maps API 已加载
    if (!window.google || !window.google.maps) {
      console.error('Google Maps API 尚未加载');
      alert('地图尚未完全加载，请稍后再试。');
      return;
    }
    
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const userLocation = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
          
          // 移动地图到用户位置
          map.setCenter(userLocation);
          map.setZoom(16);
          
          // 如果已有用户位置标记，则移除
          if (userLocationMarker) {
            userLocationMarker.setMap(null);
          }
          
          // 添加用户位置标记
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
            zIndex: 1000 // 确保用户位置标记显示在最上层
          });
        },
        (error) => {
          console.error('获取位置失败:', error);
          alert('无法获取您的位置，请确保已授予位置权限。');
        },
        {
          enableHighAccuracy: true,
          timeout: 5000,
          maximumAge: 0
        }
      );
    } else {
      alert('您的浏览器不支持地理位置功能。');
    }
  };
  
  // 异步加载Google Maps API
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
  
  // 初始化地图
  const initMap = () => {
    // 确保 Google Maps API 已加载
    if (!window.google || !window.google.maps) {
      console.error('Google Maps API 尚未加载，无法初始化地图');
      return;
    }
    
    // 默认位置（台北）
    const center = { lat: 24.677407, lng: 121.75371 };
    
    // 创建地图
    map = new google.maps.Map(mapRef.value, {
      center: center,
      zoom: 12,
      mapTypeControl: true,
      streetViewControl: true,
      fullscreenControl: true,
      gestureHandling: "greedy"
    });
    
    // 初始化 TitleOverlay 类
    initTitleOverlay();
    
    // 初始化标记
    updateMarkers();
    
    // 添加缩放事件监听器
    map.addListener('zoom_changed', () => {
      const zoom = map.getZoom();
      
      // 根据缩放级别调整标记大小，但不影响可见性
      markers.forEach(marker => {
        if (marker instanceof google.maps.Marker) {
          // 根据缩放级别调整标记大小
          if (marker.getIcon) {
            const icon = marker.getIcon();
            if (icon && icon.scale) {
              const newScale = 10 + (zoom / 3); // 根据缩放级别调整大小
              icon.scale = newScale;
              marker.setIcon(icon);
            }
          }
        }
      });
    });
  };
  
  // 组件挂载后初始化
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
    height: calc(100vh - 68px);
  }
  
  #map {
    width: 100%;
    height: 100%;
  }
  
  .control-bar {
    position: absolute;
    top: 10px;
    left: 10px;
    z-index: 10;
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
  </style>