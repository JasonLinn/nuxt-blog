import { defineStore } from "pinia";

const initState = {
  relativeData: {
    peding: null,
    data: null,
    error: null
  },
  currentCate: '',
  currentPage: 0,
  searchText: null,
  peding: null,
  data: null,
  error: null
};

// 將其命名為useXXXStore，就像vue3的composable一樣
const useRelativeStore = defineStore("useRelativeStore", {
  state: () => structuredClone(initState), // 每個請求各自一份，避免 SSR 時跨請求共用狀態
  actions: {
    setRelative(relativeData) {
      this.relativeData.data = relativeData;
    },
    resetRelative() {
      this.relativeData = structuredClone(initState.relativeData);
    },
    async fetchAndSetRelative(initData = {}) {
        const url = useRequestURL()
        const {
            pending,
            data,
            error
          } = await useFetch('/api/relative', {
            query: {
                category: initData.cate || initState.currentCate,
                page: initData.currentPage || initState.currentPage,
                searchText: initData.searchText || initState.searchText,
                pageSize: initData.pageSize || 10
            }
        })

      this.relativeData =  {
        pending,
        data,
        error
      };
    },
  },
  getters: {
    getRelativeData: (state) => state.relativeData,
  },
});

export default useRelativeStore;
