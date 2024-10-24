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
    async getCoupons(id) {
      const couponData = await $fetch(`/api/user/${id}`)
        .then((response) => {
          return response?.coupons
        })
        .catch((error) => alert(error))

        this.couponData = couponData
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
