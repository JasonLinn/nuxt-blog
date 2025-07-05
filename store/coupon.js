import { defineStore } from "pinia";

const initState = {
  couponData: {
    pending: true,  // 初始為載入狀態
    data: null,
    error: null
  },
  currentCate: '',
  township: [],
  searchText: null,
  currentPage: 0,
  pending: true,  // 初始為載入狀態
  data: null,
  error: null
};

// 將其命名為useXXXStore，就像vue3的composable一樣
const useCouponStore = defineStore("useCouponStore", {
  state: () => initState,
  actions: {
    setCoupon(couponData) {
      this.couponData.data = couponData;
    },
    resetCoupon() {
      this.couponData = initState.couponData;
    },
    async fetchAndSetCoupon(initData) {
      this.couponData.pending = true;
      this.couponData.error = null;
      
      try {
        const data = await $fetch('/api/articles', {
          query: {
            category: initData.selectedCate || initState.currentCate,
            township: initData.selectedTown || initState.township,
            searchText: initData.searchText || initState.searchText,
            page: initData.currentPage || initState.currentPage,
            pageSize: initData.pageSize || 10
          }
        });
        
        this.couponData.data = data;
        this.couponData.pending = false;
        
        return { pending: false, data, error: null };
      } catch (error) {
        this.couponData.error = error;
        this.couponData.pending = false;
        
        return { pending: false, data: null, error };
      }
    },
  },
  getters: {
    getCouponData: (state) => state.couponData,
  },
});

export default useCouponStore;
