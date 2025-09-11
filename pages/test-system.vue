<template>
  <div class="test-page">
    <h1>🧪 行程規劃系統測試頁面</h1>
    
    <div class="test-section">
      <h2>📊 系統狀態</h2>
      <div class="status-grid">
        <div class="status-item">
          <span class="status-label">資料庫連線：</span>
          <span :class="['status-value', dbStatus.success ? 'success' : 'error']">
            {{ dbStatus.success ? '✅ 正常' : '❌ 失敗' }}
          </span>
        </div>
        
        <div class="status-item">
          <span class="status-label">Google Maps API：</span>
          <span :class="['status-value', googleMapsStatus.success ? 'success' : 'error']">
            {{ googleMapsStatus.success ? '✅ 正常' : '❌ 失敗' }}
          </span>
        </div>
        
        <div class="status-item">
          <span class="status-label">地點分類數量：</span>
          <span class="status-value">{{ categories.length }} 個</span>
        </div>
        
        <div class="status-item">
          <span class="status-label">地點總數：</span>
          <span class="status-value">{{ places.length }} 個</span>
        </div>
      </div>
    </div>

    <div class="test-section">
      <h2>🗃️ 分類資料</h2>
      <div v-if="categories.length > 0" class="categories-grid">
        <div v-for="category in categories" :key="category.id" class="category-card">
          <Icon :name="category.icon" :style="{ color: category.color }" />
          <span>{{ category.name }}</span>
          <small>({{ category.place_count || 0 }} 個地點)</small>
        </div>
      </div>
      <div v-else class="empty-state">
        <p>📋 正在載入分類資料...</p>
      </div>
    </div>

    <div class="test-section">
      <h2>🔧 功能測試</h2>
      <div class="test-buttons">
        <button @click="testGoogleMaps" class="test-btn" :disabled="testingGoogleMaps">
          <Icon name="mdi:map-search" />
          {{ testingGoogleMaps ? '測試中...' : '測試 Google Maps API' }}
        </button>
        
        <button @click="testDatabase" class="test-btn" :disabled="testingDatabase">
          <Icon name="mdi:database" />
          {{ testingDatabase ? '測試中...' : '測試資料庫連線' }}
        </button>
      </div>
    </div>

    <div class="test-section">
      <h2>🚀 快速連結</h2>
      <div class="quick-links">
        <NuxtLink to="/admin/places" class="quick-link">
          <Icon name="mdi:cog" />
          管理員介面
        </NuxtLink>
        
        <NuxtLink to="/itinerary" class="quick-link">
          <Icon name="mdi:calendar" />
          行程規劃
        </NuxtLink>
      </div>
    </div>

    <div v-if="testResults.length > 0" class="test-section">
      <h2>📝 測試結果</h2>
      <div class="test-results">
        <div v-for="(result, index) in testResults" :key="index" :class="['test-result', result.success ? 'success' : 'error']">
          <Icon :name="result.success ? 'mdi:check-circle' : 'mdi:alert-circle'" />
          <span>{{ result.message }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';

// SEO 設定
useHead({
  title: '系統測試 - 行程規劃',
  meta: [
    { name: 'robots', content: 'noindex, nofollow' }
  ]
});

// 狀態管理
const dbStatus = ref({ success: false, message: '' });
const googleMapsStatus = ref({ success: false, message: '' });
const categories = ref([]);
const places = ref([]);
const testResults = ref([]);
const testingGoogleMaps = ref(false);
const testingDatabase = ref(false);

// 載入分類資料
async function loadCategories() {
  try {
    const response = await $fetch('/api/place-categories');
    if (response.success) {
      categories.value = response.data;
      dbStatus.value = { success: true, message: '資料庫連線正常' };
    }
  } catch (error) {
    console.error('載入分類失敗:', error);
    dbStatus.value = { success: false, message: error.message || '載入分類失敗' };
  }
}

// 測試 Google Maps API
async function testGoogleMaps() {
  testingGoogleMaps.value = true;
  try {
    const response = await $fetch('/api/google/places/search', {
      method: 'POST',
      body: {
        query: '宜蘭羅東夜市',
        location: '24.6777,121.7730'
      }
    });
    
    if (response.success) {
      googleMapsStatus.value = { success: true, message: 'Google Maps API 正常' };
      testResults.value.push({
        success: true,
        message: `Google Maps API 測試成功 - 找到 ${response.data.length} 個結果`
      });
    }
  } catch (error) {
    console.error('Google Maps API 測試失敗:', error);
    googleMapsStatus.value = { success: false, message: error.message || 'API 測試失敗' };
    testResults.value.push({
      success: false,
      message: `Google Maps API 測試失敗: ${error.message}`
    });
  } finally {
    testingGoogleMaps.value = false;
  }
}

// 測試資料庫連線
async function testDatabase() {
  testingDatabase.value = true;
  try {
    await loadCategories();
    testResults.value.push({
      success: true,
      message: `資料庫連線成功 - 載入了 ${categories.value.length} 個分類`
    });
  } catch (error) {
    testResults.value.push({
      success: false,
      message: `資料庫連線失敗: ${error.message}`
    });
  } finally {
    testingDatabase.value = false;
  }
}

// 初始化
onMounted(async () => {
  await loadCategories();
});
</script>

<style scoped>
.test-page {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
}

.test-section {
  background: white;
  border-radius: 12px;
  padding: 24px;
  margin-bottom: 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.test-section h1 {
  color: #2d3748;
  margin-bottom: 32px;
  text-align: center;
}

.test-section h2 {
  color: #4a5568;
  margin-bottom: 16px;
  font-size: 1.25rem;
}

.status-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 16px;
}

.status-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: #f7fafc;
  border-radius: 8px;
}

.status-label {
  font-weight: 500;
  color: #4a5568;
}

.status-value {
  font-weight: 600;
}

.status-value.success {
  color: #38a169;
}

.status-value.error {
  color: #e53e3e;
}

.categories-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 12px;
}

.category-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 16px;
  background: #f7fafc;
  border-radius: 8px;
  text-align: center;
  font-size: 0.875rem;
}

.category-card .icon {
  font-size: 24px;
  margin-bottom: 8px;
}

.test-buttons {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.test-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 20px;
  background: #4299e1;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 500;
  transition: background-color 0.2s;
}

.test-btn:hover:not(:disabled) {
  background: #3182ce;
}

.test-btn:disabled {
  background: #a0aec0;
  cursor: not-allowed;
}

.quick-links {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.quick-link {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 20px;
  background: #38a169;
  color: white;
  text-decoration: none;
  border-radius: 8px;
  font-weight: 500;
  transition: background-color 0.2s;
}

.quick-link:hover {
  background: #2f855a;
}

.test-results {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.test-result {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  border-radius: 8px;
  margin-bottom: 8px;
}

.test-result.success {
  background: #f0fff4;
  color: #2f855a;
  border-left: 4px solid #38a169;
}

.test-result.error {
  background: #fed7d7;
  color: #c53030;
  border-left: 4px solid #e53e3e;
}

.empty-state {
  text-align: center;
  padding: 40px;
  color: #718096;
}

@media (max-width: 768px) {
  .test-page {
    padding: 12px;
  }
  
  .test-section {
    padding: 16px;
  }
  
  .status-grid {
    grid-template-columns: 1fr;
  }
}
</style>
