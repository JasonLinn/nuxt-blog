import { defineStore } from "pinia";

const useHomestayStore = defineStore("homestayStore", {
  state: () => ({
    homestays: [],
    loading: false,
    error: null,
    pagination: {
      currentPage: 1,
      totalPages: 1,
      totalCount: 0,
      limit: 12
    },
    lastFetchParams: null, // 記錄最後一次請求的參數，用於判斷是否需要重新請求
    lastFetchTime: null,
    // 緩存時間（分鐘）
    cacheTimeout: 5
  }),

  actions: {
    // 設置民宿資料
    setHomestays(homestays) {
      this.homestays = homestays;
      this.lastFetchTime = Date.now();
      this.error = null;
    },

    // 設置分頁資訊
    setPagination(pagination) {
      this.pagination = { ...this.pagination, ...pagination };
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
      this.lastFetchParams = null;
      this.pagination = {
        currentPage: 1,
        totalPages: 1,
        totalCount: 0,
        limit: 12
      };
    },

    // 獲取民宿資料 (支援分頁與篩選)
    async fetchHomestays(params = {}) {
      console.log('=== homestayStore fetchHomestays 開始 ===', params);

      const {
        page = 1,
        limit = 12,
        search = '',
        location = '',
        themes = [],
        amenities = [],
        guest_count = null,
        sort_by = 'rating',
        forceRefresh = false
      } = params;

      // 檢查是否是相同的請求且快取有效 (如果不是強制刷新)
      // 注意：如果有篩選條件變更，則視為不同請求
      const currentParams = JSON.stringify({ page, limit, search, location, themes, amenities, guest_count, sort_by });

      if (!forceRefresh &&
        this.homestays.length > 0 &&
        this.lastFetchParams === currentParams &&
        this.lastFetchTime &&
        (Date.now() - this.lastFetchTime) / (1000 * 60) < this.cacheTimeout) {
        console.log('使用 store 快取資料');
        return this.homestays;
      }

      this.setLoading(true);
      this.setError(null);
      this.lastFetchParams = currentParams;

      try {
        console.log('從API獲取民宿資料...');

        // 使用 Nuxt 的 $fetch 工具獲取資料
        const data = await $fetch('/api/fetchBnbs', {
          query: {
            page,
            limit,
            search,
            location,
            themes,
            amenities,
            guest_count,
            sort_by
          }
        });

        if (data.success) {
          console.log(`✅ 獲取成功，本頁資料: ${data.homestays.length} 筆，總數: ${data.total_count} 筆`);

          this.setHomestays(data.homestays);
          this.setPagination({
            currentPage: data.current_page || page,
            totalPages: data.total_pages || Math.ceil(data.total_count / limit),
            totalCount: data.total_count || 0,
            limit
          });

          return data.homestays;

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

    // 根據ID獲取單一民宿資料 (從當前列表中查找，如果沒找到可能需要另外 fetch)
    // 注意：因為現在列表只有部分資料，從這裡獲取可能失敗，建議詳細頁面使用自己的 useFetch
    getHomestayById(id) {
      const homestay = this.homestays.find(h =>
        h.id === id || h.id === parseInt(id) || h.id.toString() === id.toString()
      );
      return homestay;
    },

    // 更新民宿查看次數
    updateViewCount(id) {
      // 僅更新本地狀態
      const homestay = this.getHomestayById(id);
      if (homestay) {
        homestay.view_count = (homestay.view_count || 0) + 1;
      }
    },

    // 清除快取
    clearCache() {
      this.clearData();
    }
  },

  getters: {
    // 獲取當前頁民宿列表
    getAllHomestays: (state) => state.homestays,

    // 獲取載入狀態
    getLoading: (state) => state.loading,

    // 獲取錯誤狀態
    getError: (state) => state.error,

    // 獲取分頁資訊
    getPagination: (state) => state.pagination,

    // 獲取所有區域 (注意：現在只能獲取當前頁面的區域，如果需要全部區域列表可能需要另外的 API)
    // 為了保持兼容性，這裡還是返回當前頁面的區域列表
    getAllAreas: (state) => {
      const areaSet = new Set();
      state.homestays.forEach(homestay => {
        if (homestay.area) {
          areaSet.add(homestay.area);
        }
      });
      return Array.from(areaSet).sort();
    },

    // 檢查是否有資料
    hasData: (state) => state.homestays.length > 0,
  }
});

export default useHomestayStore; 