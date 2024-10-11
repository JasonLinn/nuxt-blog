import { defineStore } from "pinia";

const initState = {
  couponData: {
    peding: null,
    data: null,
    error: null
  },
  currentCate: '',
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
      this.couponData.data = couponData;
    },
    resetCoupon() {
      this.couponData = initState.couponData;
    },
    async fetchAndSetCoupon(cate) {
        const url = useRequestURL()
        const {
            pending,
            data,
            error
          } = await useFetch('/api/articles', {
            query: {
                category: cate || initState.currentCate,
                page: initState.currentPage,
                pageSize: 10
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

export default useCouponStore;
