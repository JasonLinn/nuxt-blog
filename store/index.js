import { defineStore } from "pinia";
import fetchUser from "../server/utils/fetchUser";

const initState = {
  userData: null,
  couponData: {}
};

// 將其命名為useXXXStore，就像vue3的composable一樣
const useStore = defineStore("useStore", {
  state: () => initState,
  actions: {
    setUser(userData) {
      this.userData = userData;
    },
    resetUser() {
      this.userData = initState.userData;
      // return this.userData
    },
    setCoupons(coupons) {
      const parsed = (coupons || []).map(item => typeof item === 'string' ? JSON.parse(item) : item).filter(Boolean)
      this.couponData = parsed.sort((a, b) => new Date(b.gotTime) - new Date(a.gotTime))
      if (this.userData) this.userData.coupons = this.couponData.map(item => JSON.stringify(item))
    },
    recordClaim(coupon) {
      const current = (this.userData?.coupons || []).map(item => typeof item === 'string' ? JSON.parse(item) : item).filter(Boolean)
      if (!current.some(item => coupon.claimId && item.claimId === coupon.claimId)) current.push(coupon)
      this.setCoupons(current)
    },
    async getCoupons(id) {
      const userCoupons = await $fetch(`/api/user/${id}`)
        .then((response) => {
          return response?.coupons.map((item) => JSON.parse(item)).sort((a, b) => new Date(b.gotTime) - new Date(a.gotTime))
        })
        .catch((error) => console.log(error))

      if (userCoupons) this.setCoupons(userCoupons)
    },
    async fetchAndSetUser(data) {
      const user = await fetchUser(data);
      this.userData = user;
    },
  },
  getters: {
    getUserData: (state) => state.userData,
    getUserDisplayName: (state) => state.userData?.displayName,
    getUserId: (state) => state.userData?.userId,
    getUserCover: (state) => state.userData?.pictureUrl,
    getUserStatus: (state) => state.userData?.statusMessage,
    getUserCoupons: (state) => state.couponData
  },
});

export default useStore;
