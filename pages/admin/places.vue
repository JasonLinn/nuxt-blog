<template>
  <div class="admin-places-container">
    <!-- 載入中狀態 -->
    <div v-if="loading" class="loading-screen">
      <div class="loading-content">
        <Icon class="h-8 w-8 text-blue-500" name="eos-icons:loading" />
        <p>載入中...</p>
      </div>
    </div>

    <!-- 主要內容 -->
    <div v-else class="admin-content">
      <!-- 頁面標題 -->
      <header class="page-header">
        <div class="header-content">
          <h1 class="page-title">
            <Icon name="mdi:map-marker" class="title-icon" />
            地點管理
          </h1>
          <p class="page-subtitle">管理網站中的所有地點資訊</p>
        </div>
        
        <div class="header-actions">
          <button @click="showAddModal = true" class="btn-primary">
            <Icon name="mdi:plus" />
            新增地點
          </button>
        </div>
      </header>

      <!-- 統計資訊 -->
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-icon bg-blue">
            <Icon name="mdi:map-marker" />
          </div>
          <div class="stat-content">
            <div class="stat-number">{{ totalPlaces }}</div>
            <div class="stat-label">總地點數</div>
          </div>
        </div>
        
        <div class="stat-card">
          <div class="stat-icon bg-green">
            <Icon name="mdi:check-circle" />
          </div>
          <div class="stat-content">
            <div class="stat-number">{{ approvedPlaces }}</div>
            <div class="stat-label">已審核</div>
          </div>
        </div>
        
        <div class="stat-card">
          <div class="stat-icon bg-orange">
            <Icon name="mdi:clock" />
          </div>
          <div class="stat-content">
            <div class="stat-number">{{ pendingPlaces }}</div>
            <div class="stat-label">待審核</div>
          </div>
        </div>
        
        <div class="stat-card">
          <div class="stat-icon bg-purple">
            <Icon name="mdi:star" />
          </div>
          <div class="stat-content">
            <div class="stat-number">{{ featuredPlaces }}</div>
            <div class="stat-label">精選地點</div>
          </div>
        </div>
      </div>

      <!-- 篩選器 -->
      <div class="filters-section">
        <div class="filters-grid">
          <div class="filter-group">
            <label class="filter-label">分類</label>
            <select v-model="filters.category" class="filter-select">
              <option value="">全部分類</option>
              <option v-for="category in categories" :key="category.id" :value="category.id">
                {{ category.name }}
              </option>
            </select>
          </div>
          
          <div class="filter-group">
            <label class="filter-label">狀態</label>
            <select v-model="filters.status" class="filter-select">
              <option value="">全部狀態</option>
              <option value="pending">待審核</option>
              <option value="approved">已審核</option>
              <option value="rejected">已拒絕</option>
            </select>
          </div>
          
          <div class="filter-group">
            <label class="filter-label">搜尋</label>
            <div class="search-input-group">
              <Icon name="mdi:magnify" class="search-icon" />
              <input 
                v-model="filters.search" 
                type="text" 
                placeholder="搜尋地點名稱或地址..."
                class="search-input"
              />
            </div>
          </div>
          
          <div class="filter-group">
            <button @click="resetFilters" class="btn-secondary">
              <Icon name="mdi:refresh" />
              重置篩選
            </button>
          </div>
        </div>
      </div>

      <!-- 地點列表 -->
      <div class="places-section">
        <div class="section-header">
          <h2 class="section-title">地點列表</h2>
          <div class="section-actions">
            <span class="result-count">共 {{ filteredPlaces.length }} 個地點</span>
          </div>
        </div>

        <!-- 地點網格 -->
        <div v-if="filteredPlaces.length > 0" class="places-grid">
          <div v-for="place in paginatedPlaces" :key="place.id" class="place-card">
            <!-- 地點圖片 -->
            <div class="place-image">
              <img 
                :src="getPlaceImage(place)" 
                :alt="place.name"
                @error="handleImageError"
              />
              
              <!-- 狀態標籤 -->
              <div class="place-badges">
                <span :class="['status-badge', `status-${place.status}`]">
                  {{ getStatusText(place.status) }}
                </span>
                <span v-if="place.is_featured" class="featured-badge">
                  <Icon name="mdi:star" />
                  精選
                </span>
                <span v-if="place.is_private" class="private-badge">
                  <Icon name="mdi:lock" />
                  私房
                </span>
              </div>
            </div>

            <!-- 地點資訊 -->
            <div class="place-info">
              <div class="place-header">
                <h3 class="place-name">{{ place.name }}</h3>
                <div class="place-category">
                  <Icon :name="getCategoryIcon(place.category_id)" />
                  {{ getCategoryName(place.category_id) }}
                </div>
              </div>
              
              <div class="place-details">
                <div class="place-address">
                  <Icon name="mdi:map-marker" />
                  {{ place.formatted_address || '地址未提供' }}
                </div>
                
                <div v-if="place.rating" class="place-rating">
                  <Icon name="mdi:star" />
                  {{ place.rating }} ({{ place.user_ratings_total || 0 }} 評論)
                </div>
                
                <div class="place-meta">
                  <span class="meta-item">
                    <Icon name="mdi:eye" />
                    {{ place.view_count || 0 }} 次瀏覽
                  </span>
                  <span class="meta-item">
                    <Icon name="mdi:calendar" />
                    {{ formatDate(place.created_at) }}
                  </span>
                </div>
              </div>

              <!-- 操作按鈕 -->
              <div class="place-actions">
                <button @click="editPlace(place)" class="btn-edit">
                  <Icon name="mdi:pencil" />
                  編輯
                </button>
                
                <button 
                  v-if="place.status === 'pending'" 
                  @click="approvePlace(place.id)" 
                  class="btn-approve"
                >
                  <Icon name="mdi:check" />
                  審核通過
                </button>
                
                <button 
                  @click="toggleFeatured(place.id, !place.is_featured)" 
                  :class="['btn-feature', { active: place.is_featured }]"
                >
                  <Icon name="mdi:star" />
                  {{ place.is_featured ? '取消精選' : '設為精選' }}
                </button>
                
                <button @click="deletePlace(place.id)" class="btn-delete">
                  <Icon name="mdi:delete" />
                  刪除
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- 空狀態 -->
        <div v-else class="empty-state">
          <Icon name="mdi:map-marker-off" class="empty-icon" />
          <h3>沒有找到地點</h3>
          <p>嘗試調整篩選條件或新增第一個地點</p>
          <button @click="showAddModal = true" class="btn-primary">
            新增地點
          </button>
        </div>

        <!-- 分頁 -->
        <div v-if="totalPages > 1" class="pagination">
          <button 
            @click="currentPage = currentPage - 1" 
            :disabled="currentPage <= 1"
            class="pagination-btn"
          >
            <Icon name="mdi:chevron-left" />
            上一頁
          </button>
          
          <div class="pagination-info">
            第 {{ currentPage }} 頁，共 {{ totalPages }} 頁
          </div>
          
          <button 
            @click="currentPage = currentPage + 1" 
            :disabled="currentPage >= totalPages"
            class="pagination-btn"
          >
            下一頁
            <Icon name="mdi:chevron-right" />
          </button>
        </div>
      </div>
    </div>

    <!-- 新增/編輯地點模態框 -->
    <PlaceModal 
      v-if="showAddModal || showEditModal"
      :place="editingPlace"
      :categories="categories"
      @close="closeModal"
      @saved="handlePlaceSaved"
    />

    <!-- Toast 提示 -->
    <Transition name="toast">
      <div 
        v-if="toast.show" 
        :class="['toast-notification', `toast-${toast.type}`]"
      >
        <div class="toast-content">
          <Icon 
            :name="toast.type === 'success' ? 'mdi:check-circle' : 'mdi:alert-circle'" 
            class="toast-icon"
          />
          <span class="toast-message">{{ toast.message }}</span>
          <button @click="hideToast" class="toast-close">
            <Icon name="mdi:close" />
          </button>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import PlaceModal from '~/components/PlaceModal.vue';

// 取得運行時配置
const config = useRuntimeConfig();

// SEO 設定
useHead({
  title: '地點管理 - 管理後台',
  meta: [
    { name: 'robots', content: 'noindex, nofollow' }
  ]
});

// 狀態管理
const loading = ref(true);
const places = ref([]);
const categories = ref([]);
const showAddModal = ref(false);
const showEditModal = ref(false);
const editingPlace = ref(null);

// 篩選器
const filters = ref({
  category: '',
  status: '',
  search: ''
});

// 分頁
const currentPage = ref(1);
const itemsPerPage = 12;

// Toast 提示
const toast = ref({
  show: false,
  type: 'success',
  message: ''
});

// 計算屬性
const totalPlaces = computed(() => places.value.length);
const approvedPlaces = computed(() => places.value.filter(p => p.status === 'approved').length);
const pendingPlaces = computed(() => places.value.filter(p => p.status === 'pending').length);
const featuredPlaces = computed(() => places.value.filter(p => p.is_featured).length);

const filteredPlaces = computed(() => {
  let filtered = places.value;

  // 分類篩選
  if (filters.value.category) {
    filtered = filtered.filter(p => p.category_id == filters.value.category);
  }

  // 狀態篩選
  if (filters.value.status) {
    filtered = filtered.filter(p => p.status === filters.value.status);
  }

  // 搜尋篩選
  if (filters.value.search) {
    const search = filters.value.search.toLowerCase();
    filtered = filtered.filter(p => 
      p.name.toLowerCase().includes(search) ||
      (p.formatted_address && p.formatted_address.toLowerCase().includes(search))
    );
  }

  return filtered;
});

const totalPages = computed(() => Math.ceil(filteredPlaces.value.length / itemsPerPage));

const paginatedPlaces = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage;
  const end = start + itemsPerPage;
  return filteredPlaces.value.slice(start, end);
});

// 載入資料
const loadPlaces = async () => {
  try {
    console.log('Google Maps API Key:', config.public.GOOGLE_MAPS_API_KEY ? 'Set' : 'Not set');
    const response = await $fetch('/api/admin/places');
    if (response.success) {
      places.value = response.data;
      console.log('Loaded places:', response.data.length);
      console.log('First place photos:', response.data[0]?.photos);
    }
  } catch (error) {
    console.error('載入地點失敗:', error);
    showToast('載入地點失敗', 'error');
  }
};

const loadCategories = async () => {
  try {
    const response = await $fetch('/api/admin/place-categories');
    if (response.success) {
      categories.value = response.data;
    }
  } catch (error) {
    console.error('載入分類失敗:', error);
  }

};

// 輔助函數
const getPlaceImage = (place) => {
  console.log('getPlaceImage called with place:', {
    name: place.name,
    hasPhotos: !!(place.photos && place.photos.length > 0),
    photosLength: place.photos?.length || 0,
    firstPhoto: place.photos?.[0]
  });
  
  // 使用 Google Photos（目前資料庫中主要的圖片來源）
  if (place.photos && place.photos.length > 0) {
    const photo = place.photos[0];
    if (photo && photo.photo_reference) {
      // 檢查是否有 API key
      const apiKey = config.public.GOOGLE_MAPS_API_KEY;
      if (apiKey) {
        const googleImageUrl = `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photoreference=${photo.photo_reference}&key=${apiKey}`;
        console.log('Using Google photo URL:', googleImageUrl);
        return googleImageUrl;
      } else {
        console.warn('Google Maps API Key not found');
      }
    } else {
      console.warn('No valid photo object or photo_reference found:', photo);
    }
  }
  
  console.log('Using placeholder image');
  return '/placeholder-place.jpg';
};

const handleImageError = (event) => {
  event.target.src = '/placeholder-place.jpg';
};

const getCategoryName = (categoryId) => {
  const category = categories.value.find(c => c.id === categoryId);
  return category ? category.name : '未分類';
};

const getCategoryIcon = (categoryId) => {
  const category = categories.value.find(c => c.id === categoryId);
  return category ? category.icon : 'mdi:map-marker';
};

const getStatusText = (status) => {
  const statusMap = {
    pending: '待審核',
    approved: '已審核',
    rejected: '已拒絕'
  };
  return statusMap[status] || status;
};

const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString('zh-TW');
};

// 操作函數
const editPlace = (place) => {
  editingPlace.value = { ...place };
  showEditModal.value = true;
};

const approvePlace = async (placeId) => {
  try {
    const response = await $fetch(`/api/admin/places/${placeId}/approve`, {
      method: 'POST'
    });
    
    if (response.success) {
      await loadPlaces();
      showToast('地點已審核通過', 'success');
    }
  } catch (error) {
    console.error('審核失敗:', error);
    showToast('審核失敗', 'error');
  }
};

const toggleFeatured = async (placeId, featured) => {
  try {
    const response = await $fetch(`/api/admin/places/${placeId}/featured`, {
      method: 'PUT',
      body: { is_featured: featured }
    });
    
    if (response.success) {
      await loadPlaces();
      showToast(featured ? '已設為精選地點' : '已取消精選', 'success');
    }
  } catch (error) {
    console.error('更新精選狀態失敗:', error);
    showToast('更新失敗', 'error');
  }
};

const deletePlace = async (placeId) => {
  if (!confirm('確定要刪除這個地點嗎？此操作無法復原。')) {
    return;
  }
  
  try {
    const response = await $fetch(`/api/admin/places/${placeId}`, {
      method: 'DELETE'
    });
    
    if (response.success) {
      await loadPlaces();
      showToast('地點已刪除', 'success');
    }
  } catch (error) {
    console.error('刪除失敗:', error);
    showToast('刪除失敗', 'error');
  }
};

const resetFilters = () => {
  filters.value = {
    category: '',
    status: '',
    search: ''
  };
  currentPage.value = 1;
};

const closeModal = () => {
  showAddModal.value = false;
  showEditModal.value = false;
  editingPlace.value = null;
};

const handlePlaceSaved = () => {
  closeModal();
  loadPlaces();
  showToast('地點已儲存', 'success');
};

// Toast 函數
const showToast = (message, type = 'success') => {
  toast.value = {
    show: true,
    type,
    message
  };
  
  setTimeout(() => {
    hideToast();
  }, 5000);
};

const hideToast = () => {
  toast.value.show = false;
};

// 監聽篩選器變化，重置分頁
watch([filters], () => {
  currentPage.value = 1;
}, { deep: true });

// 初始化
onMounted(async () => {
  try {
    await Promise.all([
      loadPlaces(),
      loadCategories()
    ]);
  } finally {
    loading.value = false;
  }
});
</script>

<style lang="scss" scoped>
.admin-places-container {
  min-height: 100vh;
  background: #f8fafc;
}

.loading-screen {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  
  .loading-content {
    text-align: center;
    color: #6b7280;
    
    p {
      margin-top: 12px;
      font-size: 16px;
    }
  }
}

.admin-content {
  max-width: 1400px;
  margin: 0 auto;
  padding: 24px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 32px;
  
  .header-content {
    .page-title {
      display: flex;
      align-items: center;
      gap: 12px;
      font-size: 32px;
      font-weight: 700;
      color: #1f2937;
      margin-bottom: 8px;
      
      .title-icon {
        font-size: 36px;
        color: #3b82f6;
      }
    }
    
    .page-subtitle {
      font-size: 16px;
      color: #6b7280;
      margin: 0;
    }
  }
  
  .header-actions {
    .btn-primary {
      display: flex;
      align-items: center;
      gap: 8px;
      background: #3b82f6;
      color: white;
      border: none;
      padding: 12px 24px;
      border-radius: 8px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.3s ease;
      
      &:hover {
        background: #2563eb;
        transform: translateY(-1px);
      }
    }
  }
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 24px;
  margin-bottom: 32px;
}

.stat-card {
  background: white;
  padding: 24px;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  display: flex;
  align-items: center;
  gap: 16px;
  
  .stat-icon {
    width: 48px;
    height: 48px;
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 24px;
    color: white;
    
    &.bg-blue { background: #3b82f6; }
    &.bg-green { background: #10b981; }
    &.bg-orange { background: #f59e0b; }
    &.bg-purple { background: #8b5cf6; }
  }
  
  .stat-content {
    .stat-number {
      font-size: 24px;
      font-weight: 700;
      color: #1f2937;
      margin-bottom: 4px;
    }
    
    .stat-label {
      font-size: 14px;
      color: #6b7280;
    }
  }
}

.filters-section {
  background: white;
  padding: 24px;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  margin-bottom: 32px;
}

.filters-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
  align-items: end;
}

.filter-group {
  .filter-label {
    display: block;
    margin-bottom: 8px;
    font-weight: 600;
    color: #374151;
    font-size: 14px;
  }
  
  .filter-select {
    width: 100%;
    padding: 12px 16px;
    border: 2px solid #e5e7eb;
    border-radius: 8px;
    font-size: 14px;
    background: white;
    transition: border-color 0.3s ease;
    
    &:focus {
      outline: none;
      border-color: #3b82f6;
    }
  }
  
  .search-input-group {
    position: relative;
    
    .search-icon {
      position: absolute;
      left: 12px;
      top: 50%;
      transform: translateY(-50%);
      color: #9ca3af;
      font-size: 18px;
    }
    
    .search-input {
      width: 100%;
      padding: 12px 16px 12px 44px;
      border: 2px solid #e5e7eb;
      border-radius: 8px;
      font-size: 14px;
      transition: border-color 0.3s ease;
      
      &:focus {
        outline: none;
        border-color: #3b82f6;
      }
    }
  }
  
  .btn-secondary {
    display: flex;
    align-items: center;
    gap: 8px;
    background: #f3f4f6;
    color: #374151;
    border: 2px solid #e5e7eb;
    padding: 12px 20px;
    border-radius: 8px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s ease;
    width: 100%;
    justify-content: center;
    
    &:hover {
      background: #e5e7eb;
    }
  }
}

.places-section {
  .section-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 24px;
    
    .section-title {
      font-size: 24px;
      font-weight: 700;
      color: #1f2937;
      margin: 0;
    }
    
    .section-actions {
      .result-count {
        font-size: 14px;
        color: #6b7280;
        background: #f3f4f6;
        padding: 8px 16px;
        border-radius: 20px;
      }
    }
  }
}

.places-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 24px;
  margin-bottom: 32px;
}

.place-card {
  background: white;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
  }
  
  .place-image {
    position: relative;
    height: 200px;
    overflow: hidden;
    
    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
    
    .place-badges {
      position: absolute;
      top: 12px;
      left: 12px;
      display: flex;
      flex-direction: column;
      gap: 6px;
      
      .status-badge {
        background: rgba(0, 0, 0, 0.7);
        color: white;
        padding: 4px 8px;
        border-radius: 4px;
        font-size: 12px;
        font-weight: 600;
        
        &.status-approved {
          background: #10b981;
        }
        
        &.status-pending {
          background: #f59e0b;
        }
        
        &.status-rejected {
          background: #ef4444;
        }
      }
      
      .featured-badge,
      .private-badge {
        display: flex;
        align-items: center;
        gap: 4px;
        background: #8b5cf6;
        color: white;
        padding: 4px 8px;
        border-radius: 4px;
        font-size: 12px;
        font-weight: 600;
      }
      
      .private-badge {
        background: #6b7280;
      }
    }
  }
  
  .place-info {
    padding: 20px;
    
    .place-header {
      margin-bottom: 16px;
      
      .place-name {
        font-size: 18px;
        font-weight: 600;
        color: #1f2937;
        margin-bottom: 8px;
        line-height: 1.4;
      }
      
      .place-category {
        display: flex;
        align-items: center;
        gap: 6px;
        color: #6b7280;
        font-size: 14px;
        font-weight: 500;
      }
    }
    
    .place-details {
      margin-bottom: 20px;
      
      .place-address,
      .place-rating {
        display: flex;
        align-items: center;
        gap: 8px;
        color: #6b7280;
        font-size: 14px;
        margin-bottom: 8px;
        
        svg {
          flex-shrink: 0;
          font-size: 16px;
        }
      }
      
      .place-rating {
        color: #f59e0b;
        font-weight: 500;
      }
      
      .place-meta {
        display: flex;
        gap: 16px;
        margin-top: 12px;
        
        .meta-item {
          display: flex;
          align-items: center;
          gap: 4px;
          color: #9ca3af;
          font-size: 12px;
          
          svg {
            font-size: 14px;
          }
        }
      }
    }
    
    .place-actions {
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
      
      button {
        display: flex;
        align-items: center;
        gap: 4px;
        padding: 6px 12px;
        border: none;
        border-radius: 6px;
        font-size: 12px;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.3s ease;
        
        svg {
          font-size: 14px;
        }
      }
      
      .btn-edit {
        background: #f3f4f6;
        color: #374151;
        
        &:hover {
          background: #e5e7eb;
        }
      }
      
      .btn-approve {
        background: #dcfce7;
        color: #166534;
        
        &:hover {
          background: #bbf7d0;
        }
      }
      
      .btn-feature {
        background: #fef3c7;
        color: #92400e;
        
        &:hover {
          background: #fde68a;
        }
        
        &.active {
          background: #8b5cf6;
          color: white;
        }
      }
      
      .btn-delete {
        background: #fee2e2;
        color: #dc2626;
        
        &:hover {
          background: #fecaca;
        }
      }
    }
  }
}

.empty-state {
  text-align: center;
  padding: 80px 20px;
  
  .empty-icon {
    font-size: 64px;
    color: #d1d5db;
    margin-bottom: 16px;
  }
  
  h3 {
    font-size: 20px;
    color: #374151;
    margin-bottom: 8px;
  }
  
  p {
    color: #6b7280;
    margin-bottom: 24px;
  }
  
  .btn-primary {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    background: #3b82f6;
    color: white;
    border: none;
    padding: 12px 24px;
    border-radius: 8px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s ease;
    
    &:hover {
      background: #2563eb;
    }
  }
}

.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 16px;
  padding: 24px 0;
  
  .pagination-btn {
    display: flex;
    align-items: center;
    gap: 8px;
    background: white;
    border: 2px solid #e5e7eb;
    padding: 12px 20px;
    border-radius: 8px;
    color: #374151;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s ease;
    
    &:hover:not(:disabled) {
      border-color: #3b82f6;
      color: #3b82f6;
    }
    
    &:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
  }
  
  .pagination-info {
    font-size: 14px;
    color: #6b7280;
    font-weight: 500;
  }
}

// Toast 樣式
.toast-notification {
  position: fixed;
  top: 20px;
  right: 20px;
  z-index: 9999;
  min-width: 320px;
  border-radius: 8px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.15);
  
  &.toast-success {
    background: #10b981;
    color: white;
  }
  
  &.toast-error {
    background: #ef4444;
    color: white;
  }
  
  .toast-content {
    display: flex;
    align-items: center;
    padding: 16px;
    gap: 12px;
    
    .toast-icon {
      font-size: 20px;
    }
    
    .toast-message {
      flex: 1;
      font-weight: 500;
    }
    
    .toast-close {
      background: rgba(255, 255, 255, 0.2);
      border: none;
      border-radius: 4px;
      padding: 4px;
      color: white;
      cursor: pointer;
      
      &:hover {
        background: rgba(255, 255, 255, 0.3);
      }
    }
  }
}

.toast-enter-active,
.toast-leave-active {
  transition: all 0.3s ease;
}

.toast-enter-from {
  opacity: 0;
  transform: translateX(100%);
}

.toast-leave-to {
  opacity: 0;
  transform: translateX(100%);
}

// 響應式設計
@media (max-width: 768px) {
  .admin-content {
    padding: 16px;
  }
  
  .page-header {
    flex-direction: column;
    gap: 16px;
    align-items: stretch;
  }
  
  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .filters-grid {
    grid-template-columns: 1fr;
  }
  
  .places-grid {
    grid-template-columns: 1fr;
  }
  
  .pagination {
    flex-direction: column;
    gap: 12px;
  }
  
  .toast-notification {
    left: 16px;
    right: 16px;
    min-width: auto;
  }
}
</style>
