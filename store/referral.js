import { defineStore } from "pinia";

const initState = {
    referral: '',
  };
// console.log(route.search, 'rrrrrr')
// 將其命名為useXXXStore，就像vue3的composable一樣
const useReferralStore = defineStore("useReferralStore", {
  state: () => initState,
  actions: {
    setReferral(referral) {
      this.referral = referral;
    },
    resetReferral() {
      this.referral = initState.referral;
    },
},
    getters: {
    getReferral: (state) => state.referral,
  },
});

export default useReferralStore;


