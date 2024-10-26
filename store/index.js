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
      this.couponData = coupons
    },
    async getCoupons(id) {
      const userCoupons = await $fetch(`/api/user/${id}`)
        .then((response) => {
          return response?.coupons.map((item)=> JSON.parse(item)).sort((a, b)=> new Date(b.gotTime) - new Date(a.gotTime))
        })
        .catch((error) => console.log(error))

        this.couponData = userCoupons
    },
    async fetchAndSetUser() {
      const user = await fetchUser();
      console.log(user, 'uuuuuuuu')
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
