import { defineStore } from "pinia";

const useHomestayStore = defineStore("homestayStore", {
  state: () => ({
    homestays: [],
    loading: false,
    error: null,
    lastFetchTime: null,
    // 緩存時間（分鐘）
    cacheTimeout: 30
  }),
  
  actions: {
    // 設置民宿資料
    setHomestays(homestays) {
      this.homestays = homestays;
      this.lastFetchTime = Date.now();
      this.error = null;
    },
    
    // 設置載入狀態
    setLoading(loading) {
      this.loading = loading;
    },
    
    // 設置錯誤狀態
    setError(error) {
      this.error = error;
    },
    
    // 清除資料
    clearData() {
      this.homestays = [];
      this.error = null;
      this.lastFetchTime = null;
    },
    
    // 檢查快取是否有效
    isCacheValid() {
      if (!this.lastFetchTime) return false;
      const now = Date.now();
      const cacheAge = (now - this.lastFetchTime) / (1000 * 60); // 分鐘
      return cacheAge < this.cacheTimeout;
    },
    
    // 獲取民宿資料
    async fetchHomestays(forceRefresh = false) {
      console.log('=== homestayStore fetchHomestays 開始 ===');
      
      // 如果有快取且未過期，直接返回
      if (!forceRefresh && this.homestays.length > 0 && this.isCacheValid()) {
        console.log('使用快取資料，民宿數量:', this.homestays.length);
        return this.homestays;
      }
      
      this.setLoading(true);
      this.setError(null);
      
      try {
        console.log('從API獲取民宿資料...');
        
        // 使用 Nuxt 的 $fetch 工具獲取資料
        const data = await $fetch('/api/fetchBnbs', {
          query: {
            limit: 100
          }
        });
        
        console.log('API回傳資料:', data);
        
        if (data.success && data.homestays && Array.isArray(data.homestays)) {
          console.log('開始處理民宿資料...');
          
          // 處理資料格式
          const processedHomestays = data.homestays.map(homestay => {
            console.log('處理民宿:', homestay.name, 'ID:', homestay.id, 'ID類型:', typeof homestay.id);
            
            // 處理價格
            const prices = {
              weekday: homestay.min_price ? `NT$ ${new Intl.NumberFormat('zh-TW').format(homestay.min_price)}` : '請洽詢',
              weekend: homestay.max_price ? `NT$ ${new Intl.NumberFormat('zh-TW').format(homestay.max_price)}` : '請洽詢',
              fullRentWeekday: null,
              fullRentWeekend: null
            };
            
            return {
              id: homestay.id,
              name: homestay.name || '未命名民宿',
              area: homestay.location || '未知地區',
              address: homestay.city || '',
              description: homestay.capacity_description || '暫無描述',
              image_urls: homestay.image_url ? [homestay.image_url] : [],
              min_guests: homestay.min_guests || null,
              max_guests: homestay.max_guests || null,
              features: {
                peopleTypes: [homestay.capacity_description || ''],
                environmentTypes: homestay.types || []
              },
              prices: prices,
              contact: {
                phone: homestay.phone,
                website: homestay.website,
                line: homestay.line_id || null
              },
              featured: homestay.featured || false,
              view_count: homestay.view_count || 0,
              rating: homestay.rating || null,
              total_reviews: homestay.total_reviews || 0,
              // 新增欄位以匹配fetchBnbDetail API的結構
              min_price: homestay.min_price,
              max_price: homestay.max_price,
              average_price: homestay.average_price
            };
          });
          
          // 存儲資料到store
          this.setHomestays(processedHomestays);
          
          console.log('民宿資料存儲完成，總數:', processedHomestays.length);
          return processedHomestays;
          
        } else {
          console.error('API回傳格式錯誤:', data);
          const errorMsg = data.error || '獲取資料失敗';
          this.setError(errorMsg);
          throw new Error(errorMsg);
        }
        
      } catch (err) {
        console.error('載入民宿資料失敗:', err);
        const errorMsg = `載入失敗: ${err.message}`;
        this.setError(errorMsg);
        throw err;
      } finally {
        this.setLoading(false);
        console.log('=== homestayStore fetchHomestays 完成 ===');
      }
    },
    
    // 根據ID獲取單一民宿資料
    getHomestayById(id) {
      console.log('從store查找民宿 ID:', id, '類型:', typeof id);
      console.log('store中的民宿數量:', this.homestays.length);
      
      if (this.homestays.length > 0) {
        console.log('前3個民宿ID示例:', this.homestays.slice(0, 3).map(h => ({ id: h.id, name: h.name, type: typeof h.id })));
      }
      
      const homestay = this.homestays.find(h => {
        const match = h.id === id || h.id === parseInt(id) || h.id.toString() === id.toString();
        if (match) {
          console.log('找到匹配的民宿:', h.id, h.name);
        }
        return match;
      });
      
      console.log('從store獲取民宿結果:', id, homestay ? `找到: ${homestay.name}` : '未找到');
      return homestay;
    },
    
    // 更新民宿查看次數
    updateViewCount(id) {
      const homestay = this.getHomestayById(id);
      if (homestay) {
        homestay.view_count = (homestay.view_count || 0) + 1;
      }
    }
  },
  
  getters: {
    // 獲取所有民宿
    getAllHomestays: (state) => state.homestays,
    
    // 獲取載入狀態
    getLoading: (state) => state.loading,
    
    // 獲取錯誤狀態
    getError: (state) => state.error,
    
    // 獲取所有區域
    getAllAreas: (state) => {
      const areaSet = new Set();
      state.homestays.forEach(homestay => {
        if (homestay.area) {
          areaSet.add(homestay.area);
        }
      });
      return Array.from(areaSet).sort();
    },
    
    // 獲取所有環境類型
    getAllEnvironmentTypes: (state) => {
      const typeSet = new Set();
      state.homestays.forEach(homestay => {
        if (homestay.features?.environmentTypes) {
          homestay.features.environmentTypes.forEach(type => {
            typeSet.add(type);
          });
        }
      });
      return Array.from(typeSet);
    },
    
    // 檢查是否有資料
    hasData: (state) => state.homestays.length > 0,
    
    // 獲取快取狀態
    getCacheStatus: (state) => {
      return {
        hasCache: state.homestays.length > 0,
        lastFetchTime: state.lastFetchTime,
        isValid: state.lastFetchTime && (Date.now() - state.lastFetchTime) / (1000 * 60) < state.cacheTimeout
      };
    }
  }
});

export default useHomestayStore; 