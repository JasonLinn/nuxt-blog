<template>
  <header class="flex w-full justify-center container">
    <nav class="index-nav flex w-full max-w-7xl items-center justify-between px-6 py-2">
      <div class="">
        <NuxtLink
          :to="{
            name: 'index'
          }"
        >
        <img src="logo.png" width="140" alt="宜蘭旅遊通">
          <!-- <div class="flex items-center justify-between">
            <h1 class="index-title">宜蘭旅遊通</h1>
          </div> -->
        </NuxtLink>
        <NuxtLink
          :to="{
            name: 'userInfo'
          }"
        >
          <!-- <div class="flex items-center justify-between">
            <p class="">會員專區</p>
          </div> -->
        </NuxtLink>
        <div v-if="userInfo" class="user-info group relative">
          <div for="avatar" class="cursor-pointer py-2" v-on:mouseenter="toggleEdit" v-on:mouseleave="toggleEdit" :on-focus="toggleEdit">
            <img
              class="user-img inline-block h-10 w-10 rounded-full bg-white/90 object-cover object-center p-0.5 shadow-lg shadow-zinc-800/5 ring-1 ring-zinc-900/5 backdrop-blur hover:bg-opacity-30 focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-opacity-75"
              :src="userInfo.avatar"
              alt="使用者選單"
            />
            <div v-show="showEdit" class="user-info-list absolute right-0 hidden w-60 pt-1 text-gray-700 group-hover:block">
              <div
                class="mt-1 px-4 py-3 divide-y divide-gray-100 rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none"
              >
                <div class="flex items-center">
                  <img
                    :src="userInfo.avatar"
                    class="user-img inline-block h-9 w-9 rounded-full bg-white/90 object-cover object-center p-0.5 shadow-lg shadow-zinc-800/5 ring-1 ring-zinc-900/5 backdrop-blur"
                  />
                  <div class="ml-3.5 flex-grow overflow-hidden">
                    <p class="overflow-hidden text-ellipsis font-medium">{{ userInfo.nickname }}</p>
                    <p class="overflow-hidden text-ellipsis text-xs text-gray-500">
                      {{ userInfo.email }}
                    </p>
                  </div>
                </div>
                <div class="group/menu-item py-2">
                  <NuxtLink
                    class=""
                    to="/articles/create"
                  >
                    <Icon
                      class="mr-2 h-5 w-5"
                      name="ri:pencil-line"
                    />
                    新增優惠券
                  </NuxtLink>
                </div>
                <div class="py-1">
                  <button
                    class="logout-btn btn btn-info text-white"
                    @click="handleLogout"
                  >
                    <Icon
                      class="mr-2 h-5 w-5"
                      name="ri:logout-box-line"
                    />
                    登出
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
        <!-- 管理員登入入口 -->
        <!-- <NuxtLink
          v-else
          class="login px-3 py-2"
          to="/login"
        >
          登入
        </NuxtLink> -->
        <div class="user-status">{{displayName ? `Hi, ${displayName}` : '未登入'}}</div>
        <img :src="imgUrl" />
      </div>
    </nav>
  </header>
</template>

<script setup>
import { ref } from 'vue'
import liff from "@line/liff";
import useStore from "~~/store";

const { data } = await useFetch('/api/whoami')
const userInfo = useState('userInfo')
const showEdit = ref(false)
const imgUrl = ref('')

const store = useStore();
const displayName = computed(() => store.getUserDisplayName);

onMounted(() => {
  store.fetchAndSetUser()
})
// onMounted(async () => {
//     try {
//       await liff.init({ liffId: "2005661804-zld9QenV" }); // Use own liffId
//       await liff.getProfile().then(profile => {
//         if (!liff.isLoggedIn()) {
//           return;
//         }
//         insertUser(profile)
//         // 拿取profile
//         // document.getElementById('userId').innerHTML = profile.userId
//         displayName.value = profile.displayName
//         imgUrl = profile.pictureUrl
//         // document.getElementById('statusMessage').innerHTML = profile.statusMessage
//       })
//   }  catch (err) {
//       console.log(`liff.state init error ${err}`);
//   }
// })

watch(
  data,
  (newData) => {
    userInfo.value = newData
  },
  {
    immediate: true
  }
)

const handleLogout = () => {
  $fetch('/api/session', {
    method: 'DELETE'
  }).then(() => {
    userInfo.value = null
    navigateTo('/')
  })
}

const toggleEdit = () => {
  showEdit.value = !showEdit.value;
}
</script>

<style lang="scss" scoped>
.login {
  display: block;
  position: absolute;
  right: 0;
  top: 0;
}
.user-img {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  overflow: hidden;
}
.index-nav {
  position: relative;
  display: flex;
  width: 100%;
  align-items: center;
}
.index-title {
  text-decoration: none;
  color: #000;
  font-size: 25px;
  font-weight: bold;
}
.user-info {
  position: absolute;
  right: 0;
  top: 0;
  width: auto;
}
.user-info-list {
  position: absolute;
  right: 0;
  top: 40px;
}
.logout-btn {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 70px;
  height: 30px;
  font-size: 14px;
  padding: 0;
}
.user-status {
  position: absolute;
  right: 0;
  top: 12px;
  font-size: 12px;

}
</style>
