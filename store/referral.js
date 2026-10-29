import { defineStore } from "pinia";

const initState = {
    referral: '',
  };
// console.log(route.search, 'rrrrrr')
// 將其命名為useXXXStore，就像vue3的composable一樣
const useReferralStore = defineStore("useReferralStore", {
  state: () => structuredClone(initState), // 每個請求各自一份，避免 SSR 時跨請求共用狀態
  actions: {
    setReferral(referral) {
      this.referral = referral;
    },
    resetReferral() {
      this.referral = structuredClone(initState.referral);
    },
},
    getters: {
    getReferral: (state) => state.referral,
  },
});

export default useReferralStore;


