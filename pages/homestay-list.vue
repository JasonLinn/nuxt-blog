<template>
  <div class="flex container">
    <!-- 搜尋控制區域 -->
    <div class="search-controls">
      <!-- 地區選擇 -->
      <div class="area-search-group">
        <label class="search-label">所在地區</label>
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

      <!-- 人數搜尋 -->
      <div class="people-search-group">
        <label class="search-label">入住人數</label>
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
      <label class="search-label">搜尋民宿</label>
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
    </div>
    <div class="col-12">
      <div class="tag-list">
        <h2 class="tag-title">
          熱門環境:
        </h2>
        <span class="hot-tag" v-for="tag in hotEnvironmentTypes" :key="tag" @click="clickTag">
          {{ tag }}
        </span>
      </div>
    </div>
    <div class="my-8 flex w-full max-w-4xl flex-col">
      <!-- 除錯資訊 - 暫時顯示 -->
      <div style="background: #f0f0f0; padding: 10px; margin: 10px 0; border-radius: 5px;">
        <strong>除錯資訊:</strong><br>
        loading: {{ loading }}<br>
        error: {{ error }}<br>
        bnbsData.length: {{ bnbsData.length }}<br>
        filteredBnbs.length: {{ filteredBnbs.length }}<br>
        paginatedBnbs.length: {{ paginatedBnbs.length }}
      </div>
      
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
            <div class="bnb-wrapper" @click.prevent.stop="navigateToBnb(bnb.id, $event)" style="cursor: pointer;">
              <div class="bnb-img-wrapper">
                <img
                  :alt="bnb.name"
                  height="165"
                  width="366"
                  :src="bnb.image_urls && bnb.image_urls.length > 0 ? bnb.image_urls[0] : '/images/bnb-placeholder.jpg'"
                  class="bnb-img"
                  placeholder-class="card"
                  style="pointer-events: none;"
                />
              </div>
              <div class="bnb-info" style="pointer-events: none;">
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
                  <span class="bnb-category">
                    {{ bnb.area }}
                  </span>
                  <!-- 人數範圍 -->
                  <span v-if="bnb.min_guests || bnb.max_guests" class="bnb-category bnb-people">
                    {{ getGuestRange(bnb) }}
                  </span>
                  <!-- 環境類型標籤 -->
                  <span v-for="envType in (bnb.features?.environmentTypes || []).slice(0, 2)" :key="envType" class="bnb-category bnb-environment">
                    {{ envType }}
                  </span>
                </div>
                
                <p class="index-bnb-text" v-if="bnb.description">
                  {{ bnb.description }}
                </p>
                
                <div class="price-info">
                  <div v-if="bnb.prices && bnb.prices.weekday">
                    <span class="price-label">平日價格:</span>
                    <span class="price-value">{{ bnb.prices.weekday }}</span>
                  </div>
                  <div v-if="bnb.prices && bnb.prices.weekend">
                    <span class="price-label">假日價格:</span>
                    <span class="price-value">{{ bnb.prices.weekend }}</span>
                  </div>
                  <!-- 包棟價格 -->
                  <div v-if="bnb.prices && (bnb.prices.fullRentWeekday || bnb.prices.fullRentWeekend)" class="package-price">
                    <span class="package-label">包棟方案</span>
                    <span v-if="bnb.prices.fullRentWeekday" class="package-value">平日 {{ bnb.prices.fullRentWeekday }}</span>
                    <span v-if="bnb.prices.fullRentWeekend" class="package-value">假日 {{ bnb.prices.fullRentWeekend }}</span>
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
import { ref, computed, onMounted, watch, nextTick } from 'vue';
import { navigateTo } from 'nuxt/app';
import useHomestayStore from '~/store/homestay.js';

// 使用 homestay store
const homestayStore = useHomestayStore();

const searchText = ref('');
const selectedArea = ref(null);
const guestCount = ref(null);
const currentPage = ref(1);
const itemsPerPage = 8;

// 從store獲取資料
const bnbsData = computed(() => homestayStore.getAllHomestays);
const loading = computed(() => homestayStore.getLoading);
const error = computed(() => homestayStore.getError);

// 熱門環境標籤 - 更新為與新資料庫匹配
const hotEnvironmentTypes = [
  '自然景觀型',
  '都市便利型', 
  '秘境隱居型',
  '包棟'
];

// 獲取所有區域 - 使用store的getter
const areas = computed(() => homestayStore.getAllAreas);

// 除錯用：監控篩選條件變化
const debugFilters = () => {
  console.log('篩選條件:', {
    searchText: searchText.value,
    selectedArea: selectedArea.value,
    guestCount: guestCount.value,
    totalItems: bnbsData.value.length,
    filteredItems: filteredBnbs.value.length
  });
}

// 過濾民宿資料 - 增強篩選邏輯
const filteredBnbs = computed(() => {
  console.log('filteredBnbs 計算中, bnbsData.length:', bnbsData.value?.length);
  
  if (!Array.isArray(bnbsData.value)) {
    console.log('bnbsData 不是陣列:', bnbsData.value);
    return [];
  }
  
  const result = bnbsData.value.filter(bnb => {
    // 檢查名稱和描述（支援環境類型搜尋）
    const nameMatch = !searchText.value || 
      bnb.name.toLowerCase().includes(searchText.value.toLowerCase()) ||
      bnb.description?.toLowerCase().includes(searchText.value.toLowerCase()) ||
      (bnb.features?.environmentTypes && bnb.features.environmentTypes.some(type => 
        type.toLowerCase().includes(searchText.value.toLowerCase())
      ));
    
    // 檢查區域
    const areaMatch = !selectedArea.value || bnb.area === selectedArea.value;
    
    // 檢查人數範圍
    const guestCountMatch = !guestCount.value || guestCount.value === 0 || 
      ((!bnb.min_guests || guestCount.value >= bnb.min_guests) &&
       (!bnb.max_guests || guestCount.value <= bnb.max_guests));
    
    // 特殊處理：如果搜尋「包棟」，顯示有包棟價格的民宿
    const packageMatch = searchText.value !== '包棟' || 
      (bnb.prices && (bnb.prices.fullRentWeekday || bnb.prices.fullRentWeekend));
    
    return nameMatch && areaMatch && guestCountMatch && packageMatch;
  });
  
  console.log('篩選結果:', result.length, '筆');
  return result;
});

// 計算總頁數
const totalPages = computed(() => {
  return Math.ceil(filteredBnbs.value.length / itemsPerPage);
});

// 當前頁的資料
const paginatedBnbs = computed(() => {
  const startIndex = (currentPage.value - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  return filteredBnbs.value.slice(startIndex, endIndex);
});

// 點擊熱門標籤 - 增強邏輯
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
  // filterBnbs 會自動觸發 (透過 watch)
}

// 清除搜尋文字
const cleanText = () => {
  searchText.value = '';
  currentPage.value = 1;
}

// 根據區域過濾
const filterByArea = () => {
  currentPage.value = 1;
}

// 從 store 獲取民宿資料
const fetchBnbsData = async () => {
  console.log('=== fetchBnbsData 開始執行 ===');
  console.log('📊 Store初始狀態檢查:');
  console.log('- hasData:', homestayStore.hasData);
  console.log('- 民宿數量:', homestayStore.getAllHomestays.length);
  console.log('- loading:', homestayStore.getLoading);
  console.log('- error:', homestayStore.getError);
  
  try {
    // 使用 store 的 fetchHomestays 方法
    console.log('🔄 開始從API獲取資料...');
    await homestayStore.fetchHomestays();
    console.log('✅ 從 store 獲取民宿資料成功');
    
    console.log('📊 Store載入後狀態:');
    console.log('- hasData:', homestayStore.hasData);
    console.log('- 民宿數量:', homestayStore.getAllHomestays.length);
    console.log('- loading:', homestayStore.getLoading);
    console.log('- error:', homestayStore.getError);
    
    if (homestayStore.getAllHomestays.length > 0) {
      console.log('📝 前3個民宿示例:', homestayStore.getAllHomestays.slice(0, 3).map(h => ({
        id: h.id,
        name: h.name,
        type: typeof h.id
      })));
    }
    
    // 確保響應式更新
    await nextTick();
    
    // 立即檢查篩選狀態
    setTimeout(() => {
      console.log('=== 最終狀態檢查 ===');
      console.log('loading:', loading.value);
      console.log('error:', error.value);
      console.log('bnbsData.length:', bnbsData.value.length);
      console.log('filteredBnbs.length:', filteredBnbs.value.length);
      console.log('paginatedBnbs.length:', paginatedBnbs.value.length);
      debugFilters();
    }, 100);
    
  } catch (err) {
    console.error('載入民宿資料失敗:', err);
  }
  
  console.log('=== fetchBnbsData 執行完成 ===');
}

// 監聽篩選條件變化
watch([searchText, selectedArea, guestCount], () => {
  currentPage.value = 1;
  debugFilters(); // 除錯輸出
}, { deep: true, immediate: false });

onMounted(() => {
  console.log('onMounted 觸發 - 開始載入民宿資料');
  fetchBnbsData();
});

// 在資料載入後執行除錯
watch(bnbsData, (newData) => {
  if (newData && newData.length > 0) {
    console.log('民宿資料載入完成，總數:', newData.length);
    console.log('第一筆資料樣本:', newData[0]);
    debugFilters();
  }
}, { immediate: true });

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
  
  // 檢查store狀態
  console.log('🏪 導航前Store狀態:');
  console.log('- hasData:', homestayStore.hasData);
  console.log('- 民宿數量:', homestayStore.getAllHomestays.length);
  console.log('- 目標民宿是否存在:', homestayStore.getHomestayById(id) ? '是' : '否');
  
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
</script>

<style lang="scss" scoped>
/* 搜尋控制區域 */
.search-controls {
  display: flex;
  gap: 16px;
  margin-bottom: 16px;
  flex-wrap: wrap;
  
  @media (max-width: 768px) {
    flex-direction: column;
    gap: 12px;
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
  white-space: nowrap;
  text-overflow: ellipsis;
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
    width: 100%;
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
  color: #ff6b6b;
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
  gap: 5px;
  margin-bottom: 8px;
}

.bnb-environment {
  background-color: #e8f5e8;
  color: #2d5a2d;
  font-size: 11px;
}

.package-price {
  margin-top: 5px;
  padding: 8px;
  background-color: #fff8e1;
  border-radius: 6px;
  border-left: 3px solid #ffc107;
}

.package-label {
  display: block;
  font-size: 11px;
  color: #333;
  font-weight: 600;
  margin-bottom: 3px;
}

.package-value {
  display: block;
  font-size: 12px;
  color: #ff8f00;
  font-weight: 500;
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



/* 人數搜尋樣式 */
.people-search-group {
  display: flex;
  flex-direction: column;
  width: 140px;
  
  @media (max-width: 768px) {
    width: 100%;
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
}
</style> 