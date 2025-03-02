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
      </div>
      <div id="map" ref="mapRef"></div>
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
  
  // 地标类别
  const categories = [
    { key: 'eat', name: '食', icon: '🍽️', color: '#FF5722' },
    { key: 'play', name: '樂', icon: '👕', color: '#2196F3' },
    { key: 'housing', name: '住', icon: '🏠', color: '#4CAF50' },
    { key: 'traffic', name: '行', icon: '🚗', color: '#FFC107' }
  ];
  
  // 示例地标数据
  const landmarks = [
    { id: 1, name: '美食广场', category: 'food', position: { lat: 25.033, lng: 121.565 } },
    { id: 2, name: '高级餐厅', category: 'food', position: { lat: 25.036, lng: 121.56 } },
    { id: 3, name: '购物中心', category: 'clothing', position: { lat: 25.035, lng: 121.568 } },
    { id: 4, name: '精品服装店', category: 'clothing', position: { lat: 25.032, lng: 121.563 } },
    { id: 5, name: '豪华公寓', category: 'housing', position: { lat: 25.037, lng: 121.566 } },
    { id: 6, name: '住宅区', category: 'housing', position: { lat: 25.031, lng: 121.57 } },
    { id: 7, name: '地铁站', category: 'transport', position: { lat: 25.034, lng: 121.562 } },
    { id: 8, name: '公车站', category: 'transport', position: { lat: 25.038, lng: 121.564 } }
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
    selectedCategory.value = category;
    updateMarkers();
  };
  
  // 更新标记
  const updateMarkers = () => {
    // 清除现有标记
    markers.forEach(marker => marker.setMap(null));
    markers = [];
    
    console.log(couponData.value, 'ddddddd', selectedCategory.value, couponObject.value);
    
    // 添加符合当前活跃类别的标记
    if (couponData.value && Array.isArray(couponData.value)) {
      couponData.value.forEach(landmark => {
        const categoryObj = categories.find(cat => cat.key === landmark.category);
        
        // 只有当该类别被激活时才显示标记
        if (categoryObj && activeCategoriesMap[landmark.category]) {
          const marker = new google.maps.Marker({
            position: landmark.position,
            map: map,
            title: landmark.title,
            label: categoryObj.icon,
            icon: {
              path: google.maps.SymbolPath.CIRCLE,
              fillColor: categoryObj.color,
              fillOpacity: 0.7,
              strokeWeight: 1,
              strokeColor: '#FFFFFF',
              scale: 14
            }
          });
          
          // 添加信息窗口
          const categoryName = categoryObj ? categoryObj.name : landmark.category;
          const infoWindow = new google.maps.InfoWindow({
            content: `<div><strong>${landmark.title}</strong><br>類別:${categoryName}</div>`
          });
          
          marker.addListener('click', () => {
            infoWindow.open(map, marker);
          });
          
          markers.push(marker);
        }
      });
    } else {
      console.error('couponData.value is not an array:', couponData.value);
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
    
    // 初始化标记
    updateMarkers();
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
    height: 100vh;
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
  }
  
  .category-btn {
    padding: 8px 12px;
    border: 1px solid #ddd;
    border-radius: 4px;
    background-color: white;
    cursor: pointer;
    transition: all 0.2s;
  }
  
  .category-btn.active {
    background-color: #4285F4;
    color: white;
    border-color: #4285F4;
  }
  
  .category-btn:hover {
    background-color: #f1f1f1;
  }
  
  .category-btn.active:hover {
    background-color: #3367D6;
  }
  </style>