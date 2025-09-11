<template>
  <div class="map-test-page">
    <h1>Google Maps Test</h1>
    <div id="test-map" style="width: 100%; height: 400px; background: #f0f0f0; border: 1px solid #ccc;"></div>
    <div class="debug-info">
      <p><strong>Google API 載入狀態:</strong> {{ googleApiStatus }}</p>
      <p><strong>API Key 設定:</strong> {{ apiKeySet }}</p>
      <p><strong>地圖元素存在:</strong> {{ mapElementExists }}</p>
      <p><strong>地圖實例:</strong> {{ mapInstanceCreated }}</p>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';

const googleApiStatus = ref('檢查中...');
const apiKeySet = ref('檢查中...');
const mapElementExists = ref('檢查中...');
const mapInstanceCreated = ref('檢查中...');

const config = useRuntimeConfig();

onMounted(() => {
  console.log('Map test page mounted');
  
  // 檢查 API Key
  apiKeySet.value = !!config.public.GOOGLE_MAPS_API_KEY ? '是' : '否';
  console.log('API Key set:', apiKeySet.value);
  
  // 檢查地圖元素
  const mapElement = document.getElementById('test-map');
  mapElementExists.value = !!mapElement ? '是' : '否';
  console.log('Map element exists:', mapElementExists.value);
  
  // 檢查 Google API
  if (typeof google !== 'undefined') {
    googleApiStatus.value = '已載入';
    initTestMap();
  } else {
    googleApiStatus.value = '未載入，等待中...';
    // 等待 Google Maps API 載入
    window.addEventListener('google-maps-loaded', () => {
      console.log('Google Maps loaded event received');
      googleApiStatus.value = '已載入';
      initTestMap();
    });
    
    // 設定超時
    setTimeout(() => {
      if (typeof google === 'undefined') {
        googleApiStatus.value = '載入失敗或超時';
      }
    }, 10000);
  }
});

const initTestMap = () => {
  console.log('Initializing test map...');
  try {
    const mapElement = document.getElementById('test-map');
    if (!mapElement) {
      throw new Error('Map element not found');
    }
    
    const map = new google.maps.Map(mapElement, {
      center: { lat: 24.7021, lng: 121.7378 },
      zoom: 13
    });
    
    mapInstanceCreated.value = '成功';
    console.log('Test map created successfully');
  } catch (error) {
    mapInstanceCreated.value = `失敗: ${error.message}`;
    console.error('Failed to create test map:', error);
  }
};
</script>

<style scoped>
.map-test-page {
  padding: 20px;
  max-width: 800px;
  margin: 0 auto;
}

.debug-info {
  margin-top: 20px;
  padding: 15px;
  background: #f8f9fa;
  border-radius: 8px;
  border: 1px solid #dee2e6;
}

.debug-info p {
  margin: 8px 0;
}
</style>
