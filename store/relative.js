import { defineStore } from "pinia";

const initState = {
  relativeData: {
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
const useRelativeStore = defineStore("useRelativeStore", {
  state: () => initState,
  actions: {
    setRelative(relativeData) {
      this.relativeData.data = relativeData;
    },
    resetRelative() {
      this.relativeData = initState.relativeData;
    },
    async fetchAndSetRelative(cate) {
        const url = useRequestURL()
        const {
            pending,
            data,
            error
          } = await useFetch('/api/relative', {
            query: {
                category: cate || initState.currentCate,
                page: initState.currentPage,
                pageSize: 10
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
