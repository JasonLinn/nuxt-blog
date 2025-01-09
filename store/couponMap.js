import { defineStore } from "pinia";

const initState = {
  couponData: {
    peding: null,
    data: null,
    error: null
  },
  currentCate: '',
  township: [],
  searchText: null,
  currentPage: 0,
  peding: null,
    data: null,
    error: null
};

// 將其命名為useXXXStore，就像vue3的composable一樣
const useCouponMapStore = defineStore("useCouponMapStore", {
  state: () => initState,
  actions: {
    setCoupon(couponData) {
      this.couponData.data = couponData;
    },
    resetCoupon() {
      this.couponData = initState.couponData;
    },
    async fetchAndSetCoupon(initData) {
        const {
            pending,
            data,
            error
          } = await useFetch('/api/articles', {
            query: {
                category: initData.selectedCate || initState.currentCate,
                township: initData.selectedTown || initState.township,
                searchText: initData.searchText || initState.searchText,
                page: initData.currentPage || initState.currentPage,
                pageSize: initData.pageSize || 10
            }
        })
      this.couponData =  {
        pending,
        data,
        error
      };
    },
  },
  getters: {
    getCouponData: (state) => state.couponData,
  },
});

export default useCouponMapStore;
