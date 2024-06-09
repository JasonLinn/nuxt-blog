<template>
  <header class="flex w-full justify-center container">
    <nav class="index-nav flex w-full max-w-7xl items-center justify-between px-6 py-2">
      <div class="row">
        <NuxtLink
          :to="{
            name: 'index'
          }"
        >
          <div class="flex items-center justify-between">
            <h1 class="index-title">電子化票券</h1>
          </div>
        </NuxtLink>
        <div v-if="userInfo" class="user-info group relative">
          <div for="avatar" class="cursor-pointer" v-on:mouseenter="toggleEdit" v-on:mouseleave="toggleEdit">
            <img
              class="user-img inline-block h-10 w-10 rounded-full bg-white/90 object-cover object-center p-0.5 shadow-lg shadow-zinc-800/5 ring-1 ring-zinc-900/5 backdrop-blur hover:bg-opacity-30 focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-opacity-75"
              :src="userInfo.avatar"
              alt="使用者選單"
            />
            <div v-show="showEdit" class="user-info-list absolute right-0 hidden w-60 pt-1 text-gray-700 group-hover:block">
              <div
                class="mt-1 divide-y divide-gray-100 rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none"
              >
                <div class="flex items-center px-4 py-3">
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
                <div class="group/menu-item px-1 py-1">
                  <NuxtLink
                    class="flex w-full items-center rounded-md px-2 py-2 text-sm group-hover/menu-item:bg-emerald-500 group-hover/menu-item:text-white"
                    to="/articles/create"
                  >
                    <Icon
                      class="mr-2 h-5 w-5 text-emerald-400 group-hover/menu-item:text-white"
                      name="ri:pencil-line"
                    />
                    撰寫文章
                  </NuxtLink>
                </div>
                <div class="group/menu-item px-1 py-1">
                  <button
                    class="flex w-full items-center rounded-md px-2 py-2 text-sm group-hover/menu-item:bg-emerald-500 group-hover/menu-item:text-white"
                    @click="handleLogout"
                  >
                    <Icon
                      class="mr-2 h-5 w-5 text-emerald-400 group-hover/menu-item:text-white"
                      name="ri:logout-box-line"
                    />
                    登出
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
        <NuxtLink
          v-else
          class="px-3 py-2 text-gray-700 transition hover:text-emerald-500"
          to="/login"
        >
          登入
        </NuxtLink>
      </div>
    </nav>
  </header>
</template>

<style lang="scss" scoped>
header {
  // position: fixed;
  // display: flex;
  // justify-content: center;
  // width: 100%;
  // margin-bottom: 20px;
}
.user-img {
  width: 40px;
  height: 40px;
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
  font-size: 50px;
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
</style>

<script setup>
import { ref } from 'vue'

const { data } = await useFetch('/api/whoami')
const userInfo = useState('userInfo')
const showEdit = ref(false)

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
