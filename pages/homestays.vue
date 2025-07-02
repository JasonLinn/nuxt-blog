<template>
  <div class="bg-gradient-to-br from-green-50 to-blue-50 min-h-screen">
    <!-- 頁面標題 -->
    <div class="bg-white shadow-lg">
      <div class="max-w-6xl mx-auto px-4 py-8">
        <h1 class="text-4xl font-bold text-gray-800 mb-2">宜蘭精選民宿</h1>
        <p class="text-gray-600">體驗最道地的宜蘭民宿住宿，與自然共生的美好時光</p>
      </div>
    </div>

    <div class="max-w-6xl mx-auto px-4 py-8">
      <!-- 篩選器 -->
      <div class="bg-white rounded-xl shadow-lg p-6 mb-8">
        <h2 class="text-lg font-semibold text-gray-700 mb-4 flex items-center">
          <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4"></path>
          </svg>
          篩選條件
        </h2>
        <div class="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">鄉鎮地區</label>
            <select v-model="filters.location" 
                    class="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-transparent">
              <option value="">全部地區</option>
              <option value="三星鄉">三星鄉</option>
              <option value="冬山鄉">冬山鄉</option>
              <option value="五結鄉">五結鄉</option>
              <option value="頭城鎮">頭城鎮</option>
              <option value="礁溪鄉">礁溪鄉</option>
            </select>
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">民宿類型</label>
            <select v-model="filters.type"
                    class="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-transparent">
              <option value="">全部類型</option>
              <option value="自然景觀型">自然景觀型</option>
              <option value="都市便利型">都市便利型</option>
              <option value="秘境隱居型">秘境隱居型</option>
            </select>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">排序方式</label>
            <select v-model="filters.sort_by"
                    class="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-transparent">
              <option value="rating">評分高低</option>
              <option value="price">價格高低</option>
              <option value="reviews">評論數量</option>
              <option value="name">名稱</option>
            </select>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">住宿形式</label>
            <select v-model="filters.is_package"
                    class="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-transparent">
              <option value="">全部</option>
              <option value="false">房間住宿</option>
              <option value="true">包棟住宿</option>
            </select>
          </div>

          <div class="flex items-center">
            <label class="flex items-center cursor-pointer">
              <input type="checkbox" v-model="filters.featured_only"
                     class="rounded border-gray-300 text-green-600 focus:ring-green-500">
              <span class="ml-2 text-sm font-medium text-gray-700">只顯示精選</span>
            </label>
          </div>
        </div>
      </div>

      <!-- 載入狀態 -->
      <div v-if="loading" class="text-center py-16">
        <div class="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
        <p class="mt-4 text-gray-600">載入宜蘭民宿資料中...</p>
      </div>

      <!-- 錯誤訊息 -->
      <div v-else-if="error" class="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
        <svg class="w-12 h-12 text-red-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
        </svg>
        <h3 class="text-lg font-medium text-red-800 mb-2">載入失敗</h3>
        <p class="text-red-600">{{ error }}</p>
        <button @click="fetchHomestays" class="mt-4 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors">
          重新載入
        </button>
      </div>

      <!-- 民宿列表 -->
      <div v-else-if="homestays.length > 0">
        <div class="flex justify-between items-center mb-6">
          <p class="text-gray-600">共找到 <span class="font-semibold text-green-600">{{ homestays.length }}</span> 間民宿</p>
          <div class="text-sm text-gray-500">
            資料來源：{{ databaseInfo.project || '宜蘭民宿真實資料庫' }}
          </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div v-for="homestay in homestays" :key="homestay.id" 
               class="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
            
            <!-- 民宿圖片 -->
            <div class="relative h-48 overflow-hidden">
              <img :src="homestay.image_url" :alt="homestay.name"
                   class="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                   @error="handleImageError"
                   loading="lazy">
              
              <!-- 精選標籤 -->
              <div v-if="homestay.featured" 
                   class="absolute top-3 left-3 bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-3 py-1 rounded-full text-xs font-medium flex items-center">
                <svg class="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path>
                </svg>
                精選
              </div>

              <!-- 評分標籤 -->
              <div class="absolute top-3 right-3 bg-white/90 backdrop-blur-sm rounded-lg px-2 py-1 flex items-center">
                <svg class="w-4 h-4 text-yellow-400 mr-1" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path>
                </svg>
                <span class="text-sm font-medium text-gray-700">{{ homestay.rating }}</span>
              </div>
            </div>

            <!-- 民宿資訊 -->
            <div class="p-6">
              <div class="flex justify-between items-start mb-3">
                <h3 class="text-lg font-bold text-gray-800 line-clamp-1">{{ homestay.name }}</h3>
                <span class="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full whitespace-nowrap">{{ homestay.location }}</span>
              </div>

              <!-- 民宿類型 -->
              <div class="flex flex-wrap gap-1 mb-3">
                <span v-for="type in homestay.types" :key="type"
                      class="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                  {{ type }}
                </span>
              </div>

              <!-- 容量描述 -->
              <p class="text-sm text-gray-600 mb-4 line-clamp-2">
                {{ homestay.capacity_description }}
              </p>

              <!-- 價格資訊 -->
              <div class="space-y-2 mb-4">
                <div class="flex justify-between items-center">
                  <span class="text-sm text-gray-500">價格範圍</span>
                  <span class="font-bold text-green-600">
                    NT$ {{ formatPrice(homestay.min_price) }} - {{ formatPrice(homestay.max_price) }}
                  </span>
                </div>
                <div v-if="homestay.pricing_options && homestay.pricing_options.length > 0" class="text-xs text-gray-500">
                  共有 {{ homestay.pricing_options.length }} 種住宿選項
                </div>
              </div>

              <!-- 評論資訊 -->
              <div class="flex justify-between items-center mb-4">
                <div class="flex items-center text-sm text-gray-600">
                  <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-3.582 8-8 8a8.955 8.955 0 01-4.126-.98L3 20l1.98-5.126A8.955 8.955 0 013 12a8 8 0 018-8 8 8 0 018 8z"></path>
                  </svg>
                  {{ homestay.total_reviews }} 則評論
                </div>
                <div class="flex items-center text-sm text-gray-600">
                  <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>
                  </svg>
                  {{ homestay.view_count }} 次查看
                </div>
              </div>

              <!-- 操作按鈕 -->
              <div class="flex gap-2">
                <a v-if="homestay.website" :href="homestay.website" target="_blank"
                   class="flex-1 bg-green-600 text-white text-center py-2 px-3 rounded-lg hover:bg-green-700 transition-colors text-sm font-medium">
                  查看詳情
                </a>
                <button @click="callHomestay(homestay.phone)" 
                        class="flex-1 bg-blue-600 text-white py-2 px-3 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium">
                  立即電話
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 無結果狀態 -->
      <div v-else class="text-center py-16">
        <svg class="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path>
        </svg>
        <h3 class="text-lg font-medium text-gray-500 mb-2">沒有找到符合條件的民宿</h3>
        <p class="text-gray-400">請嘗試調整篩選條件</p>
      </div>
    </div>
  </div>
</template>

<script setup>
// 頁面設定
useHead({
  title: '宜蘭精選民宿 | 體驗最道地的住宿體驗',
  meta: [
    { name: 'description', content: '精選宜蘭優質民宿，提供自然景觀、秘境隱居等多種住宿選擇，享受最道地的宜蘭民宿體驗。' },
    { name: 'keywords', content: '宜蘭民宿,宜蘭住宿,三星民宿,冬山民宿,五結民宿,包棟民宿' }
  ]
});

// 響應式數據
const homestays = ref([]);
const loading = ref(true);
const error = ref(null);
const databaseInfo = ref({});

// 篩選器
const filters = ref({
  location: '',
  type: '',
  sort_by: 'rating',
  order: 'desc',
  featured_only: false,
  is_package: '',
  limit: 20
});

// 載入民宿資料
const fetchHomestays = async () => {
  loading.value = true;
  error.value = null;
  
  try {
    const queryParams = new URLSearchParams();
    
    Object.keys(filters.value).forEach(key => {
      if (filters.value[key] !== '' && filters.value[key] !== false) {
        queryParams.append(key, filters.value[key]);
      }
    });
    
    const data = await $fetch(`/api/fetchBnbs?${queryParams.toString()}`);
    
    if (data.success) {
      homestays.value = data.homestays;
      databaseInfo.value = data.database_info || {};
    } else {
      throw new Error(data.error || '獲取資料失敗');
    }
  } catch (err) {
    error.value = err.message || '載入民宿資料時發生錯誤';
    console.error('載入民宿資料錯誤:', err);
  } finally {
    loading.value = false;
  }
};

// 防抖處理：延遲執行搜尋以避免頻繁 API 請求
let debounceTimer = null;
const debouncedFetchHomestays = () => {
  if (debounceTimer) {
    clearTimeout(debounceTimer);
  }
  debounceTimer = setTimeout(() => {
    fetchHomestays();
  }, 300);
};

// 格式化價格 - 簡化為普通函數
const formatPrice = (price) => {
  if (!price) return '0';
  return new Intl.NumberFormat('zh-TW').format(price);
};

// 處理圖片載入錯誤
const handleImageError = (event) => {
  event.target.src = '/images/homestay-placeholder.jpg';
  // 避免重複載入失敗
  event.target.onerror = null;
};

// 電話聯絡
const callHomestay = (phone) => {
  if (phone) {
    window.open(`tel:${phone}`);
  }
};

// 監聽篩選器變化，使用防抖
watch(filters, () => {
  debouncedFetchHomestays();
}, { deep: true });

// 頁面載入時獲取資料
onMounted(() => {
  fetchHomestays();
});
</script>

<style scoped>
/* 文字截斷樣式 */
.line-clamp-1 {
  display: -webkit-box;
  -webkit-line-clamp: 1;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

/* 卡片陰影動畫 */
@media (hover: hover) {
  .hover\:shadow-xl:hover {
    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
  }
}
</style>