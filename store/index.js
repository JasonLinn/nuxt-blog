
import liff from "@line/liff";
import { defineStore } from "pinia";
import fetchUser from "../server/utils/fetchUser";

const initState = {
  userData: null,
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
    },
    async fetchAndSetUser() {
      const user = await fetchUser();
      this.userData = user;
    },
  },
  getters: {
    getUserData: (state) => state.userData,
    getUserDisplayName: (state) => state.userData?.displayName,
    getUserId: (state) => state.userData?.userId,
    getUserCover: (state) => state.userData?.pictureUrl,
    getUserStatus: (state) => state.userData?.statusMessage,
  },
});

export default useStore;
