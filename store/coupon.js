import { defineStore } from "pinia";

const initState = {
  couponData: {
    peding: null,
    data: null,
    error: null
  },
  currentCate: '',
  searchText: null,
  currentPage: 0,
  peding: null,
    data: null,
    error: null
};

// 將其命名為useXXXStore，就像vue3的composable一樣
const useCouponStore = defineStore("useCouponStore", {
  state: () => initState,
  actions: {
    setCoupon(couponData) {
      console.log(couponData, 'aaaaaaaeeee')
      this.couponData.data = couponData;
    },
    resetCoupon() {
      this.couponData = initState.couponData;
    },
    async fetchAndSetCoupon(initData) {
      console.log(initData, 'iiiiiiiiii')
        const url = useRequestURL()
        const {
            pending,
            data,
            error
          } = await useFetch('/api/articles', {
            query: {
                category: initData.cate || initState.currentCate,
                township: initData.selectedTown || initState.currentCate,
                searchText: initData.searchText || initState.searchText,
                page: initData.currentPage || initState.currentPage,
                pageSize: 10
            }
        })
      console.log(data, 'ddddddd')
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

export default useCouponStore;
